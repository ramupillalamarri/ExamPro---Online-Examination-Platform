# ExamPro Platform - Visual Architecture & Feature Guide

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Components (UI Layer)                             │  │
│  │  - Login Page                                            │  │
│  │  - Student Dashboard                                    │  │
│  │  - Exam Taking                                          │  │
│  │  - Admin Panel                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  State Management (Zustand)                              │  │
│  │  - Folders, Exams, Questions, Attempts                  │  │
│  │  - Optimistic Updates                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           ↓ HTTP
        ┌──────────────────────────────────────┐
        │    Next.js Server (API Routes)       │
        │                                      │
        │  ┌────────────────────────────────┐ │
        │  │ Validation & Business Logic   │ │
        │  │ - Authentication              │ │
        │  │ - Authorization               │ │
        │  │ - Data Processing             │ │
        │  └────────────────────────────────┘ │
        │                                      │
        │  ┌────────────────────────────────┐ │
        │  │ API Endpoints (/api/*)        │ │
        │  │ - exams, questions, answers   │ │
        │  │ - attempts, submissions       │ │
        │  │ - auth, user-access           │ │
        │  │ - ai, analysis, data          │ │
        │  └────────────────────────────────┘ │
        └──────────────────────────────────────┘
                           ↓ SQL
        ┌──────────────────────────────────────┐
        │    PostgreSQL Database               │
        │                                      │
        │  Tables:                             │
        │  - users                             │
        │  - exams                             │
        │  - questions                         │
        │  - options                           │
        │  - attempts                          │
        │  - answers                           │
        │  - folders                           │
        └──────────────────────────────────────┘
```

---

## 👥 User Roles & Features

### STUDENT
```
┌─ Login
│
├─ Student Dashboard
│  ├─ View Statistics
│  ├─ Recent Attempts
│  └─ Quick Actions
│
├─ Browse Exams
│  ├─ Filter by Subject
│  ├─ Sort by Date
│  └─ View Details
│
├─ Take Exam ⭐ MOST COMPLEX
│  ├─ Load Questions
│  ├─ Start Timer
│  ├─ Navigate Questions
│  ├─ Select Answers (Anti-cheat Active)
│  ├─ Submit Attempt
│  └─ View Result
│
├─ Review Past Exams
│  ├─ View Results
│  ├─ Review Answers
│  ├─ AI Feedback
│  └─ Analytics
│
├─ History
│  ├─ All Attempts
│  ├─ Scores Over Time
│  └─ Performance Trends
│
└─ Profile
   ├─ View Information
   ├─ Edit Details
   └─ Change Password
```

### ADMIN
```
┌─ Login
│
├─ Admin Dashboard
│  ├─ Total Students
│  ├─ Total Exams
│  ├─ Recent Activity
│  └─ System Stats
│
├─ Manage Exams
│  ├─ Create New Exam
│  ├─ Edit Existing
│  ├─ Add Questions
│  ├─ Publish/Unpublish
│  └─ Set max_attempts
│
├─ Create Exam Flow
│  ├─ Basic Info (title, description)
│  ├─ Settings (duration, marks, attempts)
│  ├─ Questions (MCQ with options)
│  └─ Review & Publish
│
├─ Manage Folders
│  ├─ Create Folder
│  ├─ Edit Folder
│  ├─ Delete Folder
│  └─ Organize Exams
│
├─ Manage Questions
│  ├─ Add Questions
│  ├─ Edit Questions
│  ├─ Delete Questions
│  └─ Bulk Operations
│
├─ View Analytics
│  ├─ Exam Performance
│  ├─ Student Analytics
│  ├─ Question Analytics
│  └─ Charts & Reports
│
├─ Manage Students
│  ├─ View All Students
│  ├─ Block/Unblock
│  ├─ View Attempts
│  └─ Export Data
│
└─ Profile
   └─ Admin Settings
```

---

## 🔄 Complete User Flow: Taking an Exam

```
STEP 1: DISCOVERY
┌─────────────────────────────────────┐
│ Student visits /student/exams       │
│ Page loads with list of exams       │
│ Data fetched: SWR(/api/exams)       │
│ Zustand store updates with exams    │
└─────────────────────────────────────┘
                 ↓
STEP 2: START EXAM
┌─────────────────────────────────────┐
│ Student clicks "Start Exam"         │
│ Button navigates to: /exam/[id]     │
│ Page component receives exam ID     │
└─────────────────────────────────────┘
                 ↓
STEP 3: INITIALIZE
┌─────────────────────────────────────┐
│ API call: POST /api/attempts        │
│ Creates new attempt record          │
│ Fetches all questions for exam      │
│ Sets start time in database         │
│ Zustand store updates with attempt  │
└─────────────────────────────────────┘
                 ↓
STEP 4: EXAM TAKING (Main Loop)
┌─────────────────────────────────────┐
│ Timer starts counting down          │
│ Student sees current question       │
│ Multiple choice options displayed   │
│ Window has visibility listener      │
│ ← Anti-cheat: Tab change = warning  │
│ Student selects answer              │
│ Answer saved to Zustand store       │
│ API: POST /api/answers              │
│ Answer persisted to database        │
│ Student navigates to next question  │
│ (Repeat for all questions)          │
└─────────────────────────────────────┘
                 ↓
STEP 5: SUBMISSION (Complex!)
┌─────────────────────────────────────┐
│ Timer reaches 0:00 OR student       │
│ clicks Submit button                │
│                                     │
│ Race condition check:               │
│ - Is submission in progress?        │
│ - Did exam already end?             │
│ - Are warnings > threshold?         │
│                                     │
│ API: POST /api/attempts/submit      │
│ ├─ Calculate score                  │
│ ├─ Get correct answers              │
│ ├─ Compare with submitted           │
│ ├─ Apply negative marking           │
│ ├─ Update attempt with score        │
│ ├─ Mark attempt as complete         │
│ └─ Return result to client          │
│                                     │
│ State update (must be atomic)       │
│ Show loading spinner                │
│ Disable further interactions        │
└─────────────────────────────────────┘
                 ↓
STEP 6: RESULT
┌─────────────────────────────────────┐
│ Redirect to /exam/[id]/result       │
│ Display score & performance         │
│ Show correct/incorrect breakdown    │
│ Option to review answers            │
└─────────────────────────────────────┘
                 ↓
STEP 7: REVIEW
┌─────────────────────────────────────┐
│ Click "Review Answers"              │
│ Navigate to /exam/[id]/review       │
│ Show all questions with answers     │
│ Highlight correct vs selected       │
│ AI generates feedback for each Q    │
│ Student can view insights           │
└─────────────────────────────────────┘
```

---

## 📁 File-by-File Purpose Map

### Configuration Layer
```
tsconfig.json              → TypeScript strict mode setup
next.config.mjs            → Next.js build optimization
package.json               → Dependencies & scripts
tailwind.config.js         → Design tokens & theme
postcss.config.mjs         → CSS processing
```

### Database Layer
```
lib/db.js                  → PostgreSQL connection, pooling
                             Database initialization, schema
                             Query execution utility
```

### State Management Layer
```
lib/store.js               → Zustand store definition
                             All async actions
                             Mock data for resilience
                             Optimization patterns
```

### Utilities Layer
```
lib/utils.js               → Helper functions
                             Formatting, validation
                             Common operations
```

### Backend - API Routes
```
app/api/init/              → Database setup
app/api/auth/login/        → User authentication
app/api/exams/             → Exam CRUD & listing
app/api/questions/         → Question management
app/api/answers/           → Answer storage
app/api/attempts/          → Attempt tracking
  ├─ submit/              ⭐ Most complex endpoint
  ├─ warning/             ⭐ Anti-cheat system
  ├─ clear/               → Reset attempts
app/api/folders/           → Folder organization
app/api/students/          → Student management
app/api/user-access/       → Authorization
app/api/data/              → Complex aggregated data
app/api/ai/chat/           → AI feedback generation
app/api/ai/guide/          → AI exam guidance
```

### UI Components Layer
```
components/ui/
├─ button.jsx              → Basic button
├─ card.jsx                → Container card
├─ input.jsx               → Text input
├─ dialog.jsx              → Modal dialog
├─ alert-dialog.jsx        → Confirmation modal
├─ tabs.jsx                → Tab navigation
├─ select.jsx              → Dropdown select
├─ table.jsx               → Data table
├─ progress.jsx            → Progress bar
├─ radio-group.jsx         → Radio buttons
├─ badge.jsx               → Status badges
├─ avatar.jsx              → User avatar
├─ textarea.jsx            → Multi-line text
├─ switch.jsx              → Toggle switch
├─ scroll-area.jsx         → Scrollable area
├─ animated-background.jsx → Background animation
└─ ... (all wrapped Radix UI)
```

### Feature Components
```
components/
├─ profile-form.jsx        → User profile form (React Hook Form)
├─ my-exams.jsx            → Exam list component (SWR)
├─ code-entry.jsx          → Code input OTP style
├─ tourist-guide.jsx       → Onboarding tutorial
└─ layout/dashboard-layout.jsx → Main layout wrapper
```

### Pages - Authentication & Home
```
app/layout.jsx             → Root layout (global setup)
app/page.jsx               → Landing page
app/login/page.jsx         → Login screen
app/(authenticated)/       → Protected routes group
```

### Pages - Student Features
```
app/student/page.jsx       → Student home/dashboard
app/student/dashboard/     → Student dashboard
app/student/exams/         → Browse exams list
app/student/history/       → Past attempts history
app/student/profile/       → Student profile

app/exam/layout.jsx        → Exam section layout
app/exam/[id]/page.jsx     ⭐ MAIN EXAM PAGE (most complex)
                           → Exam taking interface
                           → Timer, questions, anti-cheat
app/exam/[id]/result/      → Exam result display
app/exam/[id]/review/      → Answer review page
  ├─ page.jsx             → Server component
  └─ review.client.jsx    → Client component
```

### Pages - Admin Features
```
app/admin/layout.jsx       → Admin layout with sidebar
app/admin/page.jsx         → Admin dashboard
app/admin/exams/           → Exam management
  ├─ page.jsx             → List all exams
  ├─ [id]/page.jsx        → Edit exam
  ├─ [id]/questions/      → Manage questions
  ├─ [id]/analysis/       → Analytics charts
app/admin/exams/new/       → Create new exam
app/admin/folders/         → Folder management
app/admin/students/        → Student management
app/admin/profile/         → Admin profile
```

### Other Pages
```
app/about/page.jsx         → About page
app/create-exam/           → Exam creation flow
app/attempts/              → Attempts management
app/exams/                 → General exams page
app/folders/               → Folders view
app/dashboard/             → General dashboard
app/home/                  → Home screen
```

---

## 🎯 Critical Sections to Understand (Interview Focus)

### 1. Anti-Cheat System 🔒
- **Files**: 
  - `app/api/attempts/warning/route.js` (Backend logic)
  - `app/exam/[id]/page.jsx` (Frontend detection)
- **Concept**: Detects tab switching, counts warnings, auto-submits on threshold
- **Interview Value**: Shows security mindset

### 2. Race Condition Handling ⚡
- **Files**: 
  - `lib/store.js` (Async pattern)
  - `app/api/attempts/submit/route.js` (Atomic submission)
- **Concept**: Multiple async operations without conflicts
- **Interview Value**: Shows understanding of concurrency

### 3. State Synchronization 🔄
- **Files**: 
  - `lib/store.js` (Client state)
  - `app/api/exams/route.js` (Server truth)
- **Concept**: Client state mirrors server, with resilience
- **Interview Value**: Shows full-stack thinking

### 4. Database Schema 📊
- **Files**: `lib/db.js` (Schema definition)
- **Concept**: Relational design for exams, questions, students
- **Interview Value**: Database design skills

### 5. Exam Taking Flow 📝
- **Files**: `app/exam/[id]/page.jsx`
- **Concept**: Complex interactive UI with timers, validation, sync
- **Interview Value**: React expertise, state management

---

## 💡 Key Concepts Map

### Concept → Where It's Implemented

**Component Composition**
→ `components/ui/*` (Radix UI wrapping pattern)

**State Management**
→ `lib/store.js` (Zustand with async)

**Data Fetching**
→ `components/my-exams.jsx` (SWR usage)
→ `app/exam/[id]/page.jsx` (Initial load)

**Form Handling**
→ `components/profile-form.jsx` (React Hook Form + Zod)

**API Design**
→ `app/api/exams/route.js` (REST pattern)
→ `app/api/attempts/submit/route.js` (Complex logic)

**Database Transactions**
→ `lib/db.js` (Query execution)
→ `app/api/attempts/submit/route.js` (Multi-step operation)

**Authentication**
→ `app/api/auth/login/route.js` (User verification)
→ `app/api/user-access/route.js` (Authorization)

**Error Handling**
→ Every API route (try-catch with meaningful errors)

**Optimization**
→ Connection pooling in `lib/db.js`
→ SWR caching in data-fetching pages
→ React Hook Form re-render optimization

**Security**
→ Environment variables in `lib/db.js`
→ SQL prepared statements (prevent injection)
→ Tab switching detection in `app/api/attempts/warning/`

---

## 🚀 How Files Work Together

### Example: "Student Takes Exam" Journey

```
1. Frontend Click
   └─ app/exam/[id]/page.jsx
   
2. Load Question Data
   └─ lib/store.js fetchQuestions()
   └─ app/api/questions/route.js
   
3. Display Question
   └─ components/ui/button.jsx (option buttons)
   └─ components/ui/card.jsx (question container)
   
4. Student Selects Answer
   └─ lib/store.js saveAnswer()
   └─ app/api/answers/route.js
   
5. Check Anti-Cheat
   └─ app/api/attempts/warning/route.js (tab switch)
   
6. Time Runs Out / Submit
   └─ lib/store.js submitAttempt()
   └─ app/api/attempts/submit/route.js (complex!)
   └─ lib/db.js query() (calculate score)
   
7. Show Result
   └─ app/exam/[id]/result/page.jsx
   
8. AI Feedback
   └─ app/api/ai/chat/route.js
```

---

## 🎓 Study Tips for Interviews

### When Asked About Architecture
1. Draw the flow diagram above
2. Explain client → API → DB communication
3. Point out key technologies and why they were chosen
4. Discuss resilience patterns (fallback mock data, error handling)

### When Asked About Complex Parts
1. Talk about race conditions in exam submission
2. Explain anti-cheat tab switching detection
3. Discuss optimistic updates pattern
4. Explain why Zustand for state management

### When Asked to Modify
1. "I'd first check which files are involved"
2. "Then trace through the API call flow"
3. "Finally update tests and deploy carefully"
4. Always think about edge cases

### When Asked About Scalability
1. "We use connection pooling to handle more users"
2. "SWR caching reduces API calls"
3. "Could add Redis for even better caching"
4. "Database indexing on frequently queried columns"
5. "Could migrate to load balanced servers"

---

## ✅ Knowledge Checklist

By the time you complete learning this project, you should be able to:

- [ ] Explain the complete exam submission flow from UI to database
- [ ] Draw the system architecture diagram
- [ ] Understand why each technology was chosen
- [ ] Explain how anti-cheat works
- [ ] Discuss race condition handling
- [ ] Modify an existing API endpoint
- [ ] Create a new UI component
- [ ] Write a database query
- [ ] Trace a bug from frontend to database
- [ ] Discuss security considerations
- [ ] Explain performance optimizations
- [ ] Answer "Why Next.js?" and "Why Zustand?"

---

**Good luck with your learning! This is a comprehensive, production-quality application. 🚀**
