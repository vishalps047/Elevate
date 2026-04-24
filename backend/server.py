from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware
from database import db
import os
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

from routes.auth import router as auth_router
from routes.coaches import router as coaches_router
from routes.requests import router as requests_router
from routes.sessions import router as sessions_router
from routes.notifications import router as notifications_router
from routes.admin import router as admin_router
from routes.registrations import router as registrations_router
from routes.emails import router as emails_router
from seed import seed_database
from database import client
from helpers import deliver_due_reminders, auto_complete_past_sessions
from security import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    RequestSizeLimitMiddleware,
    AuditLogMiddleware,
    global_exception_handler,
    validation_exception_handler,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def reminder_loop():
    """Background task: check for due reminders and auto-complete past sessions every 60 seconds."""
    while True:
        try:
            await deliver_due_reminders()
            await auto_complete_past_sessions()
        except Exception as e:
            logger.error(f"Background loop error: {e}")
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app):
    await seed_database()
    task = asyncio.create_task(reminder_loop())
    yield
    task.cancel()
    client.close()


app = FastAPI(
    lifespan=lifespan,
    docs_url=None,      # Disable Swagger UI in production
    redoc_url=None,      # Disable ReDoc in production
    openapi_url=None,    # Disable OpenAPI schema endpoint
)

# ── ROUTE REGISTRATION ──
app.include_router(auth_router, prefix="/api")
app.include_router(coaches_router, prefix="/api")
app.include_router(requests_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(registrations_router, prefix="/api")
app.include_router(emails_router, prefix="/api")

app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ── MIDDLEWARE STACK (order matters: last added = first executed) ──
# CORS must be outermost
cors_origins = os.environ.get('CORS_ORIGINS', '').strip()
if not cors_origins or cors_origins == '*':
    # In production, restrict to your domain. Fallback for dev.
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in cors_origins.split(',') if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Request-ID"],
)

# Security middleware chain
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(AuditLogMiddleware)

# Global exception handler — no stack traces leaked
app.add_exception_handler(Exception, global_exception_handler)

# Validation error handler — no schema leaks
from fastapi.exceptions import RequestValidationError
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.get("/api")
async def root():
    return {"status": "ok"}


@app.get("/api/public/stats")
async def public_stats():
    coaches = await db.users.count_documents({"role": "coach"})
    coachees = await db.users.count_documents({"role": "coachee"})
    sessions = await db.sessions.count_documents({"status": "completed"})
    return {"coaches": coaches, "coachees": coachees, "sessions_completed": sessions}
