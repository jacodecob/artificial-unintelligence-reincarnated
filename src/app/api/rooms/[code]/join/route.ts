import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/gameServer';
import { Player } from '@/types/game';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const { player }: { player: Player } = await request.json();

    const room = await getRoom(code);
    if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.state !== 'LOBBY') {
        return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
    }

    if (room.players.length >= 8) {
        return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    // Set as host if first player
    if (room.players.length === 0) {
        player.isHost = true;
    }

    room.players.push(player);
    await saveRoom(room);

    return NextResponse.json({ success: true, room });
}
