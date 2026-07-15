/**
 * VLORION Dashboard — Shell Layout
 * ------------------------------------------------------------------
 * Sidebar (logo slot, nav, avatar/logout, role badge) + top bar
 * (live clock, language, light/dark toggle) + main content panel.
 * Nav switching is local state for now — will become real routes
 * (/dashboard/employees, /dashboard/forms, /dashboard/settings)
 * once each feature is implemented and sits behind Cloudflare Access.
 * ------------------------------------------------------------------
 */

'use client';

import { useEffect, useState } from 'react';
import './globals.css';

type Panel = 'employees' | 'forms' | 'settings';
type Theme = 'dark' | 'light';

const NAV_ITEMS: { key: Panel; label: string }[] = [
    { key: 'employees', label: '人員管理' },
    { key: 'forms', label: '表單創作' },
    { key: 'settings', label: '設定' },
];

function formatClock(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${d} ${hh}:${mm}`;
}

export default function DashboardPage() {
    const [activePanel, setActivePanel] = useState<Panel>('employees');
    const [theme, setTheme] = useState<Theme>('dark');
    const [now, setNow] = useState<Date | null>(null);

    // Live clock — ticks every second. Starts null so the server-rendered
    // markup and the first client render match (avoids hydration mismatch).
    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // Persist the person's light/dark preference across visits.
    useEffect(() => {
        const saved = window.localStorage.getItem('vlorion-dashboard-theme');
        if (saved === 'light' || saved === 'dark') setTheme(saved);
    }, []);

    useEffect(() => {
        window.localStorage.setItem('vlorion-dashboard-theme', theme);
    }, [theme]);

    const handleLogout = () => {
        // Cloudflare Access's built-in logout endpoint — clears the Access
        // session cookie and re-prompts for identity + hardware key next visit.
        window.location.href = '/cdn-cgi/access/logout';
    };

    return (
        <div className="dash" data-theme={theme}>
            {/* ── Sidebar ──────────────────────────────────────────── */}
            <aside className="dash-sidebar">
                <div className="dash-logo-slot">
                    {/* Drop the VLORION mark here, e.g. <img src="/icon.png" alt="VLORION" /> */}
                    <span className="dash-logo-placeholder">LOGO</span>
                </div>

                <nav className="dash-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.key}
                            type="button"
                            className={`dash-nav-btn${activePanel === item.key ? ' active' : ''}`}
                            onClick={() => setActivePanel(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="dash-sidebar-footer">
                    <button type="button" className="dash-logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>登出</span>
                    </button>
                    <div className="dash-role-badge">ID級別：管理員</div>
                </div>
            </aside>

            {/* ── Main column ──────────────────────────────────────── */}
            <div className="dash-main">
                <header className="dash-topbar">
                    <div className="dash-clock">
                        當前時間：{now ? formatClock(now) : '—'}
                    </div>
                    <div className="dash-topbar-actions">
                        <button
                            type="button"
                            className="dash-icon-btn"
                            aria-label="切換淺色/深色模式"
                            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
                        >
                            {theme === 'dark' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            )}
                        </button>
                        <button type="button" className="dash-icon-btn" aria-label="切換語言">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                        </button>
                    </div>
                </header>

                <main className="dash-content">
                    {activePanel === 'employees' && (
                        <div className="dash-panel">
                            <h1>人員管理</h1>
                            <p className="dash-panel-empty">還沒有員工資料——這裡之後會顯示員工列表、新增/移除功能。</p>
                        </div>
                    )}
                    {activePanel === 'forms' && (
                        <div className="dash-panel">
                            <h1>表單創作</h1>
                            <p className="dash-panel-empty">還沒有表單——這裡之後會是視覺化表單建構器。</p>
                        </div>
                    )}
                    {activePanel === 'settings' && (
                        <div className="dash-panel">
                            <h1>設定</h1>
                            <p className="dash-panel-empty">帳號與系統設定會放在這裡。</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}