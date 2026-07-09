import os
import requests
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

ORS_API_KEY = os.getenv("ORS_API_KEY")


def normalize_location(location: str) -> str:
    location = location.strip()

    if "pakistan" not in location.lower():
        location = f"{location}, Pakistan"

    return location


def geocode_location(location: str) -> Optional[list]:
    if not ORS_API_KEY:
        print("ORS_API_KEY is missing from .env")
        return None

    location = normalize_location(location)

    url = "https://api.openrouteservice.org/geocode/search"

    params = {
        "api_key": ORS_API_KEY,
        "text": location,
        "size": 1,
        "boundary.country": "PK"
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=15
        )

        print("GEOCODE URL:", response.url)
        print("GEOCODE STATUS:", response.status_code)

        if response.status_code != 200:
            print("GEOCODE ERROR:", response.text)
            return None

        data = response.json()
        features = data.get("features", [])

        if not features:
            print("NO GEOCODE RESULT FOR:", location)
            return None

        coordinates = features[0]["geometry"]["coordinates"]
        label = features[0]["properties"].get("label")

        print(f"GEOCODED {location} -> {label} -> {coordinates}")

        return coordinates

    except requests.exceptions.ConnectionError:
        print("Could not connect to OpenRouteService geocoding API.")
        return None

    except requests.exceptions.Timeout:
        print("OpenRouteService geocoding request timed out.")
        return None

    except Exception as e:
        print("Unexpected geocoding error:", e)
        return None


def get_route_context(origin: str, destination: str) -> Dict:
    origin_coords = geocode_location(origin)
    destination_coords = geocode_location(destination)

    print("ORIGIN COORDS:", origin_coords)
    print("DESTINATION COORDS:", destination_coords)

    if not origin_coords or not destination_coords:
        return {
            "road_distance_km": None,
            "road_travel_time": None
        }

    url = "https://api.openrouteservice.org/v2/directions/driving-car"

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [
            origin_coords,
            destination_coords
        ]
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=body,
            timeout=20
        )

        print("ROUTE STATUS:", response.status_code)

        if response.status_code != 200:
            print("ROUTE ERROR:", response.text)
            return {
                "road_distance_km": None,
                "road_travel_time": None
            }

        data = response.json()

        routes = data.get("routes", [])

        if not routes:
            print("NO ROUTE FOUND:", data)
            return {
                "road_distance_km": None,
                "road_travel_time": None
            }

        summary = routes[0]["summary"]

        distance_km = round(summary["distance"] / 1000, 2)
        duration_minutes = round(summary["duration"] / 60)

        hours = duration_minutes // 60
        minutes = duration_minutes % 60

        travel_time = f"{hours} hours {minutes} minutes"

        return {
            "road_distance_km": distance_km,
            "road_travel_time": travel_time
        }

    except requests.exceptions.ConnectionError:
        print("Could not connect to OpenRouteService route API.")
        return {
            "road_distance_km": None,
            "road_travel_time": None
        }

    except requests.exceptions.Timeout:
        print("OpenRouteService route request timed out.")
        return {
            "road_distance_km": None,
            "road_travel_time": None
        }

    except Exception as e:
        print("Unexpected route API error:", e)
        return {
            "road_distance_km": None,
            "road_travel_time": None
        }