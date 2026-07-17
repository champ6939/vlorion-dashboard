import { NextRequest, NextResponse } from 'next/server';
import { getValidYoutubeToken } from '@/lib/youtube';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const token = await getValidYoutubeToken();
    if (!token) return NextResponse.json({ error: 'NOT_AUTHORIZED' }, { status: 401 });

    const body = await req.json() as { title: string; description: string; privacyStatus: string };
    const { title, description, privacyStatus } = body;

    if (!title) return NextResponse.json({ error: '標題為必填' }, { status: 400 });

    const metadata = {
        snippet: { title, description: description || '' },
        status: { privacyStatus: privacyStatus || 'private' },
    };

    // Initialize resumable upload session with Google
    const initRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': 'video/*',
            },
            body: JSON.stringify(metadata),
        }
    );

    if (!initRes.ok) {
        const err = await initRes.text();
        return NextResponse.json({ error: 'Failed to init upload', details: err }, { status: 502 });
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) {
        return NextResponse.json({ error: 'No Location header returned' }, { status: 502 });
    }

    return NextResponse.json({ uploadUrl });
}
