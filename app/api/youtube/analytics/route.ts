import { NextRequest, NextResponse } from 'next/server';
import { getValidYoutubeToken } from '@/lib/youtube';
import { getGoogleOAuthConfig } from '@/lib/db';

export const runtime = 'edge';

export async function GET(_req: NextRequest) {
    const { clientId, clientSecret } = getGoogleOAuthConfig();

    if (!clientId || !clientSecret) {
        return NextResponse.json({ connected: false, reason: 'oauth_not_configured' });
    }

    const token = await getValidYoutubeToken();
    if (!token) {
        return NextResponse.json({ connected: false, reason: 'not_authorized' });
    }

    // Fetch the authenticated user's channel ID
    const idRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
        { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!idRes.ok) return NextResponse.json({ connected: false, reason: 'api_error' });
    const idData = await idRes.json() as { items?: Array<{ id: string }> };
    const channelId = idData.items?.[0]?.id;
    if (!channelId) return NextResponse.json({ connected: false, reason: 'no_channel' });

    // 28-day date range
    const today = new Date();
    const startDate = new Date(today); startDate.setDate(today.getDate() - 27);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    // Daily views
    const dailyRes = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3D${channelId}&startDate=${fmt(startDate)}&endDate=${fmt(today)}&metrics=views,estimatedMinutesWatched&dimensions=day&sort=day`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    // Traffic sources
    const sourcesRes = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3D${channelId}&startDate=${fmt(startDate)}&endDate=${fmt(today)}&metrics=views&dimensions=insightTrafficSourceType&sort=-views&maxResults=8`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    let daily: { day: string; views: number; minutes: number }[] = [];
    let sources: { source: string; views: number }[] = [];

    if (dailyRes.ok) {
        const d = await dailyRes.json() as { rows?: [string, number, number][] };
        daily = (d.rows ?? []).map(r => ({ day: r[0], views: r[1], minutes: r[2] }));
    }
    if (sourcesRes.ok) {
        const s = await sourcesRes.json() as { rows?: [string, number][] };
        const SOURCE_LABELS: Record<string, string> = {
            'YT_SEARCH': 'YouTube 搜尋', 'BROWSE_FEATURES': '瀏覽功能',
            'EXTERNAL': '外部來源', 'RELATED_VIDEO': '相關影片',
            'NO_LINK_OTHER': '直接輸入', 'SUBSCRIBER': '訂閱者',
            'CHANNEL': '頻道頁面', 'PLAYLIST': '播放清單',
        };
        sources = (s.rows ?? []).map(r => ({
            source: SOURCE_LABELS[r[0]] ?? r[0],
            views: r[1],
        }));
    }

    return NextResponse.json({ connected: true, daily, sources });
}
