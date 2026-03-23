from fastapi import APIRouter, Depends
from database import db
from routes.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(100)
    return notifications


@router.put("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}},
    )
    return {"message": "All marked as read"}


@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True}},
    )
    return {"message": "Marked as read"}
