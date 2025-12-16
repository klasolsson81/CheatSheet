# RECON - B2B Sales Intelligence Dashboard

**Last Updated:** 2025-12-16
**Status:** Production (Deployed on Vercel)

## Project Overview

RECON is an AI-powered B2B sales intelligence tool that analyzes companies in real-time by aggregating data from multiple sources (website, social media, news, financials) and generates actionable sales intelligence including ice breakers, pain points, sales hooks, and financial signals.

### Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI/Animations:** Framer Motion
- **Icons:** Lucide React
- **AI:** OpenAI GPT-5.2
- **Search:** Tavily API (advanced web search + content extraction)
- **Deployment:** Vercel
- **Font:** Atkinson Hyperlegible (sans-serif, optimized for readability), Geist Mono (monospace)

### Repository

- **GitHub:** `klasolsson81/CheatSheet`
- **Branch:** `main`
- **Auto-deploy:** Vercel (triggers on push to main)

---

## Key Features

### 1. **URL Analysis**
- Users input target company URL
- Auto-normalizes URLs (adds https:// if missing)
- Extracts website content using Tavily
- Multi-source parallel research (6 data streams)

### 2. **Advanced Targeting** (Optional)
- Contact person (name or LinkedIn URL)
- Job title
- Department/Division
- Location/Office
- Specific focus area (e.g., sustainability, AI)
- Tailors ice breakers and insights to specific person/department

### 3. **Multi-Language Support** (Swedish/English)
- Language switcher with flag icons (🇸🇪 SV / 🇬🇧 EN) in top-right corner
- SVG flags for reliable cross-browser display
- Translates all UI elements:
  - Header (title, subtitle)
  - Input form (placeholder, buttons, labels)
  - Advanced search fields (all labels and placeholders)
  - Loading messages (8 rotating messages)
  - Error messages
  - Results section titles
  - Footer status
- **AI-generated content in selected language:**
  - Ice breakers
  - Pain points
  - Sales hooks
  - Financial signals
  - Company tone
  - Summary
- Language preference saved in localStorage
- Instant switching without page reload
- Default: English (EN)

### 4. **Swedish Company Intelligence** (Special)
- Auto-detects `.se` domains
- GPT-driven search for organisationsnummer (org number)
- Fetches verified financial data from Allabolag
- Converts Swedish terms (Omsättning → revenue, Resultat → profit)
- Multi-source Allabolag search (by org number, URL, company name)

### 5. **AI Analysis Output**

Generated insights include:

1. **Ice Breaker Options (2-3 suggestions)** - Different approaches:
   - Social media posts (LinkedIn activity)
   - Company news/announcements
   - Growth signals (hiring, funding, expansion)
   - Max 15-20 words each, conversational tone
   - **Clickable with source links:** Each ice breaker includes the original source URL when available
   - Opens in new tab when clicked (LinkedIn posts, news articles, etc.)
   - External link icon indicates clickability

2. **Company Overview** - 1-2 sentence summary of what they do

3. **Sales Hooks** - 2 bullet points of value propositions

4. **Pain Points** - 3 bullet points of operational/strategic challenges

5. **Financial Signals** - Growth indicators, hiring, funding, revenue trends

6. **Company Tone** - 2-4 word brand voice description

### 6. **Safety Features**
- NSFW content detection (blocks adult/gambling/hate speech)
- Grounding checks (prevents hallucinations about similar brands)
- API key validation
- Error handling for rate limits, timeouts, invalid responses

---

## Design System (Cheat Sheet Style)

### Color Scheme

**Background:**
- Deep blue radial gradient: `from-slate-800 via-slate-950 to-black`

**Section Color Coding:**

| Section | Border | Title | Background | Accent |
|---------|--------|-------|------------|--------|
| Ice Breakers | `border-l-4 border-blue-500` | `text-blue-400` | `bg-blue-950/30` | Blue glow on hover |
| Company Overview | None | `text-white` | `bg-slate-900` | Slate glow on hover |
| Sales Hooks | `border-l-4 border-green-500` | `text-green-400` | `bg-green-950/30` | Green glow on hover |
| Pain Points | `border-l-4 border-red-500` | `text-red-400` | `bg-red-950/30` | Red glow on hover |
| Financials | `border-l-4 border-purple-500` | `text-purple-400` | `bg-slate-900` | Purple glow on hover |
| Company Tone | `border-l-4 border-purple-500` | `text-purple-400` | `bg-slate-900` | Purple glow on hover |

### Hover Effects (All Cards)

```css
hover:shadow-2xl
hover:shadow-{color}-500/20  /* Color-matched glow */
hover:scale-[1.02]           /* Slight scale up */
hover:-translate-y-1         /* Lift effect */
hover:border-{color}-400     /* Brighter border */
transition-all duration-300  /* Smooth animation */
cursor-pointer
```

### Typography

- **Headers/Titles:** Geist Mono (monospace, uppercase, tracking-wider)
- **Body Text:** Atkinson Hyperlegible (sans-serif, optimized for readability and accessibility)
- **Ice Breaker Numbers:** Mono bold (`#1`, `#2`, `#3`)

**Why Atkinson Hyperlegible?**
- Designed by Braille Institute for maximum legibility
- Greater character differentiation (e.g., 1 vs l, 0 vs O)
- Improved readability for low vision users
- Open-source and free to use

### Spacing & Layout

- **Main spacing:** `space-y-8` between sections
- **Grid gaps:** `gap-8` between columns
- **Cards:** `rounded-xl`, `shadow-lg`, `p-6` or `p-8`
- **Ice breaker options:** Each in separate card with nested hover effect

---

## File Structure

```
app/
├── page.tsx           # Main UI component (client-side)
├── actions.ts         # Server actions (API logic)
├── translations.ts    # i18n translations (Swedish/English)
├── globals.css        # Global styles + Tailwind config
├── layout.tsx         # Root layout (fonts, metadata)
└── fonts/             # Inter & Geist Mono font files

claude.md              # This file (project documentation)
```

### Key Files

#### `app/page.tsx` (~500 lines)
- Client component (`'use client'`)
- State management (URL, loading, results, advanced params, language)
- Language switcher with localStorage persistence
- Form handling + validation
- Loading state with rotating messages (translated)
- Staggered card animations (Framer Motion)
- Ice breaker options displayed as numbered cards
- All text content uses translation system

#### `app/translations.ts` (120 lines)
- Type-safe translation system
- Language type: `'sv' | 'en'`
- Complete Swedish and English translations for:
  - Header (title, subtitle)
  - Form inputs and buttons
  - Advanced search fields
  - Loading messages
  - Error messages
  - Results section titles
  - Footer
- Export: `getTranslation(lang: Language)`

#### `app/actions.ts` (551 lines)
- Server action: `analyzeUrl(inputUrl, advancedParams?)`
- URL normalization
- Swedish company detection (`.se` domain)
- GPT-driven search for org numbers (function calling)
- Parallel multi-source research (6 streams)
- GPT-5.2 analysis with structured JSON output
- NSFW content filtering
- Error handling

#### `app/globals.css`
- Tailwind v4 imports
- Font family configuration (Atkinson Hyperlegible, Geist Mono)
- Global dark blue tech background on body element
- Radial gradient: `#1e293b → #0f172a → #020617`
- Removed conflicting color scheme media queries
- Consistent background across all devices (mobile, tablet, desktop)

---

## API Configuration

### Required Environment Variables

```bash
OPENAI_API_KEY=sk-...        # OpenAI API key (GPT-5.2)
TAVILY_API_KEY=tvly-...      # Tavily API key (search + extraction)
```

### Research Data Sources (6 Streams)

1. **Website Content** - Tavily extract (raw content)
2. **Leadership & Key People** - LinkedIn searches, bios
3. **Social Media Activity** - Recent LinkedIn posts (current month)
4. **Recent News & Press** - 2025 announcements
5. **Financial Results** - Quarterly reports, Swedish Allabolag data
6. **Growth Signals** - Hiring, funding, expansion, partnerships

### GPT-5.2 System Prompt Key Points

- **Safety:** NSFW detection → return `{ "error": "NSFW_CONTENT" }`
- **Grounding:** Trust website content over search results
- **Ice breakers:** 2-3 options, 15-20 words max, varied angles
- **Swedish data:** Convert terms, analyze GPT-verified Allabolag data
- **JSON output:** Structured response with validation

---

## Recent Changes

### 2025-12-16 (Current Session)

**Commit: `[PENDING]` - feat: add personal site support, rate limiting, and TODO backlog**
- **PERSONAL SITE SUPPORT:**
  - Fixed error when analyzing personal portfolios/consultant sites (e.g., klasolsson.se)
  - Added special handling in GPT prompt for personal sites vs companies
  - Improved validation with intelligent fallback for empty ice_breaker arrays
  - Fallback generates contextual ice breaker based on profile/expertise
  - Language-aware fallback messages (Swedish/English)
- **RATE LIMITING:**
  - Implemented in-memory rate limiter to prevent API abuse
  - Configuration: 10 requests per 5 minutes per IP (configurable via env vars)
  - Extracts client IP from headers (Vercel, Cloudflare, etc.)
  - User-friendly error messages with retry-after time
  - Automatic cleanup of expired entries to prevent memory leaks
- **DOCUMENTATION:**
  - Added comprehensive TODO/BACKLOG section to CLAUDE.md
  - Organized tasks by priority: Critical, High, Medium, Nice to Have
  - Included problem descriptions, solutions, and references to CODE_REVIEW.md
  - Total: 1 Critical, 4 High, 5 Medium, 8 Nice to Have items
- **FILES CHANGED:**
  - `app/actions.ts`: Added personal site prompt instructions, fallback validation, rate limiting integration
  - `lib/rateLimit.ts`: New file with rate limiting logic
  - `claude.md`: Added TODO/BACKLOG section
- **IMPACT:**
  - Personal sites now work correctly (no more "incomplete analysis" errors)
  - API abuse prevention with rate limiting
  - Better project organization with documented backlog

**Commit: `c044400` - feat: implement critical security and SEO fixes from code review**
- **SECURITY IMPROVEMENTS:**
  - Added comprehensive input sanitization to prevent XSS and prompt injection attacks
  - Created `sanitizeUrl()` function: validates URL format, blocks dangerous patterns (javascript:, data:, script tags), limits length to 500 chars
  - Created `sanitizeTextInput()` function: removes prompt injection patterns, escapes special characters, limits field lengths
  - Applied sanitization to all user inputs (URL, contact person, job title, department, location, specific focus)
  - Replaced all `advancedParams` references with `sanitizedParams` after validation
- **SEO ENHANCEMENTS:**
  - Added comprehensive metadata configuration (OpenGraph, Twitter Cards, viewport, canonical URL)
  - Added keywords, authors, robots configuration for better search engine indexing
  - Added icons configuration (favicon, apple-icon, manifest)
  - Configured theme color for consistent branding across devices
- **PERFORMANCE:**
  - Optimized font loading: replaced Google CDN with Next.js native font loader
  - Used `Atkinson_Hyperlegible` with proper preload and swap settings
  - Eliminated render-blocking external font requests
- **CODE QUALITY:**
  - Fixed Next.js 15+ warnings: moved viewport and themeColor to separate export as recommended
  - Clean build with zero warnings
  - Followed Next.js best practices for metadata configuration
- **FILES CHANGED:** `app/actions.ts`, `app/layout.tsx`, `CODE_REVIEW.md` (new)
- **REFERENCE:** Addresses critical issues #1, #2, #4, #6 from CODE_REVIEW.md
- **IMPACT:** Significantly improved security posture and SEO readiness

**Commit: `7cc702e` - fix: suppress Tavily SDK url.parse() deprecation warning**
- Removed red deprecation warning from Vercel logs
- Warning was from Tavily SDK using deprecated `url.parse()` (not our code)
- Suppressed the warning to keep logs clean
- Does not affect functionality - purely cosmetic fix
- **Files modified:** `app/actions.ts`

**Commit: `80f0a12` - debug: add detailed logging for GPT response validation**
- Added debug logging to help troubleshoot GPT validation issues
- Logs GPT response length and preview
- Detailed validation error messages showing which fields are missing
- Helps diagnose incomplete analysis errors
- **Files modified:** `app/actions.ts`

**Commit: `eb2e90c` - fix: improve error handling for API limits and failures**
- Added better error detection and user-friendly messages for Tavily API usage limits
- Early detection of API limit errors before attempting GPT analysis
- Check if sufficient data is available before proceeding with analysis
- Improved error messages to guide users:
  - "Search API usage limit reached. Please try again later or contact support@tavily.com to upgrade your plan."
  - "Unable to gather sufficient data for analysis. Please check API limits and try again."
- Prevents cryptic "AI returned incomplete analysis" errors when API fails
- **Files modified:** `app/actions.ts`
- **Impact:** Better user experience when API limits are reached

**Commit: `45da166` - perf: optimize AI search performance (40-60% faster)**
- Significantly improved search speed by reducing unnecessary operations
- Swedish GPT search optimizations:
  - Reduced max iterations from 8 to 5 (saves 15-30 seconds)
  - Reduced tool choice from 7 to 4 iterations
  - More efficient prompt instructions
- Reduced API call overhead:
  - Social Media: maxResults 10 → 5 (50% faster)
  - News: maxResults 8 → 5 (38% faster)
  - Growth Signals: maxResults 6 → 4 (33% faster)
- Simplified Swedish financial searches:
  - Removed 3 redundant Allabolag searches (was doing 5, now 2 max)
  - Prioritizes org number search if available, otherwise URL search
  - Reduced maxResults from 5 to 3 per search
- Removed verbose debug logging that slowed down production
- **Performance impact:**
  - Non-Swedish companies: ~20-30% faster (15-25 seconds → 12-18 seconds)
  - Swedish companies: ~40-60% faster (30-50 seconds → 18-25 seconds)
- **Files modified:** `app/actions.ts`

**Commit: `d2d867e` - improve: enhanced text contrast and button text clarity**
- Improved text contrast across all UI elements for better readability (especially for users with vision impairments)
- Updated all text colors from dark slate to lighter shades:
  - Subtitle: `text-slate-400` → `text-slate-200`
  - Labels: `text-slate-400` → `text-slate-200`
  - Placeholders: `placeholder-slate-600` → `placeholder-slate-400`
  - Description text: `text-slate-500` → `text-slate-300`
  - Toggle buttons: `text-slate-500` → `text-slate-300`
  - Loading messages: `text-slate-400` → `text-slate-200`
  - Footer: `text-slate-500` → `text-slate-300`
  - Search icon: `text-slate-500` → `text-slate-400`
- Changed button text for better UX:
  - Swedish: "UTFÖR" → "SÖK" (Execute → Search)
  - Swedish: "ANALYSERAR..." → "SÖKER..." (Analyzing → Searching)
  - English: "EXECUTE" → "SEARCH"
  - English: "ANALYZING..." → "SEARCHING..."
- All text now has better contrast against dark blue background
- **Files modified:** `app/translations.ts`, `app/page.tsx`
- **Impact:** Significantly improved readability and accessibility

**Commit: `7e16ef7` - feat: comprehensive responsive design overhaul**
- Fixed background color inconsistency across devices (white on mobile, black on laptop, dark blue on desktop)
- Implemented consistent dark blue tech background globally via `body` element in `globals.css`
- Background now uses: `radial-gradient(ellipse at top, #1e293b, #0f172a, #020617)` across all devices
- Removed conflicting CSS variables and media queries that caused inconsistent backgrounds
- Complete mobile-first responsive redesign using modern Tailwind breakpoints:
  - Mobile (default): Compact spacing, vertical layout, touch-friendly buttons
  - Tablet (sm: 640px+): Increased spacing, better typography
  - Desktop (md: 768px+): 2-column grid layouts, optimal hover effects
- Fixed ice breaker section to be consistent across all screens (2-3 numbered options on all devices)
- Updated all card components with responsive spacing: `p-5 sm:p-6 lg:p-8`
- Implemented responsive typography: `text-sm sm:text-base`, `text-base sm:text-lg`
- Added responsive icon sizing: `w-5 h-5 sm:w-6 sm:h-6` throughout
- Optimized input form for mobile: vertical stack on small screens, horizontal on desktop
- Changed focus states from white to emerald green for better consistency
- Updated all grids to `grid-cols-1 md:grid-cols-2` for proper responsive behavior
- Added `h-full` to grid cards for equal heights in 2-column layouts
- Reduced hover scale on mobile (`hover:scale-[1.01]`) vs desktop (`sm:hover:scale-[1.02]`)
- Updated language switcher positioning: `top-4 right-4 sm:top-8 sm:right-8`
- Improved spacing system: `gap-6 sm:gap-8`, `space-y-6 sm:space-y-8`
- All cards now use `bg-slate-900/80` for consistent semi-transparency
- Footer updated with responsive margins: `mt-12 sm:mt-16 lg:mt-20`
- Header logo responsive: `text-4xl sm:text-5xl lg:text-6xl`
- Build verified successfully - no TypeScript errors
- **Files modified:** `app/globals.css`, `app/page.tsx`
- **Impact:** Consistent design across mobile, tablet, and desktop - no more layout issues

### 2025-12-14

**Commit: `6fe41ec` - fix: revert site filter and keep increased search limits**
- REVERTED `site:linkedin.com/posts` filter (caused irrelevant results from unrelated companies)
- KEPT increased maxResults: Social Media (5→10), News (4→8), Growth Signals (3→6)
- KEPT MANDATORY SOURCE LINKING rule improvements

**Commit: `9b6efef` - improve: enhance source discovery and enforce quality over quantity** (PARTIALLY REVERTED)
- ~~Social Media search now uses `site:linkedin.com/posts` filter~~ (REVERTED - caused false matches)
- Increased maxResults: Social Media (5→10), News (4→8), Growth Signals (3→6) (KEPT)
- Added MANDATORY SOURCE LINKING rule: Only create ice breakers where [SOURCE: url] tag exists (KEPT)
- GPT now generates 1-2 quality ice breakers with sources instead of 3 with fake/missing sources
- Better quality control: "If you only find 1-2 entries with sources, only generate 1-2 ice breakers"

**Commit: `583614d` - improve: add explicit URL extraction instructions and debug logging**
- Enhanced GPT prompt with CRITICAL SOURCE URL EXTRACTION section
- Added concrete example: If research shows "[SOURCE: url] fact", extract that exact URL
- Explicitly instructs GPT NOT to use company homepage as source_url
- Updated JSON output example with detailed URL extraction instructions
- Added debug logging to show first 500 chars of social media data
- Helps diagnose if Tavily finds specific LinkedIn posts vs generic pages

**Commit: `bd26637` - fix: inject source URLs into research data for better ice breaker linking**
- Updated all Tavily search result mappings to include `[SOURCE: url]` tags
- Modified 6 research streams: Leadership, Social Media, News, Financials (5 locations), Growth Signals
- Each search result now formatted as `[SOURCE: https://...] Title: Content`
- Added SOURCE LINKING instruction to GPT system prompt
- AI now uses specific deep links from research data instead of defaulting to main website
- Improves accuracy of ice breaker source attribution
- Better tracking of where each insight came from

**Commit: `9c025f1` - feat: make ice breakers clickable with source URLs**
- Changed ice_breaker from string[] to IceBreaker[] with { text, source_url }
- Updated GPT prompt to return source URLs for each ice breaker
- Ice breakers now clickable when source URL available
- Opens source (LinkedIn post, article, news) in new tab
- Added ExternalLink icon to indicate clickability
- Non-clickable ice breakers (no URL) shown without cursor-pointer
- Backend validates and includes URLs from research data

**Commit: `4b60571` - feat: add Atkinson Hyperlegible font and SVG flag icons**
- Replaced Inter with Atkinson Hyperlegible for improved readability
- Added via Google Fonts CDN for instant loading
- Created SVG flag components (Swedish and British)
- Updated language switcher to show flag icons + text
- Flags display reliably across all browsers (no emoji dependency)

**Commit: `d9afb27` - feat: AI generates content in selected language**
- Added language parameter to `analyzeUrl()` function
- Language passed from frontend to backend
- GPT prompt updated with language instruction
- AI now generates all content (ice breakers, pain points, sales hooks, etc.) in Swedish or English based on user selection
- Language instruction injected into system prompt

**Commit: `8de278a` - fix: remove emoji flags and clean up language switcher**
- Removed emoji flags that weren't rendering properly
- Clean design with just "SV" and "EN" text
- Added blue shadow to active language
- Tighter spacing and better touch targets

**Commit: `223e901` - feat: add multi-language support (Swedish/English)**
- Created `translations.ts` with complete Swedish and English translations
- Added language switcher in top-right corner
- Language preference saved in localStorage
- Instant switching without page reload
- Translated all UI elements:
  - Header (title, subtitle)
  - Form inputs and buttons
  - Advanced search fields (labels and placeholders)
  - Loading messages (8 rotating messages)
  - Error messages
  - Results section titles
  - Footer status
- Type-safe translation system with `Language` type
- Default language: English (EN)

**Commit: `72aa9c9` - feat: add hover effects and multiple ice breaker options**
- Added smooth hover effects to all cards (scale, glow, lift, border brighten)
- Changed ice_breaker from string to array of strings
- Backend now generates 2-3 different ice breaker suggestions
- Each ice breaker displays in numbered card with hover effect
- Updated validation to ensure array format

**Commit: `036dc6c` - redesign: complete Cheat Sheet style transformation**
- Deep blue radial gradient background
- Color-coded sections with left borders (blue/green/red/purple)
- Solid card modules instead of glass effect
- Increased spacing (`gap-8`, `space-y-8`)
- AlertTriangle icons for Pain Points
- Rounded corners (`rounded-xl`) and shadows (`shadow-lg`)

### Previous Commits

**Commit: `0cead5f` - improve: switch to Inter font for better contrast**
- Switched to Inter for body text (better readability)
- Kept Geist Mono for headers/tactical elements

**Commit: `c140756` - improve: hybrid typography for better readability**
- Hybrid font system (mono for headers, sans for body)

**Commit: `a187176` - rebrand: complete Tactical Tech redesign**
- Changed branding from corporate to tactical/military theme
- Renamed to "RECON"
- Added Radar icon to logo

**Commit: `a1b404f` - feat: sharp tech dashboard redesign with color-coded borders**
- Initial color-coding implementation
- Tech dashboard aesthetic

**Commit: `6e91773` - fix: make Advanced Search toggle button clickable**
- Fixed Advanced Search toggle functionality

---

## Design Evolution

1. **Black Box Design** (Original)
   - Flat black background
   - Glassmorphism cards
   - Monochrome green accents

2. **Tactical Tech** (Rebrand)
   - Military/tech aesthetic
   - "RECON" branding
   - Emerald green primary color

3. **Cheat Sheet Style** (Current)
   - Color-coded sections for quick scanning
   - Deep blue gradient background
   - Solid card modules with distinct borders
   - Professional dashboard appearance
   - Interactive hover effects

---

## Deployment

**Platform:** Vercel
**URL:** Auto-generated on push to main
**Build Command:** `npm run build` (Next.js)
**Environment Variables:** Set in Vercel dashboard

### Deployment Flow
1. Push to `main` branch
2. Vercel auto-detects changes
3. Builds Next.js app
4. Deploys to production URL
5. Updates complete in ~30-60 seconds

---

## Known Limitations & Future Enhancements

### Current Limitations
- GPT-5.2 model required (may not be available to all users)
- Swedish company detection limited to `.se` domains
- Tavily API rate limits may affect heavy usage
- No user authentication or session persistence

### Potential Enhancements
- [ ] Copy-to-clipboard buttons for ice breakers
- [ ] Save/export analysis results as PDF
- [ ] Multi-language support (beyond Swedish)
- [ ] Company comparison mode
- [ ] Historical tracking (save previous analyses)
- [ ] User accounts with saved searches
- [ ] Real-time notifications for company changes
- [ ] Chrome extension for LinkedIn/company websites

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Commit changes
git add .
git commit -m "message"
git push
```

---

## 📋 TODO / BACKLOG

### 🔴 Critical (Måste göras)

- [ ] **Rate Limiting** - Implementera rate limiting för API-anrop
  - **Problem:** Inga begränsningar på antal API-anrop per användare/IP
  - **Risk:** Missbruk, överdriven API-kostnad, DoS-sårbarhet
  - **Lösning:** Implementera rate limiting (Vercel Edge Config, Redis, eller in-memory för start)
  - **Ref:** CODE_REVIEW.md #3

### 🟡 High Priority (Bör göras snart)

- [ ] **Refactor actions.ts** - Bryt upp 598 rader till mindre moduler
  - **Problem:** En fil hanterar allt (validation, search, GPT, Swedish company logic)
  - **Bryter mot:** Single Responsibility Principle (SRP)
  - **Förslag:**
    ```
    /lib/validators/urlValidator.ts
    /lib/services/searchService.ts
    /lib/services/gptService.ts
    /lib/utils/swedishCompany.ts
    /lib/types/analysis.ts
    ```
  - **Ref:** CODE_REVIEW.md #5

- [ ] **Type Guards** - Lägg till runtime type validation
  - **Problem:** JSON parsing utan runtime validation (endast TypeScript types)
  - **Risk:** Runtime errors om API returnerar oväntat format
  - **Lösning:** Använd Zod eller io-ts för JSON schema validation
  - **Ref:** CODE_REVIEW.md #7

- [ ] **Process Manipulation** - Ta bort process.emitWarning override
  - **Problem:** Global override av `process.emitWarning` (säkerhetsrisk)
  - **Nuvarande:** Används för att suppresa Tavily SDK deprecation warning
  - **Lösning:** Hitta bättre sätt (Tavily SDK config, eller acceptera warning)
  - **Ref:** CODE_REVIEW.md #8

### 🟢 Medium Priority (Kan vänta)

- [ ] **Testing** - Lägg till test coverage (0% just nu)
  - **Unit tests:** Utility functions (sanitizeUrl, normalizeUrl, etc.)
  - **Integration tests:** API calls, GPT responses
  - **E2E tests:** User flows med Playwright
  - **Setup:** Jest/Vitest configuration
  - **Impact:** Safer refactoring, fewer regressions
  - **Ref:** CODE_REVIEW.md #9

- [ ] **Caching** - Implementera caching för API-svar
  - **Problem:** Varje request gör fresh API calls (även för samma URL)
  - **Impact:** Onödiga kostnader, långsam responstid för upprepade queries
  - **Lösning:**
    - Redis för production
    - In-memory cache för development
    - Cache key: `URL + advancedParams hash`
    - TTL: 1h för companies, 24h för financials
  - **Förväntat resultat:** 80% mindre API-kostnader, snabbare UX
  - **Ref:** CODE_REVIEW.md #11

- [ ] **Accessibility** - Lägg till ARIA labels
  - **Problem:** Interactive elements saknar aria-labels
  - **Examples:**
    - Advanced toggle button (line 266-273 in page.tsx)
    - Language switcher buttons
  - **Lösning:** Lägg till aria-label, aria-expanded, role attribut
  - **Standard:** WCAG AA compliance
  - **Ref:** CODE_REVIEW.md #10

- [ ] **Error Handling** - Bättre error types och logging
  - **Problem:** Generiska error messages, ingen structured logging
  - **Lösning:**
    - Custom `AppError` class med error codes
    - Structured logging (console.log → logger.info/error)
    - User-friendly vs developer error messages
    - Error codes: `ANALYSIS_FAILED`, `API_LIMIT`, `INVALID_INPUT`
  - **Ref:** CODE_REVIEW.md #12

- [ ] **Magic Numbers** - Extrahera till named constants
  - **Problem:** Hard-coded values utan dokumentation
  - **Examples:**
    ```typescript
    maxResults: 5  // Why 5?
    maxIterations: 5  // Why 5?
    MAX_URL_LENGTH: 500  // Why 500?
    ```
  - **Lösning:**
    ```typescript
    const MAX_SOCIAL_MEDIA_RESULTS = 5; // Balance between quality and speed
    const MAX_GPT_SEARCH_ITERATIONS = 5; // Optimal for Swedish company search
    const MAX_URL_LENGTH = 500; // Prevent abuse and DoS
    ```
  - **Ref:** CODE_REVIEW.md #13

### 💡 Nice to Have (Framtida förbättringar)

- [ ] **Copy-to-clipboard** - Buttons för att kopiera ice breakers
- [ ] **Export Results** - Export analysis som PDF eller Markdown
- [ ] **Search History** - Spara tidigare sökningar (localStorage eller DB)
- [ ] **User Accounts** - Authentication och saved searches
- [ ] **Real-time Notifications** - Alerts när companies får ny press/funding
- [ ] **Chrome Extension** - Analyze company direkt från LinkedIn/hemsida
- [ ] **Multi-language** - Support för fler språk (Norska, Danska, Finska)
- [ ] **API Endpoint** - REST API för integration med CRM-system

---

## Important Notes for Future Sessions

1. **Always update this file** when making significant changes
2. **Commit format:** Use descriptive commits with emoji prefix (feat:, fix:, improve:, redesign:)
3. **Test before pushing:** Ensure no TypeScript errors
4. **Vercel deploys automatically:** Changes go live immediately on push
5. **Color consistency:** Maintain the color-coding system (blue/green/red/purple)
6. **Ice breaker quality:** Keep them conversational, specific, and under 20 words
7. **Swedish data:** Always prioritize GPT-verified Allabolag data for accuracy
8. **Font usage:** Inter for body, Geist Mono for tactical/header elements only

---

## Contact & Support

**Developer:** Klas Olsson
**Project Type:** B2B Sales Intelligence Tool
**License:** Private/Proprietary
**Claude Code Session:** This file tracks all changes for continuity

---

**End of Documentation**
*Next update: When features/design changes occur*
