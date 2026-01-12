import { useState, useEffect, useRef } from 'react';
import Ably from 'ably';
import { RoomState, Player } from '@/types/game';
import { nanoid } from 'nanoid';

export function useSocket() {
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [playerId, setPlayerId] = useState<string>('');
    const [localTimer, setLocalTimer] = useState<number>(0);
    const ablyRef = useRef<Ably.Realtime | null>(null);

    // 1. Initialize Player ID
    useEffect(() => {
        let id = sessionStorage.getItem('player_id');
        if (!id) {
            id = nanoid(8);
            sessionStorage.setItem('player_id', id);
        }
        setPlayerId(id);
    }, []);

    // 2. Conflict Detection (Fix for duplicate tabs)
    useEffect(() => {
        if (!playerId) return;

        const bc = new BroadcastChannel('player_identity_check');

        bc.onmessage = (event) => {
            if (event.data.type === 'WHO_HAS' && event.data.id === playerId) {
                // Another tab is asking about my ID. I have it first/already.
                bc.postMessage({ type: 'I_DO', id: playerId });
            }
            else if (event.data.type === 'I_DO' && event.data.id === playerId) {
                // Another tab claimed my ID. I am the duplicate/interloper.
                console.log('Duplicate tab detected. Generating new Player ID.');
                const newId = nanoid(8);
                sessionStorage.setItem('player_id', newId);
                setPlayerId(newId);
                setRoomState(null); // Reset game state
            }
        };

        // Check if anyone else has this ID
        bc.postMessage({ type: 'WHO_HAS', id: playerId });

        return () => bc.close();
    }, [playerId]);

    // 3. Ably Connection Management
    useEffect(() => {
        if (!playerId) return;

        const realtime = new Ably.Realtime({
            authUrl: `/api/ably/auth?clientId=${playerId}`,
            clientId: playerId
        });
        ablyRef.current = realtime;

        realtime.connection.on('connected', () => {
            setIsConnected(true);
        });

        realtime.connection.on('disconnected', () => {
            setIsConnected(false);
        });

        return () => {
            realtime.close();
            setIsConnected(false);
        };
    }, [playerId]);

    // Track when we receive state updates locally (for timer sync)
    const stateReceivedAtRef = useRef<number>(Date.now());
    const lastServerTimerRef = useRef<number>(0);
    const lastServerStateRef = useRef<string>('');

    // Update local receive time when roomState changes
    useEffect(() => {
        if (!roomState) return;

        const timerChanged = roomState.timer !== lastServerTimerRef.current;
        const stateChanged = roomState.state !== lastServerStateRef.current;

        if (timerChanged || stateChanged) {
            // Use server's updatedAt for the base time if it's recent (within 10s to avoid old data issues)
            const now = Date.now();
            const serverUpdated = roomState.updatedAt || now;

            // If the server says it updated at T, and it's now T_client, 
            // the state has been active for (T_client - T_server) on our clock.
            // But stateReceivedAtRef should be the moment the timer *started* relative to our clock.
            // So if T_server was 2s ago, stateReceivedAtRef should be Now - 2s.

            // However, clock skew can be dangerous. Let's stick to local arrival time but ensure it resets on ANY state change.
            stateReceivedAtRef.current = now;
            lastServerTimerRef.current = roomState.timer;
            lastServerStateRef.current = roomState.state;
        }
    }, [roomState?.timer, roomState?.state]);

    // Timer Synchronization Logic
    useEffect(() => {
        if (!roomState || roomState.timer <= 0) {
            setLocalTimer(0);
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - stateReceivedAtRef.current) / 1000);
            const remaining = Math.max(0, roomState.timer - elapsed);
            setLocalTimer(remaining);

            // If host and timer hits 0, trigger expiration on server
            const isHost = roomState.players.find(p => p.id === playerId)?.isHost;
            if (remaining === 0 && isHost && roomState.timer > 0) {
                // Safeguard: only expire if we haven't already moved to a 0-timer state
                // and pass the state we are expiring to prevent double-expiration of next state
                sendAction('EXPIRE_TIMER', { state: roomState.state });
            }
        };



        const interval = setInterval(updateTimer, 500); // 500ms for smoother updates
        updateTimer();
        return () => clearInterval(interval);
    }, [roomState?.state, roomState?.timer, playerId]);


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

    const resetPlayerId = () => {
        const newId = nanoid(8);
        sessionStorage.setItem('player_id', newId);
        setPlayerId(newId);
    };

    // Track local listeners for events that are handled via HTTP response instead of Ably (e.g. Image Gen)
    const imageGeneratedCallbackRef = useRef<Function | null>(null);

    return {
        socket: {
            emit: async (event: string, payload: any) => {
                if (event === 'CLIENT_JOIN_ROOM') {
                    if (payload.roomCode) joinRoom(payload.roomCode, payload.nickname, payload.avatar);
                    else createRoom(payload.nickname, payload.avatar);
                } else if (event === 'CLIENT_START_GAME') {
                    sendAction('START_GAME');
                } else if (event === 'CLIENT_SUBMIT_GENERATION') {
                    sendAction('SUBMIT_GENERATION', { ...payload, playerId });
                } else if (event === 'CLIENT_VOTE') {
                    sendAction('VOTE', payload);
                } else if (event === 'CLIENT_SKIP_TIMER') {
                    sendAction('SKIP_TIMER');
                } else if (event === 'CLIENT_GENERATE_IMAGE') {
                    // Generate via HTTP and return result directly to avoid Ably message size limits
                    try {
                        const res = await fetch(`/api/rooms/${roomState?.roomCode}/generate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...payload, playerId })
                        });
                        const data = await res.json();

                        if (data.success && data.imageUrls && imageGeneratedCallbackRef.current) {
                            // Manually trigger the listener
                            imageGeneratedCallbackRef.current({ imageUrls: data.imageUrls });
                        }
                    } catch (e) {
                        console.error("Generation failed:", e);
                    }
                }
            },
            on: (event: string, callback: Function) => {
                if (event === 'SERVER_IMAGE_GENERATED') {
                    // Register local callback for when the HTTP request finishes
                    imageGeneratedCallbackRef.current = callback;
                } else if (ablyRef.current && roomState) {
                    // Keep standard subscription logic for other events if needed,
                    // though currently we only see state-update which is global.
                    // The original code had specific subscription for image-generated here.
                    // We can leave this empty or restore generic handling if there were other events.
                    // Original code:
                    // if (event === 'SERVER_IMAGE_GENERATED' && ablyRef.current && roomState) { ... }
                }
            },
            off: (event: string) => {
                if (event === 'SERVER_IMAGE_GENERATED') {
                    imageGeneratedCallbackRef.current = null;
                }
            }
        },
        roomState: roomState ? { ...roomState, timer: localTimer } : null,
        isConnected,
        playerId,
        resetPlayerId
    };
}
