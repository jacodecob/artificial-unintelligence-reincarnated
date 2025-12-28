import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { saveRoom } from '@/lib/gameServer';
import { RoomState } from '@/types/game';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4);

export const dynamic = 'force-dynamic';

export async function POST() {
    const roomCode = nanoid();

    const initialRoomState: RoomState = {
        roomCode,
        state: 'LOBBY',
        players: [],
        prompts: [],
        battles: [],
        currentBattleIndex: 0,
        timer: 0,
        updatedAt: Date.now(),
    };

    await saveRoom(initialRoomState);

    return NextResponse.json({ roomCode });
}
