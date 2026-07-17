'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';
import './communications.css';

/* ── Types ─────────────────────────────────────────────────────── */
interface ChatMessage {
    id: string;
    sender: string;
    body: string;
    sent_at: number;
}

type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

const ROOM_ID = 'general';
const PEER_A = 'admin-a';
const PEER_B = 'admin-b';
const POLL_INTERVAL = 2000;

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

/* ── Main Component ─────────────────────────────────────────────── */
export default function CommunicationsPage() {
    const router = useRouter();

    /* ── Identity ── */
    const [myPeerId, setMyPeerId] = useState('');
    const [remotePeerId, setRemotePeerId] = useState('');
    const [nameSet, setNameSet] = useState(false);

    /* ── Chat ── */
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const [lastMsgTs, setLastMsgTs] = useState(0);
    const chatEndRef = useRef<HTMLDivElement>(null);

    /* ── Video ── */
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const lastSignalTs = useRef(0);

    /* ── Chat polling ─────────────────────────────────────────────── */
    const pollMessages = useCallback(async () => {
        if (!nameSet) return;
        try {
            const res = await fetch(`/api/communications/messages?room=${ROOM_ID}&since=${lastMsgTs}`);
            const data = (await res.json()) as any;
            if (data.messages?.length) {
                setMessages(prev => [...prev, ...data.messages]);
                setLastMsgTs(data.messages[data.messages.length - 1].sent_at);
            }
        } catch { /* ignore */ }
    }, [nameSet, lastMsgTs]);

    useEffect(() => {
        if (!nameSet) return;
        const id = setInterval(pollMessages, POLL_INTERVAL);
        pollMessages();
        return () => clearInterval(id);
    }, [nameSet, pollMessages]);

    /* Auto-scroll chat */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ── Signal polling ───────────────────────────────────────────── */
    const pollSignals = useCallback(async () => {
        if (!nameSet || !myPeerId) return;
        try {
            const res = await fetch(`/api/communications/signal?peer=${myPeerId}&room=${ROOM_ID}&since=${lastSignalTs.current}`);
            const data = (await res.json()) as any;
            if (!data.signals) return;
            for (const sig of data.signals) {
                lastSignalTs.current = Date.now();
                await handleSignal(sig);
            }
        } catch { /* ignore */ }
    }, [nameSet, myPeerId]);

    useEffect(() => {
        if (!nameSet) return;
        const id = setInterval(pollSignals, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [nameSet, pollSignals]);

    /* ── WebRTC helpers ───────────────────────────────────────────── */
    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pc.onicecandidate = e => {
            if (e.candidate && remotePeerId) {
                sendSignal('ice', e.candidate);
            }
        };
        pc.ontrack = e => {
            if (remoteVideoRef.current && e.streams[0]) {
                remoteVideoRef.current.srcObject = e.streams[0];
            }
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') setCallStatus('connected');
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setCallStatus('ended');
            }
        };
        pcRef.current = pc;
        return pc;
    }, [remotePeerId]);

    const sendSignal = async (type: string, payload: any) => {
        await fetch('/api/communications/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: ROOM_ID, fromPeer: myPeerId, toPeer: remotePeerId, type, payload }),
        });
    };

    const handleSignal = async (sig: { from_peer: string; type: string; payload: string }) => {
        const payload = JSON.parse(sig.payload);
        if (sig.type === 'offer') {
            setRemotePeerId(sig.from_peer);
            setCallStatus('ringing');
            const pc = createPeerConnection();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
            }
            await pc.setRemoteDescription(new RTCSessionDescription(payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await fetch('/api/communications/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: ROOM_ID, fromPeer: myPeerId, toPeer: sig.from_peer, type: 'answer', payload: answer }),
            });
        } else if (sig.type === 'answer' && pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload));
            setCallStatus('connected');
        } else if (sig.type === 'ice' && pcRef.current) {
            try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(payload));
            } catch { /* ignore */ }
        } else if (sig.type === 'hangup') {
            hangup(false);
        }
    };

    const startCall = async () => {
        if (!remotePeerId) return alert('請輸入對方的 Peer ID');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: camOn, audio: micOn });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const pc = createPeerConnection();
            stream.getTracks().forEach(t => pc.addTrack(t, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal('offer', offer);
            setCallStatus('calling');
        } catch (err: any) {
            alert('無法取得鏡頭/麥克風權限：' + err.message);
        }
    };

    const acceptCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: camOn, audio: micOn });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            if (pcRef.current) {
                stream.getTracks().forEach(t => pcRef.current!.addTrack(t, stream));
            }
        } catch (err: any) {
            alert('無法取得鏡頭/麥克風：' + err.message);
        }
    };

    const hangup = (sendSignalToRemote = true) => {
        if (sendSignalToRemote && remotePeerId) sendSignal('hangup', {});
        pcRef.current?.close();
        pcRef.current = null;
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setCallStatus('ended');
        setTimeout(() => setCallStatus('idle'), 2000);
    };

    const toggleMic = () => {
        setMicOn(v => {
            localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !v; });
            return !v;
        });
    };

    const toggleCam = () => {
        setCamOn(v => {
            localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !v; });
            return !v;
        });
    };

    /* ── Send chat message ───────────────────────────────────────── */
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!msgInput.trim()) return;
        const body = msgInput.trim();
        setMsgInput('');
        try {
            const res = await fetch('/api/communications/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body, room: ROOM_ID, sender: myPeerId }),
            });
            const data = (await res.json()) as any;
            if (data.success) {
                setMessages(prev => [...prev, { id: data.id, sender: myPeerId, body, sent_at: data.sent_at }]);
                setLastMsgTs(data.sent_at);
            }
        } catch { /* ignore */ }
    };

    /* ── Login prompt ─────────────────────────────────────────────── */
    if (!nameSet) {
        return (
            <div className="comm-page comm-centered">
                <div className="comm-join-card">
                    <h1 className="comm-join-title">通訊中心</h1>
                    <p className="comm-join-sub">輸入您的顯示名稱以加入通訊室</p>
                    <input className="comm-input" placeholder="您的名稱 (例: Admin A)" maxLength={24}
                        value={myPeerId} onChange={e => setMyPeerId(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && myPeerId && setNameSet(true)} />
                    <button className="comm-btn comm-btn-primary" disabled={!myPeerId}
                        onClick={() => setNameSet(true)}>進入通訊中心</button>
                    <button className="comm-btn comm-btn-ghost" onClick={() => router.push('/')}>返回 Dashboard</button>
                </div>
            </div>
        );
    }

    /* ── Main UI ──────────────────────────────────────────────────── */
    return (
        <div className="comm-page">
            {/* Top Bar */}
            <header className="comm-topbar">
                <button className="comm-back-btn" onClick={() => router.push('/')}>← Dashboard</button>
                <div className="comm-topbar-title">通訊中心</div>
                <div className="comm-peer-badge">已登入：{myPeerId}</div>
            </header>

            <div className="comm-body">
                {/* ── Video Section ── */}
                <section className="comm-video-section">
                    <div className="comm-video-grid">
                        <div className="comm-video-box">
                            <video ref={remoteVideoRef} autoPlay playsInline className="comm-video" />
                            <div className="comm-video-label">對方畫面</div>
                            {callStatus === 'idle' && (
                                <div className="comm-video-placeholder">尚未連線</div>
                            )}
                            {callStatus === 'calling' && (
                                <div className="comm-video-placeholder comm-pulse">撥打中...</div>
                            )}
                            {callStatus === 'ringing' && (
                                <div className="comm-video-placeholder comm-pulse">有來電！</div>
                            )}
                            {callStatus === 'ended' && (
                                <div className="comm-video-placeholder">通話已結束</div>
                            )}
                        </div>
                        <div className="comm-video-box comm-video-local">
                            <video ref={localVideoRef} autoPlay playsInline muted className="comm-video" />
                            <div className="comm-video-label">我的畫面</div>
                        </div>
                    </div>

                    {/* Call Controls */}
                    <div className="comm-controls">
                        {callStatus === 'idle' || callStatus === 'ended' ? (
                            <div className="comm-call-setup">
                                <input className="comm-input comm-input-sm" placeholder="對方的名稱 (Peer ID)"
                                    value={remotePeerId} onChange={e => setRemotePeerId(e.target.value)} />
                                <button className="comm-ctrl-btn comm-ctrl-call" onClick={startCall} disabled={!remotePeerId}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                                    </svg>
                                    發起視訊通話
                                </button>
                            </div>
                        ) : callStatus === 'ringing' ? (
                            <div className="comm-call-setup">
                                <span className="comm-ringing-label">{remotePeerId} 撥入中...</span>
                                <button className="comm-ctrl-btn comm-ctrl-call" onClick={acceptCall}>接聽</button>
                                <button className="comm-ctrl-btn comm-ctrl-hang" onClick={() => hangup()}>拒絕</button>
                            </div>
                        ) : (
                            <div className="comm-call-active">
                                <button className={`comm-ctrl-btn ${micOn ? '' : 'comm-ctrl-off'}`} onClick={toggleMic}>
                                    {micOn ? (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V20c0 .55.45 1 1 1s1-.45 1-1v-2.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>
                                    )}
                                    {micOn ? '靜音' : '開麥'}
                                </button>
                                <button className={`comm-ctrl-btn ${camOn ? '' : 'comm-ctrl-off'}`} onClick={toggleCam}>
                                    {camOn ? (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>
                                    )}
                                    {camOn ? '關鏡頭' : '開鏡頭'}
                                </button>
                                <button className="comm-ctrl-btn comm-ctrl-hang" onClick={() => hangup()}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M20.18 16.45c-.29-.29-7.89-3.96-9.17-3.96-.51 0-.96.23-1.34.56L7.5 15.13c-2.66-1.46-5.17-3.97-6.63-6.63l2.08-2.17c.33-.38.56-.83.56-1.34C3.51 3.71-.16-3.89-.45 4.18c-.4.4-.55.95-.55 1.49v2.09c0 .82.66 1.49 1.49 1.49C12.2 9.25 21 .45 21-.38V1.82c0-.82-.66-1.49-1.49-1.49-1 0-1.31.68-1.33 1.12z"/>
                                    </svg>
                                    掛斷
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Chat Section ── */}
                <section className="comm-chat-section">
                    <div className="comm-chat-header">
                        <span>即時訊息</span>
                        <span className="comm-online-dot" />
                    </div>

                    <div className="comm-chat-messages">
                        {messages.length === 0 && (
                            <div className="comm-chat-empty">尚無訊息，開始對話吧！</div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={`comm-msg ${m.sender === myPeerId ? 'comm-msg-mine' : ''}`}>
                                <div className="comm-msg-sender">{m.sender}</div>
                                <div className="comm-msg-bubble">{m.body}</div>
                                <div className="comm-msg-time">
                                    {new Date(m.sent_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <form className="comm-chat-input-row" onSubmit={sendMessage}>
                        <input
                            className="comm-input"
                            placeholder="輸入訊息..."
                            value={msgInput}
                            onChange={e => setMsgInput(e.target.value)}
                        />
                        <button type="submit" className="comm-send-btn" disabled={!msgInput.trim()}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
