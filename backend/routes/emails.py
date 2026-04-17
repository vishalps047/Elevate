from fastapi import APIRouter, Depends
from database import db
from routes.auth import get_current_user

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("")
async def get_emails(user: dict = Depends(get_current_user)):
    emails = await db.emails.find(
        {"to_user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return emails


@router.put("/{email_id}/read")
async def mark_email_read(email_id: str, user: dict = Depends(get_current_user)):
    await db.emails.update_one(
        {"id": email_id, "to_user_id": user["id"]},
        {"$set": {"read": True}}
    )
    return {"ok": True}


@router.put("/read-all")
async def mark_all_emails_read(user: dict = Depends(get_current_user)):
    await db.emails.update_many(
        {"to_user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"ok": True}
