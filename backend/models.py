from pydantic import BaseModel
from typing import List, Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class PreferenceInput(BaseModel):
    coach_id: str
    order: int


class CreateRequestBody(BaseModel):
    preferences: List[PreferenceInput]
    goals: str
    challenges: str
    previous_exp: Optional[str] = ""
    notes: Optional[str] = ""
    mentorship_area: Optional[str] = ""


class CreateSessionBody(BaseModel):
    request_id: str
    date: str
    time: str
    topic: Optional[str] = "Coaching Session"


class RescheduleBody(BaseModel):
    date: str
    time: str


class FeedbackBody(BaseModel):
    rating: int
    comment: Optional[str] = ""


class UpdateTotalSessions(BaseModel):
    total_sessions: int


class AvailabilityInput(BaseModel):
    date: str
    day_label: str
    slots: List[str]
