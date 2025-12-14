'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Target,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Loader2,
  Radar,
  Activity,
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
        {/* Header - Tactical */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Radar className="w-7 h-7 text-emerald-500" strokeWidth={2.5} />
            <h1 className="text-6xl font-bold tracking-widest text-white font-mono">
              RECON
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-mono tracking-wide uppercase">
            Tactical intelligence for your next deal
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
            {/* Tactical Input Container */}
            <div className="flex items-center bg-black/60 backdrop-blur-sm rounded-lg border border-slate-800 overflow-hidden h-14 focus-within:border-white transition-all duration-200">
              <Search className="ml-5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="TARGET URL"
                className="flex-1 bg-transparent px-4 py-4 text-base text-white placeholder-slate-600 outline-none font-mono tracking-wide"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="m-1.5 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-md font-mono text-sm font-bold tracking-wider uppercase transition-all duration-200"
              >
                {loading ? 'ANALYZING...' : 'EXECUTE'}
              </button>
            </div>

            {/* Advanced Search Toggle */}
            <div className="relative z-20 mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-white transition-colors cursor-pointer font-mono tracking-wider uppercase"
              >
                <span className="text-sm font-bold">{showAdvanced ? '[−]' : '[+]'}</span>
                <span>Advanced Targeting</span>
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
                  <div className="bg-black/60 backdrop-blur-sm border border-slate-800 rounded-lg p-6 space-y-4">
                    <p className="text-xs text-slate-500 mb-4 font-mono tracking-wide uppercase">
                      Optional: Target specific contacts or departments within large organizations
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Contact Person */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder="e.g., John Smith or LinkedIn URL"
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
                          disabled={loading}
                        />
                      </div>

                      {/* Job Title */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g., VP of Engineering, Head of Sales"
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
                          disabled={loading}
                        />
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          Department/Division
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g., Marketing, R&D, Sales"
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
                          disabled={loading}
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          Location/Office
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g., Gothenburg, Stockholm, Germany"
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
                          disabled={loading}
                        />
                      </div>

                      {/* Specific Focus */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          Specific Focus/Interest
                        </label>
                        <input
                          type="text"
                          value={specificFocus}
                          onChange={(e) => setSpecificFocus(e.target.value)}
                          placeholder="e.g., sustainability, digitalization, AI transformation"
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
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
              <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
              <motion.p
                key={loadingMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-400 font-mono tracking-wider uppercase"
              >
                {loadingMessage}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto mb-8 p-6 bg-black/60 backdrop-blur-sm border border-red-500 rounded-lg flex items-center gap-4"
            >
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-white font-mono text-sm">{error}</p>
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
              {/* Ice Breaker */}
              <motion.div variants={cardVariants}>
                <div className="bg-black/60 backdrop-blur-sm border border-white rounded-lg p-8 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <MessageSquare className="w-7 h-7 text-emerald-500" strokeWidth={2} />
                    <h2 className="text-2xl font-bold text-white font-mono tracking-wider uppercase">
                      Perfect Ice Breaker
                    </h2>
                  </div>
                  <p className="text-lg text-white leading-relaxed">{result.ice_breaker}</p>
                </div>
              </motion.div>

              {/* Company Overview */}
              <motion.div variants={cardVariants}>
                <div className="bg-black/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6 text-emerald-500" strokeWidth={2} />
                    <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">Company Overview</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{result.summary}</p>
                </div>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Sales Hooks */}
                <motion.div variants={cardVariants}>
                  <div className="bg-black/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-6 h-6 text-emerald-500" strokeWidth={2} />
                      <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">Sales Hooks</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.sales_hooks.map((hook, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-slate-300">{hook}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Pain Points */}
                <motion.div variants={cardVariants}>
                  <div className="bg-black/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-6 h-6 text-emerald-500" strokeWidth={2} />
                      <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">Pain Points</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.pain_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-slate-300">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Financial Signals */}
                <motion.div variants={cardVariants}>
                  <div className="bg-black/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="w-6 h-6 text-emerald-500" strokeWidth={2} />
                      <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">Financial Signals</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{result.financial_signals}</p>
                  </div>
                </motion.div>

                {/* Company Tone */}
                <motion.div variants={cardVariants}>
                  <div className="bg-black/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <Activity className="w-6 h-6 text-emerald-500" strokeWidth={2} />
                      <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">Company Tone</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{result.company_tone}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800">
          <p className="text-center text-xs text-slate-500 font-mono tracking-wider uppercase">
            System Status: Online // Powered by Intelligence Engine
          </p>
        </footer>
      </div>
    </div>
  );
}
