import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { fetchMe, getUserData, setUserData, submitCreatorApplication } from '../api';
import {
    CREATOR_MAIN_CATEGORIES,
    CREATOR_SUBCATEGORY_MAP,
    createInitialCreatorForm,
} from '../constants/creatorOnboarding';
import './BecomeCreatorPage.css';

const STEP_LABELS = [
    { number: 1, title: 'Identity', description: 'Tell us who you are.' },
    { number: 2, title: 'Services', description: 'Define what you offer.' },
    { number: 3, title: 'Review', description: 'Confirm and activate.' },
];

const BecomeCreatorPage = () => {
    const navigate = useNavigate();
    const userData = getUserData();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [creatorForm, setCreatorForm] = useState(() => createInitialCreatorForm(userData?.full_name || ''));

    const isExistingCreator = userData?.role && userData.role !== 'client';
    const selectedSkills = useMemo(
        () => CREATOR_SUBCATEGORY_MAP[creatorForm.category] || [],
        [creatorForm.category],
    );

    const updateField = (key, value) => {
        setCreatorForm((prev) => ({ ...prev, [key]: value }));
    };

    const toggleSkill = (skill) => {
        setCreatorForm((prev) => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter((value) => value !== skill)
                : [...prev.skills, skill],
        }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!creatorForm.first_name.trim() || !creatorForm.last_name.trim() || !creatorForm.phone.trim() || !creatorForm.id_number.trim()) {
                setError('Complete the identity fields first.');
                return false;
            }
            if (!/^\d{12}$/.test(creatorForm.id_number.trim())) {
                setError('Government ID number must be exactly 12 digits.');
                return false;
            }
            if (!creatorForm.street_address.trim() || !creatorForm.city.trim()) {
                setError('Street address and city are required.');
                return false;
            }
        }

        if (step === 2) {
            if (!creatorForm.category || creatorForm.skills.length === 0 || !creatorForm.bio.trim() || !creatorForm.experience_years.trim() || !creatorForm.starting_price.trim() || !creatorForm.turnaround_time.trim()) {
                setError('Complete the creator profile details before continuing.');
                return false;
            }
        }

        if (step === 3 && !creatorForm.agreed) {
            setError('You must confirm the information before activation.');
            return false;
        }

        setError('');
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        setStep((prev) => Math.min(3, prev + 1));
    };

    const handleBack = () => {
        setError('');
        setStep((prev) => Math.max(1, prev - 1));
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setSubmitting(true);
        try {
            const payload = {
                first_name: creatorForm.first_name.trim(),
                middle_name: creatorForm.middle_name.trim() || null,
                last_name: creatorForm.last_name.trim(),
                phone: creatorForm.phone.trim() || null,
                id_number: creatorForm.id_number.trim() || null,
                street_address: creatorForm.street_address.trim() || null,
                barangay: creatorForm.barangay.trim() || null,
                city: creatorForm.city.trim() || null,
                province: creatorForm.province.trim() || null,
                postal_code: creatorForm.postal_code.trim() || null,
                country: creatorForm.country.trim() || 'Philippines',
                bio: creatorForm.bio.trim() || null,
                experience_years: creatorForm.experience_years.trim() || null,
                starting_price: creatorForm.starting_price.trim() || null,
                turnaround_time: creatorForm.turnaround_time.trim() || null,
                category: creatorForm.category || null,
                skills: creatorForm.skills,
                portfolio_url: creatorForm.portfolio_url.trim() || null,
            };

            const { ok, data } = await submitCreatorApplication(payload);
            if (!ok) {
                setError(data?.detail || 'Failed to submit creator application.');
                setSubmitting(false);
                return;
            }

            const me = await fetchMe();
            if (me.ok) {
                setUserData({
                    ...getUserData(),
                    ...me.data,
                    firebase_uid: String(me.data.firebase_uid || me.data.id || userData?.firebase_uid),
                    full_name: me.data.full_name || me.data.username || `${payload.first_name} ${payload.last_name}`.trim(),
                    role: me.data.role || 'creator',
                });
            }

            window.location.href = '/';
        } catch (submitError) {
            setError(submitError?.message || 'Failed to submit creator application.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderIdentityStep = () => (
        <div className="bc-form-grid">
            <div className="bc-form-row">
                <label className="bc-field">
                    <span>First Name</span>
                    <input value={creatorForm.first_name} onChange={(event) => updateField('first_name', event.target.value)} />
                </label>
                <label className="bc-field">
                    <span>Last Name</span>
                    <input value={creatorForm.last_name} onChange={(event) => updateField('last_name', event.target.value)} />
                </label>
            </div>

            <div className="bc-form-row">
                <label className="bc-field">
                    <span>Middle Name</span>
                    <input value={creatorForm.middle_name} onChange={(event) => updateField('middle_name', event.target.value)} />
                </label>
                <label className="bc-field">
                    <span>Phone</span>
                    <input value={creatorForm.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+63..." />
                </label>
            </div>

            <div className="bc-form-row">
                <label className="bc-field">
                    <span>Government ID Number</span>
                    <input
                        value={creatorForm.id_number}
                        onChange={(event) => updateField('id_number', event.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                        placeholder="12 digits"
                    />
                </label>
                <label className="bc-field">
                    <span>Country</span>
                    <input value={creatorForm.country} onChange={(event) => updateField('country', event.target.value)} />
                </label>
            </div>

            <label className="bc-field">
                <span>Street Address</span>
                <input value={creatorForm.street_address} onChange={(event) => updateField('street_address', event.target.value)} />
            </label>

            <div className="bc-form-row bc-form-row--triple">
                <label className="bc-field">
                    <span>Barangay / District</span>
                    <input value={creatorForm.barangay} onChange={(event) => updateField('barangay', event.target.value)} />
                </label>
                <label className="bc-field">
                    <span>City</span>
                    <input value={creatorForm.city} onChange={(event) => updateField('city', event.target.value)} />
                </label>
                <label className="bc-field">
                    <span>Postal Code</span>
                    <input value={creatorForm.postal_code} onChange={(event) => updateField('postal_code', event.target.value)} />
                </label>
            </div>

            <label className="bc-field">
                <span>Province / State</span>
                <input value={creatorForm.province} onChange={(event) => updateField('province', event.target.value)} />
            </label>
        </div>
    );

    const renderServicesStep = () => (
        <div className="bc-form-grid">
            <div className="bc-section">
                <div className="bc-section__header">
                    <h3>Main Category</h3>
                    <p>Choose the area where clients should discover you.</p>
                </div>
                <div className="bc-category-grid">
                    {CREATOR_MAIN_CATEGORIES.map((category) => (
                        <button
                            key={category}
                            type="button"
                            className={`bc-category-card ${creatorForm.category === category ? 'is-active' : ''}`}
                            onClick={() => updateField('category', category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {creatorForm.category && (
                <div className="bc-section">
                    <div className="bc-section__header">
                        <h3>Skills</h3>
                        <p>Select the services you can confidently deliver.</p>
                    </div>
                    <div className="bc-skill-cloud">
                        {selectedSkills.map((skill) => (
                            <button
                                key={skill}
                                type="button"
                                className={`bc-skill-pill ${creatorForm.skills.includes(skill) ? 'is-active' : ''}`}
                                onClick={() => toggleSkill(skill)}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bc-form-row bc-form-row--triple">
                <label className="bc-field">
                    <span>Experience</span>
                    <input value={creatorForm.experience_years} onChange={(event) => updateField('experience_years', event.target.value)} placeholder="e.g. 3" />
                </label>
                <label className="bc-field">
                    <span>Starting Price</span>
                    <input value={creatorForm.starting_price} onChange={(event) => updateField('starting_price', event.target.value)} placeholder="e.g. 500" />
                </label>
                <label className="bc-field">
                    <span>Turnaround</span>
                    <input value={creatorForm.turnaround_time} onChange={(event) => updateField('turnaround_time', event.target.value)} placeholder="e.g. 3 days" />
                </label>
            </div>

            <label className="bc-field">
                <span>Bio</span>
                <textarea rows="6" value={creatorForm.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder="Describe your experience, style, and what clients can expect from working with you." />
            </label>

            <label className="bc-field">
                <span>Portfolio URL</span>
                <input value={creatorForm.portfolio_url} onChange={(event) => updateField('portfolio_url', event.target.value)} placeholder="https://..." />
            </label>
        </div>
    );

    const renderReviewStep = () => (
        <div className="bc-review-stack">
            <div className="bc-review-card">
                <div className="bc-review-card__header">
                    <CheckCircle2 size={18} />
                    <h3>Review your creator setup</h3>
                </div>
                <dl className="bc-review-grid">
                    <div>
                        <dt>Name</dt>
                        <dd>{[creatorForm.first_name, creatorForm.middle_name, creatorForm.last_name].filter(Boolean).join(' ') || 'Not provided'}</dd>
                    </div>
                    <div>
                        <dt>Phone</dt>
                        <dd>{creatorForm.phone || 'Not provided'}</dd>
                    </div>
                    <div>
                        <dt>Category</dt>
                        <dd>{creatorForm.category || 'Not selected'}</dd>
                    </div>
                    <div>
                        <dt>Skills</dt>
                        <dd>{creatorForm.skills.join(', ') || 'None selected'}</dd>
                    </div>
                    <div>
                        <dt>Starting Price</dt>
                        <dd>{creatorForm.starting_price || 'N/A'}</dd>
                    </div>
                    <div>
                        <dt>Turnaround</dt>
                        <dd>{creatorForm.turnaround_time || 'N/A'}</dd>
                    </div>
                </dl>
            </div>

            <label className="bc-confirm">
                <input
                    type="checkbox"
                    checked={creatorForm.agreed}
                    onChange={(event) => updateField('agreed', event.target.checked)}
                />
                <span>I confirm that the information above is accurate and I want to activate my creator account now.</span>
            </label>
        </div>
    );

    if (isExistingCreator) {
        return (
            <main className="become-creator-page page-fade">
                <div className="bc-breadcrumb">
                    <Link to="/" className="bc-breadcrumb__link">Workspace</Link>
                    <span>/</span>
                    <span className="bc-breadcrumb__active">Become a Creator</span>
                </div>

                <section className="bc-hero bc-hero--compact">
                    <div className="bc-hero__copy">
                        <span className="bc-kicker">Creator Access Active</span>
                        <h1>Your account is already set up for creator access.</h1>
                        <p>You can go straight to your dashboard and manage your creator workspace from there.</p>
                    </div>
                    <button type="button" className="bc-primary-btn" onClick={() => navigate('/')}>
                        Go to Dashboard
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="become-creator-page page-fade">
            <div className="bc-topbar">
                <div className="bc-breadcrumb">
                    <Link to="/" className="bc-breadcrumb__link">Client Workspace</Link>
                    <span>/</span>
                    <span className="bc-breadcrumb__active">Become a Creator</span>
                </div>
                <button type="button" className="bc-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} />
                    Back
                </button>
            </div>

            <section className="bc-hero">
                <div className="bc-hero__copy">
                    <span className="bc-kicker">Creator Onboarding</span>
                    <h1>Build your creator profile without leaving the app flow.</h1>
                    <p>Complete identity, service setup, and final activation in one place. No redirect to your profile page, no hidden modal steps.</p>
                </div>
                <div className="bc-hero__badges">
                    <span><ShieldCheck size={16} /> Verified identity details</span>
                    <span><Briefcase size={16} /> Service-ready profile</span>
                    <span><Sparkles size={16} /> Instant creator activation</span>
                </div>
            </section>

            <div className="bc-layout">
                <aside className="bc-sidebar">
                    <section className="bc-panel">
                        <h2>Steps</h2>
                        <div className="bc-step-list">
                            {STEP_LABELS.map((item) => (
                                <div key={item.number} className={`bc-step-item ${step === item.number ? 'is-current' : ''} ${step > item.number ? 'is-complete' : ''}`}>
                                    <div className="bc-step-item__number">{item.number}</div>
                                    <div>
                                        <strong>{item.title}</strong>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bc-panel bc-panel--muted">
                        <h2>Perks of Being a Creator</h2>
                        <ul className="bc-tip-list">
                            <li>List services in the marketplace and start receiving client orders.</li>
                            <li>Unlock the creator dashboard to manage gigs, delivery flow, and earnings.</li>
                            <li>Build a public creator profile that helps clients discover and trust your work.</li>
                        </ul>
                    </section>
                </aside>

                <section className="bc-main">
                    <div className="bc-panel bc-panel--main">
                        <div className="bc-panel__header">
                            <div>
                                <span className="bc-panel__eyebrow">Step {step} of 3</span>
                                <h2>{STEP_LABELS[step - 1].title}</h2>
                                <p>{STEP_LABELS[step - 1].description}</p>
                            </div>
                            <div className="bc-progress-track">
                                <div className="bc-progress-track__fill" style={{ width: `${(step / 3) * 100}%` }} />
                            </div>
                        </div>

                        {error && <div className="bc-error">{error}</div>}

                        {step === 1 && renderIdentityStep()}
                        {step === 2 && renderServicesStep()}
                        {step === 3 && renderReviewStep()}

                        <div className="bc-actions">
                            {step > 1 ? (
                                <button type="button" className="bc-secondary-btn" onClick={handleBack}>
                                    Back
                                </button>
                            ) : (
                                <button type="button" className="bc-secondary-btn" onClick={() => navigate('/')}>
                                    Cancel
                                </button>
                            )}

                            {step < 3 ? (
                                <button type="button" className="bc-primary-btn" onClick={handleNext}>
                                    Continue
                                </button>
                            ) : (
                                <button type="button" className="bc-primary-btn" disabled={submitting} onClick={handleSubmit}>
                                    {submitting ? 'Activating...' : 'Activate Creator Account'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default BecomeCreatorPage;
