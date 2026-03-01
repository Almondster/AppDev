import React, { useState } from 'react';

const OrdersPage = () => {
    const [filter, setFilter] = useState('All');

    // Sample component-level state orders
    const orders = [
        { id: 'ORD-001', service: 'Logo Design', status: 'Completed', amount: '₱2,500' },
        { id: 'ORD-002', service: 'Website Mockup', status: 'Pending', amount: '₱7,500' },
        { id: 'ORD-003', service: 'Social Media Assets', status: 'Completed', amount: '₱1,500' }
    ];

    const filteredOrders = filter === 'All'
        ? orders
        : orders.filter(o => o.status === filter);

    return (
        <section className="section page-fade">
            <header className="section__header">
                <h2 className="section__title">My Orders</h2>
                <div className="filter-group">
                    {['All', 'Pending', 'Completed'].map(f => (
                        <button
                            key={f}
                            className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="card-grid">
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                    <div key={order.id} className="card card--clickable">
                        <div className="card__header">
                            <h3 className="card__title">{order.service}</h3>
                            <span className={`badge badge--${order.status.toLowerCase()}`}>{order.status}</span>
                        </div>
                        <div className="card__body">
                            <p><strong>Order ID:</strong> {order.id}</p>
                            <p><strong>Amount:</strong> {order.amount}</p>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state">
                        <p>No orders found for the selected filter.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default OrdersPage;
