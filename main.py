from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from flight_service import get_flight_context
from sqlalchemy.orm import Session
from datetime import datetime

from route_service import get_route_context
from travel_context import build_travel_context

from database import engine, Base, SessionLocal
import models
import schemas

from auth import hash_password, verify_password
from jwt_handler import create_access_token, verify_token
from ai_service import generate_itinerary
from weather_service import get_weather_forecast
from unsplash_service import get_destination_image

import os
from dotenv import load_dotenv

load_dotenv()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_id = verify_token(token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@app.get("/")
def home():
    return {"message": "AI Travel Planner API is running"}


@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        gender=user.gender,
        age=user.age
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login")
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": db_user.id})

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "age": current_user.age,
        "gender": current_user.gender,
        "is_admin": current_user.email.lower() == ADMIN_EMAIL.lower()

    }


@app.put("/me", response_model=schemas.UserResponse)
def update_profile(
    profile: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.username = profile.username
    current_user.gender = profile.gender
    current_user.age = profile.age

    db.commit()
    db.refresh(current_user)

    return current_user


@app.post("/plan-trip")
def plan_trip(
    trip: schemas.TripCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    interests_text = ", ".join(trip.interests)

    weather = get_weather_forecast(trip.destination)
    image = get_destination_image(trip.destination)

    try:
        route_context = build_travel_context(
            origin=trip.origin,
            destination=trip.destination,
            start_date=trip.start_date,
            end_date=trip.end_date,
            people=trip.people,
            transport_mode=trip.transport_mode,
            hotel_preference=trip.hotel_preference
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    print("ROUTE CONTEXT:", route_context)

    ai_plan = generate_itinerary(
        trip.origin,
        trip.destination,
        trip.start_date,
        trip.end_date,
        trip.budget,
        trip.people,
        trip.travel_style,
        interests_text,
        current_user.age,
        current_user.gender,
        weather["summary"],
        trip.transport_mode,
        trip.trip_type,
        trip.hotel_preference,
        trip.pace,
        route_context
    )

    new_trip = models.Trip(
        origin=trip.origin,
        destination=trip.destination,

        start_date=trip.start_date,
        end_date=trip.end_date,

        budget=trip.budget,
        people=trip.people,

        travel_style=trip.travel_style,
        transport_mode=trip.transport_mode,
        trip_type=trip.trip_type,
        hotel_preference=trip.hotel_preference,
        pace=trip.pace,

        interests=interests_text,
        ai_itinerary=ai_plan,

        user_id=current_user.id,

        image_url=image,

        weather_summary=weather["summary"],
        weather_condition=weather["condition"],
        temperature=weather["temperature"],
        humidity=weather["humidity"],
        wind_speed=weather["wind_speed"],
    )

    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    return {
        "trip": jsonable_encoder(new_trip),
        "route_context": route_context
    }


@app.get("/my-trips", response_model=list[schemas.TripResponse])
def my_trips(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trips = db.query(models.Trip).filter(
        models.Trip.user_id == current_user.id
    ).all()

    return trips


@app.get("/trips/{trip_id}", response_model=schemas.TripResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    trip = db.query(models.Trip).filter(
        models.Trip.id == trip_id,
        models.Trip.user_id == current_user.id
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found or not authorized")

    return trip


@app.put("/trips/{trip_id}")
def update_trip(
    trip_id: int,
    updated_trip: schemas.TripCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    trip = db.query(models.Trip).filter(
        models.Trip.id == trip_id,
        models.Trip.user_id == current_user.id
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found or not authorized")

    interests_text = ", ".join(updated_trip.interests)

    weather = get_weather_forecast(updated_trip.destination)
    image = get_destination_image(updated_trip.destination)

    try:
        route_context = build_travel_context(
            origin=updated_trip.origin,
            destination=updated_trip.destination,
            start_date=updated_trip.start_date,
            end_date=updated_trip.end_date,
            people=updated_trip.people,
            transport_mode=updated_trip.transport_mode,
            hotel_preference=updated_trip.hotel_preference
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    print("UPDATED ROUTE CONTEXT:", route_context)

    ai_plan = generate_itinerary(
        updated_trip.origin,
        updated_trip.destination,
        updated_trip.start_date,
        updated_trip.end_date,
        updated_trip.budget,
        updated_trip.people,
        updated_trip.travel_style,
        interests_text,
        current_user.age,
        current_user.gender,
        weather["summary"],
        updated_trip.transport_mode,
        updated_trip.trip_type,
        updated_trip.hotel_preference,
        updated_trip.pace,
        route_context
    )

    trip.origin = updated_trip.origin
    trip.destination = updated_trip.destination

    trip.start_date = updated_trip.start_date
    trip.end_date = updated_trip.end_date

    trip.budget = updated_trip.budget
    trip.people = updated_trip.people

    trip.travel_style = updated_trip.travel_style
    trip.transport_mode = updated_trip.transport_mode
    trip.trip_type = updated_trip.trip_type
    trip.hotel_preference = updated_trip.hotel_preference
    trip.pace = updated_trip.pace

    trip.interests = interests_text
    trip.ai_itinerary = ai_plan

    trip.image_url = image

    trip.weather_summary = weather["summary"]
    trip.weather_condition = weather["condition"]
    trip.temperature = weather["temperature"]
    trip.humidity = weather["humidity"]
    trip.wind_speed = weather["wind_speed"]

    db.commit()
    db.refresh(trip)

    return {
        "trip": jsonable_encoder(trip),
        "route_context": route_context
    }


@app.delete("/trips/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    trip = db.query(models.Trip).filter(
        models.Trip.id == trip_id,
        models.Trip.user_id == current_user.id
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found or not authorized")

    db.delete(trip)
    db.commit()

    return {"message": "Trip deleted successfully"}


@app.get("/destination-image/{destination}")
def destination_image(destination: str):
    image = get_destination_image(destination)

    if image is None:
        return {"image": None}

    return {
        "image": image
    }

@app.get("/route-preview")
def route_preview(
    origin: str,
    destination: str,
    start_date: str = None,
    end_date: str = None,
    people: int = 1,
    transport_mode: str = "Car",
    hotel_preference: str = "standard"
):
    if not origin or not destination:
        raise HTTPException(
            status_code=400,
            detail="Origin and destination are required"
        )

    if not start_date:
        start_date = "2026-07-10"

    if not end_date:
        end_date = "2026-07-12"

    return build_travel_context(
        origin=origin,
        destination=destination,
        start_date=start_date,
        end_date=end_date,
        people=people,
        transport_mode=transport_mode,
        hotel_preference=hotel_preference
    )
@app.get("/flight-preview")
def flight_preview(
    origin: str,
    destination: str,
    start_date: str,
    end_date: str,
    people: int = 1
):
    return get_flight_context(
        origin=origin,
        destination=destination,
        start_date=start_date,
        end_date=end_date,
        people=people
    )

def get_current_admin(
    current_user: models.User = Depends(get_current_user)
):
    if not ADMIN_EMAIL:
        raise HTTPException(status_code=500, detail="ADMIN_EMAIL is not configured")

    admin_email = ADMIN_EMAIL.strip().lower()
    user_email = current_user.email.strip().lower()

    if user_email != admin_email:
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user

@app.get("/admin/users")
def admin_get_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    users = db.query(models.User).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "age": user.age,
            "gender": user.gender,
            "is_admin": user.email.lower() == ADMIN_EMAIL.lower()
        }
        for user in users
    ]


@app.get("/admin/trips")
def admin_get_trips(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    trips = db.query(models.Trip).all()

    return [
        {
            "id": trip.id,
            "origin": trip.origin,
            "destination": trip.destination,
            "budget": trip.budget,
            "people": trip.people,
            "transport_mode": trip.transport_mode,
            "trip_type": trip.trip_type,
            "hotel_preference": trip.hotel_preference,
            "pace": trip.pace,
            "user_id": trip.user_id,
            "start_date": trip.start_date,
            "end_date": trip.end_date,
        }
        for trip in trips
    ]


@app.delete("/admin/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    db.query(models.Trip).filter(models.Trip.user_id == user_id).delete()
    db.delete(user)
    db.commit()

    return {"message": "User and their trips deleted successfully"}


@app.delete("/admin/trips/{trip_id}")
def admin_delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    db.delete(trip)
    db.commit()

    return {"message": "Trip deleted successfully"}