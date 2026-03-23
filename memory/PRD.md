# ELEVATE Coaching Platform - PRD

## Overview
Role-based digital coaching platform for Grant Thornton, connecting employees (Coachees) with certified internal Coaches.

## Tech Stack
- Frontend: React.js + Tailwind CSS + Shadcn UI
- Backend: FastAPI (Python) + Motor (async MongoDB)
- Database: MongoDB
- Auth: JWT (PyJWT)

## Architecture
```
/app
├── backend/
│   ├── server.py              # FastAPI app + background reminder task
│   ├── database.py            # MongoDB connection
│   ├── models.py              # Pydantic models
│   ├── helpers.py             # Notifications + session reminder scheduling
│   ├── seed.py                # DB seeding (users, past journey, availability)
│   └── routes/
│       ├── auth.py            # Login, JWT, get_current_user
│       ├── coaches.py         # List coaches + availability CRUD
│       ├── requests.py        # Coaching requests + accept/decline/complete/feedback/edit-sessions
│       ├── sessions.py        # Session CRUD with availability checking + reminders
│       └── notifications.py   # Notifications read/read-all
└── frontend/src/
    ├── services/api.js
    ├── context/AppContext.js
    ├── components/ (CoachCard, RequestWizard, SessionComponents, Navbar, etc.)
    └── pages/ (Login, CoacheeDashboard, CoachesPage, CoachDashboard, SessionsPage, AdminDashboard)
```

## Seeded Accounts (password: password123)
- Coachees: sarah@elevate.com, alex@elevate.com
- Coaches: fatema, vaishali, gaurav, ajay, amina, rajesh @elevate.com
- Admin: admin@elevate.com
- Past completed journey: Sarah with Gaurav (6 sessions)
- Coach availability: March-April 2026 weekdays

## Key Features Implemented
1. **JWT Auth** with role-based routing
2. **3-Preference Coach Selection** with cascading decline
3. **Coach Availability Calendar** - coaches manage dates/times, coachees see real availability
4. **Session Scheduling** - checks availability, marks slots booked, schedules reminders (2d, 1d, 1h)
5. **Journey Completion** (demo button) + Feedback flow
6. **Journey Lock** - coachee cannot pick new coach until journey + feedback complete
7. **Editable Total Sessions** - coach can adjust session count
8. **Notification System** - real-time via polling (15s), auto-created on key events
9. **Background Reminder Task** - checks every 60s for due session reminders
10. **Rating Visibility** - admin only

## Completed Work
- Full frontend prototype (Done)
- Rating visibility: admin only (Done)
- Backend API with FastAPI + MongoDB (Done)
- JWT auth + seeded accounts (Done)
- 3-preference cascading requests (Done)
- Session scheduling with real availability (Done)
- Coach availability calendar UI (Done)
- Editable total sessions (Done)
- Journey completion + feedback (Done)
- Past sessions in seed data (Done)
- Session reminders (2d, 1d, 1h before) (Done)
- Bug fix: session progress scoped to active request (Done)

## Upcoming Tasks (P1)
- Admin Dashboard: Replace mock data with real API calls

## Future Tasks (P2)
- External Calendar Integration (Outlook)
- Email notifications
- Profile editing
