import React, { useState } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, CreditCard } from 'lucide-react';

const WalletPage = ({ userRole }) => {
    const [balance, setBalance] = useState(150.00);
    const [amount, setAmount] = useState('');

    const handleWithdraw = (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) return;
        if (numAmount > balance) {
            alert('Insufficient funds');
            return;
        }
        setBalance(prev => prev - numAmount);
        setAmount('');
        alert(`Successfully withdrew ₱${numAmount.toFixed(2)}`);
    };

    const handleDeposit = (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) return;
        setBalance(prev => prev + numAmount);
        setAmount('');
        alert(`Successfully deposited ₱${numAmount.toFixed(2)}`);
    }

    return (
        <main className="dashboard-content page-fade" style={{ padding: '2rem 0' }}>
            {/* Header */}
            <div className="glass-card hero-gradient" style={{ padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0 }}>Wallet</h1>
                        <Wallet size={28} color="#3b82f6" />
                    </div>
                    <p style={{ color: '#a1a1aa', fontSize: '1rem', margin: 0 }}>Manage your platform balance and transactions.</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1.5rem 2.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Available Balance</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff', margin: 0 }}>₱{balance.toFixed(2)}</h2>
                </div>
            </div>

            {/* Action Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* Condition: Withdraw (Creators/Admins only) */}
                {userRole !== 'client' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '0.5rem', borderRadius: '8px' }}>
                                <ArrowUpRight size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Withdraw Funds</h3>
                        </div>
                        <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label htmlFor="withdrawAmount" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Withdrawal Amount (₱)</label>
                                <input
                                    id="withdrawAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={balance}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }}
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" style={{ background: '#3b82f6', color: '#fff', padding: '0.85rem', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' }}>
                                Confirm Withdrawal
                            </button>
                        </form>
                    </div>
                )}

                {/* Condition: Deposit (Clients mainly, but visible to all non-creators) */}
                {userRole !== 'creator' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.5rem', borderRadius: '8px' }}>
                                <Plus size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Deposit Funds</h3>
                        </div>
                        <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label htmlFor="depositAmount" style={{ display: 'block', color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Deposit Amount (₱)</label>
                                <input
                                    id="depositAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff' }}
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.85rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' }}>
                                Fund Wallet
                            </button>
                        </form>
                    </div>
                )}

            </div>

        </main>
    );
};

export default WalletPage;
