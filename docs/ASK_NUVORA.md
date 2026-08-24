# Ask Nuvora — AI Copilot V1 Documentation

Ask Nuvora is a secure AI copilot for the Nuvora School Management System. It enables authenticated principals, teachers, parents, guardians, and students to query their authorized school data using natural language.

---

## 1. Core Architectural Principles

Ask Nuvora enforces a strict separation between **reasoning/explanation** and **authoritative data access**:

```
User (Frontend)
   │
   ▼
Authenticated API Request (POST /api/ai/query)
   │
   ▼
Authorization & Tenant Scoping (authMiddleware, schoolGuard, runWithSchoolContext)
   │
   ▼
AI Orchestrator (orchestrator.js)
   ├── Resolve Minimal Authorized Context (context.js)
   ├── Enforce System Safety Prompt (prompts.js)
   └── Provider Tool Invocation (provider.js)
   │
   ▼
Server-Side Authorization & Input Validation (permissions.js, aiContext.js)
   │
   ▼
Approved AI Tool Execution (aiDataService.js)
   │
   ▼
Prisma ORM & PostgreSQL (Authoritative Source of Truth)
   │
   ▼
Structured Authoritative Result
   │
   ▼
AI Provider (Reasoning & Natural-Language Formatting)
   │
   ▼
Safe User-Facing Response & Audit Log (aiAudit.js)
```

### Strict Non-Negotiable Boundaries:
- **NEVER** AI → Direct Prisma
- **NEVER** AI → Raw SQL
- **NEVER** AI → Arbitrary database query
- **NEVER** LLM → Unrestricted / Cross-tenant Nuvora data
- **PostgreSQL + Nuvora Business Logic** is always the sole source of truth for calculations, averages, grades, attendance counts, and financial balances.

---

## 2. Environment Variables & AI Provider Setup

All credentials must be stored securely in `backend/.env`. Secrets are never exposed to the frontend or included in `NEXT_PUBLIC_*` or `VITE_*` bundles.

### Supported Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` | API key for Google Gemini model | None |
| `OPENAI_API_KEY` | Optional API key for OpenAI model | None |
| `AI_PROVIDER` | Preferred provider (`gemini`, `openai`, or `mock`) | Auto-detected from keys |
| `AI_MODEL` | Model identifier | `gemini-2.0-flash` / `gpt-4o-mini` |

### Deterministic Offline / Test Provider
When running test suites or when no external API key is supplied, the system uses a deterministic built-in mock provider that executes the exact same validation, authorization, and tool execution pipeline.

---

## 3. The Five Approved AI Tools in V1

Only the following five tools are implemented in V1. No autonomous actions or database mutations are permitted.

### Tool 1: `getSchoolOverview`
- **Purpose**: Provides a high-level statistical snapshot of the user's school.
- **Allowed Roles**: `principal`, `super_admin`.
- **Inputs**: None required (school context is resolved from session).
- **Authoritative Data Output**:
  ```json
  {
    "schoolId": 1,
    "totalStudents": 482,
    "totalTeachers": 38,
    "totalStaff": 14,
    "totalClasses": 21,
    "attendanceRate": 91.4,
    "currentAcademicSession": "2025/2026 Academic Session",
    "currentTerm": "First Term"
  }
  ```

### Tool 2: `getAttendanceSummary`
- **Purpose**: Returns aggregate attendance statistics (total, present, absent, percentage).
- **Allowed Roles**: `super_admin`, `principal`, `teacher`, `parent`, `guardian`, `student`.
- **Inputs**:
  - `className` (string, optional)
  - `studentId` (string, optional)
  - `startDate` (YYYY-MM-DD, optional)
  - `endDate` (YYYY-MM-DD, optional)
- **Role Scoping Rules**:
  - **Principal / Super Admin**: School-wide or filtered by class/student.
  - **Teacher**: Scoped strictly to teacher's assigned classes.
  - **Parent / Guardian**: Scoped strictly to verified linked children.
  - **Student**: Scoped strictly to the student's own attendance.

### Tool 3: `getStudentAttendance`
- **Purpose**: Detailed attendance logs and breakdown for a specific authorized student.
- **Allowed Roles**: `super_admin`, `principal`, `teacher`, `parent`, `guardian`, `student`.
- **Inputs**:
  - `studentId` (string, optional if auto-resolved from user context)
  - `startDate` (YYYY-MM-DD, optional)
  - `endDate` (YYYY-MM-DD, optional)

### Tool 4: `getStudentResults`
- **Purpose**: Retrieves published assessment scores, percentages, grades, and calculated term average.
- **Allowed Roles**: `super_admin`, `principal`, `teacher`, `parent`, `guardian`, `student`.
- **Inputs**:
  - `studentId` (string, optional if auto-resolved from user context)
  - `termId` (string, optional)

### Tool 5: `getFeeSummary`
- **Purpose**: Authoritative billing, payment, and outstanding fee balance calculation.
- **Allowed Roles**: `super_admin`, `principal`, `parent`, `guardian`, `student`.
- **Denied Roles**: `teacher` (Teachers are strictly prohibited from accessing fee data).
- **Authoritative Data Output**:
  ```json
  {
    "schoolId": 1,
    "studentId": "student_cuid",
    "totalBilled": 150000,
    "totalPaid": 100000,
    "outstandingBalance": 50000,
    "status": "Partially Paid",
    "currency": "NGN"
  }
  ```

---

## 4. Permissions Matrix

| Tool | Super Admin | Principal | Teacher | Parent / Guardian | Student |
|---|:---:|:---:|:---:|:---:|:---:|
| `getSchoolOverview` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `getAttendanceSummary` | ✅ | ✅ | ✅ (Assigned) | ✅ (Linked) | ✅ (Self) |
| `getStudentAttendance` | ✅ | ✅ | ✅ (Assigned) | ✅ (Linked) | ✅ (Self) |
| `getStudentResults` | ✅ | ✅ | ✅ (Assigned) | ✅ (Linked) | ✅ (Self) |
| `getFeeSummary` | ✅ | ✅ | ❌ | ✅ (Linked) | ✅ (Self) |

---

## 5. Parent-Child Relationship Handling

When a parent asks questions such as *"How is my child's attendance?"*:
1. The backend inspects real database relationships (`StudentParent`, `GuardianStudent`, `Student.parentId`, `User.linkedStudentId`).
2. If the parent has **one linked child**, the system automatically scopes the query to that child without asking for arbitrary student IDs.
3. If the parent has **multiple linked children**, the frontend provides a child selector, or the AI answers across the linked children.
4. If **no child is linked**, the AI responds with:
   > *"No student is currently linked to your account. Please contact the school administrator."*
5. Demo data is never substituted.

---

## 6. API Specification

### `POST /api/ai/query`

#### Request Headers
```http
Authorization: Bearer <JWT_TOKEN>
x-school-id: <SCHOOL_ID>
Content-Type: application/json
```

#### Request Body
```json
{
  "message": "How is attendance this week?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hello! How can I help you today?" }
  ],
  "selectedStudentId": "optional_student_cuid"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "answer": "The overall attendance rate for the school this week is 91.4% with 440 out of 482 students present.",
  "data": {
    "schoolId": 1,
    "total": 482,
    "present": 440,
    "absent": 42,
    "percentage": 91.4
  },
  "toolsUsed": ["getAttendanceSummary"],
  "provider": "gemini"
}
```

#### Error Response (`403 Forbidden` / `404 Not Found`)
```json
{
  "success": false,
  "statusCode": 403,
  "answer": "You are not authorized to access this information.",
  "data": null,
  "toolsUsed": []
}
```

---

## 7. Audit Logging & Security

Every AI request is logged in the `AuditLog` table:
- Stored fields: `userId`, `schoolId`, `action: "ai.query"`, `toolName`, `toolsUsed`, `durationMs`, `success`.
- Prohibited fields: Passwords, tokens, API keys, and sensitive raw database contents are strictly excluded from audit entries.

---

## 8. Automated Verification

Run the full suite of backend and AI tests:
```bash
cd backend
npm test
```

Run frontend build verification:
```bash
cd Petra-Project
npm run build
```

Prisma schema validation:
```bash
cd backend
npx prisma validate
```

---

## 9. Non-Goals in V1 (Reserved for Future Milestones)

The following capabilities are intentionally **NOT** part of V1:
- Autonomous database mutations or record creation.
- Predictive attendance or disciplinary risk scoring.
- Automated grade calculation overrides.
- Autonomous sending of emails or parent SMS messages.
- Automatic financial transactions or fee adjustments.
