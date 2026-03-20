# ELEVATE Coaching Platform - PRD

## Overview
A comprehensive role-based digital coaching platform for Grant Thornton, connecting employees (Coachees) with certified internal Coaches.

## Tech Stack
- Frontend: React.js + Tailwind CSS + Shadcn UI
- Backend: FastAPI (placeholder)
- Database: MongoDB (placeholder)

## Design System
- Primary: Deep Purple (HSL 271 65% 26%)
- Accent: Teal (HSL 181 65% 38%)
- Background: Light gray-lavender (HSL 240 20% 97%)
- Fonts: Space Grotesk (headings) + Inter (body)

## Pages Implemented
1. **Login Page** (/login) - Role selection: Coachee, Coach, Admin
2. **Coachee Dashboard** (/) - Stats, active coach, upcoming/past sessions
3. **Coaches Page** (/coaches) - 3-step wizard: Choose Coach -> Goals -> Review & Send
4. **Sessions Page** (/sessions) - Tabs for upcoming/completed with feedback modal
5. **Coach Dashboard** (/coach-dashboard) - Pending requests, accept/decline modal
6. **Admin Dashboard** (/admin-dashboard) - Analytics charts, coach approvals, platform stats, ratings

## Key Features
- 3-Step coaching request wizard
- Coach discovery with filters and search
- Session scheduling modal with slot picker
- Post-session feedback with star rating
- Accept/Decline request modal with "What happens next" section
- In-app notification panel with unread tracking
- Role-based navigation (auto-detects from URL)
- Analytics charts using Recharts
- **Role-based rating visibility** - Coach ratings visible ONLY to Admins
- All data is MOCKED (frontend-only prototype)

## Completed Work
- Full frontend prototype with all pages and flows (Done)
- Notification system with localStorage persistence (Done)
- Role-based rating visibility: ratings hidden from Coachee and Coach roles, visible only to Admin Dashboard (Done - Feb 2026)

## Upcoming Tasks (P1)
- Backend Integration: Replace all mocked data with live FastAPI + MongoDB APIs
  - User authentication
  - CRUD operations for coaches, sessions, requests
  - Dashboard data fetching
  - Real-time notification delivery

## Future Tasks (P2)
- External Calendar Integration (Outlook blocking when session is booked)

## Status: MVP Frontend Complete
All frontend flows functional with mock data. Backend integration pending.
