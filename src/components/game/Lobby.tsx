import React from 'react';
import { RoomState, Player, CLIENT_EVENTS, GameSocket } from '@/types/game';
import { Users, Play } from 'lucide-react';

interface LobbyProps {
    roomState: RoomState;
    socket: GameSocket;
    playerId: string;
}

export const Lobby: React.FC<LobbyProps> = ({ roomState, socket, playerId }) => {
    const isHost = roomState.players.find(p => p.id === playerId)?.isHost;

    const handleStartGame = () => {
        socket.emit(CLIENT_EVENTS.START_GAME, { roomCode: roomState.roomCode });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white font-mono no-select">
            <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 md:p-8 border-4 border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <h1 className="text-xl font-bold mb-2 text-center text-zinc-500 uppercase tracking-[0.3em]">
                    Room Code
                </h1>
                <div className="text-5xl md:text-6xl font-black text-center mb-8 tracking-[0.1em] bg-black p-6 rounded-2xl border-2 border-zinc-800 text-yellow-400">
                    {roomState.roomCode}
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2 text-zinc-500 uppercase text-xs font-black tracking-widest">
                            <Users size={16} />
                            <span>Players</span>
                        </div>
                        <span className="bg-zinc-800 px-3 py-1 rounded-full text-[10px] font-black uppercase text-zinc-400 tracking-widest border border-zinc-700">
                            {roomState.players.length}/8
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {roomState.players.map((player) => (
                            <div
                                key={player.id}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${player.id === playerId
                                    ? 'border-yellow-400 bg-zinc-800 shadow-[0_0_15px_rgba(250,204,21,0.1)]'
                                    : 'border-zinc-800 bg-zinc-900/50'
                                    }`}
                            >
                                <div className="text-3xl">{player.avatar}</div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold truncate text-sm uppercase tracking-tight">{player.nickname}</span>
                                    {player.isHost && (
                                        <span className="text-[8px] bg-yellow-400 text-black px-1 rounded-sm font-black uppercase w-fit tracking-tighter mt-0.5">Host</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {isHost ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleStartGame}
                            disabled={roomState.players.length < 3}
                            className={`w-full h-[72px] rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-xl border-2 ${roomState.players.length >= 3
                                ? 'bg-yellow-400 text-black border-black shadow-[0_6px_0px_0px_#ca8a04] active:translate-y-1 active:shadow-[0_2px_0px_0px_#ca8a04]'
                                : 'bg-zinc-800 text-zinc-600 border-zinc-800 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <Play fill="currentColor" size={24} />
                            Start Game
                        </button>
                        {roomState.players.length < 3 && (
                            <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-[0.1em] animate-pulse">
                                Need at least 3 players to start
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="bg-zinc-950 p-6 rounded-2xl border-2 border-zinc-800 text-center flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-zinc-500 font-black uppercase text-sm italic tracking-widest animate-pulse">
                            Host is picking prompts...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
