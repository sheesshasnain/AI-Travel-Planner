from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy import Boolean

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)

    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)

    budget = Column(Float, nullable=False)
    people = Column(Integer, nullable=False)

    travel_style = Column(String, nullable=False)
    transport_mode = Column(String, nullable=False)
    trip_type = Column(String, nullable=False)
    hotel_preference = Column(String, nullable=False)
    pace = Column(String, nullable=False)

    interests = Column(Text, nullable=False)
    ai_itinerary = Column(Text, nullable=True)

    weather_summary = Column(Text, nullable=True)
    weather_condition = Column(String, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Integer, nullable=True)
    wind_speed = Column(Float, nullable=True)

    image_url = Column(String, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="trips")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    email = Column(String, unique=True)
    hashed_password = Column(String)

    gender = Column(String)
    age = Column(Integer)

    trips = relationship("Trip", back_populates="owner")