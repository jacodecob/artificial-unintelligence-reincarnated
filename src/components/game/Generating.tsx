import React, { useState, useEffect } from 'react';
import { RoomState, Battle, CLIENT_EVENTS, SERVER_EVENTS, GameSocket } from '@/types/game';
import { Sparkles, Send, RefreshCcw, Loader2, Timer as TimerIcon } from 'lucide-react';

interface GeneratingProps {
    roomState: RoomState;
    socket: GameSocket;
    playerId: string;
}

export const Generating: React.FC<GeneratingProps> = ({ roomState, socket, playerId }) => {
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const handleImageGenerated = ({ imageUrl }: { imageUrl: string }) => {
            setGeneratedImage(imageUrl);
            setIsGenerating(false);
        };

        socket.on(SERVER_EVENTS.IMAGE_GENERATED, handleImageGenerated);
        return () => {
            socket.off(SERVER_EVENTS.IMAGE_GENERATED, handleImageGenerated);
        };
    }, [socket]);

    // Find the battle(s) this player is involved in
    const myBattles = roomState.battles.filter(b => b.playerA === playerId || b.playerB === playerId);
    const currentBattle = myBattles.find(b => {
        if (b.playerA === playerId && !b.generationA) return true;
        if (b.playerB === playerId && !b.generationB) return true;
        return false;
    });

    const handleGenerate = () => {
        if (!userInput || !currentBattle) return;

        setIsGenerating(true);
        socket.emit(CLIENT_EVENTS.GENERATE_IMAGE, { prompt: userInput });
    };

    const handleSubmit = () => {
        if (!generatedImage || !currentBattle) return;

        socket.emit(CLIENT_EVENTS.SUBMIT_GENERATION, {
            roomCode: roomState.roomCode,
            promptId: currentBattle.prompt.id,
            imageUrl: generatedImage
        });

        setIsSubmitted(true);
    };

    if (isSubmitted || !currentBattle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white font-mono text-center no-select">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-3xl font-black text-yellow-500 mb-4 uppercase italic tracking-tighter">
                    Masterpiece Submitted
                </h2>
                <p className="text-sm font-bold text-zinc-600 tracking-widest uppercase">
                    Waiting for others to finish...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-zinc-950 text-white font-mono no-select">
            <div className="w-full max-w-lg mt-4 flex flex-col gap-4">
                {/* Header Stats */}
                <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-1">Current Task</span>
                        <span className="bg-zinc-900 px-4 py-1.5 rounded-full text-xs font-black uppercase text-zinc-300 border border-zinc-800 tracking-widest shadow-inner">
                            Prompt {roomState.battles.indexOf(currentBattle) + 1} of {roomState.battles.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 px-5 py-3 rounded-2xl border-2 border-zinc-800 shadow-xl">
                        <TimerIcon size={20} className={roomState.timer < 10 ? 'text-red-500 animate-pulse' : 'text-zinc-500'} />
                        <span className={`text-2xl font-black tabular-nums ${roomState.timer < 10 ? 'text-red-500' : 'text-white'}`}>
                            {roomState.timer}
                        </span>
                    </div>
                </div>

                <div className="w-full bg-zinc-900 rounded-3xl p-6 md:p-8 border-4 border-zinc-800 shadow-2xl overflow-hidden relative">
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 blur-3xl rounded-full"></div>

                    <h2 className="text-xl md:text-2xl font-black text-white mb-8 text-center uppercase tracking-tight leading-tight relative z-10">
                        "{currentBattle.prompt.text}"
                    </h2>

                    {!generatedImage ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-zinc-600 uppercase text-[10px] font-black mb-2 tracking-[0.2em] pl-1">Describe the vibe</label>
                                <textarea
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="e.g. A cyberpunk cat eating a slice of pizza in space..."
                                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-5 text-lg font-bold focus:border-yellow-400 outline-none transition-all h-40 resize-none shadow-inner text-white placeholder:text-zinc-700"
                                    disabled={isGenerating}
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!userInput || isGenerating}
                                className={`w-full h-[72px] rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-xl shadow-[0_6px_0px_0px_#7c3aed] active:translate-y-1 active:shadow-[0_2px_0px_0px_#7c3aed] border-2 ${userInput && !isGenerating
                                    ? 'bg-purple-600 text-white border-purple-400'
                                    : 'bg-zinc-800 text-zinc-600 border-zinc-900 opacity-50 shadow-none'
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        AI is drawing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles fill="currentColor" size={24} />
                                        Generate
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
                            <div className="aspect-square w-full bg-black rounded-2xl border-4 border-zinc-800 overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                <img src={generatedImage} alt="Generated Art" className="w-full h-full object-cover" />
                                {isGenerating && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-md">
                                        <Loader2 className="animate-spin text-yellow-500 mb-4" size={48} />
                                        <span className="text-yellow-500 font-black uppercase tracking-widest text-sm italic">Redrawing...</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setGeneratedImage(null);
                                        setRetryCount(prev => prev + 1);
                                    }}
                                    disabled={retryCount >= 1 || isGenerating}
                                    className={`h-[68px] rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-sm tracking-widest shadow-[0_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none transition-all border-2 ${retryCount < 1 && !isGenerating
                                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700 active:bg-zinc-700'
                                        : 'bg-zinc-950 text-zinc-800 border-zinc-950 shadow-none grayscale opacity-30 cursor-not-allowed'
                                        }`}
                                >
                                    <RefreshCcw size={18} />
                                    Retry {retryCount < 1 ? '(1)' : '(0)'}
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isGenerating}
                                    className="h-[68px] bg-yellow-400 text-black border-2 border-black rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-sm tracking-widest shadow-[0_6px_0px_0px_#ca8a04] active:translate-y-1 active:shadow-[0_2px_0px_0px_#ca8a04] transition-all"
                                >
                                    <Send size={18} />
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
