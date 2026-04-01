# Faculty Evaluation System - Visual Diagrams

## System Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js 14)"]
        LP["Login Page"]
        AP["Admin Pages"]
        FP["Faculty Pages"]
        SP["Student Pages"]
        CN["Components & Navigation"]
    end

    subgraph Auth["Authentication (Supabase Auth)"]
        JWT["JWT with Role Claims"]
        Session["Secure Session"]
    end

    subgraph API["Backend API (Next.js Routes)"]
        CU["POST /api/admin/create-user"]
        EU["PUT /api/evaluations"]
        QU["GET /api/evaluations"]
    end

    subgraph DB["Database (PostgreSQL)"]
        Users["users & profiles"]
        Courses["courses & sections"]
        Periods["evaluation_periods"]
        Rubric["rubric_categories & items"]
        Assign["evaluator_assignments"]
        Evals["evaluations & responses"]
        Sentiment["student_sentiments"]
    end

    LP -->|Auth| Auth
    AP -->|Auth| Auth
    FP -->|Auth| Auth
    SP -->|Auth| Auth
    CN -->|Routes| Frontend
    
    Frontend -->|API Calls| API
    Auth -->|JWT| API
    
    API -->|RLS Check| DB
    API -->|Query/Insert| DB

    style Frontend fill:#e1f5ff
    style Auth fill:#fff3e0
    style API fill:#f3e5f5
    style DB fill:#e8f5e9
```

## User Flow Diagram - Complete Cycle

```mermaid
graph TD
    Start["🔵 System Start"] --> Admin["👤 ADMIN<br/>Setup & Management"]
    
    Admin --> P1["1️⃣ Create Evaluation Period<br/>Set dates, rubric version"]
    Admin --> P2["2️⃣ Create/Import Users<br/>Set roles"]
    Admin --> P3["3️⃣ Configure Rubric<br/>Categories &amp; Items"]
    Admin --> P4["4️⃣ Create Assignments<br/>Who evaluates whom"]
    
    P1 --> P4
    P2 --> P4
    P3 --> P4
    
    P4 --> Eval["👥 EVALUATORS<br/>Complete Assessments"]
    
    Eval --> E1["View Assignments<br/>for evaluation period"]
    E1 --> E2["Open Evaluation Form<br/>See assigned faculty"]
    E2 --> E3["Score Rubric Items<br/>1-5 scale + comments"]
    E3 --> E4["Submit Evaluation<br/>Stored in DB"]
    
    E4 --> Student["👥 STUDENTS<br/>Submit Sentiment"]
    
    Student --> S1["Access /student"]
    S1 --> S2["Select faculty member"]
    S2 --> S3["Submit sentiment<br/>Positive/Neutral/Negative"]
    S3 --> S4["Add optional comments"]
    S4 --> S5["Stored in DB"]
    
    E4 --> Faculty["👤 FACULTY<br/>View Results"]
    S5 --> Faculty
    
    Faculty --> F1["Login to /faculty"]
    F1 --> F2["View peer feedback<br/>Aggregated scores"]
    F2 --> F3["Review student sentiment<br/>Qualitative feedback"]
    F3 --> F4["Download report<br/>PDF/CSV"]
    
    F4 --> Report["📊 Admin Reporting<br/>Analytics &amp; Export"]
    
    Report --> R1["View completion rates"]
    Report --> R2["Aggregate scores by category"]
    Report --> R3["Export for external analysis"]
    
    R1 --> End["✅ Cycle Complete"]
    R2 --> End
    R3 --> End

    style Start fill:#90caf9
    style Admin fill:#ffb74d
    style Eval fill:#81c784
    style Student fill:#81c784
    style Faculty fill:#64b5f6
    style Report fill:#ba68c8
    style End fill:#90caf9
```

## Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Login as Login Form
    participant Auth as Supabase Auth
    participant JWT as JWT Token
    participant API as Next.js API
    participant RLS as RLS Policies
    participant DB as PostgreSQL

    User->>Login: Enter credentials
    Login->>Auth: POST /auth/sign-in
    Auth->>JWT: Generate JWT with role
    JWT->>Login: Return token + session
    
    Login->>User: Redirect to dashboard
    
    User->>API: Make API request + JWT
    API->>JWT: Validate signature
    JWT->>API: Extract claims &amp; role
    
    API->>DB: Query (with auth context)
    DB->>RLS: Check policies
    RLS->>RLS: Evaluate role &amp; ownership
    
    alt Policy Allows
        RLS->>DB: ✓ Execute query
        DB->>API: Return data
        API->>User: 200 OK + data
    else Policy Denies
        RLS->>DB: ✗ Deny access
        DB->>API: No rows returned
        API->>User: 403 Forbidden
    end
```

## Evaluation Submission Flow

```mermaid
graph LR
    E["Evaluator"] -->|Login| Dashboard["Dashboard:<br/>My Assignments"]
    
    Dashboard -->|Select| Form["Evaluation Form<br/>(rubric_items)"]
    
    Form -->|Score each item| Items["Rubric Items<br/>Category 1: Commitment<br/>Category 2: Knowledge<br/>Category 3: Independent Learning<br/>Category 4: Learning Mgmt"]
    
    Items -->|Complete all| Submit["🔘 Submit<br/>evaluation"]
    
    Submit -->|POST| API["API Route<br/>/api/evaluations"]
    
    API -->|Create| EvalRecord["evaluations<br/>assignment_id, status"]
    API -->|Bulk Insert| Responses["evaluation_responses<br/>rubric_item_id, score, comment"]
    
    EvalRecord -->|Link to| Assignment["evaluator_assignments<br/>(already exists)"]
    
    Responses -->|Reference| Items
    
    Assignment -->|Admin can query| AdminDash["Admin Dashboard<br/>View Scores<br/>Aggregate by Category<br/>Identify Trends"]
    
    style Form fill:#fff9c4
    style Items fill:#fff9c4
    style Submit fill:#ffb74d
    style API fill:#b39ddb
    style EvalRecord fill:#c8e6c9
    style Responses fill:#c8e6c9
    style AdminDash fill:#ffccbc
```

## Database Relationships - Entity Diagram

```mermaid
erDiagram
    DEPARTMENTS ||--o{ COURSES : contains
    DEPARTMENTS ||--o{ PROFILES : in
    COURSES ||--o{ SECTIONS : has
    SECTIONS ||--o{ EVALUATOR_ASSIGNMENTS : "assigned to"
    SECTIONS ||--o{ STUDENT_SENTIMENTS : "sentiment about"
    
    PROFILES ||--o{ SECTIONS : teaches
    PROFILES ||--o{ EVALUATOR_ASSIGNMENTS : "evaluator_id"
    PROFILES ||--o{ EVALUATOR_ASSIGNMENTS : "faculty_id"
    PROFILES ||--o{ STUDENT_SENTIMENTS : student
    PROFILES ||--o{ STUDENT_SENTIMENTS : faculty
    
    EVALUATION_PERIODS ||--o{ EVALUATOR_ASSIGNMENTS : "scope of"
    EVALUATION_PERIODS ||--o{ STUDENT_SENTIMENTS : "period of"
    
    RUBRIC_CATEGORIES ||--o{ RUBRIC_ITEMS : contains
    
    EVALUATOR_ASSIGNMENTS ||--o{ EVALUATIONS : "basis for"
    EVALUATIONS ||--o{ EVALUATION_RESPONSES : contains
    EVALUATION_RESPONSES ||--o{ RUBRIC_ITEMS : scores
    
    DEPARTMENTS {
        uuid id PK
        string name
        timestamp created_at
    }
    
    PROFILES {
        uuid id PK
        string full_name
        string email
        app_role role
        uuid department_id FK
        timestamp created_at
    }
    
    COURSES {
        uuid id PK
        string code
        string title
        uuid department_id FK
        timestamp created_at
    }
    
    SECTIONS {
        uuid id PK
        uuid course_id FK
        uuid faculty_id FK
        string term
        string academic_year
        timestamp created_at
    }
    
    EVALUATION_PERIODS {
        uuid id PK
        string name
        date start_date
        date end_date
        period_status status
        timestamp created_at
    }
    
    RUBRIC_CATEGORIES {
        uuid id PK
        string label
        string description
        int order_index
        timestamp created_at
    }
    
    RUBRIC_ITEMS {
        uuid id PK
        uuid category_id FK
        string prompt
        int max_score
        int order_index
        timestamp created_at
    }
    
    EVALUATOR_ASSIGNMENTS {
        uuid id PK
        uuid period_id FK
        uuid section_id FK
        uuid faculty_id FK
        uuid evaluator_id FK
        evaluation_role role
        timestamp created_at
    }
    
    EVALUATIONS {
        uuid id PK
        uuid assignment_id FK
        evaluation_status status
        timestamp submitted_at
        text overall_comment
    }
    
    EVALUATION_RESPONSES {
        uuid id PK
        uuid evaluation_id FK
        uuid rubric_item_id FK
        int score
        text comment
        timestamp created_at
    }
    
    STUDENT_SENTIMENTS {
        uuid id PK
        uuid period_id FK
        uuid section_id FK
        uuid faculty_id FK
        uuid student_id FK
        sentiment_scale sentiment
        text comments
        timestamp created_at
    }
```

## Admin Dashboard Workflow

```mermaid
graph TB
    Admin["👤 Admin User"]
    
    Admin -->|Access| Dashboard["/admin Dashboard"]
    
    Dashboard -->|Manage| Users["👥 Users<br/>components/admin/users-table.tsx<br/>components/admin/add-user-form.tsx"]
    Dashboard -->|Configure| Periods["⏱️ Periods<br/>components/admin/period-manager.tsx"]
    Dashboard -->|Design| Rubrics["📋 Rubrics<br/>components/admin/rubric-manager.tsx"]
    Dashboard -->|Setup| Sections["📚 Sections<br/>components/admin/add-section-form.tsx"]
    Dashboard -->|Assign| Evals["🎯 Evaluator<br/>Assignments"]
    Dashboard -->|Monitor| Monitor["📊 Monitoring<br/>components/admin/section-scores-card.tsx"]
    
    Users -->|Create/Edit| UserDB["profiles table<br/>role assignment"]
    Periods -->|Create/Edit| PeriodDB["evaluation_periods table<br/>rubric_version, status"]
    Rubrics -->|Create/Edit| RubricDB["rubric_categories<br/>rubric_items tables"]
    Sections -->|Create/Edit| SectionDB["sections table<br/>course_id, faculty_id"]
    
    Evals -->|Link| AssignDB["evaluator_assignments<br/>period_id, faculty_id,<br/>evaluator_id, role"]
    
    Monitor -->|Query| EvalDB["evaluations &<br/>evaluation_responses tables"]
    EvalDB -->|Aggregate| Report["Scores by category<br/>Completion rates<br/>Trends"]
    
    Report -->|Export| Export["📁 CSV/PDF<br/>Reports"]
    
    style Admin fill:#64b5f6
    style Dashboard fill:#fff9c4
    style Users fill:#b39ddb
    style Periods fill:#b39ddb
    style Rubrics fill:#b39ddb
    style Sections fill:#b39ddb
    style Evals fill:#b39ddb
    style Monitor fill:#ffb74d
    style Export fill:#81c784
```

## Email & Permission Matrix

```mermaid
graph LR
    subgraph Users ["User Types"]
        A["Admin"]
        F["Faculty"]
        Ev["Evaluator"]
        S["Student"]
    end
    
    subgraph Perms ["Permissions"]
        P1["Create Users"]
        P2["Manage Periods"]
        P3["Create Rubrics"]
        P4["Create Assignments"]
        P5["Complete Evaluation"]
        P6["Self-Evaluate"]
        P7["View Own Feedback"]
        P8["Submit Sentiment"]
        P9["View All Reports"]
    end
    
    subgraph Tables ["Table Access"]
        T1["profiles"]
        T2["evaluation_periods"]
        T3["rubric_*"]
        T4["evaluator_assignments"]
        T5["evaluations"]
        T6["evaluation_responses"]
        T7["student_sentiments"]
    end
    
    A -->|All Perms| Perms
    F -->|P5,P6,P7,P8,P9*| Perms
    Ev -->|P5,P8| Perms
    S -->|P8| Perms
    
    P1 -->|INSERT| T1
    P2 -->|INSERT/UPDATE| T2
    P3 -->|INSERT/UPDATE| T3
    P4 -->|INSERT| T4
    P5 -->|INSERT| T5
    P5 -->|INSERT| T6
    P8 -->|INSERT| T7
    
    style A fill:#ffb74d
    style F fill:#81c784
    style Ev fill:#64b5f6
    style S fill:#90caf9
    style P1 fill:#ffccbc
    style P2 fill:#ffccbc
    style P3 fill:#ffccbc
    style P4 fill:#ffccbc
    style P5 fill:#c8e6c9
    style P8 fill:#c8e6c9
    style P9 fill:#ffccbc
```

## Data Aggregation for Reporting

```mermaid
graph TB
    EvalResp["evaluation_responses<br/>(all submitted scores)"]
    
    EvalResp -->|GROUP BY rubric_item_id| ByItem["Scores per<br/>Rubric Item"]
    
    ByItem -->|JOIN rubric_items<br/>THEN GROUP BY category_id| ByCategory["Scores per<br/>Category"]
    
    ByCategory -->|AGGREGATE by faculty_id<br/>period_id| Summary["Faculty Summary<br/>per Period"]
    
    ByItem -->|AGGREGATE by period_id| Trend["Trend Analysis<br/>Across Periods"]
    
    Summary -->|Calculate| Stats["Mean, Median, StdDev<br/>per Category"]
    Trend -->|Calculate| TrendStats["Change Over Time<br/>per Faculty"]
    
    Stats -->|Export| CSV["CSV Report"]
    Stats -->|Format| PDF["PDF Report"]
    TrendStats -->|Chart| Chart["📈 Trend Charts"]
    
    CSV -->|Admin| Admin["Download &amp;<br/>Share"]
    PDF -->|Faculty| Faculty["Personal<br/>Reports"]
    Chart -->|Admin| AdminDash["Dashboard<br/>Insights"]

    style EvalResp fill:#c8e6c9
    style ByItem fill:#b3e5fc
    style ByCategory fill:#b3e5fc
    style Summary fill:#fff9c4
    style Trend fill:#fff9c4
    style Stats fill:#ffe0b2
    style TrendStats fill:#ffe0b2
    style CSV fill:#ffccbc
    style PDF fill:#ffccbc
    style Chart fill:#f0f4c3
    style Admin fill:#81c784
    style Faculty fill:#81c784
    style AdminDash fill:#81c784
```

## Request Lifecycle with RLS

```mermaid
sequenceDiagram
    participant Client
    participant Server as Next.js Server
    participant Auth as Supabase Auth
    participant DB as PostgreSQL + RLS

    Client->>Server: GET /api/evaluations<br/>(with JWT)
    
    Server->>Auth: Validate JWT signature
    Auth->>Server: ✓ Valid<br/>Extract user_id &amp; role
    
    Server->>DB: SELECT * FROM evaluations<br/>WHERE evaluator_id = $1<br/>(user_id in context)
    
    Note over DB: RLS Policy Check:<br/>select_evaluations
    
    DB->>DB: Check policy condition:<br/>auth.uid() = evaluator_id<br/>OR app_is_admin()
    
    alt User is Evaluator
        DB->>DB: ✓ Policy passes<br/>Execute query
        DB->>Server: Return user's evaluations
    else User is not Evaluator
        DB->>DB: ✗ Policy fails<br/>Return 0 rows
        DB->>Server: Empty result set
    end
    
    alt Has admin role
        DB->>DB: app_is_admin() = true<br/>Return all evaluations
        DB->>Server: Return all evaluations
    end
    
    Server->>Client: 200 OK + filtered data
```

## Component Tree with Rendering

```mermaid
graph TD
    App["<b>App Layout</b><br/>src/app/layout.tsx<br/>Auth Provider Setup"]
    
    App -->|Route| LP["<b>/auth/login</b><br/>Login Form"]
    App -->|Route| HP["<b>/</b> Home Page"]
    App -->|Route| FP["<b>/faculty</b><br/>Faculty Dashboard"]
    App -->|Route| SP["<b>/student</b><br/>Student Form"]
    App -->|Route| AP["<b>/admin</b><br/>Admin Layout"]
    
    LP -->|Component| LoginForm["login-form.tsx<br/>email + password inputs<br/>Supabase.signIn()"]
    
    AP -->|Component| AdminLayout["admin layout wrapper"]
    AdminLayout -->|Sidebar| SidebarNav["sidebar-nav.tsx<br/>Navigation links"]
    AdminLayout -->|Content| U["Users Page"]
    AdminLayout -->|Content| R["Records Page"]
    AdminLayout -->|Content| D["Dashboard"]
    
    U -->|Component| UserTable["users-table.tsx<br/>Display all users"]
    U -->|Component| AddUserForm["add-user-form.tsx<br/>Create user form"]
    
    R -->|Component| ScoresCard["section-scores-card.tsx<br/>Evaluation results"]
    
    D -->|Component| PeriodMgr["period-manager.tsx<br/>Create/edit periods"]
    D -->|Component| RubricMgr["rubric-manager.tsx<br/>Manage rubric items"]
    D -->|Component| SectionForm["add-section-form.tsx<br/>Create sections"]
    
    FP -->|Component| FacultyDash["Faculty Dashboard<br/>My assigned evals<br/>My scores"]
    
    SP -->|Component| StudentForm["student-form.tsx<br/>Sentiment submission<br/>Comments"]
    
    style App fill:#90caf9
    style LP fill:#fff9c4
    style HP fill:#fff9c4
    style FP fill:#c8e6c9
    style SP fill:#c8e6c9
    style AP fill:#ffb74d
    style LoginForm fill:#b3e5fc
    style SidebarNav fill:#b3e5fc
    style UserTable fill:#f0f4c3
    style AddUserForm fill:#f0f4c3
    style ScoresCard fill:#f0f4c3
    style PeriodMgr fill:#f0f4c3
    style RubricMgr fill:#f0f4c3
    style SectionForm fill:#f0f4c3
    style FacultyDash fill:#c8e6c9
    style StudentForm fill:#c8e6c9
```

## Integration Points

```mermaid
graph TB
    subgraph External["External Systems"]
        Email["📧 Email Service<br/>(Future)"]
        Calendar["📅 Calendar<br/>(Future)"]
        Export["📁 Export Tools<br/>(PDF, CSV)"]
    end
    
    subgraph Core["Faculty Evaluation Core"]
        Auth["🔐 Supabase Auth"]
        API["🔌 Next.js API Routes"]
        DB["🗄️ PostgreSQL"]
        UI["🎨 React Components"]
    end
    
    subgraph Analytics["Analytics & Reporting"]
        Dashboard["📊 Admin Dashboard"]
        Reports["📋 Reports Generator"]
        Trends["📈 Trend Analysis"]
    end
    
    Email -->|Notify Evaluators| Auth
    Calendar -->|Sync Deadlines| API
    Export -->|Generate from DB| Reports
    Reports -->|Feed to| Dashboard
    Trends -->|Display in| Analytics
    
    Auth -->|Secure Access| API
    API -->|Query &amp; Mutate| DB
    API -->|Power| UI
    UI -->|Send Input| API
    
    DB -->|Source Data| Analytics
    
    Dashboard -->|View Trends| Trends
    Reports -->|Include Charts| Trends
    
    style External fill:#e0e0e0
    style Core fill:#fff3e0
    style Analytics fill:#f3e5f5
    style Auth fill:#ffb74d
    style API fill:#81c784
    style DB fill:#64b5f6
```

---

## Usage Instructions for Diagrams

These diagrams can be:
1. **Embedded in documentation** - Include as markdown code blocks
2. **Rendered online** - Use [mermaid.live](https://mermaid.live/)
3. **Integrated in VS Code** - Install "Markdown Preview Mermaid Support" extension
4. **Exported** - Click "Download" in mermaid.live to get PNG/SVG

---

**Generated**: February 2026  
**System**: Faculty Evaluation 0.1.0
