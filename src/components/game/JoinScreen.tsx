import React, { useState } from 'react';
import { CLIENT_EVENTS, GameSocket } from '@/types/game';
import { Plus, Users, ArrowRight } from 'lucide-react';

interface JoinScreenProps {
    socket: GameSocket | null;
}

const AVATARS = ['🤡', '🤖', '👻', '🐙', '🦖', '🦄', '🧟', '🍕'];

export const JoinScreen: React.FC<JoinScreenProps> = ({ socket }) => {
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    const [isJoining, setIsJoining] = useState(false);

    const handleAction = (type: 'JOIN' | 'CREATE') => {
        if (!socket || !nickname) return;

        socket.emit(CLIENT_EVENTS.JOIN_ROOM, {
            roomCode: type === 'JOIN' ? roomCode.toUpperCase() : '',
            nickname,
            avatar
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white font-mono no-select">
            <div className="w-full max-w-md bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 border-4 border-zinc-800 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-400/10 blur-[80px] rounded-full"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full"></div>

                <h1 className="text-4xl md:text-5xl font-black mb-10 text-center text-yellow-400 uppercase italic tracking-tighter leading-none drop-shadow-2xl relative">
                    Artificial<br />Unintelligence
                </h1>

                <div className="space-y-8 relative">
                    {/* Nickname Section */}
                    <div className="space-y-2">
                        <label className="block text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] pl-1">Your Identity</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="NAME STYLES..."
                            maxLength={12}
                            className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-5 text-xl font-bold focus:border-yellow-400 outline-none transition-all placeholder:text-zinc-800 h-[64px] shadow-inner"
                            required
                        />
                    </div>

                    {/* Avatar Selection */}
                    <div className="space-y-4">
                        <label className="block text-zinc-500 uppercase text-[10px] font-black text-center tracking-[0.2em]">Choose Your Bot</label>
                        <div className="grid grid-cols-4 gap-3 bg-black/40 p-3 rounded-[2rem] border-2 border-zinc-800/50 shadow-inner">
                            {AVATARS.map((a) => (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setAvatar(a)}
                                    className={`text-3xl h-[64px] rounded-2xl border-2 transition-all active:scale-90 flex items-center justify-center ${avatar === a
                                        ? 'border-yellow-400 bg-zinc-800 shadow-lg scale-110 z-10'
                                        : 'border-transparent bg-transparent opacity-40 hover:opacity-100'
                                        }`}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[2px] w-full bg-zinc-800/50 my-2"></div>

                    {/* Action Section */}
                    <div className="space-y-4">
                        {!isJoining ? (
                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => setIsJoining(true)}
                                    className="w-full bg-zinc-800 text-white h-[72px] rounded-2xl font-black uppercase text-lg border-2 border-zinc-700 shadow-[0_6px_0px_0px_#18181b] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 group"
                                >
                                    <Users size={22} className="group-hover:scale-110 transition-transform" />
                                    Join A Room
                                </button>

                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-[1px] flex-1 bg-zinc-800"></div>
                                    <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest italic">or</span>
                                    <div className="h-[1px] flex-1 bg-zinc-800"></div>
                                </div>

                                <button
                                    onClick={() => handleAction('CREATE')}
                                    disabled={!nickname}
                                    className={`w-full h-[72px] rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-xl border-2 ${nickname
                                        ? 'bg-yellow-400 text-black border-black shadow-[0_8px_0px_0px_#ca8a04] active:translate-y-1 active:shadow-[0_4px_0px_0px_#ca8a04]'
                                        : 'bg-zinc-800 text-zinc-600 border-zinc-800 opacity-50 grayscale cursor-not-allowed'
                                        }`}
                                >
                                    <Plus size={24} strokeWidth={3} />
                                    Host New Game
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="space-y-2">
                                    <label className="block text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] pl-1 text-center">Enter 4-Letter Code</label>
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="CODE"
                                        maxLength={4}
                                        autoFocus
                                        className="w-full bg-black border-4 border-yellow-400 rounded-2xl p-4 text-4xl text-center font-black tracking-[0.2em] focus:ring-4 ring-yellow-400/20 outline-none transition-all h-[80px]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setIsJoining(false)}
                                        className="h-[64px] bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase text-sm border-2 border-zinc-700 active:translate-y-1 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleAction('JOIN')}
                                        disabled={roomCode.length !== 4 || !nickname}
                                        className={`h-[64px] rounded-2xl flex items-center justify-center gap-2 font-black uppercase border-2 transition-all ${roomCode.length === 4 && nickname
                                            ? 'bg-yellow-400 text-black border-black shadow-[0_6px_0px_0px_#ca8a04] active:translate-y-1 active:shadow-[0_2px_0px_0px_#ca8a04]'
                                            : 'bg-zinc-800 text-zinc-600 border-zinc-700 opacity-50 grayscale shadow-none'
                                            }`}
                                    >
                                        Join
                                        <ArrowRight size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </div>
    );
};
