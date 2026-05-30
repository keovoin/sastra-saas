# Sastra — Business Operating System

> **The all-in-one platform for strategy, operations, and growth.** Replace 10+ scattered tools with one unified system. AI-powered. Real-time. Role-based.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkeovoin%2Fsastra-saas)
[![Live Demo](https://img.shields.io/badge/Live-sastratech.live-blue?style=flat-square)](https://sastratech.live)

---

## 🚀 What is Sastra?

Sastra is a **Business Operating System** — a single platform that unifies strategy planning, risk management, project governance, financial modeling, team health monitoring, sales tracking, and AI-powered decision support.

Built for **startup founders, operations leaders, and strategy teams** who are tired of switching between spreadsheets, Notion, Jira, and 5 other tools.

---

## ✨ Key Features

### 📊 21 Integrated Modules

| Category | Modules |
|----------|---------|
| **Strategy & Planning** | SWOT Board, Goal Cascade, Decision Log, Project Charters, Risk Manager |
| **Sales & Operations** | Sales Pipeline (CRM), Competitor Tracker, Stakeholder Map |
| **Finance** | Runway Calculator, Unit Economics, KPI Dashboard, Invoice Tracker |
| **People & Culture** | Team Pulse Survey, Organization & Roles Management |
| **Intelligence** | AI Strategy Assistant, Board Deck Generator, Activity Feed, Dashboard |

### 🤖 AI-Powered Everything

Every module has built-in AI assistance:

- **Risk Manager** → AI suggests emerging risks
- **Sales Pipeline** → AI recommends next action per deal
- **Competitor Tracker** → AI analyzes competitor strengths/weaknesses
- **Decision Log** → AI generates decision alternatives
- **Runway Calculator** → AI provides cost-cutting recommendations
- **Unit Economics** → AI analyzes financial health
- **Invoice Tracker** → AI forecasts revenue
- **Team Pulse** → AI identifies team sentiment patterns
- **Board Deck** → AI generates full investor update from your data
- **Strategy Board** → AI generates SWOT analysis by industry

**Bring Your Own Key (BYOK)** — Works with any OpenAI-compatible API:
- OpenAI (GPT-4o, GPT-4o Mini)
- Groq (Llama 3.1, Mixtral)
- Together AI
- OpenRouter (Claude, Gemini, etc.)
- Ollama (local/self-hosted)
- Any custom endpoint

### 🔐 Enterprise-Grade Access Control

Module-level Role-Based Access Control (RBAC):

| Role | Access |
|------|--------|
| **Owner** | Full admin on all modules |
| **Admin** | Edit access on most, viewer on system |
| **Member** | Viewer on operational tools, no access to finance/settings |

Assign **per-module permissions** (Admin / Editor / Viewer / None) for granular control.

### ⚡ Real-Time Collaboration

- **Supabase Realtime** — Changes sync instantly across all connected users
- **Optimistic UI** — Actions feel instant with automatic rollback on failure
- **Activity Feed** — See who did what, when, in real-time
- **Multi-Project** — Switch between projects with isolated data

### 🌗 Beautiful Design

- **Dark/Light Mode** — Full theme support with CSS variables
- **Mobile Responsive** — Hamburger menu, adaptive layouts
- **Linear/Stripe Aesthetic** — Clean, high-contrast, professional
- **Export/Print** — Board-ready PDF generation for Risk Register & Charters

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS (Mobile-first) |
| **Components** | Shadcn/UI (Radix Primitives) |
| **Icons** | Lucide React |
| **Charts** | Recharts (ResponsiveContainer) |
| **State** | React Context + Optimistic Updates |
| **Backend** | Supabase (Postgres, Auth, Realtime, RLS) |
| **AI** | Any OpenAI-compatible API (BYOK) |
| **Deploy** | Vercel (Edge Network) |

---

## 📁 Project Structure

```
sastra-saas/
├── public/
├── supabase/
│   └── schema.sql              # Full database schema + RLS policies
├── src/
│   ├── components/
│   │   ├── ui/                 # Shadcn primitives (Button, Card, Badge, Dialog...)
│   │   ├── Layout.tsx          # Shell: sidebar, header, project selector
│   │   ├── LandingPage.tsx     # Public marketing page
│   │   ├── AuthScreen.tsx      # Login / Signup / Magic Link
│   │   ├── InviteModal.tsx     # Team invitation with role picker
│   │   └── PrintView.tsx       # Export/print document renderer
│   ├── context/
│   │   └── BusinessContext.tsx # Central provider: auth, data, realtime, CRUD
│   ├── hooks/
│   │   └── useTheme.ts        # Dark/light mode hook
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── ai.ts              # Shared AI utility (askAI, askAIJson)
│   │   └── utils.ts           # cn() class merger
│   ├── store/
│   │   └── permissions.ts     # Module-level RBAC definitions
│   ├── pages/
│   │   ├── Dashboard.tsx       # KPI cards + 5 charts
│   │   ├── StrategyBoard.tsx   # Interactive SWOT 2x2
│   │   ├── RiskRegister.tsx    # Severity-sorted table + AI suggest
│   │   ├── ProjectCharters.tsx # Multi-step wizard
│   │   ├── GoalCascade.tsx     # Vision → Goals → Tasks tree
│   │   ├── DecisionLog.tsx     # Decisions + AI alternatives
│   │   ├── SalesPipeline.tsx   # Kanban CRM + AI next-action
│   │   ├── CompetitorTracker.tsx # Feature matrix + AI analysis
│   │   ├── StakeholderMap.tsx  # Power/Interest grid
│   │   ├── KPIBuilder.tsx      # Custom metrics + trends
│   │   ├── RunwayCalculator.tsx # 24-month cash projection + AI advice
│   │   ├── UnitEconomics.tsx   # CAC/LTV/Payback + AI health check
│   │   ├── InvoiceTracker.tsx  # Revenue tracking + AI forecast
│   │   ├── PulseSurvey.tsx     # Team sentiment + AI insights
│   │   ├── BoardDeckGenerator.tsx # AI investor update generator
│   │   ├── OrgManagement.tsx   # Team + per-module permissions
│   │   ├── ActivityFeed.tsx    # Real-time event timeline
│   │   ├── AIAssistant.tsx     # Full SWOT AI (multi-provider)
│   │   ├── ProfilePage.tsx     # Edit name, avatar, password
│   │   └── Settings.tsx        # API keys, workspace, notifications
│   ├── App.tsx                 # Router + auth guard + landing page
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind + light/dark CSS variables
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

---

## ⚡ Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/keovoin/sastra-saas.git
cd sastra-saas
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Disable email confirmation: Authentication → Providers → Email → Toggle off "Confirm email"

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) → Sign up → Create a project → Start using!

---

## 🌐 Deploy

### Vercel (Recommended)

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy

### Custom Domain

Add your domain in Vercel → Settings → Domains, then update DNS:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

---

## 🤖 AI Configuration

Go to **Settings** in the app to configure AI:

1. Select a provider (OpenAI, Groq, Together AI, OpenRouter, Ollama, or custom)
2. Paste your API key
3. Choose a model (or type a custom model ID)
4. Click "Save Key"

AI features appear across all modules once configured. Your key never leaves your browser.

---

## 🔒 Security

- **Row Level Security (RLS)** — Users can only access their own project data
- **API keys stored in browser only** — Never sent to Sastra servers
- **Auth via Supabase** — Email/password, magic link, session management
- **Per-module permissions** — Granular access control per team member

---

## 📊 Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User info + role (extends auth.users) |
| `projects` | Top-level containers with owner |
| `risks` | Risk register with computed severity |
| `swot_items` | SWOT analysis items by type |
| `charters` | Project charters with scope arrays |

All tables have:
- UUID primary keys
- `created_at` / `updated_at` timestamps
- RLS policies for data isolation
- Realtime publication enabled
- Performance indexes

---

## 🗺 Roadmap

- [ ] Email notifications (risk alerts, team updates)
- [ ] Stripe billing integration
- [ ] Slack/Discord notifications
- [ ] Google Calendar sync for milestones
- [ ] CSV/Excel import/export
- [ ] Custom branding per organization
- [ ] Audit log with compliance reporting
- [ ] Mobile native app (React Native)

---

## 📄 License

MIT — Free for personal and commercial use.

---

<p align="center">
  <b>Built by <a href="https://sastratech.live">Sastra Technologies</a></b><br>
  Strategy. Operations. Growth. — Unified.
</p>
