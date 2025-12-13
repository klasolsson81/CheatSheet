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

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-purple-950/20" />
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Sales Intelligence
            </h1>
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-slate-400 text-lg">
            Unlock deep insights and sales opportunities from any company URL
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleAnalyze}
          className="mb-12"
        >
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
            <div className="relative flex items-center bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <Search className="ml-6 w-6 h-6 text-cyan-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter company URL (e.g., stripe.com or https://stripe.com)"
                className="flex-1 bg-transparent px-4 py-5 text-lg text-white placeholder-slate-500 outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="m-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
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
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6" />
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

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto mb-8 p-6 bg-red-950/50 border border-red-800/50 rounded-xl flex items-center gap-4"
            >
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <p className="text-red-200">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Ice Breaker - Featured */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-7 h-7 text-cyan-400" />
                    <h2 className="text-2xl font-bold text-cyan-300">Perfect Ice Breaker</h2>
                  </div>
                  <p className="text-xl text-white leading-relaxed">{result.ice_breaker}</p>
                </div>
              </motion.div>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-blue-300">Company Overview</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">{result.summary}</p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Sales Hooks */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <h3 className="text-xl font-bold text-green-300">Sales Hooks</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.sales_hooks.map((hook, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-slate-300">{hook}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Pain Points */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-orange-400" />
                    <h3 className="text-xl font-bold text-orange-300">Pain Points</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.pain_points.map((point, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-slate-300">{point}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Financial Signals */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-bold text-emerald-300">Financial Signals</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{result.financial_signals}</p>
                </motion.div>

                {/* Company Tone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold text-purple-300">Company Tone</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{result.company_tone}</p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
