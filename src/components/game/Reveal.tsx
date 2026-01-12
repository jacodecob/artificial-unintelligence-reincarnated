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
        <div className="flex flex-col items-center min-h-screen px-6 py-8 bg-zinc-950 text-white font-mono no-select">
            <div className="w-full max-w-6xl mb-24">

                <h2 className="text-3xl md:text-5xl font-black text-center mb-12 uppercase text-zinc-600 tracking-[0.4em] italic leading-tight">
                    The Verdict
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                    {/* Result Card A */}
                    <div className={`relative rounded-[3rem] overflow-hidden border-8 transition-all duration-1000 ${winner === 'A' ? 'border-yellow-400 scale-[1.05] shadow-[0_40px_100px_rgba(250,204,21,0.3)] z-10' : 'border-zinc-900 opacity-30 grayscale blur-[1px]'}`}>
                        <div className="aspect-square relative">
                            <img src={currentBattle.generationA?.imageUrl} className="w-full h-full object-cover" alt="Image A" />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>

                            {winner === 'A' && (
                                <div className="absolute top-8 right-8 animate-bounce">
                                    <div className="bg-yellow-400 text-black p-6 rounded-3xl shadow-3xl border-4 border-black">
                                        <Trophy size={48} fill="currentColor" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-zinc-900 border-t-4 border-zinc-800">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl">{playerAAvatar}</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Created By</span>
                                        <span className="font-black text-3xl uppercase tracking-tighter truncate max-w-[200px]">{playerAName}</span>
                                    </div>
                                </div>
                                <span className="text-6xl font-black text-yellow-400 tracking-tighter">{percentA}%</span>
                            </div>
                            {/* Result Bar */}
                            <div className="w-full h-6 bg-black rounded-full overflow-hidden border-2 border-zinc-800">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out ${winner === 'A' ? 'bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'bg-zinc-700'}`}
                                    style={{ width: `${percentA}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex lg:hidden items-center justify-center -my-4 relative z-20">
                        <div className="bg-zinc-950 p-4 rounded-full border-4 border-zinc-900 shadow-2xl">
                            <div className="bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center font-black italic text-zinc-700 text-3xl border-2 border-zinc-800">VS</div>
                        </div>
                    </div>

                    {/* Result Card B */}
                    <div className={`relative rounded-[3rem] overflow-hidden border-8 transition-all duration-1000 ${winner === 'B' ? 'border-yellow-400 scale-[1.05] shadow-[0_40px_100px_rgba(250,204,21,0.3)] z-10' : 'border-zinc-900 opacity-30 grayscale blur-[1px]'}`}>
                        <div className="aspect-square relative">
                            <img src={currentBattle.generationB?.imageUrl} className="w-full h-full object-cover" alt="Image B" />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>

                            {winner === 'B' && (
                                <div className="absolute top-8 right-8 animate-bounce">
                                    <div className="bg-yellow-400 text-black p-6 rounded-3xl shadow-3xl border-4 border-black">
                                        <Trophy size={48} fill="currentColor" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-zinc-900 border-t-4 border-zinc-800">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl">{playerBAvatar}</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Created By</span>
                                        <span className="font-black text-3xl uppercase tracking-tighter truncate max-w-[200px]">{playerBName}</span>
                                    </div>
                                </div>
                                <span className="text-6xl font-black text-yellow-400 tracking-tighter">{percentB}%</span>
                            </div>
                            {/* Result Bar */}
                            <div className="w-full h-6 bg-black rounded-full overflow-hidden border-2 border-zinc-800">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out ${winner === 'B' ? 'bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'bg-zinc-700'}`}
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
