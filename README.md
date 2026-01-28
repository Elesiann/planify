# Planify

A personal household finance management app built with React, TypeScript, and Supabase. Track shared expenses, split costs between household members, and visualize spending patterns.

## Why I Built This

My wife and I used to track our shared expenses in an Excel spreadsheet. It worked, but updating it was always a hassle — we had to be on a computer, remember to open the file, and manually calculate the splits.

I built Planify to replace that spreadsheet with a modern web app. Now we can log expenses from anywhere on our phones, and the app automatically handles the splitting based on our income ratio. What used to be a chore is now just a few taps away.

## Features

- **Expense Tracking**: Log and categorize household expenses
- **Smart Splitting**: Automatically split expenses based on configurable income ratios
- **Fixed Expenses**: Manage recurring monthly bills with customizable due dates
- **Dashboard Analytics**: Visualize spending with charts and KPIs
- **Multi-Household Support**: Create and manage multiple households
- **Member Management**: Invite system for adding household members with role-based permissions (owner/admin/member)
- **CSV Import**: Bulk import transactions from spreadsheets
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: TanStack Router
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/planify.git
cd planify
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Run database migrations
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

5. Start the development server
```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_PROJECT_ID` | Your Supabase project ID (for CLI) |

## Database Schema

All configuration is stored in the database:

| Table | Key Fields |
|-------|------------|
| `households` | name, currency, fixed_due_day, owner_id |
| `household_members` | user_id, role, share_ratio |
| `profiles` | name, email, income, active_household_id |
| `transactions` | amount, category, date, paid_by, is_shared |
| `fixed_expenses` | description, amount, household_id |
| `household_invites` | token, role, status, expires_at |

## Project Structure

```
src/
├── app/           # App shell, router, protected layout
├── components/    # Reusable UI components
│   ├── household/ # Household management components
│   ├── planify/   # App-specific components
│   ├── summary/   # Dashboard charts and stats
│   └── ui/        # shadcn/ui base components
├── hooks/         # Custom React hooks (data fetching, mutations)
├── lib/           # Utilities, Supabase client, providers
├── routes/        # Page components
│   ├── households/# Household management page
│   ├── logs/      # Transaction logs
│   ├── tools/     # Import tools
│   └── ...
└── types/         # TypeScript type definitions
```

## License

MIT
