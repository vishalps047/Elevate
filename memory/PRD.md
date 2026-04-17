# ELEVATE Coaching Platform - PRD

## Overview
Role-based digital coaching platform for Grant Thornton, connecting employees (Coachees) with certified internal Coaches.

## Tech Stack
- Frontend: React.js + Tailwind CSS + Shadcn UI + Recharts
- Backend: FastAPI (Python) + Motor (async MongoDB)
- Database: MongoDB
- Auth: JWT (PyJWT) + bcrypt password hashing

## Architecture
```
/app
├── backend/
│   ├── server.py              # FastAPI app + background tasks + public stats
│   ├── database.py            # MongoDB connection
│   ├── models.py              # Pydantic models
│   ├── helpers.py             # Notifications, reminders, auto-complete
│   ├── seed.py                # DB seeding (users with org profiles, journeys, feedback)
│   └── routes/
│       ├── auth.py            # Login (bcrypt), JWT, get_current_user
│       ├── coaches.py         # List coaches + availability CRUD
│       ├── requests.py        # Coaching requests + accept/decline/complete/feedback/pause/restart
│       ├── sessions.py        # Session CRUD + complete + session notes
│       ├── notifications.py   # Notifications read/read-all
│       ├── admin.py           # Admin analytics (stats, coaches, coachees, trends, user history, MIS)
│       └── registrations.py   # Registration submission + admin approval/rejection
└── frontend/src/
    ├── services/api.js
    ├── context/AppContext.js
    ├── components/ (CoachCard, RegistrationForm, RequestWizard, SessionComponents, Navbar)
    └── pages/ (LoginPage, CoacheeDashboard, CoachesPage, CoachDashboard, SessionsPage, AdminDashboard)
```

## Seeded Accounts (password: password123)
- Coachees: sarah@elevate.com (T2, MUM, Audit), alex@elevate.com (T3, DEL, ESG)
- Coaches: fatema, vaishali, gaurav, ajay, amina, rajesh @elevate.com
- Admin: admin@elevate.com

## Completed Features
1. JWT Auth with bcrypt + role-based routing
2. 3-Preference Coach Selection with cascading decline
3. Coach Availability Calendar
4. Session Scheduling with availability checks + reminders
5. Session Auto-Complete background task + demo Complete button
6. Journey Completion + Structured Feedback Form (Q1-Q5)
7. Journey Lock until feedback complete
8. Editable Total Sessions
9. Pause/Restart Journey with coachee notifications
10. Notification System (polling-based)
11. Background Reminder Task (2d, 1d, 1h)
12. Admin-only rating visibility
13. Cumulative Sessions Completed stat
14. Uniform Coach Cards with reduced banner
15. SSO Placeholder (Outlook)
16. Security Hardening (bcrypt, JWT_SECRET, no fallbacks)
17. Admin Dashboard (stats, charts, trends, top coaches, drill-down)
18. Registration System (Coach/Coachee forms, admin approval, coach nomination)
19. Coachee Profile in Coach Requests (tier, designation, BU, location, competency, enrolment reason)
20. Session Notes (add/view notes on completed sessions)
21. Homepage Stats (public coach/coachee/session counts)
22. Admin MIS Reports (coach occupancy, coachee status, location/BU distribution, nomination breakdown)
23. Demo Login Buttons (one-click Coach/Coachee/Admin login for demos)
24. Profile Editing (edit profile photo + role-specific fields, Name/Email locked)
25. Demo Email Inbox (simulated email notifications with 16 Elevate templates, Mail icon in Navbar)
26. Expanded user base: 6 coaches, 6 coachees, 1 admin (all @in.gt.com domain)
27. Auto-triggered emails at key events (registration approve/reject, coach request, accept/decline, journey complete) with gender-aware pronouns

## Key API Endpoints
### Public
- `GET /api/public/stats` - Coach/coachee/session counts (no auth)

### Auth
- `POST /api/auth/login` | `GET /api/auth/me`
- `PUT /api/auth/profile` - Update profile fields (role-restricted)
- `POST /api/auth/avatar` - Upload profile photo (returns URL)

### Emails (Demo Inbox)
- `GET /api/emails` - Get emails for current user
- `PUT /api/emails/{id}/read` - Mark email as read
- `PUT /api/emails/read-all` - Mark all emails as read

### Registrations (no auth for POST, admin for GET/PUT)
- `POST /api/registrations` - Submit registration
- `GET /api/registrations?status=pending` - List registrations
- `PUT /api/registrations/{id}/approve` - Approve (creates user account)
- `PUT /api/registrations/{id}/reject` - Reject

### Coaches
- `GET /api/coaches` | `GET /api/coaches/{id}/availability` | `POST /api/coaches/availability`

### Requests
- `POST /api/requests` | `GET /api/requests/active`
- `PUT /api/requests/{id}/accept|decline|complete-journey|pause|restart|total-sessions`
- `POST /api/requests/{id}/feedback`

### Sessions
- `GET /api/sessions` | `POST /api/sessions/schedule` | `PUT /api/sessions/{id}/complete`
- `POST /api/sessions/{id}/notes` | `GET /api/sessions/{id}/notes`

### Admin (admin role only)
- `GET /api/admin/stats|coaches|coachees|trends|mis`
- `GET /api/admin/users/{id}/history`

### Notifications
- `GET /api/notifications` | `PUT /api/notifications/read-all`

## Upcoming Tasks
- SSO Integration with Outlook (Organisation Login)
- External Calendar Integration (Outlook sync)
- Email Notifications
