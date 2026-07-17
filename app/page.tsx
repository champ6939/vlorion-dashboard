/**
 * VLORION Dashboard — Shell Layout
 * ------------------------------------------------------------------
 * Sidebar (logo, nav, avatar/logout, role badge) + top bar (live
 * clock, zh/en language toggle) + main content panel. Dark theme
 * only.
 * ------------------------------------------------------------------
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './globals.css';
import AnalyticsPanel from './components/AnalyticsPanel';
import FinancePanel from './components/FinancePanel';
import FormsPanel from './components/FormsPanel';
import SettingsPanel from './components/SettingsPanel';
import EmployeesPanel from './components/EmployeesPanel';
import InboxPanel from './components/InboxPanel';

type Panel = 'employees' | 'forms' | 'analytics' | 'finance' | 'settings' | 'inbox';
type Lang = 'zh-TW' | 'en';

const NAV_LABELS: Record<Lang, Record<Panel, string>> = {
    'zh-TW': { employees: '人員管理', forms: '表單創作', analytics: '數據管理', finance: '財務管理', settings: '設定', inbox: '信件匣' },
    'en':    { employees: 'Personnel',  forms: 'Form Builder', analytics: 'Analytics',   finance: 'Finance',  settings: 'Settings', inbox: 'Inbox' },
};

const COPY: Record<Lang, {
    logout: string; role: string; clockLabel: string;
    employeesEmpty: string; formsEmpty: string; settingsEmpty: string;
}> = {
    'zh-TW': {
        logout: '登出系統', role: '身分：系統管理員', clockLabel: '系統時間',
        employeesEmpty: '目前尚無人員資料。此區塊未來將提供人員清單與權限配置功能。',
        formsEmpty: '目前尚無表單資料。此區塊未來將提供視覺化表單建構工具。',
        settingsEmpty: '此區塊將提供系統全域設定與安全性組態。',
    },
    'en': {
        logout: 'Sign Out', role: 'Role: Administrator', clockLabel: 'System Time',
        employeesEmpty: 'No personnel records found. Personnel management and roles will be available here.',
        formsEmpty: 'No form templates found. The visual form builder will be available here.',
        settingsEmpty: 'Global system preferences and security configurations will be available here.',
    },
};

const PANEL_ORDER: Panel[] = ['employees', 'inbox', 'forms', 'analytics', 'finance', 'settings'];

// Nav icons (SVG implementations)
const NAV_ICONS: Record<Panel, React.ReactNode> = {
    employees: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    inbox: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
    forms: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    analytics: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    finance: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    settings: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
};

function formatClock(date: Date) {
    return new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(date);
}

export default function DashboardPage() {
    const router = useRouter();
    const [activePanel, setActivePanel] = useState<Panel>('employees');
    const [lang, setLang] = useState<Lang>('zh-TW');
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const saved = window.localStorage.getItem('vlorion-dashboard-lang');
        if (saved === 'zh-TW' || saved === 'en') setLang(saved);
    }, []);

    useEffect(() => {
        window.localStorage.setItem('vlorion-dashboard-lang', lang);
    }, [lang]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const t = COPY[lang];

    return (
        <div className="dash">
            {/* ── Sidebar ──────────────────────────────────────── */}
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
                            {NAV_ICONS[key]}
                            {NAV_LABELS[lang][key]}
                        </button>
                    ))}
                </nav>

                <div className="dash-sidebar-footer">
                    <Link href="/communications" className="dash-nav-btn" style={{ textDecoration: 'none', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {lang === 'zh-TW' ? '通訊中心' : 'Communications'}
                    </Link>
                    <button type="button" className="dash-logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>{t.logout}</span>
                    </button>
                    <div className="dash-role-badge">{t.role}</div>
                </div>
            </aside>

            {/* ── Main column ───────────────────────────────────── */}
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
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <span>{lang === 'zh-TW' ? '中' : 'EN'}</span>
                        </button>
                    </div>
                </header>

                <main className="dash-content">
                    {activePanel === 'employees' && <EmployeesPanel lang={lang} />}
                    {activePanel === 'inbox' && <InboxPanel lang={lang} />}
                    {activePanel === 'forms' && <FormsPanel lang={lang} />}
                    {activePanel === 'analytics' && <AnalyticsPanel lang={lang} />}
                    {activePanel === 'finance'   && <FinancePanel lang={lang} />}
                    {activePanel === 'settings'  && <SettingsPanel lang={lang} />}
                </main>
            </div>
        </div>
    );
}