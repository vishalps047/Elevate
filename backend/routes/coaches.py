from fastapi import APIRouter, Depends, HTTPException
from database import db
from models import AvailabilityInput
from routes.auth import get_current_user

router = APIRouter(prefix="/coaches", tags=["coaches"])


@router.get("")
async def list_coaches(user: dict = Depends(get_current_user)):
    coaches = await db.users.find(
        {"role": "coach", "status": "active"},
        {"_id": 0, "password_hash": 0},
    ).to_list(100)
    return coaches


@router.get("/{coach_id}/availability")
async def get_availability(coach_id: str, user: dict = Depends(get_current_user)):
    avail = await db.coach_availability.find(
        {"coach_id": coach_id, "date": {"$gte": "2026-01-01"}},
        {"_id": 0},
    ).sort("date", 1).to_list(200)

    result = []
    for a in avail:
        booked = set(a.get("booked_slots", []))
        free = [s for s in a["slots"] if s not in booked]
        if free:
            result.append({
                "date": a["date"],
                "day": a["day_label"],
                "slots": free,
            })
    return result


@router.get("/{coach_id}/availability/raw")
async def get_raw_availability(coach_id: str, user: dict = Depends(get_current_user)):
    """Returns full availability including booked slots — for coach's own calendar view."""
    if user["role"] != "coach" or user["id"] != coach_id:
        raise HTTPException(status_code=403, detail="Only the coach can view their own raw availability")
    avail = await db.coach_availability.find(
        {"coach_id": coach_id},
        {"_id": 0},
    ).sort("date", 1).to_list(500)
    return avail


@router.post("/availability")
async def set_availability(body: AvailabilityInput, user: dict = Depends(get_current_user)):
    if user["role"] != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can set availability")

    existing = await db.coach_availability.find_one(
        {"coach_id": user["id"], "date": body.date}
    )

    if existing:
        await db.coach_availability.update_one(
            {"coach_id": user["id"], "date": body.date},
            {"$set": {"slots": body.slots, "day_label": body.day_label}},
        )
    else:
        await db.coach_availability.insert_one({
            "coach_id": user["id"],
            "date": body.date,
            "day_label": body.day_label,
            "slots": body.slots,
            "booked_slots": [],
        })

    return {"message": "Availability updated"}


@router.delete("/availability/{date}")
async def remove_availability(date: str, user: dict = Depends(get_current_user)):
    if user["role"] != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can manage availability")

    result = await db.coach_availability.delete_one(
        {"coach_id": user["id"], "date": date}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No availability found for that date")

    return {"message": "Availability removed"}
