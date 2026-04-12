import React, { useState, useEffect } from 'react';
import { fetchMyWallets as apiFetchWallet, fetchMyCreatorOrders, getUserData } from '../api';
import { Wallet, Clock, ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import './WalletPage.css';

const WalletPage = () => {
    const [wallet, setWallet] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const userData = getUserData();

    useEffect(() => {
        (async () => {
            try {
                const [wRes, oRes] = await Promise.all([apiFetchWallet(), fetchMyCreatorOrders()]);
                if (wRes.ok) setWallet(wRes.data.results?.[0] || wRes.data?.[0] || wRes.data || null);
                if (oRes.ok) setOrders((oRes.data.results || oRes.data || []).filter(o => o.status === 'completed'));
            } catch (err) {
                console.error('Failed to load wallet:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const balance = parseFloat(wallet?.balance || 0);
    const pendingClearance = parseFloat(wallet?.pending || 0);
    const withdrawn = parseFloat(wallet?.withdrawn || 0);
    const maskedAccount = '******' + (userData?.phone?.slice(-4) || '2398');

    return (
        <main className="wallet-page">
            <div className="wallet-breadcrumb">
                <span className="wallet-bc-muted">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="wallet-bc-sep">/</span>
                <span className="wallet-bc-active">Wallet</span>
            </div>

            <h1 className="wallet-title">Earnings & Withdrawals</h1>

            {loading ? (
                <>
                    {/* Skeleton Balance Card */}
                    <div className="wallet-balance-card" style={{ minHeight: 200 }}>
                        <div className="wallet-balance-inner">
                            <div className="skeleton skeleton--light" style={{ width: 160, height: 16, marginBottom: 14 }}></div>
                            <div className="skeleton skeleton--light" style={{ height: 42, width: 220, marginBottom: 10, borderRadius: 8 }}></div>
                            <div className="skeleton skeleton--light" style={{ width: 120, height: 16, marginBottom: 20 }}></div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div className="skeleton skeleton--light" style={{ width: 130, height: 40, borderRadius: 8 }}></div>
                                <div className="skeleton skeleton--light" style={{ width: 140, height: 40, borderRadius: 8 }}></div>
                            </div>
                        </div>
                    </div>
                    {/* Skeleton Stat Cards */}
                    <div className="wallet-stats">
                        {[0,1].map(i => (
                            <div key={i} className="wallet-stat-card">
                                <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 12 }}></div>
                                <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
                                    <div className="skeleton" style={{ width: 130, height: 28 }}></div>
                                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Skeleton Activity */}
                    <section>
                        <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
                            <div className="skeleton" style={{ width: 130, height: 20 }}></div>
                            <div className="skeleton" style={{ width: 70, height: 16 }}></div>
                        </div>
                        <div className="wallet-activity-list">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="wallet-activity-item" style={{ pointerEvents: 'none' }}>
                                    <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}></div>
                                    <div className="wallet-activity-info" style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ width: `${130 + (i%3)*30}px`, height: 16, marginBottom: 6 }}></div>
                                        <div className="skeleton" style={{ width: `${90 + (i%4)*20}px`, height: 14 }}></div>
                                    </div>
                                    <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 6 }}></div>
                                </div>
                            ))}
                        </div>
                    </section>
                    {/* Skeleton Payout Methods */}
                    <section>
                        <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
                            <div className="skeleton" style={{ width: 140, height: 20 }}></div>
                            <div className="skeleton" style={{ width: 110, height: 34, borderRadius: 8 }}></div>
                        </div>
                        <div className="wallet-payout-list">
                            {[0,1].map(i => (
                                <div key={i} className="wallet-payout-item" style={{ pointerEvents: 'none' }}>
                                    <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }}></div>
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ width: `${70 + i*25}px`, height: 16, marginBottom: 6 }}></div>
                                        <div className="skeleton" style={{ width: `${100 + i*20}px`, height: 14 }}></div>
                                    </div>
                                    <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }}></div>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            ) : (
                <>
                    {/* Balance Card */}
                    <div className="wallet-balance-card">
                        <div className="wallet-balance-inner">
                            <div className="wallet-balance-top">
                                <div className="wallet-balance-label"><Wallet size={16} /> Available for Withdrawal</div>
                                <div className="wallet-balance-toggle"></div>
                            </div>
                            <p className="wallet-balance-amount">₱{balance.toFixed(2)}</p>
                            <p className="wallet-balance-account">{maskedAccount}</p>
                            <div className="wallet-balance-actions">
                                <button className="wallet-btn-outline">Withdraw Funds</button>
                                <button className="wallet-btn-outline">Add Payout Method</button>
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="wallet-stats">
                        <div className="wallet-stat-card">
                            <p className="wallet-stat-label">PENDING CLEARANCE</p>
                            <div className="wallet-stat-row">
                                <p className="wallet-stat-value">₱{pendingClearance.toFixed(2)}</p>
                                <Clock size={20} className="wallet-stat-icon wallet-stat-icon--yellow" />
                            </div>
                        </div>
                        <div className="wallet-stat-card">
                            <p className="wallet-stat-label">WITHDRAWN FUNDS</p>
                            <div className="wallet-stat-row">
                                <p className="wallet-stat-value">₱{withdrawn.toFixed(2)}</p>
                                <ArrowUpRight size={20} className="wallet-stat-icon wallet-stat-icon--green" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <section>
                        <h2 className="wallet-section-title">Recent Activity</h2>
                        <div className="wallet-activity-list">
                            {orders.length > 0 ? orders.slice(0, 5).map(o => (
                                <div key={o.id} className="wallet-activity-item">
                                    <div className="wallet-activity-icon"><ArrowUpRight size={16} /></div>
                                    <div className="wallet-activity-info">
                                        <h4>Payment from {o.client_display_name || o.client_name || o.client_id}</h4>
                                        <p>Order #{o.id} • {o.updated_at ? new Date(o.updated_at).toLocaleDateString() : ''}</p>
                                    </div>
                                    <div className="wallet-activity-amount">
                                        <span className="wallet-amount-green">+₱{parseFloat(o.price || 0).toFixed(2)}</span>
                                        <span className="wallet-activity-type">Invoice</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="wallet-empty">No recent activity.</p>
                            )}
                        </div>
                    </section>

                    {/* Payout Methods */}
                    <section>
                        <div className="wallet-section-header">
                            <h2 className="wallet-section-title">Payout Methods</h2>
                            <button className="wallet-add-btn"><Plus size={14} /> Add Method</button>
                        </div>
                        <div className="wallet-payout-list">
                            <div className="wallet-payout-item">
                                <div className="wallet-payout-icon">G</div>
                                <div className="wallet-payout-info">
                                    <h4>GCash</h4>
                                    <p>{userData?.phone || '09*****2398'}</p>
                                </div>
                                <button className="wallet-payout-delete"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </main>
    );
};

export default WalletPage;
