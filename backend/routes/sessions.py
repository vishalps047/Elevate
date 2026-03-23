from fastapi import APIRouter, HTTPException, Depends
from database import db
from models import CreateSessionBody, RescheduleBody
from routes.auth import get_current_user
from helpers import create_notification
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("")
async def list_sessions(user: dict = Depends(get_current_user)):
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

    return session_doc


@router.put("/{session_id}/reschedule")
async def reschedule_session(session_id: str, body: RescheduleBody, user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"date": body.date, "time": body.time}},
    )

    if user["role"] == "coachee":
        await create_notification(
            session["coach_id"],
            "reschedule",
            "Session Rescheduled",
            f"{user['name']} rescheduled Session {session.get('session_number', '')} to {body.date} at {body.time}.",
            user.get("avatar"),
        )
    else:
        await create_notification(
            session["coachee_id"],
            "reschedule",
            "Session Rescheduled by Coach",
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
