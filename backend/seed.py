from database import db
import bcrypt
import logging

logger = logging.getLogger(__name__)


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


async def seed_database():
    pwd = hash_password("password123")

    # --- USERS ---
    if await db.users.count_documents({}) == 0:
        logger.info("Seeding users...")
        coaches = [
            {
                "id": "coach-1", "email": "fatema@elevate.com", "password_hash": pwd,
                "name": "Fatema Hunaid", "role": "coach", "title": "Executive Coach",
                "rating": 4.8, "location": "New Delhi, India", "total_sessions": 24,
                "slots": {"available": 2, "total": 2}, "status": "active",
                "certifications": ["ICF PCC", "Marshall Goldsmith"],
                "expertise": ["Executive Presence", "Leadership Development", "Change Management"],
                "domains": ["BFSI", "Consulting", "Technology"],
                "about": "Fatema has 15+ years of experience in executive coaching and leadership development.",
                "experience": "15+ years",
                "avatar": "https://randomuser.me/api/portraits/women/44.jpg",
            },
            {
                "id": "coach-2", "email": "vaishali@elevate.com", "password_hash": pwd,
                "name": "Vaishali Mane", "role": "coach", "title": "Executive Coach",
                "rating": 4.8, "location": "Mumbai, India", "total_sessions": 18,
                "slots": {"available": 2, "total": 2}, "status": "active",
                "certifications": ["ICF ACC", "EMCC Practitioner"],
                "expertise": ["Executive Presence", "Leadership Development", "Stakeholder Engagement"],
                "domains": ["Healthcare", "FMCG", "Retail"],
                "about": "Vaishali brings over 15 years of expertise in executive coaching and leadership development.",
                "experience": "15+ years",
                "avatar": "https://randomuser.me/api/portraits/women/68.jpg",
            },
            {
                "id": "coach-3", "email": "gaurav@elevate.com", "password_hash": pwd,
                "name": "Gaurav Jain", "role": "coach", "title": "Executive Coach",
                "rating": 4.8, "location": "Bangalore, India", "total_sessions": 30,
                "slots": {"available": 2, "total": 2}, "status": "active",
                "certifications": ["ICF PCC", "CMA Certified"],
                "expertise": ["Executive Presence", "Leadership Development", "Change Management", "Risk Assessment"],
                "domains": ["Technology", "Startups", "E-Commerce"],
                "about": "Gaurav has 15+ years of experience in executive coaching and leadership development.",
                "experience": "15+ years",
                "avatar": "https://randomuser.me/api/portraits/men/32.jpg",
            },
            {
                "id": "coach-4", "email": "ajay@elevate.com", "password_hash": pwd,
                "name": "Ajay Gurung", "role": "coach", "title": "Executive Coach",
                "rating": 4.6, "location": "Pune, India", "total_sessions": 12,
                "slots": {"available": 2, "total": 2}, "status": "active",
                "certifications": ["ICF MCC", "SHRM Certified"],
                "expertise": ["Process Improvement", "Project Planning", "Team Communication", "Stakeholder Engagement"],
                "domains": ["Manufacturing", "Consulting", "BFSI"],
                "about": "Ajay brings extensive experience in process optimization and team coaching.",
                "experience": "12+ years",
                "avatar": "https://randomuser.me/api/portraits/men/55.jpg",
            },
            {
                "id": "coach-5", "email": "amina@elevate.com", "password_hash": pwd,
                "name": "Amina Khan", "role": "coach", "title": "Executive Coach",
                "rating": 4.5, "location": "Hyderabad, India", "total_sessions": 8,
                "slots": {"available": 0, "total": 2}, "status": "active",
                "certifications": ["ICF ACC"],
                "expertise": ["Performance Metrics", "Feedback Mechanisms", "Public Speaking", "Leadership Development"],
                "domains": ["Technology", "Media", "Education"],
                "about": "Amina specializes in performance coaching and communication development.",
                "experience": "8+ years",
                "avatar": "https://randomuser.me/api/portraits/women/33.jpg",
            },
            {
                "id": "coach-6", "email": "rajesh@elevate.com", "password_hash": pwd,
                "name": "Rajesh Kumar", "role": "coach", "title": "Leadership Coach",
                "rating": 4.7, "location": "Chennai, India", "total_sessions": 20,
                "slots": {"available": 1, "total": 3}, "status": "active",
                "certifications": ["ICF PCC", "NLP Practitioner"],
                "expertise": ["Leadership Development", "Change Management", "Executive Presence", "Team Communication"],
                "domains": ["Automotive", "Manufacturing", "Consulting"],
                "about": "Rajesh is a seasoned leadership coach with deep expertise in transformational leadership.",
                "experience": "18+ years",
                "avatar": "https://randomuser.me/api/portraits/men/78.jpg",
            },
        ]
        coachees = [
            {
                "id": "coachee-1", "email": "sarah@elevate.com", "password_hash": pwd,
                "name": "Sarah Johnson", "role": "coachee",
                "job_title": "Senior Associate", "department": "Audit & Assurance",
                "avatar": "https://randomuser.me/api/portraits/women/10.jpg",
            },
            {
                "id": "coachee-2", "email": "alex@elevate.com", "password_hash": pwd,
                "name": "Alex Morgan", "role": "coachee",
                "job_title": "Assistant Manager", "department": "Advisory",
                "avatar": "https://randomuser.me/api/portraits/men/23.jpg",
            },
        ]
        admin = {
            "id": "admin-1", "email": "admin@elevate.com", "password_hash": pwd,
            "name": "Admin User", "role": "admin",
            "avatar": "https://randomuser.me/api/portraits/men/1.jpg",
        }
        await db.users.insert_many(coaches + coachees + [admin])
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        logger.info("Seeded 9 users.")

    # --- PAST JOURNEY (Sarah with Gaurav) ---
    if await db.coaching_requests.count_documents({"id": "past-request-1"}) == 0:
        logger.info("Seeding past journey data...")

        past_request = {
            "id": "past-request-1",
            "coachee_id": "coachee-1",
            "coachee_name": "Sarah Johnson",
            "coachee_avatar": "https://randomuser.me/api/portraits/women/10.jpg",
            "coachee_role": "Senior Associate",
            "preferences": [{"coach_id": "coach-3", "coach_name": "Gaurav Jain",
                             "coach_avatar": "https://randomuser.me/api/portraits/men/32.jpg",
                             "order": 1, "status": "accepted"}],
            "current_preference_index": 0,
            "status": "completed",
            "active_coach_id": "coach-3",
            "goals": "Improve leadership presence in cross-functional settings",
            "challenges": "Managing stakeholder expectations across departments",
            "previous_exp": "No prior formal coaching",
            "notes": "",
            "mentorship_area": "Leadership Development",
            "total_sessions": 6,
            "journey_completed": True,
            "feedback_submitted": True,
            "created_at": "2025-11-15T10:00:00+00:00",
        }
        await db.coaching_requests.insert_one(past_request)

        past_sessions = [
            {
                "id": f"past-session-{i}",
                "request_id": "past-request-1",
                "coach_id": "coach-3",
                "coach_name": "Gaurav Jain",
                "coach_avatar": "https://randomuser.me/api/portraits/men/32.jpg",
                "coachee_id": "coachee-1",
                "coachee_name": "Sarah Johnson",
                "coachee_avatar": "https://randomuser.me/api/portraits/women/10.jpg",
                "coachee_role": "Senior Associate",
                "date": f"2025-{11 + (i // 3)}-{10 + (i % 3) * 7}",
                "time": "10:00 AM",
                "duration": 60,
                "topic": topic,
                "session_number": i + 1,
                "total_sessions": 6,
                "status": "completed",
                "notes": "",
                "meeting_link": f"https://meet.google.com/past{i}",
                "created_at": f"2025-{11 + (i // 3)}-{9 + (i % 3) * 7}T10:00:00+00:00",
            }
            for i, topic in enumerate([
                "Goal Setting & Alignment",
                "Stakeholder Mapping",
                "Communication Frameworks",
                "Leadership Presence Practice",
                "Conflict Resolution Strategies",
                "Final Review & Growth Plan",
            ])
        ]
        await db.sessions.insert_many(past_sessions)

        past_feedback = {
            "id": "past-feedback-1",
            "request_id": "past-request-1",
            "coachee_id": "coachee-1",
            "coach_id": "coach-3",
            "overall_rating": 5,
            "coach_rating": 5,
            "learning_outcomes": {
                "self_awareness": 5,
                "experimental": 4,
                "goals": 5,
                "go_beyond": 4,
            },
            "most_valuable": "Gaurav's structured approach helped me develop strong leadership presence and stakeholder management skills.",
            "suggestions": "More role-play exercises would be beneficial.",
            "created_at": "2026-01-20T10:00:00+00:00",
        }
        await db.feedback.insert_one(past_feedback)
        logger.info("Seeded past journey with 6 sessions.")

    # --- COACH AVAILABILITY (March - April 2026) ---
    if await db.coach_availability.count_documents({}) == 0:
        logger.info("Seeding coach availability...")

        import calendar as cal
        from datetime import date

        all_avail = []
        time_presets = [
            ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"],
            ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"],
            ["10:00 AM", "11:00 AM", "3:00 PM"],
            ["9:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"],
        ]

        for coach_idx in range(1, 7):
            coach_id = f"coach-{coach_idx}"
            preset = time_presets[coach_idx % len(time_presets)]

            for month in [3, 4]:
                days_in_month = cal.monthrange(2026, month)[1]
                for day in range(1, days_in_month + 1):
                    d = date(2026, month, day)
                    if d.weekday() >= 5:
                        continue
                    day_label = d.strftime("%a, %b %d")
                    date_str = d.strftime("%Y-%m-%d")
                    all_avail.append({
                        "coach_id": coach_id,
                        "date": date_str,
                        "day_label": day_label,
                        "slots": preset,
                        "booked_slots": [],
                    })

        await db.coach_availability.insert_many(all_avail)
        await db.coach_availability.create_index([("coach_id", 1), ("date", 1)])
        logger.info(f"Seeded {len(all_avail)} availability entries.")

    # --- INDEXES ---
    await db.coaching_requests.create_index("coachee_id")
    await db.sessions.create_index("request_id")
    await db.sessions.create_index("coach_id")
    await db.sessions.create_index("coachee_id")
    await db.notifications.create_index("user_id")
    await db.feedback.create_index("request_id")
    await db.scheduled_reminders.create_index("deliver_at")
    await db.scheduled_reminders.create_index("delivered")

    logger.info("Database seeding complete.")
