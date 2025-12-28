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
            choice
        });
        setHasVoted(true);
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-zinc-950 text-white font-mono no-select">
            <div className="w-full max-w-lg mt-2">
                {/* Battle Status Header */}
                <div className="flex justify-between items-center bg-zinc-900/80 p-5 rounded-3xl border-2 border-zinc-800 backdrop-blur-md mb-6 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-400 rounded-lg text-black">
                            <Trophy size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Battle</span>
                            <span className="text-sm font-black text-white italic">{roomState.currentBattleIndex + 1} of {roomState.battles.length}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black px-4 py-2 rounded-xl border border-zinc-800">
                        <Timer size={18} className={roomState.timer < 5 ? 'text-red-500 animate-pulse' : 'text-zinc-500'} />
                        <span className={`text-xl font-black tabular-nums ${roomState.timer < 5 ? 'text-red-500' : 'text-white'}`}>{roomState.timer}</span>
                    </div>
                </div>

                <div className="text-center mb-8 px-2">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                        "{currentBattle.prompt.text}"
                    </h2>
                </div>

                <div className="flex flex-col gap-6 mb-12">
                    {/* Option A */}
                    <div className="relative group">
                        <div
                            className={`relative aspect-square w-full rounded-2xl border-4 overflow-hidden transition-all duration-300 active:scale-[0.98] ${hasVoted === true ? 'border-zinc-800 opacity-40' : 'border-zinc-800 shadow-2xl ring-offset-4 ring-offset-zinc-950 hover:ring-2 hover:ring-yellow-400'
                                }`}
                            onClick={() => handleVote('A')}
                        >
                            <img
                                src={currentBattle.generationA?.imageUrl}
                                className="w-full h-full object-cover"
                                alt="Entry A"
                            />
                            {!hasVoted && !isPlayerInBattle && (
                                <div className="absolute inset-0 bg-black/10 active:bg-black/30 flex items-center justify-center">
                                    <div className="bg-yellow-400 text-black px-8 py-3 rounded-full font-black text-xl shadow-[0_10px_20px_rgba(250,204,21,0.4)] uppercase italic transform transition-transform group-active:scale-90">
                                        VOTE A
                                    </div>
                                </div>
                            )}
                        </div>
                        {isPlayerInBattle && currentBattle.playerA === playerId && (
                            <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-sm font-black uppercase text-[10px] tracking-widest shadow-xl">Yours</div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[2px] w-full bg-zinc-800"></div>
                        <span className="text-zinc-700 font-black italic text-2xl uppercase tracking-tighter">VS</span>
                        <div className="h-[2px] w-full bg-zinc-800"></div>
                    </div>

                    {/* Option B */}
                    <div className="relative group">
                        <div
                            className={`relative aspect-square w-full rounded-2xl border-4 overflow-hidden transition-all duration-300 active:scale-[0.98] ${hasVoted === true ? 'border-zinc-800 opacity-40' : 'border-zinc-800 shadow-2xl ring-offset-4 ring-offset-zinc-950 hover:ring-2 hover:ring-yellow-400'
                                }`}
                            onClick={() => handleVote('B')}
                        >
                            <img
                                src={currentBattle.generationB?.imageUrl}
                                className="w-full h-full object-cover"
                                alt="Entry B"
                            />
                            {!hasVoted && !isPlayerInBattle && (
                                <div className="absolute inset-0 bg-black/10 active:bg-black/30 flex items-center justify-center">
                                    <div className="bg-yellow-400 text-black px-8 py-3 rounded-full font-black text-xl shadow-[0_10px_20px_rgba(250,204,21,0.4)] uppercase italic transform transition-transform group-active:scale-90">
                                        VOTE B
                                    </div>
                                </div>
                            )}
                        </div>
                        {isPlayerInBattle && currentBattle.playerB === playerId && (
                            <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-sm font-black uppercase text-[10px] tracking-widest shadow-xl">Yours</div>
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
