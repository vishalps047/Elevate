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

    # ── COACH DETAILS (all fields) ──
    coaches = await db.users.find({"role": "coach"}, {"_id": 0, "password_hash": 0}).to_list(500)
    coach_details = []
    for coach in coaches:
        active = await db.coaching_requests.count_documents(
            {"active_coach_id": coach["id"], "status": {"$in": ["accepted", "paused"]}}
        )
        completed = await db.coaching_requests.count_documents(
            {"active_coach_id": coach["id"], "status": "completed"}
        )
        session_count = await db.sessions.count_documents({"coach_id": coach["id"]})
        capacity = coach.get("capacity", coach.get("slots", {}).get("total", 2))
        coach_details.append({
            "id": coach["id"],
            "name": coach.get("name", ""),
            "email": coach.get("email", ""),
            "gender": coach.get("gender", ""),
            "tier": coach.get("tier", "T1"),
            "designation": coach.get("designation", coach.get("title", "")),
            "location": coach.get("location", ""),
            "region": coach.get("region", ""),
            "business_unit": coach.get("business_unit", ""),
            "competency": coach.get("competency", ""),
            "total_work_experience": coach.get("total_work_experience", ""),
            "coaching_expertise": coach.get("coaching_expertise", ""),
            "certifications": ", ".join(coach.get("certifications", [])),
            "expertise_areas": ", ".join(coach.get("expertise", [])),
            "domains": ", ".join(coach.get("domains", [])),
            "employee_status": coach.get("employee_status", "Active"),
            "capacity": capacity,
            "assigned": active,
            "remaining": max(capacity - active, 0),
            "completed_journeys": completed,
            "total_sessions": session_count,
            "status": coach.get("status", "active"),
        })

    # ── COACHEE DETAILS (all fields) ──
    coachees = await db.users.find({"role": "coachee"}, {"_id": 0, "password_hash": 0}).to_list(500)
    coachee_details = []
    for coachee in coachees:
        req = await db.coaching_requests.find_one(
            {"coachee_id": coachee["id"]}, {"_id": 0, "status": 1, "active_coach_id": 1, "mentorship_area": 1}
        )
        sessions_done = await db.sessions.count_documents({"coachee_id": coachee["id"], "status": "completed"})
        total_sessions = await db.sessions.count_documents({"coachee_id": coachee["id"]})
        coaching_status = "Not Started"
        coach_name = ""
        if req:
            if req["status"] == "accepted":
                coaching_status = "In Progress"
            elif req["status"] == "paused":
                coaching_status = "Paused"
            elif req["status"] == "completed":
                coaching_status = "Completed"
            elif req["status"] == "pending":
                coaching_status = "Pending Assignment"
            c = await db.users.find_one({"id": req.get("active_coach_id")}, {"_id": 0, "name": 1})
            coach_name = c["name"] if c else ""

        coachee_details.append({
            "id": coachee["id"],
            "name": coachee.get("name", ""),
            "email": coachee.get("email", ""),
            "gender": coachee.get("gender", ""),
            "tier": coachee.get("tier", ""),
            "designation": coachee.get("designation", coachee.get("job_title", "")),
            "location": coachee.get("location", ""),
            "region": coachee.get("region", ""),
            "business_unit": coachee.get("business_unit", coachee.get("department", "")),
            "competency": coachee.get("competency", ""),
            "date_of_joining": coachee.get("date_of_joining", ""),
            "enrolment_type": coachee.get("enrolment_type", ""),
            "employee_status": coachee.get("employee_status", "Active"),
            "coaching_status": coaching_status,
            "assigned_coach": coach_name,
            "sessions_completed": sessions_done,
            "total_sessions": total_sessions,
            "mentorship_area": req.get("mentorship_area", "") if req else "",
        })

    # ── CHART AGGREGATIONS (all computed from real-time data) ──

    # 1. Coaching status breakdown (donut)
    status_counts = {}
    for c in coachee_details:
        s = c["coaching_status"]
        status_counts[s] = status_counts.get(s, 0) + 1
    chart_coaching_status = [{"name": k, "value": v} for k, v in status_counts.items()]

    # 2. Coaches by region (bar)
    region_counts = {}
    for c in coach_details:
        r = c["region"] or "Unknown"
        region_counts[r] = region_counts.get(r, 0) + 1
    chart_coaches_by_region = [{"region": k, "count": v} for k, v in sorted(region_counts.items())]

    # 3. Coachees by business unit (bar)
    bu_counts = {}
    for c in coachee_details:
        bu = c["business_unit"] or "Unknown"
        bu_counts[bu] = bu_counts.get(bu, 0) + 1
    chart_coachees_by_bu = [{"name": k, "count": v} for k, v in sorted(bu_counts.items(), key=lambda x: -x[1])]

    # 4. Gender distribution (grouped bar)
    gender_data = {"Male": {"coaches": 0, "coachees": 0}, "Female": {"coaches": 0, "coachees": 0}}
    for c in coach_details:
        g = c["gender"] if c["gender"] in gender_data else "Male"
        gender_data[g]["coaches"] += 1
    for c in coachee_details:
        g = c["gender"] if c["gender"] in gender_data else "Male"
        gender_data[g]["coachees"] += 1
    chart_gender = [{"gender": k, "coaches": v["coaches"], "coachees": v["coachees"]} for k, v in gender_data.items()]

    # 5. Coach capacity by tier (grouped bar)
    tier_cap = {}
    for c in coach_details:
        t = c["tier"] or "T1"
        if t not in tier_cap:
            tier_cap[t] = {"capacity": 0, "assigned": 0, "available": 0}
        tier_cap[t]["capacity"] += c["capacity"]
        tier_cap[t]["assigned"] += c["assigned"]
        tier_cap[t]["available"] += c["remaining"]
    chart_capacity_by_tier = [{"tier": k, **v} for k, v in sorted(tier_cap.items())]

    # 6. Top coaches by coachees assigned (bar)
    top_coaches = sorted(coach_details, key=lambda x: x["assigned"], reverse=True)[:10]
    chart_top_coaches = [{"name": c["name"].split()[0], "assigned": c["assigned"], "completed": c["completed_journeys"]} for c in top_coaches]

    # 7. Nomination type split (pie)
    nom_counts = {}
    for c in coachee_details:
        n = c["enrolment_type"] or "Unknown"
        nom_counts[n] = nom_counts.get(n, 0) + 1
    chart_nomination = [{"name": k, "value": v} for k, v in nom_counts.items()]

    # 8. Sessions completed bucket (bar)
    buckets = {"0": 0, "1-3": 0, "4-6": 0, "7+": 0}
    for c in coachee_details:
        s = c["sessions_completed"]
        if s == 0:
            buckets["0"] += 1
        elif s <= 3:
            buckets["1-3"] += 1
        elif s <= 6:
            buckets["4-6"] += 1
        else:
            buckets["7+"] += 1
    chart_sessions_bucket = [{"bucket": k, "count": v} for k, v in buckets.items()]

    # 9. Employee status split (donut) - combined coaches + coachees
    emp_status = {}
    for c in coach_details + coachee_details:
        s = c["employee_status"] or "Active"
        emp_status[s] = emp_status.get(s, 0) + 1
    chart_employee_status = [{"name": k, "value": v} for k, v in emp_status.items()]

    return {
        "coach_details": coach_details,
        "coachee_details": coachee_details,
        "charts": {
            "coaching_status": chart_coaching_status,
            "coaches_by_region": chart_coaches_by_region,
            "coachees_by_bu": chart_coachees_by_bu,
            "gender_distribution": chart_gender,
            "capacity_by_tier": chart_capacity_by_tier,
            "top_coaches": chart_top_coaches,
            "nomination_split": chart_nomination,
            "sessions_bucket": chart_sessions_bucket,
            "employee_status": chart_employee_status,
        },
    }
