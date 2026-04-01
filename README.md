# Faculty Evaluation (Next.js + Supabase)

A comprehensive system for faculty evaluation and student sentiment collection. Built with Next.js 14 (App Router), Tailwind CSS, and Supabase.

## 📚 Documentation

### Quick Start
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run dev server: `npm run dev`
4. Open http://localhost:3000

### System Documentation
- **[SYSTEM_FLOWS.md](./SYSTEM_FLOWS.md)** - Complete system architecture, data models, user flows, API endpoints, and security policies
- **[FLOW_DIAGRAMS.md](./FLOW_DIAGRAMS.md)** - Visual diagrams (Mermaid) for system architecture, user workflows, database relationships, and data flows

## Features

✅ Multi-role authentication (Admin, Faculty, Student, Evaluator)  
✅ Rubric-based evaluation system (4 categories: Commitment, Knowledge, Independent Learning, Learning Management)  
✅ Evaluation assignment and tracking  
✅ Student sentiment collection  
✅ Database with Row-Level Security (RLS) policies  
✅ Admin dashboard for management  
✅ Supabase integration with auth-helpers  
✅ Responsive UI with Tailwind CSS  

## Architecture

### Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase Postgres
- **Auth**: Supabase Auth with JWT-based roles
- **Database**: PostgreSQL with RLS enforcement

### Key Components
- Home page with highlights and quick start steps
- Authentication system with role-based access
- Admin console for user, period, rubric, and section management
- Faculty dashboard for evaluations and feedback
- Student sentiment form
- Component library for reusable UI

## Included

- App Router structure with authenticated pages (admin, faculty, student)
- Supabase browser/server clients (auth-helpers)
- Database schema with migrations (see `supabase/`)
- Row-Level Security policies for data protection
- Tailwind styling with card and button components

## Database Schema

See the complete schema in `supabase/schema.sql`. Key tables:
- `profiles` - User accounts and roles
- `departments`, `courses`, `sections` - Academic structure
- `evaluation_periods` - Evaluation windows
- `rubric_categories`, `rubric_items` - Assessment framework
- `evaluator_assignments` - Evaluation assignments
- `evaluations`, `evaluation_responses` - Submission records
- `student_sentiments` - Qualitative feedback

## Next Steps

- [ ] Build evaluation form UI for evaluators
- [ ] Implement evaluation submission endpoints
- [ ] Create admin reporting dashboard
- [ ] Add PDF/CSV export functionality
- [ ] Build faculty dashboard with aggregated feedback
- [ ] Implement trend analysis and charts
- [ ] Add email notifications for evaluators
- [ ] Configure Supabase Row-Level Security policies for production

## User Roles

| Role | Permissions |
|------|-----------|
| **Admin** | Create users, setup rubrics, manage periods, create assignments, view all reports |
| **Faculty** | Complete self-evaluation, view peer feedback, submit student sentiment, download personal report |
| **Evaluator** | Complete assigned evaluations (peer/supervisor), submit scores and comments |
| **Student** | Submit sentiment feedback about faculty |

For detailed information about system flows, user journeys, and architecture, see [SYSTEM_FLOWS.md](./SYSTEM_FLOWS.md) and [FLOW_DIAGRAMS.md](./FLOW_DIAGRAMS.md).
