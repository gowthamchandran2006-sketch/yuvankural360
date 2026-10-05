# IlamKurazh 360°

> SIH Benchmark — formerly branded **YuvaKural 360°** (case IDs now use the `IK-` prefix).

**IlamKurazh 360°** is an AI-powered interoperability platform for youth and citizen government services. A citizen can describe a need in plain **Tamil, Tanglish or English** ("Enakku income certificate venum", "python free training irukka", "voter id venum"), and the platform understands it, matches the correct government service, routes it to the right department/office/officer, and issues a unified **Case ID** (`IK-2026-NNNNNN`) that tracks the whole journey — application, documents, department handover, SLA deadline, escalation and resolution — end to end.

The project is a **monorepo**: a static frontend app, a Flask REST API, and an Android (Capacitor/WebView) wrapper that packages the same frontend into a mobile APK.

## IlamKurazh SIH Interoperability Core

| Pillar | How it works |
|--------|--------------|
| **Service registry** | 12 departments, 12 offices, 13 services seeded with jurisdiction, workflow, SLA timelines (10–45 days) and English + Tanglish + Tamil keywords (`/api/registry`). |
| **AI service routing** | Tanglish/Tamil/English keyword + token-overlap matching resolves a free-text request to a service + department + office (`/api/registry/routing?q=...`). AI never decides — final authority stays with the government. |
| **Unified case identity** | Every application/complaint becomes one journey with a single `IK-YYYY-NNNNNN` Case ID and a status lifecycle (Submitted → Processing → Department Handover → Approved / Rejected / Escalated → Resolved). |
| **SLA management** | Every case gets `slaDays`, a deadline, elapsed `progress`, remaining days and state (`ok` / `nearing` / `breached`); SLA events are materialized as notifications. |
| **Handover & escalation** | Cases move between departments/offices (`/api/officers/case/update` with `action=handover|escalate|status`) with a full audit trail. |
| **Duplicate detection** | Token-overlap matching flags duplicate applications/complaints (returns `duplicate: {score, similarTo}` and re-uses the open journey with `409` + existing Case ID instead of double-processing). |
| **Consent & data reuse** | Citizens grant reusable consent; a previously-submitted profile can be reused for a new application (`/api/consents/reuse`). |
| **Audit trail** | Every case/application/status/handover event is recorded and queryable (`/api/audit`). |
| **Role-based access** | Citizen vs officer sessions; officer cases/stats are scoped to their department. |
| **Voice-first UX** | The web UI keeps a Tanglish-speaking assistant; the whole journey is designed for low-literacy, mobile-first access. |

## Technology Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | HTML, CSS, JavaScript                        |
| Backend   | Python (Flask), blueprint-based REST API     |
| Database  | MongoDB (automatic in-memory fallback)       |
| AI        | Rule-based intent + routing engine (Flask endpoint) |
| Mobile    | Android APK via Capacitor (WebView)          |

### Frontend

HTML is used to create the structure of the web application, including pages such as Home, Login, Registration, Dashboard, Services, Scholarships, Employment, Skill Development, Welfare Schemes, Grievance, Applications, Documents, Case Tracking, Notifications, Profile, About, and AI Chatbot. CSS provides a modern, responsive, and user-friendly interface across desktop, tablet, and mobile sizes. JavaScript provides interactive behaviour: form validation, navigation, service search, eligibility checking, application handling, documents, notifications, chatbot interaction, and communication with the backend.

### Backend

The Flask backend is the processing layer between the frontend and the database. It handles registration/login, profile, services, applications, complaints, documents, case tracking, notifications, officer operations, and the AI chatbot. Routes are organised into blueprints under `backend/routes/`.

### Database

MongoDB stores users, services, applications, complaints, cases, notifications, and documents. When MongoDB is not running, the backend automatically falls back to an in-memory store so the API can still be explored locally (`/api/health` reports the active backend).

## Repository Layout

```
.
├── frontend/            # Static web app (HTML/CSS/JS) — also embedded in the APK
│   ├── *.html           # 32 pages (index, login, dashboard, services, ...)
│   ├── styles.css       # Shared responsive design system
│   ├── js/api.js        # window.YK client (API + offline localStorage fallback)
│   └── logo.png
├── backend/             # Flask REST API
│   ├── app.py           # App factory + CORS
│   ├── config.py        # Env-driven configuration (Mongo URI, secret, officer creds)
│   ├── database.py      # Mongo / in-memory data layer
│   ├── security.py      # Auth helpers (JWT-style tokens, password hashing)
│   ├── core.py          # IlamKurazh engine: IK case IDs, SLA, routing,
│   │                    # duplicate detection, journey + consent, audit
│   ├── seed.py          # Registry seed (departments, offices, services, officers)
│   └── routes/          # Blueprints: auth, services, applications, complaints,
│                        # documents, cases, notifications, officers, registry,
│                        # audit, consents, ai_chat
├── mobile/              # Capacitor project (Android wrapper)
│   ├── capacitor.config.json   # webDir points at ../frontend
│   ├── package.json
│   └── android/         # Android Studio / Gradle native project
├── scripts/
│   ├── dev.ps1          # Start backend (:5000) + frontend (:8000)
│   ├── build-apk.ps1    # Sync web assets + Gradle assembleDebug -> build/YuvaKural360.apk
│   └── smoke_test.py    # End-to-end API smoke test (live HTTP client)
├── build/               # Build artifacts (APK) and logs
├── README.md
└── .gitignore
```

## Quickstart

### 1. Run the backend (REST API)

```bash
cd backend
pip install -r requirements.txt
python app.py            # http://127.0.0.1:5000
```

### 2. Run the frontend (static app)

```bash
cd frontend
python -m http.server 8000      # http://127.0.0.1:8000
```

Or run both with one command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
```

### 3. Connect frontend to the live API

Open `http://127.0.0.1:8000/index.html` and run once in the browser console:

```js
localStorage.setItem('ykApiBase', 'http://127.0.0.1:5000/api');
location.reload();
```

Default credentials: any registered account. Officer account: `officer@yk.gov` / `officer@123`.

> All protected pages require a login session (`sessionStorage.ilamSession`); unauthenticated visitors are redirected to `login.html`. When the API is unreachable, `js/api.js` (`window.YK`) automatically falls back to built-in localStorage demo data so the site still works — including inside the Android APK over file:// or when offline.

## Building the Android APK

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1
```

The script:

1. Finds a JDK (17–24 required; the bundled Android Studio JBR on some machines is JDK 25, which Gradle 8.x cannot use — set `JAVA_HOME` to a JDK 17/21/24 first).
2. Runs `npx cap sync android` (copies `frontend/` into `android/app/src/main/assets/public`).
3. Runs `gradlew assembleDebug`.
4. Copies the result to `build\YuvaKural360.apk`.

Install on a phone: copy the APK across, enable *install unknown apps*, and open the file — or, with USB debugging: `adb install build\YuvaKural360.apk`. The APK runs the full site offline (localStorage demo datastore) and can also hit a remote API via `localStorage.ykApiBase`.

## API Overview

| Method | Endpoint                          | Description                         |
|--------|-----------------------------------|-------------------------------------|
| POST   | `/api/auth/register`              | Create a user account               |
| POST   | `/api/auth/login`                 | Login, returns bearer token         |
| GET    | `/api/auth/me`                    | Current user profile                |
| POST   | `/api/auth/logout`                | Invalidate session token            |
| GET    | `/api/services`                   | List government services/schemes    |
| GET    | `/api/services/<id>`              | Service detail                      |
| POST   | `/api/services/eligibility-check` | Eligibility guidance for a profile  |
| POST   | `/api/applications`               | Submit an application (returns Case ID + SLA) |
| GET    | `/api/applications`               | List my applications (with caseId + sla) |
| GET    | `/api/applications/<id>/status`   | Track application status            |
| POST   | `/api/complaints`                 | Register a complaint (linked to a case, duplicate-flagged) |
| GET    | `/api/complaints`                 | List my complaints                  |
| POST   | `/api/documents`                  | Upload document metadata            |
| GET    | `/api/documents`                  | List my documents                   |
| DELETE | `/api/documents/<id>`             | Remove a document                   |
| POST   | `/api/cases`                      | Create a case                       |
| GET    | `/api/cases`                      | List my cases (with SLA)            |
| GET    | `/api/cases/track?caseId=IK-...`  | Track a case by IK ID (status, SLA, history) |
| GET    | `/api/notifications`              | List my notifications               |
| GET    | `/api/notifications/unseen`       | Unseen notification count           |
| GET    | `/api/registry`                   | Service registry (depts, offices, services) |
| GET    | `/api/registry/routing?q=...`     | Route a free-text Tanglish/Tamil/English request |
| POST   | `/api/chat/route`                 | Same routing through the assistant  |
| GET    | `/api/officers/stats`             | Officer dashboard stats (incl. slaNearing, slaBreached, escalated) |
| GET    | `/api/officers/cases`             | Officer case queue (SLA/priority sorted) |
| GET    | `/api/officers/pending`           | Pending cases/applications/complaints |
| POST   | `/api/officers/case/update`       | Status / handover / escalate a case |
| POST   | `/api/officers/case-summary`      | AI-assisted case brief (urgency + SLA risk) |
| GET    | `/api/audit`                      | Audit trail                          |
| GET    | `/api/consents`                   | My consents                          |
| POST   | `/api/consents`                   | Grant a consent                      |
| POST   | `/api/consents/reuse`             | Reuse consented profile data         |
| POST   | `/api/chat`                       | Ask the AI chatbot                  |
| GET    | `/api/health`                     | Health + database backend check     |

Configuration (optional `.env` in `backend/`):

```
MONGO_URI=mongodb://localhost:27017
DB_NAME=ilamkural_platform
SECRET_KEY=change-me
PORT=5000
OFFICER_EMAIL=officer@yk.gov
OFFICER_PASSWORD=officer@123
```

## Features

- **AI-powered assistant (Tanglish/Tamil-first)** — describe a need in your own words: *"Enakku income certificate venum"*, *"birth certificate venum"*, *"python free training irukka"*, *"voter id venum"*, *"job vetti edhavadhu"* — the platform understands and routes it to the right service, department and office. AI assists and explains, but **government retains final authority**.
- **Unified Case ID + live tracking** — every journey is `IK-YYYY-NNNNNN`. Track from Dashboard or `track-case.html` to see status, SLA deadline/progress and the full history timeline.
- **SLA & escalation** — per-service SLA timelines; cases nearing/breaching their deadline are surfaced to officers and escalate with an audit record.
- **Interoperability** — department/office handover, duplicate detection, consent-based profile reuse, and a full audit trail demonstrate how separate government bodies can collaborate on one journey.
- **Service discovery and eligibility support** — search services by requirement; view purpose, eligibility, required documents, and application process.
- **Application and complaint management** — submit applications with supporting documents, receive a reference to track status, and register/monitor complaints.
- **Notifications** — status updates plus automatic SLA event notifications for applications, complaints, and cases.
- **Officer / administrator interface** — workload stats (incl. SLA risk), QA-filtered case queue, status/handover/escalate actions, and an AI case-summary brief.
- **Frontend–API resilience** — real backend calls when online, seamless localStorage demo fallback when offline (web or APK).
- **All-page navigation** — consistent navbar + mobile drawer across all 32 pages; enlarged logout button on desktop and mobile.

## Verification

```bash
python scripts\smoke_test.py    # live HTTP smoke test: health → registry → Tanglish routing
                                # → register → case/application create → duplicate detection
                                # → track → complaint → consent → notifications → officer
                                # stats/queue/stats-update/handover/escalate → AI summary → audit
```

## Overall Outcome

IlamKurazh 360° brings service discovery, eligibility guidance, applications, documents, complaints, AI assistance, unified case tracking with SLA, handover, escalation, consent and audit together in one interoperability platform — available as a responsive web app and an installable Android APK. The frontend uses HTML/CSS/JavaScript, the backend uses Python (Flask) with MongoDB, and the mobile build packages the same frontend with Capacitor, demonstrating how web technologies, Python backend development, database management, and AI-based routing can be integrated into a unified government-service platform.#   y u v a n k u r a l 3 6 0  
 