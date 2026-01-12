import { NextResponse } from 'next/server';
import { generateImageReal } from '@/services/aiService';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const { prompt, playerId } = await request.json();

    try {
        console.log(`[Generate Route] Starting generation for room ${code}, player ${playerId}`);
        const base64Images = await generateImageReal(prompt);
        console.log(`[Generate Route] Images generated: ${base64Images.length}`);

        // Store images in Redis and return URLs
        // This solves the "Payload Too Large" (413/400) error when submitting to Next.js/Ably
        const imageUrls = await Promise.all(base64Images.map(async (base64) => {
            if (base64.startsWith('/images/')) return base64; // Error placeholders

            const imageId = nanoid();
            const key = `image:${imageId}`;

            // expire in 24 hours
            await redis.set(key, base64, { ex: 86400 });

            // Return the local URL
            // We need absolute URL for some cases? No, relative is fine for the app.
            // But let's verify if the client uses it in <img src="...">. Yes.
            return `/api/images/${imageId}`;
        }));

        return NextResponse.json({ success: true, imageUrls });

    } catch (error: any) {
        console.error("[Generate Route] Error:", error);
        return NextResponse.json({ error: 'Generation failed', details: error.message }, { status: 500 });
    }
}
