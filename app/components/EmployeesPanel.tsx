'use client';

import { useEffect, useState } from 'react';

type Lang = 'zh-TW' | 'en';

interface Admin {
    id: string;
    email: string;
    created_at: number;
    device_count: number;
}

export default function EmployeesPanel({ lang = 'zh-TW' }: { lang?: Lang }) {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [adding, setAdding] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/employees');
            const data = (await res.json()) as Admin[];
            setAdmins(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim()) return;
        setAdding(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail.trim() })
            });
            const data = (await res.json()) as any;
            if (data.error) throw new Error(data.error);
            
            setNewEmail('');
            fetchAdmins();
        } catch (err: any) {
            setErrorMsg(err.message);
        }
        setAdding(false);
    };

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`確定要移除管理員 ${email} 嗎？\n這將同時刪除他綁定的所有登入裝置。`)) return;
        try {
            await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
            fetchAdmins();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="dash-panel">
            <div className="connect-row" style={{ marginBottom: '2rem' }}>
                <h2>{lang === 'zh-TW' ? '人員管理' : 'Personnel Management'}</h2>
            </div>

            {/* 新增人員區塊 */}
            <div className="panel-setup-box" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{lang === 'zh-TW' ? '邀請新成員' : 'Invite New Member'}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                        {lang === 'zh-TW' 
                            ? '輸入同事的 Email 即可將其加入白名單。他們首次登入時將自動綁定裝置 (無密碼)。'
                            : 'Enter an Email to allow access. They will bind their device on first login (passwordless).'}
                    </p>
                </div>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div>
                        <input type="email" className="panel-form-input" placeholder="name@company.com"
                            value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                        {errorMsg && <div style={{ color: '#ff4d7d', fontSize: '0.8rem', marginTop: '0.3rem', position: 'absolute' }}>{errorMsg}</div>}
                    </div>
                    <button type="submit" className="panel-btn panel-btn-primary" disabled={adding || !newEmail.trim()}>
                        {adding ? (lang === 'zh-TW' ? '新增中...' : 'Adding...') : (lang === 'zh-TW' ? '+ 新增管理員' : '+ Add Admin')}
                    </button>
                </form>
            </div>

            {/* 列表區塊 */}
            {loading ? (
                <div className="panel-spinner">
                    <div className="spin-icon" /> {lang === 'zh-TW' ? '載入中...' : 'Loading...'}
                </div>
            ) : (
                <div className="panel-setup-box" style={{ padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 500 }}>Email</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 500 }}>{lang === 'zh-TW' ? '加入時間' : 'Joined At'}</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 500 }}>{lang === 'zh-TW' ? '綁定裝置數' : 'Devices'}</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 500, textAlign: 'right' }}>{lang === 'zh-TW' ? '操作' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{admin.email}</td>
                                    <td style={{ padding: '1rem', color: '#94a3b8' }}>
                                        {new Date(admin.created_at * 1000).toLocaleString(lang === 'zh-TW' ? 'zh-TW' : 'en-US')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {admin.device_count > 0 
                                            ? <span className="panel-badge panel-badge-green">{admin.device_count}</span>
                                            : <span style={{ color: '#64748b' }}>尚未綁定</span>}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button className="panel-btn panel-btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                            onClick={() => handleDelete(admin.id, admin.email)}>
                                            {lang === 'zh-TW' ? '移除' : 'Remove'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {admins.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                        {lang === 'zh-TW' ? '目前尚無人員資料' : 'No personnel found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
