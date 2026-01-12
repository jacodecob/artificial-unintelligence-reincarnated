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
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleImageGenerated = ({ imageUrls }: { imageUrls: string[] }) => {
            setGeneratedImages(imageUrls);
            setIsGenerating(false);
            setRetryCount(0); // Reset retry for new prompt
            setSelectedImageIndex(0); // Default to first one
        };

        socket.on(SERVER_EVENTS.IMAGE_GENERATED, handleImageGenerated);
        return () => {
            socket.off(SERVER_EVENTS.IMAGE_GENERATED, handleImageGenerated);
        };
    }, [socket]);

    // Find the battle(s) this player is involved in
    const myBattles = roomState.battles.filter(b => b.playerA === playerId || b.playerB === playerId);
    const remainingBattles = myBattles.filter(b => {
        if (b.playerA === playerId && !b.generationA) return true;
        if (b.playerB === playerId && !b.generationB) return true;
        return false;
    });

    const currentBattle = remainingBattles[0];

    // Reset local state when moving to next battle
    useEffect(() => {
        if (currentBattle) {
            setUserInput('');
            setGeneratedImages([]);
            setSelectedImageIndex(null);
            setIsSubmitting(false);
        }
    }, [currentBattle?.prompt.id]);

    const handleGenerate = () => {
        if (!userInput || !currentBattle) return;

        setIsGenerating(true);
        setGeneratedImages([]);
        setSelectedImageIndex(null);
        socket.emit(CLIENT_EVENTS.GENERATE_IMAGE, { prompt: userInput });
    };

    const handleSubmit = () => {
        if (selectedImageIndex === null || generatedImages.length === 0 || !currentBattle) return;

        socket.emit(CLIENT_EVENTS.SUBMIT_GENERATION, {
            roomCode: roomState.roomCode,
            promptId: currentBattle.prompt.id,
            imageUrl: generatedImages[selectedImageIndex]
        });

        setIsSubmitting(true);
    };

    if (!currentBattle || (isSubmitting && remainingBattles.length === 1)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white font-mono text-center no-select">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-3xl font-black text-yellow-500 mb-4 uppercase italic tracking-tighter">
                    {remainingBattles.length === 0 ? "All Masterpieces Submitted" : "Submitting..."}
                </h2>
                <p className="text-sm font-bold text-zinc-600 tracking-widest uppercase">
                    {remainingBattles.length === 0 ? "Waiting for others to finish..." : "Hang tight!"}
                </p>
            </div>
        );
    }

    const totalPrompts = myBattles.length;
    const completedPrompts = totalPrompts - remainingBattles.length;

    return (
        <div className="flex flex-col items-center min-h-screen px-6 py-8 bg-zinc-950 text-white font-mono no-select overflow-x-hidden">
            <div className="w-full max-w-3xl flex flex-col gap-6">
                {/* Header Stats */}
                <div className="flex justify-between items-center px-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-1">
                            Round {roomState.currentRound || 1}/{roomState.totalRounds || 3}
                        </span>
                        <span className="bg-zinc-900 px-4 py-1.5 rounded-full text-xs font-black uppercase text-zinc-300 border-2 border-zinc-800 tracking-widest shadow-inner">
                            Prompt {completedPrompts + 1} of {totalPrompts}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 bg-black/60 px-6 py-4 rounded-[1.5rem] border-2 border-zinc-800 shadow-2xl">
                        <TimerIcon size={24} className={roomState.timer < 10 ? 'text-red-500 animate-pulse' : 'text-zinc-500'} />
                        <span className={`text-3xl font-black tabular-nums tracking-tighter ${roomState.timer < 10 ? 'text-red-500' : 'text-white'}`}>
                            {roomState.timer}
                        </span>
                    </div>
                </div>

                <div className="w-full bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 md:p-12 border-4 border-zinc-800 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-10 text-center uppercase tracking-tight leading-tight relative z-10 italic">
                        "{currentBattle.prompt.text}"
                    </h2>

                    {generatedImages.length === 0 ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-zinc-600 uppercase text-[10px] font-black mb-2 tracking-[0.2em] pl-1">Describe the realization</label>
                                <textarea
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="e.g. A cyberpunk cat eating a slice of pizza in space..."
                                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-5 text-lg font-bold focus:border-yellow-400 outline-none transition-all h-40 resize-none shadow-inner text-white placeholder:text-zinc-700"
                                    disabled={isGenerating || isSubmitting}
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!userInput || isGenerating || isSubmitting}
                                className={`w-full h-[72px] rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-xl shadow-[0_6px_0px_0px_#7c3aed] active:translate-y-1 active:shadow-[0_2px_0px_0px_#7c3aed] border-2 ${userInput && !isGenerating && !isSubmitting
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
                            <div className="flex flex-col gap-4">
                                <label className="block text-zinc-600 uppercase text-[10px] font-black mb-1 tracking-[0.2em] pl-1 text-center">Pick your favorite version</label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {generatedImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImageIndex(idx)}
                                            disabled={isSubmitting}
                                            className={`relative aspect-square rounded-2xl border-4 overflow-hidden transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg ${selectedImageIndex === idx
                                                ? 'border-yellow-400 ring-8 ring-yellow-400/20 shadow-2xl z-10 scale-105'
                                                : 'border-zinc-800 grayscale hover:grayscale-0 opacity-70 hover:opacity-100'
                                                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <img src={img} alt={`Candidate ${idx + 1}`} className="w-full h-full object-cover" />
                                            {selectedImageIndex === idx && (
                                                <div className="absolute top-4 right-4 bg-yellow-400 text-black p-2 rounded-xl border-2 border-black shadow-lg">
                                                    <Sparkles size={20} fill="currentColor" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setGeneratedImages([]);
                                        setRetryCount(prev => prev + 1);
                                    }}
                                    disabled={retryCount >= 1 || isGenerating || isSubmitting}
                                    className={`h-[68px] rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-sm tracking-widest shadow-[0_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none transition-all border-2 ${retryCount < 1 && !isGenerating && !isSubmitting
                                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700 active:bg-zinc-700'
                                        : 'bg-zinc-950 text-zinc-800 border-zinc-950 shadow-none grayscale opacity-30 cursor-not-allowed'
                                        }`}
                                >
                                    <RefreshCcw size={18} />
                                    Regen {retryCount < 1 ? '(1)' : '(0)'}
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isGenerating || selectedImageIndex === null || isSubmitting}
                                    className={`h-[68px] rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-sm tracking-widest transition-all border-2 ${selectedImageIndex !== null && !isSubmitting
                                        ? 'bg-yellow-400 text-black border-black shadow-[0_6px_0px_0px_#ca8a04] active:translate-y-1 active:shadow-[0_2px_0px_0px_#ca8a04]'
                                        : 'bg-zinc-800 text-zinc-600 border-zinc-900 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    {isSubmitting ? "Sending..." : "Submit Selected"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


