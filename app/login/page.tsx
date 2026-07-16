'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import './login.css';

type Status = 'idle' | 'checking' | 'needs-registration' | 'error' | 'success';

export default function LoginPage() {
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
            const optData = await optRes.json();

            if (!optRes.ok) {
                if (optRes.status === 400 && optData.error?.includes('還沒有註冊')) {
                    setStatus('needs-registration');
                    setMessage('這個帳號還沒註冊任何金鑰，第一次使用請先註冊。');
                    return;
                }
                setStatus('error');
                setMessage(optData.error || '登入失敗');
                return;
            }

            const authResponse = await startAuthentication({ optionsJSON: optData.options });

            const verifyRes = await fetch('/api/auth/login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, challengeId: optData.challengeId, response: authResponse }),
            });

            if (!verifyRes.ok) {
                const err = await verifyRes.json();
                setStatus('error');
                setMessage(err.error || '驗證失敗');
                return;
            }

            setStatus('success');
            router.push(next);
        } catch (err) {
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
            const optData = await optRes.json();

            if (!optRes.ok) {
                setStatus('error');
                setMessage(optData.error || '註冊失敗');
                return;
            }

            const regResponse = await startRegistration({ optionsJSON: optData.options });

            const verifyRes = await fetch('/api/auth/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, challengeId: optData.challengeId, response: regResponse }),
            });

            if (!verifyRes.ok) {
                const err = await verifyRes.json();
                setStatus('error');
                setMessage(err.error || '驗證失敗');
                return;
            }

            setStatus('success');
            router.push(next);
        } catch (err) {
            setStatus('error');
            setMessage('操作已取消或裝置驗證失敗');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <img src="/favicon.ico" alt="VLORION" />
                </div>
                <h1>VLORION Dashboard</h1>
                <p className="login-sub">用你註冊過的 USB 金鑰或手機/裝置生物辨識登入</p>

                <input
                    type="email"
                    className="login-input"
                    placeholder="管理員 Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />

                {message && <p className={`login-message ${status === 'error' ? 'is-error' : ''}`}>{message}</p>}

                {status === 'needs-registration' ? (
                    <button className="login-btn" onClick={handleRegister} disabled={!email}>
                        註冊新金鑰
                    </button>
                ) : (
                    <button className="login-btn" onClick={handleLogin} disabled={!email || status === 'checking'}>
                        {status === 'checking' ? '驗證中…' : '登入'}
                    </button>
                )}
            </div>
        </div>
    );
}
