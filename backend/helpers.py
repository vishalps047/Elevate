from database import db
import uuid
from datetime import datetime, timezone


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
