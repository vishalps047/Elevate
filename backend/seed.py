from database import db
import hashlib
import logging

logger = logging.getLogger(__name__)


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


async def seed_database():
    count = await db.users.count_documents({})
    if count > 0:
        logger.info("Database already seeded, skipping.")
        return

    logger.info("Seeding database...")
    pwd = hash_password("password123")

    coaches = [
        {
            "id": "coach-1",
            "email": "fatema@elevate.com",
            "password_hash": pwd,
            "name": "Fatema Hunaid",
            "role": "coach",
            "title": "Executive Coach",
            "rating": 4.8,
            "location": "New Delhi, India",
            "total_sessions": 0,
            "slots": {"available": 2, "total": 2},
            "status": "active",
            "certifications": ["ICF PCC", "Marshall Goldsmith"],
            "expertise": ["Executive Presence", "Leadership Development", "Change Management"],
            "domains": ["BFSI", "Consulting", "Technology"],
            "about": "Fatema has 15+ years of experience in executive coaching and leadership development. She specializes in helping professionals transition into senior leadership roles.",
            "experience": "15+ years",
            "avatar": "https://randomuser.me/api/portraits/women/44.jpg",
        },
        {
            "id": "coach-2",
            "email": "vaishali@elevate.com",
            "password_hash": pwd,
            "name": "Vaishali Mane",
            "role": "coach",
            "title": "Executive Coach",
            "rating": 4.8,
            "location": "Mumbai, India",
            "total_sessions": 0,
            "slots": {"available": 2, "total": 2},
            "status": "active",
            "certifications": ["ICF ACC", "EMCC Practitioner"],
            "expertise": ["Executive Presence", "Leadership Development", "Stakeholder Engagement"],
            "domains": ["Healthcare", "FMCG", "Retail"],
            "about": "Vaishali brings over 15 years of expertise in executive coaching and leadership development. She focuses on guiding professionals as they move into senior leadership positions.",
            "experience": "15+ years",
            "avatar": "https://randomuser.me/api/portraits/women/68.jpg",
        },
        {
            "id": "coach-3",
            "email": "gaurav@elevate.com",
            "password_hash": pwd,
            "name": "Gaurav Jain",
            "role": "coach",
            "title": "Executive Coach",
            "rating": 4.8,
            "location": "Bangalore, India",
            "total_sessions": 0,
            "slots": {"available": 2, "total": 2},
            "status": "active",
            "certifications": ["ICF PCC", "CMA Certified"],
            "expertise": ["Executive Presence", "Leadership Development", "Change Management", "Risk Assessment"],
            "domains": ["Technology", "Startups", "E-Commerce"],
            "about": "Gaurav has 15+ years of experience in executive coaching and leadership development. He specializes in helping professionals transition into senior leadership roles.",
            "experience": "15+ years",
            "avatar": "https://randomuser.me/api/portraits/men/32.jpg",
        },
        {
            "id": "coach-4",
            "email": "ajay@elevate.com",
            "password_hash": pwd,
            "name": "Ajay Gurung",
            "role": "coach",
            "title": "Executive Coach",
            "rating": 4.6,
            "location": "Pune, India",
            "total_sessions": 0,
            "slots": {"available": 2, "total": 2},
            "status": "active",
            "certifications": ["ICF MCC", "SHRM Certified"],
            "expertise": ["Process Improvement", "Project Planning", "Team Communication", "Stakeholder Engagement"],
            "domains": ["Manufacturing", "Consulting", "BFSI"],
            "about": "Ajay brings extensive experience in process optimization and team coaching, with a proven track record of improving organizational performance.",
            "experience": "12+ years",
            "avatar": "https://randomuser.me/api/portraits/men/55.jpg",
        },
        {
            "id": "coach-5",
            "email": "amina@elevate.com",
            "password_hash": pwd,
            "name": "Amina Khan",
            "role": "coach",
            "title": "Executive Coach",
            "rating": 4.5,
            "location": "Hyderabad, India",
            "total_sessions": 0,
            "slots": {"available": 0, "total": 2},
            "status": "active",
            "certifications": ["ICF ACC"],
            "expertise": ["Performance Metrics", "Feedback Mechanisms", "Public Speaking", "Leadership Development"],
            "domains": ["Technology", "Media", "Education"],
            "about": "Amina specializes in performance coaching and communication development, helping individuals unlock their full potential through evidence-based coaching methodologies.",
            "experience": "8+ years",
            "avatar": "https://randomuser.me/api/portraits/women/33.jpg",
        },
        {
            "id": "coach-6",
            "email": "rajesh@elevate.com",
            "password_hash": pwd,
            "name": "Rajesh Kumar",
            "role": "coach",
            "title": "Leadership Coach",
            "rating": 4.7,
            "location": "Chennai, India",
            "total_sessions": 0,
            "slots": {"available": 1, "total": 3},
            "status": "active",
            "certifications": ["ICF PCC", "NLP Practitioner"],
            "expertise": ["Leadership Development", "Change Management", "Executive Presence", "Team Communication"],
            "domains": ["Automotive", "Manufacturing", "Consulting"],
            "about": "Rajesh is a seasoned leadership coach with deep expertise in transformational leadership. His coaching style integrates NLP techniques with practical business insights.",
            "experience": "18+ years",
            "avatar": "https://randomuser.me/api/portraits/men/78.jpg",
        },
    ]

    coachees = [
        {
            "id": "coachee-1",
            "email": "sarah@elevate.com",
            "password_hash": pwd,
            "name": "Sarah Johnson",
            "role": "coachee",
            "job_title": "Senior Associate",
            "department": "Audit & Assurance",
            "avatar": "https://randomuser.me/api/portraits/women/10.jpg",
        },
        {
            "id": "coachee-2",
            "email": "alex@elevate.com",
            "password_hash": pwd,
            "name": "Alex Morgan",
            "role": "coachee",
            "job_title": "Assistant Manager",
            "department": "Advisory",
            "avatar": "https://randomuser.me/api/portraits/men/23.jpg",
        },
    ]

    admin = {
        "id": "admin-1",
        "email": "admin@elevate.com",
        "password_hash": pwd,
        "name": "Admin User",
        "role": "admin",
        "avatar": "https://randomuser.me/api/portraits/men/1.jpg",
    }

    all_users = coaches + coachees + [admin]
    await db.users.insert_many(all_users)

    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")
    await db.coaching_requests.create_index("coachee_id")
    await db.sessions.create_index("request_id")
    await db.sessions.create_index("coach_id")
    await db.sessions.create_index("coachee_id")
    await db.notifications.create_index("user_id")
    await db.feedback.create_index("request_id")

    logger.info(f"Seeded {len(all_users)} users successfully.")
