import { Redis } from '@upstash/redis';
import Ably from 'ably';
import { RoomState, Player, Message } from '@/types/game';

// Lazy initialize to avoid build-time errors when ENV is missing
const getRedis = () => new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const getAbly = () => new Ably.Rest(process.env.ABLY_API_KEY!);

const REDIS_LOCK_TIMEOUT = 5000; // 5 seconds

/**
 * Executes an atomic update on a room state with a lock
 */
export const updateRoom = async <T = any>(
    roomCode: string,
    updateFn: (room: RoomState) => Promise<T> | T
): Promise<T> => {
    const redis = getRedis();
    const lockKey = `lock:room:${roomCode}`;
    const token = Math.random().toString(36).substring(7);

    // Try to acquire lock with retries
    let acquired = false;
    let attempts = 0;
    while (!acquired && attempts < 20) {
        acquired = !!(await redis.set(lockKey, token, { nx: true, px: REDIS_LOCK_TIMEOUT }));
        if (!acquired) {
            await new Promise(r => setTimeout(r, 100 + Math.random() * 100));
            attempts++;
        }
    }

    if (!acquired) {
        throw new Error('Could not acquire room lock. Please try again.');
    }

    try {
        const room = await redis.get<RoomState>(`room:${roomCode}`);
        if (!room) throw new Error('Room not found');

        const result = await updateFn(room);

        // Save the updated room
        room.updatedAt = Date.now();
        await redis.set(`room:${roomCode}`, room, { ex: 3600 });

        // Broadcast the update
        const channel = getAbly().channels.get(`room:${roomCode}`);
        await channel.publish('state-update', room);

        return result;
    } finally {
        // Release lock but only if we still own it (token check)
        const currentToken = await redis.get(lockKey);
        if (currentToken === token) {
            await redis.del(lockKey);
        }
    }
};

export const getRoom = async (roomCode: string): Promise<RoomState | null> => {
    return await getRedis().get(`room:${roomCode}`);
};

export const saveRoom = async (room: RoomState) => {
    room.updatedAt = Date.now();
    await getRedis().set(`room:${room.roomCode}`, room, { ex: 3600 });
    const channel = getAbly().channels.get(`room:${room.roomCode}`);
    await channel.publish('state-update', room);
};

export const broadcastError = async (roomCode: string, error: string) => {
    const channel = getAbly().channels.get(`room:${roomCode}`);
    await channel.publish('error', { error });
};

