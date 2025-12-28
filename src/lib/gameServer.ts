import { Redis } from '@upstash/redis';
import Ably from 'ably';
import { RoomState, Player, Message } from '@/types/game';

// Lazy initialize to avoid build-time errors when ENV is missing
const getRedis = () => new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const getAbly = () => new Ably.Rest(process.env.ABLY_API_KEY!);

export const getRoom = async (roomCode: string): Promise<RoomState | null> => {
    return await getRedis().get(`room:${roomCode}`);
};

export const saveRoom = async (room: RoomState) => {
    await getRedis().set(`room:${room.roomCode}`, room, { ex: 3600 }); // Expire rooms after 1 hour of inactivity

    // Publish update to Ably channel
    const channel = getAbly().channels.get(`room:${room.roomCode}`);
    await channel.publish('state-update', room);
};

export const broadcastError = async (roomCode: string, error: string) => {
    const channel = getAbly().channels.get(`room:${roomCode}`);
    await channel.publish('error', { error });
};
