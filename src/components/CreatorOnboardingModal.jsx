import React, { useMemo, useState } from 'react';
import { submitCreatorApplication, getUserData } from '../api';

export const CreatorOnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const user = useMemo(() => getUserData() || {}, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: user.full_name?.split(' ')[0] || '',
    middle_name: '',
    last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
    phone: '',
    bio: '',
    experience_years: '',
    starting_price: '',
    turnaround_time: '',
    category: '',
    skills: '',
    portfolio_url: '',
  });

  if (!isOpen) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        skills: form.skills
          ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const res = await submitCreatorApplication(payload);
      if (!res.ok) {
        throw new Error(res?.data?.detail || 'Failed to submit application');
      }
      onComplete?.(res.data);
    } catch (err) {
      setError(err.message || 'Failed to submit creator application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760, width: '95%' }}>
        <h3 className="confirm-modal__title">Become a Creator</h3>
        <p style={{ color: '#a1a1aa', marginTop: 0 }}>Submit your creator profile for admin review.</p>
        {error && <div className="global-toast global-toast--error" style={{ marginBottom: 12 }}>{error}</div>}
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input className="earn-form-input" placeholder="First name" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} required />
            <input className="earn-form-input" placeholder="Middle name" value={form.middle_name} onChange={(e) => setForm((p) => ({ ...p, middle_name: e.target.value }))} />
            <input className="earn-form-input" placeholder="Last name" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} required />
          </div>
          <input className="earn-form-input" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <textarea className="earn-form-input" placeholder="Short bio" value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input className="earn-form-input" placeholder="Experience years" value={form.experience_years} onChange={(e) => setForm((p) => ({ ...p, experience_years: e.target.value }))} />
            <input className="earn-form-input" placeholder="Starting price (PHP)" value={form.starting_price} onChange={(e) => setForm((p) => ({ ...p, starting_price: e.target.value }))} />
            <input className="earn-form-input" placeholder="Turnaround time" value={form.turnaround_time} onChange={(e) => setForm((p) => ({ ...p, turnaround_time: e.target.value }))} />
          </div>
          <input className="earn-form-input" placeholder="Category (e.g. Design)" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
          <input className="earn-form-input" placeholder="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))} />
          <input className="earn-form-input" placeholder="Portfolio URL" value={form.portfolio_url} onChange={(e) => setForm((p) => ({ ...p, portfolio_url: e.target.value }))} />
          <div className="confirm-modal__actions">
            <button type="button" className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="confirm-modal__btn confirm-modal__btn--confirm" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatorOnboardingModal;
