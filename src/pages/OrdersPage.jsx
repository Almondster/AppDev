import { useOrders } from '../context/useOrders';
import { useOrdersFilter } from '../context/hooks/useOrdersFilter';
import { Package } from 'lucide-react';
import Card from '../components/Card';
import '../styles/OrdersPage.css';

const OrdersPage = () => {
    const { orders } = useOrders();
    const { filter, setFilter, searchTerm, setSearchTerm, sortBy, setSortBy, filteredOrders } = useOrdersFilter(orders);

    return (
        <section className="section page-fade">
            <header className="section__header">
                <h2 className="section__title">Received Orders ({orders.length})</h2>
            </header>

            <div className="toolbar">
                <div className="search-wrapper">
                    <span className="search-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </span>
                    <label htmlFor="orderSearch" className="sr-only">Search orders</label>
                    <input
                        id="orderSearch"
                        type="text"
                        className="search-input"
                        placeholder="Search by client or service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    {['All', 'In Progress', 'Completed'].map(f => (
                        <button
                            key={f}
                            className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <label htmlFor="orderSort" className="sr-only">Sort orders</label>
                <select id="orderSort" className="form-input sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recent">Sort: Recent</option>
                    <option value="amount">Sort: Amount</option>
                    <option value="client">Sort: Client</option>
                </select>
            </div>

            <div className="card-grid">
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                    <Card key={order.id} title={order.service} status={order.status}>
                        <p><strong>From Client:</strong> {order.client}</p>
                        <p><strong>Amount:</strong> ₱{(order.amount || 0).toLocaleString()}</p>
                        {order.deliveryEstimate && <p><strong>Duration:</strong> {order.deliveryEstimate} days</p>}
                        {order.dateCreated && <p><strong>Received:</strong> {order.dateCreated}</p>}
                        {order.dateCompleted && <p><strong>Completed:</strong> {order.dateCompleted}</p>}
                    </Card>
                )) : (
                    <div className="empty-state">
                        <div className="empty-state__icon">
                            <Package size={48} />
                        </div>
                        <p className="empty-state__title">No orders received yet.</p>
                        <p className="empty-state__hint">Orders from clients will appear here.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default OrdersPage;
