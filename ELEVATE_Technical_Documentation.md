# ELEVATE Platform — Technical Documentation
### Grant Thornton India | People & Culture
**Version:** 1.0 | **Date:** April 2026 | **Classification:** Internal — Confidential

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema](#5-database-schema)
6. [API Specification](#6-api-specification)
7. [Authentication & Security](#7-authentication--security)
8. [Background Services](#8-background-services)
9. [Email Communication Engine](#9-email-communication-engine)
10. [Cloud Hosting — Resource List](#10-cloud-hosting--resource-list)
11. [Deployment Architecture](#11-deployment-architecture)
12. [SSO Integration Readiness](#12-sso-integration-readiness)
13. [Non-Functional Requirements](#13-non-functional-requirements)

---

## 1. Executive Summary

ELEVATE is a digital executive coaching platform built for Grant Thornton India to replace manual Excel-based tracking of coach-coachee journeys. The platform enables:

- **Coachees** (T1/T2 employees) to browse certified internal coaches, submit preferences, schedule 1:1 sessions, and provide structured feedback
- **Coaches** (Partners, Directors, EDs) to manage availability, accept/decline coaching requests, and track session progress
- **Admins** (People & Culture / Talent Development) to approve registrations, monitor journeys via MIS dashboards, and export reports

**Current Scale:** 10 coaches, 10 coachees, 1 admin (demo). Designed to support 200+ coaches, 500+ coachees.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React.js SPA (Port 3000)                      │  │
│  │   Tailwind CSS + Shadcn/UI + Recharts                      │  │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │  │
│  │   │  Login/  │ │  Coachee │ │  Coach   │ │   Admin     │ │  │
│  │   │  Register│ │Dashboard │ │Dashboard │ │  Dashboard  │ │  │
│  │   └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                    HTTPS / REST API                               │
│                              │                                    │
├─────────────────────────────────────────────────────────────────┤
│                      APPLICATION LAYER                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           FastAPI Backend (Port 8001)                       │  │
│  │                                                             │  │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌───────────────┐  │  │
│  │  │  Auth   │ │ Coaches  │ │Sessions │ │  Registrations│  │  │
│  │  │ Routes  │ │ Routes   │ │ Routes  │ │    Routes     │  │  │
│  │  └─────────┘ └──────────┘ └─────────┘ └───────────────┘  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌───────────────┐  │  │
│  │  │Requests │ │  Admin   │ │ Emails  │ │ Notifications │  │  │
│  │  │ Routes  │ │ Routes   │ │ Routes  │ │    Routes     │  │  │
│  │  └─────────┘ └──────────┘ └─────────┘ └───────────────┘  │  │
│  │                                                             │  │
│  │  ┌────────────────────────────────────────────────────┐    │  │
│  │  │        Background Services (asyncio)                │    │  │
│  │  │  • Session Reminder Delivery (2d, 1d, 1h)          │    │  │
│  │  │  • Auto-Complete Past Sessions                      │    │  │
│  │  │  • Email Template Engine                            │    │  │
│  │  └────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                MongoDB (Motor Async Driver)                │  │
│  │                                                             │  │
│  │  Collections:                                               │  │
│  │  users | coaching_requests | sessions | feedback            │  │
│  │  notifications | scheduled_reminders | emails               │  │
│  │  registrations | coach_availability                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              File Storage (/uploads)                        │  │
│  │              Profile photos, avatars                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

| Layer | Component | Technology | Purpose |
|-------|-----------|------------|---------|
| Frontend | SPA | React.js 18 | Single-page app with role-based routing |
| Frontend | UI Framework | Tailwind CSS + Shadcn/UI | Consistent GT-branded design system |
| Frontend | Charts | Recharts | MIS dashboards, analytics visualizations |
| Frontend | State | React Context API | Global auth, notifications, email state |
| Backend | API Server | FastAPI (Python) | RESTful API, JWT auth, async operations |
| Backend | DB Driver | Motor (async) | Non-blocking MongoDB operations |
| Backend | Auth | PyJWT + bcrypt | Token-based auth, secure password hashing |
| Backend | Background | asyncio tasks | Reminders, auto-completion, email triggers |
| Database | Primary | MongoDB | Document store for all application data |
| Storage | Files | Local filesystem | Avatar uploads (migrateable to Azure Blob) |

---

## 3. Data Flow Diagrams

### 3.1 Registration & Onboarding Flow

```
Coachee/Coach                    Platform                     Admin
     │                              │                           │
     │  1. Submit Registration      │                           │
     │  (name, email, role,         │                           │
     │   org details, enrolment)    │                           │
     │ ─────────────────────────>   │                           │
     │                              │  2. Store in              │
     │                              │     registrations DB      │
     │                              │                           │
     │                              │  3. Email Alert ────────> │
     │                              │     "New registration"    │
     │                              │                           │
     │                              │  4. Admin reviews   <──── │
     │                              │     in Dashboard          │
     │                              │                           │
     │                              │  5a. APPROVE:             │
     │                              │   • Create user account   │
     │                              │   • Set default password  │
     │                              │   • Assign region/gender  │
     │  6a. Registration Email <──  │                           │
     │   T1(self) / T2(nominated)   │                           │
     │                              │                           │
     │                              │  5b. REJECT:              │
     │  6b. Rejection Email  <────  │   T3/T4 template          │
     │                              │                           │
```

### 3.2 Coaching Journey Flow

```
Coachee              Platform              Coach              Admin
   │                    │                    │                   │
   │ 1. Browse Coaches  │                    │                   │
   │ ────────────────>  │                    │                   │
   │                    │                    │                   │
   │ 2. Submit Request  │                    │                   │
   │ (3 preferences,    │                    │                   │
   │  goals, challenges)│                    │                   │
   │ ────────────────>  │                    │                   │
   │                    │ 3. Email T8/T9 ──> │                   │
   │ <── T7 Preferences │    Availability    │                   │
   │     received       │    request +       │                   │
   │                    │    coachee details  │                   │
   │                    │                    │                   │
   │                    │ 4a. ACCEPT <────── │                   │
   │                    │   • Assign coach   │                   │
   │                    │   • Reduce slot    │                   │
   │ <── T12/T13 Intro  │ ── T11 Guidelines  │  ── Confirmation │
   │   (gender-aware    │    for coach       │     email         │
   │    He/She)         │                    │                   │
   │                    │                    │                   │
   │                    │ 4b. DECLINE ────── │                   │
   │                    │   • Cascade to     │                   │
   │                    │     next preference│                   │
   │                    │ ── T8/T9 to next ──│──> Next Coach     │
   │                    │                    │                   │
   │ 5. Schedule Session│                    │                   │
   │ (date, time, topic)│                    │                   │
   │ ────────────────>  │                    │                   │
   │                    │ 6. Create session  │                   │
   │                    │    Schedule 3      │                   │
   │                    │    reminders       │                   │
   │                    │    (2d, 1d, 1h)    │                   │
   │                    │                    │                   │
   │    ... Sessions 1-N (6 default) ...     │                   │
   │                    │                    │                   │
   │ 7. Complete Journey│                    │                   │
   │ ────────────────>  │                    │                   │
   │                    │ 8. Restore coach   │                   │
   │ <── T16 Feedback   │    slot            │  ── Journey       │
   │     request        │                    │     completed     │
   │                    │                    │                   │
   │ 9. Submit Feedback │                    │                   │
   │ (Q1-Q5, ratings)   │                    │                   │
   │ ────────────────>  │                    │                   │
```

### 3.3 Admin MIS Reporting Flow

```
Admin                         Platform                    MongoDB
  │                              │                           │
  │  1. Open MIS Reports tab     │                           │
  │ ─────────────────────────>   │                           │
  │                              │  2. GET /api/admin/mis    │
  │                              │ ────────────────────────> │
  │                              │                           │
  │                              │  3. Aggregate in          │
  │                              │     real-time:            │
  │                              │  • Coach details (22 fld) │
  │                              │  • Coachee details (18)   │
  │                              │  • 9 chart datasets       │
  │                              │  • Capacity calculations  │
  │                              │ <──────────────────────── │
  │                              │                           │
  │  4. Render:                  │                           │
  │  • 4 sub-tabs (Analytics,    │                           │
  │    Coach, Coachee, Occupancy)│                           │
  │  • 9 Recharts visualizations │                           │
  │  • Searchable/sortable/      │                           │
  │    filterable tables          │                           │
  │  • Excel-style column filters│                           │
  │  • CSV export                │                           │
  │ <────────────────────────    │                           │
```

---

## 4. Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend** | React.js | 18.x | UI framework |
| | Tailwind CSS | 3.x | Utility-first styling |
| | Shadcn/UI | Latest | Component library |
| | Recharts | 2.x | Chart visualizations |
| | React Router | 6.x | Client-side routing |
| | Sonner | Latest | Toast notifications |
| **Backend** | Python | 3.11+ | Runtime |
| | FastAPI | 0.100+ | API framework |
| | Motor | 3.x | Async MongoDB driver |
| | PyJWT | 2.x | JWT token handling |
| | bcrypt | 4.x | Password hashing |
| | Pydantic | 2.x | Data validation |
| | python-dotenv | 1.x | Environment config |
| **Database** | MongoDB | 6.x+ | Document database |
| **DevOps** | Supervisor | 4.x | Process management |
| | Node.js | 18.x+ | Frontend build |
| | Yarn | 1.x | Package management |

---

## 5. Database Schema

### 5.1 Collections & Document Structure

#### `users` — All platform users (coaches, coachees, admin)
```json
{
  "id": "coach-1",
  "email": "Fatema.Hunaid@in.gt.com",
  "password_hash": "$2b$12...",
  "name": "Fatema Hunaid",
  "role": "coach | coachee | admin",
  "gender": "Female",
  "tier": "T1",
  "designation": "Associate Director",
  "location": "GUR",
  "region": "North | South | West | East",
  "business_unit": "People & Culture",
  "competency": "Talent Development",
  "employee_status": "Active | Serving Notice Period",
  "avatar": "/api/uploads/filename.jpg",
  // Coach-specific:
  "title": "Executive Coach",
  "capacity": 3,
  "total_work_experience": 15,
  "coaching_expertise": "4 hours/month",
  "certifications": ["ICF PCC"],
  "expertise": ["Leadership Development"],
  "domains": ["Consulting"],
  "slots": {"available": 2, "total": 3},
  "rating": 4.8,
  "total_sessions": 24,
  // Coachee-specific:
  "job_title": "Senior Associate",
  "department": "Tax & Regulatory",
  "date_of_joining": "2020-04-15",
  "enrolment_type": "Self-nomination | Coach-nominated | Manager-nominated",
  "reason_for_enrolment": "..."
}
```

#### `coaching_requests` — Coach-coachee matching
```json
{
  "id": "uuid",
  "coachee_id": "coachee-1",
  "coachee_name": "Prerna Kapoor",
  "preferences": [
    {"coach_id": "coach-1", "coach_name": "Fatema Hunaid", "order": 1, "status": "accepted"},
    {"coach_id": "coach-2", "coach_name": "Triven Gupta", "order": 2, "status": "pending"}
  ],
  "current_preference_index": 0,
  "status": "pending | accepted | completed | declined",
  "active_coach_id": "coach-1",
  "goals": "...",
  "challenges": "...",
  "mentorship_area": "Leadership Development",
  "total_sessions": 6,
  "journey_completed": false,
  "feedback_submitted": false,
  "created_at": "ISO-8601"
}
```

#### `sessions` — Individual coaching sessions
```json
{
  "id": "uuid",
  "request_id": "...",
  "coach_id": "coach-1",
  "coachee_id": "coachee-1",
  "date": "2026-04-20",
  "time": "10:00 AM",
  "duration": 60,
  "topic": "Goal Setting",
  "session_number": 1,
  "total_sessions": 6,
  "status": "upcoming | completed",
  "notes": "...",
  "meeting_link": "https://..."
}
```

#### `feedback` — Post-journey feedback forms
```json
{
  "id": "uuid",
  "request_id": "...",
  "coachee_id": "coachee-1",
  "coach_id": "coach-1",
  "overall_rating": 5,
  "coach_rating": 5,
  "learning_outcomes": {
    "self_awareness": 5,
    "experimental": 4,
    "goals": 5,
    "go_beyond": 4
  },
  "most_valuable": "...",
  "suggestions": "..."
}
```

#### `emails` — Simulated email inbox (will transition to real SMTP post-SSO)
```json
{
  "id": "email-xxx",
  "from_email": "Elevate@in.gt.com",
  "from_name": "Elevate Team",
  "to_email": "user@in.gt.com",
  "to_user_id": "coachee-1",
  "cc": ["coach@in.gt.com"],
  "subject": "Embark on your learning journey",
  "body": "<html>...",
  "preview": "...",
  "read": false,
  "created_at": "ISO-8601"
}
```

#### Other Collections
- `registrations` — Pending approval forms
- `coach_availability` — Daily time slots per coach
- `notifications` — In-app notification feed
- `scheduled_reminders` — Time-based reminder queue

### 5.2 Indexes
```
users: email (unique), role
coaching_requests: coachee_id
sessions: request_id, coach_id, coachee_id
feedback: request_id
notifications: user_id
scheduled_reminders: deliver_at, delivered
emails: to_user_id
coach_availability: (coach_id, date) compound
```

---

## 6. API Specification

### 6.1 Public Endpoints (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/stats` | Coach/coachee/session counts for homepage |
| POST | `/api/registrations` | Submit new registration |

### 6.2 Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email/password login → JWT token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile fields (role-restricted) |
| POST | `/api/auth/avatar` | Upload profile photo |

### 6.3 Coach Endpoints (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coaches` | List all active coaches |
| GET | `/api/coaches/{id}/availability` | Get coach's available slots |
| POST | `/api/coaches/availability` | Set/update availability |

### 6.4 Request Endpoints (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create coaching request (3 preferences) |
| GET | `/api/requests` | List requests for current user |
| GET | `/api/requests/active` | Get active request |
| PUT | `/api/requests/{id}/accept` | Coach accepts request |
| PUT | `/api/requests/{id}/decline` | Coach declines (cascades) |
| PUT | `/api/requests/{id}/complete-journey` | Mark journey complete |
| PUT | `/api/requests/{id}/pause` | Pause journey |
| PUT | `/api/requests/{id}/restart` | Restart journey |
| POST | `/api/requests/{id}/feedback` | Submit feedback form |

### 6.5 Session Endpoints (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List sessions for current user |
| POST | `/api/sessions/schedule` | Schedule new session |
| PUT | `/api/sessions/{id}/complete` | Mark session completed |
| POST | `/api/sessions/{id}/notes` | Add session notes |
| GET | `/api/sessions/{id}/notes` | Get session notes |

### 6.6 Admin Endpoints (Admin Role Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/coaches` | All coaches with metrics |
| GET | `/api/admin/coachees` | All coachees with status |
| GET | `/api/admin/trends` | Time-series analytics |
| GET | `/api/admin/mis` | Full MIS report (22+18 fields, 9 charts) |
| GET | `/api/admin/users/{id}/history` | User journey history |
| GET | `/api/registrations` | List registrations |
| PUT | `/api/registrations/{id}/approve` | Approve registration |
| PUT | `/api/registrations/{id}/reject` | Reject registration |

### 6.7 Email & Notification Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails` | Get emails for current user |
| PUT | `/api/emails/{id}/read` | Mark email as read |
| PUT | `/api/emails/read-all` | Mark all emails read |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read-all` | Mark all notifications read |

---

## 7. Authentication & Security

### 7.1 Current Implementation
- **Password Hashing:** bcrypt with auto-generated salt
- **JWT Tokens:** HS256, 24-hour expiry, stored in localStorage
- **Role-Based Access:** Middleware checks role for admin endpoints
- **CORS:** Configurable via environment variable

### 7.2 SSO Readiness (Planned)
- **Protocol:** OAuth 2.0 / OpenID Connect via Azure AD
- **Flow:** Authorization Code with PKCE
- **Auto-fill:** Microsoft Graph API for employee attributes
- See Section 12 for detailed SSO architecture

---

## 8. Background Services

Three async background tasks run in the FastAPI event loop (60-second interval):

| Service | Purpose | Trigger |
|---------|---------|---------|
| `deliver_due_reminders` | Sends notification when reminder time arrives | Scheduled via `scheduled_reminders` collection |
| `auto_complete_past_sessions` | Marks sessions as "completed" 1hr after scheduled time | Checks all "upcoming" sessions |
| Email Template Engine | Sends templated emails at key events | Called inline during API operations |

---

## 9. Email Communication Engine

16 email templates following GT's Elevate communication framework:

| Code | Template | Trigger | Recipient |
|------|----------|---------|-----------|
| T1 | Registration confirmed (self-nom) | Admin approves coachee | Coachee |
| T2 | Nominated for Elevate | Admin approves (nominated) | Coachee |
| T3 | Not eligible (self-nom) | Admin rejects | Coachee |
| T4 | Not eligible (nominated) | Admin rejects | Nominator |
| T7 | Preferences received | Coachee submits request | Coachee |
| T8/T9 | Availability request | Request created/cascaded | Coach |
| T11 | Guidelines for coach | Coach accepts | Coach |
| T12/T13 | Introduction (gender-aware He/She) | Coach accepts | Coachee (CC: Coach) |
| T16 | Feedback request | Journey completed | Coachee |
| Admin | Registration alert | New registration | Admin |
| Admin | Coach confirmed | Coach accepts | Admin |
| Admin | Journey completed | Journey finished | Admin |

**Gender Detection:** First name matched against known female names set for correct He/She pronoun in introduction emails.

---

## 10. Cloud Hosting — Resource List

### 10.1 Recommended Azure Resource Plan

| Resource | Azure Service | Spec | Purpose | Est. Monthly Cost |
|----------|--------------|------|---------|-------------------|
| **Web App (Backend)** | Azure App Service (Linux) | B2 (2 vCPU, 3.5GB RAM) | FastAPI + background tasks | ~$55 |
| **Web App (Frontend)** | Azure Static Web Apps | Free/Standard | React SPA hosting + CDN | ~$0-9 |
| **Database** | Azure Cosmos DB for MongoDB | 1000 RU/s (serverless) | All application data | ~$25-50 |
| **File Storage** | Azure Blob Storage | Hot tier, LRS | Avatar/profile photos | ~$2 |
| **Identity** | Azure AD (existing) | — | SSO / Microsoft Graph API | $0 (included) |
| **Email** | Azure Communication Services OR Microsoft 365 | — | Real email delivery (post-SSO) | ~$0-10 |
| **SSL/Domain** | Azure DNS + App Service cert | — | Custom domain + HTTPS | ~$1 |
| **Monitoring** | Azure Application Insights | Basic | Logs, metrics, alerting | ~$0-5 |
| **Backup** | Cosmos DB auto-backup | Continuous | Point-in-time restore | Included |
| | | | **Total Estimated** | **~$90-130/month** |

### 10.2 Alternative: Minimal Resource Plan

For initial rollout with <50 users:

| Resource | Service | Spec | Est. Monthly Cost |
|----------|---------|------|-------------------|
| **Compute** | Azure App Service | B1 (1 vCPU, 1.75GB) | ~$13 |
| **Database** | MongoDB Atlas M10 (Azure) | Shared cluster | ~$57 |
| **Storage** | Azure Blob | Hot, LRS | ~$1 |
| | | **Total** | **~$70/month** |

### 10.3 Resource Sizing for Scale

| Users | Compute | Database | Storage |
|-------|---------|----------|---------|
| <50 | B1 (1 vCPU) | 400 RU/s / M10 | 1 GB |
| 50-200 | B2 (2 vCPU) | 1000 RU/s / M20 | 5 GB |
| 200-500 | S1 (1 vCPU, auto-scale) | 2000 RU/s / M30 | 10 GB |
| 500+ | S2 + Load Balancer | 4000 RU/s / M40 | 20 GB |

---

## 11. Deployment Architecture

### 11.1 Production Deployment (Azure)

```
                    ┌──────────────┐
                    │  Azure DNS   │
                    │elevate.gt.com│
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │ Azure Front  │
                    │   Door /     │
                    │   CDN        │
                    └──────┬───────┘
                           │
              ┌────────────┴─────────────┐
              │                          │
     ┌────────┴────────┐     ┌──────────┴──────────┐
     │ Azure Static    │     │  Azure App Service   │
     │ Web Apps        │     │  (Linux, Python)     │
     │                 │     │                      │
     │ React SPA       │     │  FastAPI Backend     │
     │ (CDN-served)    │     │  + Background Tasks  │
     │                 │     │                      │
     └─────────────────┘     └──────────┬───────────┘
                                        │
                           ┌────────────┴────────────┐
                           │                         │
                  ┌────────┴────────┐    ┌──────────┴──────────┐
                  │ Azure Cosmos DB │    │  Azure Blob Storage  │
                  │ (MongoDB API)   │    │  (Profile photos)    │
                  │                 │    │                      │
                  └─────────────────┘    └──────────────────────┘
                           │
                  ┌────────┴────────┐
                  │   Azure AD      │
                  │ (SSO / Graph)   │
                  └─────────────────┘
```

### 11.2 Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `MONGO_URL` | Backend | MongoDB connection string |
| `DB_NAME` | Backend | Database name |
| `JWT_SECRET` | Backend | JWT signing secret (min 32 chars) |
| `CORS_ORIGINS` | Backend | Allowed frontend origins |
| `AZURE_TENANT_ID` | Backend | Azure AD tenant (for SSO) |
| `AZURE_CLIENT_ID` | Backend | Azure AD app client ID |
| `AZURE_CLIENT_SECRET` | Backend | Azure AD app secret |
| `REACT_APP_BACKEND_URL` | Frontend | API base URL |

---

## 12. SSO Integration Readiness

### 12.1 Planned Architecture

```
User                 Frontend           Backend            Azure AD
 │                      │                  │                  │
 │ 1. Click "Sign in    │                  │                  │
 │    with Organisation"│                  │                  │
 │ ──────────────────>  │                  │                  │
 │                      │ 2. Redirect to   │                  │
 │                      │    Azure AD      │                  │
 │ <──────────────────  │    login page    │                  │
 │                      │                  │                  │
 │ 3. Login with        │                  │                  │
 │    @in.gt.com creds  │                  │                  │
 │ ─────────────────────────────────────────────────────────> │
 │                      │                  │                  │
 │ 4. Redirect back     │                  │                  │
 │    with auth code    │                  │                  │
 │ ──────────────────>  │                  │                  │
 │                      │ 5. Exchange code  │                  │
 │                      │    for token     │                  │
 │                      │ ──────────────>  │                  │
 │                      │                  │ 6. Token exchange │
 │                      │                  │ ───────────────> │
 │                      │                  │ <─── ID token    │
 │                      │                  │                  │
 │                      │                  │ 7. Microsoft     │
 │                      │                  │    Graph API:    │
 │                      │                  │    GET /me       │
 │                      │                  │ ───────────────> │
 │                      │                  │ <── User profile │
 │                      │                  │    (name, email, │
 │                      │                  │     jobTitle,    │
 │                      │                  │     department,  │
 │                      │                  │     office...)   │
 │                      │                  │                  │
 │                      │ 8. Create/update │                  │
 │                      │    user + JWT    │                  │
 │                      │ <──────────────  │                  │
 │ <──────────────────  │                  │                  │
 │   Logged in          │                  │                  │
```

### 12.2 Auto-Fill Mapping (Graph API → Platform Fields)

| Graph API Field | Platform Field | Notes |
|----------------|---------------|-------|
| `displayName` | `name` | Read-only after SSO |
| `mail` | `email` | Read-only after SSO |
| `jobTitle` | `designation` | Auto-populated |
| `department` | `business_unit` | Auto-populated |
| `officeLocation` | `location` | Auto-populated |
| `employeeId` | `employee_id` | For internal tracking |
| Custom extension | `tier` | Requires Azure AD customization |
| Custom extension | `region` | Requires Azure AD customization |
| Custom extension | `competency` | Requires Azure AD customization |

### 12.3 Requirements from IT Team
1. Azure AD App Registration (Tenant ID, Client ID, Client Secret)
2. Microsoft Graph API permissions: `User.Read`, `profile`, `email`, `openid`
3. Optional: Custom extension attributes for tier/region/competency

---

## 13. Non-Functional Requirements

| Requirement | Target | Current Status |
|-------------|--------|----------------|
| Response Time | <500ms for API calls | Met |
| Concurrent Users | 100+ simultaneous | Supported (async) |
| Uptime | 99.5% | Dependent on hosting |
| Data Backup | Daily automated | Via MongoDB Atlas/Cosmos |
| Session Security | JWT with 24h expiry | Implemented |
| Password Security | bcrypt hashed | Implemented |
| CORS | Configurable whitelist | Implemented |
| Mobile Responsive | All screens | Implemented |
| Browser Support | Chrome, Edge, Firefox | Verified |
| Accessibility | WCAG 2.1 AA | Partial |
| Data Retention | As per GT policy | Configurable |
| Audit Log | API access logs | Via Application Insights |

---

*Document prepared for Grant Thornton India — Elevate Platform*
*For questions: Contact People & Culture / Talent Development team*
