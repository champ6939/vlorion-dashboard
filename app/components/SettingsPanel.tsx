'use client';

type Lang = 'zh-TW' | 'en';

const COPY: Record<Lang, any> = {
    'zh-TW': {
        title: '系統設定',
        accountTitle: '帳號安全與認證',
        accountDesc: '管理您的登入憑證與裝置授權。',
        webAuthn: 'WebAuthn 裝置登入',
        webAuthnStatus: '已綁定，使用硬體金鑰或生物辨識。',
        prefTitle: '介面與偏好設定',
        prefDesc: '自訂您的工作環境與顯示語言。',
        langSet: '目前語言',
        dangerTitle: '危險區域 (Danger Zone)',
        dangerDesc: '這些操作可能會影響系統運作或清除本地快取。',
        clearCache: '清除本地快取',
        clearCacheDesc: '強制重新整理所有面板的快取資料。',
        clearBtn: '清除快取',
        cacheCleared: '快取已清除！'
    },
    'en': {
        title: 'System Settings',
        accountTitle: 'Account Security & Authentication',
        accountDesc: 'Manage your login credentials and device authorizations.',
        webAuthn: 'WebAuthn Device Login',
        webAuthnStatus: 'Bound. Uses hardware key or biometrics.',
        prefTitle: 'Interface & Preferences',
        prefDesc: 'Customize your workspace and display language.',
        langSet: 'Current Language',
        dangerTitle: 'Danger Zone',
        dangerDesc: 'These actions may affect system operation or clear local caches.',
        clearCache: 'Clear Local Cache',
        clearCacheDesc: 'Force refresh cached data across all panels.',
        clearBtn: 'Clear Cache',
        cacheCleared: 'Cache cleared!'
    }
};

export default function SettingsPanel({ lang = 'zh-TW' }: { lang?: Lang }) {
    const t = COPY[lang];

    const handleClearCache = () => {
        // Simple cache clear dummy action
        alert(t.cacheCleared);
        window.location.reload();
    };

    return (
        <div className="dash-panel">
            <div className="connect-row">
                <h2>{t.title}</h2>
            </div>

            <div className="panel-section">
                <div className="panel-section-title">{t.accountTitle}</div>
                <div className="panel-setup-box" style={{ textAlign: 'left', padding: '2rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem' }}>{t.webAuthn}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{t.webAuthnStatus}</div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t.accountDesc}</div>
                </div>
            </div>

            <div className="panel-section">
                <div className="panel-section-title">{t.prefTitle}</div>
                <div className="panel-setup-box" style={{ textAlign: 'left', padding: '2rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem' }}>{t.langSet}</div>
                        <div style={{ color: '#00d9ff', fontSize: '0.85rem', fontWeight: 700 }}>
                            {lang === 'zh-TW' ? '繁體中文 (zh-TW)' : 'English (en)'}
                        </div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t.prefDesc}</div>
                </div>
            </div>

            <div className="panel-section">
                <div className="panel-section-title" style={{ color: '#ff4d7d' }}>{t.dangerTitle}</div>
                <div className="panel-setup-box" style={{ textAlign: 'left', padding: '2rem', border: '1px dashed rgba(255,77,125,0.4)', background: 'rgba(255,77,125,0.05)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem', color: '#ff4d7d' }}>{t.clearCache}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{t.clearCacheDesc}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>{t.dangerDesc}</div>
                    </div>
                    <button className="panel-btn panel-btn-danger" onClick={handleClearCache}>
                        {t.clearBtn}
                    </button>
                </div>
            </div>
        </div>
    );
}
