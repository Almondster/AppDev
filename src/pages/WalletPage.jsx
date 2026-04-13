import { useState, useEffect, useCallback } from 'react';
import { Wallet, ArrowUpRight, Plus, CreditCard, History } from 'lucide-react';
import { fetchWallets, fetchWithdrawals, fetchPaymentMethods, createWithdrawal } from '../services/api';
import '../styles/WalletPage.css';

const WalletPage = ({ userRole, firebaseUid }) => {
    const [wallets, setWallets] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUid) return;
        setLoading(true);
        Promise.all([
            fetchWallets({ user_id: firebaseUid }).catch(() => []),
            fetchWithdrawals({ user_id: firebaseUid }).catch(() => []),
            fetchPaymentMethods({ user_id: firebaseUid }).catch(() => []),
        ]).then(([wData, wrData, pmData]) => {
            setWallets(wData?.results || wData || []);
            setWithdrawals(wrData?.results || wrData || []);
            setPaymentMethods(pmData?.results || pmData || []);
        }).finally(() => setLoading(false));
    }, [firebaseUid]);

    // Calculate balance from completed withdrawals
    const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

    const handleWithdraw = useCallback(async (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) return;

        try {
            const wallet = wallets[0];
            await createWithdrawal({
                user_id: firebaseUid,
                amount: numAmount,
                method_type: wallet?.wallet_type || 'bank',
                account_details: wallet ? `${wallet.account_name} - ${wallet.account_number}` : 'Default',
            });
            setAmount('');
            // Refresh withdrawals
            const wrData = await fetchWithdrawals({ user_id: firebaseUid });
            setWithdrawals(wrData?.results || wrData || []);
            alert(`Withdrawal request of ₱${numAmount.toFixed(2)} submitted!`);
        } catch (err) {
            alert(`Withdrawal failed: ${err.message}`);
        }
    }, [amount, firebaseUid, wallets]);

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            {/* Header */}
            <div className="glass-card hero-gradient" style={{ padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Wallet</h1>
                        <Wallet size={28} color="#3b82f6" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Manage your platform balance and transactions.</p>
                </div>
                <div style={{ background: 'var(--glass-overlay)', padding: '1.5rem 2.5rem', borderRadius: '16px', border: '1px solid var(--glass-overlay-border)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Payout Wallets</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{wallets.length}</h2>
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><p>Loading wallet data...</p></div>
            ) : (
                <>
                    {/* Wallets */}
                    {wallets.length > 0 && (
                        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                <CreditCard size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                Payout Methods
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {wallets.map(w => (
                                    <div key={w.id} style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: '0 0 4px' }}>{w.account_name}</p>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{w.wallet_type} • {w.account_number}</p>
                                        </div>
                                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', background: w.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', color: w.is_active ? '#22c55e' : '#6b7280' }}>
                                            {w.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Withdraw */}
                        {userRole !== 'client' && (
                            <div className="glass-card" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '0.5rem', borderRadius: '8px' }}>
                                        <ArrowUpRight size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Withdraw Funds</h3>
                                </div>
                                <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label htmlFor="withdrawAmount" style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Withdrawal Amount (₱)</label>
                                        <input id="withdrawAmount" type="number" step="0.01" min="0"
                                            style={{ width: '100%', background: 'var(--glass-overlay)', border: '1px solid var(--glass-overlay-border)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                                    </div>
                                    <button type="submit" style={{ background: '#3b82f6', color: '#fff', padding: '0.85rem', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' }}>
                                        Confirm Withdrawal
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Withdrawal History */}
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '0.5rem', borderRadius: '8px' }}>
                                    <History size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Withdrawal History</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {withdrawals.length > 0 ? withdrawals.map(w => (
                                    <div key={w.id} style={{ padding: '0.75rem 1rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: '0 0 2px', fontSize: '0.95rem' }}>₱{parseFloat(w.amount || 0).toLocaleString()}</p>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>{w.method_type} • {w.created_at ? new Date(w.created_at).toLocaleDateString() : ''}</p>
                                        </div>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                            background: w.status === 'completed' ? 'rgba(34,197,94,0.1)' : w.status === 'pending' ? 'rgba(250,204,21,0.1)' : 'rgba(107,114,128,0.1)',
                                            color: w.status === 'completed' ? '#22c55e' : w.status === 'pending' ? '#facc15' : '#6b7280',
                                        }}>{w.status}</span>
                                    </div>
                                )) : (
                                    <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>No withdrawal history.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </main>
    );
};

export default WalletPage;
