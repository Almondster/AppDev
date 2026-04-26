import { useState, useEffect, useCallback, useMemo } from 'react';
import { OrdersContext } from '../contexts/OrdersContext';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { DEFAULT_ORDERS } from '../utils/defaults';

const STORAGE_KEY = 'createch_orders';

const loadOrders = () => loadFromStorage(STORAGE_KEY, DEFAULT_ORDERS);

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState(loadOrders);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, orders);
  }, [orders]);

  const addOrder = useCallback((order) => {
    const newOrder = { ...order, id: Date.now(), amount: Number(order.amount), dateCreated: new Date().toISOString().split('T')[0] };
    setOrders((prev) => [...prev, newOrder]);
    return newOrder;
  }, []);

  const updateOrder = useCallback((id, data) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...data, amount: Number(data.amount || o.amount) } : o))
    );
  }, []);

  const deleteOrder = useCallback((id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'Completed'), [orders]);
  const activeOrders = useMemo(() => orders.filter((o) => o.status === 'In Progress'), [orders]);
  const totalEarnings = useMemo(() => completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0), [completedOrders]);

  const contextValue = useMemo(() => ({
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    completedOrders,
    activeOrders,
    totalEarnings,
  }), [orders, addOrder, updateOrder, deleteOrder, completedOrders, activeOrders, totalEarnings]);

  return (
    <OrdersContext.Provider value={contextValue}>
      {children}
    </OrdersContext.Provider>
  );
};
