# Faculty Evaluation System - Flows & Architecture Documentation

## System Overview

This is a **Faculty Evaluation Management System** built with Next.js 14, Supabase, and Tailwind CSS. It enables multi-role evaluations of faculty members aligned to educational rubrics and captures student sentiment feedback.

### Key Features
- **Evaluation Management**: Self, peer, supervisor, and student evaluations
- **Rubric Framework**: 4-category model (Commitment, Knowledge, Independent Learning, Learning Management)
- **Role-Based Access**: Admin, Faculty, Student, and Evaluator roles
- **Student Sentiment**: Lightweight feedback collection
- **Dashboard & Reporting**: Admin console for management and exports

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Faculty Evaluation System                │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
            ┌─────────┐ ┌────────┐ ┌──────────┐
            │ Frontend │ │ Backend│ │ Database │
            └─────────┘ └────────┘ └──────────┘
```

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase Postgres
- **Auth**: Supabase Auth Helpers with JWT-based role management
- **Database**: PostgreSQL (Supabase) with Row-Level Security (RLS)

---

## User Roles & Permissions

```
┌──────────────────┐
│      ADMIN       │
├──────────────────┤
│ • Manage all     │
│ • Create users   │
│ • Setup rubrics  │
│ • Period mgmt    │
│ • Reports/Export │
└──────────────────┘

┌──────────────────┐
│     FACULTY      │
├──────────────────┤
│ • Self-evaluate  │
│ • Receive peer   │
│ • View sentiment │
│ • Submit notes   │
└──────────────────┘

┌──────────────────┐
│   EVALUATOR      │
├──────────────────┤
│ • Complete       │
│   assigned evals │
│ • Peer review    │
│ • Supervisor     │
│   assessments    │
└──────────────────┘

┌──────────────────┐
│     STUDENT      │
├──────────────────┤
│ • Submit         │
│   sentiment      │
│ • Faculty        │
│   feedback       │
└──────────────────┘
```

---

## Database Schema Overview

```
Core Entities:
├── departments (reference data)
├── profiles (users + roles)
├── courses & sections (teaching structure)
├── evaluation_periods (time windows)
├── rubric_categories & items (assessment framework)
│
├── evaluator_assignments (who evaluates whom)
├── evaluations (evaluation records by assignment)
├── evaluation_responses (individual rubric scores)
│
└── student_sentiments (qualitative feedback)
```

### Key Tables

| Table | Purpose | Relationships |
|-------|---------|---------------|
| `profiles` | User accounts + roles | links to `auth.users` |
| `sections` | Classes/courses taught | course_id, faculty_id |
| `evaluation_periods` | Time windows for evals | references rubric_version |
| `rubric_categories` | 4 evaluation categories | Commitment, Knowledge, etc. |
| `rubric_items` | Specific assessment prompts | category_id, scoring |
| `evaluator_assignments` | Maps evaluator → faculty | period, section, role |
| `evaluations` | Completed evaluations | assignment_id, status |
| `evaluation_responses` | Individual rubric scores | item_id, score (1-5) |
| `student_sentiments` | Qualitative feedback | faculty_id, section_id |

---

## Application Routes & Structure

```
/
├── / (homepage)
├── /auth
│   └── /login
├── /admin
│   ├── /dashboard
│   ├── /users
│   ├── /records
│   └── (Admin components for management)
├── /faculty
│   └── (Faculty dashboard & self-eval)
├── /student
│   └── (Student sentiment form)
└── /api
    └── /admin
        └── /create-user
```

### Page Hierarchy
- **Public**: `/`, `/auth/login`
- **Protected (Faculty+)**: `/faculty`, `/student`
- **Protected (Admin)**: `/admin/*`

---

## Core User Flows

### 1. Admin Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      ADMIN SETUP FLOW                       │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Configure Rubric
  │   ├─ Define 4 categories (Commitment, Knowledge, etc.)
  │   └─ Add rubric items/prompts per category
  │
  ├─→ (Setup Rubric Categories)
  │   • Commitment
  │   • Knowledge of Subject
  │   • Teaching for Independent Learning
  │   • Management of Learning
  │
  ├─→ Create Evaluation Period
  │   ├─ Set name, dates (start/end)
  │   ├─ Assign rubric version
  │   └─ Set status (draft → open → closed)
  │
  ├─→ Manage Departments & Courses
  │   ├─ Create departments
  │   ├─ Create courses per department
  │   └─ Create sections (course instances)
  │
  ├─→ Create User Accounts
  │   ├─ Admin creates users via /admin/users
  │   ├─ API: POST /api/admin/create-user
  │   └─ Assign roles (faculty, evaluator, student, admin)
  │
  ├─→ Create Evaluator Assignments
  │   ├─ Assign who evaluates whom (faculty_id)
  │   ├─ Set evaluation role (self, peer, supervisor, student)
  │   ├─ Link to evaluation period
  │   └─ Optionally link to section
  │
  ├─→ Monitor Responses
  │   ├─ View evaluation submissions
  │   ├─ Track completion rates
  │   └─ Review scores & comments
  │
  └─→ Export & Report
      ├─ Generate PDFs with scores
      ├─ Export CSV for analysis
      └─ View trends by period
```

### 2. Evaluator Completion Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   EVALUATOR FLOW                            │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Login
  │   └─ Authenticate via Supabase Auth
  │
  ├─→ View Assigned Evaluations
  │   ├─ Query: evaluator_assignments WHERE evaluator_id = auth.uid()
  │   ├─ See faculty names, evaluation roles
  │   └─ Filter by period/status
  │
  ├─→ For Each Assignment:
  │   │
  │   ├─→ Open Evaluation Form
  │   │   ├─ Load rubric for period
  │   │   ├─ Display all categories & items
  │   │   └─ Show evaluation role (self/peer/etc)
  │   │
  │   ├─→ Score Rubric Items
  │   │   ├─ For each rubric item:
  │   │   │  ├─ Select score (1-5 scale)
  │   │   │  └─ Add optional comment
  │   │   └─ Navigate through sections
  │   │
  │   ├─→ Add Overall Comments
  │   │   └─ Optional overall_comment field
  │   │
  │   ├─→ Submit Evaluation
  │   │   ├─ POST to evaluations table
  │   │   ├─ Insert all evaluation_responses
  │   │   ├─ Set status = 'submitted'
  │   │   ├─ Record submitted_at timestamp
  │   │   └─ Confirmation message
  │   │
  │   └─→ Can Edit Until Period Closes
  │       └─ Reopen & modify scores/comments
  │
  └─→ Mark as Complete
      └─ Move to next evaluation or exit
```

### 3. Student Sentiment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  STUDENT SENTIMENT FLOW                     │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Student Accesses /student
  │   └─ No login required (or lightweight auth)
  │
  ├─→ Select Faculty/Course
  │   ├─ Choose faculty member
  │   └─ Optionally select section
  │
  ├─→ Submit Sentiment
  │   ├─ Select sentiment level: positive | neutral | negative
  │   ├─ Write optional comments
  │   ├─ (Can add sentiment scale ranking if enhanced)
  │   └─ Submit
  │
  ├─→ Backend Processing
  │   ├─ INSERT into student_sentiments
  │   ├─ Store: period_id, section_id, faculty_id, student_id
  │   ├─ Record: sentiment, comments, created_at
  │   └─ RLS: Faculty/Admins can access their sentiments
  │
  └─→ Success
      └─ Faculty/Admin can view aggregated sentiment
```

### 4. Faculty Dashboard Flow (Self-Evaluation)

```
┌─────────────────────────────────────────────────────────────┐
│                  FACULTY DASHBOARD FLOW                     │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Faculty Login
  │   └─ Supabase Auth (email/password)
  │
  ├─→ View Dashboard /faculty
  │   ├─ Active evaluation periods
  │   ├─ Upcoming evaluations
  │   ├─ Student sentiment summary
  │   └─ Quick statistics
  │
  ├─→ Self-Evaluation Assignment
  │   ├─ If has 'self' evaluation role in period
  │   ├─ Complete self-assessment against rubric
  │   └─ See results immediately after submit
  │
  ├─→ View Peer/Supervisor Feedback
  │   ├─ After period closes
  │   ├─ Aggregated scores per category
  │   ├─ Anonymous or identified feedback
  │   └─ Trend analysis
  │
  ├─→ Review Student Sentiment
  │   ├─ VIEW: student_sentiments WHERE faculty_id = auth.uid()
  │   ├─ Sentiment breakdown (positive/neutral/negative)
  │   ├─ Qualitative comments
  │   └─ Grouped by section if available
  │
  └─→ Download Report
      └─ Personal evaluation report (PDF/CSV)
```

---

## Data Flow Diagrams

### Admin Creating Evaluation Period

```
Admin Console
    │
    ├─ Create Period Form
    │  ├ name
    │  ├ start_date, end_date
    │  ├ rubric_version
    │  └ status (draft)
    │
    └─→ POST /admin/create-period (or direct form)
        │
        └─→ INSERT evaluation_periods
            │
            └─→ Confirmation
                └─ Now evaluator assignments can reference this period
```

### EvaluationAssignment & Submission Flow

```
evaluator_assignments
    ↓
    For each assignment:
    ├─ evaluator (auth.uid()) receives notification or sees list
    ├─ clicks to open evaluation form
    │
    └─→ Load rubric_items for period
        │
        └─→ For each rubric_item:
            ├─ Present prompt + scoring (1-5)
            ├─ Accept score + optional comment
            ├─ Store in evaluation_responses (rubric_item_id, score, comment)
            │
            └─→ On form submit:
                ├─ CREATE evaluations record
                ├─ INSERT all evaluation_responses
                ├─ Set evaluations.status = 'submitted'
                ├─ Set evaluations.submitted_at = NOW()
                │
                └─→ Query results for Admin Dashboard
                    ├─ Aggregate scores per category
                    ├─ Calculate averages
                    ├─ Generate reports
                    └─ Export to CSV/PDF
```

### Authentication & Authorization Flow

```
Login (Supabase Auth)
    ↓
    ├─ User authenticates with credentials
    │
    ├─ JWT returned with claims:
    │  └─ sub (user id)
    │  └─ app_metadata.role (admin|faculty|student|evaluator)
    │
    ├─ Frontend stores JWT in secure cookie (auth-helpers)
    │
    ├─ On API request:
    │  └─ Supabase checks JWT validity
    │
    ├─ RLS Policies evaluate:
    │  ├─ app_is_admin() checks role = 'admin'
    │  ├─ auth.uid() checks user ownership
    │  └─ Evaluator checks assignment visibility
    │
    └─→ Return authorized data or 403 Forbidden
```

---

## Component Hierarchy

### Admin Section (`/src/components/admin/`)

```
/admin
├── admin-layout
│   ├── sidebar-nav (navigation)
│   │
│   ├── /dashboard (overview)
│   │
│   ├── /users → users-table
│   │             add-user-form
│   │
│   ├── /records → (evaluation responses, scores)
│   │
│   └── (period, rubric management)
│       ├── period-manager
│       ├── rubric-manager
│       ├── add-section-form
│       ├── add-user-form
│       └── section-scores-card
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `users-table.tsx` | `/src/components/admin/` | Display all users, filter by role |
| `add-user-form.tsx` | `/src/components/admin/` | Create new user accounts |
| `period-manager.tsx` | `/src/components/admin/` | Create & manage evaluation periods |
| `rubric-manager.tsx` | `/src/components/admin/` | Configure rubric items & categories |
| `section-scores-card.tsx` | `/src/components/admin/` | Display aggregated evaluation scores |
| `add-section-form.tsx` | `/src/components/admin/` | Create course sections |
| `login-form.tsx` | `/src/app/auth/login/` | User authentication interface |
| `student-form.tsx` | `/src/app/student/` | Student sentiment submission form |
| `sidebar-nav.tsx` | `/src/components/chrome/` | Main navigation for all roles |

---

## API Endpoints

### Existing Endpoints

```
POST /api/admin/create-user
├─ Purpose: Create new user account
├─ Auth: Admin only (requires app_role = 'admin')
├─ Input: { email, full_name, role, department_id }
└─ Response: { id, email, role, created_at }
```

### Planned/Expected Endpoints

```
Period Management:
POST   /api/admin/periods
GET    /api/admin/periods
PATCH  /api/admin/periods/:id

Evaluation Management:
POST   /api/evaluations
GET    /api/evaluations (filtered by role)
PATCH  /api/evaluations/:id

Evaluation Responses:
POST   /api/evaluation-responses
GET    /api/evaluation-responses/:evaluationId

User Management:
GET    /api/admin/users
POST   /api/admin/users (create-user)
PATCH  /api/admin/users/:id

Rubric:
GET    /api/rubric/categories
GET    /api/rubric/items

Reporting:
GET    /api/admin/reports (aggregated scores by period/faculty)
GET    /api/admin/export/:format (csv, pdf)
```

---

## Database Relationships

```
departments
    ↓
    ├── courses (course_id)
    └── profiles (department_id)

courses
    ↓
    └── sections

sections
    ↓
    ├── profiles (faculty_id)
    ├── evaluator_assignments (section_id)
    └── student_sentiments (section_id)

profiles (users)
    ├── Evaluator in: evaluator_assignments
    ├── Faculty in: evaluator_assignments, sections
    ├── Student in: student_sentiments
    └── Can have multiple roles

evaluation_periods
    ├── evaluator_assignments (period_id)
    └── student_sentiments (period_id)

rubric_categories
    ↓
    └── rubric_items (category_id)

evaluator_assignments
    ├── evaluations (assignment_id)
    ├── evaluation_periods (period_id)
    ├── sections (section_id) - optional
    └── profiles (faculty_id, evaluator_id)

evaluations
    ├── evaluation_responses (evaluation_id)
    └── evaluator_assignments (assignment_id)

evaluation_responses
    ├── evaluations (evaluation_id)
    └── rubric_items (rubric_item_id)
```

---

## Row-Level Security (RLS) Policies

All tables have RLS enabled. Key policies:

```
Reference Data (departments, courses, rubric_categories, rubric_items):
├─ SELECT: Any authenticated user (read-only)
└─ INSERT/UPDATE/DELETE: Admin only

Profiles:
├─ SELECT: User's own profile OR Admin
└─ UPDATE: User's own profile OR Admin

Evaluator Assignments:
├─ SELECT: Own assignment as evaluator OR Admin
└─ INSERT/UPDATE: Admin only

Evaluations:
├─ SELECT: If evaluator_id matches OR Admin
├─ INSERT: If evaluator_id matches OR Admin
└─ UPDATE: Owner or Admin (can edit until period closes)

Student Sentiments:
├─ INSERT: Any authenticated user
├─ SELECT: Admin OR faculty if about them OR student if they submitted it
└─ UPDATE: Own sentiment only
```

---

## State Management & Data Flow

### Client-Side
- **Auth State**: Supabase Auth Context (via auth-helpers)
- **User Role**: Extracted from JWT claims
- **Data Fetching**: Direct from API or Supabase client
- **Form State**: React component state + optional submission handling

### Server-Side
- **Session Management**: JWT validated on each request
- **RLS Enforcement**: Supabase enforces policies
- **Data Validation**: Component/API level
- **Caching**: (Can be added with next/cache or Redis)

---

## Key Workflows

### Evaluation Cycle (Complete Example)

```
Week 1 (Admin Setup):
├─ Create evaluation period "Fall 2025 Eval"
├─ Configure rubric if new (or reuse existing)
├─ Create/import faculty and evaluator profiles
└─ Create evaluator assignments (peer, supervisor, self)

Week 2-4 (Evaluator Period):
├─ Evaluators login and see their assignments
├─ Complete evaluations for assigned faculty
├─ Submit scores & comments
└─ Admins monitor completion

Week 5 (Close Period):
├─ Admin closes period (status = 'closed')
├─ Evaluations become read-only
└─ Faculty view their aggregated feedback

Week 6 (Reporting):
├─ Admin generates reports
├─ Faculty download personal results
└─ Student sentiment added as context
```

### Student Feedback Collection

```
Year-round Process:
├─ Students access /student anytime
├─ Select faculty and sentiment
├─ Add optional comments
├─ Stored in student_sentiments table
├─ Faculty sees aggregated sentiments on dashboard
└─ Can be filtered by period/section
```

---

## Security & Permissions Matrix

| Feature | Admin | Faculty | Evaluator | Student |
|---------|:-----:|:-------:|:---------:|:-------:|
| Create users | ✓ | ✗ | ✗ | ✗ |
| Manage periods | ✓ | ✗ | ✗ | ✗ |
| Create assignments | ✓ | ✗ | ✗ | ✗ |
| View own profile | ✓ | ✓ | ✓ | ✓ |
| View all profiles | ✓ | ✗ | ✗ | ✗ |
| Complete evaluation | ✓ | ✓* | ✓ | ✗ |
| View evals about self | ✓ | ✓ | ✗ | ✗ |
| Submit sentiment | ✓ | ✓ | ✓ | ✓ |
| View sentiment (own) | ✓ | ✓ | ✓ | ✓ |
| View sentiment (all) | ✓ | ✗ | ✗ | ✗ |
| Export reports | ✓ | ✓** | ✗ | ✗ |

*Faculty can only complete self-evaluations if assigned
**Faculty can export their own report only

---

## Error Handling & Edge Cases

### Scenarios to Handle

```
1. User tries to access evaluation not assigned to them
   → RLS denies access → 403 Forbidden

2. Evaluator submits scores outside evaluation period
   → Check period.status = 'open' → 403 Period Closed

3. Multiple evaluators assigned to same faculty
   → Each has separate evaluation_responses
   → Aggregate scores on display

4. Faculty deleted while assigned to section
   → ON DELETE CASCADE removes sections
   → Assignments and evaluations cleaned up

5. Rubric changed mid-period
   → New rubric_version in period record
   → Can track which rubric was used for each evaluation

6. Student submits sentiment with no auth
   → Either allow anonymous + record optional student_id
   → Or require email/student ID
```

---

## Performance Optimization

### Indexes (in schema.sql)
```sql
idx_sections_course → sections(course_id)
idx_assignments_faculty → evaluator_assignments(faculty_id)
idx_assignments_evaluator → evaluator_assignments(evaluator_id)
idx_eval_responses_eval → evaluation_responses(evaluation_id)
idx_student_sentiment_faculty → student_sentiments(faculty_id)
```

### Query Optimization
- Filter by `evaluator_id = auth.uid()` to use RLS policies efficiently
- Use JOIN to aggregate evaluation_responses per rubric_category
- Cache read-only reference data (rubric, periods)
- Paginate long lists (users, evaluations)

---

## Next Steps & Roadmap

### Phase 1 (Current)
- [x] Database schema with RLS
- [x] Auth setup with role management
- [x] Home page & navigation
- [x] Admin user creation
- [ ] Rubric management UI
- [ ] Evaluation period management UI
- [ ] Evaluator assignment management UI

### Phase 2
- [ ] Evaluation form component
- [ ] Evaluation response submission & storage
- [ ] Admin evaluation records view
- [ ] Faculty self-evaluation
- [ ] Student sentiment form (needs details)

### Phase 3
- [ ] Dashboard with analytics
- [ ] Aggregated score reports
- [ ] CSV/PDF export
- [ ] Trend analysis over multiple periods
- [ ] Email notifications for evaluators

### Phase 4
- [ ] Advanced rubric features (weights, custom scales)
- [ ] Multi-language support
- [ ] Mobile-optimized forms
- [ ] Integrations (calendar sync, email templates)

---

## Environment Configuration

### Required `.env.local` Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### Optional/.env Variables (backend)
```
SUPABASE_SERVICE_KEY=[service-key-for-admin-ops]
```

---

## Deployment Checklist

- [ ] Policies reviewed and approved for production
- [ ] Database migrations tested
- [ ] Auth configuration (social login, email verification)
- [ ] Environmental secrets stored securely
- [ ] Error logging/monitoring setup
- [ ] Backup strategy defined
- [ ] Performance testing under load
- [ ] User documentation prepared

---

## Support & Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden on API calls | RLS policy denies access | Check user role and data ownership |
| User can't see assignments | No evaluator_assignments record | Admin must create assignment |
| Evaluation scores not saving | Late submission after period closes | Reopen period or check period.status |
| Auth redirect loops | Session/token expired | Clear cookies, re-login |

For detailed troubleshooting, check Supabase logs and browser console errors.

---

**Last Updated**: February 2026  
**System Version**: 0.1.0  
**Framework**: Next.js 14 + Supabase
