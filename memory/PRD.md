# ELEVATE Coaching Platform - PRD

## Overview
A comprehensive role-based digital coaching platform for Grant Thornton, connecting employees (Coachees) with certified internal Coaches.

## Tech Stack
- Frontend: React.js + Tailwind CSS + Shadcn UI
- Backend: FastAPI (Python)
- Database: MongoDB (via Motor async driver)
- Auth: JWT tokens (PyJWT)

## Design System
- Primary: Deep Purple (HSL 271 65% 26%)
- Accent: Teal (HSL 181 65% 38%)
- Background: Light gray-lavender (HSL 240 20% 97%)
- Fonts: Space Grotesk (headings) + Inter (body)

## Architecture
```
/app
├── backend/
│   ├── server.py              # FastAPI app entry + router registration
│   ├── database.py            # MongoDB connection (Motor)
│   ├── models.py              # Pydantic request/response models
│   ├── helpers.py             # Notification creation utility
│   ├── seed.py                # Database seeding (9 users)
│   └── routes/
│       ├── auth.py            # POST /api/auth/login, GET /api/auth/me
│       ├── coaches.py         # GET /api/coaches, GET /api/coaches/{id}/availability
│       ├── requests.py        # CRUD + accept/decline/complete-journey/feedback
│       ├── sessions.py        # CRUD + reschedule/complete
│       └── notifications.py   # GET + mark read/read-all
└── frontend/
    └── src/
        ├── services/api.js       # Centralized API service with JWT
        ├── context/AppContext.js  # Auth state + notifications (polling)
        ├── components/
        │   ├── CoachCard.js         # Multi-select coach cards
        │   ├── RequestWizard.js     # 3-step stepper, goals form, review
        │   ├── SessionComponents.js # Session cards, schedule/reschedule modals
        │   ├── CoachFilters.js      # Expertise filter sidebar
        │   ├── Navbar.js            # Auth-aware nav + notifications
        │   ├── NotificationPanel.js # Notification dropdown
        │   └── PageHeader.js
        ├── pages/
        │   ├── LoginPage.js         # Email/password + quick demo access
        │   ├── CoacheeDashboard.js  # Journey states + feedback + completion
        │   ├── CoachesPage.js       # Coach discovery + 3-preference selection
        │   ├── CoachDashboard.js    # Pending requests + active coachees
        │   ├── SessionsPage.js      # Upcoming/completed sessions
        │   └── AdminDashboard.js    # Analytics (still uses mock data)
        └── App.js                   # Protected routes + role-based routing
```

## Seeded Accounts (password: password123)
- Coachees: sarah@elevate.com, alex@elevate.com
- Coaches: fatema@elevate.com, vaishali@elevate.com, gaurav@elevate.com, ajay@elevate.com, amina@elevate.com, rajesh@elevate.com
- Admin: admin@elevate.com

## Key Flows Implemented
### Coachee Flow
1. Login -> Dashboard (shows journey state)
2. Browse Coaches -> Select up to 3 preferences (priority 1, 2, 3)
3. Share Goals (mentorship area, goals, challenges)
4. Review & Send Request
5. Wait for coach to accept (pending state shown on dashboard)
6. Once accepted: schedule sessions, view progress
7. Click "Complete Journey (Demo)" to finish
8. Submit star rating + feedback
9. Can now find new coach

### Coach Flow
1. Login -> Dashboard shows pending requests
2. View request details (coachee info, goals)
3. Accept or Decline (decline cascades to next preference)
4. Active coachees panel with session scheduling
5. View upcoming/completed sessions

### Cascading Preference Logic
- Request sent to preference #1 first
- If declined, auto-forwarded to preference #2 with notification
- If all decline, coachee notified to submit new request

### Journey Lock
- Coachee cannot select new coach while journey is active
- Must complete journey AND submit feedback before finding new coach

## Completed Work
- Full frontend prototype with role-based UI (Done)
- Role-based rating visibility: admin only (Done - Feb 2026)
- Full backend API with FastAPI + MongoDB (Done - Feb 2026)
- JWT authentication with seeded accounts (Done)
- 3-preference cascading request system (Done)
- Session scheduling/rescheduling (Done)
- Journey completion + feedback flow (Done)
- Real-time notification system with polling (Done)
- Frontend-backend integration (Done)
- E2E testing: 22/22 backend + 19/20 frontend tests passed

## Upcoming Tasks (P1)
- Admin Dashboard: Replace mock data with real API calls (analytics, coach approvals)
- Coach-specific session availability management

## Future Tasks (P2)
- External Calendar Integration (Outlook blocking when session is booked)
- Email notifications alongside in-app notifications
- Profile editing for coaches and coachees
