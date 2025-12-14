'use client';

import { useState, useEffect } from 'react';
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
  AlertTriangle,
} from 'lucide-react';
import { analyzeUrl } from './actions';
import { type Language, getTranslation } from './translations';

interface AnalysisResult {
  summary: string;
  ice_breaker: string[];
  pain_points: string[];
  sales_hooks: string[];
  financial_signals: string;
  company_tone: string;
  error?: string;
}

export default function Home() {
  // Language State
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

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

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('recon-language') as Language;
    if (savedLang && (savedLang === 'sv' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
    setMounted(true);
  }, []);

  // Save language to localStorage when changed
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('recon-language', lang);
  };

  // Get current translations
  const t = getTranslation(language);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    // Rotate loading messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setLoadingMessage(t.loadingMessages[messageIndex % t.loadingMessages.length]);
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
        setError(t.errorNsfw);
        setResult(null);
      } else {
        setResult(analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorGeneric);
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black text-white overflow-hidden relative">
      {/* Clean Grid Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black" />
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
        {/* Language Switcher */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-8 right-8 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-lg p-2 border border-slate-700"
          >
            <button
              onClick={() => handleLanguageChange('sv')}
              className={`px-3 py-2 rounded-md font-mono text-sm font-bold transition-all duration-200 ${
                language === 'sv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Svenska"
            >
              🇸🇪 SV
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-2 rounded-md font-mono text-sm font-bold transition-all duration-200 ${
                language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="English"
            >
              🇬🇧 EN
            </button>
          </motion.div>
        )}

        {/* Header - Tactical */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Radar className="w-7 h-7 text-emerald-500" strokeWidth={2.5} />
            <h1 className="text-6xl font-bold tracking-widest text-white font-mono">
              {t.title}
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-mono tracking-wide uppercase">
            {t.subtitle}
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
                placeholder={t.inputPlaceholder}
                className="flex-1 bg-transparent px-4 py-4 text-base text-white placeholder-slate-600 outline-none font-mono tracking-wide"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="m-1.5 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-md font-mono text-sm font-bold tracking-wider uppercase transition-all duration-200"
              >
                {loading ? t.analyzingButton : t.executeButton}
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
                <span>{t.advancedToggle}</span>
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
                      {t.advancedDescription}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Contact Person */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          {t.contactPersonLabel}
                        </label>
                        <input
                          type="text"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder={t.contactPersonPlaceholder}
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
                          disabled={loading}
                        />
                      </div>

                      {/* Job Title */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          {t.jobTitleLabel}
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder={t.jobTitlePlaceholder}
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
                          disabled={loading}
                        />
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          {t.departmentLabel}
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder={t.departmentPlaceholder}
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
                          disabled={loading}
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          {t.locationLabel}
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={t.locationPlaceholder}
                          className="w-full bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white transition-all font-mono"
                          disabled={loading}
                        />
                      </div>

                      {/* Specific Focus */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-mono text-slate-400 mb-2 tracking-wider uppercase">
                          {t.specificFocusLabel}
                        </label>
                        <input
                          type="text"
                          value={specificFocus}
                          onChange={(e) => setSpecificFocus(e.target.value)}
                          placeholder={t.specificFocusPlaceholder}
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
              className="max-w-2xl mx-auto mb-8 p-6 bg-slate-900 rounded-xl shadow-lg border-l-4 border-red-500 flex items-center gap-4"
            >
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <p className="text-slate-200 font-sans text-base">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results - Color-Coded Dashboard Modules */}
        <AnimatePresence>
          {result && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-8"
            >
              {/* Ice Breakers */}
              <motion.div variants={cardVariants}>
                <div className="bg-slate-900 bg-blue-950/30 rounded-xl shadow-lg border-l-4 border-blue-500 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400">
                  <div className="flex items-center gap-4 mb-6">
                    <MessageSquare className="w-7 h-7 text-blue-400" strokeWidth={2} />
                    <h2 className="text-2xl font-bold text-blue-400 font-mono tracking-wider uppercase">
                      {t.iceBreakersTitle}
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {result.ice_breaker.map((breaker, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-blue-950/20 rounded-lg border border-blue-800/30 hover:bg-blue-900/30 hover:border-blue-600/50 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-blue-400 font-mono font-bold text-sm mt-0.5">#{idx + 1}</span>
                          <p className="text-base text-slate-200 leading-relaxed font-sans flex-1">{breaker}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Company Overview */}
              <motion.div variants={cardVariants}>
                <div className="bg-slate-900 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-500/20 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6 text-slate-400" strokeWidth={2} />
                    <h3 className="text-lg font-bold text-white font-mono tracking-wider uppercase">{t.companyOverviewTitle}</h3>
                  </div>
                  <p className="text-base text-slate-200 leading-relaxed font-sans">{result.summary}</p>
                </div>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Sales Hooks */}
                <motion.div variants={cardVariants}>
                  <div className="bg-slate-900 bg-green-950/30 rounded-xl shadow-lg border-l-4 border-green-500 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-[1.02] hover:-translate-y-1 hover:border-green-400 cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-6 h-6 text-green-400" strokeWidth={2} />
                      <h3 className="text-lg font-bold text-green-400 font-mono tracking-wider uppercase">{t.salesHooksTitle}</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.sales_hooks.map((hook, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-base text-slate-200 leading-relaxed font-sans">{hook}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Pain Points */}
                <motion.div variants={cardVariants}>
                  <div className="bg-slate-900 bg-red-950/30 rounded-xl shadow-lg border-l-4 border-red-500 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-[1.02] hover:-translate-y-1 hover:border-red-400 cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-400" strokeWidth={2} />
                      <h3 className="text-lg font-bold text-red-400 font-mono tracking-wider uppercase">{t.painPointsTitle}</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.pain_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-base text-slate-200 leading-relaxed font-sans">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Financial Signals */}
                <motion.div variants={cardVariants}>
                  <div className="bg-slate-900 rounded-xl shadow-lg border-l-4 border-purple-500 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] hover:-translate-y-1 hover:border-purple-400 cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="w-6 h-6 text-purple-400" strokeWidth={2} />
                      <h3 className="text-lg font-bold text-purple-400 font-mono tracking-wider uppercase">{t.financialSignalsTitle}</h3>
                    </div>
                    <p className="text-base text-slate-200 leading-relaxed font-sans">{result.financial_signals}</p>
                  </div>
                </motion.div>

                {/* Company Tone */}
                <motion.div variants={cardVariants}>
                  <div className="bg-slate-900 rounded-xl shadow-lg border-l-4 border-purple-500 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] hover:-translate-y-1 hover:border-purple-400 cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <Activity className="w-6 h-6 text-purple-400" strokeWidth={2} />
                      <h3 className="text-lg font-bold text-purple-400 font-mono tracking-wider uppercase">{t.companyToneTitle}</h3>
                    </div>
                    <p className="text-base text-slate-200 leading-relaxed font-sans">{result.company_tone}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800">
          <p className="text-center text-xs text-slate-500 font-mono tracking-wider uppercase">
            {t.footerStatus}
          </p>
        </footer>
      </div>
    </div>
  );
}
