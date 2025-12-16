export type Language = 'sv' | 'en';

export const translations = {
  sv: {
    // Header
    title: 'RECON',
    subtitle: 'Taktisk intelligens för din nästa affär',

    // Input Form
    inputPlaceholder: 'MÅL-URL',
    executeButton: 'SÖK',
    analyzingButton: 'SÖKER...',
    advancedToggle: 'Avancerad Målsökning',

    // Advanced Search
    advancedDescription: 'Valfritt: Rikta in dig på specifika kontakter eller avdelningar inom stora organisationer',
    contactPersonLabel: 'Kontaktperson',
    contactPersonPlaceholder: 't.ex. Johan Svensson eller LinkedIn-URL',
    jobTitleLabel: 'Jobbtitel',
    jobTitlePlaceholder: 't.ex. VD, Försäljningschef',
    departmentLabel: 'Avdelning/Division',
    departmentPlaceholder: 't.ex. Marknadsföring, FoU, Försäljning',
    locationLabel: 'Plats/Kontor',
    locationPlaceholder: 't.ex. Göteborg, Stockholm, Tyskland',
    specificFocusLabel: 'Specifikt Fokusområde',
    specificFocusPlaceholder: 't.ex. hållbarhet, digitalisering, AI-transformation',

    // Loading Messages
    loadingMessages: [
      'Extraherar webbplatsinnehåll...',
      'Forskar om ledningsgrupp...',
      'Skannar aktivitet i sociala medier...',
      'Analyserar senaste nyheterna...',
      'Kontrollerar finansiella rapporter...',
      'Upptäcker tillväxtsignaler...',
      'AI analyserar alla källor...',
      'Genererar insikter...',
    ],

    // Error Messages
    errorNsfw: 'Analys blockerad: Innehållet flaggat som osäkert.',
    errorGeneric: 'Analysen misslyckades',

    // Results Section Titles
    iceBreakersTitle: 'Uppsökarförslag',
    companyOverviewTitle: 'Företagsöversikt',
    salesHooksTitle: 'Försäljningskrokar',
    painPointsTitle: 'Smärtpunkter',
    financialSignalsTitle: 'Finansiella Signaler',
    companyToneTitle: 'Företagston',

    // Footer
    footerStatus: 'Systemstatus: Online // Drivs av Intelligensmotor',
  },

  en: {
    // Header
    title: 'RECON',
    subtitle: 'Tactical intelligence for your next deal',

    // Input Form
    inputPlaceholder: 'TARGET URL',
    executeButton: 'SEARCH',
    analyzingButton: 'SEARCHING...',
    advancedToggle: 'Advanced Targeting',

    // Advanced Search
    advancedDescription: 'Optional: Target specific contacts or departments within large organizations',
    contactPersonLabel: 'Contact Person',
    contactPersonPlaceholder: 'e.g., John Smith or LinkedIn URL',
    jobTitleLabel: 'Job Title',
    jobTitlePlaceholder: 'e.g., VP of Engineering, Head of Sales',
    departmentLabel: 'Department/Division',
    departmentPlaceholder: 'e.g., Marketing, R&D, Sales',
    locationLabel: 'Location/Office',
    locationPlaceholder: 'e.g., Gothenburg, Stockholm, Germany',
    specificFocusLabel: 'Specific Focus/Interest',
    specificFocusPlaceholder: 'e.g., sustainability, digitalization, AI transformation',

    // Loading Messages
    loadingMessages: [
      'Extracting website content...',
      'Researching leadership team...',
      'Scanning social media activity...',
      'Analyzing recent news...',
      'Checking financial reports...',
      'Detecting growth signals...',
      'AI analyzing all sources...',
      'Generating insights...',
    ],

    // Error Messages
    errorNsfw: 'Analysis blocked: Content flagged as unsafe.',
    errorGeneric: 'Analysis failed',

    // Results Section Titles
    iceBreakersTitle: 'Ice Breaker Options',
    companyOverviewTitle: 'Company Overview',
    salesHooksTitle: 'Sales Hooks',
    painPointsTitle: 'Pain Points',
    financialSignalsTitle: 'Financial Signals',
    companyToneTitle: 'Company Tone',

    // Footer
    footerStatus: 'System Status: Online // Powered by Intelligence Engine',
  },
};

export function getTranslation(lang: Language) {
  return translations[lang];
}
