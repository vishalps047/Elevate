# ELEVATE Platform — Application Architecture
### Grant Thornton India | On-Premises VM Deployment
**Version:** 1.0 | **Date:** May 2026

---

## 1. Application Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ELEVATE SERVER (Ubuntu Pro 22.04)                │
│                     4 vCPU | 16 GB RAM | 100 GB SSD                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        NGINX (Port 443/80)                    │   │
│  │              Reverse Proxy | SSL Termination                  │   │
│  │              Static File Serving | Rate Limiting              │   │
│  │                                                               │   │
│  │    /            →  React Static Build (HTML/JS/CSS)           │   │
│  │    /api/*       →  Proxy to FastAPI (127.0.0.1:8001)          │   │
│  │    /api/uploads →  Serve from /var/elevate/uploads            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│              ┌───────────────┴───────────────┐                      │
│              │                               │                      │
│  ┌───────────┴──────────┐   ┌────────────────┴─────────────────┐   │
│  │   FRONTEND           │   │   BACKEND                        │   │
│  │                      │   │                                   │   │
│  │   React.js 19        │   │   FastAPI (Python 3.11)           │   │
│  │   Tailwind CSS 3     │   │   Uvicorn (4 workers)             │   │
│  │   Shadcn/UI          │   │   Port: 8001 (localhost only)     │   │
│  │   Recharts 3         │   │                                   │   │
│  │   React Router 7     │   │   ┌─────────────────────────┐     │   │
│  │                      │   │   │  API Routes (8 modules)  │     │   │
│  │   Served as static   │   │   │  • auth.py               │     │   │
│  │   build by Nginx     │   │   │  • coaches.py            │     │   │
│  │                      │   │   │  • requests.py           │     │   │
│  │   Build output:      │   │   │  • sessions.py           │     │   │
│  │   /frontend/build/   │   │   │  • admin.py              │     │   │
│  │                      │   │   │  • registrations.py      │     │   │
│  └──────────────────────┘   │   │  • emails.py             │     │   │
│                              │   │  • notifications.py      │     │   │
│                              │   └─────────────────────────┘     │   │
│                              │                                   │   │
│                              │   ┌─────────────────────────┐     │   │
│                              │   │  Background Services     │     │   │
│                              │   │  (asyncio event loop)    │     │   │
│                              │   │  • Session reminders     │     │   │
│                              │   │  • Auto-complete past    │     │   │
│                              │   │  • Email triggers        │     │   │
│                              │   └─────────────────────────┘     │   │
│                              │                                   │   │
│                              │   ┌─────────────────────────┐     │   │
│                              │   │  Security Layer          │     │   │
│                              │   │  • JWT Auth (HS256, 8h)  │     │   │
│                              │   │  • bcrypt passwords      │     │   │
│                              │   │  • Rate limiting         │     │   │
│                              │   │  • Input sanitization    │     │   │
│                              │   │  • OWASP security hdrs   │     │   │
│                              │   │  • Audit logging         │     │   │
│                              │   └─────────────────────────┘     │   │
│                              └───────────────┬───────────────────┘   │
│                                              │                       │
│  ┌───────────────────────────────────────────┴──────────────────┐   │
│  │                    MONGODB 7.0 (Port 27017)                   │   │
│  │                    localhost only | No auth*                   │   │
│  │                                                               │   │
│  │    Database: elevate_db                                       │   │
│  │                                                               │   │
│  │    ┌────────────┐ ┌──────────────────┐ ┌──────────────┐      │   │
│  │    │   users     │ │coaching_requests │ │   sessions   │      │   │
│  │    │ (270 docs)  │ │                  │ │              │      │   │
│  │    └────────────┘ └──────────────────┘ └──────────────┘      │   │
│  │    ┌────────────┐ ┌──────────────────┐ ┌──────────────┐      │   │
│  │    │  feedback   │ │     emails       │ │notifications │      │   │
│  │    └────────────┘ └──────────────────┘ └──────────────┘      │   │
│  │    ┌────────────┐ ┌──────────────────┐ ┌──────────────┐      │   │
│  │    │ coach_     │ │   scheduled_     │ │registrations │      │   │
│  │    │availability│ │   reminders      │ │              │      │   │
│  │    └────────────┘ └──────────────────┘ └──────────────┘      │   │
│  │                                                               │   │
│  │    * Enable MongoDB auth for production hardening             │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     FILE STORAGE                               │  │
│  │    /var/elevate/uploads/    Profile photos (avatars)           │  │
│  │    /var/backups/elevate/    Daily DB dumps (30-day retention)  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     SYSTEM SERVICES                            │  │
│  │    systemd         Process management (elevate-backend)       │  │
│  │    UFW             Firewall (443, 80, 22 only)                │  │
│  │    fail2ban        Brute force protection                     │  │
│  │    cron            Daily backups (2 AM) + health checks (5m)  │  │
│  │    logrotate       Log rotation (30-day retention)            │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    Outbound HTTPS (443)
                              │
              ┌───────────────┴───────────────┐
              │       EXTERNAL SERVICES        │
              │                                │
              │  Azure Active Directory        │
              │  ├─ login.microsoftonline.com  │
              │  ├─ graph.microsoft.com        │
              │  └─ SSO + Employee Auto-fill   │
              │                                │
              │  SMTP (Future)                 │
              │  └─ Real email delivery        │
              └────────────────────────────────┘
```

---

## 2. Technology Stack Summary

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| **OS** | Ubuntu Pro | 22.04 LTS | Server operating system |
| **Web Server** | Nginx | 1.24+ | Reverse proxy, SSL, static files, rate limiting |
| **Backend** | Python + FastAPI | 3.11 + 0.110 | REST API server |
| **ASGI Server** | Uvicorn | Latest | 4 async workers |
| **Frontend** | React.js | 19.x | Single-page application |
| **CSS** | Tailwind CSS | 3.x | Utility-first styling |
| **UI Components** | Shadcn/UI | Latest | Component library |
| **Charts** | Recharts | 3.x | MIS dashboard visualizations |
| **Database** | MongoDB Community | 7.0 | Document database |
| **DB Driver** | Motor (async) | 3.5 | Non-blocking MongoDB driver |
| **Auth** | PyJWT + bcrypt | 2.12 + 4.1 | Token auth + password hashing |
| **Process Mgmt** | systemd | Built-in | Service management |
| **Firewall** | UFW | Built-in | Network security |
| **SSL** | Certbot / Corp CA | Latest | TLS certificates |

---

## 3. Data Flow

### 3.1 User Request Flow

```
User Browser
    │
    │  HTTPS (443)
    ▼
┌─────────┐     Static files (/, /static)     ┌──────────────┐
│  Nginx   │ ─────────────────────────────────→ │ React Build  │
│  (SSL)   │                                    │ (HTML/JS/CSS)│
│          │     API calls (/api/*)             └──────────────┘
│          │ ──────────────────────┐
└─────────┘                       │
                                  ▼
                          ┌──────────────┐
                          │   FastAPI     │
                          │   (Uvicorn)   │
                          │   Port 8001   │
                          └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌──────────┐ ┌─────────┐ ┌──────────┐
              │ MongoDB  │ │  File   │ │ Azure AD │
              │ (27017)  │ │ Storage │ │  (SSO)   │
              └──────────┘ └─────────┘ └──────────┘
```

### 3.2 Authentication Flow (Current: JWT | Future: SSO)

```
Current (JWT):
  Login → bcrypt verify → Issue JWT (8h) → Token in requests

Future (SSO):
  Browser → Azure AD login → Auth code → Server exchanges for token
  → Microsoft Graph API fetches employee profile → Auto-create user
  → Issue JWT → Token in requests
```

---

## 4. Database Collections

| Collection | Records | Purpose | Key Indexes |
|------------|---------|---------|-------------|
| `users` | ~270 | Coaches, coachees, admin | email (unique), role |
| `coaching_requests` | Dynamic | Coach-coachee matching | coachee_id, active_coach_id |
| `sessions` | Dynamic | Individual coaching sessions | request_id, coach_id, coachee_id |
| `feedback` | Dynamic | Post-journey feedback | request_id |
| `emails` | Dynamic | Simulated email inbox | to_user_id |
| `notifications` | Dynamic | In-app notifications | user_id |
| `coach_availability` | Dynamic | Daily time slots | (coach_id, date) compound |
| `scheduled_reminders` | Dynamic | Reminder queue | deliver_at (partial) |
| `registrations` | Dynamic | Pending approvals | status |

---

## 5. API Module Map

| Module | Route Prefix | Endpoints | Auth Required |
|--------|-------------|-----------|---------------|
| **auth** | `/api/auth` | login, me, profile, avatar | Mixed |
| **coaches** | `/api/coaches` | list, expertise-options, availability | Yes |
| **requests** | `/api/requests` | create, accept, decline, complete, feedback | Yes |
| **sessions** | `/api/sessions` | schedule, complete, notes | Yes |
| **admin** | `/api/admin` | stats, coaches, coachees, mis, trends, expertise-edit | Admin only |
| **registrations** | `/api/registrations` | submit, approve, reject | Mixed |
| **emails** | `/api/emails` | list, mark-read, mark-all-read | Yes |
| **notifications** | `/api/notifications` | list, mark-read, mark-all-read | Yes |
| **public** | `/api/public` | stats | No |

**Total: 30+ API endpoints across 9 modules**

---

## 6. Port & Service Map

```
┌────────────────────────────────────────────────┐
│              ELEVATE SERVER                      │
│                                                  │
│   Port 443  ── Nginx (HTTPS)     ── EXPOSED     │
│   Port 80   ── Nginx (redirect)  ── EXPOSED     │
│   Port 22   ── SSH               ── ADMIN ONLY  │
│   Port 8001 ── FastAPI/Uvicorn   ── LOCALHOST    │
│   Port 27017── MongoDB           ── LOCALHOST    │
│                                                  │
│   Outbound 443 → Azure AD (SSO)                 │
└────────────────────────────────────────────────┘
```

---

## 7. Backup & Recovery

| What | How | Schedule | Retention |
|------|-----|----------|-----------|
| MongoDB dump | `mongodump --gzip` | Daily 2 AM (cron) | 30 days |
| Upload files | `tar -czf` | Daily 2 AM (cron) | 30 days |
| Full VM snapshot | VM-level snapshot | Weekly (manual/policy) | 4 weeks |

---

## 8. Monitoring

| What | Tool | Location |
|------|------|----------|
| Backend logs | journalctl | `journalctl -u elevate-backend` |
| Nginx access | log file | `/var/log/nginx/elevate.access.log` |
| Nginx errors | log file | `/var/log/nginx/elevate.error.log` |
| MongoDB slow queries | mongod log | `/var/log/mongodb/mongod.log` |
| Health check | cron script | Every 5 min, auto-restarts if down |
| Disk usage | cron alert | Alert if >80% usage |

---

*Document prepared for Grant Thornton India — ELEVATE Platform*
*DevOps & Infrastructure Reference — May 2026*
