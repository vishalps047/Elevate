from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware
import os
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from routes.auth import router as auth_router
from routes.coaches import router as coaches_router
from routes.requests import router as requests_router
from routes.sessions import router as sessions_router
from routes.notifications import router as notifications_router
from routes.admin import router as admin_router
from seed import seed_database
from database import client
from helpers import deliver_due_reminders, auto_complete_past_sessions

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


app = FastAPI(lifespan=lifespan)

app.include_router(auth_router, prefix="/api")
app.include_router(coaches_router, prefix="/api")
app.include_router(requests_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api")
async def root():
    return {"message": "ELEVATE API v1.0"}
