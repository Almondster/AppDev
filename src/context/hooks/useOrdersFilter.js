import { useState, useMemo } from 'react';

export const useOrdersFilter = (orders = []) => {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => filter === 'All' || o.status === filter)
      .filter(o => {
        const search = searchTerm.toLowerCase();
        return (o.service?.toLowerCase().includes(search) ||
                o.client?.toLowerCase().includes(search));
      })
      .sort((a, b) => {
        if (sortBy === 'recent') return new Date(b.dateCreated || 0) - new Date(a.dateCreated || 0);
        if (sortBy === 'amount') return b.amount - a.amount;
        if (sortBy === 'client') return (a.client || '').localeCompare(b.client || '');
        return 0;
      });
  }, [orders, filter, searchTerm, sortBy]);

  return {
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filteredOrders,
  };
};
