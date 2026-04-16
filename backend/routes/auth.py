from fastapi import APIRouter, HTTPException, Header, Depends, UploadFile, File
from database import db
from models import LoginRequest, ProfileUpdateBody
import jwt
import os
import bcrypt
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

router = APIRouter(prefix="/auth", tags=["auth"])

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required")
JWT_ALGORITHM = "HS256"


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed.encode())


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one(
            {"id": payload["user_id"]}, {"_id": 0, "password_hash": 0}
        )
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login")
async def login(body: LoginRequest):
    user = await db.users.find_one({"email": body.email}, {"_id": 0})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = jwt.encode(
        {
            "user_id": user["id"],
            "role": user["role"],
            "exp": datetime.now(timezone.utc) + timedelta(days=7),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

    user_data = {k: v for k, v in user.items() if k != "password_hash"}
    return {"token": token, "user": user_data}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

COACH_EDITABLE = {"avatar", "title", "location", "about", "experience", "expertise", "domains", "certifications"}
COACHEE_EDITABLE = {"avatar", "job_title", "department", "tier", "designation", "location", "business_unit", "competency", "date_of_joining", "enrolment_type", "reason_for_enrolment"}
ADMIN_EDITABLE = {"avatar"}


@router.put("/profile")
async def update_profile(body: ProfileUpdateBody, user: dict = Depends(get_current_user)):
    role = user.get("role", "coachee")
    allowed = COACH_EDITABLE if role == "coach" else COACHEE_EDITABLE if role == "coachee" else ADMIN_EDITABLE

    updates = {}
    for field, value in body.dict(exclude_none=True).items():
        if field in allowed:
            updates[field] = value

    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    await db.users.update_one({"id": user["id"]}, {"$set": updates})

    # Also update denormalized name/avatar in sessions and requests if avatar changed
    if "avatar" in updates:
        new_avatar = updates["avatar"]
        if role == "coach":
            await db.sessions.update_many({"coach_id": user["id"]}, {"$set": {"coach_avatar": new_avatar}})
            await db.coaching_requests.update_many(
                {"preferences.coach_id": user["id"]},
                {"$set": {"preferences.$[elem].coach_avatar": new_avatar}},
                array_filters=[{"elem.coach_id": user["id"]}]
            )
        elif role == "coachee":
            await db.sessions.update_many({"coachee_id": user["id"]}, {"$set": {"coachee_avatar": new_avatar}})
            await db.coaching_requests.update_many({"coachee_id": user["id"]}, {"$set": {"coachee_avatar": new_avatar}})

    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated


@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{user['id']}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = UPLOAD_DIR / filename

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    with open(filepath, "wb") as f:
        f.write(contents)

    avatar_url = f"/api/uploads/{filename}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar": avatar_url}})

    return {"avatar": avatar_url}
