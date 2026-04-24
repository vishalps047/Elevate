from fastapi import APIRouter, HTTPException, Depends
from database import db
from routes.auth import get_current_user, hash_password
from security import sanitize_string, check_nosql_injection
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import re
from email_templates import (
    send_registration_confirmed, send_nominated_for_elevate,
    send_registration_rejected, send_nomination_rejected_to_nominator,
    send_admin_registration_alert,
)

router = APIRouter(prefix="/registrations", tags=["registrations"])


class CoacheeNomination(BaseModel):
    name: str
    email: str


class RegistrationRequest(BaseModel):
    role: str  # "coach" or "coachee"
    name: str
    email: str
    date_of_joining: Optional[str] = ""
    tier: Optional[str] = ""
    designation: Optional[str] = ""
    location: Optional[str] = ""
    business_unit: Optional[str] = ""
    competency: Optional[str] = ""
    co_supercoach: Optional[str] = ""
    enrolment_type: Optional[str] = "Self-nomination"
    reason_for_enrolment: Optional[str] = ""
    nominated_coachees: Optional[List[CoacheeNomination]] = []


@router.post("")
async def submit_registration(body: RegistrationRequest):
    # Validate email format
    email = body.email.strip().lower()
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Sanitize all text inputs
    name = sanitize_string(body.name, 100)
    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Name is required (min 2 characters)")

    # Check for NoSQL injection in inputs
    if check_nosql_injection(body.dict()):
        raise HTTPException(status_code=400, detail="Invalid input detected")

    # Check if email already registered
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered on the platform")

    existing_reg = await db.registrations.find_one(
        {"email": body.email.lower(), "status": "pending"}
    )
    if existing_reg:
        raise HTTPException(status_code=400, detail="A registration request with this email is already pending")

    reg_id = str(uuid.uuid4())
    registration = {
        "id": reg_id,
        "role": body.role,
        "name": body.name,
        "email": body.email.lower(),
        "date_of_joining": body.date_of_joining,
        "tier": body.tier,
        "designation": body.designation,
        "location": body.location,
        "business_unit": body.business_unit,
        "competency": body.competency,
        "co_supercoach": body.co_supercoach,
        "enrolment_type": body.enrolment_type,
        "reason_for_enrolment": body.reason_for_enrolment,
        "nominated_coachees": [c.model_dump() for c in (body.nominated_coachees or [])],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.registrations.insert_one(registration)

    # Email: Notify admin of new registration
    await send_admin_registration_alert(registration)

    # If coach nominated coachees, create separate registration entries for them
    for nominee in (body.nominated_coachees or []):
        existing = await db.users.find_one({"email": nominee.email.lower()})
        existing_reg = await db.registrations.find_one({"email": nominee.email.lower(), "status": "pending"})
        if not existing and not existing_reg:
            await db.registrations.insert_one({
                "id": str(uuid.uuid4()),
                "role": "coachee",
                "name": nominee.name,
                "email": nominee.email.lower(),
                "enrolment_type": "Coach-nominated",
                "nominated_by": body.name,
                "nominated_by_email": body.email.lower(),
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    return {"id": reg_id, "message": "Registration submitted successfully. An admin will review your request."}


@router.get("")
async def list_registrations(status: str = "pending", user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    query = {}
    if status != "all":
        query["status"] = status
    regs = await db.registrations.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return regs


@router.put("/{reg_id}/approve")
async def approve_registration(reg_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    reg = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    if reg["status"] != "pending":
        raise HTTPException(status_code=400, detail="Registration already processed")

    # Create user account
    REGION_MAP = {
        "DEL": "North", "New Delhi": "North", "NCR": "North",
        "MUM": "West", "Mumbai": "West", "PUN": "West", "Pune": "West",
        "BLR": "South", "Bangalore": "South", "CHN": "South", "Chennai": "South",
        "HYD": "South", "Hyderabad": "South", "KOL": "East", "Kolkata": "East",
    }
    loc = reg.get("location", "")
    region = REGION_MAP.get(loc, "North")

    new_user = {
        "id": str(uuid.uuid4()),
        "email": reg["email"],
        "password_hash": hash_password("password123"),
        "name": reg["name"],
        "role": reg["role"],
        "avatar": "",
        "gender": reg.get("gender", ""),
        "region": region,
        "employee_status": "Active",
        "date_of_joining": reg.get("date_of_joining", ""),
        "tier": reg.get("tier", ""),
        "designation": reg.get("designation", ""),
        "location": loc,
        "business_unit": reg.get("business_unit", ""),
        "competency": reg.get("competency", ""),
        "co_supercoach": reg.get("co_supercoach", ""),
        "enrolment_type": reg.get("enrolment_type", ""),
        "reason_for_enrolment": reg.get("reason_for_enrolment", ""),
        "status": "active",
    }

    if reg["role"] == "coach":
        new_user.update({
            "title": reg.get("designation", "Coach"),
            "rating": 0,
            "total_sessions": 0,
            "slots": {"available": 3, "total": 3},
            "capacity": 3,
            "total_work_experience": 0,
            "coaching_expertise": "",
            "certifications": [],
            "expertise": [],
            "domains": [],
            "about": "",
            "experience": "",
        })
    else:
        new_user.update({
            "job_title": reg.get("designation", ""),
            "department": reg.get("business_unit", ""),
        })

    try:
        await db.users.insert_one(new_user)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to create user. Email may already exist.")

    await db.registrations.update_one(
        {"id": reg_id},
        {"$set": {"status": "approved", "approved_at": datetime.now(timezone.utc).isoformat(), "approved_by": user["id"]}},
    )

    # Email: Send appropriate template based on role and enrolment type
    if reg["role"] == "coachee":
        enrolment = reg.get("enrolment_type", "Self-nomination")
        if enrolment == "Self-nomination":
            await send_registration_confirmed(new_user["id"], new_user["email"], new_user["name"])
        else:
            nominator = reg.get("nominated_by", "your Co-SuperCoach")
            await send_nominated_for_elevate(new_user["id"], new_user["email"], new_user["name"], nominator)

    return {"message": f"{reg['name']} has been approved as {reg['role']}. Default password: password123"}


@router.put("/{reg_id}/reject")
async def reject_registration(reg_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    reg = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    if reg["status"] != "pending":
        raise HTTPException(status_code=400, detail="Registration already processed")

    await db.registrations.update_one(
        {"id": reg_id},
        {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat(), "rejected_by": user["id"]}},
    )

    # Email: Send rejection notification
    enrolment = reg.get("enrolment_type", "Self-nomination")
    if enrolment == "Self-nomination":
        # T3: Rejection to the coachee themselves
        # Find the user if they exist, or send to reg email
        user_doc = await db.users.find_one({"email": reg["email"]}, {"_id": 0})
        if user_doc:
            await send_registration_rejected(user_doc["id"], user_doc["email"], user_doc["name"])
    else:
        # T4: Rejection to the nominator
        nominator_email = reg.get("nominated_by_email")
        if nominator_email:
            nominator_doc = await db.users.find_one({"email": nominator_email}, {"_id": 0})
            if nominator_doc:
                await send_nomination_rejected_to_nominator(
                    nominator_doc["id"], nominator_doc["email"],
                    nominator_doc["name"], reg["name"]
                )

    return {"message": f"{reg['name']}'s registration has been rejected"}
