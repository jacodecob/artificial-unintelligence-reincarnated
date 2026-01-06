import { NextResponse } from 'next/server';
import { generateImageReal } from '@/services/aiService';
import Ably from 'ably';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const { prompt, playerId } = await request.json();

    const ably = new Ably.Rest(process.env.ABLY_API_KEY!);


    try {
        const imageUrls = await generateImageReal(prompt);

        // We send the array of candidates directly back to the specific player's channel/event
        const channel = ably.channels.get(`room:${code}`);
        await channel.publish(`image-generated:${playerId}`, { imageUrls });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }
}
