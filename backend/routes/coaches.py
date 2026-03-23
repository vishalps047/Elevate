from fastapi import APIRouter, Depends
from database import db
from routes.auth import get_current_user

router = APIRouter(prefix="/coaches", tags=["coaches"])

AVAILABILITY_SLOTS = [
    {"date": "2025-02-10", "day": "Mon, Feb 10", "slots": ["9:00 AM", "11:00 AM", "3:00 PM"]},
    {"date": "2025-02-11", "day": "Tue, Feb 11", "slots": ["10:00 AM", "2:00 PM", "4:00 PM"]},
    {"date": "2025-02-13", "day": "Thu, Feb 13", "slots": ["9:00 AM", "1:00 PM"]},
    {"date": "2025-02-14", "day": "Fri, Feb 14", "slots": ["11:00 AM", "3:00 PM", "5:00 PM"]},
    {"date": "2025-02-17", "day": "Mon, Feb 17", "slots": ["9:00 AM", "10:00 AM", "2:00 PM"]},
    {"date": "2025-02-18", "day": "Tue, Feb 18", "slots": ["11:00 AM", "4:00 PM"]},
]


@router.get("")
async def list_coaches(user: dict = Depends(get_current_user)):
    coaches = await db.users.find(
        {"role": "coach", "status": "active"},
        {"_id": 0, "password_hash": 0},
    ).to_list(100)
    return coaches


@router.get("/{coach_id}/availability")
async def get_availability(coach_id: str, user: dict = Depends(get_current_user)):
    return AVAILABILITY_SLOTS
