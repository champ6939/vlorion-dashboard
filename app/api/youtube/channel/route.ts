import { NextRequest, NextResponse } from 'next/server';
import { getValidYoutubeToken } from '@/lib/youtube';

export const runtime = 'edge';

export async function GET(_req: NextRequest) {
    const token = await getValidYoutubeToken();
    if (!token) {
        return NextResponse.json({ error: 'NOT_AUTHORIZED' }, { status: 401 });
    }

    // Fetch the authenticated user's channel stats directly (no API Key needed)
    const statsRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
    );
    if (!statsRes.ok) {
        return NextResponse.json({ error: 'YouTube API error' }, { status: 502 });
    }
    const statsData = await statsRes.json() as { items?: Array<{
        id: string;
        snippet: { title: string; thumbnails: { default: { url: string } } };
        statistics: { subscriberCount: string; viewCount: string; videoCount: string };
    }> };

    const ch = statsData.items?.[0];
    if (!ch) return NextResponse.json({ error: 'CHANNEL_NOT_FOUND' }, { status: 404 });
    const channelId = ch.id;

    // ── Recent videos (search → stats) ────────────────────────────
    const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=6&order=date&type=video`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
    );
    let recentVideos: unknown[] = [];
    if (searchRes.ok) {
        const searchData = await searchRes.json() as { items?: Array<{
            id: { videoId: string };
            snippet: { title: string; thumbnails: { medium: { url: string } }; publishedAt: string };
        }> };
        const ids = (searchData.items ?? []).map(i => i.id.videoId).join(',');
        if (ids) {
            const vidRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}`,
                { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
            );
            if (vidRes.ok) {
                const vidData = await vidRes.json() as { items?: Array<{
                    id: string;
                    statistics: { viewCount: string; likeCount: string };
                }> };
                const statsMap = new Map((vidData.items ?? []).map(v => [v.id, v.statistics]));
                recentVideos = (searchData.items ?? []).map(v => ({
                    id: v.id.videoId,
                    title: v.snippet.title,
                    thumbnail: v.snippet.thumbnails.medium.url,
                    publishedAt: v.snippet.publishedAt,
                    viewCount: statsMap.get(v.id.videoId)?.viewCount ?? '0',
                    likeCount: statsMap.get(v.id.videoId)?.likeCount ?? '0',
                }));
            }
        }
    }

    return NextResponse.json({
        channelTitle: ch.snippet.title,
        thumbnail: ch.snippet.thumbnails.default.url,
        subscriberCount: ch.statistics.subscriberCount,
        viewCount: ch.statistics.viewCount,
        videoCount: ch.statistics.videoCount,
        recentVideos,
    });
}
