'use client';

import { useState } from 'react';

export default function FormRenderer({ formId, fields }: { formId: string, fields: any[] }) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (id: string, val: any) => {
        setFormData(prev => ({ ...prev, [id]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMsg('');

        try {
            const res = await fetch(`/api/f/${formId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const err = (await res.json()) as any;
                throw new Error(err.error || '送出失敗');
            }

            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    if (status === 'success') {
        return (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ color: '#38a169', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                <h2 style={{ margin: '0 0 0.5rem 0', color: '#111' }}>表單已成功送出</h2>
                <p style={{ color: '#666', margin: 0 }}>感謝您的回覆！</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {fields.map(field => (
                <div key={field.id} className="v-field">
                    <label className="v-label" htmlFor={field.id}>
                        {field.label}
                        {field.required && <span className="v-required">*</span>}
                    </label>
                    
                    {field.type === 'text' && (
                        <input type="text" id={field.id} className="v-input" 
                            required={field.required}
                            onChange={e => handleChange(field.id, e.target.value)} />
                    )}

                    {field.type === 'email' && (
                        <input type="email" id={field.id} className="v-input" 
                            required={field.required}
                            onChange={e => handleChange(field.id, e.target.value)} />
                    )}

                    {field.type === 'textarea' && (
                        <textarea id={field.id} className="v-input v-textarea" 
                            required={field.required}
                            onChange={e => handleChange(field.id, e.target.value)} />
                    )}

                    {field.type === 'select' && (
                        <select id={field.id} className="v-select" 
                            required={field.required}
                            onChange={e => handleChange(field.id, e.target.value)}>
                            <option value="">請選擇...</option>
                            {(field.options || []).map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    )}

                    {field.type === 'radio' && (
                        <div className="v-radio-group">
                            {(field.options || []).map((opt: string) => (
                                <label key={opt} className="v-radio-label">
                                    <input type="radio" name={field.id} value={opt}
                                        required={field.required}
                                        onChange={e => handleChange(field.id, e.target.value)} />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {status === 'error' && (
                <div style={{ color: '#e53e3e', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    {errorMsg}
                </div>
            )}

            <button type="submit" className="v-submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? '送出中...' : '送出表單'}
            </button>
        </form>
    );
}
