from database import db
import bcrypt
import logging

logger = logging.getLogger(__name__)

PLATFORM_EMAIL = "Elevate@in.gt.com"
PLATFORM_NAME = "Elevate Team"


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def email_wrap(body_lines):
    """Wrap email body lines into simple HTML."""
    parts = []
    for line in body_lines:
        if line == "":
            parts.append("<br/>")
        else:
            parts.append(f"<p style='margin:0 0 6px 0;'>{line}</p>")
    return "".join(parts)


SIGN_OFF = [
    "",
    "For any queries and support, please write to Elevate@in.gt.com.",
    "",
    "Thank you.",
    "Best regards,",
    "<strong>Elevate Team</strong>",
]

SIGN_OFF_SHORT = [
    "",
    "Thank you.",
    "Best regards,",
    "<strong>Elevate Team</strong>",
]

JOB_CODE_BLOCK = [
    "",
    "<strong>Job code to charge time</strong>",
    "The time spent towards executive coaching should be charged to Elevate job code on WCGT 360\u00b0 by both coach and coachee.",
    "<em>Steps: Login to WCGT 360\u00b0 &rarr; Project Management &rarr; Timesheet &rarr; Timesheet Entry &rarr; Under Client Name, select own entity &rarr; Under Project, select Elevate &rarr; Under Activity Group, select appropriate activity group &rarr; Under Activity, select appropriate activity &rarr; Fill the Narration and Time fields &rarr; Save and Submit</em>",
]


async def seed_database():
    pwd = hash_password("password123")

    # --- USERS ---
    if await db.users.count_documents({}) == 0:
        logger.info("Seeding users...")
        coaches = [
            {
                "id": "coach-1", "email": "fatema.hunaid@in.gt.com", "password_hash": pwd,
                "name": "Fatema Hunaid", "role": "coach", "title": "Executive Coach",
                "gender": "Female", "region": "North",
                "rating": 4.8, "location": "New Delhi, India", "total_sessions": 24,
                "slots": {"available": 2, "total": 2}, "status": "active",
                "employee_status": "Active", "capacity": 2,
                "total_work_experience": 15, "coaching_expertise": "4 hours/month",
                "certifications": ["ICF PCC", "Marshall Goldsmith"],
                "expertise": ["Executive Presence", "Leadership Development", "Change Management"],
                "domains": ["BFSI", "Consulting", "Technology"],
                "about": "Fatema has 15+ years of experience in executive coaching and leadership development.",
                "experience": "15+ years",
                "avatar": "https://randomuser.me/api/portraits/women/44.jpg",
            },
            {
                "id": "coach-2", "email": "vaishali.mane@in.gt.com", "password_hash": pwd,
                "name": "Vaishali Mane", "role": "coach", "title": "Executive Coach",
                "gender": "Female", "region": "West",
                "rating": 4.8, "location": "Mumbai, India", "total_sessions": 18,
                "slots": {"available": 2, "total": 2}, "status": "active",
                "employee_status": "Active", "capacity": 2,
                "total_work_experience": 15, "coaching_expertise": "4 hours/month",
                "certifications": ["ICF ACC", "EMCC Practitioner"],
                "expertise": ["Executive Presence", "Leadership Development", "Stakeholder Engagement"],
                "domains": ["Healthcare", "FMCG", "Retail"],
                "about": "Vaishali brings over 15 years of expertise in executive coaching and leadership development.",
                "experience": "15+ years",
                "avatar": "https://randomuser.me/api/portraits/women/68.jpg",
            },
            {
                "id": "coach-3", "email": "gaurav.jain@in.gt.com", "password_hash": pwd,
                "name": "Gaurav Jain", "role": "coach", "title": "Executive Coach",
                "gender": "Male", "region": "South",
                "rating": 4.8, "location": "Bangalore, India", "total_sessions": 30,
                "slots": {"available": 2, "total": 2}, "status": "active",
                "employee_status": "Active", "capacity": 2,
                "total_work_experience": 15, "coaching_expertise": "6 hours/month",
                "certifications": ["ICF PCC", "CMA Certified"],
                "expertise": ["Executive Presence", "Leadership Development", "Change Management", "Risk Assessment"],
                "domains": ["Technology", "Startups", "E-Commerce"],
                "about": "Gaurav has 15+ years of experience in executive coaching and leadership development.",
                "experience": "15+ years",
                "avatar": "https://randomuser.me/api/portraits/men/32.jpg",
            },
            {
                "id": "coach-4", "email": "ajay.gurung@in.gt.com", "password_hash": pwd,
                "name": "Ajay Gurung", "role": "coach", "title": "Executive Coach",
                "gender": "Male", "region": "West",
                "rating": 4.6, "location": "Pune, India", "total_sessions": 12,
                "slots": {"available": 2, "total": 2}, "status": "active",
                "employee_status": "Active", "capacity": 2,
                "total_work_experience": 12, "coaching_expertise": "3 hours/month",
                "certifications": ["ICF MCC", "SHRM Certified"],
                "expertise": ["Process Improvement", "Project Planning", "Team Communication", "Stakeholder Engagement"],
                "domains": ["Manufacturing", "Consulting", "BFSI"],
                "about": "Ajay brings extensive experience in process optimization and team coaching.",
                "experience": "12+ years",
                "avatar": "https://randomuser.me/api/portraits/men/55.jpg",
            },
            {
                "id": "coach-5", "email": "amina.khan@in.gt.com", "password_hash": pwd,
                "name": "Amina Khan", "role": "coach", "title": "Executive Coach",
                "gender": "Female", "region": "South",
                "rating": 4.5, "location": "Hyderabad, India", "total_sessions": 8,
                "slots": {"available": 0, "total": 2}, "status": "active",
                "employee_status": "Active", "capacity": 2,
                "total_work_experience": 8, "coaching_expertise": "2 hours/month",
                "certifications": ["ICF ACC"],
                "expertise": ["Performance Metrics", "Feedback Mechanisms", "Public Speaking", "Leadership Development"],
                "domains": ["Technology", "Media", "Education"],
                "about": "Amina specializes in performance coaching and communication development.",
                "experience": "8+ years",
                "avatar": "https://randomuser.me/api/portraits/women/33.jpg",
            },
            {
                "id": "coach-6", "email": "rajesh.kumar@in.gt.com", "password_hash": pwd,
                "name": "Rajesh Kumar", "role": "coach", "title": "Leadership Coach",
                "gender": "Male", "region": "South",
                "rating": 4.7, "location": "Chennai, India", "total_sessions": 20,
                "slots": {"available": 1, "total": 3}, "status": "active",
                "employee_status": "Active", "capacity": 3,
                "total_work_experience": 18, "coaching_expertise": "4 hours/month",
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
                "id": "coachee-1", "email": "sarah.johnson@in.gt.com", "password_hash": pwd,
                "name": "Sarah Johnson", "role": "coachee", "gender": "Female", "region": "West",
                "job_title": "Senior Associate", "department": "Audit & Assurance",
                "avatar": "https://randomuser.me/api/portraits/women/10.jpg",
                "tier": "T2", "designation": "Manager", "location": "MUM",
                "business_unit": "Audit & Assurance", "competency": "External Audit",
                "date_of_joining": "2020-06-15", "employee_status": "Active",
                "enrolment_type": "Self-nomination",
                "reason_for_enrolment": "To develop leadership skills and prepare for the next level of my career.",
            },
            {
                "id": "coachee-2", "email": "alex.morgan@in.gt.com", "password_hash": pwd,
                "name": "Alex Morgan", "role": "coachee", "gender": "Male", "region": "North",
                "job_title": "Assistant Manager", "department": "Advisory",
                "avatar": "https://randomuser.me/api/portraits/men/23.jpg",
                "tier": "T2", "designation": "Assistant Manager", "location": "DEL",
                "business_unit": "ESG & Risk Consulting", "competency": "FS Risk",
                "date_of_joining": "2021-03-22", "employee_status": "Active",
                "enrolment_type": "Coach-nominated",
                "reason_for_enrolment": "Nominated by supervisor to build public speaking and stakeholder management skills.",
            },
            {
                "id": "coachee-3", "email": "priya.sharma@in.gt.com", "password_hash": pwd,
                "name": "Priya Sharma", "role": "coachee", "gender": "Female", "region": "South",
                "job_title": "Manager", "department": "Tax & Regulatory",
                "avatar": "https://randomuser.me/api/portraits/women/45.jpg",
                "tier": "T1", "designation": "Senior Manager", "location": "BLR",
                "business_unit": "Direct Tax", "competency": "International Tax",
                "date_of_joining": "2018-09-01", "employee_status": "Active",
                "enrolment_type": "Self-nomination",
                "reason_for_enrolment": "Seeking to strengthen strategic thinking and cross-functional collaboration skills.",
            },
            {
                "id": "coachee-4", "email": "rohan.mehta@in.gt.com", "password_hash": pwd,
                "name": "Rohan Mehta", "role": "coachee", "gender": "Male", "region": "North",
                "job_title": "Associate Director", "department": "Advisory",
                "avatar": "https://randomuser.me/api/portraits/men/46.jpg",
                "tier": "T1", "designation": "Associate Director", "location": "DEL",
                "business_unit": "Business Consulting", "competency": "Strategy & Operations",
                "date_of_joining": "2017-04-10", "employee_status": "Serving Notice Period",
                "enrolment_type": "Manager-nominated",
                "reason_for_enrolment": "Nominated by practice leader to develop executive presence for client-facing leadership roles.",
            },
            {
                "id": "coachee-5", "email": "ananya.reddy@in.gt.com", "password_hash": pwd,
                "name": "Ananya Reddy", "role": "coachee", "gender": "Female", "region": "South",
                "job_title": "Senior Associate", "department": "Assurance",
                "avatar": "https://randomuser.me/api/portraits/women/52.jpg",
                "tier": "T2", "designation": "Manager", "location": "HYD",
                "business_unit": "Assurance", "competency": "Internal Audit",
                "date_of_joining": "2019-11-18", "employee_status": "Active",
                "enrolment_type": "Coach-nominated",
                "reason_for_enrolment": "Recommended by current mentor to develop conflict resolution and team leadership capabilities.",
            },
            {
                "id": "coachee-6", "email": "vikram.singh@in.gt.com", "password_hash": pwd,
                "name": "Vikram Singh", "role": "coachee", "gender": "Male", "region": "South",
                "job_title": "Manager", "department": "Consulting",
                "avatar": "https://randomuser.me/api/portraits/men/62.jpg",
                "tier": "T2", "designation": "Manager", "location": "CHN",
                "business_unit": "Management Consulting", "competency": "Digital Transformation",
                "date_of_joining": "2019-07-22",
                "enrolment_type": "Self-nomination",
                "reason_for_enrolment": "Want to enhance stakeholder engagement and develop a personal leadership brand.",
            },
        ]
        admin = {
            "id": "admin-1", "email": "admin@in.gt.com", "password_hash": pwd,
            "name": "Raeesa Patel", "role": "admin",
            "avatar": "https://randomuser.me/api/portraits/women/1.jpg",
        }
        await db.users.insert_many(coaches + coachees + [admin])
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        logger.info(f"Seeded {len(coaches) + len(coachees) + 1} users.")

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

    # --- COACH AVAILABILITY (current + next month) ---
    if await db.coach_availability.count_documents({}) == 0:
        logger.info("Seeding coach availability...")

        import calendar as cal
        from datetime import date

        today = date.today()
        current_month = today.month
        current_year = today.year
        next_month = current_month + 1 if current_month < 12 else 1
        next_year = current_year if current_month < 12 else current_year + 1

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

            for month, year in [(current_month, current_year), (next_month, next_year)]:
                days_in_month = cal.monthrange(year, month)[1]
                for day in range(1, days_in_month + 1):
                    d = date(year, month, day)
                    if d.weekday() >= 5:
                        continue
                    if d < today:
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

    # --- DEMO EMAILS ---
    if await db.emails.count_documents({}) == 0:
        logger.info("Seeding demo emails...")
        await seed_demo_emails()

    # --- INDEXES ---
    await db.coaching_requests.create_index("coachee_id")
    await db.sessions.create_index("request_id")
    await db.sessions.create_index("coach_id")
    await db.sessions.create_index("coachee_id")
    await db.notifications.create_index("user_id")
    await db.feedback.create_index("request_id")
    await db.scheduled_reminders.create_index("deliver_at")
    await db.scheduled_reminders.create_index("delivered")
    await db.emails.create_index("to_user_id")

    logger.info("Database seeding complete.")


async def seed_demo_emails():
    """Seed realistic demo emails based on the Elevate communication templates."""
    emails = []
    eid = 0

    def make(to_user_id, to_email, subject, body_lines, cc=None, created_at="2026-01-20T09:00:00+00:00", read=False, preview=None):
        nonlocal eid
        eid += 1
        body = email_wrap(body_lines)
        return {
            "id": f"email-{eid}",
            "from_email": PLATFORM_EMAIL,
            "from_name": PLATFORM_NAME,
            "to_email": to_email,
            "to_user_id": to_user_id,
            "cc": cc or [],
            "subject": subject,
            "body": body,
            "preview": preview or (body_lines[1] if len(body_lines) > 1 else body_lines[0])[:120],
            "read": read,
            "created_at": created_at,
        }

    # ========================================================================
    # SARAH JOHNSON (coachee-1) - Completed journey with Gaurav
    # ========================================================================

    # T1: Registration received (self-nomination)
    emails.append(make(
        "coachee-1", "sarah.johnson@in.gt.com",
        "Coachee registration status",
        [
            "Dear Sarah,",
            "Hope you are doing well.",
            "We are pleased to inform that we have received your registration as a coachee under Elevate. As next steps, you are requested to select your preferred coach from the list of available coaches on the platform.",
            "",
            "Please share the following information:",
            "&bull; Coach preference 1",
            "&bull; Coach preference 2",
            "&bull; Coach preference 3",
            "",
            "After we receive the above information, you will be notified on the coach selection status.",
            "For more information, <a href='#'>click here</a> to read about Elevate.",
        ] + SIGN_OFF,
        created_at="2025-11-01T09:00:00+00:00", read=True,
        preview="We have received your registration as a coachee under Elevate.",
    ))

    # T7: Thank you for preferences
    emails.append(make(
        "coachee-1", "sarah.johnson@in.gt.com",
        "Coach preferences received",
        [
            "Dear Sarah,",
            "Hope you are doing well.",
            "Thank you for sharing your coach preferences. We will soon confirm on the coach's availability.",
            "Thank you for your patience.",
        ] + SIGN_OFF_SHORT,
        created_at="2025-11-05T10:00:00+00:00", read=True,
        preview="Thank you for sharing your coach preferences.",
    ))

    # T12: Coach assigned - Introduction email
    emails.append(make(
        "coachee-1", "sarah.johnson@in.gt.com",
        "Embark on your learning journey",
        [
            "Dear Sarah,",
            "We are pleased to inform that based on your preference, <strong>Gaurav Jain</strong>, Executive Coach has been assigned as your coach. He brings a wealth of experience and knowledge that will be invaluable to your learning journey and help you unlock your potential with executive coaching.",
            "",
            "To support you in this journey, please find below <strong>guidelines for coachee</strong>:",
            "&bull; You can define your time investment in discussion with the coach",
            "&bull; You will be responsible for scheduling the coaching sessions with the coach",
            "&bull; Sessions can be in-person or virtual. For virtual sessions, the use of video is encouraged",
            "&bull; Maintain a positive attitude throughout the learning journey",
            "&bull; You will be accountable for your own progress and should implement the actions discussed",
            "&bull; Both coach and coachee should engage in reflective practice exercises to track progress",
        ] + JOB_CODE_BLOCK + [
            "",
            "Please take it forward from here and initiate your coaching sessions with the coach.",
        ] + SIGN_OFF,
        cc=["gaurav.jain@in.gt.com"],
        created_at="2025-11-10T09:00:00+00:00", read=True,
        preview="Gaurav Jain has been assigned as your coach.",
    ))

    # T14: Details requested
    emails.append(make(
        "coachee-1", "sarah.johnson@in.gt.com",
        "Details requested on your learning journey",
        [
            "Dear Sarah,",
            "Hope you have started your learning journey with your coach. Your timely engagement during this journey is important for your development and progress.",
            "Request you to share a few details with us for our record. Click here to submit the details.",
        ] + JOB_CODE_BLOCK + SIGN_OFF,
        created_at="2025-12-01T09:00:00+00:00", read=True,
        preview="Hope you have started your learning journey with your coach.",
    ))

    # T16: Feedback request
    emails.append(make(
        "coachee-1", "sarah.johnson@in.gt.com",
        "We value your feedback",
        [
            "Dear Sarah,",
            "Hope you are doing well. Building on this foundation of executive coaching, we introduced Elevate in January 2025, an extension to our coaching framework to support our Tier 1 and 2 personnel with executive coaching.",
            "We would appreciate your valuable feedback on your overall experience as this will help us to enhance the programme. <a href='#'>Click here</a> to share your feedback.",
        ] + SIGN_OFF,
        created_at="2026-01-25T09:00:00+00:00", read=False,
        preview="We would appreciate your valuable feedback on your overall experience.",
    ))

    # ========================================================================
    # ALEX MORGAN (coachee-2) - Coach-nominated, awaiting journey
    # ========================================================================

    # T2: Nominated for Elevate
    emails.append(make(
        "coachee-2", "alex.morgan@in.gt.com",
        "Nominated for Elevate",
        [
            "Dear Alex,",
            "Hope you are doing well.",
            "We are pleased to inform that you have been nominated by your Co-SuperCoach to be enrolled as a coachee under Elevate. As next steps, you are requested to select your preferred coach from the list of available coaches on the platform.",
            "",
            "Please share the following information:",
            "&bull; Coach preference 1",
            "&bull; Coach preference 2",
            "&bull; Coach preference 3",
            "",
            "After we receive the above information, you will be notified on the coach selection status.",
            "For more information, <a href='#'>click here</a> to read about Elevate.",
        ] + SIGN_OFF,
        created_at="2026-01-10T09:00:00+00:00", read=True,
        preview="You have been nominated by your Co-SuperCoach for Elevate.",
    ))

    # T7: Preferences received
    emails.append(make(
        "coachee-2", "alex.morgan@in.gt.com",
        "Coach preferences received",
        [
            "Dear Alex,",
            "Hope you are doing well.",
            "Thank you for sharing your coach preferences. We will soon confirm on the coach's availability.",
            "Thank you for your patience.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-01-15T10:00:00+00:00", read=True,
        preview="Thank you for sharing your coach preferences.",
    ))

    # T12: Coach assigned
    emails.append(make(
        "coachee-2", "alex.morgan@in.gt.com",
        "Embark on your learning journey",
        [
            "Dear Alex,",
            "We are pleased to inform that based on your preference, <strong>Fatema Hunaid</strong>, Executive Coach has been assigned as your coach. She brings a wealth of experience and knowledge that will be invaluable to your learning journey and help you unlock your potential with executive coaching.",
            "",
            "To support you in this journey, please find below <strong>guidelines for coachee</strong>:",
            "&bull; You can define your time investment in discussion with the coach",
            "&bull; You will be responsible for scheduling the coaching sessions with the coach",
            "&bull; Sessions can be in-person or virtual. For virtual sessions, the use of video is encouraged",
            "&bull; Maintain a positive attitude throughout the learning journey",
            "&bull; You will be accountable for your own progress",
        ] + JOB_CODE_BLOCK + [
            "",
            "Please take it forward from here and initiate your coaching sessions with the coach.",
        ] + SIGN_OFF,
        cc=["fatema.hunaid@in.gt.com"],
        created_at="2026-02-01T09:00:00+00:00", read=False,
        preview="Fatema Hunaid has been assigned as your coach.",
    ))

    # ========================================================================
    # PRIYA SHARMA (coachee-3) - Self-nomination, active journey with Vaishali
    # ========================================================================

    emails.append(make(
        "coachee-3", "priya.sharma@in.gt.com",
        "Coachee registration status",
        [
            "Dear Priya,",
            "Hope you are doing well.",
            "We are pleased to inform that we have received your registration as a coachee under Elevate. As next steps, you are requested to select your preferred coach from the list of available coaches.",
            "",
            "Please share the following information:",
            "&bull; Coach preference 1",
            "&bull; Coach preference 2",
            "&bull; Coach preference 3",
        ] + SIGN_OFF,
        created_at="2026-01-05T09:00:00+00:00", read=True,
        preview="We have received your registration as a coachee under Elevate.",
    ))

    emails.append(make(
        "coachee-3", "priya.sharma@in.gt.com",
        "Coach preferences received",
        [
            "Dear Priya,",
            "Hope you are doing well.",
            "Thank you for sharing your coach preferences. We will soon confirm on the coach's availability.",
            "Thank you for your patience.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-01-12T10:00:00+00:00", read=True,
        preview="Thank you for sharing your coach preferences.",
    ))

    emails.append(make(
        "coachee-3", "priya.sharma@in.gt.com",
        "Embark on your learning journey",
        [
            "Dear Priya,",
            "We are pleased to inform that based on your preference, <strong>Vaishali Mane</strong>, Executive Coach has been assigned as your coach. She brings a wealth of experience and knowledge that will be invaluable to your learning journey.",
            "",
            "To support you in this journey, please find below <strong>guidelines for coachee</strong>:",
            "&bull; You can define your time investment in discussion with the coach",
            "&bull; You will be responsible for scheduling the coaching sessions",
            "&bull; Sessions can be in-person or virtual",
            "&bull; Maintain a positive attitude throughout the learning journey",
            "&bull; You will be accountable for your own progress",
        ] + JOB_CODE_BLOCK + [
            "",
            "Please take it forward from here and initiate your coaching sessions with the coach.",
        ] + SIGN_OFF,
        cc=["vaishali.mane@in.gt.com"],
        created_at="2026-01-20T09:00:00+00:00", read=False,
        preview="Vaishali Mane has been assigned as your coach.",
    ))

    emails.append(make(
        "coachee-3", "priya.sharma@in.gt.com",
        "Details requested on your learning journey",
        [
            "Dear Priya,",
            "Hope you have started your learning journey with your coach. Your timely engagement during this journey is important for your development and progress.",
            "Request you to share a few details with us for our record. <a href='#'>Click here</a> to submit the details.",
        ] + JOB_CODE_BLOCK + SIGN_OFF,
        created_at="2026-02-10T09:00:00+00:00", read=False,
        preview="Hope you have started your learning journey with your coach.",
    ))

    # ========================================================================
    # ROHAN MEHTA (coachee-4) - Manager-nominated, preferences pending
    # ========================================================================

    emails.append(make(
        "coachee-4", "rohan.mehta@in.gt.com",
        "Nominated for Elevate",
        [
            "Dear Rohan,",
            "Hope you are doing well.",
            "We are pleased to inform that you have been nominated by your practice leader to be enrolled as a coachee under Elevate. As next steps, you are requested to select your preferred coach from the list of available coaches.",
            "",
            "Please share the following information:",
            "&bull; Coach preference 1",
            "&bull; Coach preference 2",
            "&bull; Coach preference 3",
        ] + SIGN_OFF,
        created_at="2026-02-15T09:00:00+00:00", read=True,
        preview="You have been nominated by your practice leader for Elevate.",
    ))

    # T6: Reminder
    emails.append(make(
        "coachee-4", "rohan.mehta@in.gt.com",
        "Reminder: Share your coach preference",
        [
            "Dear Rohan,",
            "Hope you are doing well.",
            "A gentle reminder to share your coach preference by EOD today.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-02-20T09:00:00+00:00", read=False,
        preview="A gentle reminder to share your coach preference by EOD today.",
    ))

    emails.append(make(
        "coachee-4", "rohan.mehta@in.gt.com",
        "Reminder: Coach preference still pending",
        [
            "Dear Rohan,",
            "Hope you are doing well.",
            "This is a follow-up reminder to please share your coach preference at the earliest. Your timely response will help us initiate the coaching journey smoothly.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-03-01T09:00:00+00:00", read=False,
        preview="This is a follow-up reminder to share your coach preference.",
    ))

    # ========================================================================
    # ANANYA REDDY (coachee-5) - Coach-nominated, journey started with Amina
    # ========================================================================

    emails.append(make(
        "coachee-5", "ananya.reddy@in.gt.com",
        "Nominated for Elevate",
        [
            "Dear Ananya,",
            "Hope you are doing well.",
            "We are pleased to inform that you have been nominated by your current mentor to be enrolled as a coachee under Elevate. As next steps, you are requested to select your preferred coach from the list of available coaches.",
            "",
            "Please share the following information:",
            "&bull; Coach preference 1",
            "&bull; Coach preference 2",
            "&bull; Coach preference 3",
        ] + SIGN_OFF,
        created_at="2026-01-08T09:00:00+00:00", read=True,
        preview="You have been nominated by your mentor for Elevate.",
    ))

    emails.append(make(
        "coachee-5", "ananya.reddy@in.gt.com",
        "Coach preferences received",
        [
            "Dear Ananya,",
            "Hope you are doing well.",
            "Thank you for sharing your coach preferences. We will soon confirm on the coach's availability.",
            "Thank you for your patience.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-01-14T10:00:00+00:00", read=True,
        preview="Thank you for sharing your coach preferences.",
    ))

    emails.append(make(
        "coachee-5", "ananya.reddy@in.gt.com",
        "Embark on your learning journey",
        [
            "Dear Ananya,",
            "We are pleased to inform that based on your preference, <strong>Amina Khan</strong>, Executive Coach has been assigned as your coach. She brings a wealth of experience and knowledge that will be invaluable to your learning journey.",
            "",
            "To support you in this journey, please find below <strong>guidelines for coachee</strong>:",
            "&bull; You can define your time investment in discussion with the coach",
            "&bull; You will be responsible for scheduling the coaching sessions",
            "&bull; Sessions can be in-person or virtual. For virtual sessions, use of video is encouraged",
            "&bull; Maintain a positive attitude throughout the learning journey",
            "&bull; You will be accountable for your own progress",
        ] + JOB_CODE_BLOCK + [
            "",
            "Please take it forward from here and initiate your coaching sessions with the coach.",
        ] + SIGN_OFF,
        cc=["amina.khan@in.gt.com"],
        created_at="2026-01-28T09:00:00+00:00", read=False,
        preview="Amina Khan has been assigned as your coach.",
    ))

    # ========================================================================
    # VIKRAM SINGH (coachee-6) - Self-nomination, coach availability pending
    # ========================================================================

    emails.append(make(
        "coachee-6", "vikram.singh@in.gt.com",
        "Coachee registration status",
        [
            "Dear Vikram,",
            "Hope you are doing well.",
            "We are pleased to inform that we have received your registration as a coachee under Elevate. As next steps, you are requested to select your preferred coach from the list of available coaches.",
            "",
            "Please share the following information:",
            "&bull; Coach preference 1",
            "&bull; Coach preference 2",
            "&bull; Coach preference 3",
        ] + SIGN_OFF,
        created_at="2026-02-05T09:00:00+00:00", read=True,
        preview="We have received your registration as a coachee under Elevate.",
    ))

    emails.append(make(
        "coachee-6", "vikram.singh@in.gt.com",
        "Coach preferences received",
        [
            "Dear Vikram,",
            "Hope you are doing well.",
            "Thank you for sharing your coach preferences. We will soon confirm on the coach's availability.",
            "Thank you for your patience.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-02-12T10:00:00+00:00", read=False,
        preview="Thank you for sharing your coach preferences. Availability check in progress.",
    ))

    # ========================================================================
    # COACH EMAILS
    # ========================================================================

    # Gaurav (coach-3) - Availability request for Sarah (self-nom)
    emails.append(make(
        "coach-3", "gaurav.jain@in.gt.com",
        "Executive coaching \u2013 Availability requested",
        [
            "Dear Gaurav,",
            "Hope you are doing well.",
            "This is to inform that the personnel mentioned below has enrolled as a coachee under Elevate and has selected you as the preferred coach. We are writing to request your confirmation if we can initiate the learning journey.",
            "",
            "<strong>Coachee Details:</strong>",
            "<table style='border-collapse:collapse;width:100%;margin:8px 0;'>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;width:40%;'>Name</td><td style='padding:4px 8px;border:1px solid #ddd;'>Sarah Johnson</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Email</td><td style='padding:4px 8px;border:1px solid #ddd;'>sarah.johnson@in.gt.com</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Tier</td><td style='padding:4px 8px;border:1px solid #ddd;'>T2</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Designation</td><td style='padding:4px 8px;border:1px solid #ddd;'>Manager</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Location</td><td style='padding:4px 8px;border:1px solid #ddd;'>MUM</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Business Unit</td><td style='padding:4px 8px;border:1px solid #ddd;'>Audit & Assurance</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Competency</td><td style='padding:4px 8px;border:1px solid #ddd;'>External Audit</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Enrolment type</td><td style='padding:4px 8px;border:1px solid #ddd;'>Self-nomination</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Reason</td><td style='padding:4px 8px;border:1px solid #ddd;'>To develop leadership skills and prepare for the next level of my career.</td></tr>"
            "</table>",
            "",
            "We look forward to your support in helping our people unlock their potential with executive coaching.",
        ] + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2025-11-06T09:00:00+00:00", read=True,
        preview="Sarah Johnson has selected you as preferred coach. Confirmation requested.",
    ))

    # Gaurav - Guidelines after accepting
    emails.append(make(
        "coach-3", "gaurav.jain@in.gt.com",
        "Guidelines for coach",
        [
            "Dear Gaurav,",
            "Thank you for agreeing to support with executive coaching to help our people unlock their potential. We appreciate your commitment and dedication. Your role is pivotal in guiding and enabling a coaching culture in the Firm while leading to our #Great2Exceptional journey.",
            "",
            "To support you in this journey, please find below essential information:",
            "&bull; <strong>Coach's Guidebook</strong> \u2013 attached",
            "&bull; Create a psychologically safe space where conversations remain confidential",
            "&bull; Use a structured approach and begin each coaching conversation by setting clear objectives",
            "&bull; Aim for a high stretch comfort level of 6/10 when setting goals",
            "&bull; The coachee will be accountable for their own progress, while the coach should focus on active listening and effective coaching practices",
            "&bull; The coachee will be responsible for scheduling coaching sessions (in-person or virtual)",
        ] + JOB_CODE_BLOCK + [
            "",
            "We will shortly be sending the introduction email with you and the coachee.",
        ] + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2025-11-08T09:00:00+00:00", read=True,
        preview="Thank you for agreeing to support with executive coaching.",
    ))

    # Fatema (coach-1) - Availability request for Alex (nominated)
    emails.append(make(
        "coach-1", "fatema.hunaid@in.gt.com",
        "Executive coaching \u2013 Availability requested",
        [
            "Dear Fatema,",
            "Hope you are doing well.",
            "This is to inform that the personnel mentioned below has been nominated by their Co-SuperCoach to be enrolled as a coachee under Elevate and has selected you as the preferred coach.",
            "",
            "<strong>Coachee Details:</strong>",
            "<table style='border-collapse:collapse;width:100%;margin:8px 0;'>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;width:40%;'>Name</td><td style='padding:4px 8px;border:1px solid #ddd;'>Alex Morgan</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Email</td><td style='padding:4px 8px;border:1px solid #ddd;'>alex.morgan@in.gt.com</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Tier</td><td style='padding:4px 8px;border:1px solid #ddd;'>T2</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Designation</td><td style='padding:4px 8px;border:1px solid #ddd;'>Assistant Manager</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Location</td><td style='padding:4px 8px;border:1px solid #ddd;'>DEL</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Business Unit</td><td style='padding:4px 8px;border:1px solid #ddd;'>ESG & Risk Consulting</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Enrolment type</td><td style='padding:4px 8px;border:1px solid #ddd;'>Coach-nominated</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Reason</td><td style='padding:4px 8px;border:1px solid #ddd;'>Nominated by supervisor to build public speaking and stakeholder management skills.</td></tr>"
            "</table>",
            "",
            "We look forward to your support in helping our people unlock their potential.",
        ] + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2026-01-18T09:00:00+00:00", read=True,
        preview="Alex Morgan has selected you as preferred coach. Confirmation requested.",
    ))

    # Fatema - Guidelines
    emails.append(make(
        "coach-1", "fatema.hunaid@in.gt.com",
        "Guidelines for coach",
        [
            "Dear Fatema,",
            "Thank you for agreeing to support with executive coaching to help our people unlock their potential. We appreciate your commitment and dedication.",
            "",
            "To support you in this journey, please find below essential information:",
            "&bull; <strong>Coach's Guidebook</strong> \u2013 attached",
            "&bull; Create a psychologically safe space where conversations remain confidential",
            "&bull; Use a structured approach and begin each coaching conversation by setting clear objectives",
            "&bull; Aim for a high stretch comfort level of 6/10 when setting goals",
            "&bull; The coachee will be accountable for their own progress",
        ] + JOB_CODE_BLOCK + [
            "",
            "We will shortly be sending the introduction email with you and the coachee.",
        ] + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2026-01-25T09:00:00+00:00", read=False,
        preview="Thank you for agreeing to support with executive coaching.",
    ))

    # Fatema - Reminder to confirm for another coachee
    emails.append(make(
        "coach-1", "fatema.hunaid@in.gt.com",
        "Coach reminder: Confirm availability",
        [
            "Dear Fatema,",
            "Hope you are doing well.",
            "A gentle reminder to please confirm on your availability for the below coachee by EOD today.",
            "",
            "<strong>Coachee:</strong> Vikram Singh (vikram.singh@in.gt.com)",
            "<strong>Location:</strong> CHN | <strong>Tier:</strong> T2 | <strong>BU:</strong> Management Consulting",
        ] + SIGN_OFF_SHORT,
        created_at="2026-02-18T09:00:00+00:00", read=False,
        preview="Reminder to confirm your availability for Vikram Singh.",
    ))

    # Vaishali (coach-2) - Availability request for Priya
    emails.append(make(
        "coach-2", "vaishali.mane@in.gt.com",
        "Executive coaching \u2013 Availability requested",
        [
            "Dear Vaishali,",
            "Hope you are doing well.",
            "This is to inform that the personnel mentioned below has enrolled as a coachee under Elevate and has selected you as the preferred coach.",
            "",
            "<strong>Coachee Details:</strong>",
            "<table style='border-collapse:collapse;width:100%;margin:8px 0;'>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;width:40%;'>Name</td><td style='padding:4px 8px;border:1px solid #ddd;'>Priya Sharma</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Email</td><td style='padding:4px 8px;border:1px solid #ddd;'>priya.sharma@in.gt.com</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Tier</td><td style='padding:4px 8px;border:1px solid #ddd;'>T1</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Designation</td><td style='padding:4px 8px;border:1px solid #ddd;'>Senior Manager</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Location</td><td style='padding:4px 8px;border:1px solid #ddd;'>BLR</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Business Unit</td><td style='padding:4px 8px;border:1px solid #ddd;'>Direct Tax</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Enrolment type</td><td style='padding:4px 8px;border:1px solid #ddd;'>Self-nomination</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Reason</td><td style='padding:4px 8px;border:1px solid #ddd;'>Seeking to strengthen strategic thinking and cross-functional collaboration skills.</td></tr>"
            "</table>",
        ] + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2026-01-15T09:00:00+00:00", read=True,
        preview="Priya Sharma has selected you as preferred coach. Confirmation requested.",
    ))

    # Vaishali - Guidelines
    emails.append(make(
        "coach-2", "vaishali.mane@in.gt.com",
        "Guidelines for coach",
        [
            "Dear Vaishali,",
            "Thank you for agreeing to support with executive coaching to help our people unlock their potential. We appreciate your commitment and dedication.",
            "",
            "To support you in this journey:",
            "&bull; <strong>Coach's Guidebook</strong> \u2013 attached",
            "&bull; Create a psychologically safe space where conversations remain confidential",
            "&bull; Use a structured approach with clear objectives",
            "&bull; Aim for a high stretch comfort level of 6/10 when setting goals",
        ] + JOB_CODE_BLOCK + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2026-01-18T09:00:00+00:00", read=False,
        preview="Thank you for agreeing to support with executive coaching.",
    ))

    # Amina (coach-5) - Availability request for Ananya (coach-nominated)
    emails.append(make(
        "coach-5", "amina.khan@in.gt.com",
        "Executive coaching \u2013 Availability requested",
        [
            "Dear Amina,",
            "Hope you are doing well.",
            "This is to inform that the personnel mentioned below has been nominated to be enrolled as a coachee under Elevate and has selected you as the preferred coach.",
            "",
            "<strong>Coachee Details:</strong>",
            "<table style='border-collapse:collapse;width:100%;margin:8px 0;'>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;width:40%;'>Name</td><td style='padding:4px 8px;border:1px solid #ddd;'>Ananya Reddy</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Email</td><td style='padding:4px 8px;border:1px solid #ddd;'>ananya.reddy@in.gt.com</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Tier</td><td style='padding:4px 8px;border:1px solid #ddd;'>T2</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Location</td><td style='padding:4px 8px;border:1px solid #ddd;'>HYD</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>BU</td><td style='padding:4px 8px;border:1px solid #ddd;'>Assurance</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Enrolment type</td><td style='padding:4px 8px;border:1px solid #ddd;'>Coach-nominated</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Reason</td><td style='padding:4px 8px;border:1px solid #ddd;'>Recommended by current mentor to develop conflict resolution and team leadership capabilities.</td></tr>"
            "</table>",
        ] + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2026-01-16T09:00:00+00:00", read=True,
        preview="Ananya Reddy has selected you as preferred coach. Confirmation requested.",
    ))

    # Amina - Guidelines
    emails.append(make(
        "coach-5", "amina.khan@in.gt.com",
        "Guidelines for coach",
        [
            "Dear Amina,",
            "Thank you for agreeing to support with executive coaching. We appreciate your commitment and dedication.",
            "",
            "To support you in this journey:",
            "&bull; <strong>Coach's Guidebook</strong> \u2013 attached",
            "&bull; Create a psychologically safe space",
            "&bull; Use a structured approach with clear objectives",
            "&bull; Aim for high stretch comfort level of 6/10",
        ] + JOB_CODE_BLOCK + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2026-01-22T09:00:00+00:00", read=False,
        preview="Thank you for agreeing to support with executive coaching.",
    ))

    # Rajesh (coach-6) - Availability request for Vikram
    emails.append(make(
        "coach-6", "rajesh.kumar@in.gt.com",
        "Executive coaching \u2013 Availability requested",
        [
            "Dear Rajesh,",
            "Hope you are doing well.",
            "This is to inform that the personnel mentioned below has enrolled as a coachee under Elevate and has selected you as the preferred coach.",
            "",
            "<strong>Coachee Details:</strong>",
            "<table style='border-collapse:collapse;width:100%;margin:8px 0;'>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;width:40%;'>Name</td><td style='padding:4px 8px;border:1px solid #ddd;'>Vikram Singh</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Email</td><td style='padding:4px 8px;border:1px solid #ddd;'>vikram.singh@in.gt.com</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Tier</td><td style='padding:4px 8px;border:1px solid #ddd;'>T2</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Location</td><td style='padding:4px 8px;border:1px solid #ddd;'>CHN</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>BU</td><td style='padding:4px 8px;border:1px solid #ddd;'>Management Consulting</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Enrolment</td><td style='padding:4px 8px;border:1px solid #ddd;'>Self-nomination</td></tr>"
            "<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;'>Reason</td><td style='padding:4px 8px;border:1px solid #ddd;'>Want to enhance stakeholder engagement and develop a personal leadership brand.</td></tr>"
            "</table>",
        ] + SIGN_OFF,
        cc=["admin@in.gt.com"],
        created_at="2026-02-14T09:00:00+00:00", read=False,
        preview="Vikram Singh has selected you as preferred coach. Confirmation requested.",
    ))

    # Ajay (coach-4) - Coach reminder
    emails.append(make(
        "coach-4", "ajay.gurung@in.gt.com",
        "Coach reminder: Confirm availability",
        [
            "Dear Ajay,",
            "Hope you are doing well.",
            "A gentle reminder to please confirm on your availability for the below coachee by EOD today.",
            "",
            "<strong>Coachee:</strong> Rohan Mehta (rohan.mehta@in.gt.com)",
            "<strong>Location:</strong> DEL | <strong>Tier:</strong> T1 | <strong>BU:</strong> Business Consulting",
        ] + SIGN_OFF_SHORT,
        created_at="2026-02-25T09:00:00+00:00", read=False,
        preview="Reminder to confirm your availability for Rohan Mehta.",
    ))

    # ========================================================================
    # ADMIN EMAILS
    # ========================================================================

    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "New coachee registration: Sarah Johnson",
        [
            "Dear Raeesa,",
            "A new self-nomination registration has been received.",
            "",
            "<strong>Coachee:</strong> Sarah Johnson (sarah.johnson@in.gt.com)",
            "<strong>Tier:</strong> T2 | <strong>Designation:</strong> Manager | <strong>Location:</strong> MUM",
            "<strong>Business Unit:</strong> Audit & Assurance",
            "<strong>Reason:</strong> To develop leadership skills and prepare for the next level of my career.",
            "",
            "Please review and approve/reject via the Admin Dashboard.",
        ] + SIGN_OFF_SHORT,
        created_at="2025-11-01T08:30:00+00:00", read=True,
        preview="New self-nomination registration from Sarah Johnson.",
    ))

    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "New coachee registration: Alex Morgan",
        [
            "Dear Raeesa,",
            "A new coach-nominated registration has been received.",
            "",
            "<strong>Coachee:</strong> Alex Morgan (alex.morgan@in.gt.com)",
            "<strong>Tier:</strong> T2 | <strong>Designation:</strong> Assistant Manager | <strong>Location:</strong> DEL",
            "<strong>Business Unit:</strong> ESG & Risk Consulting",
            "<strong>Nomination:</strong> Coach-nominated",
        ] + SIGN_OFF_SHORT,
        created_at="2026-01-10T08:30:00+00:00", read=True,
        preview="New coach-nominated registration from Alex Morgan.",
    ))

    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "New coachee registration: Priya Sharma",
        [
            "Dear Raeesa,",
            "A new self-nomination registration has been received.",
            "",
            "<strong>Coachee:</strong> Priya Sharma (priya.sharma@in.gt.com)",
            "<strong>Tier:</strong> T1 | <strong>Designation:</strong> Senior Manager | <strong>Location:</strong> BLR",
            "<strong>Business Unit:</strong> Direct Tax",
            "<strong>Reason:</strong> Seeking to strengthen strategic thinking and cross-functional collaboration skills.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-01-05T08:30:00+00:00", read=True,
        preview="New self-nomination registration from Priya Sharma.",
    ))

    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "New coachee registration: Rohan Mehta",
        [
            "Dear Raeesa,",
            "A new manager-nominated registration has been received.",
            "",
            "<strong>Coachee:</strong> Rohan Mehta (rohan.mehta@in.gt.com)",
            "<strong>Tier:</strong> T1 | <strong>Designation:</strong> Associate Director | <strong>Location:</strong> DEL",
            "<strong>Business Unit:</strong> Business Consulting",
            "<strong>Nomination:</strong> Manager-nominated",
        ] + SIGN_OFF_SHORT,
        created_at="2026-02-15T08:30:00+00:00", read=False,
        preview="New manager-nominated registration from Rohan Mehta.",
    ))

    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "New coachee registration: Ananya Reddy",
        [
            "Dear Raeesa,",
            "A new coach-nominated registration has been received.",
            "",
            "<strong>Coachee:</strong> Ananya Reddy (ananya.reddy@in.gt.com)",
            "<strong>Tier:</strong> T2 | <strong>Designation:</strong> Manager | <strong>Location:</strong> HYD",
            "<strong>Business Unit:</strong> Assurance",
            "<strong>Nomination:</strong> Coach-nominated",
        ] + SIGN_OFF_SHORT,
        created_at="2026-01-08T08:30:00+00:00", read=True,
        preview="New coach-nominated registration from Ananya Reddy.",
    ))

    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "New coachee registration: Vikram Singh",
        [
            "Dear Raeesa,",
            "A new self-nomination registration has been received.",
            "",
            "<strong>Coachee:</strong> Vikram Singh (vikram.singh@in.gt.com)",
            "<strong>Tier:</strong> T2 | <strong>Designation:</strong> Manager | <strong>Location:</strong> CHN",
            "<strong>Business Unit:</strong> Management Consulting",
            "<strong>Reason:</strong> Want to enhance stakeholder engagement and develop a personal leadership brand.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-02-05T08:30:00+00:00", read=False,
        preview="New self-nomination registration from Vikram Singh.",
    ))

    # Admin - Coach confirmation received
    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "Coach confirmed: Gaurav Jain for Sarah Johnson",
        [
            "Dear Raeesa,",
            "Coach <strong>Gaurav Jain</strong> has confirmed availability for coachee <strong>Sarah Johnson</strong>.",
            "The introduction email has been sent to both parties. The learning journey can now begin.",
        ] + SIGN_OFF_SHORT,
        created_at="2025-11-08T10:00:00+00:00", read=True,
        preview="Gaurav Jain confirmed availability for Sarah Johnson.",
    ))

    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "Coach confirmed: Fatema Hunaid for Alex Morgan",
        [
            "Dear Raeesa,",
            "Coach <strong>Fatema Hunaid</strong> has confirmed availability for coachee <strong>Alex Morgan</strong>.",
            "The introduction email has been sent to both parties.",
        ] + SIGN_OFF_SHORT,
        created_at="2026-01-28T10:00:00+00:00", read=True,
        preview="Fatema Hunaid confirmed availability for Alex Morgan.",
    ))

    emails.append(make(
        "admin-1", "admin@in.gt.com",
        "Journey completed: Sarah Johnson with Gaurav Jain",
        [
            "Dear Raeesa,",
            "The coaching journey between <strong>Sarah Johnson</strong> and <strong>Gaurav Jain</strong> has been completed (6/6 sessions).",
            "Feedback form has been sent to the coachee.",
            "",
            "<strong>Overall Rating:</strong> 5/5",
            "<strong>Coach Rating:</strong> 5/5",
        ] + SIGN_OFF_SHORT,
        created_at="2026-01-20T10:00:00+00:00", read=False,
        preview="Sarah Johnson's coaching journey with Gaurav Jain completed.",
    ))

    await db.emails.insert_many(emails)
    logger.info(f"Seeded {len(emails)} demo emails.")
