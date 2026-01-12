import { NextResponse } from 'next/server';
import Ably from 'ably';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId') || `client-${Math.random().toString(36).substring(7)}`;

        const apiKey = process.env.ABLY_API_KEY;
        if (!apiKey) {
            console.error('Missing ABLY_API_KEY in environment');
            return NextResponse.json({ error: 'Ably API key not configured' }, { status: 500 });
        }

        const client = new Ably.Rest(apiKey);
        const tokenRequestData = await client.auth.createTokenRequest({ clientId });
        return NextResponse.json(tokenRequestData);
    } catch (error) {

        console.error('Ably Auth Error:', error);
        return NextResponse.json({ error: 'Failed to create token request' }, { status: 500 });
    }
}
