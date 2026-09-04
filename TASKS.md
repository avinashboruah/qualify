# Scholarship Eligibility Portal — Implementation Task Breakdown

This document provides an exhaustive, phase-by-phase task breakdown for building the **Scholarship Eligibility Portal**. 

To maintain clean separation of concerns, tasks are strictly organized into two distinct sections:
1. **[Backend Tasks (Hono + Cloudflare Worker + Cloudflare D1)](#part-1-backend-tasks)**
2. **[Frontend Tasks (Next.js + TypeScript + Tailwind CSS)](#part-2-frontend-tasks)**

---

## Technical Stack Summary

* **Backend:** Hono framework running on Cloudflare Workers
* **Database:** Cloudflare D1 (SQLite dialect) managed with Drizzle ORM (or direct SQL migrations)
* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI / Radix primitives
* **Authentication:** Stateless JWT / HTTP-only secure cookie sessions with role claims (`student`, `admin`)
* **Deployment:** Cloudflare Workers (Backend API) & Vercel (Next.js Frontend)

---

# Part 1: Backend Tasks

> **Stack:** Hono, Cloudflare Workers, Cloudflare D1, Drizzle ORM / SQL, TypeScript, Zod

```
Backend Architecture:
[Cloudflare Worker]
   ├── src/index.ts (Hono App router & global middleware: CORS, Error Handler)
   ├── src/db/ (Schema definitions, migrations, D1 client connection)
   ├── src/middleware/ (Auth JWT verifier, role guards, input validation)
   ├── src/modules/
   │    ├── auth/ (Register, login, session handlers)
   │    ├── profile/ (Student profile CRUD)
   │    ├── scholarships/ (Scholarship CRUD, filters, CSV generation)
   │    ├── rules-engine/ (Deterministic rule parser & evaluation logic)
   │    └── checklist/ (Student document status tracking)
   └── src/seeds/ (12+ preloaded mock scholarships & sample users)
```

---

### Phase B1: Project Scaffolding & Worker Configuration

- [x] **Task B1.1: Initialize Cloudflare Worker & Hono Project**
  - Initialize a new worker project using `npm create cloudflare@latest` (or `wrangler init`).
  - Configure `wrangler.toml` with worker name, compatibility flags, and node compatibility settings.
  - Install dependencies: `hono`, `zod`, `@hono/zod-validator`, `jose` / `hono/jwt`.
  - Set up TypeScript configuration (`tsconfig.json`) with strict type checking.

- [x] **Task B1.2: Cloudflare D1 Database Binding**
  - Create local and preview Cloudflare D1 databases using Wrangler (`wrangler d1 create scholarship-db`).
  - Bind the D1 database in `wrangler.toml` under `[[d1_databases]]` with binding name `DB`.
  - Define TypeScript environmental bindings type (`Env = { DB: D1Database; JWT_SECRET: string; FRONTEND_URL: string }`).

- [x] **Task B1.3: Middleware Pipeline Setup**
  - Implement CORS middleware with explicit allowed origins (`FRONTEND_URL`), allowed headers, and credentials support.
  - Set up global error handling middleware returning standardized JSON responses: `{ success: false, error: { code: string, message: string } }`.
  - Set up structured logging middleware and health-check endpoint (`GET /api/health`).

---

### Phase B2: Database Schema Design & Migrations

- [x] **Task B2.1: Users and Authentication Schema**
  - Create `users` table:
    - `id` (TEXT, Primary Key, UUID/ULID)
    - `email` (TEXT, Unique, Indexed)
    - `password_hash` (TEXT)
    - `role` (TEXT, check constraint: `'student'` | `'admin'`)
    - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    - `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

- [x] **Task B2.2: Student Profiles Schema**
  - Create `student_profiles` table:
    - `user_id` (TEXT, Primary Key, Foreign Key -> `users.id` ON DELETE CASCADE)
    - `full_name` (TEXT)
    - `age` (INTEGER)
    - `gender` (TEXT: `'male'` | `'female'` | `'other'` | `'prefer_not_to_say'`)
    - `family_income` (INTEGER, annual income in INR)
    - `education_level` (TEXT: `'undergraduate'` | `'postgraduate'` | `'diploma'` | `'school'`)
    - `current_course` (TEXT, e.g. `'B.Tech'`, `'B.Sc'`, `'M.Sc'`)
    - `field_of_study` (TEXT, e.g. `'Engineering'`, `'Medical'`, `'Humanities'`, `'Commerce'`)
    - `cgpa` (REAL, scaled out of 10.0 or percentage scaled appropriately)
    - `domicile_state` (TEXT, e.g. `'Assam'`, `'Maharashtra'`, `'All India'`)
    - `area_type` (TEXT: `'rural'` | `'urban'`)
    - `category` (TEXT: `'General'` | `'OBC'` | `'SC'` | `'ST'` | `'EWS'`)
    - `is_pwd` (INTEGER, boolean flag 0 or 1)
    - `previous_institution` (TEXT, optional)
    - `previous_marks_percentage` (REAL, optional)
    - `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

- [x] **Task B2.3: Scholarships Schema**
  - Create `scholarships` table:
    - `id` (TEXT, Primary Key, UUID)
    - `name` (TEXT, Not Null)
    - `provider` (TEXT, Organization/Institution name, Not Null)
    - `description` (TEXT, Rich summary/details)
    - `amount_description` (TEXT, e.g. `'₹50,000 per annum'`, `'Full Tuition Fee'`)
    - `amount_value` (INTEGER, numeric value for sorting/filtering where applicable)
    - `deadline` (TEXT / DATE ISO string)
    - `official_notice_url` (TEXT, valid link to the primary notice/circular)
    - `created_by` (TEXT, Foreign Key -> `users.id`)
    - `is_published` (INTEGER DEFAULT 1)
    - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    - `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

- [x] **Task B2.4: Eligibility Rules Schema**
  - Create `eligibility_rules` table:
    - `id` (TEXT, Primary Key, UUID)
    - `scholarship_id` (TEXT, Foreign Key -> `scholarships.id` ON DELETE CASCADE)
    - `field_name` (TEXT, e.g. `'family_income'`, `'cgpa'`, `'domicile_state'`, `'category'`, `'field_of_study'`, `'is_pwd'`, `'area_type'`)
    - `operator` (TEXT, check constraint: `'EQ'`, `'NEQ'`, `'LTE'`, `'GTE'`, `'LT'`, `'GT'`, `'IN'`, `'CONTAINS'`)
    - `expected_value` (TEXT, string-serialized value or JSON array)
    - `is_mandatory` (INTEGER DEFAULT 1, boolean flag)
    - `rule_description` (TEXT, human-readable rule text, e.g. `"Family Annual Income <= ₹5,00,000"`)
    - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

- [x] **Task B2.5: Required Documents & Checklist Schema**
  - Create `scholarship_documents` table (documents required per scholarship):
    - `id` (TEXT, Primary Key, UUID)
    - `scholarship_id` (TEXT, Foreign Key -> `scholarships.id` ON DELETE CASCADE)
    - `document_name` (TEXT, e.g. `'Income Certificate'`, `'Domicile Certificate'`)
    - `is_mandatory` (INTEGER DEFAULT 1)
    - `instructions` (TEXT, optional guidance)
  - Create `student_document_checklist` table (student's saved preparation progress):
    - `id` (TEXT, Primary Key, UUID)
    - `user_id` (TEXT, Foreign Key -> `users.id` ON DELETE CASCADE)
    - `scholarship_document_id` (TEXT, Foreign Key -> `scholarship_documents.id` ON DELETE CASCADE)
    - `is_completed` (INTEGER DEFAULT 0)
    - `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    - UNIQUE constraint on `(user_id, scholarship_document_id)`

- [x] **Task B2.6: D1 Migration Script Setup**
  - Write SQL migration files in `migrations/` directory (`0001_initial_schema.sql`).
  - Verify local migration execution via `wrangler d1 execute DB --local --file=...`.

---

### Phase B3: Authentication & Role-Based Authorization

- [x] **Task B3.1: Password Hashing Utility**
  - Implement secure password hashing and verification using Web Crypto API (PBKDF2 or bcrypt compatible with Cloudflare Workers runtime).

- [x] **Task B3.2: JWT Token Generation & Verification Utilities**
  - Implement JWT token issuer with payload: `{ sub: userId, role: 'student' | 'admin', email: string }`.
  - Set expiration to a reasonable window (e.g., 7 days).
  - Implement verification helper utilizing `jose` or Hono's `jwt()` middleware.

- [x] **Task B3.3: Authentication Endpoints**
  - `POST /api/auth/register`:
    - Accept `{ email, password, role }`.
    - Validate with Zod: enforce email format, password complexity (minimum 8 characters), role restriction.
    - Check if email is already in use; return 409 Conflict if duplicate.
    - Create user in D1 and return JWT token + user summary.
  - `POST /api/auth/login`:
    - Accept `{ email, password }`.
    - Verify credentials, return JWT token and user profile status (whether profile is complete).
  - `GET /api/auth/me`:
    - Authenticated endpoint returning current user ID, role, and profile existence flag.

- [x] **Task B3.4: Role Guards Middleware**
  - `requireAuth`: Verifies Bearer token, attaches `user` context to Hono context `c.set('user', payload)`.
  - `requireAdmin`: Ensures `user.role === 'admin'`; returns 403 Forbidden otherwise.
  - `requireStudent`: Ensures `user.role === 'student'`; returns 403 Forbidden otherwise.

---

### Phase B4: Student Profile Management APIs

- [x] **Task B4.1: Profile Validation Schema (Zod)**
  - Define strict Zod schema for profile payload:
    - Numeric bounds: `age >= 14 && age <= 100`, `family_income >= 0`, `cgpa >= 0.0 && cgpa <= 10.0`.
    - Enums: `gender`, `education_level`, `area_type`, `category`.
    - Boolean: `is_pwd`.

- [x] **Task B4.2: Get Student Profile (`GET /api/profile/me`)**
  - Protected with `requireStudent`.
  - Query `student_profiles` by `user_id`.
  - Return `{ success: true, profile: { ... } }` or 404 with `{ hasProfile: false }`.

- [x] **Task B4.3: Create or Update Student Profile (`PUT /api/profile/me`)**
  - Protected with `requireStudent`.
  - Upsert profile record into `student_profiles`.
  - Return updated profile with status 200/201.

---

### Phase B5: Scholarship Management & Admin Endpoints

- [x] **Task B5.1: Create Scholarship Listing (`POST /api/admin/scholarships`)**
  - Protected with `requireAdmin`.
  - Payload validation:
    - Scholarship details: `name`, `provider`, `description`, `amount_description`, `amount_value`, `deadline`, `official_notice_url`.
    - Array of structured `rules`: `[{ field_name, operator, expected_value, is_mandatory, rule_description }]`.
    - Array of required `documents`: `[{ document_name, is_mandatory, instructions }]`.
  - Atomic D1 transaction inserting scholarship header, rules, and document entries.
  - Return created scholarship with generated IDs.

- [x] **Task B5.2: Update Scholarship (`PUT /api/admin/scholarships/:id`)**
  - Protected with `requireAdmin`.
  - Allow updating metadata, rules, and document lists.
  - Re-sync or update child rules and documents in transaction.

- [x] **Task B5.3: Delete/Unpublish Scholarship (`DELETE /api/admin/scholarships/:id`)**
  - Protected with `requireAdmin`.
  - Cascade delete or toggle `is_published = 0`.

- [x] **Task B5.4: Admin Dashboard Listing (`GET /api/admin/scholarships`)**
  - Protected with `requireAdmin`.
  - Return list of scholarships created with counts of rules, documents, and active status.

---

### Phase B6: Deterministic Rule Engine & Eligibility Checker

- [x] **Task B6.1: Rule Evaluation Operators Engine**
  - Create a pure, deterministic rule evaluation module:
    ```typescript
    type EvaluationStatus = 'PASS' | 'FAIL' | 'UNKNOWN';
    interface RuleResult {
      ruleId: string;
      field: string;
      description: string;
      expected: string;
      actual: string | number | boolean | null;
      status: EvaluationStatus;
      reason: string;
    }
    ```
  - Implement operator evaluators:
    - `EQ`: Equal comparison (handles numbers, strings case-insensitively).
    - `NEQ`: Not equal comparison.
    - `GTE`: Greater than or equal (numeric comparisons like CGPA, Age).
    - `LTE`: Less than or equal (numeric comparisons like Family Income, Age).
    - `GT` / `LT`: Strict comparisons.
    - `IN`: Comma-separated list or JSON array inclusion (e.g. course matches `"Engineering, Computer Science"`).
    - `CONTAINS`: Substring or array containment.

- [x] **Task B6.2: Missing Data & "UNKNOWN" Resolution Logic**
  - If a rule references a field that is `null`, `undefined`, or empty string in the student's profile (e.g., student did not specify `area_type` or special category):
    - Mark rule as `UNKNOWN`.
    - Reason: `"The scholarship requires [field], but this information is not available in your profile. Please verify with the official notice."`

- [x] **Task B6.3: Aggregate Decision Engine**
  - Combine rule evaluations to reach the final verdict:
    - **NOT ELIGIBLE**: If at least one `is_mandatory` rule has `FAIL` status.
    - **POSSIBLY ELIGIBLE**: If zero rules failed, but at least one mandatory rule has `UNKNOWN` status.
    - **ELIGIBLE**: If all evaluated mandatory rules have `PASS` status.
  - Generate clear, human-readable summary breakdown reasons for each rule.

- [x] **Task B6.4: Evaluation API Endpoint (`POST /api/scholarships/:id/check-eligibility`)**
  - Protected with `requireStudent`.
  - Fetch student profile from `student_profiles`.
  - Fetch scholarship and its associated `eligibility_rules`.
  - Run evaluation engine.
  - Return:
    ```json
    {
      "verdict": "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE",
      "summary": "You satisfy all evaluated mandatory criteria.",
      "evaluatedAt": "2026-09-04T10:00:00Z",
      "ruleDetails": [
        {
          "field": "family_income",
          "description": "Annual Family Income <= ₹5,00,000",
          "expected": "<= ₹5,00,000",
          "actual": "₹3,20,000",
          "status": "PASS",
          "reason": "Your annual income is within the limit."
        }
      ]
    }
    ```

---

### Phase B7: Scholarship Discovery, Filtering & CSV Export

- [x] **Task B7.1: Scholarship Directory Listing (`GET /api/scholarships`)**
  - Public / authenticated endpoint returning active scholarships.
  - Support query parameters:
    - `search` (keyword match on name, provider, description)
    - `field_of_study`
    - `education_level`
    - `max_income`
    - `gender`
    - `is_pwd`
    - `category`
    - `sort_by` (`deadline`, `amount`, `created_at`), `order` (`asc`, `desc`)
  - Construct dynamic parameterized SQL queries to prevent SQL injection.

- [x] **Task B7.2: Public Scholarship Details (`GET /api/scholarships/:id`)**
  - Return scholarship metadata, full list of eligibility rules (with readable text), list of required documents, and official notice link.
  - Compute `days_remaining` based on current server date vs `deadline`.

- [x] **Task B7.3: CSV Export Endpoint (`GET /api/scholarships/export/csv`)**
  - Generate RFC 4180 compliant CSV stream.
  - Include headers: `Scholarship Name`, `Provider`, `Amount / Benefits`, `Deadline`, `Days Remaining`, `Required Documents`, `Eligibility Criteria Summary`, `Official Notice URL`.
  - Set response headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="scholarships-directory.csv"`.

---

### Phase B8: Document Checklist Management

- [x] **Task B8.1: Get Checklist State (`GET /api/scholarships/:id/checklist`)**
  - Protected with `requireStudent`.
  - Fetch all documents for the scholarship joined with student's check status from `student_document_checklist`.
  - Return list of `{ id, document_name, is_mandatory, is_completed }`.

- [x] **Task B8.2: Toggle Checklist Item (`PATCH /api/scholarships/:id/checklist/:docId`)**
  - Protected with `requireStudent`.
  - Upsert completion state `is_completed: boolean` in `student_document_checklist`.
  - Return updated status.

---

### Phase B9: Database Seeding (12+ Preloaded Mock Scholarships)

- [x] **Task B9.1: Seed Data Construction**
  - Create a robust seed script (`src/seeds/scholarships.ts`) containing **12 realistic scholarships**:
    1. *Post-Matric Scholarship for SC/ST Students (Assam/North-East)*
    2. *Pragati Scholarship for Girl Students in Technical Education (AICTE)*
    3. *Central Sector Scheme of Scholarships for College and University Students*
    4. *National Means-cum-Merit Scholarship Scheme (NMMSS)*
    5. *ONGC Foundation Scholarship for Meritorious SC/ST/OBC Students*
    6. *Sitaram Jindal Foundation Scholarship Scheme*
    7. *HDFC Educational Crisis Scholarship Support (ECSS)*
    8. *Keep India Smiling Foundational Scholarship Programme*
    9. *Kotak Kanya Scholarship for Girl Students in Higher Education*
    10. *L'Oréal India For Young Women in Science Scholarship*
    11. *Prime Minister's Special Scholarship Scheme (PMSSS) for Engineering & Medicine*
    12. *North Eastern Council (NEC) Merit Scholarship for Professional Courses*
  - Ensure every scholarship contains:
    - Realistic provider names, descriptions, and verified deadlines.
    - At least 3–5 structured rules with varying types (Income, CGPA, Gender, Domicile, Course, Category).
    - Complete required document checklists (3–6 documents each).
    - Authentic government / foundation reference URL.

- [x] **Task B9.2: Default User Accounts Seed**
  - Seed 1 Admin account (`admin@scholarships.gov.in` / `Admin@12345`).
  - Seed 2 Demo Student accounts:
    - Student A with completed profile (`student1@test.com` / `Student@12345`).
    - Student B with blank/incomplete profile (`student2@test.com` / `Student@12345`).

- [x] **Task B9.3: Seed Runner CLI Command**
  - Add script to `package.json`: `npm run db:seed` executing SQL against D1 via wrangler.

---

### Phase B10: Backend Verification & Automated Tests

- [x] **Task B10.1: Unit Tests for Deterministic Rule Engine**
  - Write test suites for all operators (`EQ`, `LTE`, `GTE`, `IN`).
  - Test boundary scenarios:
    - Boundary CGPA (e.g. requirement >= 7.5, student CGPA 7.50 -> PASS, 7.49 -> FAIL).
    - Boundary Income (limit <= 500000, student 500000 -> PASS, 500001 -> FAIL).
    - Missing profile fields producing `UNKNOWN` status.
    - Aggregation logic: 1 FAIL = NOT ELIGIBLE, 0 FAIL + 1 UNKNOWN = POSSIBLY ELIGIBLE, all PASS = ELIGIBLE.

- [x] **Task B10.2: Integration Tests for Endpoints**
  - Test authentication flow (Registration -> Login -> Me).
  - Test profile creation and retrieval.
  - Test scholarship filtering and CSV export.
  - Test checklist item toggles.

---

# Part 2: Frontend Tasks

> **Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI / Radix primitives

```
Frontend Architecture:
[Next.js App Router]
   ├── src/app/
   │    ├── (auth)/
   │    │    ├── login/page.tsx
   │    │    └── register/page.tsx
   │    ├── (student)/
   │    │    ├── profile/page.tsx
   │    │    ├── scholarships/
   │    │    │    ├── page.tsx (Directory & Discovery)
   │    │    │    └── [id]/page.tsx (Details, Checklist & Eligibility)
   │    ├── (admin)/
   │    │    └── admin/
   │    │         ├── page.tsx (Dashboard & List)
   │    │         └── scholarships/new/page.tsx (Listing & Rule Builder)
   │    ├── layout.tsx
   │    └── page.tsx (Landing page & Role Switcher)
   ├── src/components/
   │    ├── ui/ (Button, Input, Select, Badge, Card, Dialog, Toast, Table)
   │    ├── common/ (Navbar, Footer, RoleIndicator, ConfirmDialog)
   │    ├── scholarships/ (ScholarshipCard, FilterSidebar, ExportButton)
   │    ├── eligibility/ (EligibilityCard, RuleStatusBadge, ReasonBreakdown)
   │    └── admin/ (RuleBuilderForm, DocumentListEditor)
   ├── src/lib/ (API client, token storage, formatters, constants)
   └── src/hooks/ (useAuth, useProfile, useScholarships, useChecklist)
```

---

### Phase F1: Project Scaffolding, Design System & Layout Foundation

- [ ] **Task F1.1: Next.js Project Initialization**
  - Initialize Next.js project with App Router, TypeScript, ESLint, and Tailwind CSS.
  - Install dependencies: `lucide-react`, `clsx`, `tailwind-merge`, `zod`, `react-hook-form`, `@hookform/resolvers`.
  - Set up path aliases (`@/*` mapping to `src/*`).

- [ ] **Task F1.2: Design Tokens, Typography & Color Palette**
  - Configure `tailwind.config.ts` with an accessible, academic-grade design palette:
    - Primary: Slate / Deep Indigo (trustworthy institutional look)
    - Success: Emerald Green (PASS / Eligible)
    - Danger: Rose / Crimson (FAIL / Not Eligible)
    - Warning/Notice: Amber / Gold (UNKNOWN / Possibly Eligible)
    - Neutral: Zinc / Slate
  - Add base typography, container utility classes, and glassmorphic card styles.

- [ ] **Task F1.3: Core UI Components Library**
  - Build reusable UI primitives:
    - `Button` (primary, secondary, outline, danger, loading spinner state)
    - `Input`, `Textarea`, and `Select` with inline validation error states
    - `Badge` (with color variants for status: Eligible, Not Eligible, Possibly Eligible, Days Remaining)
    - `Card`, `CardHeader`, `CardContent`, `CardFooter`
    - `Modal` / `Dialog` for confirmations
    - `Toast` notification system for asynchronous action feedback

- [ ] **Task F1.4: Global Navigation & Footer**
  - Create responsive `Navbar`:
    - Display brand logo & portal title.
    - Show role-aware navigation links (Student vs Admin).
    - Display current user identity badge and Logout button.
  - Create `Footer`:
    - Disclaimer regarding official scholarship source verification.
    - Quick links and copyright metadata.

---

### Phase F2: Authentication, Session Management & Route Protection

- [ ] **Task F2.1: API Client & Storage Layer**
  - Create centralized `src/lib/api-client.ts`:
    - Base URL configuration from `NEXT_PUBLIC_API_URL`.
    - Automatically inject Bearer token from localStorage/cookies.
    - Handle 401 Unauthorized globally (clear session & redirect to login).
    - Typed wrapper for `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

- [ ] **Task F2.2: Auth State Provider & Custom Hook (`useAuth`)**
  - Implement `AuthContext` and `useAuth()` hook:
    - Expose `user`, `token`, `role`, `isAuthenticated`, `isLoading`, `login()`, `logout()`.
    - Persist session and initialize auth state on initial mount.

- [ ] **Task F2.3: Login Page (`/login`)**
  - Clean card interface with email and password inputs.
  - Role switcher tab or indicator for quick testing (Demo Student vs Demo Admin quick-fill buttons).
  - Client-side validation with React Hook Form + Zod.
  - Seamless redirection: Students redirected to `/profile` (if incomplete) or `/scholarships`; Admins redirected to `/admin`.

- [ ] **Task F2.4: Registration Page (`/register`)**
  - Account creation form with email, password, password confirmation, and role selection (`Student` or `Institution / Admin`).
  - Validation: Password strength rules, matching password confirmation.
  - On successful registration, auto-login and navigate to profile onboarding.

- [ ] **Task F2.5: Client-Side Route Guards**
  - Implement route guard components/wrappers:
    - `StudentGuard`: Redirects unauthenticated users to `/login` and admins to `/admin`.
    - `AdminGuard`: Redirects unauthenticated users to `/login` and students to `/scholarships`.
    - `ProfileCheckGuard`: Ensures students with incomplete profiles are routed to `/profile` with a prompt banner.

---

### Phase F3: Student Profile Management & Onboarding

- [ ] **Task F3.1: Student Profile Page (`/profile`)**
  - Header with profile completion progress bar (e.g. 85% completed).
  - Notification banner: *"Your profile is used to automatically evaluate eligibility across all scholarships."*

- [ ] **Task F3.2: Multi-Section Profile Form**
  - Implement structured form sections:
    - **Personal Information:** Full Name, Age, Gender.
    - **Demographics & Category:** Domicile State (dropdown of Indian States & UTs), Area Type (Rural / Urban), Category (General, OBC, SC, ST, EWS), PwD status (Yes/No toggle).
    - **Financial Details:** Annual Family Income (INR numeric input with formatted currency hint, e.g., ₹2,50,000).
    - **Academic Information:** Education Level (UG/PG), Current Course, Field of Study (Engineering, Medical, Arts, etc.), Current CGPA (out of 10.0), Previous Institution Name, Previous Marks %.
  - Real-time client-side validation using Zod.

- [ ] **Task F3.3: Save & Update Profile Handlers**
  - Handle form submission with loading indicators and toast feedback.
  - "Save and Continue to Scholarships" primary CTA button.

---

### Phase F4: Scholarship Directory & Discovery Hub

- [ ] **Task F4.1: Directory Layout & Search Bar (`/scholarships`)**
  - Header with search input (searching scholarship title, provider, and description).
  - Action bar with:
    - Result count counter (e.g. *"Showing 12 scholarships"*).
    - Sort dropdown (`Deadline: Soonest`, `Amount: High to Low`, `Recently Added`).
    - **"Download Directory (CSV)"** prominent button.

- [ ] **Task F4.2: Comprehensive Filter Sidebar**
  - Build collapsible, sticky filter sidebar with:
    - **Field of Study** (Checkboxes: Engineering, Medical, Science, Humanities, Commerce)
    - **Education Level** (Undergraduate, Postgraduate, Diploma)
    - **Maximum Family Income** (Slider or radio options: `< ₹2.5L`, `< ₹5L`, `< ₹8L`, `Any`)
    - **Gender** (All, Female-only, Male)
    - **Social Category** (General, SC, ST, OBC, EWS)
    - **Special Categories** (PwD Eligible, Rural Area)
  - "Reset All Filters" button.
  - Mobile responsive drawer for filters.

- [ ] **Task F4.3: Scholarship Card Component**
  - Display critical details cleanly:
    - Scholarship title & Provider badge
    - Amount / Benefit tag (highlighted with icon)
    - Deadline badge with countdown tag (`Expires in 12 days` or `Deadline Passed`)
    - Key tags: Field of study, Education level, Category
    - Quick CTA button: "View Details & Check Eligibility" -> links to `/scholarships/[id]`

- [ ] **Task F4.4: CSV Download Client Handler**
  - Connect "Download Directory (CSV)" button to `GET /api/scholarships/export/csv`.
  - Trigger automatic file download with meaningful filename timestamp (e.g., `scholarships_2026-09-04.csv`).

- [ ] **Task F4.5: Empty & Loading States**
  - Skeleton loading cards while fetching data.
  - Informative empty state when filters return 0 results with "Clear filters" quick link.

---

### Phase F5: Scholarship Details View & Document Checklist

- [ ] **Task F5.1: Scholarship Details Layout (`/scholarships/[id]`)**
  - Breadcrumb navigation (`Scholarships > [Scholarship Name]`).
  - Top Hero section:
    - Scholarship Title, Provider name, and Verification badge.
    - Key stats bar: Amount / Benefits, Application Deadline, Days Remaining pill, Official Notice external link button (with icon).
  - Main body grid:
    - Left Column: Description, Structured Eligibility Rules list, Document Checklist.
    - Right Column / Sticky Card: "Check My Eligibility" trigger card and result summary.

- [ ] **Task F5.2: Structured Rules Display**
  - Render transparent eligibility rules table or card list:
    - Visible rule specification (e.g. `Course = Engineering`, `CGPA >= 7.5`, `Family Income <= ₹5,00,000`).
    - Mandatory vs Optional indicator.
    - Rule explanation note.

- [ ] **Task F5.3: Interactive Document Checklist Component**
  - Render list of required documents:
    - Checkbox for student to mark document as prepared (`☑ Previous Marksheet`, `☐ Income Certificate`).
    - Mandatory tag per document.
    - Helper instructions tooltip/accordion (e.g. *"Issued by competent revenue authority not before April 2026"*).
    - Progress indicator (e.g., *"3 of 5 documents prepared"*).
    - Persistence: Calls backend toggle API without requiring a page reload.
    - Disclaimer alert: *"This checklist is strictly for personal preparation; the portal does not collect or submit documents."*

- [ ] **Task F5.4: Official Notice Link Component**
  - Prominent callout card with direct link to official notice/circular.
  - Clear guidance: *"Always verify guidelines, dates, and terms directly with the official provider notice before applying."*

---

### Phase F6: Deterministic Eligibility Checker UI & Transparent Reason Explainer

- [ ] **Task F6.1: "Check My Eligibility" Action & Loading State**
  - Prominent "Check My Eligibility" button with interactive states:
    - Default state: Ready to check.
    - Loading state: Evaluating rules with spinner.
    - If profile is incomplete: Prompt modal/alert asking user to complete profile first with direct link to `/profile`.

- [ ] **Task F6.2: Eligibility Verdict Banner**
  - **ELIGIBLE Banner:**
    - High-contrast Emerald Green card styling.
    - Badge: `ELIGIBLE`.
    - Message: *"You satisfy all evaluated eligibility requirements for this scholarship."*
  - **NOT ELIGIBLE Banner:**
    - High-contrast Rose/Crimson card styling.
    - Badge: `NOT ELIGIBLE`.
    - Message: *"You do not meet one or more mandatory requirements for this scholarship."*
  - **POSSIBLY ELIGIBLE Banner:**
    - High-contrast Amber/Gold card styling.
    - Badge: `POSSIBLY ELIGIBLE`.
    - Message: *"You may be eligible, but some requirements could not be confirmed from your profile data. Please verify the original notice."*

- [ ] **Task F6.3: Transparent Rule-by-Rule Breakdown Component**
  - Detailed card breakdown matching the design specification:
    - For each evaluated rule:
      - Icon: `✓` (Pass - Green), `✗` (Fail - Red), `?` (Unknown - Amber).
      - Rule name & Requirement (e.g. `Required: ≤ ₹5,00,000`).
      - Student's profile value (e.g. `Your income: ₹3,20,000`).
      - Clear human-readable explanation sentence.
    - Dedicated "Reasons" callout box explaining the definitive cause of failure or ambiguity.

---

### Phase F7: Administrator Scholarship Management Portal

- [ ] **Task F7.1: Admin Dashboard Layout (`/admin`)**
  - Protected by `AdminGuard`.
  - Top bar with admin status, quick stats (Total Scholarships, Active Listings).
  - Primary CTA: **"+ Add New Scholarship"** button.
  - Data table of listed scholarships with columns: Name, Provider, Deadline, Rules Count, Status, Actions (Edit, Delete).

- [ ] **Task F7.2: Create Scholarship Page (`/admin/scholarships/new`)**
  - Multi-step or grouped form:
    1. **Basic Info:** Name, Organization/Provider, Full Description, Benefit/Amount text, Numeric amount, Deadline date picker, Official Notice URL.
    2. **Structured Eligibility Rule Builder:** Dynamic rule list editor.
    3. **Required Documents Builder:** Dynamic document list editor.

- [ ] **Task F7.3: Dynamic Rule Builder Component**
  - Interactive rule creator allowing the administrator to add multiple rules:
    - Field selector dropdown (`Family Income`, `CGPA`, `Field of Study`, `Course`, `Domicile State`, `Gender`, `Category`, `Area Type`, `PwD Status`).
    - Operator dropdown (`=`, `!=`, `<=`, `>=`, `<`, `>`, `One of (comma-separated)`).
    - Value input (dynamically rendered as number, text, or select depending on field).
    - Mandatory toggle switch (`Mandatory rule`).
    - Live human-readable rule preview (e.g. `"Preview: Family Income must be <= ₹5,00,000"`).
    - "Add Another Rule" button and "Remove Rule" trash button.

- [ ] **Task F7.4: Dynamic Document List Editor Component**
  - Form section to add required documents:
    - Document Name input (e.g., `"Income Certificate"`).
    - Mandatory checkbox.
    - Optional guidance/instructions input.
    - Add/Remove buttons.

- [ ] **Task F7.5: Form Submission, Validation & Error Handling**
  - Validate all fields with Zod prior to API call.
  - Handle submission to `POST /api/admin/scholarships`.
  - Success toast and redirect back to `/admin`.

---

### Phase F8: Shared Utilities, API Client & State Management

- [ ] **Task F8.1: Currency & Date Formatters**
  - Currency formatter for Indian Rupee format (`Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`).
  - Date formatters for deadline dates (`15 October 2026`) and days-left calculation helper.

- [ ] **Task F8.2: Custom Data Fetching Hooks**
  - `useScholarships(filters)`: Handles fetching, filtering, and caching of scholarship list.
  - `useScholarshipDetails(id)`: Fetches individual scholarship, rules, and document list.
  - `useStudentProfile()`: Fetches and updates student profile.
  - `useDocumentChecklist(scholarshipId)`: Manages checklist state and optimistic UI updates.

---

### Phase F9: UI Polish, Responsive Verification & Accessibility

- [ ] **Task F9.1: Mobile & Tablet Responsiveness**
  - Ensure filter sidebar transforms into an off-canvas drawer on mobile screens.
  - Ensure tables and rule lists wrap cleanly on small viewports without horizontal scrolling overflow.
  - Optimize touch targets for checkboxes and mobile buttons.

- [ ] **Task F9.2: Visual Polish & Color Contrast Compliance**
  - Verify WCAG AA color contrast for all status badges (`PASS`, `FAIL`, `UNKNOWN`, `ELIGIBLE`, `NOT ELIGIBLE`).
  - Add smooth transitions on filter changes, card hovers, and eligibility result reveal.

- [ ] **Task F9.3: Empty, Error & Network Offline Boundaries**
  - Next.js `error.tsx` and `not-found.tsx` custom boundary pages.
  - Clear error states with "Retry" action if backend API is unreachable.

---

## Deliverables & Acceptance Checklist

| Feature | Backend Responsibility | Frontend Responsibility | Status |
| :--- | :--- | :--- | :--- |
| **Authentication & Roles** | JWT endpoints & role verification | Role-based routes & auth context | Backend Complete (`/api/auth/*`) |
| **Student Profile** | Profile CRUD & D1 persistence | Multi-section validated profile UI | Backend Complete (`/api/profile/me`) |
| **Scholarship Listing** | Filtered query endpoint & CSV export | Filter sidebar, search & CSV button | Backend Complete (`/api/scholarships`) |
| **12 Mock Scholarships** | D1 seed script with rich rule data | Rendered in directory with badges | Backend Complete (`npm run db:seed`) |
| **Scholarship Details** | Metadata, rules, & docs API | Full details view & deadline pill | Backend Complete (`/api/scholarships/:id`) |
| **Document Checklist** | Checklist toggle & state API | Interactive checkbox checklist | Backend Complete (`/api/scholarships/:id/checklist`) |
| **Eligibility Engine** | Deterministic PASS/FAIL/UNKNOWN evaluation | Visual breakdown & reason explainer | Backend Complete (`/api/scholarships/:id/check-eligibility`) |
| **Admin Management** | Scholarship & rule CRUD endpoints | Interactive Rule Builder form | Backend Complete (`/api/admin/scholarships`) |
