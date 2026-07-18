'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './login.css';

type Mode = 'login' | 'register';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/';

    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        setError('');
        if (!email || !password) { setError('請填寫所有欄位'); return; }
        setLoading(true);
        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json() as any;
            if (!res.ok) { setError(data.error || '發生錯誤，請重試'); return; }
            setSuccess(true);
            setTimeout(() => router.push(next), 1000);
        } catch {
            setError('網路錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-card">
            <div className="login-logo">
                <img src="/favicon.ico" alt="VLORION" />
            </div>
            <h1>VLORION Dashboard</h1>
            <p className="login-sub">
                {mode === 'login' ? '請輸入您的管理員帳號與密碼' : '首次使用，請建立管理員帳號'}
            </p>

            {success ? (
                <div className="login-success">
                    <div className="login-success-icon">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <p>驗證成功，正在跳轉…</p>
                </div>
            ) : (
                <>
                    <input
                        id="login-email"
                        type="email"
                        className="login-input"
                        placeholder="管理員 Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
                        disabled={loading}
                        autoComplete="email"
                    />
                    <input
                        id="login-password"
                        type="password"
                        className="login-input"
                        placeholder="密碼"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
                        disabled={loading}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        style={{ marginTop: '12px' }}
                    />

                    {error && <p className="login-message is-error">{error}</p>}

                    <button
                        id="btn-submit"
                        className="login-btn"
                        onClick={handleSubmit}
                        disabled={!email || !password || loading}
                    >
                        {loading
                            ? <><span className="login-spinner" />處理中…</>
                            : mode === 'login' ? '登入' : '建立帳號'}
                    </button>

                    <div className="login-divider">或</div>

                    <button
                        id="btn-toggle-mode"
                        className="login-btn login-btn-secondary"
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                    >
                        {mode === 'login' ? '首次使用？建立管理員帳號' : '已有帳號？返回登入'}
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
