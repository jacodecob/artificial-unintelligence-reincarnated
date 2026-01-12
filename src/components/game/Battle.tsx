import React, { useState } from 'react';
import { RoomState, CLIENT_EVENTS, GameSocket } from '@/types/game';
import { Trophy, Timer, CheckCircle, Info } from 'lucide-react';

interface BattleProps {
    roomState: RoomState;
    socket: GameSocket;
    playerId: string;
}

export const Battle: React.FC<BattleProps> = ({ roomState, socket, playerId }) => {
    const currentBattle = roomState.battles[roomState.currentBattleIndex];
    const [hasVoted, setHasVoted] = useState(false);

    if (!currentBattle) return null;

    const isPlayerInBattle = currentBattle.playerA === playerId || currentBattle.playerB === playerId;

    const handleVote = (choice: 'A' | 'B') => {
        if (hasVoted || isPlayerInBattle) return;

        socket.emit(CLIENT_EVENTS.VOTE, {
            roomCode: roomState.roomCode,
            battleIndex: roomState.currentBattleIndex,
            choice,
            voterId: playerId
        });
        setHasVoted(true);
    };

    return (
        <div className="flex flex-col items-center min-h-screen px-6 py-8 bg-zinc-950 text-white font-mono no-select">
            <div className="w-full max-w-5xl">

                {/* Battle Status Header */}
                <div className="flex justify-between items-center bg-zinc-900/80 p-6 rounded-[2rem] border-4 border-zinc-800 backdrop-blur-md mb-10 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-400 rounded-xl text-black shadow-lg">
                            <Trophy size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] leading-none mb-1">
                                Round {roomState.currentRound || 1}/{roomState.totalRounds || 3} • Battle
                            </span>
                            <span className="text-xl font-black text-white italic tracking-tighter">{roomState.currentBattleIndex + 1} <span className="text-zinc-700 not-italic mx-1">/</span> {roomState.battles.length}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-black px-6 py-3 rounded-2xl border-2 border-zinc-800 shadow-inner">
                        <Timer size={24} className={roomState.timer < 5 ? 'text-red-500 animate-pulse' : 'text-zinc-500'} />
                        <span className={`text-3xl font-black tabular-nums ${roomState.timer < 5 ? 'text-red-500' : 'text-white'}`}>{roomState.timer}</span>
                    </div>
                </div>

                <div className="text-center mb-10 px-4">
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none italic">
                        "{currentBattle.prompt.text}"
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 items-center">
                    {/* Option A */}
                    <div className="relative group">
                        <div
                            className={`relative aspect-square w-full rounded-[2.5rem] border-4 overflow-hidden transition-all duration-500 active:scale-[0.98] cursor-pointer ${hasVoted === true ? 'border-zinc-800 opacity-40 grayscale pointer-events-none' : 'border-zinc-800 shadow-3xl ring-offset-8 ring-offset-zinc-950 hover:ring-4 hover:ring-yellow-400 hover:border-yellow-400 hover:scale-[1.02]'
                                }`}
                            onClick={() => handleVote('A')}
                        >
                            <img
                                src={currentBattle.generationA?.imageUrl}
                                className="w-full h-full object-cover"
                                alt="Entry A"
                            />
                            {!hasVoted && !isPlayerInBattle && (
                                <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <div className="bg-yellow-400 text-black px-10 py-5 rounded-2xl font-black text-2xl shadow-[0_15px_30px_rgba(250,204,21,0.5)] uppercase italic transform transition-all group-hover:scale-110 group-active:scale-95 border-2 border-black">
                                        VOTE A
                                    </div>
                                </div>
                            )}
                        </div>
                        {isPlayerInBattle && currentBattle.playerA === playerId && (
                            <div className="absolute -top-4 -left-4 bg-yellow-400 text-black px-4 py-2 rounded-lg font-black uppercase text-xs tracking-widest shadow-2xl border-2 border-black z-10 animate-pulse">Your Creation</div>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 md:hidden">
                        <span className="text-zinc-800 font-black italic text-4xl uppercase tracking-tighter opacity-50">VS</span>
                    </div>

                    {/* Option B */}
                    <div className="relative group">
                        <div
                            className={`relative aspect-square w-full rounded-[2.5rem] border-4 overflow-hidden transition-all duration-500 active:scale-[0.98] cursor-pointer ${hasVoted === true ? 'border-zinc-800 opacity-40 grayscale pointer-events-none' : 'border-zinc-800 shadow-3xl ring-offset-8 ring-offset-zinc-950 hover:ring-4 hover:ring-yellow-400 hover:border-yellow-400 hover:scale-[1.02]'
                                }`}
                            onClick={() => handleVote('B')}
                        >
                            <img
                                src={currentBattle.generationB?.imageUrl}
                                className="w-full h-full object-cover"
                                alt="Entry B"
                            />
                            {!hasVoted && !isPlayerInBattle && (
                                <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <div className="bg-yellow-400 text-black px-10 py-5 rounded-2xl font-black text-2xl shadow-[0_15px_30px_rgba(250,204,21,0.5)] uppercase italic transform transition-all group-hover:scale-110 group-active:scale-95 border-2 border-black">
                                        VOTE B
                                    </div>
                                </div>
                            )}
                        </div>
                        {isPlayerInBattle && currentBattle.playerB === playerId && (
                            <div className="absolute -top-4 -right-4 bg-yellow-400 text-black px-4 py-2 rounded-lg font-black uppercase text-xs tracking-widest shadow-2xl border-2 border-black z-10 animate-pulse">Your Creation</div>
                        )}
                    </div>
                </div>


                {/* Voting Status Labels */}
                {hasVoted && (
                    <div className="fixed bottom-10 left-0 right-0 p-4 animate-in slide-in-from-bottom-10 fade-in duration-500 z-50">
                        <div className="max-w-xs mx-auto bg-green-500 text-white p-4 rounded-2xl border-2 border-green-400 font-black uppercase italic shadow-2xl flex items-center justify-center gap-3">
                            <CheckCircle fill="currentColor" className="text-green-900" />
                            <span>Vote Confirmed!</span>
                        </div>
                    </div>
                )}

                {isPlayerInBattle && !hasVoted && (
                    <div className="bg-zinc-900 p-6 rounded-2xl border-2 border-zinc-800 flex items-center gap-4 text-zinc-500 mt-8 mb-8">
                        <Info className="text-yellow-400 flex-shrink-0" />
                        <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">
                            You're in the spotlight! Sit back and let others judge your masterpiece.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
