# STREETPOLY NEWS

StreetPoly News is a high-fidelity media portal and dynamic content engine designed for real-time editorial management. 🎙️⚡

## 🚀 Core Features

### 🎬 The Control Room (Conduction Mode)
A visual overlay that transforms the site into an editable "Booth" for admins.
- **Visual Editing**: Click any "Slot" on the live site to swap content instantly.
- **Temporal Scheduling**: Schedule content to go live or expire at specific times (starts_at/ends_at).
- **Device Targeting**: Serve vertical-friendly content to mobile users and cinematic layouts to desktop users in the same slot.
- **Realtime Presence**: See other active admins currently in the "Booth" via Supabase Presence.

### 📰 Content Management
- **Dynamic Slots**: Key areas (Hero, Breaking News, Clips) are "Virtual Slots" that resolve the highest-priority active placement.
- **Infinite Feed**: A seamless, high-performance story feed with high-contrast typography.
- **Monetization Ready**: Integrated Stripe infrastructure for slot entitlements and artist promotions.

## 🛠️ Technology Stack

- **Frontend**: Vite + TypeScript + React 18
- **Styling**: Tailwind CSS + Framer Motion (Animations) + Lucide (Icons)
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Realtime, RPCs, Edge Functions)
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui (Tailwind-based Radix primitives)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project (with migrations applied in `/supabase/migrations`)

### Local Development

```sh
# 1. Clone & Install
git clone https://github.com/polypickedit/Street-Poly-News.git
cd street-politics-feed-main
npm install

# 2. Setup Environment
# Copy .env.example to .env.local and fill in your Supabase & Stripe keys

# 3. Launch
npm run dev
```

## 🚢 Deployment

Simply open [Lovable](https://lovable.dev/projects) and click on **Share -> Publish**. Lovable automatically handles the Vercel/Vite build process. For the backend, ensure your environment variables are set in the Lovable/Vercel settings.

## 📜 Documentation
- [Production Checklist](TODO.md)
- [Testing Guide](TESTING.md)
- [Environment Setup](ENVIRONMENT.md)
- [Diagnostics](DIAGNOSTICS.md)
