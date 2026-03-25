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
│   ├── server.py              # FastAPI app + background tasks (reminders + auto-complete)
│   ├── database.py            # MongoDB connection
│   ├── models.py              # Pydantic models
│   ├── helpers.py             # Notifications, reminders, auto-complete past sessions
│   ├── seed.py                # DB seeding (users, past journey, availability, feedback)
│   └── routes/
│       ├── auth.py            # Login (bcrypt), JWT, get_current_user
│       ├── coaches.py         # List coaches + availability CRUD
│       ├── requests.py        # Coaching requests + accept/decline/complete/feedback/pause/restart
│       ├── sessions.py        # Session CRUD with availability checking + complete
│       ├── notifications.py   # Notifications read/read-all
│       └── admin.py           # Admin analytics (stats, coaches, coachees, trends, user history)
└── frontend/src/
    ├── services/api.js
    ├── context/AppContext.js
    ├── components/ (CoachCard, RequestWizard, SessionComponents, Navbar, etc.)
    └── pages/ (LoginPage, CoacheeDashboard, CoachesPage, CoachDashboard, SessionsPage, AdminDashboard)
```

## Seeded Accounts (password: password123)
- Coachees: sarah@elevate.com, alex@elevate.com
- Coaches: fatema, vaishali, gaurav, ajay, amina, rajesh @elevate.com
- Admin: admin@elevate.com

## Completed Features
1. JWT Auth with bcrypt password hashing + role-based routing
2. 3-Preference Coach Selection with cascading decline
3. Coach Availability Calendar - coaches manage dates/times
4. Session Scheduling - checks availability, marks slots booked, schedules reminders
5. Session Auto-Complete - background task auto-completes past sessions + demo Complete button
6. Journey Completion (demo button) + Structured Feedback Form (Q1-Q5)
7. Journey Lock - coachee blocked until journey + feedback complete
8. Editable Total Sessions - coach can adjust session count
9. Pause/Restart Journey - coaches pause/restart, coachees notified, scheduling disabled
10. Notification System - real-time polling, auto-created on key events
11. Background Reminder Task - session reminders (2d, 1d, 1h before)
12. Rating Visibility - admin only
13. Sessions Completed Stat - cumulative count across all journeys
14. Uniform Coach Cards - consistent height/alignment, reduced banner
15. SSO Placeholder - "Sign in with Organisation (SSO)" button ready for Outlook integration
16. Security Hardening - bcrypt hashing, JWT_SECRET from env (no fallbacks), password excluded from responses
17. Admin Dashboard (Full) - real API data: key metrics, coach utilization charts, request trends, expertise distribution, top coaches by feedback, drill-down user history modal

## API Endpoints
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user
- `GET /api/coaches` - List all coaches
- `GET /api/coaches/{id}/availability` - Coach availability
- `POST /api/coaches/availability` - Set availability
- `POST /api/requests` - Create coaching request
- `GET /api/requests/active` - Get active request
- `PUT /api/requests/{id}/accept` - Accept request (coach)
- `PUT /api/requests/{id}/decline` - Decline request (coach)
- `PUT /api/requests/{id}/complete-journey` - Complete journey
- `POST /api/requests/{id}/feedback` - Submit structured feedback (Q1-Q5)
- `PUT /api/requests/{id}/pause` - Pause journey (coach)
- `PUT /api/requests/{id}/restart` - Restart journey (coach)
- `PUT /api/requests/{id}/total-sessions` - Update total sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions/schedule` - Schedule session
- `PUT /api/sessions/{id}/complete` - Complete session (demo)
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/read-all` - Mark all read
- `GET /api/admin/stats` - Platform analytics
- `GET /api/admin/coaches` - All coaches with ratings
- `GET /api/admin/coachees` - All coachees with analytics
- `GET /api/admin/trends` - Charts data (utilization, trends, distribution)
- `GET /api/admin/users/{id}/history` - User drill-down (sessions, journeys, feedback)

## Upcoming Tasks
- SSO Integration with Outlook (Organisation Login)
- External Calendar Integration (Outlook sync)
- Email Notifications
- Profile Editing
