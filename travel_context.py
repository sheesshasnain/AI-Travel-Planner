import math
from typing import Optional, Union
from datetime import datetime, date

from flight_service import get_flight_context
from route_service import get_route_context

Number = Union[int, float]


def parse_trip_date(value):
    """
    Accepts either a Python date object or an ISO date string like '2026-07-10'.
    Returns a date object.
    """
    if isinstance(value, date):
        return value

    if isinstance(value, str):
        return datetime.fromisoformat(value).date()

    raise ValueError("Invalid date format")


def to_number(value) -> Optional[float]:
    """Safely convert numeric strings/int/float to float."""
    if value is None or value == "Unknown":
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_transport_mode(transport_mode: str) -> str:
    """
    Converts frontend transport text into backend category.

    Example:
    "Car" / "Private Car" / "By Road" -> own_car
    "Flight" / "Air" -> air
    "Bus" -> bus
    "AI Decide" -> ai_decide
    """
    mode = (transport_mode or "").lower().strip()

    if not mode:
        return "ai_decide"

    if "ai" in mode and "decide" in mode:
        return "ai_decide"

    if any(word in mode for word in ["flight", "air", "plane", "airplane"]):
        return "air"

    if any(word in mode for word in ["bus", "coach"]):
        return "bus"

    if any(word in mode for word in ["train", "rail"]):
        return "train"

    if any(word in mode for word in ["car", "private", "own", "drive", "driving", "vehicle", "rental"]):
        return "own_car"

    if any(word in mode for word in ["taxi", "cab"]):
        return "taxi"

    if "road" in mode:
        return "own_car"

    return "ai_decide"


def is_road_transport(transport_mode: str) -> bool:
    mode = normalize_transport_mode(transport_mode)
    return mode in ["own_car", "bus", "taxi", "ai_decide"]


def has_own_vehicle_at_destination(transport_mode: str) -> bool:
    """
    If user is travelling by own/private/rental car, local transport should be 0
    because they already have their vehicle at the destination.
    """
    return normalize_transport_mode(transport_mode) == "own_car"


def estimate_petrol_cost(
    one_way_distance_km: Optional[Number],
    petrol_price: float = 299,
    vehicle_avg_km_per_liter: float = 12,
    round_trip: bool = True,
):
    """
    Calculates petrol cost.
    By default uses round trip: going + returning.
    """
    distance = to_number(one_way_distance_km)

    if not distance:
        return None

    payable_distance = distance * 2 if round_trip else distance
    liters_needed = payable_distance / vehicle_avg_km_per_liter

    return round(liters_needed * petrol_price)


def estimate_local_transport(
    days: int,
    people: int,
    transport_mode: str,
):
    """
    Local transport means transport after reaching destination:
    taxis, jeeps, cabs, airport/bus terminal to hotel, hotel to attractions.

    If user travels by own/private/rental car, local transport is 0.
    """
    if has_own_vehicle_at_destination(transport_mode):
        return 0

    daily_cost_per_person = 1500
    return days * people * daily_cost_per_person


def estimate_hotel_cost(days: int, people: int, hotel_preference: str):
    hotel_rates = {
        "budget": 5000,
        "standard": 9000,
        "luxury": 18000,
    }

    preference = (hotel_preference or "standard").lower()
    rate_per_night = hotel_rates.get(preference, 9000)

    rooms = math.ceil(people / 2)
    nights = max(days - 1, 1)

    return rooms * nights * rate_per_night


def estimate_toll_cost(
    one_way_distance_km: Optional[Number],
    round_trip: bool = True,
):
    """
    Toll is estimated from one-way distance.
    By default returns round-trip toll: going + returning.
    """
    distance = to_number(one_way_distance_km)

    if not distance:
        return None

    if distance < 100:
        one_way_toll = 500
    elif distance < 300:
        one_way_toll = 1500
    elif distance < 700:
        one_way_toll = 3500
    else:
        one_way_toll = 6000

    return one_way_toll * 2 if round_trip else one_way_toll


def estimate_bus_price_per_person(origin: str, destination: str):
    """
    Placeholder for future bus ticket API/static city-to-city fares.
    Do not fake live prices here.
    """
    return None


def build_travel_context(
    origin: str,
    destination: str,
    start_date,
    end_date,
    people: int,
    transport_mode: str,
    hotel_preference: str,
    petrol_price: float = 265,
    vehicle_avg_km_per_liter: float = 12,
    road_distance_km: Optional[float] = None,
    road_travel_time: Optional[str] = None,
):
    start_date = parse_trip_date(start_date)
    end_date = parse_trip_date(end_date)

    days = (end_date - start_date).days + 1

    if days <= 0:
        raise ValueError("End date must be after start date")

    people = int(people or 1)
    petrol_price = float(petrol_price or 265)
    vehicle_avg_km_per_liter = float(vehicle_avg_km_per_liter or 12)

    transport_category = normalize_transport_mode(transport_mode)
    round_trip = True

    # Route is useful for own car, taxi, bus, and AI Decide.
    # For flight-only mode, road distance is optional and only shown as reference if already provided.
    
    route_data = get_route_context(origin, destination)
    road_distance_km = route_data.get("road_distance_km")
    road_travel_time = route_data.get("road_travel_time")

    numeric_distance = to_number(road_distance_km)
    round_trip_distance_km = None

    if numeric_distance:
        road_distance_km = round(numeric_distance, 2)
        round_trip_distance_km = round(numeric_distance * 2, 2)

    petrol_cost = None
    toll_cost = None

    # Petrol/toll only apply to own car, taxi, or AI Decide road comparison.
    # Do not calculate petrol/toll for flight trips.
    if transport_category in ["own_car", "taxi", "ai_decide"]:
        petrol_cost = estimate_petrol_cost(
            road_distance_km,
            petrol_price,
            vehicle_avg_km_per_liter,
            round_trip=round_trip,
        )

        toll_cost = estimate_toll_cost(
            road_distance_km,
            round_trip=round_trip,
        )

    bus_price_per_person = estimate_bus_price_per_person(origin, destination)
    bus_total_estimate = None

    # Bus ticket should be round trip x people when API/static fare is connected.
    if transport_category == "bus" and isinstance(bus_price_per_person, (int, float)):
        bus_total_estimate = bus_price_per_person * people * 2

    local_transport_estimate = estimate_local_transport(
        days=days,
        people=people,
        transport_mode=transport_mode,
    )

    hotel_estimate = estimate_hotel_cost(
        days,
        people,
        hotel_preference,
    )

    # SerpApi flight context should only be called for air or AI Decide.
    # This protects limited SerpApi searches.
    flight_context = {}

    if transport_category in ["air", "ai_decide"]:
        flight_context = get_flight_context(
            origin=origin,
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            people=people,
        )

    flight_price_per_person = flight_context.get(
        "flight_price_per_person",
        "Unknown"
    )

    flight_total_estimate = flight_context.get(
        "flight_total_estimate",
        "Unknown"
    )

    transport_total_estimate = 0

    if transport_category in ["own_car", "taxi", "ai_decide"]:
        if isinstance(petrol_cost, (int, float)):
            transport_total_estimate += petrol_cost

        if isinstance(toll_cost, (int, float)):
            transport_total_estimate += toll_cost

    if transport_category == "bus":
        if isinstance(bus_total_estimate, (int, float)):
            transport_total_estimate += bus_total_estimate

    if transport_category in ["air", "ai_decide"]:
        if isinstance(flight_total_estimate, (int, float)):
            transport_total_estimate += flight_total_estimate

    if isinstance(local_transport_estimate, (int, float)):
        transport_total_estimate += local_transport_estimate

    route_note = "Route data is verified from OpenRouteService. Petrol and toll are estimated for a round trip."

    if transport_category == "own_car":
        route_note = (
            "Own/private car selected. Petrol and toll are calculated for round trip. "
            "Local transport is 0 because the user has their vehicle at destination."
        )

    if transport_category == "bus":
        route_note = (
            "Bus selected. Road route may be shown for distance/time, but bus ticket pricing "
            "is unavailable until a bus fare API/static fare table is connected."
        )

    if transport_category == "air":
        route_note = flight_context.get(
            "flight_note",
            "Flight selected. Flight price was checked from SerpApi Google Flights."
        )

    if transport_category == "ai_decide":
        flight_note = flight_context.get("flight_note", "Flight price not available.")
        route_note = (
            "AI Decide selected. Backend calculated available road cost and checked flight data "
            f"for comparison. Flight note: {flight_note}"
        )

    if not numeric_distance and transport_category in ["own_car", "taxi", "bus", "ai_decide"]:
        route_note = "Road route data was unavailable, so petrol and toll could not be calculated."

    return {
        "transport_category": transport_category,

        "road_distance_km": road_distance_km or "Unknown",
        "round_trip_distance_km": round_trip_distance_km or "Unknown",
        "road_travel_time": road_travel_time or "Unknown",
        "route_note": route_note,

        "petrol_price": petrol_price,
        "vehicle_avg_km_per_liter": vehicle_avg_km_per_liter,
        "estimated_petrol_cost": petrol_cost or "Unknown",
        "toll_cost": toll_cost or "Unknown",

        "origin_airports": "Unknown",
        "destination_airports": "Unknown",
        "direct_flights": "Unknown",
        "connecting_flights": "Unknown",

        "origin_airport": flight_context.get("origin_airport", "Unknown"),
        "destination_airport": flight_context.get("destination_airport", "Unknown"),
        "flight_price_per_person": flight_price_per_person,
        "flight_total_estimate": flight_total_estimate,
        "flight_airline": flight_context.get("flight_airline", "Unknown"),
        "flight_number": flight_context.get("flight_number", "Unknown"),
        "flight_duration_minutes": flight_context.get("flight_duration_minutes", "Unknown"),
        "flight_stops": flight_context.get("flight_stops", "Unknown"),
        "flight_note": flight_context.get("flight_note", "Unknown"),

        "bus_price_per_person": bus_price_per_person or "Unknown",
        "bus_total_estimate": bus_total_estimate or "Unknown",

        "local_transport_estimate": local_transport_estimate,
        "transport_total_estimate": transport_total_estimate,
        "hotel_estimate": hotel_estimate,
        "days": days,
        "is_round_trip": round_trip,
    }
