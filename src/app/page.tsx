'use client';

import { useSocket } from '@/hooks/useSocket';
import { JoinScreen } from '@/components/game/JoinScreen';
import { Lobby } from '@/components/game/Lobby';
import { Generating } from '@/components/game/Generating';
import { Battle } from '@/components/game/Battle';
import { Reveal } from '@/components/game/Reveal';
import { GameOver } from '@/components/game/GameOver';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { socket, roomState, isConnected, playerId } = useSocket();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white font-mono">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-xl font-bold uppercase tracking-tighter animate-pulse text-zinc-500">
          Connecting to System...
        </p>
      </div>
    );
  }

  if (!roomState) {
    return <JoinScreen socket={socket} />;
  }

  // Handle Game States
  switch (roomState.state) {
    case 'LOBBY':
      return <Lobby roomState={roomState} socket={socket!} playerId={playerId} />;

    case 'INSTRUCTION':
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-white font-mono text-center">
          <h2 className="text-6xl font-black text-yellow-500 mb-8 uppercase italic tracking-tighter">
            How to play
          </h2>
          <p className="text-2xl font-bold max-w-2xl leading-relaxed text-zinc-300 mb-12">
            You will be given a prompt. Type a description to generate an image. Try to be funny. The AI is not smart.
          </p>
          <div className="text-zinc-500 uppercase font-black text-xl animate-bounce">
            Starting in {roomState.timer}s...
          </div>
        </div>
      );

    case 'GENERATING':
      return <Generating roomState={roomState} socket={socket!} playerId={playerId} />;

    case 'BATTLE':
      return <Battle roomState={roomState} socket={socket!} playerId={playerId} />;

    case 'REVEAL':
      return <Reveal roomState={roomState} playerId={playerId} />;

    case 'GAME_OVER':
      return <GameOver roomState={roomState} socket={socket!} playerId={playerId} />;

    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>State: {roomState.state} (Not yet implemented)</p>
        </div>
      );
  }
}
