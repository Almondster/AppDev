import React, { useEffect, useState } from 'react';
import { fetchMyPaymentMethods, createPaymentMethod, deletePaymentMethod, getUserData } from '../api';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const user = getUserData();

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ method_type: 'GCash', masked_number: '' });
  const [adding, setAdding] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const res = await fetchMyPaymentMethods();
      if (res.ok) setMethods(res.data.results || res.data || []);
    } catch (e) {
      console.error('Error fetching payment methods:', e);
    }
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await createPaymentMethod({
        user_id: user?.firebase_uid,
        method_type: addForm.method_type,
        masked_number: addForm.masked_number,
      });
      if (res.ok) {
        setMethods(m => [...m, res.data]);
        setShowAddModal(false);
        setAddForm({ method_type: 'GCash', masked_number: '' });
        showToast('Payment method added!');
      } else {
        showToast(res.data?.detail || 'Failed to add payment method.');
      }
    } catch {
      showToast('Connection error.');
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      const { ok } = await deletePaymentMethod(deleteConfirm.id);
      if (ok) {
        setMethods(m => m.filter(pm => pm.id !== deleteConfirm.id));
        showToast('Payment method removed.');
      }
    } catch {
      showToast('Failed to remove.');
    }
    setDeleting(false);
    setDeleteConfirm({ open: false, id: null });
  };

  return (
    <main className="earn-page">
      {toast && <div className="global-toast global-toast--success">{toast}</div>}

      {/* Header */}
      <div className="earn-header">
        <div>
          <h1 className="earn-title">Payment Methods</h1>
          <p className="earn-subtitle">Manage your saved payment methods for orders and services.</p>
        </div>
        {!loading && (
          <div className="earn-header-actions">
            <button className="earn-action-btn earn-action-btn--primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Method
            </button>
          </div>
        )}
      </div>

      {/* Methods List */}
      {loading ? (
        <div className="earn-section">
          {[0, 1].map(i => (
            <div key={i} className="earn-row-item">
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }}></div>
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '50%', height: 16, marginBottom: 6 }}></div>
                <div className="skeleton" style={{ width: '30%', height: 13 }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="earn-section">
          <h2 className="earn-section-title">Saved Methods ({methods.length})</h2>
          <div className="earn-section-list">
            {methods.length > 0 ? methods.map(pm => (
              <div key={pm.id} className="earn-row-item">
                <div className="earn-row-icon"><CreditCard size={18} /></div>
                <div className="earn-row-info">
                  <h4>{pm.method_type || pm.type || 'Unknown'}</h4>
                  <p>{pm.masked_number || pm.details || 'No details'}</p>
                </div>
                <button className="earn-delete-btn" onClick={() => setDeleteConfirm({ open: true, id: pm.id })}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            )) : (
              <p className="earn-empty">No payment methods yet. Add one to get started.</p>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="confirm-overlay" onClick={() => setShowAddModal(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-modal__title">Add Payment Method</h3>
            <form onSubmit={handleAdd} className="earn-modal-form">
              <div>
                <label className="earn-form-label">Method Type</label>
                <select
                  value={addForm.method_type}
                  onChange={e => setAddForm(p => ({ ...p, method_type: e.target.value }))}
                  className="earn-form-input"
                >
                  <option value="GCash">GCash</option>
                  <option value="Maya">Maya (PayMaya)</option>
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="earn-form-label">Account / Card Number</label>
                <input
                  value={addForm.masked_number}
                  onChange={e => setAddForm(p => ({ ...p, masked_number: e.target.value }))}
                  placeholder="09XXXXXXXXX or **** **** **** 1234"
                  required
                  className="earn-form-input"
                />
              </div>
              <div className="confirm-modal__actions">
                <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="confirm-modal__btn confirm-modal__btn--confirm" disabled={adding}>
                  {adding ? 'Adding...' : 'Add Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteConfirm.open}
        title="Remove Payment Method?"
        message="This payment method will be permanently removed."
        variant="danger"
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </main>
  );
}
