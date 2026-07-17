'use client';

import { useCallback, useEffect, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────
interface Transaction {
    id: string; type: 'income' | 'expense';
    category: string; description: string; amount: number; date: string;
}
interface NewTxn {
    type: 'income' | 'expense'; category: string;
    description: string; amount: string; date: string;
}

const INCOME_CATS: Record<string, string[]> = {
    'zh-TW': ['薪資', '廣告收入', '版稅/授權', '贊助', '其他收入'],
    'en':    ['Salary', 'Ad Revenue', 'Royalties/Licensing', 'Sponsorships', 'Other Income']
};
const EXPENSE_CATS: Record<string, string[]> = {
    'zh-TW': ['設備', '軟體訂閱', '行銷', '差旅', '水電', '人事成本', '其他支出'],
    'en':    ['Equipment', 'Software Subs', 'Marketing', 'Travel', 'Utilities', 'Payroll', 'Other Expenses']
};

type Lang = 'zh-TW' | 'en';

const COPY: Record<Lang, any> = {
    'zh-TW': {
        title: '財務管理', loading: '載入中…',
        income: '本月收入', expense: '本月支出', records: '筆',
        balance: '淨餘額', surplus: '盈餘', deficit: '虧損',
        budget: '月預算', set: '設定', overBudget: '⚠ 已超預算！', used: '已用',
        addRecordBtn: '+ 新增記錄', addTitle: '新增交易記錄',
        type: '類型', typeIncome: '收入', typeExpense: '支出',
        category: '類別', date: '日期', amount: '金額（NT$）',
        desc: '說明', descPlaceholder: '交易說明…',
        save: '新增', saving: '儲存中…', cancel: '取消',
        emptyList: '本月尚無記錄。',
        tableDate: '日期', tableType: '類型', tableCat: '類別', tableDesc: '說明', tableAmount: '金額',
        del: '刪除', confirmDel: '確定刪除這筆記錄？'
    },
    'en': {
        title: 'Finance Management', loading: 'Loading...',
        income: 'Monthly Income', expense: 'Monthly Expense', records: 'records',
        balance: 'Net Balance', surplus: 'Surplus', deficit: 'Deficit',
        budget: 'Monthly Budget', set: 'Set', overBudget: '⚠ Over budget!', used: 'Used',
        addRecordBtn: '+ Add Record', addTitle: 'Add Transaction Record',
        type: 'Type', typeIncome: 'Income', typeExpense: 'Expense',
        category: 'Category', date: 'Date', amount: 'Amount (NT$)',
        desc: 'Description', descPlaceholder: 'Transaction description...',
        save: 'Add', saving: 'Saving...', cancel: 'Cancel',
        emptyList: 'No records this month.',
        tableDate: 'Date', tableType: 'Type', tableCat: 'Category', tableDesc: 'Description', tableAmount: 'Amount',
        del: 'Delete', confirmDel: 'Are you sure you want to delete this record?'
    }
};

function getTaipeiDate() {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' });
    return formatter.format(d); // format: YYYY-MM-DD
}

function todayStr() { return getTaipeiDate(); }
function currentMonth() { return getTaipeiDate().slice(0, 7); }
function fmtTWD(n: number) {
    return 'NT$' + n.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(d: string) {
    const [y, m, day] = d.split('-');
    return `${y}/${m}/${day}`;
}

// ── Main component ───────────────────────────────────────────────
export default function FinancePanel({ lang = 'zh-TW' }: { lang?: Lang }) {
    const t = COPY[lang];
    const incomeCats = INCOME_CATS[lang];
    const expenseCats = EXPENSE_CATS[lang];

    const [month, setMonth] = useState(currentMonth());
    const [txns, setTxns] = useState<Transaction[]>([]);
    const [budget, setBudget] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingBudget, setEditingBudget] = useState(false);
    const [budgetInput, setBudgetInput] = useState('');
    const [newTxn, setNewTxn] = useState<NewTxn>({
        type: 'income', category: incomeCats[0], description: '', amount: '', date: todayStr(),
    });

    const load = useCallback(async () => {
        setLoading(true);
        const [tRes, bRes] = await Promise.all([
            fetch(`/api/finance/transactions?month=${month}`),
            fetch(`/api/finance/budget?month=${month}`),
        ]);
        if (tRes.ok) setTxns((await tRes.json()) as Transaction[]);
        if (bRes.ok) { const d = (await bRes.json()) as { amount: number }; setBudget(d.amount); setBudgetInput(String(d.amount)); }
        setLoading(false);
    }, [month]);

    useEffect(() => { load(); }, [load]);

    // ── Summary calculations ───────────────────────────────────────
    const income   = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance  = income - expenses;
    const budgetPct = budget > 0 ? Math.min((expenses / budget) * 100, 100) : 0;
    const overBudget = budget > 0 && expenses > budget;

    // ── Handlers ──────────────────────────────────────────────────
    async function handleAdd() {
        if (!newTxn.description || !newTxn.amount || !newTxn.date) return;
        setSaving(true);
        const payload = `type=${newTxn.type}|category=${newTxn.category}|date=${newTxn.date}|amount=${newTxn.amount}|description=${newTxn.description}`;
        const res = await fetch('/api/finance/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: payload,
        });
        if (res.ok) {
            setNewTxn({ type: 'income', category: incomeCats[0], description: '', amount: '', date: todayStr() });
            setShowForm(false);
            await load();
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm(t.confirmDel)) return;
        await fetch(`/api/finance/transactions/${id}`, { method: 'DELETE' });
        setTxns(prev => prev.filter(t => t.id !== id));
    }

    async function handleSaveBudget() {
        const num = Number(budgetInput);
        if (!isFinite(num) || num < 0) return;
        await fetch('/api/finance/budget', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, amount: num }),
        });
        setBudget(num);
        setEditingBudget(false);
    }

    // When type changes, reset category
    function handleTypeChange(typeVal: 'income' | 'expense') {
        setNewTxn(prev => ({ ...prev, type: typeVal, category: typeVal === 'income' ? incomeCats[0] : expenseCats[0] }));
    }

    return (
        <div className="dash-panel">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="connect-row">
                <h2>{t.title}</h2>
                <div className="month-selector">
                    <input type="month" value={month}
                        onChange={e => setMonth(e.target.value)}
                        max={currentMonth()} />
                </div>
            </div>

            {loading ? (
                <div className="panel-spinner"><div className="spin-icon" /> {t.loading}</div>
            ) : (
                <>
                    {/* ── Summary cards ────────────────────────────── */}
                    <div className="stat-cards">
                        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg,#00e682,#00bfff)' } as React.CSSProperties}>
                            <div className="stat-card-label">{t.income}</div>
                            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>{fmtTWD(income)}</div>
                            <div className="stat-card-sub">{txns.filter(tx => tx.type === 'income').length} {t.records}</div>
                        </div>
                        <div className="stat-card" style={{ '--card-accent': 'linear-gradient(90deg,#ff006e,#ff4d7d)' } as React.CSSProperties}>
                            <div className="stat-card-label">{t.expense}</div>
                            <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>{fmtTWD(expenses)}</div>
                            <div className="stat-card-sub">{txns.filter(tx => tx.type === 'expense').length} {t.records}</div>
                        </div>
                        <div className="stat-card" style={{ '--card-accent': `linear-gradient(90deg,${balance >= 0 ? '#00d9ff,#6f00ff' : '#ff4d7d,#ff006e'})` } as React.CSSProperties}>
                            <div className="stat-card-label">{t.balance}</div>
                            <div className="stat-card-value" style={{ fontSize: '1.4rem', '--webkit-text-fill-color': balance >= 0 ? undefined : '#ff4d7d' } as React.CSSProperties}>
                                {balance >= 0 ? '' : '-'}{fmtTWD(Math.abs(balance))}
                            </div>
                            <div className="stat-card-sub">{balance >= 0 ? t.surplus : t.deficit}</div>
                        </div>
                        {/* Budget card */}
                        <div className="stat-card" style={{ '--card-accent': overBudget ? 'linear-gradient(90deg,#ff006e,#ff4d7d)' : 'linear-gradient(90deg,#ffb700,#ff7849)' } as React.CSSProperties}>
                            <div className="stat-card-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t.budget}</span>
                                <button onClick={() => setEditingBudget(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem', padding: 0 }}>{t.set}</button>
                            </div>
                            {editingBudget ? (
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                                    <input className="panel-form-input" type="number" min="0" value={budgetInput}
                                        onChange={e => setBudgetInput(e.target.value)}
                                        style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveBudget()} />
                                    <button className="panel-btn panel-btn-primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                                        onClick={handleSaveBudget}>✓</button>
                                    <button className="panel-btn panel-btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                                        onClick={() => setEditingBudget(false)}>✕</button>
                                </div>
                            ) : (
                                <>
                                    <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
                                        {budget > 0 ? fmtTWD(budget) : '—'}
                                    </div>
                                    {budget > 0 && (
                                        <>
                                            <div className="stat-card-sub">
                                                {overBudget ? t.overBudget : `${t.used} ${budgetPct.toFixed(0)}%`}
                                            </div>
                                            <div className="progress-bar-wrap">
                                                <div className={`progress-bar-fill${overBudget ? ' over-budget' : ''}`}
                                                    style={{ width: `${budgetPct}%` }} />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Add transaction ──────────────────────────── */}
                    <div className="panel-section">
                        {!showForm ? (
                            <button className="panel-btn panel-btn-primary" onClick={() => setShowForm(true)}>
                                {t.addRecordBtn}
                            </button>
                        ) : (
                            <div className="panel-form">
                                <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.88rem' }}>{t.addTitle}</div>
                                <div className="panel-form-row">
                                    {/* Type */}
                                    <div className="panel-form-field">
                                        <label className="panel-form-label">{t.type}</label>
                                        <select className="panel-form-select" value={newTxn.type}
                                            onChange={e => handleTypeChange(e.target.value as 'income' | 'expense')}>
                                            <option value="income">{t.typeIncome}</option>
                                            <option value="expense">{t.typeExpense}</option>
                                        </select>
                                    </div>
                                    {/* Category */}
                                    <div className="panel-form-field">
                                        <label className="panel-form-label">{t.category}</label>
                                        <select className="panel-form-select" value={newTxn.category}
                                            onChange={e => setNewTxn(p => ({ ...p, category: e.target.value }))}>
                                            {(newTxn.type === 'income' ? incomeCats : expenseCats).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Date */}
                                    <div className="panel-form-field">
                                        <label className="panel-form-label">{t.date}</label>
                                        <input className="panel-form-input" type="date" value={newTxn.date}
                                            onChange={e => setNewTxn(p => ({ ...p, date: e.target.value }))} />
                                    </div>
                                    {/* Amount */}
                                    <div className="panel-form-field">
                                        <label className="panel-form-label">{t.amount}</label>
                                        <input className="panel-form-input" type="number" min="1" placeholder="0"
                                            value={newTxn.amount}
                                            onChange={e => setNewTxn(p => ({ ...p, amount: e.target.value }))} />
                                    </div>
                                </div>
                                {/* Description */}
                                <div className="panel-form-field" style={{ marginBottom: '1rem' }}>
                                    <label className="panel-form-label">{t.desc}</label>
                                    <input className="panel-form-input" type="text" placeholder={t.descPlaceholder}
                                        value={newTxn.description} maxLength={200}
                                        onChange={e => setNewTxn(p => ({ ...p, description: e.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="panel-btn panel-btn-primary" onClick={handleAdd}
                                        disabled={saving || !newTxn.description || !newTxn.amount}>
                                        {saving ? t.saving : t.save}
                                    </button>
                                    <button className="panel-btn panel-btn-secondary"
                                        onClick={() => setShowForm(false)}>{t.cancel}</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Transaction table ────────────────────────── */}
                    <div className="panel-section">
                        <div className="panel-section-title">{month} {lang === 'zh-TW' ? `交易記錄（${txns.length} 筆）` : `Transactions (${txns.length})`}</div>
                        {txns.length === 0 ? (
                            <p style={{ color: '#6b7fa3', fontSize: '0.88rem' }}>{t.emptyList}</p>
                        ) : (
                            <div className="panel-table-wrap">
                                <table className="panel-table">
                                    <thead>
                                        <tr>
                                            <th>{t.tableDate}</th>
                                            <th>{t.tableType}</th>
                                            <th>{t.tableCat}</th>
                                            <th>{t.tableDesc}</th>
                                            <th style={{ textAlign: 'right' }}>{t.tableAmount}</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {txns.map(tx => (
                                            <tr key={tx.id}>
                                                <td style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(tx.date)}</td>
                                                <td>
                                                    <span className={`panel-badge ${tx.type === 'income' ? 'panel-badge-green' : 'panel-badge-red'}`}>
                                                        {tx.type === 'income' ? t.typeIncome : t.typeExpense}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#94a3b8' }}>{tx.category}</td>
                                                <td>{tx.description}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                                                    color: tx.type === 'income' ? '#00e682' : '#ff4d7d' }}>
                                                    {tx.type === 'income' ? '+' : '-'}{fmtTWD(tx.amount)}
                                                </td>
                                                <td>
                                                    <button className="panel-btn panel-btn-danger"
                                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                        onClick={() => handleDelete(tx.id)}>{t.del}</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
