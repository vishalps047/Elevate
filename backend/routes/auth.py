from fastapi import APIRouter, HTTPException, Header, Depends
from database import db
from models import LoginRequest
import jwt
import os
import hashlib
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

JWT_SECRET = os.environ.get("JWT_SECRET", "elevate-platform-secret-2026")
JWT_ALGORITHM = "HS256"


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


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
    if not user or user.get("password_hash") != hash_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = jwt.encode(
        {
            "user_id": user["id"],
            "role": user["role"],
            "email": user["email"],
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
