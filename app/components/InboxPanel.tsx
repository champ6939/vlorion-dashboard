'use client';
import { useState, useEffect } from 'react';
import { Mail, Trash2, MailOpen, User } from 'lucide-react';

interface InboxEmail {
    id: string;
    sender: string;
    recipient: string;
    subject: string;
    body_text: string;
    body_html: string;
    date: number;
    read: number;
}

export default function InboxPanel({ lang }: { lang: 'zh-TW' | 'en' }) {
    const [emails, setEmails] = useState<InboxEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);

    const fetchEmails = async () => {
        try {
            const res = await fetch('/api/inbox');
            const data = (await res.json()) as any;
            if (data.emails) {
                setEmails(data.emails);
            }
        } catch (error) {
            console.error('Failed to fetch emails:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/inbox?id=${id}`, { method: 'PUT' });
            setEmails(emails.map(e => e.id === id ? { ...e, read: 1 } : e));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const deleteEmail = async (id: string) => {
        if (!confirm('確定要刪除這封信件嗎？')) return;
        try {
            await fetch(`/api/inbox?id=${id}`, { method: 'DELETE' });
            setEmails(emails.filter(e => e.id !== id));
            if (selectedEmail?.id === id) setSelectedEmail(null);
        } catch (error) {
            console.error('Failed to delete email:', error);
        }
    };

    const handleSelectEmail = (email: InboxEmail) => {
        setSelectedEmail(email);
        if (email.read === 0) {
            markAsRead(email.id);
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts * 1000).toLocaleString(lang === 'zh-TW' ? 'zh-TW' : 'en-US');
    };

    return (
        <div className="dash-panel" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)', overflow: 'hidden', background: 'transparent' }}>
            
            {/* 左側：信件列表 */}
            <div style={{
                width: '350px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={20} />
                        收件匣 (Inbox)
                    </h2>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '20px' }}>載入中...</p>
                    ) : emails.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '20px' }}>收件匣空空如也</p>
                    ) : (
                        emails.map(email => (
                            <div 
                                key={email.id}
                                onClick={() => handleSelectEmail(email)}
                                style={{
                                    padding: '16px',
                                    marginBottom: '8px',
                                    borderRadius: '12px',
                                    background: selectedEmail?.id === email.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    borderLeft: email.read === 0 ? '4px solid #60a5fa' : '4px solid transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = selectedEmail?.id === email.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: email.read === 0 ? 'bold' : 'normal', fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                                        {email.sender}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                        {new Date(email.date * 1000).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ fontWeight: email.read === 0 ? 'bold' : 'normal', fontSize: '1rem', color: '#fff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {email.subject}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {email.body_text || '無內文'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 右側：信件內容 */}
            <div style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {selectedEmail ? (
                    <>
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', color: '#fff' }}>{selectedEmail.subject}</h2>
                                <button 
                                    onClick={() => deleteEmail(selectedEmail.id)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Trash2 size={16} /> 刪除
                                </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '500', color: '#e2e8f0' }}>{selectedEmail.sender}</div>
                                    <div style={{ fontSize: '0.85rem' }}>寄至 {selectedEmail.recipient} • {formatDate(selectedEmail.date)}</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {selectedEmail.body_html ? (
                                <div 
                                    style={{ background: '#fff', borderRadius: '8px', padding: '20px', color: '#000' }}
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} 
                                />
                            ) : (
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#e2e8f0' }}>
                                    {selectedEmail.body_text}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.4)' }}>
                        <MailOpen size={64} strokeWidth={1} style={{ marginBottom: '16px' }} />
                        <p style={{ fontSize: '1.1rem' }}>請在左側選擇一封信件來閱讀</p>
                    </div>
                )}
            </div>
            
        </div>
    );
}
