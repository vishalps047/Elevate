from database import db
import uuid
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)


async def create_notification(user_id, notif_type, title, message, avatar=None):
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "avatar": avatar,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notifications.insert_one(notif)


def parse_session_datetime(date_str, time_str):
    dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M %p")
    return dt.replace(tzinfo=timezone.utc)


async def schedule_session_reminders(session_doc):
    try:
        session_dt = parse_session_datetime(session_doc["date"], session_doc["time"])
    except Exception:
        logger.warning(f"Could not parse session datetime: {session_doc['date']} {session_doc['time']}")
        return

    reminders = [
        {"delta": timedelta(days=2), "label": "in 2 days"},
        {"delta": timedelta(days=1), "label": "tomorrow"},
        {"delta": timedelta(hours=1), "label": "in 1 hour"},
    ]

    for r in reminders:
        deliver_at = session_dt - r["delta"]
        if deliver_at <= datetime.now(timezone.utc):
            continue

        for user_id, other_name in [
            (session_doc["coach_id"], session_doc["coachee_name"]),
            (session_doc["coachee_id"], session_doc["coach_name"]),
        ]:
            reminder = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "session_id": session_doc["id"],
                "deliver_at": deliver_at.isoformat(),
                "delivered": False,
                "title": f"Session Reminder",
                "message": f"Your coaching session with {other_name} is {r['label']} ({session_doc['date']} at {session_doc['time']})",
                "avatar": None,
            }
            await db.scheduled_reminders.insert_one(reminder)

    logger.info(f"Scheduled reminders for session {session_doc['id']}")


async def deliver_due_reminders():
    now = datetime.now(timezone.utc).isoformat()
    due = await db.scheduled_reminders.find({
        "deliver_at": {"$lte": now},
        "delivered": False,
    }).to_list(100)

    for reminder in due:
        await create_notification(
            reminder["user_id"],
            "reminder",
            reminder["title"],
            reminder["message"],
            reminder.get("avatar"),
        )
        await db.scheduled_reminders.update_one(
            {"id": reminder["id"]},
            {"$set": {"delivered": True}},
        )

    if due:
        logger.info(f"Delivered {len(due)} reminder notifications")
