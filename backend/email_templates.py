"""
Email template engine for ELEVATE platform.
Maps to the 16 Elevate mail communication templates.
"""
from database import db
from datetime import datetime, timezone
import uuid

PLATFORM_EMAIL = "Elevate@in.gt.com"
PLATFORM_NAME = "Elevate Team"

# Female coach names for pronoun selection
FEMALE_NAMES = {
    "fatema", "vaishali", "amina", "priya", "ananya", "sarah", "neha",
    "raeesa", "deepika", "kavita", "sunita", "meena", "nisha", "pooja",
}


def _is_female(name: str) -> bool:
    first = name.strip().split()[0].lower() if name else ""
    return first in FEMALE_NAMES


def _wrap(lines):
    parts = []
    for line in lines:
        if line == "":
            parts.append("<br/>")
        else:
            parts.append(f"<p style='margin:0 0 6px 0;'>{line}</p>")
    return "".join(parts)


_SIGN_OFF = [
    "",
    "For any queries and support, please write to Elevate@in.gt.com.",
    "",
    "Thank you.",
    "Best regards,",
    "<strong>Elevate Team</strong>",
]

_SIGN_OFF_SHORT = [
    "",
    "Thank you.",
    "Best regards,",
    "<strong>Elevate Team</strong>",
]

_JOB_CODE = [
    "",
    "<strong>Job code to charge time</strong>",
    "The time spent towards executive coaching should be charged to Elevate job code on WCGT 360\u00b0 by both coach and coachee.",
    "<em>Steps: Login to WCGT 360\u00b0 &rarr; Project Management &rarr; Timesheet &rarr; Timesheet Entry &rarr; Under Client Name, select own entity &rarr; Under Project, select Elevate &rarr; Fill fields &rarr; Save and Submit</em>",
]

_COACHEE_GUIDELINES = [
    "",
    "To support you in this journey, please find below <strong>guidelines for coachee</strong>:",
    "&bull; You can define your time investment in discussion with the coach",
    "&bull; You will be responsible for scheduling the coaching sessions with the coach",
    "&bull; Sessions can be in-person or virtual. For virtual sessions, the use of video is encouraged",
    "&bull; Maintain a positive attitude throughout the learning journey",
    "&bull; You will be accountable for your own progress and should implement the actions discussed",
    "&bull; Both coach and coachee should engage in reflective practice exercises to track progress",
]


async def _send(to_user_id, to_email, subject, body_lines, cc=None, preview=None):
    body = _wrap(body_lines)
    doc = {
        "id": f"email-{uuid.uuid4().hex[:12]}",
        "from_email": PLATFORM_EMAIL,
        "from_name": PLATFORM_NAME,
        "to_email": to_email,
        "to_user_id": to_user_id,
        "cc": cc or [],
        "subject": subject,
        "body": body,
        "preview": preview or (body_lines[1] if len(body_lines) > 1 else body_lines[0])[:120],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.emails.insert_one(doc)


def _coachee_table(profile, name, email):
    rows = [
        ("Name", name),
        ("Email", email),
    ]
    for key, label in [
        ("date_of_joining", "Date of Joining"), ("tier", "Tier"),
        ("designation", "Designation"), ("location", "Location"),
        ("business_unit", "Business Unit"), ("competency", "Competency"),
        ("co_supercoach", "Co-SuperCoach"), ("enrolment_type", "Enrolment type"),
        ("reason_for_enrolment", "Reason for enrolment"),
    ]:
        val = profile.get(key, "")
        if val:
            rows.append((label, val))
    trs = "".join(
        f"<tr><td style='padding:4px 8px;border:1px solid #ddd;font-weight:600;width:40%;'>{l}</td>"
        f"<td style='padding:4px 8px;border:1px solid #ddd;'>{v}</td></tr>"
        for l, v in rows
    )
    return f"<table style='border-collapse:collapse;width:100%;margin:8px 0;'>{trs}</table>"


# ── T1: Registration confirmed (self-nomination) ──
async def send_registration_confirmed(user_id, user_email, user_name):
    first = user_name.split()[0] if user_name else user_name
    await _send(
        user_id, user_email,
        "Coachee registration status",
        [
            f"Dear {first},",
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
        ] + _SIGN_OFF,
        preview="We have received your registration as a coachee under Elevate.",
    )


# ── T2: Nominated for Elevate ──
async def send_nominated_for_elevate(user_id, user_email, user_name, nominator_name="your Co-SuperCoach"):
    first = user_name.split()[0] if user_name else user_name
    await _send(
        user_id, user_email,
        "Nominated for Elevate",
        [
            f"Dear {first},",
            "Hope you are doing well.",
            f"We are pleased to inform that you have been nominated by {nominator_name} to be enrolled as a coachee under Elevate. As next steps, you are requested to select your preferred coach from the list of available coaches on the platform.",
            "",
            "Please share the following information:",
            "&bull; Coach preference 1",
            "&bull; Coach preference 2",
            "&bull; Coach preference 3",
            "",
            "After we receive the above information, you will be notified on the coach selection status.",
            "For more information, <a href='#'>click here</a> to read about Elevate.",
        ] + _SIGN_OFF,
        preview=f"You have been nominated by {nominator_name} for Elevate.",
    )


# ── T3: Registration rejected (self-nom) ──
async def send_registration_rejected(user_id, user_email, user_name):
    first = user_name.split()[0] if user_name else user_name
    await _send(
        user_id, user_email,
        "Coachee registration status",
        [
            f"Dear {first},",
            "Hope you are doing well.",
            "We have received your registration as a coachee under Elevate. The current eligibility to enrol as a coachee is applicable only for Tier 1 and 2 personnel. Hence, we regret to inform that we will not be able to proceed further with the enrolment process.",
            "For more information, <a href='#'>click here</a> to read about Elevate.",
        ] + _SIGN_OFF,
        preview="We regret to inform that we will not be able to proceed with your enrolment.",
    )


# ── T4: Registration rejected (nominated - to nominator) ──
async def send_nomination_rejected_to_nominator(nominator_id, nominator_email, nominator_name, coachee_name):
    first = nominator_name.split()[0] if nominator_name else nominator_name
    await _send(
        nominator_id, nominator_email,
        "Coachee registration status",
        [
            f"Dear {first},",
            "Hope you are doing well.",
            f"We have received your nomination to register <strong>{coachee_name}</strong> as a coachee under Elevate. The current eligibility to enrol as a coachee is applicable only for Tier 1 and 2 personnel. Hence, we regret to inform that we will not be able to proceed further with the enrolment process.",
            "For more information, <a href='#'>click here</a> to read about Elevate.",
        ] + _SIGN_OFF,
        preview=f"Unable to proceed with enrolment of {coachee_name}.",
    )


# ── T7: Preferences received ──
async def send_preferences_received(user_id, user_email, user_name):
    first = user_name.split()[0] if user_name else user_name
    await _send(
        user_id, user_email,
        "Coach preferences received",
        [
            f"Dear {first},",
            "Hope you are doing well.",
            "Thank you for sharing your coach preferences. We will soon confirm on the coach's availability.",
            "Thank you for your patience.",
        ] + _SIGN_OFF_SHORT,
        preview="Thank you for sharing your coach preferences.",
    )


# ── T8/T9: Coach availability request ──
async def send_coach_availability_request(coach_id, coach_email, coach_name, coachee_name, coachee_email, profile, enrolment_type="Self-nomination"):
    first = coach_name.split()[0] if coach_name else coach_name
    is_nominated = enrolment_type and enrolment_type != "Self-nomination"
    intro = (
        "This is to inform that the personnel mentioned below has been nominated to be enrolled as a coachee under Elevate and has selected you as the preferred coach."
        if is_nominated else
        "This is to inform that the personnel mentioned below has enrolled as a coachee under Elevate and has selected you as the preferred coach."
    )
    table_html = _coachee_table(profile, coachee_name, coachee_email)

    # Find admin for CC
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0, "email": 1})
    admin_cc = [admin["email"]] if admin else []

    await _send(
        coach_id, coach_email,
        "Executive coaching \u2013 Availability requested",
        [
            f"Dear {first},",
            "Hope you are doing well.",
            intro,
            "We are writing to request your confirmation if we can initiate the learning journey with the enrolled personnel. Post your confirmation, we will send the introduction email.",
            "",
            "<strong>Coachee Details:</strong>",
            table_html,
            "",
            "We look forward to your support in helping our people unlock their potential with executive coaching.",
        ] + _SIGN_OFF,
        cc=admin_cc,
        preview=f"{coachee_name} has selected you as preferred coach. Confirmation requested.",
    )


# ── T11: Guidelines for coach ──
async def send_coach_guidelines(coach_id, coach_email, coach_name):
    first = coach_name.split()[0] if coach_name else coach_name
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0, "email": 1})
    admin_cc = [admin["email"]] if admin else []

    await _send(
        coach_id, coach_email,
        "Guidelines for coach",
        [
            f"Dear {first},",
            "Thank you for agreeing to support with executive coaching to help our people unlock their potential. We appreciate your commitment and dedication. Your role is pivotal in guiding and enabling a coaching culture in the Firm while leading to our #Great2Exceptional journey.",
            "",
            "To support you in this journey, please find below essential information:",
            "&bull; <strong>Coach's Guidebook</strong> \u2013 attached",
            "&bull; Create a psychologically safe space where conversations remain confidential",
            "&bull; Use a structured approach and begin each coaching conversation by setting clear objectives",
            "&bull; Aim for a high stretch comfort level of 6/10 when setting goals and assist the coachee in achieving them",
            "&bull; The coachee will be accountable for their own progress, while the coach should focus on active listening and effective coaching practices",
            "&bull; The coachee will be responsible for scheduling coaching sessions (in-person or virtual). For virtual sessions, the use of video is encouraged",
        ] + _JOB_CODE + [
            "",
            "We will shortly be sending the introduction email with you and the coachee.",
        ] + _SIGN_OFF,
        cc=admin_cc,
        preview="Thank you for agreeing to support with executive coaching.",
    )


# ── T12/T13: Introduction mail to coachee (gender-aware) ──
async def send_introduction_to_coachee(coachee_id, coachee_email, coachee_name, coach_name, coach_email, coach_designation="Executive Coach"):
    first = coachee_name.split()[0] if coachee_name else coachee_name
    pronoun = "She" if _is_female(coach_name) else "He"

    await _send(
        coachee_id, coachee_email,
        "Embark on your learning journey",
        [
            f"Dear {first},",
            f"We are pleased to inform that based on your preference, <strong>{coach_name}</strong>, {coach_designation} has been assigned as your coach. {pronoun} brings a wealth of experience and knowledge that will be invaluable to your learning journey and help you unlock your potential with executive coaching.",
        ] + _COACHEE_GUIDELINES + _JOB_CODE + [
            "",
            "Please take it forward from here and initiate your coaching sessions with the coach.",
        ] + _SIGN_OFF,
        cc=[coach_email],
        preview=f"{coach_name} has been assigned as your coach.",
    )


# ── T16: Feedback request ──
async def send_feedback_request(coachee_id, coachee_email, coachee_name):
    first = coachee_name.split()[0] if coachee_name else coachee_name
    await _send(
        coachee_id, coachee_email,
        "We value your feedback",
        [
            f"Dear {first},",
            "Hope you are doing well. Building on this foundation of executive coaching, we introduced Elevate in January 2025, an extension to our coaching framework to support our Tier 1 and 2 personnel with executive coaching.",
            "We would appreciate your valuable feedback on your overall experience as this will help us to enhance the programme. Please submit the feedback form on the platform.",
        ] + _SIGN_OFF,
        preview="We would appreciate your valuable feedback on your overall experience.",
    )


# ── Admin notification: new registration ──
async def send_admin_registration_alert(reg):
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    if not admin:
        return
    admin_first = admin["name"].split()[0] if admin.get("name") else "Admin"
    enrolment = reg.get("enrolment_type", "Self-nomination")
    await _send(
        admin["id"], admin["email"],
        f"New {reg['role']} registration: {reg['name']}",
        [
            f"Dear {admin_first},",
            f"A new {enrolment.lower()} registration has been received.",
            "",
            f"<strong>Name:</strong> {reg['name']} ({reg['email']})",
            f"<strong>Role:</strong> {reg['role'].capitalize()}",
            f"<strong>Tier:</strong> {reg.get('tier', 'N/A')} | <strong>Designation:</strong> {reg.get('designation', 'N/A')} | <strong>Location:</strong> {reg.get('location', 'N/A')}",
            f"<strong>Business Unit:</strong> {reg.get('business_unit', 'N/A')}",
            f"<strong>Enrolment:</strong> {enrolment}",
            "",
            "Please review and approve/reject via the Admin Dashboard.",
        ] + _SIGN_OFF_SHORT,
        preview=f"New {enrolment.lower()} registration from {reg['name']}.",
    )


# ── Admin notification: coach confirmed ──
async def send_admin_coach_confirmed(coach_name, coachee_name):
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    if not admin:
        return
    admin_first = admin["name"].split()[0] if admin.get("name") else "Admin"
    await _send(
        admin["id"], admin["email"],
        f"Coach confirmed: {coach_name} for {coachee_name}",
        [
            f"Dear {admin_first},",
            f"Coach <strong>{coach_name}</strong> has confirmed availability for coachee <strong>{coachee_name}</strong>.",
            "The introduction email has been sent to both parties. The learning journey can now begin.",
        ] + _SIGN_OFF_SHORT,
        preview=f"{coach_name} confirmed availability for {coachee_name}.",
    )


# ── Admin notification: journey completed ──
async def send_admin_journey_completed(coach_name, coachee_name, total_sessions):
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    if not admin:
        return
    admin_first = admin["name"].split()[0] if admin.get("name") else "Admin"
    await _send(
        admin["id"], admin["email"],
        f"Journey completed: {coachee_name} with {coach_name}",
        [
            f"Dear {admin_first},",
            f"The coaching journey between <strong>{coachee_name}</strong> and <strong>{coach_name}</strong> has been completed ({total_sessions} sessions).",
            "Feedback form has been sent to the coachee.",
        ] + _SIGN_OFF_SHORT,
        preview=f"{coachee_name}'s coaching journey with {coach_name} completed.",
    )
