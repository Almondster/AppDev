import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import '../styles/OrdersPage.css';

const OrdersPage = ({ userRole = 'creator' }) => {
    const { orders } = useProjects();
    const [filter, setFilter] = useState('All');

    // Show relevant orders based on role
    const roleOrders = userRole === 'creator'
        ? orders.filter(o => o.creator === 'You')
        : userRole === 'client'
            ? orders.filter(o => o.clientName)
            : orders; // admin sees all

    const filteredOrders = filter === 'All'
        ? roleOrders
        : roleOrders.filter(o => o.status === filter);

    return (
        <section className="section page-fade">
            <header className="section__header">
                <h2 className="section__title">My Orders ({roleOrders.length})</h2>
                <div className="filter-group">
                    {['All', 'Pending', 'In Progress', 'Completed', 'Suspended'].map(f => (
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
                            <h3 className="card__title">{order.title}</h3>
                            <span className={`badge badge--${order.status.toLowerCase().replace(' ', '-')}`}>{order.status}</span>
                        </div>
                        <div className="card__body">
                            <p><strong>{userRole === 'creator' ? 'Client' : 'Creator'}:</strong> {userRole === 'creator' ? (order.clientName || 'Awaiting') : order.creator}</p>
                            <p><strong>Amount:</strong> ₱{(order.budget || 0).toLocaleString()}</p>
                            {order.deadline && <p><strong>Deadline:</strong> {order.deadline}</p>}
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
