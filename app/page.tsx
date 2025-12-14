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
      const analysis = await analyzeUrl(url);

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
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Enhanced Grid Background Pattern */}
      <div className="fixed inset-0 bg-slate-950" />
      <div
        className="fixed inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.05) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1.5px, transparent 1.5px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)',
        }}
      />

      {/* Ambient Glow - Top Center */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-indigo-500 via-purple-500 to-transparent blur-3xl" />
      </div>

      {/* Ambient Glow - Bottom Right */}
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-cyan-500 via-blue-500 to-transparent blur-3xl" />
      </div>

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
          <div className="relative max-w-4xl mx-auto group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-3xl blur-2xl group-focus-within:blur-3xl transition-all duration-300" />

            {/* Glass Input Container */}
            <div className="relative flex items-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden h-16 group-focus-within:border-cyan-500/50 group-focus-within:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all duration-300">
              <Search className="ml-6 w-7 h-7 text-cyan-400 group-focus-within:text-cyan-300 transition-colors" />
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
                className="m-2 px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
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

        {/* Error State - Glassmorphism */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto mb-8 p-6 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl flex items-center gap-4"
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
              {/* Ice Breaker - Featured Glass Card */}
              <motion.div variants={cardVariants} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                      <MessageSquare className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      Perfect Ice Breaker
                    </h2>
                  </div>
                  <p className="text-xl text-white leading-relaxed font-light">{result.ice_breaker}</p>
                </div>
              </motion.div>

              {/* Summary - Glass Card */}
              <motion.div variants={cardVariants} className="relative group">
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                      <Target className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-300">Company Overview</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{result.summary}</p>
                </div>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Sales Hooks - Glass Card */}
                <motion.div variants={cardVariants} className="relative group">
                  <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-green-500/30 hover:shadow-[0_0_25px_rgba(34,197,94,0.15)] transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500/10 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                        <TrendingUp className="w-7 h-7 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-green-300">Sales Hooks</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.sales_hooks.map((hook, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          <span className="text-slate-300">{hook}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Pain Points - Glass Card */}
                <motion.div variants={cardVariants} className="relative group">
                  <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 hover:shadow-[0_0_25px_rgba(249,115,22,0.15)] transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-500/10 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                        <AlertCircle className="w-7 h-7 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-bold text-orange-300">Pain Points</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.pain_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                          <span className="text-slate-300">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Financial Signals - Glass Card */}
                <motion.div variants={cardVariants} className="relative group">
                  <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <DollarSign className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-300">Financial Signals</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{result.financial_signals}</p>
                  </div>
                </motion.div>

                {/* Company Tone - Glass Card */}
                <motion.div variants={cardVariants} className="relative group">
                  <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Sparkles className="w-7 h-7 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-purple-300">Company Tone</h3>
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
