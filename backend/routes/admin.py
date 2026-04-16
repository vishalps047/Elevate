from fastapi import APIRouter, HTTPException, Depends
from database import db
from routes.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(user: dict):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    require_admin(user)

    total_coaches = await db.users.count_documents({"role": "coach"})
    total_coachees = await db.users.count_documents({"role": "coachee"})
    total_sessions = await db.sessions.count_documents({})
    completed_sessions = await db.sessions.count_documents({"status": "completed"})
    upcoming_sessions = await db.sessions.count_documents({"status": "upcoming"})
    pending_requests = await db.coaching_requests.count_documents({"status": "pending"})
    active_journeys = await db.coaching_requests.count_documents({"status": {"$in": ["accepted", "paused"]}})
    completed_journeys = await db.coaching_requests.count_documents({"status": "completed"})
    paused_journeys = await db.coaching_requests.count_documents({"status": "paused"})

    # Avg rating from feedback
    pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$overall_rating"}}}]
    rating_result = await db.feedback.aggregate(pipeline).to_list(1)
    avg_rating = round(rating_result[0]["avg"], 1) if rating_result and rating_result[0].get("avg") else 0

    completion_rate = round((completed_journeys / max(completed_journeys + active_journeys, 1)) * 100)

    return {
        "total_coaches": total_coaches,
        "total_coachees": total_coachees,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "upcoming_sessions": upcoming_sessions,
        "pending_requests": pending_requests,
        "active_journeys": active_journeys,
        "completed_journeys": completed_journeys,
        "paused_journeys": paused_journeys,
        "avg_rating": avg_rating,
        "completion_rate": completion_rate,
    }


@router.get("/coaches")
async def get_all_coaches(user: dict = Depends(get_current_user)):
    require_admin(user)

    coaches = await db.users.find(
        {"role": "coach"}, {"_id": 0, "password_hash": 0}
    ).to_list(100)

    for coach in coaches:
        # Get feedback-based rating
        pipeline = [
            {"$match": {"coach_id": coach["id"]}},
            {"$group": {"_id": None, "avg_overall": {"$avg": "$overall_rating"}, "avg_coach": {"$avg": "$coach_rating"}, "count": {"$sum": 1}}},
        ]
        fb = await db.feedback.aggregate(pipeline).to_list(1)
        if fb and fb[0].get("avg_overall"):
            coach["feedback_rating"] = round(fb[0]["avg_overall"], 1)
            coach["coach_skill_rating"] = round(fb[0]["avg_coach"], 1)
            coach["feedback_count"] = fb[0]["count"]
        else:
            coach["feedback_rating"] = None
            coach["coach_skill_rating"] = None
            coach["feedback_count"] = 0

        # Count sessions
        coach["session_count"] = await db.sessions.count_documents({"coach_id": coach["id"]})
        coach["active_coachees"] = await db.coaching_requests.count_documents(
            {"active_coach_id": coach["id"], "status": {"$in": ["accepted", "paused"]}}
        )

    return coaches


@router.get("/coachees")
async def get_all_coachees(user: dict = Depends(get_current_user)):
    require_admin(user)

    coachees = await db.users.find(
        {"role": "coachee"}, {"_id": 0, "password_hash": 0}
    ).to_list(100)

    for coachee in coachees:
        coachee["session_count"] = await db.sessions.count_documents({"coachee_id": coachee["id"]})
        coachee["journey_count"] = await db.coaching_requests.count_documents({"coachee_id": coachee["id"]})
        active = await db.coaching_requests.find_one(
            {"coachee_id": coachee["id"], "status": {"$in": ["pending", "accepted", "paused"]}},
            {"_id": 0, "status": 1, "active_coach_id": 1},
        )
        coachee["active_journey_status"] = active["status"] if active else None

    return coachees


@router.get("/users/{user_id}/history")
async def get_user_history(user_id: str, user: dict = Depends(get_current_user)):
    require_admin(user)

    target = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # All sessions
    if target["role"] == "coach":
        sessions = await db.sessions.find({"coach_id": user_id}, {"_id": 0}).sort("date", -1).to_list(200)
        journeys = await db.coaching_requests.find({"active_coach_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    else:
        sessions = await db.sessions.find({"coachee_id": user_id}, {"_id": 0}).sort("date", -1).to_list(200)
        journeys = await db.coaching_requests.find({"coachee_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)

    # Feedback given/received
    if target["role"] == "coach":
        feedback = await db.feedback.find({"coach_id": user_id}, {"_id": 0}).to_list(50)
    else:
        feedback = await db.feedback.find({"coachee_id": user_id}, {"_id": 0}).to_list(50)

    return {
        "user": target,
        "sessions": sessions,
        "journeys": journeys,
        "feedback": feedback,
    }


@router.get("/trends")
async def get_trends(user: dict = Depends(get_current_user)):
    require_admin(user)

    # Sessions by month
    session_pipeline = [
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {"_id": "$month", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    sessions_by_month = await db.sessions.aggregate(session_pipeline).to_list(24)

    # Requests by month
    request_pipeline = [
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {
            "_id": "$month",
            "total": {"$sum": 1},
            "accepted": {"$sum": {"$cond": [{"$eq": ["$status", "accepted"]}, 1, 0]}},
            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
        }},
        {"$sort": {"_id": 1}},
    ]
    requests_by_month = await db.coaching_requests.aggregate(request_pipeline).to_list(24)

    # Coach utilization (sessions per coach)
    util_pipeline = [
        {"$group": {"_id": "$coach_id", "sessions": {"$sum": 1}, "name": {"$first": "$coach_name"}}},
        {"$sort": {"sessions": -1}},
    ]
    coach_utilization = await db.sessions.aggregate(util_pipeline).to_list(20)

    # Rating distribution from feedback
    rating_pipeline = [
        {"$group": {"_id": "$overall_rating", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    rating_dist = await db.feedback.aggregate(rating_pipeline).to_list(5)

    # Expertise distribution
    expertise_pipeline = [
        {"$match": {"role": "coach"}},
        {"$unwind": "$expertise"},
        {"$group": {"_id": "$expertise", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 6},
    ]
    expertise_dist = await db.users.aggregate(expertise_pipeline).to_list(6)

    return {
        "sessions_by_month": [{"month": s["_id"], "count": s["count"]} for s in sessions_by_month],
        "requests_by_month": [{"month": r["_id"], "total": r["total"], "accepted": r["accepted"], "completed": r["completed"]} for r in requests_by_month],
        "coach_utilization": [{"name": c.get("name", c["_id"]), "sessions": c["sessions"]} for c in coach_utilization],
        "rating_distribution": [{"stars": f"{r['_id']} Stars", "count": r["count"]} for r in rating_dist],
        "expertise_distribution": [{"name": e["_id"], "value": e["count"]} for e in expertise_dist],
    }


@router.get("/mis")
async def get_mis_report(user: dict = Depends(get_current_user)):
    require_admin(user)

    # Coach occupancy: capacity, assigned, remaining
    coaches = await db.users.find({"role": "coach"}, {"_id": 0, "password_hash": 0}).to_list(100)
    coach_occupancy = []
    for coach in coaches:
        active = await db.coaching_requests.count_documents(
            {"active_coach_id": coach["id"], "status": {"$in": ["accepted", "paused"]}}
        )
        total_slots = coach.get("slots", {}).get("total", 3)
        coach_occupancy.append({
            "id": coach["id"],
            "name": coach["name"],
            "designation": coach.get("designation", coach.get("title", "")),
            "location": coach.get("location", ""),
            "business_unit": coach.get("business_unit", ""),
            "capacity": total_slots,
            "assigned": active,
            "remaining": max(total_slots - active, 0),
        })

    # Coachee status breakdown
    all_coachees = await db.users.find({"role": "coachee"}, {"_id": 0, "password_hash": 0}).to_list(200)
    coachee_statuses = []
    for coachee in all_coachees:
        req = await db.coaching_requests.find_one(
            {"coachee_id": coachee["id"]}, {"_id": 0, "status": 1, "active_coach_id": 1, "mentorship_area": 1}
        )
        sessions_done = await db.sessions.count_documents({"coachee_id": coachee["id"], "status": "completed"})
        status = "Unassigned"
        coach_name = ""
        if req:
            if req["status"] == "accepted":
                status = "Undergoing Coaching"
            elif req["status"] == "paused":
                status = "Paused"
            elif req["status"] == "completed":
                status = "Completed"
            elif req["status"] == "pending":
                status = "Pending Assignment"
            c = await db.users.find_one({"id": req.get("active_coach_id")}, {"_id": 0, "name": 1})
            coach_name = c["name"] if c else ""

        coachee_statuses.append({
            "id": coachee["id"],
            "name": coachee["name"],
            "email": coachee.get("email", ""),
            "designation": coachee.get("designation", coachee.get("job_title", "")),
            "location": coachee.get("location", ""),
            "business_unit": coachee.get("business_unit", coachee.get("department", "")),
            "tier": coachee.get("tier", ""),
            "enrolment_type": coachee.get("enrolment_type", ""),
            "coaching_status": status,
            "assigned_coach": coach_name,
            "sessions_completed": sessions_done,
        })

    # Location distribution
    loc_pipeline = [
        {"$match": {"role": {"$in": ["coach", "coachee"]}}},
        {"$group": {"_id": "$location", "coaches": {"$sum": {"$cond": [{"$eq": ["$role", "coach"]}, 1, 0]}}, "coachees": {"$sum": {"$cond": [{"$eq": ["$role", "coachee"]}, 1, 0]}}}},
        {"$sort": {"_id": 1}},
    ]
    location_dist = await db.users.aggregate(loc_pipeline).to_list(20)

    # Business unit distribution
    bu_pipeline = [
        {"$match": {"role": {"$in": ["coach", "coachee"]}, "business_unit": {"$exists": True, "$ne": ""}}},
        {"$group": {"_id": "$business_unit", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    bu_dist = await db.users.aggregate(bu_pipeline).to_list(20)

    # Nomination type breakdown
    enrol_pipeline = [
        {"$match": {"role": "coachee", "enrolment_type": {"$exists": True, "$ne": ""}}},
        {"$group": {"_id": "$enrolment_type", "count": {"$sum": 1}}},
    ]
    enrol_dist = await db.users.aggregate(enrol_pipeline).to_list(10)

    return {
        "coach_occupancy": coach_occupancy,
        "coachee_statuses": coachee_statuses,
        "location_distribution": [{"location": loc["_id"] or "Unknown", "coaches": loc["coaches"], "coachees": loc["coachees"]} for loc in location_dist if loc["_id"]],
        "business_unit_distribution": [{"name": b["_id"], "value": b["count"]} for b in bu_dist if b["_id"]],
        "nomination_breakdown": [{"type": e["_id"], "count": e["count"]} for e in enrol_dist if e["_id"]],
    }
