import { useState, useEffect, useRef } from 'react';
import Ably from 'ably';
import { RoomState, Player } from '@/types/game';

export function useSocket() {
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [playerId, setPlayerId] = useState<string>('');
    const [localTimer, setLocalTimer] = useState<number>(0);
    const ablyRef = useRef<Ably.Realtime | null>(null);

    useEffect(() => {
        let id = localStorage.getItem('player_id');
        if (!id) {
            id = Math.random().toString(36).substring(7);
            localStorage.setItem('player_id', id);
        }
        setPlayerId(id);

        const realtime = new Ably.Realtime({ authUrl: '/api/ably/auth' });
        ablyRef.current = realtime;

        realtime.connection.on('connected', () => {
            setIsConnected(true);
        });

        realtime.connection.on('disconnected', () => {
            setIsConnected(false);
        });

        return () => {
            realtime.close();
        };
    }, []);

    // Timer Synchronization Logic
    useEffect(() => {
        if (!roomState || roomState.timer <= 0) {
            setLocalTimer(0);
            return;
        }

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - roomState.updatedAt) / 1000);
            const remaining = Math.max(0, roomState.timer - elapsed);
            setLocalTimer(remaining);

            // If host and timer hits 0, trigger expiration on server
            const isHost = roomState.players.find(p => p.id === playerId)?.isHost;
            if (remaining === 0 && isHost) {
                sendAction('EXPIRE_TIMER');
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [roomState, playerId]);

    const joinRoom = async (roomCode: string, nickname: string, avatar: string) => {
        if (!ablyRef.current) return;

        const player: Player = {
            id: playerId,
            nickname,
            avatar,
            score: 0,
            isHost: false,
            isReady: false
        };

        const res = await fetch(`/api/rooms/${roomCode}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player })
        });

        if (res.ok) {
            const data = await res.json();
            subscribeToRoom(roomCode);
            setRoomState(data.room);
        } else {
            const err = await res.json();
            alert(err.error);
        }
    };

    const createRoom = async (nickname: string, avatar: string) => {
        const res = await fetch('/api/rooms', { method: 'POST' });
        const { roomCode } = await res.json();
        await joinRoom(roomCode, nickname, avatar);
    };

    const subscribeToRoom = (roomCode: string) => {
        if (!ablyRef.current) return;

        const channel = ablyRef.current.channels.get(`room:${roomCode}`);
        channel.subscribe('state-update', (message) => {
            setRoomState(message.data);
        });
    };

    const sendAction = async (action: string, payload: any = {}) => {
        if (!roomState) return;
        await fetch(`/api/rooms/${roomState.roomCode}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload })
        });
    };

    return {
        socket: {
            emit: (event: string, payload: any) => {
                if (event === 'CLIENT_JOIN_ROOM') {
                    if (payload.roomCode) joinRoom(payload.roomCode, payload.nickname, payload.avatar);
                    else createRoom(payload.nickname, payload.avatar);
                } else if (event === 'CLIENT_START_GAME') {
                    sendAction('START_GAME');
                } else if (event === 'CLIENT_SUBMIT_GENERATION') {
                    sendAction('SUBMIT_GENERATION', { ...payload, playerId });
                } else if (event === 'CLIENT_VOTE') {
                    sendAction('VOTE', payload);
                } else if (event === 'CLIENT_GENERATE_IMAGE') {
                    fetch(`/api/rooms/${roomState?.roomCode}/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...payload, playerId })
                    });
                }
            },
            on: (event: string, callback: Function) => {
                if (event === 'SERVER_IMAGE_GENERATED' && ablyRef.current && roomState) {
                    const channel = ablyRef.current.channels.get(`room:${roomState.roomCode}`);
                    channel.subscribe(`image-generated:${playerId}`, (msg) => callback(msg.data));
                }
            },
            off: () => { }
        },
        roomState: roomState ? { ...roomState, timer: localTimer } : null,
        isConnected,
        playerId
    };
}
