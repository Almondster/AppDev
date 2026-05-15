import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  BrainCircuit,
  ChevronRight,
  Clock,
  MessageSquare,
  PhilippinePeso,
  Sparkles,
  Star,
  Target,
  UserRound,
  X,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { fetchSmartMatches } from '../api';

const MAIN_CATEGORIES = [
  { id: 'design', label: 'Design & Creative', color: 'from-fuchsia-500 to-violet-600' },
  { id: 'dev', label: 'Development & IT', color: 'from-sky-500 to-blue-600' },
  { id: 'writing', label: 'Writing & Translation', color: 'from-orange-500 to-amber-500' },
  { id: 'marketing', label: 'Digital Marketing', color: 'from-emerald-500 to-teal-600' },
  { id: 'video', label: 'Video & Animation', color: 'from-rose-500 to-red-600' },
  { id: 'audio', label: 'Music & Audio', color: 'from-yellow-500 to-orange-500' },
];

const SUBCATEGORY_MAP = {
  'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
  'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
  'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Creative Writing', 'Proofreading'],
  'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
  'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
  'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

const DEADLINE_OPTIONS = ['3 days', '7 days', '14 days', '1 month'];

const INITIAL_FORM_DATA = {
  category: '',
  budget: 5000,
  deadline: '7 days',
  description: '',
  selectedSkills: [],
};

function buildQueryText(formData, mode) {
  const description = formData.description.trim();
  if (description) return description;
  if (mode === 'guided') {
    return [formData.category, ...formData.selectedSkills].filter(Boolean).join(', ');
  }
  return '';
}

function buildPrefilledMessage(creator, formData, analysis) {
  const description = (analysis?.description || formData.description || '').trim();
  const budget = analysis?.budget || `PHP ${Number(formData.budget || 0).toLocaleString()}`;
  const timeline = analysis?.timeline || formData.deadline;
  const matchedService = creator.serviceTitle ? `Matched service: ${creator.serviceTitle}` : '';

  return [
    `Hi ${creator.name}, I found your profile through Smart Match.`,
    '',
    description || `I need help with ${creator.serviceCategory || formData.category || 'a project'}.`,
    matchedService,
    `Budget: ${budget}`,
    `Timeline: ${timeline}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export const SmartMatchModal = ({ isOpen, onClose, onNavigateToMessages }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('ai');
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [matchedCreators, setMatchedCreators] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Preparing smart match...');

  const availableSkills = useMemo(
    () => (formData.category ? SUBCATEGORY_MAP[formData.category] || [] : []),
    [formData.category]
  );

  useEffect(() => {
    if (!isOpen) {
      setMode('ai');
      setStep('form');
      setFormData(INITIAL_FORM_DATA);
      setMatchedCreators([]);
      setAiAnalysis(null);
      setError('');
      setProgress(0);
      setLoadingText('Preparing smart match...');
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData((prev) => {
      if (!prev.category) return prev;
      const nextSkills = prev.selectedSkills.filter((skill) => (SUBCATEGORY_MAP[prev.category] || []).includes(skill));
      if (nextSkills.length === prev.selectedSkills.length) return prev;
      return { ...prev, selectedSkills: nextSkills };
    });
  }, [formData.category]);

  const handleSkillToggle = (skill) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter((item) => item !== skill)
        : [...prev.selectedSkills, skill],
    }));
  };

  const handleStartMatch = async () => {
    const queryText = buildQueryText(formData, mode);

    if (mode === 'ai' && queryText.length < 20) {
      setError('Describe your project in more detail so the matcher has enough context.');
      return;
    }

    if (mode === 'guided' && !formData.category) {
      setError('Choose a category first.');
      return;
    }

    setError('');
    setStep('processing');
    setProgress(12);
    setLoadingText('Building your project brief...');

    try {
      const payload = {
        mode,
        query: queryText,
        description: formData.description.trim(),
        category: formData.category,
        budget: Number(formData.budget || 0) || undefined,
        deadline: formData.deadline,
        timeline: formData.deadline,
        selected_skills: formData.selectedSkills,
        skills: formData.selectedSkills,
        limit: 6,
        save_matches: true,
      };

      setProgress(38);
      setLoadingText('Sending your request to the ML matcher...');

      const smartRes = await fetchSmartMatches(payload);
      if (!smartRes?.ok) {
        throw new Error(smartRes?.data?.detail || 'Smart Match request failed.');
      }

      setProgress(76);
      setLoadingText('Ranking the best services and creators...');

      const response = smartRes.data || {};
      const results = response.matches || response.results || [];

      setAiAnalysis(response.analysis || null);
      setMatchedCreators(results.slice(0, 6));
      setProgress(100);
      setLoadingText('Matches ready.');
      setTimeout(() => setStep('results'), 200);
    } catch (err) {
      console.error('Smart Match failed:', err);
      setError(err.message || 'Failed to fetch smart matches.');
      setMatchedCreators([]);
      setStep('form');
    }
  };

  const openMessages = (creator) => {
    const message = buildPrefilledMessage(creator, formData, aiAnalysis);
    if (onNavigateToMessages) {
      onNavigateToMessages(creator.id, message, true);
      onClose?.();
      return;
    }
    navigate(`/messages?to=${creator.id}&prefilledMessage=${encodeURIComponent(message)}&fromSmartMatch=true`);
    onClose?.();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#070707]/95 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.05] to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-blue-600 shadow-lg shadow-fuchsia-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Smart Match</h2>
                <p className="text-sm text-zinc-400">
                  Describe what you need and the web app will call the same ML matcher used by the mobile flow.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 inline-flex rounded-2xl border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                mode === 'ai' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              AI Smart Match
            </button>
            <button
              type="button"
              onClick={() => setMode('guided')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                mode === 'guided' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Guided Match
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-6">
          {step === 'form' && (
            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
              <div className="space-y-6">
                {mode === 'ai' ? (
                  <GlassCard className="p-6">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                      <BrainCircuit size={16} className="text-fuchsia-400" />
                      Describe your project
                    </div>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={8}
                      placeholder="Example: I need a modern e-commerce website for my clothing brand with product filters, cart, checkout, and mobile-first design. Budget is around PHP 25,000 and I need it within 2 weeks."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-6 text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span>Give the matcher clear deliverables, budget context, and timeline.</span>
                      <span>{formData.description.trim().length} chars</span>
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard className="p-6">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                      <Target size={16} className="text-sky-400" />
                      Guided requirements
                    </div>

                    <div className="space-y-5">
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Category</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {MAIN_CATEGORIES.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  category: category.label,
                                  selectedSkills: [],
                                }))
                              }
                              className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                                formData.category === category.label
                                  ? 'border-white/30 bg-white text-black'
                                  : 'border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className={`mb-3 h-2 w-20 rounded-full bg-gradient-to-r ${category.color}`} />
                              <div className="text-sm font-semibold">{category.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {formData.category && (
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Relevant skills</p>
                          <div className="flex flex-wrap gap-2">
                            {availableSkills.map((skill) => {
                              const active = formData.selectedSkills.includes(skill);
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => handleSkillToggle(skill)}
                                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                                    active
                                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                                      : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]'
                                  }`}
                                >
                                  {skill}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Optional notes
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          placeholder="Add extra context, brand style, deliverables, or technical requirements."
                          className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none"
                        />
                      </div>
                    </div>
                  </GlassCard>
                )}

                <GlassCard className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Budget
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={formData.budget}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            budget: Number(e.target.value || 0),
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Deadline
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {DEADLINE_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, deadline: option }))}
                            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${
                              formData.deadline === option
                                ? 'border-white bg-white text-black'
                                : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleStartMatch}
                    className="min-w-[220px] bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white hover:opacity-95"
                  >
                    Find Matches
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <GlassCard className="p-6">
                  <div className="mb-4 text-sm font-semibold text-white">Current request summary</div>
                  <div className="space-y-3 text-sm text-zinc-400">
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Mode</div>
                      <div className="text-white">{mode === 'ai' ? 'AI Smart Match' : 'Guided Match'}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Category</div>
                      <div className="text-white">{formData.category || 'Auto-detect from description'}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {(formData.selectedSkills.length ? formData.selectedSkills : ['No explicit skills selected']).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex min-h-[420px] flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-8 h-32 w-32">
                <div className="absolute inset-0 rounded-full border-t-2 border-fuchsia-500 animate-spin" />
                <div
                  className="absolute inset-3 rounded-full border-r-2 border-sky-500 animate-spin"
                  style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    <BrainCircuit size={30} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="text-4xl font-light text-white">{progress}%</div>
              <p className="mt-2 text-sm font-medium text-zinc-400">{loadingText}</p>

              <div className="mt-8 w-full max-w-xl">
                <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-white">Top Matches</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {matchedCreators.length > 0
                      ? `Found ${matchedCreators.length} relevant creator${matchedCreators.length > 1 ? 's' : ''} for this request.`
                      : 'No strong matches yet for this request.'}
                  </p>
                </div>

                <Button variant="secondary" onClick={() => setStep('form')}>
                  Modify Search
                </Button>
              </div>

              {aiAnalysis && (
                <GlassCard className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Sparkles size={16} className="text-fuchsia-400" />
                    Match summary
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Description</div>
                      <div className="text-sm text-zinc-300">{aiAnalysis.description || 'No summary returned.'}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Category</div>
                      <div className="text-sm text-zinc-300">{aiAnalysis.category || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Budget</div>
                      <div className="text-sm text-zinc-300">{aiAnalysis.budget || 'Open budget'}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Timeline</div>
                      <div className="text-sm text-zinc-300">{aiAnalysis.timeline || 'Flexible'}</div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {matchedCreators.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
                    <AlertCircle className="text-zinc-500" />
                  </div>
                  <p className="text-lg text-white">No matches found.</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Try adding more project detail, choosing a category, or widening the budget and timeline.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {matchedCreators.map((creator) => (
                    <GlassCard key={`${creator.id}-${creator.serviceId || creator.serviceTitle || 'match'}`} className="relative flex flex-col p-5">
                      <div className="absolute right-4 top-4">
                        <div className="rounded-full bg-gradient-to-br from-emerald-400 to-blue-600 px-3 py-1 text-sm font-bold text-white">
                          {creator.matchScore}%
                        </div>
                      </div>

                      <div className="mb-5 flex items-start gap-4 pr-16">
                        <Avatar src={creator.avatar} alt={creator.name} size={64} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-lg font-semibold text-white">{creator.name}</h4>
                            {creator.verified && <BadgeCheck size={16} className="text-sky-400" />}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                            {creator.jobTitle || creator.bio || 'Creator'}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <Star size={12} className="text-amber-400" fill="currentColor" />
                              {creator.rating != null ? Number(creator.rating).toFixed(1) : 'New'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} />
                              {creator.responseTime || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(creator.serviceTitle || creator.serviceDescription) && (
                        <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Best matching service</div>
                          <div className="text-sm font-semibold text-white">{creator.serviceTitle || 'Matched service'}</div>
                          <div className="mt-1 text-xs text-fuchsia-300">{creator.serviceCategory || 'General'}</div>
                          {creator.serviceDescription && (
                            <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{creator.serviceDescription}</p>
                          )}
                        </div>
                      )}

                      {creator.aiInsight?.reason && (
                        <div className="mb-4 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-300">Why it matched</div>
                          <p className="text-sm leading-6 text-zinc-100">{creator.aiInsight.reason}</p>
                        </div>
                      )}

                      {creator.skills?.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {creator.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mb-5 mt-auto grid gap-3 text-sm text-zinc-400">
                        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
                          <span className="inline-flex items-center gap-1">
                            <PhilippinePeso size={14} />
                            Starting price
                          </span>
                          <span className="font-semibold text-white">
                            {Number(creator.hourlyRate || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
                          <span className="inline-flex items-center gap-1">
                            <UserRound size={14} />
                            Experience
                          </span>
                          <span className="font-semibold text-white">
                            {creator.experienceYears ? `${creator.experienceYears} years` : 'New'}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        {creator.serviceId && (
                          <Button
                            onClick={() => navigate(`/services/${creator.serviceId}`)}
                            className="w-full bg-white text-black"
                          >
                            View Service
                          </Button>
                        )}
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button variant="secondary" onClick={() => navigate(`/creator-profile?uid=${creator.id}`)}>
                            View Profile
                          </Button>
                          <Button
                            onClick={() => openMessages(creator)}
                            className="bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white"
                          >
                            <MessageSquare size={14} />
                            Message
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SmartMatchModal;
