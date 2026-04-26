import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Plus, CreditCard, Trash2, DollarSign } from 'lucide-react';
import { getUserData, fetchMyOrders, fetchMyCreatorOrders, fetchMyWallets, fetchMyWithdrawals, createWallet, deleteWallet, createWithdrawal } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import './WalletPage.css';

const WalletPage = ({ userRole }) => {
    const [balance, setBalance] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0);
    const [wallets, setWallets] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    // Add Payout Method modal
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ wallet_type: 'GCash', account_name: '', account_number: '' });
    const [payoutLoading, setPayoutLoading] = useState(false);

    // Withdraw modal
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({ amount: '', wallet_id: '' });
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    // Delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [deleting, setDeleting] = useState(false);

    const userData = getUserData();
    const isCreator = userRole === 'creator';

    useEffect(() => {
        (async () => {
            try {
                const ordersFetcher = isCreator ? fetchMyCreatorOrders : fetchMyOrders;
                const [oRes, wRes, xRes] = await Promise.all([
                    ordersFetcher(),
                    fetchMyWallets(),
                    fetchMyWithdrawals(),
                ]);

                if (oRes.ok) {
                    const orders = oRes.data.results || oRes.data || [];
                    const completed = orders.filter(o => o.status === 'completed');
                    const pending = orders.filter(o => ['in_progress', 'delivered', 'accepted'].includes(o.status));
                    const totalEarned = completed.reduce((sum, o) => sum + parseFloat(o.price || 0), 0);
                    setPendingBalance(pending.reduce((sum, o) => sum + parseFloat(o.price || 0), 0));

                    let totalWithdrawn = 0;
                    if (xRes.ok) {
                        const ws = xRes.data.results || xRes.data || [];
                        setWithdrawals(ws);
                        totalWithdrawn = ws.filter(w => w.status !== 'rejected').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
                    }
                    setBalance(Math.max(0, totalEarned - totalWithdrawn));
                }

                if (wRes.ok) setWallets(wRes.data.results || wRes.data || []);
            } catch (err) {
                console.error('Wallet load error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    const handleAddPayout = async (e) => {
        e.preventDefault();
        setPayoutLoading(true);
        try {
            const { ok, data } = await createWallet({
                user_id: userData?.firebase_uid,
                wallet_type: payoutForm.wallet_type,
                account_name: payoutForm.account_name,
                account_number: payoutForm.account_number,
            });
            if (ok) {
                setWallets(prev => [...prev, data]);
                setShowPayoutModal(false);
                setPayoutForm({ wallet_type: 'GCash', account_name: '', account_number: '' });
                showToast('Payout method added!');
            } else {
                showToast('Failed to add payout method.');
            }
        } catch { showToast('Connection error.'); }
        setPayoutLoading(false);
    };

    const handleDeleteWallet = async () => {
        if (!deleteConfirm.id) return;
        setDeleting(true);
        try {
            const { ok } = await deleteWallet(deleteConfirm.id);
            if (ok) {
                setWallets(prev => prev.filter(w => w.id !== deleteConfirm.id));
                showToast('Payout method removed.');
            }
        } catch { showToast('Failed to remove.'); }
        setDeleting(false);
        setDeleteConfirm({ open: false, id: null });
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const amount = parseFloat(withdrawForm.amount);
        if (!amount || amount <= 0 || amount > balance) {
            showToast('Invalid withdrawal amount.');
            return;
        }
        if (!withdrawForm.wallet_id) {
            showToast('Select a payout method.');
            return;
        }
        setWithdrawLoading(true);
        const wallet = wallets.find(w => w.id === parseInt(withdrawForm.wallet_id));
        try {
            const { ok, data } = await createWithdrawal({
                user_id: userData?.firebase_uid,
                amount: amount,
                method_type: wallet?.wallet_type || 'GCash',
                account_details: `${wallet?.account_name} - ${wallet?.account_number}`,
                status: 'pending',
            });
            if (ok) {
                setWithdrawals(prev => [...prev, data]);
                setBalance(prev => Math.max(0, prev - amount));
                setShowWithdrawModal(false);
                setWithdrawForm({ amount: '', wallet_id: '' });
                showToast(`Withdrawal of ₱${amount.toLocaleString()} submitted!`);
            } else {
                showToast('Withdrawal failed.');
            }
        } catch { showToast('Connection error.'); }
        setWithdrawLoading(false);
    };

    const totalWithdrawn = withdrawals.filter(w => w.status !== 'rejected').reduce((s, w) => s + parseFloat(w.amount || 0), 0);

    // ── Skeleton ──
    const renderSkeleton = () => (
        <>
            <div className="earn-stats">
                {[0,1,2].map(i => (
                    <div key={i} className="earn-stat-card">
                        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 14 }}></div>
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }}></div>
                            <div className="skeleton" style={{ width: '40%', height: 28 }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="earn-section">
                <div className="skeleton" style={{ width: 180, height: 20, marginBottom: 16 }}></div>
                {[0,1].map(i => (
                    <div key={i} className="earn-row-item">
                        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }}></div>
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: `${50 + i * 15}%`, height: 16, marginBottom: 6 }}></div>
                            <div className="skeleton" style={{ width: `${30 + i * 10}%`, height: 13 }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="earn-section">
                <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 16 }}></div>
                {[0,1,2].map(i => (
                    <div key={i} className="earn-row-item">
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: `${40 + i * 12}%`, height: 16, marginBottom: 6 }}></div>
                            <div className="skeleton" style={{ width: `${25 + i * 8}%`, height: 13 }}></div>
                        </div>
                        <div className="skeleton" style={{ width: 70, height: 24, borderRadius: 12 }}></div>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <main className="earn-page">
            {toast && <div className="global-toast global-toast--success">{toast}</div>}

            {/* Breadcrumb */}
            <div className="earn-breadcrumb">
                <span className="earn-bc-muted">{isCreator ? 'Creator Workspace' : 'Client Workspace'}</span>
                <span className="earn-bc-sep">/</span>
                <span className="earn-bc-active">{isCreator ? 'Earnings' : 'Billing'}</span>
            </div>

            {/* Header */}
            <div className="earn-header">
                <div>
                    <h1 className="earn-title">{isCreator ? 'Earnings' : 'Billing'}</h1>
                    <p className="earn-subtitle">
                        {isCreator
                            ? 'Track your earnings, manage withdrawals, and set up payout methods.'
                            : 'Manage your billing, payment methods, and transaction history.'}
                    </p>
                </div>
                {!loading && (
                    <div className="earn-header-actions">
                        <button className="earn-action-btn earn-action-btn--primary" onClick={() => setShowWithdrawModal(true)} disabled={wallets.length === 0}>
                            <ArrowUpCircle size={16} /> Withdraw
                        </button>
                        <button className="earn-action-btn earn-action-btn--outline" onClick={() => setShowPayoutModal(true)}>
                            <Plus size={16} /> Add Payout
                        </button>
                    </div>
                )}
            </div>

            {loading ? renderSkeleton() : (
                <>
                    {/* Stat Cards */}
                    <div className="earn-stats">
                        <div className="earn-stat-card">
                            <div className="earn-stat-icon earn-stat-icon--green"><DollarSign size={24} /></div>
                            <div>
                                <p className="earn-stat-label">Available Balance</p>
                                <p className="earn-stat-value">₱{balance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="earn-stat-card">
                            <div className="earn-stat-icon earn-stat-icon--yellow"><ArrowDownCircle size={24} /></div>
                            <div>
                                <p className="earn-stat-label">Pending</p>
                                <p className="earn-stat-value">₱{pendingBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="earn-stat-card">
                            <div className="earn-stat-icon earn-stat-icon--purple"><ArrowUpCircle size={24} /></div>
                            <div>
                                <p className="earn-stat-label">Total Withdrawn</p>
                                <p className="earn-stat-value">₱{totalWithdrawn.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payout Methods */}
                    <div className="earn-section">
                        <h2 className="earn-section-title">Payout Methods</h2>
                        <div className="earn-section-list">
                            {wallets.length > 0 ? wallets.map(w => (
                                <div key={w.id} className="earn-row-item">
                                    <div className="earn-row-icon"><CreditCard size={18} /></div>
                                    <div className="earn-row-info">
                                        <h4>{w.wallet_type}</h4>
                                        <p>{w.account_name} • {w.account_number}</p>
                                    </div>
                                    <button className="earn-delete-btn" onClick={() => setDeleteConfirm({ open: true, id: w.id })}>
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            )) : (
                                <p className="earn-empty">No payout methods yet. Add one to withdraw funds.</p>
                            )}
                        </div>
                    </div>

                    {/* Withdrawal History */}
                    <div className="earn-section">
                        <h2 className="earn-section-title">Withdrawal History</h2>
                        <div className="earn-section-list">
                            {withdrawals.length > 0 ? withdrawals.map(w => (
                                <div key={w.id} className="earn-row-item">
                                    <div className="earn-row-info">
                                        <h4>₱{parseFloat(w.amount || 0).toLocaleString()}</h4>
                                        <p>{w.method_type} • {w.account_details}</p>
                                    </div>
                                    <div className="earn-row-meta">
                                        <span className={`earn-status earn-status--${w.status || 'pending'}`}>{w.status || 'pending'}</span>
                                        <span className="earn-row-date">{w.created_at ? new Date(w.created_at).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="earn-empty">No withdrawals yet.</p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ═══ Add Payout Modal ═══ */}
            {showPayoutModal && (
                <div className="confirm-overlay" onClick={() => setShowPayoutModal(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="confirm-modal__title">Add Payout Method</h3>
                        <form onSubmit={handleAddPayout} className="earn-modal-form">
                            <div>
                                <label className="earn-form-label">Wallet Type</label>
                                <select value={payoutForm.wallet_type} onChange={e => setPayoutForm(p => ({ ...p, wallet_type: e.target.value }))} className="earn-form-input">
                                    <option value="GCash">GCash</option>
                                    <option value="Maya">Maya (PayMaya)</option>
                                    <option value="BankTransfer">Bank Transfer</option>
                                    <option value="PayPal">PayPal</option>
                                </select>
                            </div>
                            <div>
                                <label className="earn-form-label">Account Name</label>
                                <input value={payoutForm.account_name} onChange={e => setPayoutForm(p => ({ ...p, account_name: e.target.value }))} placeholder="Juan Dela Cruz" required className="earn-form-input" />
                            </div>
                            <div>
                                <label className="earn-form-label">Account Number</label>
                                <input value={payoutForm.account_number} onChange={e => setPayoutForm(p => ({ ...p, account_number: e.target.value }))} placeholder="09XXXXXXXXX" required className="earn-form-input" />
                            </div>
                            <div className="confirm-modal__actions">
                                <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={() => setShowPayoutModal(false)}>Cancel</button>
                                <button type="submit" className="confirm-modal__btn confirm-modal__btn--confirm" disabled={payoutLoading}>
                                    {payoutLoading ? 'Adding...' : 'Add Method'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ Withdraw Modal ═══ */}
            {showWithdrawModal && (
                <div className="confirm-overlay" onClick={() => setShowWithdrawModal(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="confirm-modal__title">Withdraw Funds</h3>
                        <p className="earn-modal-balance">Available: <strong>₱{balance.toLocaleString()}</strong></p>
                        <form onSubmit={handleWithdraw} className="earn-modal-form">
                            <div>
                                <label className="earn-form-label">Amount (₱)</label>
                                <input type="number" min="1" max={balance} step="0.01" value={withdrawForm.amount}
                                    onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" required className="earn-form-input" />
                            </div>
                            <div>
                                <label className="earn-form-label">Payout Method</label>
                                <select value={withdrawForm.wallet_id} onChange={e => setWithdrawForm(p => ({ ...p, wallet_id: e.target.value }))} required className="earn-form-input">
                                    <option value="">Select a method</option>
                                    {wallets.map(w => (
                                        <option key={w.id} value={w.id}>{w.wallet_type} • {w.account_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="confirm-modal__actions">
                                <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
                                <button type="submit" className="confirm-modal__btn confirm-modal__btn--success" disabled={withdrawLoading}>
                                    {withdrawLoading ? 'Processing...' : 'Withdraw'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={deleteConfirm.open}
                title="Remove Payout Method?"
                message="This payout method will be permanently removed."
                variant="danger"
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDeleteWallet}
                onCancel={() => setDeleteConfirm({ open: false, id: null })}
            />
        </main>
    );
};

export default WalletPage;
