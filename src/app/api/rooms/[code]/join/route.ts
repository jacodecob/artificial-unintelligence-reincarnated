import { NextResponse } from 'next/server';
import { getRoom, saveRoom, updateRoom } from '@/lib/gameServer';
import { Player, RoomState } from '@/types/game';


export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const { player }: { player: Player } = await request.json();

    try {
        const result = await updateRoom(code, (room: RoomState) => {

            if (room.state !== 'LOBBY') {
                throw new Error('Game already in progress');
            }

            if (room.players.length >= 8) {
                // Check if they are already in the room (reconnect)
                const exists = room.players.some((p: Player) => p.id === player.id);
                if (!exists) throw new Error('Room is full');
            }

            // Check if player already exists in the room
            const existingPlayerIndex = room.players.findIndex((p: Player) => p.id === player.id);


            if (existingPlayerIndex !== -1) {
                // Update existing player
                const isHost = room.players[existingPlayerIndex].isHost;
                room.players[existingPlayerIndex] = { ...player, isHost };
            } else {
                // Set as host if first player
                if (room.players.length === 0) {
                    player.isHost = true;
                }
                room.players.push(player);
            }

            return { success: true, room };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to join room' }, { status: 400 });
    }
}

