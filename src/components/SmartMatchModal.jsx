import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, ChevronRight, BrainCircuit, Star, Zap, Clock, PhilippinePeso, BadgeCheck, Grid3x3, AlertCircle, TrendingUp, Target } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { CATEGORIES, SUBCATEGORY_MAP } from '../constants';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { fetchSmartMatches } from '../api';
import { getGeminiApiUrl, isGeminiConfigured } from '../config/gemini';

// Match Result Type with AI insights

// Gemini Response Types
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const SmartMatchModal = ({
  isOpen,
  onClose,
  onNavigateToMessages
}) => {
  const [mode, setMode] = useState('ai'); // AI Smart Mode or Guided Mode
  const [step, setStep] = useState('form');
  const [guidedStep, setGuidedStep] = useState('category'); // New guided steps
  const [formData, setFormData] = useState({
    category: '',
    budget: 500,
    deadline: '7 days',
    description: '',
    selectedSkills: []
  });

  // Processing State
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Smart Match...');
  const [matchedCreators, setMatchedCreators] = useState([]);
  const [error, setError] = useState('');
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Get skills for selected category
  const availableSkills = formData.category && SUBCATEGORY_MAP[formData.category] ? SUBCATEGORY_MAP[formData.category] : [];

  // Clear selected skills when category changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: []
    }));
  }, [formData.category]);
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setGuidedStep('category');
      setProgress(0);
      setError('');
      setShowInvalidModal(false);
      setFormData({
        category: '',
        budget: 500,
        deadline: '7 days',
        description: '',
        selectedSkills: []
      });
    }
  }, [isOpen]);
  const handleNextGuidedStep = () => {
    if (guidedStep === 'category') {
      if (!formData.category) {
        setError('Please select a category');
        return;
      }
      setGuidedStep('skills');
      setError('');
    } else if (guidedStep === 'skills') {
      if (formData.selectedSkills.length === 0) {
        setError('Please select at least one skill');
        return;
      }
      setGuidedStep('details');
      setError('');
    } else if (guidedStep === 'details') {
      setGuidedStep('budget');
      setError('');
    } else if (guidedStep === 'budget') {
      startMatching();
    }
  };
  const handleBackGuidedStep = () => {
    if (guidedStep === 'budget') setGuidedStep('details');else if (guidedStep === 'details') setGuidedStep('skills');else if (guidedStep === 'skills') setGuidedStep('category');
  };
  const handleSkillToggle = skill => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill) ? prev.selectedSkills.filter(s => s !== skill) : [...prev.selectedSkills, skill]
    }));
  };
  const startMatching = async () => {
    setStep('processing');
    setError('');

    // For AI mode, validate description
    if (mode === 'ai' && !formData.description.trim()) {
      setError('Please describe your project for AI analysis');
      setStep('form');
      return;
    }

    // For Guided mode, validate category
    if (mode === 'guided' && !formData.category) {
      setError('Please select a category');
      setStep('form');
      return;
    }
    try {
      setProgress(10);
      setLoadingText('Scanning creator profiles...');

      // Preferred path: backend-powered Smart Match (FastAPI),
      // with graceful fallback to legacy local logic below.
      const smartRes = await fetchSmartMatches({
        mode,
        description: formData.description,
        category: formData.category,
        budget: formData.budget,
        deadline: formData.deadline,
        selected_skills: formData.selectedSkills,
        limit: 6,
        save_matches: true
      });
      if (smartRes?.ok && smartRes?.data?.matches) {
        setProgress(100);
        setAiAnalysis(smartRes.data.analysis || null);
        setMatchedCreators((smartRes.data.matches || []).slice(0, 6));
        setTimeout(() => setStep('results'), 250);
        return;
      }

      // Fetch creator stats (avg_rating, review_count)
      const {
        data: statsData,
        error: statsError
      } = await supabase.from('creator_stats').select('*');
      if (statsError) throw statsError;
      const statsMap = new Map(statsData?.map(s => [s.firebase_uid, s]));

      // Fetch creators from database
      const {
        data: creatorsData,
        error: dbError
      } = await supabase.from('creators').select(`
                    *,
                    user:users!user_id(*)
                `).limit(20);
      if (dbError) throw dbError;
      setProgress(30);
      setLoadingText('Analyzing compatibility...');

      // Get blocked users
      const currentUser = auth.currentUser;
      let blockedIds = [];
      if (currentUser) {
        const {
          data: blocksData
        } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', currentUser.uid);
        if (blocksData) {
          blockedIds = blocksData.map(b => b.blocked_id);
        }
      }

      // Map to UserType format
      const creators = creatorsData.filter(c => !blockedIds.includes(c.user?.firebase_uid)).map(c => {
        const creatorStats = statsMap.get(c.user?.firebase_uid);
        const avgRating = creatorStats ? parseFloat(creatorStats.avg_rating || 0) : 0;
        const reviewCount = creatorStats ? parseInt(creatorStats.total_reviews || 0) : 0;
        return {
          id: c.user?.firebase_uid || 'unknown',
          name: c.user?.full_name || 'Unknown',
          avatar: c.user?.avatar_url,
          role: 'creator',
          jobTitle: c.bio ? c.bio.substring(0, 50) : 'Creator',
          bio: c.bio,
          skills: c.skills || [],
          location: c.user?.city || 'Remote',
          rating: reviewCount > 0 ? avgRating : null,
          reviewCount: reviewCount,
          hourlyRate: parseFloat(c.starting_price) || 0,
          verified: c.verification_status === 'verified',
          experienceYears: c.experience_years || 0,
          responseTime: c.turnaround_time || 'Not specified',
          portfolioUrl: c.portfolio_url || ''
        };
      });
      setProgress(60);
      let rankedCreators;
      let projectAnalysis = null;

      // AI Smart Mode - Use Gemini
      if (mode === 'ai' && isGeminiConfigured()) {
        setLoadingText('AI analyzing your project...');
        try {
          // Step 1: Analyze project description with validation
          projectAnalysis = await analyzeProjectWithAI(formData.description);
          setAiAnalysis(projectAnalysis);

          // Check if project is valid (not a test/demo)
          if (projectAnalysis.isValid === false) {
            setShowInvalidModal(true);
            setStep('form');
            return;
          }
          setProgress(75);
          setLoadingText('AI ranking creators...');

          // Step 2: Rank creators with AI using extracted skills
          rankedCreators = await rankCreatorsWithAI(creators, formData.description, projectAnalysis);

          // Filter out creators with scores below 40 (poor matches)
          console.log('🎯 Before filter:', rankedCreators.length, 'creators');
          rankedCreators = rankedCreators.filter(c => c.matchScore >= 40);
          console.log('✅ After filter (≥40):', rankedCreators.length, 'creators');
        } catch (aiError) {
          console.error('AI analysis failed, using fallback:', aiError);
          setLoadingText('Using smart fallback ranking...');
          // Use AI-extracted skills for fallback if available
          const fallbackFormData = {
            ...formData,
            selectedSkills: projectAnalysis?.skills || formData.selectedSkills,
            category: projectAnalysis?.category || formData.category
          };
          rankedCreators = fallbackRanking(creators, fallbackFormData);
        }
      } else {
        // Guided Mode or AI not configured - Use fallback
        setLoadingText('Calculating best matches...');
        rankedCreators = fallbackRanking(creators, formData);
      }
      setProgress(95);
      setLoadingText('Finalizing matches...');

      // Save top matches to database
      if (currentUser && rankedCreators.length > 0) {
        const matchesToSave = rankedCreators.slice(0, 5).map(creator => ({
          client_id: currentUser.uid,
          creator_id: creator.id,
          match_score: creator.matchScore,
          project_description: formData.description || `${formData.category} project`,
          reasons: creator.aiInsight ? [creator.aiInsight.reason] : creator.matchReasons,
          status: 'new'
        }));
        await supabase.from('matches').insert(matchesToSave);
      }
      setProgress(100);
      setMatchedCreators(rankedCreators.slice(0, 6));
      setTimeout(() => setStep('results'), 500);
    } catch (err) {
      console.error("Error matching creators:", err);
      setError('Failed to find matches. Please try again.');
      setMatchedCreators([]);
      setStep('form');
    }
  };

  // AI Analysis Function (matches RN app exactly)
  const analyzeProjectWithAI = async description => {
    const prompt = `You are an expert project analyzer for a freelance marketplace. Analyze this project description and extract key information.

PROJECT DESCRIPTION:
"${description}"

⚠️ VALIDATION FIRST:
- If this is a test post, demo request, or platform functionality check with NO actual work required, return {"isValid": false}
- If the description is vague, random text, or doesn't clearly describe a real project need, return {"isValid": false}
- Only proceed if this is a REAL project request with clear deliverables

YOUR TASK (only if valid):
1. Identify the main category from: ${CATEGORIES.join(', ')}
2. Extract relevant skills/subcategories needed
3. Extract the **EXACT** budget if stated (e.g., "120,000 php"). Only estimate if not stated.
4. Extract the **EXACT** timeline if stated (e.g., "5 days"). Only estimate if not stated.

Respond ONLY with valid JSON:
{
  "isValid": true/false,
  "category": "exact category name from list",
  "skills": ["skill1", "skill2", "skill3"],
  "budget": "exact value or estimated range",
  "timeline": "exact value or estimated timeline",
  "description": "cleaned/improved version of the project description"
}

IMPORTANT: Return ONLY the JSON object, no markdown, no other text.`;
    const response = await fetch(getGeminiApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    if (!response.ok) throw new Error('Gemini API failed');
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in response');
    return JSON.parse(jsonMatch[0]);
  };

  // AI Ranking Function (matches RN app's sophisticated analysis)
  const rankCreatorsWithAI = async (creators, projectDesc, analysis) => {
    const creatorsInfo = creators.slice(0, 10).map((c, index) => ({
      index,
      name: c.name,
      bio: c.bio || 'No bio provided',
      skills: c.skills || [],
      experience: c.experienceYears || '0',
      pricing: c.hourlyRate ? `₱${c.hourlyRate}/hr` : 'Not specified',
      turnaround: c.responseTime || 'Not specified',
      portfolio: c.portfolioUrl || 'No portfolio'
    }));
    const prompt = `You are an elite AI matching system for a freelance marketplace. Conduct a comprehensive analysis of project requirements against creator profiles to find the perfect match.

📋 PROJECT DETAILS:
Category: ${analysis.category}
Required Skills: ${analysis.skills.join(', ')}
Budget: ${analysis.budget}
Timeline: ${analysis.timeline}
Description: ${projectDesc}

👥 AVAILABLE CREATORS:
${creatorsInfo.map(c => `
${c.name}
• Bio: ${c.bio}
• Skills: ${c.skills.join(', ')}
• Experience: ${c.experience} years
• Pricing: ${c.pricing}
• Turnaround: ${c.turnaround}
• Portfolio: ${c.portfolio}`).join('\n')}

🎯 YOUR TASK:
For each creator, provide:
1. **Match Score (0-100)**: How well they fit this specific project
2. **Personalized Reason**: Why they're a good/bad fit for THIS project
3. **Strength**: Their #1 advantage for this project
4. **Concern**: Main risk or limitation (if score < 80)

📊 EVALUATION CRITERIA (STRICT):
✓ **Skills must DIRECTLY match** - Generic skills like "Support & IT" don't match "Web Development" projects
✓ **Experience must be RELEVANT** - A voice actress can't do web development, even if they claim 69 years experience
✓ **Category alignment is MANDATORY** - Creative designers cannot do IT projects, and vice versa
✓ Portfolio relevance to project category
✓ Budget compatibility (reject if creator pricing is 10x+ over budget)
✓ Timeline feasibility given turnaround time
✓ Bio demonstrates understanding of similar work

💡 BE INTELLIGENT AND STRICT:
- Give 0-40 scores if skills are completely misaligned with project category
- Don't stretch interpretations ("platform testing" ≠ "platform development")
- A designer with illustration skills cannot do software development
- Reject joke profiles, test accounts, or obviously fake experience
- Only score 60+ if there's CLEAR skill and category alignment
- Consider if a 5-year expert is overkill for a simple project
- Flag if pricing is suspiciously low/high for stated experience

Respond ONLY with valid JSON:
[
  {
    "index": 0,
    "score": 95,
    "reason": "Perfect match: 5y experience in mobile apps, portfolio shows 12 similar projects, pricing aligns with your budget",
    "strength": "Proven track record with 4.8★ rating and specialization in your exact category",
    "concern": ""
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown, no other text.`;
    const response = await fetch(getGeminiApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    if (!response.ok) {
      console.error('Gemini API failed:', response.status, response.statusText);
      throw new Error('Gemini ranking failed');
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    console.log('🤖 Gemini AI Response:', text.substring(0, 500)); // Debug log

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON in AI response:', text);
      throw new Error('No valid JSON array in response');
    }
    const rankings = JSON.parse(jsonMatch[0]);
    console.log('✅ AI Rankings parsed:', rankings.length, 'creators');
    rankings.slice(0, 3).forEach(r => {
      console.log(`  Creator ${r.index}: Score ${r.score} - ${r.reason.substring(0, 60)}...`);
    });

    // Map rankings to MatchResult and validate scores
    const results = rankings.map(rank => {
      const creator = creators[rank.index];
      if (!creator) {
        console.warn('Creator not found at index:', rank.index);
        return null;
      }

      // Validate AI score is reasonable
      if (rank.score > 100 || rank.score < 0) {
        console.warn(`Invalid score ${rank.score} for creator ${creator.name}, capping to valid range`);
        rank.score = Math.max(0, Math.min(100, rank.score));
      }
      return {
        ...creator,
        matchScore: rank.score,
        matchReasons: [rank.strength, `AI Match: ${rank.score}%`],
        aiInsight: {
          score: rank.score,
          reason: rank.reason,
          strength: rank.strength,
          concern: rank.concern
        }
      };
    }).filter(Boolean);

    // Sort by score descending
    return results.sort((a, b) => b.matchScore - a.matchScore);
  };

  // Fallback ranking (when AI not available) - matches RN app logic
  const fallbackRanking = (creators, formData) => {
    console.log('📊 Fallback ranking with skills:', formData.selectedSkills);
    return creators.map(creator => {
      // Count unique matches by checking if each SELECTED skill exists in creator's skills
      // This prevents duplicate skills in creator profile from inflating the score
      const creatorSkills = new Set(creator.skills || []);
      const matchCount = formData.selectedSkills.filter(s => creatorSkills.has(s)).length;
      const matchPercentage = Math.round(matchCount / formData.selectedSkills.length * 100);
      return {
        ...creator,
        matchScore: matchPercentage,
        matchReasons: [`${matchCount}/${formData.selectedSkills.length} skills match`]
      };
    }).filter(c => c.matchScore > 0) // Only show creators with at least 1 matching skill
    .sort((a, b) => b.matchScore - a.matchScore);
  };
  if (!isOpen) return null;
  return /*#__PURE__*/createPortal(/*#__PURE__*/_jsxs("div", {
    className: "fixed inset-0 z-[100] flex items-center justify-center p-4",
    children: [/*#__PURE__*/_jsx("div", {
      className: "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity",
      onClick: onClose
    }), /*#__PURE__*/_jsxs("div", {
      className: "relative w-full max-w-5xl bg-gradient-to-br from-zinc-900/95 to-black/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] backdrop-blur-xl",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "p-6 border-b border-white/10 bg-black/30 flex flex-col gap-6",
        children: [/*#__PURE__*/_jsxs("div", {
          className: "flex items-center justify-between",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-3",
            children: [/*#__PURE__*/_jsx("div", {
              className: "w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30",
              children: /*#__PURE__*/_jsx(Sparkles, {
                className: "text-white w-5 h-5"
              })
            }), /*#__PURE__*/_jsxs("div", {
              children: [/*#__PURE__*/_jsx("h2", {
                className: "text-xl font-semibold text-white",
                children: "Smart Match AI"
              }), /*#__PURE__*/_jsx("p", {
                className: "text-xs text-zinc-400",
                children: "Intelligent talent matching powered by Gemini"
              })]
            })]
          }), /*#__PURE__*/_jsx("button", {
            onClick: onClose,
            className: "p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors",
            children: /*#__PURE__*/_jsx(X, {
              size: 20
            })
          })]
        }), step === 'form' && /*#__PURE__*/_jsxs("div", {
          className: "bg-white/5 p-1 rounded-xl flex border border-white/10 relative",
          children: [/*#__PURE__*/_jsx("div", {
            className: `absolute top-1 bottom-1 rounded-lg bg-white/10 border border-white/10 shadow-sm transition-all duration-300 ease-out ${mode === 'ai' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+4px)] w-[calc(50%-8px)]'}`
          }), /*#__PURE__*/_jsxs("button", {
            onClick: () => setMode('ai'),
            className: `flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 relative z-10 ${mode === 'ai' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`,
            children: [/*#__PURE__*/_jsx(BrainCircuit, {
              size: 16,
              className: mode === 'ai' ? 'text-purple-400' : ''
            }), "AI Smart Mode"]
          }), /*#__PURE__*/_jsxs("button", {
            onClick: () => setMode('guided'),
            className: `flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 relative z-10 ${mode === 'guided' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`,
            children: [/*#__PURE__*/_jsx(Grid3x3, {
              size: 16,
              className: mode === 'guided' ? 'text-blue-400' : ''
            }), "Guided Mode"]
          })]
        }), error && /*#__PURE__*/_jsxs("div", {
          className: "p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2",
          children: [/*#__PURE__*/_jsx(AlertCircle, {
            size: 16
          }), error]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex-1 overflow-y-auto p-6 md:p-8",
        children: [step === 'form' && /*#__PURE__*/_jsxs("div", {
          className: "space-y-6 animate-in slide-in-from-right-4 duration-300",
          children: [mode === 'ai' && /*#__PURE__*/_jsxs("div", {
            className: "space-y-6",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "flex items-start gap-3 mb-4",
                children: [/*#__PURE__*/_jsx("div", {
                  className: "p-2 bg-purple-500/20 rounded-lg",
                  children: /*#__PURE__*/_jsx(BrainCircuit, {
                    className: "text-purple-300 w-5 h-5"
                  })
                }), /*#__PURE__*/_jsxs("div", {
                  className: "flex-1",
                  children: [/*#__PURE__*/_jsx("h3", {
                    className: "text-white font-medium mb-1",
                    children: "AI-Powered Project Analysis"
                  }), /*#__PURE__*/_jsx("p", {
                    className: "text-sm text-zinc-400",
                    children: "Describe your project in natural language. Our AI will analyze your needs and find the perfect creators."
                  })]
                })]
              }), /*#__PURE__*/_jsx("textarea", {
                value: formData.description,
                onChange: e => setFormData({
                  ...formData,
                  description: e.target.value
                }),
                placeholder: "Example: I need a modern logo design for my tech startup. Looking for someone experienced with minimalist design, bold typography, and tech aesthetics. Budget is around $500-1000, need it done in 2 weeks...",
                rows: 6,
                className: "w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none backdrop-blur-sm"
              }), /*#__PURE__*/_jsxs("div", {
                className: "mt-4 flex items-center gap-2 text-xs text-zinc-500",
                children: [/*#__PURE__*/_jsx(Sparkles, {
                  size: 12,
                  className: "text-purple-400"
                }), /*#__PURE__*/_jsx("span", {
                  children: "AI will extract: category, skills, budget range, timeline"
                })]
              })]
            }), /*#__PURE__*/_jsxs(Button, {
              variant: "primary",
              onClick: startMatching,
              className: "w-full bg-gradient-to-r from-purple-600 to-blue-600 border-none py-4 text-lg",
              children: [/*#__PURE__*/_jsx(Sparkles, {
                size: 20,
                className: "mr-2"
              }), "Analyze & Find Matches"]
            }), !isGeminiConfigured() && /*#__PURE__*/_jsxs("div", {
              className: "p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3 text-amber-300 text-sm",
              children: [/*#__PURE__*/_jsx(AlertCircle, {
                size: 16,
                className: "mt-0.5 shrink-0"
              }), /*#__PURE__*/_jsxs("div", {
                children: [/*#__PURE__*/_jsx("p", {
                  className: "font-medium mb-1",
                  children: "Gemini API not configured"
                }), /*#__PURE__*/_jsx("p", {
                  className: "text-xs text-amber-400/70",
                  children: "AI mode will use smart fallback ranking. Add your Gemini API key in config/gemini.ts for full AI capabilities."
                })]
              })]
            })]
          }), mode === 'guided' && /*#__PURE__*/_jsxs("div", {
            className: "space-y-6",
            children: [/*#__PURE__*/_jsx("div", {
              className: "flex items-center justify-between mb-6 px-2",
              children: ['Category', 'Skills', 'Details', 'Budget'].map((s, i) => {
                const stepIndex = ['category', 'skills', 'details', 'budget'].indexOf(guidedStep);
                const isActive = i <= stepIndex;
                return /*#__PURE__*/_jsxs("div", {
                  className: "flex flex-col items-center gap-2",
                  children: [/*#__PURE__*/_jsx("div", {
                    className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-white/5 text-zinc-500 border border-white/10'}`,
                    children: i + 1
                  }), /*#__PURE__*/_jsx("span", {
                    className: `text-[10px] font-medium ${isActive ? 'text-white' : 'text-zinc-600'}`,
                    children: s
                  })]
                }, s);
              })
            }), guidedStep === 'category' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4 animate-in slide-in-from-right-4 duration-300",
              children: [/*#__PURE__*/_jsxs("label", {
                className: "text-sm font-medium text-zinc-300 flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(Target, {
                  size: 14,
                  className: "text-purple-400"
                }), "Select Project Category"]
              }), /*#__PURE__*/_jsx("div", {
                className: "grid grid-cols-2 gap-3",
                children: CATEGORIES.map(c => /*#__PURE__*/_jsxs("button", {
                  onClick: () => setFormData({
                    ...formData,
                    category: c
                  }),
                  className: `p-4 rounded-xl border text-left transition-all group relative overflow-hidden ${formData.category === c ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/10' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white hover:border-white/20'}`,
                  children: [/*#__PURE__*/_jsx("div", {
                    className: `absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 transition-opacity ${formData.category === c ? 'opacity-100' : 'group-hover:opacity-100'}`
                  }), /*#__PURE__*/_jsx("span", {
                    className: "font-medium text-sm relative z-10",
                    children: c
                  }), formData.category === c && /*#__PURE__*/_jsx("div", {
                    className: "absolute top-3 right-3 text-purple-400 animate-in zoom-in duration-300",
                    children: /*#__PURE__*/_jsx(Check, {
                      size: 16
                    })
                  })]
                }, c))
              })]
            }), guidedStep === 'skills' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4 animate-in slide-in-from-right-4 duration-300",
              children: [/*#__PURE__*/_jsxs("label", {
                className: "text-sm font-medium text-zinc-300 flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(Zap, {
                  size: 14,
                  className: "text-blue-400"
                }), "Select Required Skills", /*#__PURE__*/_jsxs("span", {
                  className: "text-zinc-500 text-xs font-normal ml-auto",
                  children: [formData.selectedSkills.length, " selected"]
                })]
              }), /*#__PURE__*/_jsx("div", {
                className: "bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1",
                children: /*#__PURE__*/_jsx("div", {
                  className: "flex flex-wrap gap-2 p-4 max-h-[300px] overflow-y-auto custom-scrollbar",
                  children: availableSkills.map(skill => {
                    const isSelected = formData.selectedSkills.includes(skill);
                    return /*#__PURE__*/_jsxs("button", {
                      onClick: () => handleSkillToggle(skill),
                      className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${isSelected ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-105' : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white'}`,
                      children: [isSelected && /*#__PURE__*/_jsx(Check, {
                        size: 10
                      }), skill]
                    }, skill);
                  })
                })
              })]
            }), guidedStep === 'details' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4 animate-in slide-in-from-right-4 duration-300",
              children: [/*#__PURE__*/_jsxs("label", {
                className: "text-sm font-medium text-zinc-300 flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(BrainCircuit, {
                  size: 14,
                  className: "text-purple-400"
                }), "Project Description"]
              }), /*#__PURE__*/_jsxs("div", {
                className: "relative",
                children: [/*#__PURE__*/_jsx("textarea", {
                  value: formData.description,
                  onChange: e => setFormData({
                    ...formData,
                    description: e.target.value
                  }),
                  placeholder: "Describe your project goals, style preferences, and specific requirements...",
                  rows: 8,
                  className: "w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none transition-all"
                }), /*#__PURE__*/_jsxs("div", {
                  className: "absolute bottom-3 right-3 text-xs text-zinc-500",
                  children: [formData.description.length, " chars"]
                })]
              })]
            }), guidedStep === 'budget' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-8 animate-in slide-in-from-right-4 duration-300",
              children: [/*#__PURE__*/_jsxs("div", {
                className: "space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10",
                children: [/*#__PURE__*/_jsxs("label", {
                  className: "text-sm font-medium text-zinc-300 flex justify-between items-center",
                  children: [/*#__PURE__*/_jsxs("span", {
                    className: "flex items-center gap-2",
                    children: [/*#__PURE__*/_jsx(PhilippinePeso, {
                      size: 16,
                      className: "text-emerald-400"
                    }), " Max Budget"]
                  }), /*#__PURE__*/_jsxs("span", {
                    className: "text-2xl font-bold text-white",
                    children: ["\u20B1", formData.budget.toLocaleString()]
                  })]
                }), /*#__PURE__*/_jsx("input", {
                  type: "range",
                  min: "500",
                  max: "50000",
                  step: "500",
                  value: formData.budget,
                  onChange: e => setFormData({
                    ...formData,
                    budget: parseInt(e.target.value)
                  }),
                  className: "w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                }), /*#__PURE__*/_jsxs("div", {
                  className: "flex justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-wider",
                  children: [/*#__PURE__*/_jsx("span", {
                    children: "\u20B1500"
                  }), /*#__PURE__*/_jsx("span", {
                    children: "\u20B150,000+"
                  })]
                })]
              }), /*#__PURE__*/_jsxs("div", {
                className: "space-y-4",
                children: [/*#__PURE__*/_jsxs("label", {
                  className: "text-sm font-medium text-zinc-300 flex items-center gap-2",
                  children: [/*#__PURE__*/_jsx(Clock, {
                    size: 16,
                    className: "text-blue-400"
                  }), "Deadline"]
                }), /*#__PURE__*/_jsx("div", {
                  className: "grid grid-cols-4 gap-3",
                  children: ['3 days', '7 days', '14 days', '1 month'].map(time => /*#__PURE__*/_jsxs("button", {
                    onClick: () => setFormData({
                      ...formData,
                      deadline: time
                    }),
                    className: `py-3 px-2 text-xs rounded-xl border transition-all font-medium flex flex-col items-center gap-1 ${formData.deadline === time ? 'bg-white text-black border-white shadow-lg scale-105' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'}`,
                    children: [/*#__PURE__*/_jsx("span", {
                      className: `w-2 h-2 rounded-full ${formData.deadline === time ? 'bg-blue-500' : 'bg-white/20'}`
                    }), time]
                  }, time))
                })]
              })]
            }), /*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-3 pt-6 mt-2 border-t border-white/5",
              children: [guidedStep !== 'category' && /*#__PURE__*/_jsx(Button, {
                variant: "secondary",
                onClick: handleBackGuidedStep,
                className: "px-6 hover:bg-white/10",
                children: "Back"
              }), /*#__PURE__*/_jsxs(Button, {
                variant: "primary",
                onClick: handleNextGuidedStep,
                className: "flex-1 bg-gradient-to-r from-purple-600 to-blue-600 border-none hover:shadow-lg hover:shadow-purple-500/20 transition-all",
                children: [guidedStep === 'budget' ? 'Find Best Matches' : 'Next Step', /*#__PURE__*/_jsx(ChevronRight, {
                  size: 16,
                  className: "ml-1"
                })]
              })]
            })]
          })]
        }), step === 'processing' && /*#__PURE__*/_jsxs("div", {
          className: "flex flex-col items-center justify-center py-16 animate-in fade-in duration-500",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "relative w-32 h-32 mb-8",
            children: [/*#__PURE__*/_jsx("div", {
              className: "absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"
            }), /*#__PURE__*/_jsx("div", {
              className: "absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin",
              style: {
                animationDirection: 'reverse',
                animationDuration: '1.5s'
              }
            }), /*#__PURE__*/_jsx("div", {
              className: "absolute inset-4 rounded-full border-t-2 border-purple-400 animate-spin",
              style: {
                animationDuration: '2s'
              }
            }), /*#__PURE__*/_jsx("div", {
              className: "absolute inset-0 flex items-center justify-center",
              children: /*#__PURE__*/_jsx("div", {
                className: "w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-white/10",
                children: /*#__PURE__*/_jsx(BrainCircuit, {
                  size: 32,
                  className: "text-white animate-pulse"
                })
              })
            })]
          }), /*#__PURE__*/_jsxs("h3", {
            className: "text-3xl font-light text-white mb-2",
            children: [progress, "%"]
          }), /*#__PURE__*/_jsx("p", {
            className: "text-zinc-400 text-sm font-mono mb-8 animate-pulse",
            children: loadingText
          }), /*#__PURE__*/_jsxs("div", {
            className: "w-full max-w-md space-y-4",
            children: [/*#__PURE__*/_jsx("div", {
              className: "h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10",
              children: /*#__PURE__*/_jsx("div", {
                className: "h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out relative",
                style: {
                  width: `${progress}%`
                },
                children: /*#__PURE__*/_jsx("div", {
                  className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                })
              })
            }), /*#__PURE__*/_jsxs("div", {
              className: "grid grid-cols-4 gap-2 text-xs text-zinc-500",
              children: [/*#__PURE__*/_jsxs("div", {
                className: `text-center transition-colors ${progress >= 30 ? 'text-purple-400' : ''}`,
                children: [/*#__PURE__*/_jsx("div", {
                  className: `w-2 h-2 rounded-full mx-auto mb-1 ${progress >= 30 ? 'bg-purple-400' : 'bg-white/10'}`
                }), "Scan"]
              }), /*#__PURE__*/_jsxs("div", {
                className: `text-center transition-colors ${progress >= 60 ? 'text-blue-400' : ''}`,
                children: [/*#__PURE__*/_jsx("div", {
                  className: `w-2 h-2 rounded-full mx-auto mb-1 ${progress >= 60 ? 'bg-blue-400' : 'bg-white/10'}`
                }), "Analyze"]
              }), /*#__PURE__*/_jsxs("div", {
                className: `text-center transition-colors ${progress >= 85 ? 'text-purple-400' : ''}`,
                children: [/*#__PURE__*/_jsx("div", {
                  className: `w-2 h-2 rounded-full mx-auto mb-1 ${progress >= 85 ? 'bg-purple-400' : 'bg-white/10'}`
                }), "Rank"]
              }), /*#__PURE__*/_jsxs("div", {
                className: `text-center transition-colors ${progress >= 100 ? 'text-emerald-400' : ''}`,
                children: [/*#__PURE__*/_jsx("div", {
                  className: `w-2 h-2 rounded-full mx-auto mb-1 ${progress >= 100 ? 'bg-emerald-400' : 'bg-white/10'}`
                }), "Done"]
              })]
            })]
          })]
        }), step === 'results' && /*#__PURE__*/_jsxs("div", {
          className: "space-y-6 animate-in slide-in-from-bottom-8 duration-500",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex items-center justify-between",
            children: [/*#__PURE__*/_jsxs("div", {
              children: [/*#__PURE__*/_jsxs("h3", {
                className: "text-2xl font-semibold text-white flex items-center gap-2",
                children: [/*#__PURE__*/_jsx(TrendingUp, {
                  size: 24,
                  className: "text-emerald-400"
                }), "Top ", matchedCreators.length, " Matches Found"]
              }), /*#__PURE__*/_jsx("p", {
                className: "text-sm text-zinc-400 mt-1",
                children: mode === 'ai' ? 'AI-ranked creators based on your project description' : 'Best matches for your requirements'
              })]
            }), /*#__PURE__*/_jsx(Button, {
              variant: "secondary",
              size: "sm",
              onClick: () => {
                setStep('form');
                setError('');
              },
              children: "Modify Search"
            })]
          }), matchedCreators.length === 0 ? /*#__PURE__*/_jsxs("div", {
            className: "py-16 text-center",
            children: [/*#__PURE__*/_jsx("div", {
              className: "w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4",
              children: /*#__PURE__*/_jsx(AlertCircle, {
                size: 32,
                className: "text-zinc-500"
              })
            }), /*#__PURE__*/_jsx("p", {
              className: "text-zinc-400",
              children: "No matches found. Try adjusting your criteria."
            }), /*#__PURE__*/_jsx(Button, {
              variant: "secondary",
              size: "sm",
              onClick: () => setStep('form'),
              className: "mt-4",
              children: "Try Again"
            })]
          }) : /*#__PURE__*/_jsx("div", {
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            children: matchedCreators.map(creator => /*#__PURE__*/_jsxs(GlassCard, {
              hoverEffect: true,
              className: "flex flex-col relative group overflow-visible",
              children: [/*#__PURE__*/_jsx("div", {
                className: "absolute -top-3 -right-3 z-10",
                children: /*#__PURE__*/_jsx("div", {
                  className: `w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-black ${creator.matchScore >= 90 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-emerald-500/40' : creator.matchScore >= 80 ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-blue-500/40' : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-purple-500/40'}`,
                  children: creator.matchScore
                })
              }), /*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [/*#__PURE__*/_jsxs("div", {
                  className: "relative",
                  children: [/*#__PURE__*/_jsx(Avatar, {
                    src: creator.avatar,
                    alt: creator.name,
                    size: 64,
                    className: "w-16 h-16 rounded-full border-2 border-white/20 object-cover"
                  }), creator.verified && /*#__PURE__*/_jsx("div", {
                    className: "absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 border-2 border-black",
                    children: /*#__PURE__*/_jsx(BadgeCheck, {
                      size: 12,
                      fill: "currentColor"
                    })
                  })]
                }), /*#__PURE__*/_jsxs("div", {
                  className: "flex-1 min-w-0",
                  children: [/*#__PURE__*/_jsx("h4", {
                    className: "text-white font-semibold truncate",
                    children: creator.name
                  }), /*#__PURE__*/_jsx("p", {
                    className: "text-xs text-zinc-400 line-clamp-1",
                    children: creator.jobTitle
                  }), /*#__PURE__*/_jsxs("div", {
                    className: "flex items-center gap-2 mt-1",
                    children: [/*#__PURE__*/_jsxs("div", {
                      className: "flex items-center gap-1 text-amber-400 text-xs",
                      children: [/*#__PURE__*/_jsx(Star, {
                        size: 10,
                        fill: "currentColor"
                      }), " ", creator.rating != null ? typeof creator.rating === 'number' ? creator.rating.toFixed(1) : creator.rating : 'New']
                    }), /*#__PURE__*/_jsx("span", {
                      className: "text-xs text-zinc-600",
                      children: "\u2022"
                    }), /*#__PURE__*/_jsx("span", {
                      className: "text-xs text-zinc-500",
                      children: creator.location
                    })]
                  })]
                })]
              }), creator.aiInsight && /*#__PURE__*/_jsxs("div", {
                className: "mb-4 space-y-2",
                children: [/*#__PURE__*/_jsx("div", {
                  className: "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3 space-y-2",
                  children: /*#__PURE__*/_jsxs("div", {
                    className: "flex items-start gap-2",
                    children: [/*#__PURE__*/_jsx(Sparkles, {
                      size: 12,
                      className: "text-purple-400 mt-0.5 shrink-0"
                    }), /*#__PURE__*/_jsx("p", {
                      className: "text-xs text-white/90 leading-relaxed",
                      children: creator.aiInsight.reason
                    })]
                  })
                }), /*#__PURE__*/_jsxs("div", {
                  className: "grid grid-cols-2 gap-2",
                  children: [/*#__PURE__*/_jsxs("div", {
                    className: "bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2",
                    children: [/*#__PURE__*/_jsx("p", {
                      className: "text-[9px] text-emerald-400 uppercase font-semibold mb-0.5",
                      children: "Strength"
                    }), /*#__PURE__*/_jsx("p", {
                      className: "text-[10px] text-white/80 leading-tight",
                      children: creator.aiInsight.strength
                    })]
                  }), /*#__PURE__*/_jsxs("div", {
                    className: "bg-amber-500/10 border border-amber-500/20 rounded-lg p-2",
                    children: [/*#__PURE__*/_jsx("p", {
                      className: "text-[9px] text-amber-400 uppercase font-semibold mb-0.5",
                      children: "Note"
                    }), /*#__PURE__*/_jsx("p", {
                      className: "text-[10px] text-white/80 leading-tight",
                      children: creator.aiInsight.concern
                    })]
                  })]
                })]
              }), !creator.aiInsight && creator.skills && creator.skills.length > 0 && /*#__PURE__*/_jsx("div", {
                className: "mb-4 flex flex-wrap gap-1.5",
                children: creator.skills.slice(0, 4).map((skill, idx) => /*#__PURE__*/_jsx("span", {
                  className: "text-[10px] px-2 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/10",
                  children: skill
                }, idx))
              }), !creator.aiInsight && creator.matchReasons && /*#__PURE__*/_jsxs("div", {
                className: "mb-4 bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]",
                children: [/*#__PURE__*/_jsx("p", {
                  className: "text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2",
                  children: "Why this match?"
                }), /*#__PURE__*/_jsx("div", {
                  className: "flex flex-wrap gap-1.5",
                  children: creator.matchReasons.map((reason, idx) => /*#__PURE__*/_jsxs("span", {
                    className: "text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1",
                    children: [/*#__PURE__*/_jsx(Check, {
                      size: 8
                    }), " ", reason]
                  }, idx))
                })]
              }), /*#__PURE__*/_jsxs("div", {
                className: "mt-auto space-y-3",
                children: [/*#__PURE__*/_jsxs("div", {
                  className: "flex justify-between items-center text-xs",
                  children: [/*#__PURE__*/_jsxs("div", {
                    className: "flex items-center gap-1 text-zinc-400",
                    children: [/*#__PURE__*/_jsx(PhilippinePeso, {
                      size: 12
                    }), /*#__PURE__*/_jsxs("span", {
                      className: "text-white font-medium",
                      children: [creator.hourlyRate, "/hr"]
                    })]
                  }), /*#__PURE__*/_jsxs("div", {
                    className: "flex items-center gap-1 text-zinc-500",
                    children: [/*#__PURE__*/_jsx(Clock, {
                      size: 12
                    }), /*#__PURE__*/_jsx("span", {
                      children: "Fast reply"
                    })]
                  })]
                }), /*#__PURE__*/_jsxs("div", {
                  className: "flex gap-2",
                  children: [/*#__PURE__*/_jsx(Button, {
                    className: "flex-1 bg-white text-black hover:bg-zinc-200 border-none",
                    size: "sm",
                    onClick: () => {
                      if (onNavigateToMessages) {
                        const budgetDisplay = aiAnalysis ? aiAnalysis.budget : `₱${formData.budget}`;
                        const deadlineDisplay = aiAnalysis ? aiAnalysis.timeline : formData.deadline;
                        const message = formData.description ? `Hi ${creator.name}, I'd like to discuss a project.\n\n${formData.description}\n\nBudget: ${budgetDisplay}\nDeadline: ${deadlineDisplay}` : `Hi ${creator.name}, I found you via Smart Match. I have a ${formData.category} project I'd like to discuss.\n\nBudget: ${budgetDisplay}\nDeadline: ${deadlineDisplay}`;
                        onNavigateToMessages(creator.id, message, true // fromSmartMatch
                        );
                      }
                      onClose();
                    },
                    children: "Message"
                  }), /*#__PURE__*/_jsx(Button, {
                    variant: "secondary",
                    className: "flex-1",
                    size: "sm",
                    children: "Profile"
                  })]
                })]
              })]
            }, creator.id))
          })]
        })]
      }), step === 'results' && /*#__PURE__*/_jsx("div", {
        className: "p-6 border-t border-white/10 bg-black/30 flex justify-end",
        children: /*#__PURE__*/_jsx(Button, {
          onClick: onClose,
          className: "bg-white text-black hover:bg-zinc-200",
          children: "Close"
        })
      })]
    }), showInvalidModal && /*#__PURE__*/_jsx("div", {
      className: "absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50",
      children: /*#__PURE__*/_jsx("div", {
        className: "bg-gradient-to-br from-zinc-900/95 to-black/95 border border-white/10 rounded-2xl p-8 max-w-md w-full backdrop-blur-xl",
        children: /*#__PURE__*/_jsxs("div", {
          className: "flex flex-col items-center text-center",
          children: [/*#__PURE__*/_jsx("div", {
            className: "w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6",
            children: /*#__PURE__*/_jsx(AlertCircle, {
              size: 40,
              className: "text-amber-400"
            })
          }), /*#__PURE__*/_jsx("h3", {
            className: "text-xl font-semibold text-white mb-3",
            children: "Not a Valid Project"
          }), /*#__PURE__*/_jsx("p", {
            className: "text-sm text-zinc-400 leading-relaxed mb-6",
            children: "Our AI detected this might be a request with little to no information or a nonsensical request with no relation to the Smart Match's purpose. Please describe a real project with clear deliverables and requirements to find the best creators."
          }), /*#__PURE__*/_jsx(Button, {
            onClick: () => setShowInvalidModal(false),
            className: "w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-none",
            children: "Try Again"
          })]
        })
      })
    })]
  }), document.body);
};