import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, CheckCircle2, Eye, ImagePlus, ShieldCheck, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { getApiOrigin, getUserData, setUserData, submitCreatorApplication, uploadIdVerificationImage } from '../api';
import {
    CREATOR_MAIN_CATEGORIES,
    CREATOR_SUBCATEGORY_MAP,
    createInitialCreatorForm,
} from '../constants/creatorOnboarding';
import '../styles/BecomeCreatorPage.css';

const STEP_LABELS = [
    { number: 1, title: 'Identity', description: 'Tell us who you are.' },
    { number: 2, title: 'Services', description: 'Define what you offer.' },
    { number: 3, title: 'Review', description: 'Confirm and submit for review.' },
];

const MAX_ID_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_PREVIEW_ORIGIN = getApiOrigin();
const ID_UPLOAD_META = {
    id_front_url: {
        label: 'Government ID Front',
        description: 'Upload a clear photo of the front of your valid government ID.',
        suffix: 'id-front',
        required: true,
    },
    id_back_url: {
        label: 'Government ID Back',
        description: 'Upload a clear photo of the back of your valid government ID.',
        suffix: 'id-back',
        required: true,
    },
    id_selfie_url: {
        label: 'Selfie With ID',
        description: 'Optional, but recommended if the admin needs extra verification.',
        suffix: 'id-selfie',
        required: false,
    },
};

const digitsOnly = (value, maxLength = null) => {
    const sanitized = String(value || '').replace(/\D/g, '');
    return typeof maxLength === 'number' ? sanitized.slice(0, maxLength) : sanitized;
};

const resolveUploadPreviewUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${UPLOAD_PREVIEW_ORIGIN}${value}`;
};

const getUploadFileName = (value) => {
    if (!value) return '';
    const resolved = resolveUploadPreviewUrl(value);
    try {
        const pathname = new URL(resolved).pathname;
        return decodeURIComponent(pathname.split('/').pop() || '');
    } catch {
        return decodeURIComponent(String(value).split('/').pop() || '');
    }
};

const BecomeCreatorPage = () => {
    const navigate = useNavigate();
    const userData = getUserData();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingField, setUploadingField] = useState('');
    const [error, setError] = useState('');
    const [submittedApplication, setSubmittedApplication] = useState(null);
    const [creatorForm, setCreatorForm] = useState(() => createInitialCreatorForm(userData));

    const isExistingCreator = userData?.role && userData.role !== 'client';
    const selectedSkills = useMemo(
        () => CREATOR_SUBCATEGORY_MAP[creatorForm.category] || [],
        [creatorForm.category],
    );

    const updateField = (key, value) => {
        setError('');
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
            if (!/^9\d{9}$/.test(creatorForm.phone.trim())) {
                setError('Phone number must be 10 digits and start with 9.');
                return false;
            }
            if (!/^\d{12}$/.test(creatorForm.id_number.trim())) {
                setError('Government ID number must be exactly 12 digits.');
                return false;
            }
            if (creatorForm.postal_code.trim() && !/^\d+$/.test(creatorForm.postal_code.trim())) {
                setError('Postal code must contain numbers only.');
                return false;
            }
            if (!creatorForm.street_address.trim() || !creatorForm.city.trim()) {
                setError('Street address and city are required.');
                return false;
            }
            if (!creatorForm.id_front_url || !creatorForm.id_back_url) {
                setError('Upload the front and back images of a valid government ID before continuing.');
                return false;
            }
        }

        if (step === 2) {
            if (!creatorForm.category || creatorForm.skills.length === 0 || !creatorForm.bio.trim() || !creatorForm.experience_years.trim() || !creatorForm.starting_price.trim() || !creatorForm.turnaround_time.trim()) {
                setError('Complete the creator profile details before continuing.');
                return false;
            }
            if (!/^\d+$/.test(creatorForm.experience_years.trim())) {
                setError('Experience must contain numbers only.');
                return false;
            }
            if (!/^\d+$/.test(creatorForm.starting_price.trim())) {
                setError('Starting price must contain numbers only.');
                return false;
            }
        }

        if (step === 3 && !creatorForm.agreed) {
            setError('You must confirm the information before submitting your application.');
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

    const handleIdUpload = async (fieldKey, file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed for ID verification.');
            return;
        }
        if (file.size > MAX_ID_UPLOAD_BYTES) {
            setError('ID verification images must be 5 MB or smaller.');
            return;
        }

        setError('');
        setUploadingField(fieldKey);
        try {
            const fileName = `${userData?.firebase_uid || 'user'}-${ID_UPLOAD_META[fieldKey].suffix}-${Date.now()}-${file.name}`.replace(/\s+/g, '-');
            const { ok, data } = await uploadIdVerificationImage(file, fileName);
            if (!ok) {
                setError(data?.detail || `Failed to upload ${ID_UPLOAD_META[fieldKey].label.toLowerCase()}.`);
                return;
            }
            updateField(fieldKey, data?.url || '');
        } catch (uploadError) {
            setError(uploadError?.message || `Failed to upload ${ID_UPLOAD_META[fieldKey].label.toLowerCase()}.`);
        } finally {
            setUploadingField('');
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setSubmitting(true);
        try {
            const payload = {
                first_name: creatorForm.first_name.trim(),
                middle_name: creatorForm.middle_name.trim() || null,
                last_name: creatorForm.last_name.trim(),
                phone: creatorForm.phone.trim() ? `+63${creatorForm.phone.trim()}` : null,
                id_number: creatorForm.id_number.trim() || null,
                id_front_url: creatorForm.id_front_url || null,
                id_back_url: creatorForm.id_back_url || null,
                id_selfie_url: creatorForm.id_selfie_url || null,
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

            setUserData({
                ...getUserData(),
                creator_application_status: data?.status || 'pending',
                creator_application_id: data?.id || null,
            });
            setSubmittedApplication(data);
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
                    <input
                        value={creatorForm.phone}
                        onChange={(event) => updateField('phone', digitsOnly(event.target.value, 10))}
                        placeholder="9123456789"
                        inputMode="numeric"
                    />
                </label>
            </div>

            <div className="bc-form-row">
                <label className="bc-field">
                    <span>Government ID Number</span>
                    <input
                        value={creatorForm.id_number}
                        onChange={(event) => updateField('id_number', digitsOnly(event.target.value, 12))}
                        placeholder="12 digits"
                        inputMode="numeric"
                    />
                </label>
                <label className="bc-field">
                    <span>Country</span>
                    <input value={creatorForm.country} onChange={(event) => updateField('country', event.target.value)} />
                </label>
            </div>

            <div className="bc-section bc-section--upload">
                <div className="bc-section__header">
                    <h3>Valid ID Uploads</h3>
                    <p>Upload clear images of your ID. Front and back are required. Maximum file size is 5 MB per image.</p>
                </div>

                <div className="bc-upload-grid">
                    {Object.entries(ID_UPLOAD_META).map(([fieldKey, meta]) => {
                        const hasUpload = Boolean(creatorForm[fieldKey]);
                        const previewUrl = resolveUploadPreviewUrl(creatorForm[fieldKey]);
                        const fileName = getUploadFileName(creatorForm[fieldKey]);
                        const isUploading = uploadingField === fieldKey;

                        return (
                            <div
                                key={fieldKey}
                                className={`bc-upload-card ${hasUpload ? 'is-complete' : ''} ${isUploading ? 'is-uploading' : ''}`}
                            >
                                <div className="bc-upload-card__top">
                                    <div>
                                        <span className="bc-upload-card__title">{meta.label}</span>
                                        <span className="bc-upload-card__copy">{meta.description}</span>
                                    </div>
                                    <span className={`bc-upload-card__badge ${meta.required ? 'is-required' : 'is-optional'}`}>
                                        {meta.required ? 'Required' : 'Optional'}
                                    </span>
                                </div>

                                <div className={`bc-upload-card__preview ${hasUpload ? 'has-image' : ''}`}>
                                    {hasUpload ? (
                                        <img src={previewUrl} alt={meta.label} />
                                    ) : (
                                        <div className="bc-upload-card__placeholder">
                                            <ImagePlus size={24} />
                                            <strong>{meta.required ? 'No image uploaded yet' : 'Optional upload'}</strong>
                                            <span>Use a bright, readable photo with all edges visible.</span>
                                        </div>
                                    )}

                                    {isUploading && (
                                        <div className="bc-upload-card__overlay">
                                            <UploadCloud size={18} />
                                            Uploading image...
                                        </div>
                                    )}
                                </div>

                                <div className="bc-upload-card__status-row">
                                    <span className={`bc-upload-card__status ${hasUpload ? 'is-complete' : ''}`}>
                                        {isUploading ? 'Uploading...' : hasUpload ? 'Upload complete' : meta.required ? 'Waiting for upload' : 'Not uploaded'}
                                    </span>
                                    {fileName && <span className="bc-upload-card__file">{fileName}</span>}
                                </div>

                                <div className="bc-upload-card__actions">
                                    <label className={`bc-upload-card__trigger ${isUploading ? 'is-disabled' : ''}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={isUploading}
                                            onClick={(event) => {
                                                event.target.value = null;
                                            }}
                                            onChange={(event) => handleIdUpload(fieldKey, event.target.files?.[0] || null)}
                                        />
                                        <UploadCloud size={16} />
                                        {hasUpload ? 'Replace image' : 'Choose image'}
                                    </label>

                                    {hasUpload && (
                                        <>
                                            <a
                                                href={previewUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bc-upload-card__link"
                                            >
                                                <Eye size={16} />
                                                Preview
                                            </a>
                                            <button
                                                type="button"
                                                className="bc-upload-card__remove"
                                                onClick={() => updateField(fieldKey, '')}
                                            >
                                                <Trash2 size={16} />
                                                Remove
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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
                    <input
                        value={creatorForm.postal_code}
                        onChange={(event) => updateField('postal_code', digitsOnly(event.target.value, 10))}
                        inputMode="numeric"
                    />
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
                    <input
                        value={creatorForm.experience_years}
                        onChange={(event) => updateField('experience_years', digitsOnly(event.target.value, 2))}
                        placeholder="e.g. 3"
                        inputMode="numeric"
                    />
                </label>
                <label className="bc-field">
                    <span>Starting Price</span>
                    <input
                        value={creatorForm.starting_price}
                        onChange={(event) => updateField('starting_price', digitsOnly(event.target.value, 9))}
                        placeholder="e.g. 500"
                        inputMode="numeric"
                    />
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
                        <dt>ID Verification</dt>
                        <dd>
                            {creatorForm.id_front_url && creatorForm.id_back_url
                                ? creatorForm.id_selfie_url
                                    ? 'Front, back, and selfie uploaded'
                                    : 'Front and back uploaded'
                                : 'Missing required ID uploads'}
                        </dd>
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
                <span>I confirm that the information above is accurate and I want to submit this creator application for admin review.</span>
            </label>
        </div>
    );

    if (submittedApplication) {
        return (
            <main className="become-creator-page page-fade">
                <section className="bc-hero bc-hero--compact">
                    <div className="bc-hero__copy">
                        <span className="bc-kicker">Application Submitted</span>
                        <h1>Your creator application is now pending admin review.</h1>
                        <p>
                            Your valid ID details and creator profile were submitted successfully. An admin must approve the
                            application before creator access is enabled on your account.
                        </p>
                    </div>
                    <button type="button" className="bc-primary-btn" onClick={() => navigate('/')}>
                        Return to Workspace
                    </button>
                </section>
            </main>
        );
    }

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
                    <p>Complete identity, service setup, and submit your creator application for admin review in one place.</p>
                </div>
                <div className="bc-hero__badges">
                    <span><ShieldCheck size={16} /> Verified identity details</span>
                    <span><Briefcase size={16} /> Service-ready profile</span>
                    <span><Sparkles size={16} /> Admin approval before creator access</span>
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
                                    {submitting ? 'Submitting...' : 'Submit Creator Application'}
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
