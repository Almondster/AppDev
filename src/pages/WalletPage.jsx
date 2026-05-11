import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Plus, CreditCard, Trash2, DollarSign } from 'lucide-react';
import { getUserData, fetchMyOrders, fetchMyCreatorOrders, fetchMyWallets, fetchMyWithdrawals, createWallet, deleteWallet, createWithdrawal } from '../api';
import ConfirmModal from '../components/ConfirmModal';

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
                    isCreator ? fetchMyWithdrawals() : Promise.resolve({ ok: true, data: [] }),
                ]);

                if (oRes.ok) {
                    const orderRows = oRes.data.results || oRes.data || [];
                    setOrders(orderRows);
                    if (isCreator) {
                        const completed = orderRows.filter(o => o.status === 'completed');
                        const pending = orderRows.filter(o => ['in_progress', 'delivered', 'accepted'].includes(o.status));
                        const totalEarned = completed.reduce((sum, o) => sum + parseFloat(o.price || 0), 0);
                        setPendingBalance(pending.reduce((sum, o) => sum + parseFloat(o.price || 0), 0));

                        let totalWithdrawn = 0;
                        if (xRes.ok) {
                            const ws = xRes.data.results || xRes.data || [];
                            setWithdrawals(ws);
                            totalWithdrawn = ws.filter(w => w.status !== 'rejected').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
                        }
                        setBalance(Math.max(0, totalEarned - totalWithdrawn));
                    } else {
                        const refundable = orderRows.filter(o => ['pending', 'accepted', 'in_progress', 'delivered', 'completed'].includes(o.status));
                        const refunded = orderRows.filter(o => (o.escrow_status || '').toLowerCase() === 'refunded');
                        const totalSpent = refundable.reduce((sum, o) => sum + parseFloat(o.price || 0), 0);
                        const totalRefunded = refunded.reduce((sum, o) => sum + parseFloat(o.price || 0), 0);
                        setBalance(Math.max(0, totalSpent - totalRefunded));
                        setPendingBalance(totalRefunded);
                    }
                }

                if (wRes.ok) setWallets(wRes.data.results || wRes.data || []);
            } catch (err) {
                console.error('Wallet load error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [isCreator]);

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
            <div className="grid grid-cols-3 gap-6">
                {[0,1,2].map(i => (
                    <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-24 rounded bg-white/5"></div>
                            <div className="h-7 w-32 rounded bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <div className="h-6 w-40 rounded bg-white/10"></div>
                {[0,1].map(i => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
                        <div className="flex-1 space-y-2">
                            <div className={`h-4 rounded bg-white/10`} style={{ width: `${50 + i * 15}%` }}></div>
                            <div className={`h-3 rounded bg-white/5`} style={{ width: `${30 + i * 10}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <div className="h-6 w-48 rounded bg-white/10"></div>
                {[0,1,2].map(i => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                            <div className={`h-4 rounded bg-white/10`} style={{ width: `${40 + i * 12}%` }}></div>
                            <div className={`h-3 rounded bg-white/5`} style={{ width: `${25 + i * 8}%` }}></div>
                        </div>
                        <div className="h-6 w-20 rounded-full bg-white/5"></div>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <main className="p-8 max-w-4xl mx-auto space-y-8 pb-20 relative">
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500/90 text-white px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    {toast}
                </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500">{isCreator ? 'Creator Workspace' : 'Client Workspace'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-white font-medium">{isCreator ? 'Earnings' : 'Billing'}</span>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{isCreator ? 'Earnings' : 'Billing'}</h1>
                    <p className="text-sm text-zinc-400">
                        {isCreator
                            ? 'Track your earnings, manage withdrawals, and set up payout methods.'
                            : 'Manage your billing, payment methods, and transaction history.'}
                    </p>
                </div>
                {!loading && isCreator && (
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setShowWithdrawModal(true)} disabled={wallets.length === 0}>
                            <ArrowUpCircle size={16} /> Withdraw
                        </button>
                        <button className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium flex items-center gap-2 transition-colors" onClick={() => setShowPayoutModal(true)}>
                            <Plus size={16} /> Add Payout
                        </button>
                    </div>
                )}
            </div>

            {loading ? renderSkeleton() : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><DollarSign size={24} /></div>
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">{isCreator ? 'Available Balance' : 'Total Spent'}</p>
                                <p className="text-2xl font-bold text-white">₱{balance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400"><ArrowDownCircle size={24} /></div>
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">{isCreator ? 'Pending' : 'Total Refunded'}</p>
                                <p className="text-2xl font-bold text-white">₱{pendingBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><ArrowUpCircle size={24} /></div>
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">{isCreator ? 'Total Withdrawn' : 'Completed Orders'}</p>
                                <p className="text-2xl font-bold text-white">{isCreator ? `₱${totalWithdrawn.toLocaleString()}` : orders.filter(o => o.status === 'completed').length}</p>
                            </div>
                        </div>
                    </div>

                    {isCreator ? (
                        <>
                            {/* Payout Methods */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-white">Payout Methods</h2>
                                <div className="space-y-3">
                                    {wallets.length > 0 ? wallets.map(w => (
                                        <div key={w.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4 hover:bg-white/[0.03] transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400"><CreditCard size={18} /></div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-white">{w.wallet_type}</h4>
                                                <p className="text-xs text-zinc-500">{w.account_name} • {w.account_number}</p>
                                            </div>
                                            <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors" onClick={() => setDeleteConfirm({ open: true, id: w.id })}>
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-zinc-500 text-center py-8">No payout methods yet. Add one to withdraw funds.</p>
                                    )}
                                </div>
                            </div>

                            {/* Withdrawal History */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-white">Withdrawal History</h2>
                                <div className="space-y-3">
                                    {withdrawals.length > 0 ? withdrawals.map(w => (
                                        <div key={w.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                                            <div>
                                                <h4 className="text-sm font-medium text-white">₱{parseFloat(w.amount || 0).toLocaleString()}</h4>
                                                <p className="text-xs text-zinc-500">{w.method_type} • {w.account_details}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                                    w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    w.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    w.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-zinc-500/10 text-zinc-400'
                                                }`}>{w.status || 'pending'}</span>
                                                <span className="text-xs text-zinc-600">{w.created_at ? new Date(w.created_at).toLocaleDateString() : ''}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-zinc-500 text-center py-8">No withdrawals yet.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-white">Charges & Payments</h2>
                                <div className="space-y-3">
                                    {orders.length > 0 ? orders
                                        .filter(o => (o.escrow_status || '').toLowerCase() !== 'refunded')
                                        .slice(0, 20)
                                        .map(o => (
                                            <div key={o.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                                                <div>
                                                    <h4 className="text-sm font-medium text-white">{o.service_title || `Order #${o.id}`}</h4>
                                                    <p className="text-xs text-zinc-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                                        o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        o.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                                                        o.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-zinc-500/10 text-zinc-400'
                                                    }`}>{o.status || 'pending'}</span>
                                                    <span className="text-sm font-medium text-red-400">- ₱{parseFloat(o.price || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )) : (
                                        <p className="text-sm text-zinc-500 text-center py-8">No payment charges yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-white">Refund Timeline</h2>
                                <div className="space-y-3">
                                    {orders.filter(o => (o.escrow_status || '').toLowerCase() === 'refunded').length > 0 ? orders
                                        .filter(o => (o.escrow_status || '').toLowerCase() === 'refunded')
                                        .slice(0, 20)
                                        .map(o => (
                                            <div key={`refund-${o.id}`} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                                                <div>
                                                    <h4 className="text-sm font-medium text-white">{o.service_title || `Order #${o.id}`}</h4>
                                                    <p className="text-xs text-zinc-500">{o.updated_at ? new Date(o.updated_at).toLocaleDateString() : (o.created_at ? new Date(o.created_at).toLocaleDateString() : '')}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">refunded</span>
                                                    <span className="text-sm font-medium text-emerald-400">+ ₱{parseFloat(o.price || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )) : (
                                        <p className="text-sm text-zinc-500 text-center py-8">No refunds processed yet.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ═══ Add Payout Modal ═══ */}
            {isCreator && showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPayoutModal(false)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                    <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-medium text-white mb-6">Add Payout Method</h3>
                        <form onSubmit={handleAddPayout} className="space-y-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-2">Wallet Type</label>
                                <select value={payoutForm.wallet_type} onChange={e => setPayoutForm(p => ({ ...p, wallet_type: e.target.value }))} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20">
                                    <option value="GCash">GCash</option>
                                    <option value="Maya">Maya (PayMaya)</option>
                                    <option value="BankTransfer">Bank Transfer</option>
                                    <option value="PayPal">PayPal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-2">Account Name</label>
                                <input value={payoutForm.account_name} onChange={e => setPayoutForm(p => ({ ...p, account_name: e.target.value }))} placeholder="Juan Dela Cruz" required className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-2">Account Number</label>
                                <input value={payoutForm.account_number} onChange={e => setPayoutForm(p => ({ ...p, account_number: e.target.value }))} placeholder="09XXXXXXXXX" required className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors" onClick={() => setShowPayoutModal(false)}>Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50" disabled={payoutLoading}>
                                    {payoutLoading ? 'Adding...' : 'Add Method'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ Withdraw Modal ═══ */}
            {isCreator && showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowWithdrawModal(false)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                    <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-medium text-white mb-2">Withdraw Funds</h3>
                        <p className="text-sm text-zinc-400 mb-6">Available: <strong className="text-white">₱{balance.toLocaleString()}</strong></p>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-2">Amount (₱)</label>
                                <input type="number" min="1" max={balance} step="0.01" value={withdrawForm.amount}
                                    onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" required className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-2">Payout Method</label>
                                <select value={withdrawForm.wallet_id} onChange={e => setWithdrawForm(p => ({ ...p, wallet_id: e.target.value }))} required className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20">
                                    <option value="">Select a method</option>
                                    {wallets.map(w => (
                                        <option key={w.id} value={w.id}>{w.wallet_type} • {w.account_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50" disabled={withdrawLoading}>
                                    {withdrawLoading ? 'Processing...' : 'Withdraw'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isCreator && (
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
            )}
        </main>
    );
};

export default WalletPage;
