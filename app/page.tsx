/**
 * VLORION Dashboard — Shell Layout
 * ------------------------------------------------------------------
 * Sidebar (logo, nav, avatar/logout, role badge) + top bar (live
 * clock, zh/en language toggle) + main content panel. Dark theme
 * only. Nav switching is local state for now — will become real
 * routes (/dashboard/employees, /dashboard/forms, /dashboard/settings)
 * once each feature is implemented and sits behind Cloudflare Access.
 * ------------------------------------------------------------------
 */

'use client';

import { useEffect, useState } from 'react';
import './globals.css';

type Panel = 'employees' | 'forms' | 'settings';
type Lang = 'zh-TW' | 'en';

const NAV_LABELS: Record<Lang, Record<Panel, string>> = {
    'zh-TW': { employees: '人員管理', forms: '表單創作', settings: '設定' },
    'en': { employees: 'Personnel', forms: 'Form Builder', settings: 'Settings' },
};

const COPY: Record<Lang, {
    logout: string;
    role: string;
    clockLabel: string;
    employeesEmpty: string;
    formsEmpty: string;
    settingsEmpty: string;
}> = {
    'zh-TW': {
        logout: '登出',
        role: 'ID級別：管理員',
        clockLabel: '當前時間',
        employeesEmpty: '還沒有員工資料——這裡之後會顯示員工列表、新增/移除功能。',
        formsEmpty: '還沒有表單——這裡之後會是視覺化表單建構器。',
        settingsEmpty: '帳號與系統設定會放在這裡。',
    },
    'en': {
        logout: 'Log out',
        role: 'Role: Admin',
        clockLabel: 'Current time',
        employeesEmpty: 'No staff yet — the employee list and add/remove tools will live here.',
        formsEmpty: 'No forms yet — the visual form builder will live here.',
        settingsEmpty: 'Account and system settings will live here.',
    },
};

const PANEL_ORDER: Panel[] = ['employees', 'forms', 'settings'];

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
    const [lang, setLang] = useState<Lang>('zh-TW');
    const [now, setNow] = useState<Date | null>(null);

    // Live clock — ticks every second. Starts null so the server-rendered
    // markup and the first client render match (avoids hydration mismatch).
    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // Persist the person's language preference across visits.
    useEffect(() => {
        const saved = window.localStorage.getItem('vlorion-dashboard-lang');
        if (saved === 'zh-TW' || saved === 'en') setLang(saved);
    }, []);

    useEffect(() => {
        window.localStorage.setItem('vlorion-dashboard-lang', lang);
    }, [lang]);

    const handleLogout = () => {
        // Cloudflare Access's built-in logout endpoint — clears the Access
        // session cookie and re-prompts for identity + hardware key next visit.
        window.location.href = '/cdn-cgi/access/logout';
    };

    const t = COPY[lang];

    return (
        <div className="dash">
            {/* ── Sidebar ──────────────────────────────────────────── */}
            <aside className="dash-sidebar">
                <div className="dash-logo-slot">
                    <img src="/favicon.ico" alt="VLORION" className="dash-logo-img" />
                </div>

                <nav className="dash-nav">
                    {PANEL_ORDER.map(key => (
                        <button
                            key={key}
                            type="button"
                            className={`dash-nav-btn${activePanel === key ? ' active' : ''}`}
                            onClick={() => setActivePanel(key)}
                        >
                            {NAV_LABELS[lang][key]}
                        </button>
                    ))}
                </nav>

                <div className="dash-sidebar-footer">
                    <button type="button" className="dash-logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{t.logout}</span>
                    </button>
                    <div className="dash-role-badge">{t.role}</div>
                </div>
            </aside>

            {/* ── Main column ──────────────────────────────────────── */}
            <div className="dash-main">
                <header className="dash-topbar">
                    <div className="dash-clock">
                        {t.clockLabel}：{now ? formatClock(now) : '—'}
                    </div>
                    <div className="dash-topbar-actions">
                        <button
                            type="button"
                            className="dash-lang-btn"
                            aria-label="Switch language"
                            onClick={() => setLang(l => (l === 'zh-TW' ? 'en' : 'zh-TW'))}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            <span>{lang === 'zh-TW' ? '中' : 'EN'}</span>
                        </button>
                    </div>
                </header>

                <main className="dash-content">
                    {activePanel === 'employees' && (
                        <div className="dash-panel">
                            <h1>{NAV_LABELS[lang].employees}</h1>
                            <p className="dash-panel-empty">{t.employeesEmpty}</p>
                        </div>
                    )}
                    {activePanel === 'forms' && (
                        <div className="dash-panel">
                            <h1>{NAV_LABELS[lang].forms}</h1>
                            <p className="dash-panel-empty">{t.formsEmpty}</p>
                        </div>
                    )}
                    {activePanel === 'settings' && (
                        <div className="dash-panel">
                            <h1>{NAV_LABELS[lang].settings}</h1>
                            <p className="dash-panel-empty">{t.settingsEmpty}</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}