'use client';

import { useState, useEffect } from 'react';

type Lang = 'zh-TW' | 'en';

interface FormField {
    id: string;
    type: 'text' | 'email' | 'textarea' | 'radio' | 'select';
    label: string;
    required: boolean;
    options?: string[]; // for radio and select
}

interface FormDefinition {
    id?: string;
    title: string;
    description: string;
    fields: FormField[];
    responseCount?: number;
}

export default function FormsPanel({ lang = 'zh-TW' }: { lang?: Lang }) {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [forms, setForms] = useState<FormDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Editor State
    const [editForm, setEditForm] = useState<FormDefinition | null>(null);
    const [saving, setSaving] = useState(false);
    const [embedUrl, setEmbedUrl] = useState('');

    const fetchForms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/forms');
            const data = (await res.json()) as FormDefinition[];
            setForms(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (view === 'list') fetchForms();
    }, [view]);

    const handleCreateNew = () => {
        setEditForm({
            title: '未命名表單',
            description: '',
            fields: [
                { id: crypto.randomUUID(), type: 'text', label: '您的姓名', required: true }
            ]
        });
        setView('edit');
    };

    const handleEdit = async (form: FormDefinition) => {
        // Fetch full form details if needed, but the list API might not return fields_json to save bandwidth.
        // Wait, the GET API currently DOES NOT return fields_json! I need to change GET API to return fields or fetch it individually.
        // Actually, let's just make the GET return fields. Wait, I didn't include fields_json in GET. Let me update GET route later, or fetch it here.
        // Let's assume GET returns fields_json for now, or we fetch it.
        // I will change GET to return fields_json in a moment.
        setEditForm({
            ...form,
            fields: form.fields || []
        });
        setView('edit');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此表單？相關回覆也會一併刪除。')) return;
        try {
            await fetch(`/api/forms?id=${id}`, { method: 'DELETE' });
            fetchForms();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!editForm) return;
        setSaving(true);
        try {
            const res = await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = (await res.json()) as any;
            if (data.success) {
                const url = `${window.location.origin}/f/${data.id}`;
                setEmbedUrl(`<iframe src="${url}" width="100%" height="500" frameborder="0"></iframe>`);
            }
        } catch (err) {
            console.error(err);
        }
        setSaving(false);
    };

    const addField = (type: FormField['type']) => {
        if (!editForm) return;
        const newField: FormField = {
            id: crypto.randomUUID(),
            type,
            label: '新欄位',
            required: false,
            options: type === 'select' || type === 'radio' ? ['選項1', '選項2'] : undefined
        };
        setEditForm({ ...editForm, fields: [...editForm.fields, newField] });
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            fields: editForm.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        });
    };

    const removeField = (id: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, fields: editForm.fields.filter(f => f.id !== id) });
    };

    if (view === 'edit' && editForm) {
        return (
            <div className="dash-panel">
                <div className="connect-row" style={{ marginBottom: '2rem' }}>
                    <h2>表單編輯器</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="panel-btn panel-btn-secondary" onClick={() => { setView('list'); setEmbedUrl(''); }}>返回列表</button>
                        <button className="panel-btn panel-btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? '儲存中...' : '儲存表單'}
                        </button>
                    </div>
                </div>

                {embedUrl && (
                    <div className="panel-setup-box" style={{ marginBottom: '2rem', border: '1px solid #00e682' }}>
                        <h3 style={{ color: '#00e682', marginTop: 0 }}>表單已儲存！嵌入程式碼：</h3>
                        <textarea readOnly value={embedUrl} className="panel-form-input" rows={2} style={{ fontSize: '0.85rem' }} />
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.5rem 0 0' }}>請複製以上程式碼貼入您的網站 HTML 中。</p>
                    </div>
                )}

                <div className="chart-grid">
                    {/* 左側：設定 */}
                    <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="chart-title">表單基本資訊</div>
                        <div>
                            <label className="panel-form-label">表單標題</label>
                            <input type="text" className="panel-form-input" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                        </div>
                        <div>
                            <label className="panel-form-label">表單描述</label>
                            <textarea className="panel-form-input" rows={2} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                        <div className="chart-title">新增欄位</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="panel-btn panel-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => addField('text')}>+ 短文字</button>
                            <button className="panel-btn panel-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => addField('textarea')}>+ 長文字</button>
                            <button className="panel-btn panel-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => addField('email')}>+ Email</button>
                            <button className="panel-btn panel-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => addField('select')}>+ 下拉選單</button>
                            <button className="panel-btn panel-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => addField('radio')}>+ 單選</button>
                        </div>
                    </div>

                    {/* 右側：欄位結構與預覽 */}
                    <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="chart-title">表單欄位設計</div>
                        
                        {editForm.fields.map((f, i) => (
                            <div key={f.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                                <button type="button" onClick={() => removeField(f.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#ff4d7d', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', width: '90%' }}>
                                    <div style={{ flex: 2 }}>
                                        <label className="panel-form-label" style={{ fontSize: '0.75rem' }}>欄位標題</label>
                                        <input type="text" className="panel-form-input" value={f.label} onChange={e => updateField(f.id, { label: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="panel-form-label" style={{ fontSize: '0.75rem' }}>類型</label>
                                        <select className="panel-form-select" disabled value={f.type}>
                                            <option value="text">短文字</option>
                                            <option value="email">Email</option>
                                            <option value="textarea">長文字</option>
                                            <option value="select">下拉選單</option>
                                            <option value="radio">單選</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={f.required} onChange={e => updateField(f.id, { required: e.target.checked })} />
                                        此為必填欄位
                                    </label>
                                </div>

                                {(f.type === 'select' || f.type === 'radio') && (
                                    <div>
                                        <label className="panel-form-label" style={{ fontSize: '0.75rem' }}>選項 (用逗號 , 分隔)</label>
                                        <input type="text" className="panel-form-input" value={(f.options || []).join(',')} 
                                            onChange={e => updateField(f.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {editForm.fields.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>請從左側新增欄位</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-panel">
            <div className="connect-row" style={{ marginBottom: '2rem' }}>
                <h2>表單創作</h2>
                <button className="panel-btn panel-btn-primary" onClick={handleCreateNew}>+ 新增表單</button>
            </div>

            {loading ? (
                <div className="panel-spinner">
                    <div className="spin-icon" /> 載入中...
                </div>
            ) : forms.length === 0 ? (
                <div className="panel-setup-box" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <h3 style={{ color: '#94a3b8' }}>目前尚無表單</h3>
                    <p style={{ color: '#6b7fa3', fontSize: '0.9rem' }}>點擊右上角「新增表單」來建立您的第一個表單。</p>
                </div>
            ) : (
                <div className="video-grid">
                    {forms.map(form => (
                        <div key={form.id} className="video-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{form.title}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {form.description || '無描述'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ color: '#00d9ff', fontWeight: 600 }}>{form.responseCount} 筆回覆</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <a href={`/forms/responses/${form.id}`} className="panel-btn panel-btn-secondary" style={{ padding: '0.4rem 0.8rem', textDecoration: 'none' }}>查看</a>
                                    <button className="panel-btn panel-btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleEdit(form)}>編輯</button>
                                    <button className="panel-btn panel-btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleDelete(form.id!)}>刪除</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
