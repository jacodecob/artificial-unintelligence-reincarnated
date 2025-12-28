import React from 'react';
import { RoomState } from '@/types/game';
import { Trophy, Home, RotateCcw, Medal } from 'lucide-react';

interface GameOverProps {
    roomState: RoomState;
    socket: any;
    playerId: string;
}

export const GameOver: React.FC<GameOverProps> = ({ roomState, socket, playerId }) => {
    const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);
    const isHost = roomState.players.find(p => p.id === playerId)?.isHost;

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-zinc-950 text-white font-mono no-select transition-all">
            <div className="w-full max-w-lg mt-8 flex flex-col items-center">

                <div className="relative mb-12 flex flex-col items-center">
                    <div className="bg-yellow-400 text-black p-6 rounded-3xl shadow-[0_0_50px_rgba(250,204,21,0.3)] border-4 border-black relative z-10 animate-bounce">
                        <Trophy size={48} />
                    </div>
                    <div className="mt-6 text-center">
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none mb-2">
                            Game Over
                        </h1>
                        <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px]">The Hall of Fame</p>
                    </div>
                </div>

                <div className="w-full space-y-3 mb-24">
                    {sortedPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-500 group ${index === 0
                                    ? 'bg-yellow-400 text-black border-yellow-300 scale-[1.05] shadow-2xl z-20'
                                    : 'bg-zinc-900 border-zinc-800'
                                }`}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="flex flex-col items-center w-8">
                                    {index === 0 ? (
                                        <Medal size={24} className="text-black/80" />
                                    ) : (
                                        <span className="text-xl font-black italic opacity-30 text-white">{index + 1}</span>
                                    )}
                                </div>
                                <div className="text-4xl filter group-hover:scale-110 transition-transform">{player.avatar}</div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`font-black uppercase tracking-tight truncate max-w-[140px] text-lg ${index === 0 ? 'text-black' : 'text-white'}`}>
                                        {player.nickname}
                                    </span>
                                    {player.id === playerId && (
                                        <span className={`text-[9px] font-black uppercase tracking-widest w-fit px-1.5 py-0.5 rounded ${index === 0 ? 'bg-black text-white' : 'bg-yellow-400 text-black'}`}>You</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className={`text-2xl font-black italic tracking-tighter ${index === 0 ? 'text-black' : 'text-white'}`}>
                                    {player.score.toLocaleString()}
                                </div>
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${index === 0 ? 'text-black/50' : 'text-zinc-600'}`}>Points</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-zinc-950/90 backdrop-blur-xl border-t-2 border-zinc-900 grid grid-cols-2 gap-4 pb-safe z-50">
                {isHost ? (
                    <button
                        onClick={() => window.location.reload()}
                        className="h-[68px] bg-yellow-400 text-black rounded-2xl font-black uppercase text-lg border-2 border-black shadow-[0_6px_0px_0px_#ca8a04] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} />
                        Restart
                    </button>
                ) : (
                    <div className="bg-zinc-900 rounded-2xl border-2 border-zinc-800 flex items-center justify-center text-zinc-500 text-[10px] font-black uppercase text-center px-4 leading-tight italic tracking-widest">
                        Waiting for host to restart...
                    </div>
                )}
                <button
                    onClick={() => window.location.href = '/'}
                    className="h-[68px] bg-zinc-800 text-white rounded-2xl font-black uppercase text-lg border-2 border-zinc-700 shadow-[0_6px_0px_0px_#18181b] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <Home size={20} />
                    Quit
                </button>
            </div>
        </div>
    );
};
