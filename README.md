This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
















# Vedic-webapp

A web-based management system for a single-location coffee shop that roasts and sells its own coffee beans — covering role-based access, table/tab-based sales tracking, dual-stream bean inventory (retail vs. brewing), recipe-driven automatic stock deduction, flat-amount discounting, and name-based credit/dues tracking.

This is **not** a POS or payment-gateway system. It tracks sales and inventory; it does not process live payments or print receipts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Database & Auth | [Supabase](https://supabase.com/) (Postgres, Row Level Security, Auth) |
| Hosting | [Vercel](https://vercel.com/) |
| Language | TypeScript |
| Styling | Tailwind CSS |

Built entirely on free tiers (Vercel Hobby + Supabase Free) — see [Architecture](#architecture) for how stability and performance are handled within those constraints.

---

## Core Features

- **Three roles** — Superadmin, Owner, Staff — each with a distinct permission set
- **Tables & running tabs** — numbered tables, multiple items added to an open tab before closing, no live occupied/free status grid
- **Dual bean inventory** — separate **Retail Stock** (sellable bean bags) and **Brewing Stock** (loose beans used to make drinks)
- **Recipe-based auto-deduction** — each drink has a defined grams-per-serving; brewing stock is deducted automatically per sale, and reversed if an item is removed before the tab closes
- **Simple inventory** — basic unit-based stock for snacks/pastries, no recipe logic
- **Flat-amount discounts** — applied once at tab close, with a Staff-level cap set by the Owner; Owner/Superadmin can apply any amount
- **Credit sales** — customers identified by a unique name (no other personal data collected); pending balances from past visits surface automatically the next time that name is selected
- **Partial & lump-sum payments** — a single payment can be split across multiple unpaid orders, oldest-debt-first (FIFO), with manual override available
- **Full audit trail** — every stock movement, discount, and payment is logged with actor and timestamp

Full requirements are documented in [`/docs/SRS.md`](./docs/SRS.md) *(or see the SRS Word document shared separately)*.

---

## Roles & Permissions (Summary)

| Capability | Superadmin | Owner | Staff |
|---|:---:|:---:|:---:|
| Manage Owner accounts | ✅ | — | — |
| Manage Staff accounts | ✅ | ✅ | — |
| Define recipes & pricing | ✅ | ✅ | — |
| Open table / manage tabs | ✅ | ✅ | ✅ |
| Apply discount within cap | ✅ | ✅ | ✅ |
| Apply discount above cap | ✅ | ✅ | ❌ |
| Restock inventory | ✅ | ✅ | ✅ |
| Allocate stock (retail vs. brewing) | ✅ | ✅ | ❌ |
| Record credit payments | ✅ | ✅ | ✅ |
| Edit/delete payment records | ✅ | ✅ | ❌ |
| View full reports & audit log | ✅ | ✅ | ❌ |

Full matrix in the SRS.

---

## Architecture

The system runs entirely on free-tier infrastructure, which shapes a few key decisions:

- **Pooled DB connections only** — all server-side queries go through Supabase's connection pooler (Supavisor), never the direct Postgres connection, to avoid exhausting the free tier's connection limit under serverless load.
- **Stock deduction & payment allocation live in Postgres** — implemented as SQL functions called via RPC, not app-layer read-modify-write, so concurrent sales never cause race conditions on shared stock.
- **Row Level Security (RLS) is the real authorization boundary** — the permissions table above is enforced in the database, not just hidden/shown in the UI.
- **Scheduled health-check ping** — prevents the Supabase free-tier project from auto-pausing due to inactivity.
- **Scoped Realtime usage** — live updates are limited to the open-tables view, to stay within free-tier Realtime connection limits.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/Vedic-webapp.git
cd Vedic-webapp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only, never exposed to client
DATABASE_URL=your-supabase-pooled-connection-string
```

### Run locally

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### Database setup

SQL migrations (tables, RLS policies, and stock/payment functions) live in `/supabase/migrations`. Apply them via the Supabase CLI or the SQL editor in your Supabase dashboard.

```bash
supabase db push
```

---

## Project Structure

```
Vedic-webapp/
├── app/                  # Next.js App Router pages & layouts
│   ├── (staff)/          # Staff-facing routes (tables, tabs, restock)
│   ├── (owner)/          # Owner-facing routes (reports, recipes, inventory)
│   └── (superadmin)/     # Superadmin routes (accounts, settings)
├── components/           # Shared UI components
├── lib/
│   ├── supabase/         # Supabase client setup (server & browser)
│   └── actions/          # Server actions for mutations
├── supabase/
│   └── migrations/       # SQL migrations: tables, RLS, functions
├── docs/
│   └── SRS.md            # Full Software Requirements Specification
└── README.md
```

---

## Status

🚧 Actively in development — single-shop deployment, no multi-branch support planned for this version.

---

## License

Private project — license terms to be defined by the project owner.