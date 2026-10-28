# ELVI — Backend Architecture & Staged Implementation Plan

A comprehensive architectural blueprint and implementation plan to transition ELVI from an in-memory frontend into a production-grade, privacy-first, AI-assisted menstrual and hormonal health companion in the dedicated `elvi-osfic` project.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Mandatory Project Isolation Stop Condition**: Before provisioning any database, authentication, or storage services, the exact Google Cloud Project ID for `elvi-osfic` must be verified. AI Studio runtime currently reports environment variables for the container sandbox, but does not have a linked or confirmed Firebase configuration for `elvi-osfic`.

Please review and confirm the following project configuration decisions:

1. **Exact Google Cloud Project ID**: Is the cloud project ID exactly `elvi-osfic`, or does it carry a numeric suffix (e.g., `elvi-osfic-XXXXX`)?
2. **Cloud Region**: Recommended `asia-southeast1` (matching container location) or `us-central1`?
3. **Primary Authentication Method**: Firebase Auth with Email/Password + Anonymous Guest Mode (allows calm onboarding without an immediate wall, then linking credentials), or standard Email/Password?

---

## 1. Codebase Audit: Current State vs. Target State

### A. Architecture Overview

```
CURRENT ARCHITECTURE (Pure Client-Side SPA):
┌────────────────────────────────────────────────────────┐
│ Browser (Vite Dev Server, Port 3000)                   │
│                                                        │
│  AppLayout (Shared Shell: Sidebar + Header + Footer)   │
│  ├── 9 Screen Views (Today, Cycle, Check-in, etc.)     │
│  └── ElviContext (React useState in-memory store)      │
│      ├── Hardcoded seed data (INITIAL_TIMELINE, etc.)   │
│      └── Simulated actions (Canned chat, mock upload)  │
└────────────────────────────────────────────────────────┘
  * No server.ts backend process.
  * No database connection or persistent storage.
  * @google/genai installed, GEMINI_API_KEY present in env,
    but unused.

TARGET ARCHITECTURE (Full-Stack elvi-osfic Protected System):
┌────────────────────────────────────────────────────────┐
│ Browser (React 19 SPA + AppLayout Shell)               │
│  └── Authenticated State & Firestore Client SDK        │
└───────────┬────────────────────────────────┬───────────┘
            │ Direct Firestore Reads/Writes  │ Secure API Calls
            │ (User-Scoped Security Rules)   │ (Bearer Auth Token)
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│ Firestore Database    │        │ Node/Express Backend  │
│ (elvi-osfic Project)  │        │ (server.ts proxy)     │
│  ├── /users/{uid}     │        │  ├── /api/companion   │
│  ├── /cycles          │        │  ├── /api/reports     │
│  ├── /checkins        │        │  ├── /api/storage     │
│  ├── /timeline        │        │  └── /api/export      │
│  └── /clinical_docs   │        └───────────┬───────────┘
└───────────────────────┘                    │
                                             ▼
                                 ┌───────────────────────┐
                                 │ Gemini 2.5 Flash API  │
                                 │ (Server-Side Proxy)   │
                                 └───────────────────────┘
```

### B. Screen-by-Screen Audit: Real Functionality vs. Presentation

| Screen | Current Implementation | Real Functionality | Gaps / Required Backend Integration |
| :--- | :--- | :--- | :--- |
| **1. Today** | `TodayScreen.tsx` | Partial (In-Memory) | Cycle card reads `periods[0]` from memory; check-in status reads `todayCheckedIn`. Resets on refresh. Needs Firestore listener for active cycle status and today's check-in timestamp. |
| **2. Cycle Tracker** | `CycleTrackerScreen.tsx` | Partial (In-Memory) | Interactive October 2026 calendar; day selection; period logging modal. Cycle length math is an array length heuristic (`periods.length >= 2 ? '31 days' : '—'`). Needs persistent cycle interval math and Firestore cycle collection. |
| **3. Daily Check-in** | `DailyCheckInScreen.tsx` | Interactive (No Persistence) | Full 5-section form (moods, symptoms, discomfort, energy, bleeding, notes, meals, hydration). Submits to in-memory array. Needs Firestore check-in collection and automatic timeline projection. |
| **4. Health Timeline** | `HealthTimelineScreen.tsx` | Interactive (Static Seed Data) | Filter tabs and AI proposal confirmation operate on `INITIAL_TIMELINE`. Needs dynamic chronological query aggregating cycles, daily check-ins, clinical documents, and notes. |
| **5. AI Companion** | `AICompanionScreen.tsx` | Presentation / Simulated | Chat messages stored in local state. `sendMessage()` returns a hardcoded static string. Needs Express route calling `@google/genai` (`gemini-2.5-flash`), consent memory retrieval, and structured proposal extraction. |
| **6. PCOS/PCOD Care** | `PcosCareScreen.tsx` | Interactive (No Persistence) | Profile status, weight tracking toggle, consultation questions, care notes mutate local state. Static SVG for cycle variations. Needs persistent care profile and aggregated symptom metrics. |
| **7. Reports** | `ReportsScreen.tsx` | Presentation / Mock | File input selects a file name but discards bytes; report generator adds mock summary item to array. Needs Cloud Storage upload, Gemini multimodal PDF/image extraction, and structured longitudinal synthesis. |
| **8. Reminders** | `RemindersScreen.tsx` | Interactive (No OS Delivery) | In-memory CRUD and active toggles. Static weekly distribution chart. Needs persistence in Firestore and optional Web Push / Notification API registration. |
| **9. Settings** | `SettingsScreen.tsx` | Interactive (No Persistence) | Toggles mutate React state. Data export and account purge show feedback banners without performing actions. Needs real JSON/CSV export generation and cascade deletion in Firestore. |

### C. Security & Data Integrity Gaps in Current Code

1. **No Backend Authentication or Tenant Isolation**: Currently, user data is unified in memory under `userProfile = "Elena Vance"`. Any multi-user deployment requires Firebase Authentication with strictly isolated `request.auth.uid` query boundaries.
2. **Client-Side Secret Exposure Risk**: Vite client bundles must never import `@google/genai` with raw API keys. All inference must be proxied through server routes (`/api/*`).
3. **Hardcoded Clinical Data Fixtures**: `INITIAL_TIMELINE` contains synthetic LabCorp endocrine values (`8.2 µIU/mL` insulin, `38 ng/dL` testosterone) hardcoded in `src/context/ElviContext.tsx`. These must be migrated to an explicit seeded state or user-uploaded records.
4. **Unvalidated Clinical Inferences**: AI responses must never write directly to health records. The current UI enforces this visually via the "Confirm & Save" draft card; the backend must enforce this architecturally by requiring an explicit user confirmation endpoint.

---

## 2. Target Database Schema (Firestore on `elvi-osfic`)

All user data will reside under private document hierarchies enforcing complete account isolation:

```
/users/{userId}
  ├── profile: { name, email, planLabel, createdAt, updatedAt }
  ├── carePreferences: {
  │     pcosStatus: 'confirmed' | 'monitoring' | 'unsure',
  │     weightMonitoringOptIn: boolean,
  │     interfaceLanguage: 'English' | 'हिन्दी' | 'ଓଡ଼ିଆ',
  │     comfortableReading: boolean,
  │     reduceMotion: boolean,
  │     discreetMode: boolean,
  │     quietHours: { start: '22:30', end: '07:30' }
  │   }
  │
  ├── /cycles/{cycleId}
  │     startDate: 'YYYY-MM-DD',
  │     endDate: 'YYYY-MM-DD' | null,
  │     flowIntensity: 'Light' | 'Medium' | 'Heavy' | 'Spotting',
  │     notes: string,
  │     isConfirmed: boolean,
  │     createdAt: timestamp
  │
  ├── /checkins/{checkinId}
  │     date: 'YYYY-MM-DD',
  │     timestamp: timestamp,
  │     moods: string[],
  │     symptoms: string[],
  │     discomfortIntensity: 'None noted' | 'Mild' | 'Noticeable' | 'Moderate' | 'Intense',
  │     energyLevel: 'Restful / Depleted' | 'Steady' | 'Moderate' | 'High / Vibrant',
  │     bleedingOrSpotting: boolean,
  │     notes: string,
  │     meals: { breakfast, lunch, dinner, snacks, extraItems: string[] },
  │     hydrationCups: number
  │
  ├── /timeline/{entryId}
  │     category: 'menstrual' | 'symptoms' | 'nourishment' | 'clinical' | 'notes',
  │     sourceBadge: string,
  │     eventDate: 'YYYY-MM-DD',
  │     timeLabel: string,
  │     title: string,
  │     description: string,
  │     tags: string[],
  │     aiProposal: { text, status: 'pending' | 'confirmed' | 'dismissed' } | null,
  │     clinicalLab: { docId, clinician, metrics: [...] } | null
  │
  ├── /clinical_documents/{docId}
  │     fileName: string,
  │     storagePath: string,
  │     fileSize: number,
  │     mimeType: string,
  │     uploadDate: timestamp,
  │     status: 'uploaded' | 'extracted' | 'confirmed',
  │     extractedMetrics: [{ label, value, unit, referenceRange, specimen }]
  │
  ├── /reports/{reportId}
  │     reportingPeriod: string,
  │     dateRange: { start: string, end: string },
  │     sourcesIncluded: string[],
  │     synthesizedSummary: string,
  │     cycleMetrics: { averageLength, periodDuration, regularity },
  │     symptomPatterns: string[],
  │     limitationsNote: string,
  │     generatedAt: timestamp
  │
  ├── /ai_memories/{memoryId}
  │     category: 'cycle' | 'symptom' | 'nourishment' | 'preference',
  │     text: string,
  │     createdAt: timestamp,
  │     isActive: boolean
  │
  └── /reminders/{reminderId}
        category: 'period' | 'checkin' | 'hydration' | 'wellbeing' | 'clinical',
        title: string,
        badgeText: string,
        cadenceLabel: string,
        timeLabel: string,
        active: boolean
```

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{subcollection}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 3. Server Architecture (`server.ts` & Express Proxy)

Per framework guidelines, create a single `server.ts` entry point running Express with `vite.middlewares` mounted in development mode:

1. **Authentication Middleware**:
   - Validates Firebase ID Tokens passed via `Authorization: Bearer <token>` headers.
   - Populates `req.user.uid` for all `/api/*` endpoints.

2. **Endpoints**:
   - `POST /api/companion/chat`:
     - Accepts user message and context preferences.
     - Fetches active `/ai_memories` and recent check-ins for `req.user.uid`.
     - Calls `@google/genai` model `gemini-2.5-flash` with grounded clinical safeguards prompt.
     - Detects symptom/nourishment patterns and returns structured JSON proposals.
   - `POST /api/reports/extract-clinical`:
     - Receives uploaded document bytes (PDF/image) via multipart form data.
     - Sends buffer to `gemini-2.5-flash` with extraction schema for hormone & metabolic panels.
     - Returns unconfirmed draft metrics for user review.
   - `POST /api/reports/synthesize`:
     - Compiles user's confirmed cycles, daily check-ins, nourishment logs, and confirmed labs across requested window (30/60/90 days).
     - Generates longitudinal clinical summary, explicitly noting unrecorded dates and including non-diagnostic disclaimer.
   - `GET /api/data/export`:
     - Aggregates all collections for `req.user.uid` and streams unencrypted structured JSON/CSV download.
   - `DELETE /api/data/purge`:
     - Server-side batch deletion of all user records across all subcollections and private Cloud Storage files.

---

## 4. Phased Implementation Roadmap

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Audit & Planning Approval (CURRENT)           │
│  - Verify project ID & region with user.               │
│  - Finalize database schema and endpoint contracts.    │
└──────────────────────────┬─────────────────────────────┘
                           │ User Approval
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Full-Stack Foundation & Auth Provisioning     │
│  - Create server.ts Express entry point.               │
│  - Set up Firebase Auth & Firestore in elvi-osfic.     │
│  - Implement Auth provider in React & Auth guard shell.│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 3: Core Health Persistence                       │
│  - Persist Cycles, Check-ins, Timeline & Reminders.    │
│  - Implement real date math for cycle intervals.       │
│  - Connect Settings (Language, Reading Mode, Purge).   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 4: Server-Side AI Companion & Memory             │
│  - Express /api/companion/chat with gemini-2.5-flash.  │
│  - Contextual memory controls & draft proposal review. │
│  - Multi-language support (English, Hindi, Odia).      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 5: Clinical Reports & Document Upload Pipeline   │
│  - Cloud Storage integration for private lab reports.  │
│  - Gemini multimodal extraction & user verification.   │
│  - Longitudinal report synthesis & export download.    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 6: End-to-End Validation & Verification          │
│  - Cross-screen data synchronization test.             │
│  - Clinical safeguard & non-diagnostic boundary audit. │
│  - Build compilation and automated lint pass.          │
└────────────────────────────────────────────────────────┘
```

### Acceptance Criteria for Execution Phases

- **Phase 2 Criteria**: User can sign up / log in; session persists across reload; invalid tokens are rejected with 401; `npm run build` passes.
- **Phase 3 Criteria**: Cycle dates entered on Today or Cycle Tracker appear on Health Timeline and persist across reloads; Daily Check-in saves all 5 sections to Firestore.
- **Phase 4 Criteria**: AI Companion responds via server-side Gemini 2.5 Flash; no API keys exposed in browser; conversational memory can be cleared without affecting timeline logs; draft proposals do not write to timeline until user clicks "Confirm".
- **Phase 5 Criteria**: PDF upload extracts laboratory values into reviewable draft state; report generation calculates exact logged counts and notes missing days honestly.
- **Phase 6 Criteria**: Full app compiles with zero TypeScript errors; all nine screens render cleanly inside master `AppLayout`.

---

## 5. Potential Risks & Mitigations

1. **Medical Boundary Protection**:
   - *Risk*: Model generating diagnostic claims (e.g., "You have PCOS").
   - *Mitigation*: Hardened system instructions forcing observational language, explicit disclaimer headers, and patient safety protocol warnings on acute symptoms.
2. **File Size & Private Lab Storage**:
   - *Risk*: Large PDF/image uploads causing server memory pressure.
   - *Mitigation*: Stream directly to private Cloud Storage bucket with signed URL upload; server extracts text/metrics from streaming chunks.
3. **Data Dignity & Purge Guarantee**:
   - *Risk*: Orphaned subcollections or conversational memories left behind on account deletion.
   - *Mitigation*: Recursive server-side batch deletion covering all subcollections and Cloud Storage objects before deleting the root user record.
