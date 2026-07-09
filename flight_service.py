import os
import time
import requests
from dotenv import load_dotenv
from airport_codes import AIRPORT_CODES
from country_airports import COUNTRY_AIRPORTS


load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")


USE_LIVE_FLIGHTS = os.getenv("USE_LIVE_FLIGHTS", "false").lower() == "true"

# In-memory cache. This resets when backend restarts.
FLIGHT_CACHE = {}
CACHE_TTL_SECONDS = 60 * 60

MOCK_FLIGHT_PRICES = {
    ("LHE", "KDU"): {
        "flight_price_per_person": 28000,
        "flight_total_estimate": 28000,
        "flight_airline": "PIA",
        "flight_number": "PK-MOCK",
        "flight_duration_minutes": 85,
        "flight_stops": 0,
    },
    ("ISB", "KDU"): {
        "flight_price_per_person": 24000,
        "flight_total_estimate": 24000,
        "flight_airline": "PIA",
        "flight_number": "PK-MOCK",
        "flight_duration_minutes": 65,
        "flight_stops": 0,
    },
    ("KHI", "LHE"): {
        "flight_price_per_person": 22000,
        "flight_total_estimate": 22000,
        "flight_airline": "Airblue",
        "flight_number": "PA-MOCK",
        "flight_duration_minutes": 105,
        "flight_stops": 0,
    },
    ("LHE", "KHI"): {
        "flight_price_per_person": 22000,
        "flight_total_estimate": 22000,
        "flight_airline": "Airblue",
        "flight_number": "PA-MOCK",
        "flight_duration_minutes": 105,
        "flight_stops": 0,
    },
}

def get_airport_code(place: str):
    if not place:
        return None

    place = place.strip().lower()

    # Already an airport code
    if len(place) == 3 and place.isalpha():
        return place.upper()

    # Exact city match
    if place in AIRPORT_CODES:
        return AIRPORT_CODES[place]

    # Exact country match
    if place in COUNTRY_AIRPORTS:
        return COUNTRY_AIRPORTS[place]

    return None


def get_cache_key(origin_code, destination_code, start_date, end_date, people):
    return (
        f"{origin_code}-{destination_code}-"
        f"{str(start_date)}-{str(end_date)}-{int(people or 1)}"
    )


def get_cached_result(cache_key):
    cached = FLIGHT_CACHE.get(cache_key)

    if not cached:
        return None

    age = time.time() - cached["created_at"]

    if age > CACHE_TTL_SECONDS:
        FLIGHT_CACHE.pop(cache_key, None)
        return None

    print("Using cached flight result")
    return cached["data"]


def save_to_cache(cache_key, data):
    FLIGHT_CACHE[cache_key] = {
        "created_at": time.time(),
        "data": data,
    }


def unknown_result(origin_code=None, destination_code=None, note="Flight data unavailable."):
    return {
        "origin_airport": origin_code or "Unknown",
        "destination_airport": destination_code or "Unknown",
        "flight_price_per_person": "Unknown",
        "flight_total_estimate": "Unknown",
        "flight_airline": "Unknown",
        "flight_number": "Unknown",
        "flight_duration_minutes": "Unknown",
        "flight_stops": "Unknown",
        "flight_note": note,
    }


def mock_result(origin_code, destination_code, people):
    base = MOCK_FLIGHT_PRICES.get((origin_code, destination_code))

    if not base:
        return unknown_result(
            origin_code,
            destination_code,
            "Mock flight price not available for this route. Add this route in MOCK_FLIGHT_PRICES or enable USE_LIVE_FLIGHTS=true."
        )

    price_per_person = base["flight_price_per_person"]
    total = price_per_person * int(people or 1)

    return {
        "origin_airport": origin_code,
        "destination_airport": destination_code,
        "flight_price_per_person": price_per_person,
        "flight_total_estimate": total,
        "flight_airline": base["flight_airline"],
        "flight_number": base["flight_number"],
        "flight_duration_minutes": base["flight_duration_minutes"],
        "flight_stops": base["flight_stops"],
        "flight_note": "Mock flight price used for testing. Live SerpApi search is disabled to save quota.",
    }


def extract_best_flight(data):
    flights = data.get("best_flights") or data.get("other_flights") or []

    valid_flights = [
        flight for flight in flights
        if isinstance(flight.get("price"), (int, float))
    ]

    if not valid_flights:
        return None

    return min(valid_flights, key=lambda flight: flight.get("price"))


def get_first_available(*values):
    for value in values:
        if value not in [None, "", "Unknown"]:
            return value
    return "Unknown"


def extract_flight_details(cheapest):
    """
    SerpApi Google Flights can return slightly different structures.
    This extracts airline, flight number, duration and stops safely.
    """

    flight_segments = cheapest.get("flights") or []
    first_leg = flight_segments[0] if flight_segments else {}

    airline = get_first_available(
        first_leg.get("airline"),
        first_leg.get("airline_name"),
        cheapest.get("airline"),
        cheapest.get("airlines", [None])[0] if isinstance(cheapest.get("airlines"), list) and cheapest.get("airlines") else None,
    )

    flight_number = get_first_available(
        first_leg.get("flight_number"),
        first_leg.get("flight"),
        first_leg.get("airplane"),
        cheapest.get("flight_number"),
    )

    duration_minutes = get_first_available(
        cheapest.get("total_duration"),
        first_leg.get("duration"),
        cheapest.get("duration"),
    )

    layovers = cheapest.get("layovers") or []

    if layovers:
        stops = len(layovers)
    elif len(flight_segments) > 1:
        stops = len(flight_segments) - 1
    else:
        stops = 0

    return {
        "airline": airline,
        "flight_number": flight_number,
        "duration_minutes": duration_minutes,
        "stops": stops,
    }


def get_flight_context(origin: str, destination: str, start_date, end_date, people: int):
    people = int(people or 1)

    origin_code = get_airport_code(origin)
    destination_code = get_airport_code(destination)

    if not origin_code or not destination_code:
        return unknown_result(
            origin_code,
            destination_code,
            "Airport code not found for origin or destination."
        )

    cache_key = get_cache_key(
        origin_code,
        destination_code,
        start_date,
        end_date,
        people
    )

    cached = get_cached_result(cache_key)
    if cached:
        return cached

    # Testing-safe mode: does NOT call SerpApi.
    if not USE_LIVE_FLIGHTS:
        result = mock_result(origin_code, destination_code, people)
        save_to_cache(cache_key, result)
        return result

    if not SERPAPI_KEY:
        result = unknown_result(
            origin_code,
            destination_code,
            "SERPAPI_KEY is missing. Add it in your .env file."
        )
        save_to_cache(cache_key, result)
        return result

    params = {
        "engine": "google_flights",
        "api_key": SERPAPI_KEY,
        "departure_id": origin_code,
        "arrival_id": destination_code,
        "outbound_date": str(start_date),
        "return_date": str(end_date),
        "adults": people,
        "currency": "PKR",
        "hl": "en",
        "gl": "pk",
        "type": "1",
    }

    try:
        response = requests.get(
            "https://serpapi.com/search.json",
            params=params,
            timeout=20
        )

        data = response.json()

        if response.status_code != 200:
            result = unknown_result(
                origin_code,
                destination_code,
                data.get("error", "Flight API request failed.")
            )
            save_to_cache(cache_key, result)
            return result

        cheapest = extract_best_flight(data)

        if not cheapest:
            result = unknown_result(
                origin_code,
                destination_code,
                "SerpApi returned results but no priced flights were found for this route/date."
            )
            save_to_cache(cache_key, result)
            return result

        total_price = cheapest.get("price")

        if not isinstance(total_price, (int, float)):
            result = unknown_result(
                origin_code,
                destination_code,
                "Flight price was not available in API response."
            )
            save_to_cache(cache_key, result)
            return result

        price_per_person = round(total_price / people)

        details = extract_flight_details(cheapest)

        # Keep these debug lines while testing live SerpApi.
        print("CHEAPEST FLIGHT:", cheapest)
        print("EXTRACTED FLIGHT DETAILS:", details)

        result = {
            "origin_airport": origin_code,
            "destination_airport": destination_code,
            "flight_price_per_person": price_per_person,
            "flight_total_estimate": total_price,
            "flight_airline": details["airline"],
            "flight_number": details["flight_number"],
            "flight_duration_minutes": details["duration_minutes"],
            "flight_stops": details["stops"],
            "flight_note": "Live flight price fetched from SerpApi Google Flights and cached.",
        }

        save_to_cache(cache_key, result)
        return result

    except Exception as e:
        result = unknown_result(
            origin_code,
            destination_code,
            f"Flight API error: {str(e)}"
        )
        save_to_cache(cache_key, result)
        return result
