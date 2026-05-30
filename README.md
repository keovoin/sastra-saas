# Sastra - Business Operating System

A comprehensive SaaS dashboard that aggregates business tools into a cohesive single-page application. Built with React, TypeScript, and modern UI primitives.

## Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (Mobile-first)
- **Components:** Shadcn/UI (Radix Primitives)
- **Icons:** Lucide React
- **Charts:** Recharts (ResponsiveContainer)
- **State:** Zustand
- **Notifications:** Sonner

## Features

- **Dashboard** - KPI cards, revenue charts, risk trends, SWOT distribution
- **Strategy Board (SWOT)** - Interactive 2x2 grid with add/edit/priority voting
- **Risk Register** - Severity-sorted data table with visual risk indicators
- **Project Charter Wizard** - Multi-step form for defining project scope
- **Settings** - Workspace, team, and notification management

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── ui/          # Shadcn/UI primitives (Button, Card, Badge, Dialog, etc.)
│   └── Layout.tsx   # Shell layout with collapsible sidebar and header
├── pages/
│   ├── Dashboard.tsx
│   ├── StrategyBoard.tsx
│   ├── RiskRegister.tsx
│   ├── ProjectCharters.tsx
│   └── Settings.tsx
├── store/
│   └── useStore.ts  # Zustand state management
├── lib/
│   └── utils.ts     # cn() utility for class merging
├── App.tsx
├── main.tsx
└── index.css        # Tailwind + CSS variables
```
