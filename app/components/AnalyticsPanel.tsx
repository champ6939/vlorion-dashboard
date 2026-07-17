'use client';

import { useEffect, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────
interface ChannelData {
    channelTitle: string;
    thumbnail: string;
    subscriberCount: string;
    viewCount: string;
    videoCount: string;
    recentVideos: {
        id: string; title: string; thumbnail: string;
        publishedAt: string; viewCount: string; likeCount: string;
    }[];
}
interface AnalyticsData {
    connected: boolean;
    daily?: { day: string; views: number; minutes: number }[];
    sources?: { source: string; views: number }[];
}

// ── Helper: format large numbers ─────────────────────────────────
function fmt(n: string | number): string {
    const v = typeof n === 'string' ? parseInt(n, 10) : n;
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
    return String(v);
}

// ── Bar chart (SVG, no deps) ─────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
    if (!data.length) return null;
    const W = 600; const H = 140; const PAD = 20;
    const max = Math.max(...data.map(d => d.value), 1);
    const bw  = (W - PAD * 2) / data.length - 3;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
            <defs>
                <linearGradient id="bgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d9ff" />
                    <stop offset="100%" stopColor="#6f00ff" stopOpacity="0.5" />
                </linearGradient>
            </defs>
            {data.map((d, i) => {
                const barH = ((d.value / max) * (H - PAD - 16)) || 2;
                const x = PAD + i * ((W - PAD * 2) / data.length) + 1.5;
                const y = H - PAD - barH;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={bw} height={barH} rx="3" fill="url(#bgrad)" />
                        {i % Math.ceil(data.length / 7) === 0 && (
                            <text x={x + bw / 2} y={H - 4} textAnchor="middle"
                                fontSize="8" fill="rgba(148,163,184,0.7)">
                                {d.label.slice(5)}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

// ── Donut chart ─────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number }[] }) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const COLORS = ['#00d9ff','#6f00ff','#ff006e','#00e682','#ffb700','#a66cff','#ff7849','#00bfff'];
    let offset = 0;
    const R = 50; const CX = 60; const CY = 60;
    const circumference = 2 * Math.PI * R;
    return (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <svg viewBox="0 0 120 120" width="120" height="120" style={{ flexShrink: 0 }}>
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(0,217,255,0.08)" strokeWidth="20" />
                {data.map((d, i) => {
                    const pct   = d.value / total;
                    const dash  = pct * circumference;
                    const gap   = circumference - dash;
                    const el = (
                        <circle key={i} cx={CX} cy={CY} r={R} fill="none"
                            stroke={COLORS[i % COLORS.length]} strokeWidth="20"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset * circumference}
                            transform={`rotate(-90 ${CX} ${CY})`} />
                    );
                    offset += pct;
                    return el;
                })}
            </svg>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {data.map((d, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: '#94a3b8' }}>{d.label}</span>
                        <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{fmt(d.value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ── Translation ──────────────────────────────────────────────────
type Lang = 'zh-TW' | 'en';
const COPY: Record<Lang, any> = {
    'zh-TW': {
        title: '數據管理', authorized: 'YouTube 授權完成',
        notConfigured: '尚未設定 Google OAuth 憑證',
        notConfiguredDesc1: '請至系統環境變數中加入以下設定參數：',
        notConfiguredDesc2: '（需於 Google Cloud 控制台啟用 YouTube Data API v3 與 YouTube Analytics API）',
        authRequired: '要求授權 YouTube 帳號',
        authRequiredDesc: '請點擊下方按鈕授權存取您的 YouTube 頻道，系統將取得統計數據與影片上傳權限。',
        authBtn: '授權 YouTube 帳號',
        loading: '載入資料中…',
        channelTitle: 'YouTube 頻道',
        subscribers: '訂閱者', totalViews: '總觀看次數', totalVideos: '影片數',
        recentVideos: '最新影片', views: '觀看次數', likes: '喜歡',
        analyticsTitle: '分析數據（近 28 天）', loadingAnalytics: '載入分析資料…',
        viewsTrend: '觀看次數趨勢', trafficSources: '流量來源',
        uploadTitle: '上傳影片至 YouTube', selectFile: '選擇影片檔案',
        videoTitle: '影片標題', privacy: '隱私設定', description: '影片說明',
        private: '私人', unlisted: '非公開', public: '公開',
        uploading: '上傳中...', uploadSuccess: '影片上傳成功！可能需要幾分鐘時間在 YouTube 後台進行處理。',
        uploadError: '上傳失敗，請檢查網路連線或授權狀態。', startUpload: '開始上傳'
    },
    'en': {
        title: 'Analytics Management', authorized: 'YouTube Authorized',
        notConfigured: 'Google OAuth Credentials Not Configured',
        notConfiguredDesc1: 'Please add the following settings to the environment variables:',
        notConfiguredDesc2: '(Requires YouTube Data API v3 and YouTube Analytics API enabled in Google Cloud Console)',
        authRequired: 'YouTube Account Authorization Required',
        authRequiredDesc: 'Please click the button below to authorize access to your YouTube channel. This grants access to statistics and video uploads.',
        authBtn: 'Authorize YouTube Account',
        loading: 'Loading data...',
        channelTitle: 'YouTube Channel',
        subscribers: 'Subscribers', totalViews: 'Total Views', totalVideos: 'Videos',
        recentVideos: 'Recent Videos', views: 'Views', likes: 'Likes',
        analyticsTitle: 'Analytics (Last 28 Days)', loadingAnalytics: 'Loading analytics...',
        viewsTrend: 'Views Trend', trafficSources: 'Traffic Sources',
        uploadTitle: 'Upload Video to YouTube', selectFile: 'Select Video File',
        videoTitle: 'Video Title', privacy: 'Privacy Status', description: 'Video Description',
        private: 'Private', unlisted: 'Unlisted', public: 'Public',
        uploading: 'Uploading...', uploadSuccess: 'Video uploaded successfully! It may take a few minutes to process in YouTube Studio.',
        uploadError: 'Upload failed. Please check network connection or authorization status.', startUpload: 'Start Upload'
    }
};

// ── Main component ───────────────────────────────────────────────
export default function AnalyticsPanel({ lang = 'zh-TW' }: { lang?: Lang }) {
    const t = COPY[lang];
    const [channel, setChannel] = useState<ChannelData | null>(null);
    const [channelStatus, setChannelStatus] = useState<'loading'|'ready'|'not_configured'|'error'>('loading');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadMeta, setUploadMeta] = useState({ title: '', description: '', privacyStatus: 'private' });
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        fetch('/api/youtube/channel')
            .then(r => r.json() as Promise<ChannelData & { error?: string }>)
            .then(data => {
                if (data.error === 'NOT_AUTHORIZED') { setChannelStatus('ready'); return; }
                if (data.error) { setChannelStatus('error'); return; }
                setChannel(data);
                setChannelStatus('ready');
            })
            .catch(() => setChannelStatus('error'));

        fetch('/api/youtube/analytics')
            .then(r => r.json() as Promise<AnalyticsData & { reason?: string }>)
            .then(data => {
                if (data.reason === 'oauth_not_configured') {
                    setChannelStatus('not_configured');
                }
                setAnalytics(data);
            })
            .catch(() => setAnalytics({ connected: false }))
            .finally(() => setAnalyticsLoading(false));
    }, []);

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!uploadFile || !uploadMeta.title) return;
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('idle');

        try {
            // 1. Init upload session
            const initRes = await fetch('/api/youtube/upload/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uploadMeta),
            });
            if (!initRes.ok) throw new Error('初始化上傳失敗');
            const { uploadUrl } = (await initRes.json()) as { uploadUrl: string };

            // 2. Direct PUT to Google using XMLHttpRequest to track progress
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', uploadFile.type || 'video/*');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const pct = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(pct);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setUploadStatus('success');
                    setUploadFile(null);
                    setUploadMeta({ title: '', description: '', privacyStatus: 'private' });
                } else {
                    setUploadStatus('error');
                }
                setUploading(false);
            };

            xhr.onerror = () => {
                setUploadStatus('error');
                setUploading(false);
            };

            xhr.send(uploadFile);
        } catch (err) {
            setUploadStatus('error');
            setUploading(false);
        }
    }

    return (
        <div className="dash-panel">
            <div className="connect-row">
                <h2>{t.title}</h2>
                {analytics?.connected && (
                    <span className="panel-badge panel-badge-green">{t.authorized}</span>
                )}
            </div>

            {/* ── Setup guide ──────────────────────────────────────── */}
            {channelStatus === 'not_configured' && (
                <div className="panel-section">
                    <div className="panel-setup-box">
                        <h3>{t.notConfigured}</h3>
                        <p>{t.notConfiguredDesc1}</p>
                        <div className="panel-setup-code">{`GOOGLE_CLIENT_ID     = xxx.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET = GOCSPX-xxx`}</div>
                        <p style={{ fontSize: '0.78rem', color: '#6b7fa3' }}>
                            {t.notConfiguredDesc2}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Login / Auth Guide ───────────────────────────────── */}
            {!analyticsLoading && !analytics?.connected && channelStatus !== 'not_configured' && (
                <div className="panel-section">
                    <div className="panel-setup-box">
                        <h3>{t.authRequired}</h3>
                        <p>{t.authRequiredDesc}</p>
                        <a href="/api/youtube/oauth/start" className="panel-btn panel-btn-primary"
                            style={{ textDecoration: 'none', display: 'inline-flex' }}>
                            {t.authBtn}
                        </a>
                    </div>
                </div>
            )}

            {/* ── Loading ───────────────────────────────────────────── */}
            {channelStatus === 'loading' && (
                <div className="panel-spinner">
                    <div className="spin-icon" /> {t.loading}
                </div>
            )}

            {/* ── Channel overview ─────────────────────────────────── */}
            {channelStatus === 'ready' && channel && (
                <>
                    {/* Channel header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        {channel.thumbnail && (
                            <img src={channel.thumbnail} alt={channel.channelTitle}
                                style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(0,217,255,0.3)' }} />
                        )}
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{channel.channelTitle}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.channelTitle}</div>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div className="stat-cards" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg,#00d9ff,#0099cc)' } as React.CSSProperties}>
                            <div className="stat-card-label">{t.subscribers}</div>
                            <div className="stat-card-value">{fmt(channel.subscriberCount)}</div>
                        </div>
                        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg,#6f00ff,#a66cff)' } as React.CSSProperties}>
                            <div className="stat-card-label">{t.totalViews}</div>
                            <div className="stat-card-value">{fmt(channel.viewCount)}</div>
                        </div>
                        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg,#ff006e,#ff4d7d)' } as React.CSSProperties}>
                            <div className="stat-card-label">{t.totalVideos}</div>
                            <div className="stat-card-value">{fmt(channel.videoCount)}</div>
                        </div>
                    </div>

                    {/* Recent videos */}
                    {channel.recentVideos.length > 0 && (
                        <div className="panel-section">
                            <div className="panel-section-title">{t.recentVideos}</div>
                            <div className="video-grid">
                                {channel.recentVideos.map(v => (
                                    <a key={v.id} href={`https://youtu.be/${v.id}`} target="_blank" rel="noopener noreferrer"
                                        className="video-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <img src={v.thumbnail} alt={v.title} />
                                        <div className="video-card-info">
                                            <div className="video-card-title">{v.title}</div>
                                            <div className="video-card-meta">
                                                {t.views}: {fmt(v.viewCount)} &nbsp;·&nbsp; {t.likes}: {fmt(v.likeCount)}
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Analytics section */}
                    <div className="panel-section">
                        <div className="panel-section-title">{t.analyticsTitle}</div>

                        {analyticsLoading && (
                            <div className="panel-spinner" style={{ padding: '2rem' }}>
                                <div className="spin-icon" /> {t.loadingAnalytics}
                            </div>
                        )}

                        {!analyticsLoading && analytics?.connected && (
                            <div className="chart-grid">
                                {/* Views bar chart */}
                                <div className="chart-container">
                                    <div className="chart-title">{t.viewsTrend}</div>
                                    <BarChart data={(analytics.daily ?? []).map(d => ({
                                        label: d.day, value: d.views,
                                    }))} />
                                </div>
                                {/* Traffic sources donut */}
                                <div className="chart-container">
                                    <div className="chart-title">{t.trafficSources}</div>
                                    <DonutChart data={(analytics.sources ?? []).map(s => ({
                                        label: s.source, value: s.views,
                                    }))} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload Video Section */}
                    {analytics?.connected && (
                        <div className="panel-section">
                            <div className="panel-section-title">{t.uploadTitle}</div>
                            <form className="panel-form" onSubmit={handleUpload}>
                                <div className="panel-form-field" style={{ marginBottom: '1rem' }}>
                                    <label className="panel-form-label">{t.selectFile}</label>
                                    <input type="file" accept="video/*" className="panel-form-input"
                                        onChange={e => setUploadFile(e.target.files?.[0] || null)} disabled={uploading} />
                                </div>
                                <div className="panel-form-row">
                                    <div className="panel-form-field" style={{ flex: 2 }}>
                                        <label className="panel-form-label">{t.videoTitle}</label>
                                        <input type="text" className="panel-form-input" value={uploadMeta.title}
                                            onChange={e => setUploadMeta(m => ({ ...m, title: e.target.value }))}
                                            disabled={uploading} required />
                                    </div>
                                    <div className="panel-form-field" style={{ flex: 1 }}>
                                        <label className="panel-form-label">{t.privacy}</label>
                                        <select className="panel-form-select" value={uploadMeta.privacyStatus}
                                            onChange={e => setUploadMeta(m => ({ ...m, privacyStatus: e.target.value }))}
                                            disabled={uploading}>
                                            <option value="private">{t.private}</option>
                                            <option value="unlisted">{t.unlisted}</option>
                                            <option value="public">{t.public}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="panel-form-field" style={{ marginBottom: '1.5rem' }}>
                                    <label className="panel-form-label">{t.description}</label>
                                    <textarea className="panel-form-input" rows={3} value={uploadMeta.description}
                                        onChange={e => setUploadMeta(m => ({ ...m, description: e.target.value }))}
                                        disabled={uploading} />
                                </div>

                                {uploading && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                                            <span>{t.uploading}</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="progress-bar-wrap">
                                            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                )}

                                {uploadStatus === 'success' && (
                                    <div style={{ marginBottom: '1rem', color: '#00e682', fontSize: '0.85rem' }}>
                                        {t.uploadSuccess}
                                    </div>
                                )}
                                {uploadStatus === 'error' && (
                                    <div style={{ marginBottom: '1rem', color: '#ff4d7d', fontSize: '0.85rem' }}>
                                        {t.uploadError}
                                    </div>
                                )}

                                <button type="submit" className="panel-btn panel-btn-primary" disabled={uploading || !uploadFile || !uploadMeta.title}>
                                    {t.startUpload}
                                </button>
                            </form>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
