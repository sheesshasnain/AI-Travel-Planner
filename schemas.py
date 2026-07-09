from pydantic import BaseModel
from typing import List, Optional


# ---------- Trips ----------

class TripCreate(BaseModel):
    origin: str
    destination: str

    start_date: str
    end_date: str

    budget: float
    people: int

    travel_style: str
    transport_mode: str
    trip_type: str
    hotel_preference: str
    pace: str

    interests: List[str]


class TripResponse(BaseModel):
    id: int

    origin: str
    destination: str

    start_date: str
    end_date: str

    budget: float
    people: int

    travel_style: str
    transport_mode: str
    trip_type: str
    hotel_preference: str
    pace: str

    interests: str
    ai_itinerary: Optional[str]

    weather_summary: Optional[str] = None
    weather_condition: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[int] = None
    wind_speed: Optional[float] = None

    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Users ----------

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    gender: str
    age: int


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    gender: str
    age: int

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    username: str
    gender: str
    age: int