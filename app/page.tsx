'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { analyzeUrl } from './actions';

interface AnalysisResult {
  summary: string;
  ice_breaker: string;
  pain_points: string[];
  sales_hooks: string[];
  financial_signals: string;
  company_tone: string;
  error?: string;
}

const loadingMessages = [
  'Extracting website content...',
  'Researching leadership team...',
  'Scanning social media activity...',
  'Analyzing recent news...',
  'Checking financial reports...',
  'Detecting growth signals...',
  'AI analyzing all sources...',
  'Generating insights...',
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  // Advanced Search State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [contactPerson, setContactPerson] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [specificFocus, setSpecificFocus] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    // Rotate loading messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
      messageIndex++;
    }, 2000);

    try {
      // Build advanced search parameters (only include non-empty fields)
      const advancedParams: any = {};
      if (contactPerson.trim()) advancedParams.contactPerson = contactPerson.trim();
      if (department.trim()) advancedParams.department = department.trim();
      if (location.trim()) advancedParams.location = location.trim();
      if (jobTitle.trim()) advancedParams.jobTitle = jobTitle.trim();
      if (specificFocus.trim()) advancedParams.specificFocus = specificFocus.trim();

      const analysis = await analyzeUrl(url, advancedParams);

      // Check for NSFW content flag
      if (analysis.error === 'NSFW_CONTENT') {
        setError('Analysis blocked: Content flagged as unsafe.');
        setResult(null);
      } else {
        setResult(analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Stagger animation container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Clean Grid Background Pattern */}
      <div className="fixed inset-0 bg-slate-950" />
      <div
        className="fixed inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(100, 116, 139, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 116, 139, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            </motion.div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">
              AI Sales Intelligence
            </h1>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-10 h-10 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            </motion.div>
          </div>
          <p className="text-slate-400 text-xl font-light">
            Unlock deep insights and sales opportunities from any company URL
          </p>
        </motion.div>

        {/* Input Form - Enhanced */}
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleAnalyze}
          className="mb-16"
        >
          <div className="relative max-w-4xl mx-auto">
            {/* Sharp Tech Input Container */}
            <div className="flex items-center bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden h-16 focus-within:border-cyan-400 focus-within:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-300">
              <Search className="ml-6 w-7 h-7 text-slate-400 transition-colors" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter company URL (e.g., stripe.com or https://stripe.com)"
                className="flex-1 bg-transparent px-5 py-5 text-lg text-white placeholder-slate-500 outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="m-2 px-10 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-200"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>

            {/* Advanced Search Toggle */}
            <div className="relative z-20 mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <span className="text-lg font-bold">{showAdvanced ? '−' : '+'}</span>
                <span>Advanced Search (Target specific person/department)</span>
              </button>
            </div>

            {/* Advanced Search Fields */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 mt-6 overflow-hidden"
                >
                  <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 space-y-4">
                    <p className="text-sm text-slate-400 mb-4">
                      Optional: Add details to target specific parts of large organizations (e.g., Volvo Gothenburg, VP of Engineering)
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Contact Person */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder="e.g., John Smith or LinkedIn URL"
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.3)] transition-all"
                          disabled={loading}
                        />
                      </div>

                      {/* Job Title */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g., VP of Engineering, Head of Sales"
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.3)] transition-all"
                          disabled={loading}
                        />
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Department/Division
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g., Marketing, R&D, Sales"
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.3)] transition-all"
                          disabled={loading}
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Location/Office
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g., Gothenburg, Stockholm, Germany"
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.3)] transition-all"
                          disabled={loading}
                        />
                      </div>

                      {/* Specific Focus */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Specific Focus/Interest
                        </label>
                        <input
                          type="text"
                          value={specificFocus}
                          onChange={(e) => setSpecificFocus(e.target.value)}
                          placeholder="e.g., sustainability, digitalization, AI transformation"
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.3)] transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.form>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
              <motion.p
                key={loadingMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl text-slate-300"
              >
                {loadingMessage}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State - Sharp Tech */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto mb-8 p-6 bg-slate-900/80 backdrop-blur-sm border border-red-500/40 rounded-2xl flex items-center gap-4 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            >
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <p className="text-red-200">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results - Staggered Glass Cards */}
        <AnimatePresence>
          {result && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              {/* Ice Breaker - Blue Sharp Tech Card */}
              <motion.div variants={cardVariants}>
                <div className="bg-slate-900/80 backdrop-blur-sm border border-blue-500/40 rounded-2xl p-8 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <MessageSquare className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-blue-400">
                      Perfect Ice Breaker
                    </h2>
                  </div>
                  <p className="text-xl text-white leading-relaxed">{result.ice_breaker}</p>
                </div>
              </motion.div>

              {/* Company Overview - Blue Sharp Tech Card */}
              <motion.div variants={cardVariants}>
                <div className="bg-slate-900/80 backdrop-blur-sm border border-blue-500/40 rounded-2xl p-6 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Target className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-400">Company Overview</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{result.summary}</p>
                </div>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Sales Hooks - Green Sharp Tech Card */}
                <motion.div variants={cardVariants}>
                  <div className="bg-slate-900/80 backdrop-blur-sm border border-green-500/40 rounded-2xl p-6 shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <TrendingUp className="w-7 h-7 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-green-400">Sales Hooks</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.sales_hooks.map((hook, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-slate-300">{hook}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Pain Points - Red Sharp Tech Card */}
                <motion.div variants={cardVariants}>
                  <div className="bg-slate-900/80 backdrop-blur-sm border border-red-500/40 rounded-2xl p-6 shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <AlertCircle className="w-7 h-7 text-red-400" />
                      </div>
                      <h3 className="text-xl font-bold text-red-400">Pain Points</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.pain_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-slate-300">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Financial Signals - Purple Sharp Tech Card */}
                <motion.div variants={cardVariants}>
                  <div className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/40 rounded-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <DollarSign className="w-7 h-7 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-purple-400">Financial Signals</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{result.financial_signals}</p>
                  </div>
                </motion.div>

                {/* Company Tone - Purple Sharp Tech Card */}
                <motion.div variants={cardVariants}>
                  <div className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/40 rounded-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Sparkles className="w-7 h-7 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-purple-400">Company Tone</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{result.company_tone}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
