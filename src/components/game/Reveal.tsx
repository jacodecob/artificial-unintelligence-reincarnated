import React from 'react';
import { RoomState } from '@/types/game';
import { Trophy, Star, ChevronRight, Timer } from 'lucide-react';

interface RevealProps {
    roomState: RoomState;
    playerId: string;
}

export const Reveal: React.FC<RevealProps> = ({ roomState, playerId }) => {
    const currentBattle = roomState.battles[roomState.currentBattleIndex];
    if (!currentBattle) return null;

    const totalVotes = currentBattle.votesA + currentBattle.votesB;
    const percentA = totalVotes === 0 ? 50 : Math.round((currentBattle.votesA / totalVotes) * 100);
    const percentB = 100 - percentA;

    const winner = currentBattle.votesA >= currentBattle.votesB ? 'A' : 'B';
    const playerAName = roomState.players.find(p => p.id === currentBattle.playerA)?.nickname || 'Unknown';
    const playerBName = roomState.players.find(p => p.id === currentBattle.playerB)?.nickname || 'Unknown';
    const playerAAvatar = roomState.players.find(p => p.id === currentBattle.playerA)?.avatar || '❓';
    const playerBAvatar = roomState.players.find(p => p.id === currentBattle.playerB)?.avatar || '❓';

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-zinc-950 text-white font-mono no-select">
            <div className="w-full max-w-lg mt-2 mb-20">
                <h2 className="text-xl font-black text-center mb-8 uppercase text-zinc-600 tracking-[0.3em] italic">
                    The Verdict
                </h2>

                <div className="flex flex-col gap-10">
                    {/* Result Card A */}
                    <div className={`relative rounded-3xl overflow-hidden border-4 transition-all duration-700 ${winner === 'A' ? 'border-yellow-400 scale-[1.02] shadow-[0_20px_60px_rgba(250,204,21,0.2)]' : 'border-zinc-800 opacity-40 scale-[0.98]'}`}>
                        <div className="aspect-video relative">
                            <img src={currentBattle.generationA?.imageUrl} className="w-full h-full object-cover" alt="Image A" />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>

                            {winner === 'A' && (
                                <div className="absolute top-4 right-4 animate-bounce">
                                    <div className="bg-yellow-400 text-black p-3 rounded-full shadow-2xl border-2 border-black">
                                        <Trophy size={24} fill="currentColor" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-zinc-900 border-t-2 border-zinc-800">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{playerAAvatar}</span>
                                    <span className="font-black text-lg uppercase tracking-tight truncate max-w-[150px]">{playerAName}</span>
                                </div>
                                <span className="text-3xl font-black text-yellow-400">{percentA}%</span>
                            </div>
                            {/* Result Bar */}
                            <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-700">
                                <div
                                    className={`h-full transition-all duration-1000 ${winner === 'A' ? 'bg-yellow-400' : 'bg-zinc-600'}`}
                                    style={{ width: `${percentA}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center -my-4 relative z-10">
                        <div className="bg-zinc-950 p-2 rounded-full border-2 border-zinc-800">
                            <div className="bg-zinc-900 w-12 h-12 rounded-full flex items-center justify-center font-black italic text-zinc-700 text-xl border border-zinc-700">VS</div>
                        </div>
                    </div>

                    {/* Result Card B */}
                    <div className={`relative rounded-3xl overflow-hidden border-4 transition-all duration-700 ${winner === 'B' ? 'border-yellow-400 scale-[1.02] shadow-[0_20px_60px_rgba(250,204,21,0.2)]' : 'border-zinc-800 opacity-40 scale-[0.98]'}`}>
                        <div className="aspect-video relative">
                            <img src={currentBattle.generationB?.imageUrl} className="w-full h-full object-cover" alt="Image B" />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>

                            {winner === 'B' && (
                                <div className="absolute top-4 right-4 animate-bounce">
                                    <div className="bg-yellow-400 text-black p-3 rounded-full shadow-2xl border-2 border-black">
                                        <Trophy size={24} fill="currentColor" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-zinc-900 border-t-2 border-zinc-800">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{playerBAvatar}</span>
                                    <span className="font-black text-lg uppercase tracking-tight truncate max-w-[150px]">{playerBName}</span>
                                </div>
                                <span className="text-3xl font-black text-yellow-500">{percentB}%</span>
                            </div>
                            {/* Result Bar */}
                            <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-700">
                                <div
                                    className={`h-full transition-all duration-1000 ${winner === 'B' ? 'bg-yellow-400' : 'bg-zinc-600'}`}
                                    style={{ width: `${percentB}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Persistent Timer Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-zinc-950/80 backdrop-blur-xl border-t-2 border-zinc-900 flex justify-center items-center gap-6 z-50 pb-safe">
                <div className="flex items-center gap-2 text-zinc-500 font-black uppercase text-xs tracking-widest">
                    <Timer size={16} />
                    Next Up
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-3xl font-black text-yellow-400 tabular-nums">
                        {roomState.timer}s
                    </div>
                    <ChevronRight className="text-zinc-700" />
                </div>
            </div>
        </div>
    );
};
