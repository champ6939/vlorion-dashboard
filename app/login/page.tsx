'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import './login.css';

type Status = 'idle' | 'checking' | 'needs-registration' | 'error' | 'success';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/dashboard';

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState('');

    const handleLogin = async () => {
        setStatus('checking');
        setMessage('');
        try {
            const optRes = await fetch('/api/auth/login/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const optData = (await optRes.json()) as any;
            
            if (!optRes.ok) {
                if (optRes.status === 400 && optData.error?.includes('還沒有註冊')) {
                    setStatus('needs-registration');
                    setMessage('這個帳號尚未綁定任何金鑰，請先完成裝置註冊。');
                    return;
                }
                setStatus('error');
                setMessage(optData.error || '登入失敗，請確認 Email 是否正確');
                return;
            }

            const authResponse = await startAuthentication({ optionsJSON: optData.options });

            const verifyRes = await fetch('/api/auth/login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, challengeId: optData.challengeId, response: authResponse }),
            });

            if (!verifyRes.ok) {
                const err = (await verifyRes.json()) as any;
                setStatus('error');
                setMessage(err.error || '驗證失敗，請重試');
                return;
            }

            setStatus('success');
            // Brief success flash, then navigate
            setTimeout(() => router.push(next), 1200);
        } catch {
            setStatus('error');
            setMessage('操作已取消或裝置驗證失敗');
        }
    };

    const handleRegister = async () => {
        setStatus('checking');
        setMessage('');
        try {
            const optRes = await fetch('/api/auth/register/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const optData = (await optRes.json()) as any;

            if (!optRes.ok) {
                setStatus('error');
                setMessage(optData.error || '無法取得註冊選項，請稍後再試');
                return;
            }

            const regResponse = await startRegistration({ optionsJSON: optData.options });

            const verifyRes = await fetch('/api/auth/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, challengeId: optData.challengeId, response: regResponse }),
            });

            if (!verifyRes.ok) {
                const err = (await verifyRes.json()) as any;
                setStatus('error');
                setMessage(err.error || '驗證失敗，請重試');
                return;
            }

            setStatus('success');
            setTimeout(() => router.push(next), 1200);
        } catch {
            setStatus('error');
            setMessage('操作已取消或裝置驗證失敗');
        }
    };

    const isLoading = status === 'checking';
    const isSuccess = status === 'success';
    const needsReg  = status === 'needs-registration';

    return (
        <div className="login-card">
            <div className="login-logo">
                <img src="/favicon.ico" alt="VLORION" />
            </div>
            <h1>VLORION Dashboard</h1>
            <p className="login-sub">用你的硬體金鑰或裝置生物辨識登入，<br />無需密碼。</p>

            {isSuccess ? (
                /* ── Success state ── */
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
                        onKeyDown={e => e.key === 'Enter' && !isLoading && handleLogin()}
                        disabled={isLoading}
                        autoComplete="email"
                    />

                    {message && (
                        <p className={`login-message ${status === 'error' ? 'is-error' : 'is-info'}`}>
                            {message}
                        </p>
                    )}

                    {needsReg ? (
                        <>
                            <button
                                id="btn-register"
                                className="login-btn"
                                onClick={handleRegister}
                                disabled={!email || isLoading}
                            >
                                {isLoading
                                    ? <><span className="login-spinner" />驗證中…</>
                                    : '註冊新裝置金鑰'}
                            </button>
                            <div className="login-divider">或</div>
                            <button
                                id="btn-back-login"
                                className="login-btn login-btn-secondary"
                                onClick={() => { setStatus('idle'); setMessage(''); }}
                            >
                                返回，使用其他帳號
                            </button>
                        </>
                    ) : (
                        <button
                            id="btn-login"
                            className="login-btn"
                            onClick={handleLogin}
                            disabled={!email || isLoading}
                        >
                            {isLoading
                                ? <><span className="login-spinner" />驗證中…</>
                                : '登入'}
                        </button>
                    )}
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
