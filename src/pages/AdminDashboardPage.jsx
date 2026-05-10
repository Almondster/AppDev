import React, { useState, useEffect } from 'react';
import { Users, BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';
import { fetchUsers as apiFetchUsers, fetchOrders as apiFetchOrders, fetchSupportTickets as apiFetchTickets } from '../api';

const AdminDashboardPage = () => {
    const [userCount, setUserCount] = useState(0);
    const [orderCount, setOrderCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [ticketCount, setTicketCount] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [uRes, oRes, tRes] = await Promise.all([apiFetchUsers(), apiFetchOrders(), apiFetchTickets()]);
                if (uRes.ok) {
                    const users = uRes.data.results || uRes.data || [];
                    setUserCount(users.length);
                }
                if (oRes.ok) {
                    const orders = oRes.data.results || oRes.data || [];
                    setOrderCount(orders.length);
                    setTotalRevenue(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.price || 0), 0));
                    setRecentOrders(orders.slice(0, 3));
                }
                if (tRes.ok) {
                    const tickets = tRes.data.results || tRes.data || [];
                    setTicketCount(tickets.length);
                }
            } catch (err) {
                console.error('Admin dashboard error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <header className="hero-gradient" style={{ padding: '3rem 2rem', background: 'linear-gradient(to right, rgba(244, 63, 94, 0.2), rgba(168, 85, 247, 0.2))' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={36} color="#f43f5e" /> Admin Command
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Platform health, active disputes, and user metrics.</p>
            </header>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '1rem', borderRadius: '16px' }}><Users size={28} /></div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{loading ? '...' : userCount}</p>
                    </div>
                </div>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '1rem', borderRadius: '16px' }}><BarChart3 size={28} /></div>
                    <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Revenue</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>₱{loading ? '...' : totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="glass-card glass-card--hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1rem', borderRadius: '16px' }}><AlertTriangle size={28} /></div>
                    <div>
                        <p style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support Tickets</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f87171', margin: 0 }}>{loading ? '...' : ticketCount}</p>
                    </div>
                </div>
            </section>

            <section className="glass-card">
                <div className="glass-card-header">
                    <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Recent Orders ({orderCount} total)</h2>
                </div>
                <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recentOrders.map(order => (
                        <div key={order.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '4px' }}>{order.service_title || 'Untitled service'}</h3>
                                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>₱{parseFloat(order.price || 0).toLocaleString()} • {order.status}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {recentOrders.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>No orders found.</div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default AdminDashboardPage;
