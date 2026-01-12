import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Safety check: only allow alphanumeric IDs to prevent injection-like keys
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        return new NextResponse('Invalid ID', { status: 400 });
    }

    const imageKey = `image:${id}`;
    const base64Data = await redis.get<string>(imageKey);

    if (!base64Data) {
        // Return 404, maybe a placeholder image
        return new NextResponse('Image not found', { status: 404 });
    }

    // Convert Data URI to Buffer
    // Format: data:image/png;base64,.....
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return new NextResponse('Invalid image data', { status: 500 });
    }

    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': type,
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
}
