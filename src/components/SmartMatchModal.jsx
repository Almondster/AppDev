import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Megaphone,
  MessageSquare,
  Mic2,
  Palette,
  PhilippinePeso,
  SearchCheck,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import Avatar from './Avatar';
import { fetchSmartMatches } from '../api';
import {
  CREATOR_MAIN_CATEGORIES,
  CREATOR_SUBCATEGORY_MAP,
} from '../constants/creatorOnboarding';
import '../styles/SmartMatchModal.css';

const CATEGORY_META = [
  {
    label: 'Design & Creative',
    description: 'Branding, logos, product visuals',
    accent: '#8b5cf6',
    icon: Palette,
  },
  {
    label: 'Development & IT',
    description: 'Web apps, mobile, software builds',
    accent: '#3b82f6',
    icon: Code2,
  },
  {
    label: 'Writing & Translation',
    description: 'Copy, editorial, localization work',
    accent: '#f97316',
    icon: FileText,
  },
  {
    label: 'Digital Marketing',
    description: 'Campaigns, SEO, social growth',
    accent: '#10b981',
    icon: Megaphone,
  },
  {
    label: 'Video & Animation',
    description: 'Editing, motion, cinematic assets',
    accent: '#ef4444',
    icon: Video,
  },
  {
    label: 'Music & Audio',
    description: 'Voice, mixing, composition',
    accent: '#f59e0b',
    icon: Mic2,
  },
];

const DEADLINE_OPTIONS = ['3 days', '7 days', '14 days', '1 month'];
const GUIDED_STEPS = ['category', 'skills', 'details', 'budget'];
const PROCESSING_PERCENTAGES = [18, 42, 73, 100];
const INVALID_PHRASES = ['test', 'demo', 'sample', 'checking', 'try only'];

const INITIAL_FORM_DATA = {
  category: '',
  selectedSkills: [],
  description: '',
  budget: 12000,
  deadline: '7 days',
};

const PROCESSING_LABELS = {
  ai: [
    'Reading your project brief...',
    'Analyzing the strongest category and skill signals...',
    'Ranking creators against your project needs...',
    'Finalizing the best shortlist...',
  ],
  guided: [
    'Checking your guided requirements...',
    'Searching creators in the selected category...',
    'Comparing skill overlap and fit...',
    'Finalizing the best shortlist...',
  ],
};

const SAMPLE_PROMPTS = [
  'I need a modern logo and visual identity for a coffee brand launching this month.',
  'I need an e-commerce website for my clothing business with checkout and product filters.',
  'I need a short social media campaign with graphics and captions for a new product launch.',
];

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

const toSentenceList = (items = []) => items.filter(Boolean).join(', ');

const buildGuidedDescription = (formData) => {
  if (formData.description.trim()) return formData.description.trim();
  const skillsText = toSentenceList(formData.selectedSkills) || 'specialized support';
  return `I need ${formData.category.toLowerCase()} help focused on ${skillsText}.`;
};

const formatBudgetValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Open budget';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? currencyFormatter.format(numericValue) : String(value);
};

const getMatchScore = (result) => {
  const rawScore = result?.matchScore ?? result?.score ?? 0;
  return Math.max(0, Math.min(100, Number(rawScore) || 0));
};

const getResultId = (result) => result?.id ?? result?.creator_id ?? result?.user_id ?? null;

const getResultSummary = (result) =>
  result?.aiInsight?.reason ||
  result?.matchReasons?.[0] ||
  result?.serviceDescription ||
  result?.bio ||
  'This creator matches your selected requirements.';

const getResultTitle = (result) =>
  result?.serviceTitle || result?.jobTitle || result?.serviceCategory || 'Matched creator';

const isLikelyInvalidProject = (description) => {
  const normalized = description.trim().toLowerCase();
  return normalized.length >= 1 && INVALID_PHRASES.some((phrase) => normalized.includes(phrase));
};

const GeminiIcon = ({ size = 16, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 2.5C12.55 6.95 14.05 9.45 16.35 11.65C18.55 13.95 21.05 15.45 21.5 16C17.05 16.55 14.55 18.05 12.35 20.35C10.05 22.55 8.55 25.05 8 25.5C7.45 21.05 5.95 18.55 3.65 16.35C1.45 14.05 -1.05 12.55 -1.5 12C2.95 11.45 5.45 9.95 7.65 7.65C9.95 5.45 11.45 2.95 12 2.5Z"
      transform="translate(1.5 -1.5)"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M18.2 3.5L18.62 5.08C18.9 6.16 19.74 7 20.82 7.28L22.4 7.7L20.82 8.12C19.74 8.4 18.9 9.24 18.62 10.32L18.2 11.9L17.78 10.32C17.5 9.24 16.66 8.4 15.58 8.12L14 7.7L15.58 7.28C16.66 7 17.5 6.16 17.78 5.08L18.2 3.5Z"
      fill="currentColor"
    />
  </svg>
);

const SmartMatchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('ai');
  const [view, setView] = useState('form');
  const [guidedStep, setGuidedStep] = useState('category');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [results, setResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [resultSource, setResultSource] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [progressIndex, setProgressIndex] = useState(0);

  const availableSkills = useMemo(
    () => CREATOR_SUBCATEGORY_MAP[formData.category] || [],
    [formData.category]
  );

  const processingLabels = PROCESSING_LABELS[mode] || PROCESSING_LABELS.ai;
  const progressValue = PROCESSING_PERCENTAGES[progressIndex] || PROCESSING_PERCENTAGES[0];

  useEffect(() => {
    if (!isOpen) {
      setMode('ai');
      setView('form');
      setGuidedStep('category');
      setFormData(INITIAL_FORM_DATA);
      setResults([]);
      setAnalysis(null);
      setResultSource('');
      setError('');
      setWarning('');
      setProgressIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (view !== 'processing') return undefined;

    const intervalId = window.setInterval(() => {
      setProgressIndex((current) => Math.min(current + 1, PROCESSING_PERCENTAGES.length - 1));
    }, 850);

    return () => window.clearInterval(intervalId);
  }, [view]);

  if (!isOpen) return null;

  const stepIndex = GUIDED_STEPS.indexOf(guidedStep);
  const isAiResultSource = resultSource === 'sentence-transformer';

  const openCreatorProfile = (result) => {
    const creatorId = getResultId(result);
    if (!creatorId) return;
    navigate(`/profile?uid=${encodeURIComponent(creatorId)}`);
    onClose();
  };

  const openMessages = (result) => {
    const creatorId = getResultId(result);
    if (!creatorId) return;
    navigate(`/messages?to=${encodeURIComponent(creatorId)}`);
    onClose();
  };

  const updateFormField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
    setError('');
    setWarning('');
  };

  const handleCategorySelect = (category) => {
    setFormData((current) => ({
      ...current,
      category,
      selectedSkills: [],
    }));
    setError('');
    setWarning('');
  };

  const handleSkillToggle = (skill) => {
    setFormData((current) => ({
      ...current,
      selectedSkills: current.selectedSkills.includes(skill)
        ? current.selectedSkills.filter((item) => item !== skill)
        : [...current.selectedSkills, skill],
    }));
    setError('');
  };

  const handleGuidedNext = () => {
    if (guidedStep === 'category') {
      if (!formData.category) {
        setError('Choose a category before continuing.');
        return;
      }
      setGuidedStep('skills');
      return;
    }

    if (guidedStep === 'skills') {
      if (formData.selectedSkills.length === 0) {
        setError('Select at least one skill for a guided match.');
        return;
      }
      setGuidedStep('details');
      return;
    }

    if (guidedStep === 'details') {
      setGuidedStep('budget');
      return;
    }

    void submitMatch('guided');
  };

  const handleGuidedBack = () => {
    if (guidedStep === 'budget') setGuidedStep('details');
    if (guidedStep === 'details') setGuidedStep('skills');
    if (guidedStep === 'skills') setGuidedStep('category');
  };

  const submitMatch = async (nextMode = mode) => {
    const description = formData.description.trim();

    if (nextMode === 'ai') {
      if (description.length < 20) {
        setError('Describe your project in at least 20 characters so Smart Match has enough signal.');
        return;
      }

      if (isLikelyInvalidProject(description)) {
        setWarning('Please describe a real project with clear deliverables instead of a test or demo request.');
        return;
      }
    }

    if (nextMode === 'guided') {
      if (!formData.category) {
        setGuidedStep('category');
        setError('Choose a category before continuing.');
        return;
      }

      if (formData.selectedSkills.length === 0) {
        setGuidedStep('skills');
        setError('Select at least one skill for a guided match.');
        return;
      }
    }

    setError('');
    setWarning('');
    setView('processing');
    setProgressIndex(0);

    const guidedDescription = buildGuidedDescription(formData);
    const payload =
      nextMode === 'ai'
        ? {
            mode: 'ai',
            query: description,
            description,
            limit: 6,
            save_matches: true,
          }
        : {
            mode: 'guided',
            query: [
              guidedDescription,
              formData.category,
              ...formData.selectedSkills,
              `Budget ${formData.budget}`,
              `Deadline ${formData.deadline}`,
            ]
              .filter(Boolean)
              .join(' '),
            description: guidedDescription,
            category: formData.category,
            budget: formData.budget,
            deadline: formData.deadline,
            selected_skills: formData.selectedSkills,
            limit: 6,
            save_matches: true,
          };

    try {
      const { ok, data } = await fetchSmartMatches(payload);

      if (!ok) {
        throw new Error(data?.detail || 'We could not find matches right now.');
      }

      setResults(data?.matches || data?.results || []);
      setAnalysis(data?.analysis || null);
      setResultSource(data?.source || '');
      setWarning(data?.warning || '');
      setProgressIndex(PROCESSING_PERCENTAGES.length - 1);

      window.setTimeout(() => {
        setView('results');
      }, 180);
    } catch (matchError) {
      setView('form');
      setError(matchError?.message || 'Smart Match failed. Please try again.');
    }
  };

  const renderAiForm = () => (
    <div className="smm-form-grid">
      <section className="smm-panel smm-panel--accent">
        <div className="smm-panel-header">
          <div className="smm-pill">
            <GeminiIcon size={14} />
            AI Smart Match
          </div>
          <h3>Describe the outcome you need.</h3>
          <p>
            Write naturally. The sentence-transformer matcher will infer the category, highlight
            relevant skills, and rank creators from the brief.
          </p>
        </div>

        <div className="smm-prompt-list">
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="smm-prompt-chip"
              onClick={() => updateFormField('description', prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="smm-feature-list">
          <div className="smm-feature-item">
            <CheckCircle2 size={16} />
            AI sends your brief to the sentence-transformer Smart Match service.
          </div>
          <div className="smm-feature-item">
            <CheckCircle2 size={16} />
            Results are ranked by semantic similarity instead of manual rule scoring.
          </div>
          <div className="smm-feature-item">
            <CheckCircle2 size={16} />
            Prefer deterministic filtering? Switch to Guided Match and use rule-based matching.
          </div>
        </div>
      </section>

      <section className="smm-panel">
        <label className="smm-field-label" htmlFor="smart-match-description">
          Project brief
        </label>
        <textarea
          id="smart-match-description"
          className="smm-textarea"
          value={formData.description}
          onChange={(event) => updateFormField('description', event.target.value)}
          placeholder="Example: I need a clean e-commerce website for my clothing brand with product filters, cart, payment integration, and a polished mobile experience."
        />
        <div className="smm-char-hint">
          <span>
            {formData.description.trim().length < 20
              ? `${20 - formData.description.trim().length} more characters needed`
              : 'Ready to analyze'}
          </span>
          <span>{formData.description.trim().length} chars</span>
        </div>

        {warning ? <div className="smm-callout smm-callout--warning">{warning}</div> : null}
        {error ? <div className="smm-callout smm-callout--error">{error}</div> : null}

        <div className="smm-footer-actions">
          <button type="button" className="smm-btn smm-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="smm-btn smm-btn--primary"
            onClick={() => submitMatch('ai')}
            disabled={formData.description.trim().length < 20}
          >
            Find Matches with AI
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );

  const renderGuidedStep = () => (
    <div className="smm-form-grid">
      <section className="smm-panel">
        <div className="smm-stepper" aria-label="Guided smart match steps">
          {GUIDED_STEPS.map((step, index) => (
            <div
              key={step}
              className={`smm-step ${
                step === guidedStep ? 'is-active' : index < stepIndex ? 'is-complete' : ''
              }`}
            >
              <span className="smm-step-index">{index + 1}</span>
              <span className="smm-step-label">{step}</span>
            </div>
          ))}
        </div>

        {guidedStep === 'category' ? (
          <>
            <div className="smm-panel-header smm-panel-header--compact">
              <div className="smm-pill">
                <SearchCheck size={14} />
                Guided Match
              </div>
              <h3>Choose the main category first.</h3>
              <p>Select the lane that best matches the work you want to hire for.</p>
            </div>

            <div className="smm-category-grid">
              {CATEGORY_META.filter((item) => CREATOR_MAIN_CATEGORIES.includes(item.label)).map((item) => {
                const Icon = item.icon;
                const isActive = formData.category === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`smm-category-card ${isActive ? 'is-active' : ''}`}
                    style={{ '--smm-accent': item.accent }}
                    onClick={() => handleCategorySelect(item.label)}
                  >
                    <span className="smm-category-icon">
                      <Icon size={22} />
                    </span>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {guidedStep === 'skills' ? (
          <>
            <div className="smm-panel-header smm-panel-header--compact">
              <h3>Select the skills you need.</h3>
              <p>Choose every skill that matters so the rule-based guided search can score the shortlist.</p>
            </div>

            <div className="smm-skill-grid">
              {availableSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`smm-skill-chip ${
                    formData.selectedSkills.includes(skill) ? 'is-active' : ''
                  }`}
                  onClick={() => handleSkillToggle(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {guidedStep === 'details' ? (
          <>
            <div className="smm-panel-header smm-panel-header--compact">
              <h3>Add extra project details.</h3>
              <p>
                This step is optional, but a short brief helps the results feel less generic.
              </p>
            </div>

            <label className="smm-field-label" htmlFor="guided-match-description">
              Extra details
            </label>
            <textarea
              id="guided-match-description"
              className="smm-textarea smm-textarea--short"
              value={formData.description}
              onChange={(event) => updateFormField('description', event.target.value)}
              placeholder="Optional: mention style, audience, deliverables, or any non-negotiable requirements."
            />
          </>
        ) : null}

        {guidedStep === 'budget' ? (
          <>
            <div className="smm-panel-header smm-panel-header--compact">
              <h3>Set your budget and delivery target.</h3>
              <p>This helps prioritize creators whose offers are aligned with your project scope.</p>
            </div>

            <div className="smm-budget-card">
              <div className="smm-budget-top">
                <span className="smm-field-label">Budget target</span>
                <strong>{formatBudgetValue(formData.budget)}</strong>
              </div>
              <input
                className="smm-range"
                type="range"
                min="500"
                max="50000"
                step="500"
                value={formData.budget}
                onChange={(event) => updateFormField('budget', Number(event.target.value))}
              />
              <div className="smm-range-labels">
                <span>{formatBudgetValue(500)}</span>
                <span>{formatBudgetValue(50000)}</span>
              </div>
            </div>

            <div className="smm-deadline-grid">
              {DEADLINE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`smm-deadline-chip ${
                    formData.deadline === option ? 'is-active' : ''
                  }`}
                  onClick={() => updateFormField('deadline', option)}
                >
                  <Clock3 size={14} />
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {warning ? <div className="smm-callout smm-callout--warning">{warning}</div> : null}
        {error ? <div className="smm-callout smm-callout--error">{error}</div> : null}

        <div className="smm-footer-actions">
          <button type="button" className="smm-btn smm-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          {guidedStep !== 'category' ? (
            <button type="button" className="smm-btn smm-btn--secondary" onClick={handleGuidedBack}>
              <ArrowLeft size={15} />
              Back
            </button>
          ) : null}
          <button type="button" className="smm-btn smm-btn--primary" onClick={handleGuidedNext}>
            {guidedStep === 'budget' ? 'Find Matches' : 'Next'}
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <aside className="smm-panel smm-panel--summary">
        <div className="smm-panel-header smm-panel-header--compact">
          <h3>Current brief</h3>
          <p>Guided mode stays transparent so you can see exactly what will be matched.</p>
        </div>

        <div className="smm-summary-list">
          <div className="smm-summary-row">
            <span>Category</span>
            <strong>{formData.category || 'Not selected yet'}</strong>
          </div>
          <div className="smm-summary-row">
            <span>Skills</span>
            <strong>
              {formData.selectedSkills.length > 0
                ? `${formData.selectedSkills.length} selected`
                : 'No skills selected yet'}
            </strong>
          </div>
          <div className="smm-summary-row">
            <span>Budget</span>
            <strong>{formatBudgetValue(formData.budget)}</strong>
          </div>
          <div className="smm-summary-row">
            <span>Deadline</span>
            <strong>{formData.deadline}</strong>
          </div>
        </div>

        {formData.selectedSkills.length > 0 ? (
          <div className="smm-summary-skills">
            {formData.selectedSkills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        ) : null}

        {formData.description.trim() ? (
          <div className="smm-callout smm-callout--info">{formData.description.trim()}</div>
        ) : (
          <div className="smm-callout smm-callout--info">
            Add optional project notes if you want the match reasoning to be less generic.
          </div>
        )}
      </aside>
    </div>
  );

  const renderProcessing = () => (
    <div className="smm-processing">
        <div className="smm-processing-core">
          <div className="smm-spinner">
            <GeminiIcon size={32} />
          </div>
        <strong>{progressValue}%</strong>
        <p>{processingLabels[progressIndex]}</p>
      </div>

      <div className="smm-progress">
        <div className="smm-progress-bar" style={{ width: `${progressValue}%` }} />
      </div>

      <div className="smm-processing-steps">
        {processingLabels.map((label, index) => (
          <div
            key={label}
            className={`smm-processing-step ${index <= progressIndex ? 'is-active' : ''}`}
          >
            <span className="smm-processing-dot" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResults = () => {
    const summaryCategory = analysis?.category || formData.category || 'AI-detected category';
    const summarySkills = analysis?.skills?.length ? analysis.skills : formData.selectedSkills;
    const summaryBudget = analysis?.budget || formatBudgetValue(formData.budget);
    const summaryTimeline = analysis?.timeline || formData.deadline;

    return (
      <div className="smm-results">
        <div className="smm-results-head">
          <div>
            <div className="smm-pill">
              <Sparkles size={14} />
              {isAiResultSource ? 'AI-ranked shortlist' : 'Guided shortlist'}
            </div>
            <h3>{results.length} creator{results.length === 1 ? '' : 's'} ready to review</h3>
            <p>
              {isAiResultSource
                ? 'The results were ranked directly by the sentence-transformer Smart Match service.'
                : 'The results were ranked by rule-based scoring from the category, skills, budget, and deadline you selected.'}
            </p>
          </div>

          <button
            type="button"
            className="smm-btn smm-btn--ghost"
            onClick={() => {
              setView('form');
              setError('');
              setWarning('');
            }}
          >
            Adjust Search
          </button>
        </div>

        <div className="smm-summary-chips">
          <span>{summaryCategory}</span>
          {summarySkills?.slice(0, 4).map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
          <span>{formatBudgetValue(summaryBudget)}</span>
          <span>{summaryTimeline}</span>
        </div>

        {results.length === 0 ? (
          <div className="smm-empty">
            <AlertTriangle size={28} />
            <strong>No strong matches yet</strong>
            <p>Try broadening the category, adding a few more details, or lowering constraints.</p>
          </div>
        ) : (
          <div className="smm-results-grid">
            {results.map((result) => {
              const score = getMatchScore(result);
              const creatorId = getResultId(result);
              const scoreTone = score >= 85 ? 'is-high' : score >= 65 ? 'is-mid' : 'is-low';

              return (
                <article
                  key={`${creatorId || result.name}-${result.serviceId || result.serviceTitle || score}`}
                  className="smm-result-card"
                >
                  <div className="smm-result-top">
                    <div className="smm-result-person">
                      <Avatar
                        src={result.avatar}
                        alt={result.name || 'Creator'}
                        size={54}
                        className="smm-result-avatar"
                      />
                      <div>
                        <div className="smm-result-name-row">
                          <strong>{result.name || 'Creator'}</strong>
                          {result.verified ? (
                            <span className="smm-verified">
                              <BadgeCheck size={13} />
                              Verified
                            </span>
                          ) : null}
                        </div>
                        <span className="smm-result-role">{getResultTitle(result)}</span>
                      </div>
                    </div>

                    <div className={`smm-result-score ${scoreTone}`}>{score}%</div>
                  </div>

                  <div className="smm-result-facts">
                    <span>
                      <PhilippinePeso size={13} />
                      {result.hourlyRate ? `${formatBudgetValue(result.hourlyRate)}/hr` : 'Custom pricing'}
                    </span>
                    <span>
                      <Clock3 size={13} />
                      {result.responseTime || 'Timeline to confirm'}
                    </span>
                    <span>
                      <SearchCheck size={13} />
                      {result.rating ? `${Number(result.rating).toFixed(1)} rating` : 'New listing'}
                    </span>
                  </div>

                  <p className="smm-result-insight">{getResultSummary(result)}</p>

                  {result.aiInsight ? (
                    <div className="smm-result-ai">
                      <div className="smm-result-ai-row">
                        <span>Strength</span>
                        <strong>{result.aiInsight.strength}</strong>
                      </div>
                      {result.aiInsight.concern ? (
                        <div className="smm-result-ai-row">
                          <span>Note</span>
                          <strong>{result.aiInsight.concern}</strong>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {Array.isArray(result.skills) && result.skills.length > 0 ? (
                    <div className="smm-result-skills">
                      {result.skills.slice(0, 4).map((skill) => (
                        <span key={`${creatorId || result.name}-${skill}`}>{skill}</span>
                      ))}
                    </div>
                  ) : null}

                  <div className="smm-result-actions">
                    <button
                      type="button"
                      className="smm-btn smm-btn--secondary"
                      onClick={() => openMessages(result)}
                    >
                      <MessageSquare size={15} />
                      Message
                    </button>
                    <button
                      type="button"
                      className="smm-btn smm-btn--primary"
                      onClick={() => openCreatorProfile(result)}
                    >
                      View Profile
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="smm-overlay" role="dialog" aria-modal="true" aria-labelledby="smart-match-title">
      <div className="smm-backdrop" onClick={onClose} />
      <div className="smm-shell" onClick={(event) => event.stopPropagation()}>
        <div className="smm-header">
          <div className="smm-header-copy">
            <div className="smm-badge">
              <Sparkles size={15} />
              Smart Match
            </div>
            <div>
              <h2 id="smart-match-title">Find creators faster, with better signal.</h2>
              <p>
                Start with AI, or drop into Guided Match when you want tighter control over the
                category and required skills.
              </p>
            </div>
          </div>

          <button type="button" className="smm-close" onClick={onClose} aria-label="Close smart match">
            <X size={18} />
          </button>
        </div>

        <div className="smm-mode-row">
          <button
            type="button"
            className={`smm-mode-btn ${mode === 'ai' ? 'is-active' : ''}`}
            onClick={() => {
              setMode('ai');
              setView('form');
              setError('');
              setWarning('');
            }}
          >
            <GeminiIcon size={16} />
            AI Smart Match
          </button>
          <button
            type="button"
            className={`smm-mode-btn ${mode === 'guided' ? 'is-active' : ''}`}
            onClick={() => {
              setMode('guided');
              setView('form');
              setError('');
              setWarning('');
            }}
          >
            <SearchCheck size={16} />
            Guided Match
          </button>
        </div>

        <div className="smm-body">
          {view === 'form' ? (mode === 'ai' ? renderAiForm() : renderGuidedStep()) : null}
          {view === 'processing' ? renderProcessing() : null}
          {view === 'results' ? renderResults() : null}
        </div>
      </div>
    </div>,
    document.body
  );
};

export { SmartMatchModal };
export default SmartMatchModal;
