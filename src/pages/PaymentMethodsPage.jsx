import React, { useEffect, useState } from 'react';
import { fetchPaymentMethods, getUserData } from '../api';
import { createPaymentMethod, deletePaymentMethod } from '../api';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getUserData();
  const [newType, setNewType] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPaymentMethods();
        if (res.ok) setMethods(res.data);
        else setError(res.data.detail || 'Failed to fetch payment methods');
      } catch (e) {
        setError('Error fetching payment methods');
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await createPaymentMethod({ type: newType, details: newDetails });
      if (res.ok) {
        setMethods(m => [...m, res.data]);
        setNewType('');
        setNewDetails('');
      } else {
        setError(res.data.detail || 'Failed to add payment method');
      }
    } catch {
      setError('Error adding payment method');
    }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await deletePaymentMethod(id);
      if (res.ok) setMethods(m => m.filter(pm => pm.id !== id));
      else setError(res.data.detail || 'Failed to delete payment method');
    } catch {
      setError('Error deleting payment method');
    }
    setDeletingId(null);
  };

  return (
    <div className="page-container">
      <h2>Payment Methods</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && !error && (
        <>
        <ul>
          {methods.length === 0 && <li>No payment methods found.</li>}
          {methods.map(pm => (
            <li key={pm.id}>
              <b>{pm.type}</b> — {pm.details || 'No details'}
              <button style={{ marginLeft: 12 }} disabled={deletingId === pm.id} onClick={() => handleDelete(pm.id)}>
                {deletingId === pm.id ? 'Deleting...' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAdd} style={{ marginTop: 24 }}>
          <input placeholder="Type (e.g. GCash)" value={newType} onChange={e => setNewType(e.target.value)} required />
          <input placeholder="Details (e.g. 09xxxx)" value={newDetails} onChange={e => setNewDetails(e.target.value)} required />
          <button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Payment Method'}</button>
        </form>
        </>
      )}
    </div>
  );
}
