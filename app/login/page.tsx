'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './login.css';

const COPY = {
    'zh-TW': {
        title: 'VLORION Dashboard',
        sub: '請輸入您的管理員帳號與密碼',
        emailPlaceholder: '管理員 Email',
        passwordPlaceholder: '密碼',
        loginBtn: '登入',
        loading: '處理中…',
        successMsg: '驗證成功，正在跳轉…',
    },
    en: {
        title: 'VLORION Dashboard',
        sub: 'Sign in with your admin credentials',
        emailPlaceholder: 'Admin Email',
        passwordPlaceholder: 'Password',
        loginBtn: 'Sign In',
        loading: 'Processing…',
        successMsg: 'Verified! Redirecting…',
    },
};

type Lang = 'zh-TW' | 'en';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/';

    const [lang, setLang] = useState<Lang>('zh-TW');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const t = COPY[lang];

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError(lang === 'zh-TW' ? '請填寫所有欄位' : 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json() as any;
            if (!res.ok) {
                setError(data.error || (lang === 'zh-TW' ? '發生錯誤，請重試' : 'An error occurred, please try again'));
                return;
            }
            setSuccess(true);
            setTimeout(() => router.push(next), 1000);
        } catch {
            setError(lang === 'zh-TW' ? '請求失敗，請重試' : 'Request failed, please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-card">
            {/* Language Toggle */}
            <button
                className="lang-toggle"
                onClick={() => setLang(lang === 'zh-TW' ? 'en' : 'zh-TW')}
            >
                {lang === 'zh-TW' ? 'EN' : '中文'}
            </button>

            <div className="login-logo">
                <img src="/favicon.ico" alt="VLORION" />
            </div>
            <h1>{t.title}</h1>
            <p className="login-sub">{t.sub}</p>

            {success ? (
                <div className="login-success">
                    <div className="login-success-icon">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <p>{t.successMsg}</p>
                </div>
            ) : (
                <>
                    <input
                        id="login-email"
                        type="email"
                        className="login-input"
                        placeholder={t.emailPlaceholder}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
                        disabled={loading}
                        autoComplete="email"
                    />
                    <input
                        id="login-password"
                        type="password"
                        className="login-input"
                        placeholder={t.passwordPlaceholder}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
                        disabled={loading}
                        autoComplete="current-password"
                        style={{ marginTop: '12px' }}
                    />

                    {error && <p className="login-message is-error">{error}</p>}

                    <button
                        id="btn-login"
                        className="login-btn"
                        onClick={handleLogin}
                        disabled={!email || !password || loading}
                    >
                        {loading
                            ? <><span className="login-spinner" />{t.loading}</>
                            : t.loginBtn}
                    </button>
                </>
            )}
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="login-page">
            <Suspense fallback={<div className="login-card"><p>Loading...</p></div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
