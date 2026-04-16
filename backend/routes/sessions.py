from fastapi import APIRouter, HTTPException, Depends
from database import db
from models import CreateSessionBody, RescheduleBody
from pydantic import BaseModel
from routes.auth import get_current_user
from helpers import create_notification, schedule_session_reminders
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("")
async def list_sessions(user: dict = Depends(get_current_user)):
    sessions = []
    if user["role"] == "coach":
        sessions = await db.sessions.find(
            {"coach_id": user["id"]}, {"_id": 0}
        ).sort("date", 1).to_list(100)
    elif user["role"] == "coachee":
        sessions = await db.sessions.find(
            {"coachee_id": user["id"]}, {"_id": 0}
        ).sort("date", 1).to_list(100)
    else:
        sessions = await db.sessions.find(
            {}, {"_id": 0}
        ).sort("date", 1).to_list(100)
    return sessions


@router.post("")
async def create_session(body: CreateSessionBody, user: dict = Depends(get_current_user)):
    request = await db.coaching_requests.find_one({"id": body.request_id}, {"_id": 0})
    if not request or request["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Invalid or non-accepted request")

    # Check coach availability
    avail = await db.coach_availability.find_one(
        {"coach_id": request["active_coach_id"], "date": body.date}
    )
    if avail:
        booked = set(avail.get("booked_slots", []))
        free = [s for s in avail["slots"] if s not in booked]
        if body.time not in free:
            raise HTTPException(status_code=400, detail="This time slot is not available")

        # Mark slot as booked
        await db.coach_availability.update_one(
            {"coach_id": request["active_coach_id"], "date": body.date},
            {"$push": {"booked_slots": body.time}},
        )

    session_count = await db.sessions.count_documents({"request_id": body.request_id})

    coach = await db.users.find_one(
        {"id": request["active_coach_id"]}, {"_id": 0, "password_hash": 0}
    )
    coachee = await db.users.find_one(
        {"id": request["coachee_id"]}, {"_id": 0, "password_hash": 0}
    )

    session_doc = {
        "id": str(uuid.uuid4()),
        "request_id": body.request_id,
        "coach_id": request["active_coach_id"],
        "coach_name": coach["name"] if coach else "",
        "coach_avatar": coach.get("avatar", "") if coach else "",
        "coachee_id": request["coachee_id"],
        "coachee_name": coachee["name"] if coachee else "",
        "coachee_avatar": coachee.get("avatar", "") if coachee else "",
        "coachee_role": coachee.get("job_title", "") if coachee else "",
        "date": body.date,
        "time": body.time,
        "duration": 60,
        "topic": body.topic,
        "session_number": session_count + 1,
        "total_sessions": request.get("total_sessions", 6),
        "status": "upcoming",
        "notes": "",
        "meeting_link": f"https://meet.google.com/{uuid.uuid4().hex[:12]}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.sessions.insert_one(session_doc)
    session_doc.pop("_id", None)

    # Notify the other party
    if user["role"] == "coachee" and coach:
        await create_notification(
            request["active_coach_id"],
            "session",
            "Session Scheduled",
            f"{user['name']} scheduled a session for {body.date} at {body.time}.",
            user.get("avatar"),
        )
    elif coach:
        await create_notification(
            request["coachee_id"],
            "session",
            "Session Scheduled",
            f"{coach['name']} scheduled a session for {body.date} at {body.time}.",
            coach.get("avatar"),
        )

    # Schedule reminders (2 days, 1 day, 1 hour before)
    await schedule_session_reminders(session_doc)

    return session_doc


@router.put("/{session_id}/reschedule")
async def reschedule_session(session_id: str, body: RescheduleBody, user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Free the old slot
    await db.coach_availability.update_one(
        {"coach_id": session["coach_id"], "date": session["date"]},
        {"$pull": {"booked_slots": session["time"]}},
    )

    # Book the new slot
    new_avail = await db.coach_availability.find_one(
        {"coach_id": session["coach_id"], "date": body.date}
    )
    if new_avail:
        booked = set(new_avail.get("booked_slots", []))
        free = [s for s in new_avail["slots"] if s not in booked]
        if body.time not in free:
            # Re-book old slot
            await db.coach_availability.update_one(
                {"coach_id": session["coach_id"], "date": session["date"]},
                {"$push": {"booked_slots": session["time"]}},
            )
            raise HTTPException(status_code=400, detail="New time slot is not available")
        await db.coach_availability.update_one(
            {"coach_id": session["coach_id"], "date": body.date},
            {"$push": {"booked_slots": body.time}},
        )

    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"date": body.date, "time": body.time}},
    )

    # Cancel old reminders and schedule new ones
    await db.scheduled_reminders.delete_many({"session_id": session_id, "delivered": False})
    updated_session = {**session, "date": body.date, "time": body.time}
    await schedule_session_reminders(updated_session)

    if user["role"] == "coachee":
        await create_notification(
            session["coach_id"], "reschedule", "Session Rescheduled",
            f"{user['name']} rescheduled Session {session.get('session_number', '')} to {body.date} at {body.time}.",
            user.get("avatar"),
        )
    else:
        await create_notification(
            session["coachee_id"], "reschedule", "Session Rescheduled by Coach",
            f"{user['name']} rescheduled Session {session.get('session_number', '')} to {body.date} at {body.time}.",
            user.get("avatar"),
        )

    return {"message": "Session rescheduled"}


@router.put("/{session_id}/complete")
async def complete_session(session_id: str, user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"status": "completed"}},
    )

    return {"message": "Session completed"}



class SessionNoteBody(BaseModel):
    content: str


@router.post("/{session_id}/notes")
async def add_session_note(session_id: str, body: SessionNoteBody, user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only add notes to completed sessions")
    if session.get("coachee_id") != user["id"] and session.get("coach_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your session")

    note = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_role": user["role"],
        "content": body.content.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.session_notes.insert_one(note)
    note.pop("_id", None)
    return note


@router.get("/{session_id}/notes")
async def get_session_notes(session_id: str, user: dict = Depends(get_current_user)):
    notes = await db.session_notes.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notes
