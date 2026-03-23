from fastapi import APIRouter, HTTPException, Depends
from database import db
from models import CreateRequestBody, FeedbackBody
from routes.auth import get_current_user
from helpers import create_notification
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("")
async def create_request(body: CreateRequestBody, user: dict = Depends(get_current_user)):
    if user["role"] != "coachee":
        raise HTTPException(status_code=403, detail="Only coachees can create requests")

    # Block if coachee has an active or pending-feedback request
    active = await db.coaching_requests.find_one({
        "coachee_id": user["id"],
        "$or": [
            {"status": {"$in": ["pending", "accepted"]}},
            {"status": "completed", "feedback_submitted": False},
        ],
    })
    if active:
        raise HTTPException(
            status_code=400,
            detail="You already have an active coaching journey. Complete it and submit feedback first.",
        )

    if not body.preferences or len(body.preferences) < 1 or len(body.preferences) > 3:
        raise HTTPException(status_code=400, detail="Select 1 to 3 coach preferences")

    preferences = []
    for i, pref in enumerate(sorted(body.preferences, key=lambda x: x.order)):
        coach = await db.users.find_one({"id": pref.coach_id, "role": "coach"}, {"_id": 0})
        if not coach:
            raise HTTPException(status_code=404, detail=f"Coach {pref.coach_id} not found")
        preferences.append({
            "coach_id": pref.coach_id,
            "coach_name": coach["name"],
            "coach_avatar": coach.get("avatar"),
            "order": i + 1,
            "status": "pending" if i == 0 else "waiting",
        })

    request_doc = {
        "id": str(uuid.uuid4()),
        "coachee_id": user["id"],
        "coachee_name": user["name"],
        "coachee_avatar": user.get("avatar"),
        "coachee_role": user.get("job_title", ""),
        "preferences": preferences,
        "current_preference_index": 0,
        "status": "pending",
        "active_coach_id": None,
        "goals": body.goals,
        "challenges": body.challenges,
        "previous_exp": body.previous_exp,
        "notes": body.notes,
        "mentorship_area": body.mentorship_area,
        "total_sessions": 6,
        "journey_completed": False,
        "feedback_submitted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.coaching_requests.insert_one(request_doc)
    request_doc.pop("_id", None)

    # Notify first preference coach
    first_coach = preferences[0]
    await create_notification(
        first_coach["coach_id"],
        "request",
        "New Coaching Request",
        f"{user['name']} ({user.get('job_title', '')}) has sent you a coaching request for {body.mentorship_area}.",
        user.get("avatar"),
    )

    return request_doc


@router.get("")
async def list_requests(user: dict = Depends(get_current_user)):
    if user["role"] == "coach":
        requests = await db.coaching_requests.find(
            {"preferences.coach_id": user["id"]},
            {"_id": 0},
        ).sort("created_at", -1).to_list(100)
        return requests
    elif user["role"] == "coachee":
        requests = await db.coaching_requests.find(
            {"coachee_id": user["id"]},
            {"_id": 0},
        ).sort("created_at", -1).to_list(100)
        return requests
    else:
        requests = await db.coaching_requests.find(
            {}, {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return requests


@router.get("/active")
async def get_active_request(user: dict = Depends(get_current_user)):
    if user["role"] != "coachee":
        raise HTTPException(status_code=403, detail="Only coachees have active requests")

    active = await db.coaching_requests.find_one(
        {
            "coachee_id": user["id"],
            "$or": [
                {"status": {"$in": ["pending", "accepted"]}},
                {"status": "completed", "feedback_submitted": False},
            ],
        },
        {"_id": 0},
    )
    return {"request": active}


@router.put("/{request_id}/accept")
async def accept_request(request_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can accept requests")

    request = await db.coaching_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    idx = request["current_preference_index"]
    if idx >= len(request["preferences"]):
        raise HTTPException(status_code=400, detail="No pending preference for this coach")

    current_pref = request["preferences"][idx]
    if current_pref["coach_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="This request is not currently assigned to you")
    if current_pref["status"] != "pending":
        raise HTTPException(status_code=400, detail="Already processed")

    request["preferences"][idx]["status"] = "accepted"

    await db.coaching_requests.update_one(
        {"id": request_id},
        {"$set": {
            "preferences": request["preferences"],
            "status": "accepted",
            "active_coach_id": user["id"],
        }},
    )

    # Decrease coach slot
    await db.users.update_one(
        {"id": user["id"], "slots.available": {"$gt": 0}},
        {"$inc": {"slots.available": -1}},
    )

    # Notify coachee
    await create_notification(
        request["coachee_id"],
        "system",
        "Request Accepted!",
        f"{user['name']} has accepted your coaching request. You can now schedule your first session.",
        user.get("avatar"),
    )

    return {"message": "Request accepted"}


@router.put("/{request_id}/decline")
async def decline_request(request_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can decline requests")

    request = await db.coaching_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    idx = request["current_preference_index"]
    if idx >= len(request["preferences"]):
        raise HTTPException(status_code=400, detail="No pending preference")

    current_pref = request["preferences"][idx]
    if current_pref["coach_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not assigned to you")

    request["preferences"][idx]["status"] = "declined"

    next_idx = idx + 1
    if next_idx < len(request["preferences"]):
        # Cascade to next preference
        request["preferences"][next_idx]["status"] = "pending"

        await db.coaching_requests.update_one(
            {"id": request_id},
            {"$set": {
                "preferences": request["preferences"],
                "current_preference_index": next_idx,
            }},
        )

        next_coach = request["preferences"][next_idx]

        # Notify next coach
        await create_notification(
            next_coach["coach_id"],
            "request",
            "New Coaching Request",
            f"{request['coachee_name']} ({request.get('coachee_role', '')}) has sent you a coaching request for {request.get('mentorship_area', 'coaching')}.",
            request.get("coachee_avatar"),
        )

        # Notify coachee about cascade
        await create_notification(
            request["coachee_id"],
            "system",
            "Request Forwarded",
            f"{user['name']} has declined your request. It has been forwarded to {next_coach['coach_name']}.",
            next_coach.get("coach_avatar"),
        )

        return {"message": "Declined, forwarded to next preference"}
    else:
        # All preferences exhausted
        await db.coaching_requests.update_one(
            {"id": request_id},
            {"$set": {
                "preferences": request["preferences"],
                "status": "declined_all",
            }},
        )

        await create_notification(
            request["coachee_id"],
            "system",
            "All Coaches Declined",
            "All your selected coaches have declined. Please submit a new request with different preferences.",
            None,
        )

        return {"message": "All preferences exhausted"}


@router.put("/{request_id}/complete-journey")
async def complete_journey(request_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "coachee":
        raise HTTPException(status_code=403, detail="Only coachees can complete journeys")

    request = await db.coaching_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request["coachee_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your request")
    if request["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Journey can only be completed for accepted requests")

    # Mark all upcoming sessions as completed
    await db.sessions.update_many(
        {"request_id": request_id, "status": "upcoming"},
        {"$set": {"status": "completed"}},
    )

    await db.coaching_requests.update_one(
        {"id": request_id},
        {"$set": {"journey_completed": True, "status": "completed"}},
    )

    # Restore coach slot
    if request.get("active_coach_id"):
        await db.users.update_one(
            {"id": request["active_coach_id"]},
            {"$inc": {"slots.available": 1}},
        )
        await create_notification(
            request["active_coach_id"],
            "system",
            "Coaching Journey Completed",
            f"{user['name']} has completed their coaching journey with you.",
            user.get("avatar"),
        )

    return {"message": "Journey completed. Please submit your feedback."}


@router.post("/{request_id}/feedback")
async def submit_feedback(request_id: str, body: FeedbackBody, user: dict = Depends(get_current_user)):
    if user["role"] != "coachee":
        raise HTTPException(status_code=403, detail="Only coachees can submit feedback")

    request = await db.coaching_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request["coachee_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your request")
    if not request.get("journey_completed"):
        raise HTTPException(status_code=400, detail="Complete the journey first")
    if request.get("feedback_submitted"):
        raise HTTPException(status_code=400, detail="Feedback already submitted")

    feedback_doc = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "coachee_id": user["id"],
        "coach_id": request.get("active_coach_id"),
        "rating": body.rating,
        "comment": body.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.feedback.insert_one(feedback_doc)
    feedback_doc.pop("_id", None)

    await db.coaching_requests.update_one(
        {"id": request_id},
        {"$set": {"feedback_submitted": True}},
    )

    return feedback_doc
