import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Plus, CreditCard, Trash2, DollarSign } from 'lucide-react';
import { fetchMyWallets, fetchMyWithdrawals, createWallet, deleteWallet, createWithdrawal, fetchMyPaymentMethods, createPaymentMethod, deletePaymentMethod } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { readCollection } from '../utils/collections';
import { getCurrentUser } from '../utils/currentUser';
import { getOrderFetcherForRole, isPendingPayoutOrderStatus } from '../utils/orders';
import '../styles/WalletPage.css';

const WalletPage = ({ userRole }) => {
    const [balance, setBalance] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0);
    const [wallets, setWallets] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    // Add Payout Method modal
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ wallet_type: 'GCash', account_name: '', account_number: '' });
    const [payoutLoading, setPayoutLoading] = useState(false);

    // Add Payment Method modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [pmForm, setPmForm] = useState({ method_type: '', masked_number: '' });
    const [pmLoading, setPmLoading] = useState(false);

    // Withdraw modal
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({ amount: '', wallet_id: '' });
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    // Delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null });
    const [deleting, setDeleting] = useState(false);

    const userData = getCurrentUser();
    const isCreator = userRole === 'creator';

    useEffect(() => {
        (async () => {
            try {
                const [oRes, wRes, xRes, pRes] = await Promise.all([
                    getOrderFetcherForRole(userRole)(),
                    fetchMyWallets(),
                    fetchMyWithdrawals(),
                    !isCreator ? fetchMyPaymentMethods() : Promise.resolve({ ok: false }),
                ]);

                if (oRes.ok) {
                    const ordersData = readCollection(oRes);
                    setOrders(ordersData);
                    if (isCreator) {
                        const completed = ordersData.filter(o => o.status === 'completed');
                        const pending = ordersData.filter(o => isPendingPayoutOrderStatus(o.status));
                        const totalEarned = completed.reduce((sum, o) => sum + parseFloat(o.price || 0), 0);
                        setPendingBalance(pending.reduce((sum, o) => sum + parseFloat(o.price || 0), 0));

                        let totalWithdrawn = 0;
                        if (xRes.ok) {
                            const ws = readCollection(xRes);
                            setWithdrawals(ws);
                            totalWithdrawn = ws.filter(w => w.status !== 'rejected').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
                        }
                        setBalance(Math.max(0, totalEarned - totalWithdrawn));
                    } else {
                        const refundable = ordersData.filter(o => ['pending', 'accepted', 'in_progress', 'delivered', 'completed'].includes(o.status));
                        const refunded = ordersData.filter(o => (o.escrow_status || '').toLowerCase() === 'refunded');
                        const totalSpent = refundable.reduce((sum, o) => sum + parseFloat(o.price || 0), 0);
                        const totalRefunded = refunded.reduce((sum, o) => sum + parseFloat(o.price || 0), 0);
                        setBalance(Math.max(0, totalSpent - totalRefunded));
                        setPendingBalance(totalRefunded);
                    }
                }

                if (wRes.ok) setWallets(readCollection(wRes));
                if (pRes && pRes.ok) setPaymentMethods(readCollection(pRes));
            } catch (err) {
                console.error('Wallet load error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [isCreator, userRole]);

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

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setPmLoading(true);
        try {
            const { ok, data } = await createPaymentMethod({
                user_id: userData?.firebase_uid,
                method_type: pmForm.method_type,
                masked_number: pmForm.masked_number,
            });
            if (ok) {
                setPaymentMethods(prev => [...prev, data]);
                setShowPaymentModal(false);
                setPmForm({ method_type: '', masked_number: '' });
                showToast('Payment method added!');
            } else {
                showToast('Failed to add payment method.');
            }
        } catch { showToast('Connection error.'); }
        setPmLoading(false);
    };

    const handleDeleteItem = async () => {
        if (!deleteConfirm.id) return;
        setDeleting(true);
        try {
            if (deleteConfirm.type === 'wallet') {
                const { ok } = await deleteWallet(deleteConfirm.id);
                if (ok) {
                    setWallets(prev => prev.filter(w => w.id !== deleteConfirm.id));
                    showToast('Payout method removed.');
                }
            } else if (deleteConfirm.type === 'payment') {
                const { ok } = await deletePaymentMethod(deleteConfirm.id);
                if (ok) {
                    setPaymentMethods(prev => prev.filter(p => p.id !== deleteConfirm.id));
                    showToast('Payment method removed.');
                }
            }
        } catch { showToast('Failed to remove.'); }
        setDeleting(false);
        setDeleteConfirm({ open: false, type: '', id: null });
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
                {[0, 1, 2].map(i => (
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
                {[0, 1].map(i => (
                    <div key={i} className="earn-row-item">
                        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }}></div>
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: `${50 + i * 15}%`, height: 16, marginBottom: 6 }}></div>
                            <div className="skeleton" style={{ width: `${30 + i * 10}%`, height: 13 }}></div>
                        </div>
                    </div>
                ))}
            </div>
            {isCreator && (
                <div className="earn-section">
                    <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 16 }}></div>
                    {[0, 1, 2].map(i => (
                        <div key={i} className="earn-row-item">
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: `${40 + i * 12}%`, height: 16, marginBottom: 6 }}></div>
                                <div className="skeleton" style={{ width: `${25 + i * 8}%`, height: 13 }}></div>
                            </div>
                            <div className="skeleton" style={{ width: 70, height: 24, borderRadius: 12 }}></div>
                        </div>
                    ))}
                </div>
            )}
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
                        {isCreator ? (
                            <>
                                <button className="earn-action-btn earn-action-btn--primary" onClick={() => setShowWithdrawModal(true)} disabled={wallets.length === 0}>
                                    <ArrowUpCircle size={16} /> Withdraw
                                </button>
                                <button className="earn-action-btn earn-action-btn--outline" onClick={() => setShowPayoutModal(true)}>
                                    <Plus size={16} /> Add Payout
                                </button>
                            </>
                        ) : (
                            <button className="earn-action-btn earn-action-btn--outline" onClick={() => setShowPaymentModal(true)}>
                                <Plus size={16} /> Add Payment Method
                            </button>
                        )}
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
                                <p className="earn-stat-label">{isCreator ? 'Available Balance' : 'Total Spent'}</p>
                                <p className="earn-stat-value">₱{balance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="earn-stat-card">
                            <div className="earn-stat-icon earn-stat-icon--yellow"><ArrowDownCircle size={24} /></div>
                            <div>
                                <p className="earn-stat-label">{isCreator ? 'Pending' : 'Total Refunded'}</p>
                                <p className="earn-stat-value">₱{pendingBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="earn-stat-card">
                            <div className="earn-stat-icon earn-stat-icon--purple"><ArrowUpCircle size={24} /></div>
                            <div>
                                <p className="earn-stat-label">{isCreator ? 'Total Withdrawn' : 'Completed Orders'}</p>
                                <p className="earn-stat-value">{isCreator ? `₱${totalWithdrawn.toLocaleString()}` : orders.filter(o => o.status === 'completed').length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payout Methods (Creators only) */}
                    {isCreator && (
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
                                        <button className="earn-delete-btn" onClick={() => setDeleteConfirm({ open: true, type: 'wallet', id: w.id })}>
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </div>
                                )) : (
                                    <p className="earn-empty">No payout methods yet. Add one to withdraw funds.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment Methods (Clients only) */}
                    {!isCreator && (
                        <>
                            <div className="earn-section">
                                <h2 className="earn-section-title">Payment Methods</h2>
                                <div className="earn-section-list">
                                    {paymentMethods.length > 0 ? paymentMethods.map(pm => (
                                        <div key={pm.id} className="earn-row-item">
                                            <div className="earn-row-icon"><CreditCard size={18} /></div>
                                            <div className="earn-row-info">
                                                <h4>{pm.method_type}</h4>
                                                <p>•••• {pm.masked_number}</p>
                                            </div>
                                            <button className="earn-delete-btn" onClick={() => setDeleteConfirm({ open: true, type: 'payment', id: pm.id })}>
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    )) : (
                                        <p className="earn-empty">No payment methods yet. Add one to make payments.</p>
                                    )}
                                </div>
                            </div>

                            <div className="earn-section">
                                <h2 className="earn-section-title">Charges & Payments</h2>
                                <div className="earn-section-list">
                                    {orders.length > 0 ? orders
                                        .filter(o => (o.escrow_status || '').toLowerCase() !== 'refunded')
                                        .slice(0, 20)
                                        .map(o => (
                                            <div key={o.id} className="earn-row-item">
                                                <div className="earn-row-info">
                                                    <h4>{o.service_title || `Order #${o.id}`}</h4>
                                                    <p>{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</p>
                                                </div>
                                                <div className="earn-row-meta">
                                                    <span className={`earn-status earn-status--${o.status || 'pending'}`}>{o.status || 'pending'}</span>
                                                    <span className="earn-row-date" style={{ color: '#f87171', fontWeight: 600 }}>- ₱{parseFloat(o.price || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )) : (
                                        <p className="earn-empty">No payment charges yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="earn-section">
                                <h2 className="earn-section-title">Refund Timeline</h2>
                                <div className="earn-section-list">
                                    {orders.filter(o => (o.escrow_status || '').toLowerCase() === 'refunded').length > 0 ? orders
                                        .filter(o => (o.escrow_status || '').toLowerCase() === 'refunded')
                                        .slice(0, 20)
                                        .map(o => (
                                            <div key={`refund-${o.id}`} className="earn-row-item">
                                                <div className="earn-row-info">
                                                    <h4>{o.service_title || `Order #${o.id}`}</h4>
                                                    <p>{o.updated_at ? new Date(o.updated_at).toLocaleDateString() : (o.created_at ? new Date(o.created_at).toLocaleDateString() : '')}</p>
                                                </div>
                                                <div className="earn-row-meta">
                                                    <span className="earn-status earn-status--completed">refunded</span>
                                                    <span className="earn-row-date" style={{ color: '#34d399', fontWeight: 600 }}>+ ₱{parseFloat(o.price || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )) : (
                                        <p className="earn-empty">No refunds processed yet.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Withdrawal History (Creators only) */}
                    {isCreator && (
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
                    )}
                </>
            )}

            {/* ═══ Add Payout Modal ═══ */}
            {showPayoutModal && isCreator && (
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
            {showWithdrawModal && isCreator && (
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

            {/* ═══ Add Payment Method Modal (Clients) ═══ */}
            {showPaymentModal && !isCreator && (
                <div className="confirm-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="confirm-modal__title">Add Payment Method</h3>
                        <form onSubmit={handleAddPayment} className="earn-modal-form">
                            <div>
                                <label className="earn-form-label">Payment Type</label>
                                <input value={pmForm.method_type} onChange={e => setPmForm(p => ({ ...p, method_type: e.target.value }))} placeholder="e.g. GCash, Credit Card" required className="earn-form-input" />
                            </div>
                            <div>
                                <label className="earn-form-label">Account/Card Number (last 4 digits)</label>
                                <input value={pmForm.masked_number} onChange={e => setPmForm(p => ({ ...p, masked_number: e.target.value }))} placeholder="e.g. 1234" required className="earn-form-input" />
                            </div>
                            <div className="confirm-modal__actions">
                                <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="confirm-modal__btn confirm-modal__btn--confirm" disabled={pmLoading}>
                                    {pmLoading ? 'Adding...' : 'Add Method'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={deleteConfirm.open}
                title={deleteConfirm.type === 'wallet' ? "Remove Payout Method?" : "Remove Payment Method?"}
                message={deleteConfirm.type === 'wallet' ? "This payout method will be permanently removed." : "This payment method will be permanently removed."}
                variant="danger"
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDeleteItem}
                onCancel={() => setDeleteConfirm({ open: false, type: '', id: null })}
            />
        </main>
    );
};

export default WalletPage;
