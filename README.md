# StageSync

**Head-to-head synced POV video comparisons for competitive shooters.**

Upload your hat-cam footage → trim to the exact stage → tag it → instantly compare any two shooters side-by-side with perfect offset control.

Built for USPSA, IDPA, 3-Gun, Steel Challenge, etc.

## Tech Stack
- Next.js 15 (App Router + React 19)
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- Mux Video (upload, transcoding, instant clipping, HLS streaming)
- Deployed on Vercel

## Quick Start (for beta testers)

```bash
git clone https://github.com/yourusername/stagesync.git
cd stagesync
npm install
npm run dev
