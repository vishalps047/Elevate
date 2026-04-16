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


class LearningOutcomes(BaseModel):
    self_awareness: int
    experimental: int
    goals: int
    go_beyond: int


class FeedbackBody(BaseModel):
    overall_rating: int
    coach_rating: int
    learning_outcomes: LearningOutcomes
    most_valuable: str
    suggestions: Optional[str] = ""


class UpdateTotalSessions(BaseModel):
    total_sessions: int


class AvailabilityInput(BaseModel):
    date: str
    day_label: str
    slots: List[str]


class ProfileUpdateBody(BaseModel):
    avatar: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    about: Optional[str] = None
    experience: Optional[str] = None
    expertise: Optional[List[str]] = None
    domains: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    tier: Optional[str] = None
    designation: Optional[str] = None
    business_unit: Optional[str] = None
    competency: Optional[str] = None
    date_of_joining: Optional[str] = None
    enrolment_type: Optional[str] = None
    reason_for_enrolment: Optional[str] = None
