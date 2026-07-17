'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import '@/app/globals.css';

interface FormResponse {
    id: string;
    data: Record<string, any>;
    created_at: number;
}

export default function FormResponsesPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [fields, setFields] = useState<any[]>([]);
    const [responses, setResponses] = useState<FormResponse[]>([]);

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/forms/${params.id}/responses`)
            .then(r => r.json())
            .then(data => {
                const parsed = data as any;
                if (parsed.error) {
                    alert(parsed.error);
                    router.push('/dashboard');
                    return;
                }
                setTitle(parsed.form.title);
                setFields(parsed.form.fields);
                setResponses(parsed.responses);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [params.id, router]);

    return (
        <div className="dash" style={{ padding: '2rem', display: 'block', overflow: 'auto' }}>
            <div className="connect-row" style={{ marginBottom: '2rem' }}>
                <div>
                    <button className="panel-btn panel-btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => router.push('/')}>
                        ← 返回 Dashboard
                    </button>
                    <h1>{title} - 訪客回覆</h1>
                </div>
            </div>

            {loading ? (
                <div className="panel-spinner">
                    <div className="spin-icon" /> 載入資料中...
                </div>
            ) : responses.length === 0 ? (
                <div className="panel-setup-box" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <h3 style={{ color: '#94a3b8' }}>目前尚無回覆</h3>
                </div>
            ) : (
                <div className="panel-setup-box" style={{ padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem' }}>回覆時間</th>
                                {fields.map(f => (
                                    <th key={f.id} style={{ padding: '1rem' }}>{f.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {responses.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', color: '#94a3b8' }}>
                                        {new Date(r.created_at * 1000).toLocaleString('zh-TW')}
                                    </td>
                                    {fields.map(f => (
                                        <td key={f.id} style={{ padding: '1rem' }}>
                                            {r.data[f.id] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
