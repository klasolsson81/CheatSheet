# RECON - AI-Powered B2B Sales Intelligence

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?style=for-the-badge&logo=openai)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

**Real-time company intelligence powered by AI**

[Demo](https://recon.klasolsson.se) • [Report Bug](https://github.com/klasolsson81/CheatSheet/issues) • [Request Feature](https://github.com/klasolsson81/CheatSheet/issues)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Performance](#performance)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Author](#author)
- [Acknowledgments](#acknowledgments)
- [License](#license)

---

## 🎯 About

RECON is an AI-powered B2B sales intelligence tool that analyzes companies in real-time by aggregating data from multiple sources (website content, social media, news, financials) and generates actionable sales intelligence using GPT-4o.

Built for sales professionals who need to quickly understand prospects and craft personalized outreach, RECON transforms hours of manual research into seconds of automated intelligence gathering.

### What RECON Does

- **Extracts** website content and company information
- **Aggregates** data from 6 parallel sources (leadership, social media, news, financials, growth signals)
- **Analyzes** with GPT-4o to generate targeted sales intelligence
- **Delivers** actionable ice breakers, pain points, and sales hooks

### Who It's For

- **Sales Professionals** - Research prospects faster
- **Business Development** - Identify opportunities and pain points
- **Account Executives** - Personalize outreach at scale
- **Sales Leaders** - Understand target accounts deeply

---

## ✨ Key Features

### 🎯 AI-Powered Analysis
- **GPT-4o Intelligence** - Advanced language model for deep insights
- **Multi-Source Research** - 6 parallel data streams for comprehensive analysis
- **Smart Ice Breakers** - 2-3 conversation starters with clickable source links
- **Pain Point Detection** - Identifies operational and strategic challenges
- **Sales Hook Generation** - Tailored value propositions

### 🇸🇪 Swedish Company Intelligence
- **Automatic Detection** - Recognizes `.se` domains
- **Allabolag Integration** - Verified financial data from official Swedish registry
- **Org Number Search** - GPT-driven search for organisationsnummer
- **Financial Translation** - Converts Swedish terms (Omsättning → Revenue)

### 🎨 Advanced Targeting
- **Contact Person** - Target specific individuals (name or LinkedIn URL)
- **Department Focus** - Sales, Marketing, IT, etc.
- **Location Filter** - Stockholm, Gothenburg, specific offices
- **Job Title Search** - CEO, CTO, VP of Sales
- **Focus Area** - Sustainability, AI transformation, digitalization

### 🌍 Multi-Language Support
- **Swedish & English** - Full UI and AI-generated content translation
- **Language Switcher** - Instant switching with localStorage persistence
- **Localized Errors** - User-friendly messages in selected language

### 🔒 Security & Performance
- **Rate Limiting** - IP-based throttling to prevent abuse
- **Input Validation** - XSS and prompt injection prevention
- **Domain Verification** - DNS + HTTP checks with fuzzy matching
- **Response Caching** - 1-hour TTL for faster repeated queries
- **Multi-Provider Fallback** - Automatic switching between search APIs

### ♿ Accessibility
- **WCAG 2.1 Compliant** - Full screen reader support
- **ARIA Attributes** - Proper semantic markup
- **Keyboard Navigation** - Complete keyboard accessibility
- **Focus Management** - Logical tab order and focus indicators

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Lucide React](https://lucide.dev/)** - Icon library

### Backend & AI
- **[OpenAI GPT-4o](https://openai.com/)** - Advanced language model
- **[Tavily API](https://tavily.com/)** - Primary search + content extraction
- **Multi-Provider Search** - Fallback to Serper, Brave, SerpAPI

### Infrastructure
- **[Vercel](https://vercel.com/)** - Hosting and deployment
- **[Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)** - Backend API
- **In-Memory Caching** - Analysis result caching

### Development
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting (via Tailwind)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/klasolsson81/CheatSheet.git
cd CheatSheet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📦 Installation

### Prerequisites

- **Node.js** 18.17 or later
- **npm** or **yarn**
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Tavily API Key** ([Get one here](https://tavily.com/))

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/klasolsson81/CheatSheet.git
   cd CheatSheet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create `.env.local` in the project root:
   ```bash
   # Required
   OPENAI_API_KEY=sk-...
   TAVILY_API_KEY=tvly-...

   # Optional (for search fallback)
   SERPER_API_KEY=...
   BRAVE_API_KEY=...
   SERPAPI_API_KEY=...

   # Optional (caching)
   CACHE_TTL_MS=3600000  # 1 hour
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4o | - |
| `TAVILY_API_KEY` | ✅ | Tavily API key (primary search) | - |
| `SERPER_API_KEY` | ❌ | Serper API key (fallback 1) | - |
| `BRAVE_API_KEY` | ❌ | Brave Search API key (fallback 2) | - |
| `SERPAPI_API_KEY` | ❌ | SerpAPI key (fallback 3) | - |
| `CACHE_TTL_MS` | ❌ | Cache time-to-live in milliseconds | 3600000 |
| `NODE_ENV` | ❌ | Environment (development/production) | development |

### Search Limits

Configurable in `lib/config/constants.ts`:

```typescript
export const SEARCH_LIMITS = {
  LEADERSHIP: 8,        // Leadership & key people
  SOCIAL_MEDIA: 10,     // LinkedIn posts
  NEWS: 8,              // Recent news
  FINANCIALS_GENERAL: 5,
  FINANCIALS_SWEDISH: 3,
  GROWTH_SIGNALS: 6,    // Hiring, funding, expansion
};
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Next.js Server Actions          │
├─────────────────────────────────────────┤
│  • Rate Limiting (IP-based)             │
│  • Input Validation & Sanitization      │
│  • Domain Verification (DNS + HTTP)     │
│  • Response Caching (1 hour)            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│      Multi-Source Research Engine       │
├─────────────────────────────────────────┤
│  1. Website Content (Tavily Extract)    │
│  2. Leadership & Key People (LinkedIn)  │
│  3. Social Media Activity (Recent)      │
│  4. News & Press Releases (2025)        │
│  5. Financial Data (+ Allabolag)        │
│  6. Growth Signals (Hiring, Funding)    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│    Search Orchestrator (Fallback)       │
├─────────────────────────────────────────┤
│  1. Tavily (Primary)                    │
│  2. Serper (Fallback 1)                 │
│  3. Brave (Fallback 2)                  │
│  4. SerpAPI (Fallback 3)                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         OpenAI GPT-4o Analysis          │
├─────────────────────────────────────────┤
│  • Structured JSON Output               │
│  • NSFW Content Filtering               │
│  • Grounding Checks                     │
│  • Source Attribution                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│      Formatted Intelligence Output      │
├─────────────────────────────────────────┤
│  • Ice Breakers (2-3 with sources)      │
│  • Company Overview                     │
│  • Sales Hooks (2 points)               │
│  • Pain Points (3 points)               │
│  • Financial Signals                    │
│  • Company Tone                         │
└─────────────────────────────────────────┘
```

### Key Components

- **`app/actions.ts`** - Main orchestrator, handles rate limiting, validation, caching
- **`lib/services/searchService.ts`** - Multi-source parallel research
- **`lib/services/gptService.ts`** - GPT-4o analysis and intelligence generation
- **`lib/services/search/orchestrator.ts`** - Search provider fallback logic
- **`lib/validators/urlValidator.ts`** - Security validation and sanitization
- **`lib/cache/analysisCache.ts`** - In-memory caching with TTL

---

## 📊 Performance

### Optimization Results (After 5 Code Review Sessions)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Cold Start Time** | 15-25s | 5-8s | **70% faster** ⚡ |
| **API Quota Usage** | 2x | 1x | **50% reduction** 💰 |
| **Re-init Overhead** | 10-50ms | 0ms | **100% elimination** 🚀 |
| **Domain Validation** | 5-10s (repeated) | 0ms (cached) | **Instant** ⏱️ |
| **Test Coverage** | 0% | ~15% | **Security-critical** 🧪 |

### Performance Features

- ✅ **Health Check Caching** - 5-minute TTL for provider health status
- ✅ **Search Result Caching** - 1-hour TTL for analysis results
- ✅ **Domain Validation Caching** - 5-minute TTL for DNS/HTTP checks
- ✅ **Constructor-Based Initialization** - Zero overhead after first search
- ✅ **Multi-Provider Fallback** - Automatic switching on failure

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Test Coverage

- **URL Validation** - 34 tests covering security-critical functions
  - XSS prevention (javascript:, data:, vbscript:, file:)
  - Prompt injection prevention
  - Input sanitization
  - Domain normalization

### Test Files

```
tests/
└── unit/
    └── validators/
        └── urlValidator.test.ts  # 34 tests, all passing ✅
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Set Environment Variables**
   - Add `OPENAI_API_KEY` and `TAVILY_API_KEY` in Vercel dashboard
   - Settings → Environment Variables

4. **Deploy**
   - Vercel deploys automatically on every push to `main`

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
.
├── app/
│   ├── actions.ts              # Server actions (main orchestrator)
│   ├── page.tsx                # Main UI component
│   ├── layout.tsx              # Root layout
│   ├── translations.ts         # i18n (Swedish/English)
│   └── globals.css             # Global styles
│
├── lib/
│   ├── services/
│   │   ├── searchService.ts    # Multi-source research
│   │   ├── gptService.ts       # GPT-4o analysis
│   │   └── search/
│   │       ├── orchestrator.ts # Provider fallback
│   │       └── providers/      # Tavily, Serper, Brave, SerpAPI
│   │
│   ├── validators/
│   │   └── urlValidator.ts     # Security validation
│   │
│   ├── utils/
│   │   ├── logger.ts           # Structured logging
│   │   └── swedishCompany.ts   # Swedish company detection
│   │
│   ├── cache/
│   │   └── analysisCache.ts    # In-memory caching
│   │
│   ├── errors/
│   │   └── AppError.ts         # Custom error classes
│   │
│   ├── types/
│   │   └── analysis.ts         # TypeScript interfaces
│   │
│   └── config/
│       └── constants.ts        # Configuration
│
├── tests/
│   └── unit/
│       └── validators/
│           └── urlValidator.test.ts  # 34 security tests
│
├── public/                     # Static assets
├── CODE_REVIEW_2.md           # Comprehensive code review
├── CLAUDE.md                  # Project documentation
└── README.md                  # This file
```

---

## 👨‍💻 Author

**Klas Olsson**

- 🌐 Website: [klasolsson.se](https://klasolsson.se)
- 💼 LinkedIn: [linkedin.com/in/klasolsson81](https://www.linkedin.com/in/klasolsson81/)
- 🐙 GitHub: [@klasolsson81](https://github.com/klasolsson81)

### About the Developer

Full-stack developer specializing in AI-powered applications, B2B SaaS, and modern web technologies. Passionate about building tools that solve real business problems and improve sales productivity.

**Tech Focus:** TypeScript, React, Next.js, OpenAI, AI Integration, B2B Applications

---

## 🙏 Acknowledgments

This project was initially conceptualized during a 2-day **AI Workshop** led by [**InFiNetCode AB**](https://infinetcode.com/) held on **December 13-14, 2024**.

### Workshop Group (Ideation & Feedback)

Special thanks to my workshop group for brainstorming and feedback during the initial ideation phase:

- **Edwin Lindblom**
- **Sajad Azizi**
- **Haval Jalal**
- **Riana Ghadamzadeh**
- **Dina Annebäck**

### Development Attribution

**The application was designed, developed, and is maintained solely by Klas Olsson.**

All code, architecture, features, optimizations, and improvements (including 5 comprehensive code review sessions) were implemented independently by Klas Olsson after the workshop.

### Technologies & Services

- **OpenAI** - GPT-4o language model
- **Tavily** - Primary search and content extraction API
- **Vercel** - Hosting and deployment platform
- **Next.js Team** - Framework and tools

---

## 📄 License

**Private/Proprietary**

Copyright © 2024 Klas Olsson. All rights reserved.

This project is private and not licensed for public use, modification, or distribution.

For inquiries about usage or licensing, please contact:
- 📧 Email: [Contact via LinkedIn](https://www.linkedin.com/in/klasolsson81/)
- 🌐 Website: [klasolsson.se](https://klasolsson.se)

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request?

1. Check [existing issues](https://github.com/klasolsson81/CheatSheet/issues)
2. [Open a new issue](https://github.com/klasolsson81/CheatSheet/issues/new)
3. Provide detailed description and reproduction steps

---

## 📈 Project Stats

- **Lines of Code:** ~5,000+
- **Test Coverage:** ~15% (security-critical functions)
- **Performance Improvement:** 70% faster searches
- **API Efficiency:** 50% less quota usage
- **Code Review Sessions:** 5 comprehensive sessions
- **Issues Fixed:** 15/15 (100% complete)

---

<div align="center">

**Built with ❤️ by [Klas Olsson](https://klasolsson.se)**

⭐ Star this repo if you find it useful!

</div>
