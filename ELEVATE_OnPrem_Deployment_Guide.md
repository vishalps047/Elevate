# ELEVATE Platform — On-Premises Deployment Guide
### Grant Thornton India | Infrastructure Team
**Version:** 1.0 | **Date:** May 2026 | **Classification:** Internal — Confidential

---

## Table of Contents
1. [Server Hardware Specification](#1-server-hardware-specification)
2. [Software Requirements](#2-software-requirements)
3. [Network & Firewall Configuration](#3-network--firewall-configuration)
4. [Architecture Diagram (On-Prem)](#4-architecture-diagram-on-prem)
5. [Step-by-Step Installation Guide](#5-step-by-step-installation-guide)
6. [Database Setup (PostgreSQL)](#6-database-setup-postgresql)
7. [Application Deployment](#7-application-deployment)
8. [Nginx Reverse Proxy & SSL](#8-nginx-reverse-proxy--ssl)
9. [Process Management (systemd)](#9-process-management-systemd)
10. [SSO / Azure AD Configuration](#10-sso--azure-ad-configuration)
11. [Backup & Recovery](#11-backup--recovery)
12. [Monitoring & Logging](#12-monitoring--logging)
13. [Security Hardening](#13-security-hardening)
14. [Maintenance & Updates](#14-maintenance--updates)

---

## 1. Server Hardware Specification

### Production Server (500 users)

| Component | Recommended | Minimum | Notes |
|-----------|------------|---------|-------|
| **CPU** | 4 vCPU / 4 cores | 2 vCPU / 2 cores | Intel Xeon / AMD EPYC recommended |
| **RAM** | 16 GB | 8 GB | PostgreSQL + FastAPI + Node build |
| **Storage (OS + App)** | 50 GB SSD | 30 GB SSD | OS, application code, logs |
| **Storage (Database)** | 50 GB SSD | 20 GB SSD | PostgreSQL data directory |
| **Storage (Backups)** | 100 GB HDD | 50 GB HDD | Daily backup retention (30 days) |
| **Network** | 1 Gbps NIC | 100 Mbps | Internal LAN + outbound internet |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 20.04+ / RHEL 8+ | 64-bit, server edition |

### Total Disk Summary
```
OS + Application:   50 GB SSD
Database:           50 GB SSD
Backups:           100 GB HDD (or NAS mount)
Upload Storage:     10 GB SSD  (profile photos)
────────────────────────────────
Total:            ~210 GB
```

### Optional: Separate DB Server (for high availability)

| Server | CPU | RAM | Storage | Purpose |
|--------|-----|-----|---------|---------|
| **App Server** | 2 vCPU | 8 GB | 50 GB SSD | Nginx + FastAPI + React |
| **DB Server** | 2 vCPU | 8 GB | 100 GB SSD | PostgreSQL 16 |

> **Note:** For 500 users, a single server is sufficient. Separate only if IT policy requires DB isolation.

---

## 2. Software Requirements

### Required Packages

| Software | Version | Purpose |
|----------|---------|---------|
| **Ubuntu Server** | 22.04 LTS | Operating System |
| **Python** | 3.11+ | Backend runtime (FastAPI) |
| **Node.js** | 18.x LTS | Frontend build |
| **PostgreSQL** | 16.x | Database |
| **Nginx** | 1.24+ | Reverse proxy, SSL termination |
| **Certbot** | Latest | SSL certificate management (Let's Encrypt) |
| **Git** | 2.x | Code deployment |
| **Supervisor** or **systemd** | Built-in | Process management |
| **UFW** | Built-in | Firewall |
| **fail2ban** | Latest | Brute force protection |

### Python Dependencies (key packages)
```
fastapi==0.100+
uvicorn[standard]
asyncpg            # Async PostgreSQL driver
sqlalchemy[asyncio] # ORM (if used)
psycopg2-binary    # PostgreSQL adapter
pyjwt==2.12+
bcrypt==4.x
python-dotenv
pydantic==2.x
python-multipart   # File uploads
```

### Node.js Dependencies
```
react==18.x
react-router-dom==6.x
tailwindcss==3.x
recharts==2.x
```

---

## 3. Network & Firewall Configuration

### Inbound Rules (from LAN/Corporate Network)

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| **443** | TCP | Corporate LAN | HTTPS (application access) |
| **80** | TCP | Corporate LAN | HTTP → HTTPS redirect |
| **22** | TCP | Admin IPs only | SSH access (restricted) |

### Outbound Rules (server → internet)

| Destination | Port | Purpose | Required? |
|-------------|------|---------|-----------|
| `login.microsoftonline.com` | 443 | Azure AD SSO authentication | **Yes** (for SSO) |
| `graph.microsoft.com` | 443 | Microsoft Graph API (employee data) | **Yes** (for SSO auto-fill) |
| `login.windows.net` | 443 | Azure AD token endpoint | **Yes** (for SSO) |
| Ubuntu APT repos | 80/443 | OS updates, security patches | Recommended |
| PyPI (`pypi.org`) | 443 | Python package installs | During setup only |
| npm registry | 443 | Node package installs | During setup only |

### Internal Ports (localhost only — NOT exposed)

| Port | Service | Notes |
|------|---------|-------|
| 8001 | FastAPI Backend | Bound to 127.0.0.1 only |
| 5432 | PostgreSQL | Bound to 127.0.0.1 only |

### DNS Configuration
```
elevate.in.gt.com  →  A record  →  <server-internal-IP>
```
Or if behind corporate load balancer/proxy:
```
elevate.in.gt.com  →  CNAME  →  <load-balancer-address>
```

---

## 4. Architecture Diagram (On-Prem)

```
                    Corporate Network
                         │
                    ┌────┴────┐
                    │ DNS /   │
                    │ Load    │
                    │ Balancer│
                    └────┬────┘
                         │ :443 (HTTPS)
                         │
              ┌──────────┴──────────┐
              │    ELEVATE SERVER   │
              │   Ubuntu 22.04 LTS  │
              │                     │
              │  ┌───────────────┐  │
              │  │    Nginx      │  │   :443 → SSL termination
              │  │  (port 443)   │  │   /     → React static files
              │  │               │  │   /api  → proxy to :8001
              │  └───────┬───────┘  │
              │          │          │
              │    ┌─────┴─────┐    │
              │    │           │    │
              │  ┌─┴──┐  ┌────┴─┐  │
              │  │React│  │FastAPI│  │
              │  │Build│  │:8001 │  │
              │  │(static)│(4 workers)│
              │  └────┘  └───┬───┘  │
              │              │      │
              │         ┌────┴────┐ │
              │         │PostgreSQL│ │
              │         │ :5432   │ │
              │         │(local)  │ │
              │         └─────────┘ │
              │                     │
              │  ┌───────────────┐  │
              │  │ /var/uploads  │  │   Profile photos
              │  │ /var/backups  │  │   Daily DB dumps
              │  │ /var/log      │  │   Application logs
              │  └───────────────┘  │
              │                     │
              └─────────────────────┘
                         │
                    Outbound :443
                         │
              ┌──────────┴──────────┐
              │   Azure AD / Graph  │
              │ (SSO Authentication)│
              └─────────────────────┘
```

---

## 5. Step-by-Step Installation Guide

### 5.1 OS Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential software-properties-common

# Set timezone (India)
sudo timedatectl set-timezone Asia/Kolkata

# Set hostname
sudo hostnamectl set-hostname elevate-server
```

### 5.2 Install Python 3.11
```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt install -y python3.11 python3.11-venv python3.11-dev
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Verify
python3 --version  # Should show 3.11.x
```

### 5.3 Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install yarn
sudo npm install -g yarn

# Verify
node --version   # Should show v18.x
yarn --version
```

### 5.4 Install PostgreSQL 16
```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Verify
sudo systemctl status postgresql
psql --version  # Should show 16.x
```

### 5.5 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 5.6 Install Certbot (for SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.7 Install Security Tools
```bash
sudo apt install -y fail2ban ufw
```

---

## 6. Database Setup (PostgreSQL)

### 6.1 Create Database & User
```bash
sudo -u postgres psql

# Inside PostgreSQL shell:
CREATE USER elevate WITH PASSWORD '<STRONG_PASSWORD_HERE>';
CREATE DATABASE elevate_db OWNER elevate;
GRANT ALL PRIVILEGES ON DATABASE elevate_db TO elevate;

# Enable UUID extension
\c elevate_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

### 6.2 Configure PostgreSQL
```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```
Key settings:
```ini
# Connection
listen_addresses = 'localhost'       # Only local connections
port = 5432
max_connections = 100

# Memory (for 16 GB RAM server)
shared_buffers = 4GB                 # 25% of RAM
effective_cache_size = 12GB          # 75% of RAM
work_mem = 64MB
maintenance_work_mem = 512MB

# WAL / Write performance
wal_buffers = 64MB
checkpoint_completion_target = 0.9

# Logging
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_min_duration_statement = 500     # Log slow queries (>500ms)
```

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```
```
# Only allow local connections
local   all   elevate   md5
host    all   elevate   127.0.0.1/32   md5
```

```bash
sudo systemctl restart postgresql
```

### 6.3 Database Schema

The application will auto-create tables on first run, but here's the schema for reference:

```sql
-- Users (coaches, coachees, admin)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('coach', 'coachee', 'admin')),
    gender VARCHAR(20),
    tier VARCHAR(10),
    designation VARCHAR(255),
    location VARCHAR(100),
    region VARCHAR(50),
    business_unit VARCHAR(255),
    competency VARCHAR(255),
    employee_status VARCHAR(50) DEFAULT 'Active',
    avatar VARCHAR(500),
    -- Coach-specific
    title VARCHAR(255),
    capacity INTEGER DEFAULT 0,
    total_work_experience INTEGER DEFAULT 0,
    coaching_expertise VARCHAR(255),
    experience VARCHAR(50),
    rating DECIMAL(3,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    expertise TEXT[],          -- Array of strings
    domains TEXT[],
    certifications TEXT[],
    about TEXT,
    slots_available INTEGER DEFAULT 0,
    slots_total INTEGER DEFAULT 0,
    -- Coachee-specific
    job_title VARCHAR(255),
    department VARCHAR(255),
    date_of_joining DATE,
    enrolment_type VARCHAR(100),
    reason_for_enrolment TEXT,
    co_supercoach VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaching Requests
CREATE TABLE coaching_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coachee_id UUID REFERENCES users(id),
    coachee_name VARCHAR(255),
    coachee_avatar VARCHAR(500),
    status VARCHAR(30) DEFAULT 'pending',
    active_coach_id UUID REFERENCES users(id),
    goals TEXT,
    challenges TEXT,
    previous_exp TEXT,
    notes TEXT,
    mentorship_area VARCHAR(255),
    total_sessions INTEGER DEFAULT 6,
    journey_completed BOOLEAN DEFAULT FALSE,
    feedback_submitted BOOLEAN DEFAULT FALSE,
    preferences JSONB,         -- Array of coach preferences
    coachee_profile JSONB,
    current_preference_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES coaching_requests(id),
    coach_id UUID REFERENCES users(id),
    coachee_id UUID REFERENCES users(id),
    coach_name VARCHAR(255),
    coachee_name VARCHAR(255),
    date DATE NOT NULL,
    time VARCHAR(20),
    duration INTEGER DEFAULT 60,
    topic VARCHAR(500),
    session_number INTEGER,
    total_sessions INTEGER DEFAULT 6,
    status VARCHAR(20) DEFAULT 'upcoming',
    notes TEXT,
    meeting_link VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES coaching_requests(id),
    coachee_id UUID REFERENCES users(id),
    coach_id UUID REFERENCES users(id),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    coach_rating INTEGER CHECK (coach_rating BETWEEN 1 AND 5),
    learning_outcomes JSONB,
    most_valuable TEXT,
    suggestions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails (simulated inbox)
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    to_email VARCHAR(255),
    to_user_id UUID REFERENCES users(id),
    cc TEXT[],
    subject VARCHAR(500),
    body TEXT,
    preview VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    avatar VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach Availability
CREATE TABLE coach_availability (
    id SERIAL PRIMARY KEY,
    coach_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    day_label VARCHAR(50),
    slots TEXT[],
    booked_slots TEXT[],
    UNIQUE(coach_id, date)
);

-- Scheduled Reminders
CREATE TABLE scheduled_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    deliver_at TIMESTAMPTZ,
    delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations (pending approval)
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    tier VARCHAR(10),
    designation VARCHAR(255),
    location VARCHAR(100),
    business_unit VARCHAR(255),
    competency VARCHAR(255),
    date_of_joining DATE,
    enrolment_type VARCHAR(100),
    reason_for_enrolment TEXT,
    gender VARCHAR(20),
    co_supercoach VARCHAR(255),
    nominated_by VARCHAR(255),
    nominated_by_email VARCHAR(255),
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    rejected_at TIMESTAMPTZ,
    rejected_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_requests_coachee ON coaching_requests(coachee_id);
CREATE INDEX idx_requests_coach ON coaching_requests(active_coach_id);
CREATE INDEX idx_sessions_request ON sessions(request_id);
CREATE INDEX idx_sessions_coach ON sessions(coach_id);
CREATE INDEX idx_sessions_coachee ON sessions(coachee_id);
CREATE INDEX idx_feedback_request ON feedback(request_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_emails_user ON emails(to_user_id);
CREATE INDEX idx_availability_coach_date ON coach_availability(coach_id, date);
CREATE INDEX idx_reminders_deliver ON scheduled_reminders(deliver_at) WHERE NOT delivered;
```

---

## 7. Application Deployment

### 7.1 Create Application User
```bash
sudo useradd -m -s /bin/bash elevate
sudo mkdir -p /opt/elevate
sudo chown elevate:elevate /opt/elevate
```

### 7.2 Clone Application
```bash
sudo -u elevate bash
cd /opt/elevate
git clone <YOUR_GITHUB_REPO_URL> app
cd app
```

### 7.3 Backend Setup
```bash
cd /opt/elevate/app/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://elevate:<DB_PASSWORD>@localhost:5432/elevate_db
DB_NAME=elevate_db
JWT_SECRET=<GENERATE_64_CHAR_SECRET>
CORS_ORIGINS=https://elevate.in.gt.com
AZURE_TENANT_ID=<FROM_IT_TEAM>
AZURE_CLIENT_ID=<FROM_IT_TEAM>
AZURE_CLIENT_SECRET=<FROM_IT_TEAM>
EOF
```

> **Generate JWT_SECRET:** `python3 -c "import secrets; print(secrets.token_hex(32))"`

### 7.4 Frontend Build
```bash
cd /opt/elevate/app/frontend

# Create .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://elevate.in.gt.com
EOF

# Install dependencies and build
yarn install
yarn build

# The build output is in /opt/elevate/app/frontend/build/
```

### 7.5 Create Upload Directory
```bash
sudo mkdir -p /var/elevate/uploads
sudo chown elevate:elevate /var/elevate/uploads
```

---

## 8. Nginx Reverse Proxy & SSL

### 8.1 SSL Certificate

**Option A: Internal CA (if GT has corporate CA)**
```bash
# Place certificates at:
/etc/ssl/certs/elevate.in.gt.com.crt
/etc/ssl/private/elevate.in.gt.com.key
```

**Option B: Let's Encrypt (if server has public DNS)**
```bash
sudo certbot --nginx -d elevate.in.gt.com
```

### 8.2 Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/elevate
```

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

# Upstream backend
upstream elevate_backend {
    server 127.0.0.1:8001;
    keepalive 32;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name elevate.in.gt.com;
    return 301 https://$host$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name elevate.in.gt.com;

    # SSL
    ssl_certificate     /etc/ssl/certs/elevate.in.gt.com.crt;
    ssl_certificate_key /etc/ssl/private/elevate.in.gt.com.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Request size limit
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    # API routes → FastAPI backend
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://elevate_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # Login rate limiting (stricter)
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://elevate_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded files
    location /api/uploads/ {
        alias /var/elevate/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # React frontend (static files)
    location / {
        root /opt/elevate/app/frontend/build;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Static assets (long cache)
    location /static/ {
        root /opt/elevate/app/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Access & error logs
    access_log /var/log/nginx/elevate.access.log;
    error_log  /var/log/nginx/elevate.error.log;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/elevate /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. Process Management (systemd)

### 9.1 Backend Service
```bash
sudo nano /etc/systemd/system/elevate-backend.service
```

```ini
[Unit]
Description=ELEVATE FastAPI Backend
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=elevate
Group=elevate
WorkingDirectory=/opt/elevate/app/backend
Environment="PATH=/opt/elevate/app/backend/venv/bin"
ExecStart=/opt/elevate/app/backend/venv/bin/uvicorn server:app \
    --host 127.0.0.1 \
    --port 8001 \
    --workers 4 \
    --access-log \
    --log-level info
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 9.2 Enable & Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable elevate-backend
sudo systemctl start elevate-backend

# Check status
sudo systemctl status elevate-backend
sudo journalctl -u elevate-backend -f  # Follow logs
```

---

## 10. SSO / Azure AD Configuration

### 10.1 Prerequisites from IT Team
| Item | Where to get it |
|------|----------------|
| **Tenant ID** | Azure Portal → Azure Active Directory → Overview |
| **Client ID** | Azure Portal → App Registrations → ELEVATE app → Overview |
| **Client Secret** | Azure Portal → App Registrations → ELEVATE app → Certificates & Secrets |
| **Redirect URI** | Set to: `https://elevate.in.gt.com/api/auth/sso/callback` |

### 10.2 Azure AD App Registration (IT team does this)
1. Go to Azure Portal → Azure Active Directory → App Registrations → New Registration
2. Name: `ELEVATE Coaching Platform`
3. Supported account types: "Accounts in this organizational directory only"
4. Redirect URI: `https://elevate.in.gt.com/api/auth/sso/callback` (Web)
5. API Permissions → Add:
   - `openid` (delegated)
   - `profile` (delegated)
   - `email` (delegated)
   - `User.Read` (delegated)
6. Grant admin consent

### 10.3 Outbound Connectivity Required
The server must be able to reach these Azure endpoints:
```
login.microsoftonline.com:443
graph.microsoft.com:443
login.windows.net:443
```

Test connectivity:
```bash
curl -s -o /dev/null -w "%{http_code}" https://login.microsoftonline.com
# Should return 200
```

---

## 11. Backup & Recovery

### 11.1 Automated Daily Database Backup
```bash
sudo nano /opt/elevate/backup.sh
```

```bash
#!/bin/bash
# ELEVATE Database Backup Script
BACKUP_DIR="/var/backups/elevate"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Dump database
PGPASSWORD="<DB_PASSWORD>" pg_dump -h localhost -U elevate elevate_db \
    --format=custom --compress=9 \
    -f "$BACKUP_DIR/elevate_db_$TIMESTAMP.dump"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" /var/elevate/uploads/

# Remove old backups
find $BACKUP_DIR -name "*.dump" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "$(date): Backup completed - elevate_db_$TIMESTAMP.dump" >> /var/log/elevate-backup.log
```

```bash
sudo chmod +x /opt/elevate/backup.sh

# Schedule daily at 2 AM
sudo crontab -e
# Add:
0 2 * * * /opt/elevate/backup.sh
```

### 11.2 Restore from Backup
```bash
# Stop application
sudo systemctl stop elevate-backend

# Restore database
PGPASSWORD="<DB_PASSWORD>" pg_restore -h localhost -U elevate -d elevate_db --clean --if-exists \
    /var/backups/elevate/elevate_db_YYYYMMDD_HHMMSS.dump

# Restore uploads
tar -xzf /var/backups/elevate/uploads_YYYYMMDD_HHMMSS.tar.gz -C /

# Restart
sudo systemctl start elevate-backend
```

---

## 12. Monitoring & Logging

### 12.1 Log Locations
| Log | Path | Purpose |
|-----|------|---------|
| Backend | `journalctl -u elevate-backend` | API errors, auth events |
| Nginx Access | `/var/log/nginx/elevate.access.log` | HTTP requests |
| Nginx Error | `/var/log/nginx/elevate.error.log` | Proxy/SSL errors |
| PostgreSQL | `/var/log/postgresql/postgresql-16-main.log` | Slow queries, DB errors |
| Backup | `/var/log/elevate-backup.log` | Backup success/failure |

### 12.2 Log Rotation
```bash
sudo nano /etc/logrotate.d/elevate
```
```
/var/log/nginx/elevate.*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}
```

### 12.3 Health Check Script
```bash
sudo nano /opt/elevate/healthcheck.sh
```
```bash
#!/bin/bash
# Check backend
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/api)
if [ "$HTTP_CODE" != "200" ]; then
    echo "$(date): Backend DOWN (HTTP $HTTP_CODE)" >> /var/log/elevate-health.log
    sudo systemctl restart elevate-backend
fi

# Check PostgreSQL
pg_isready -h localhost -U elevate > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "$(date): PostgreSQL DOWN" >> /var/log/elevate-health.log
    sudo systemctl restart postgresql
fi
```
```bash
chmod +x /opt/elevate/healthcheck.sh
# Run every 5 minutes
echo "*/5 * * * * /opt/elevate/healthcheck.sh" | sudo crontab -
```

---

## 13. Security Hardening

### 13.1 Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 80/tcp comment 'HTTP redirect'
sudo ufw enable
```

### 13.2 Fail2Ban (Brute Force Protection)
```bash
sudo nano /etc/fail2ban/jail.local
```
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

### 13.3 SSH Hardening
```bash
sudo nano /etc/ssh/sshd_config
```
```
PermitRootLogin no
PasswordAuthentication no     # Use SSH keys only
MaxAuthTries 3
AllowUsers elevate admin_user
```

### 13.4 Application Security (Already Built-in)
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Rate limiting (5/min login, 60/min API)
- ✅ Input sanitization (NoSQL → SQL injection protection)
- ✅ File upload validation (magic bytes check)
- ✅ JWT 8-hour expiry
- ✅ Swagger/API docs disabled
- ✅ Audit logging on all auth events

---

## 14. Maintenance & Updates

### 14.1 Deploying Updates
```bash
# SSH into server
ssh elevate@elevate-server

# Pull latest code
cd /opt/elevate/app
git pull origin main

# Backend: install any new dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart elevate-backend

# Frontend: rebuild (only if frontend changed)
cd ../frontend
yarn install
yarn build

# Nginx reload (only if nginx config changed)
sudo nginx -t && sudo systemctl reload nginx
```

### 14.2 OS Security Updates
```bash
# Weekly security updates (schedule via cron)
sudo apt update && sudo apt upgrade -y --with-new-pkgs
```

### 14.3 PostgreSQL Maintenance
```bash
# Weekly vacuum (schedule via cron)
sudo -u postgres vacuumdb --all --analyze
```

---

## Appendix: Quick Reference Card

| Action | Command |
|--------|---------|
| Start backend | `sudo systemctl start elevate-backend` |
| Stop backend | `sudo systemctl stop elevate-backend` |
| Restart backend | `sudo systemctl restart elevate-backend` |
| View backend logs | `sudo journalctl -u elevate-backend -f` |
| Check backend status | `sudo systemctl status elevate-backend` |
| PostgreSQL shell | `sudo -u postgres psql elevate_db` |
| Nginx reload | `sudo systemctl reload nginx` |
| Check SSL cert | `sudo certbot certificates` |
| Manual backup | `sudo /opt/elevate/backup.sh` |
| Health check | `sudo /opt/elevate/healthcheck.sh` |
| View Nginx logs | `sudo tail -f /var/log/nginx/elevate.access.log` |

---

*Document prepared for Grant Thornton India — ELEVATE Platform*
*Infrastructure Team Setup Guide — May 2026*
