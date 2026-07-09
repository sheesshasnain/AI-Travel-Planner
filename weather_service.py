import os
import requests
from dotenv import load_dotenv

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")


def get_coordinates(destination: str):
    geo_url = "http://api.openweathermap.org/geo/1.0/direct"

    params = {
        "q": destination,
        "limit": 1,
        "appid": WEATHER_API_KEY
    }

    response = requests.get(geo_url, params=params)
    data = response.json()

    if not data:
        return None

    return {
        "lat": data[0]["lat"],
        "lon": data[0]["lon"],
        "name": data[0]["name"],
        "country": data[0].get("country", "")
    }


def get_weather_forecast(destination: str):
    if not WEATHER_API_KEY:
        return {
            "summary": "Weather API key missing.",
            "temperature": None,
            "humidity": None,
            "wind_speed": None,
            "condition": "Unavailable"
        }

    try:
        location = get_coordinates(destination)

        if not location:
            return {
                "summary": "Weather data unavailable for this destination.",
                "temperature": None,
                "humidity": None,
                "wind_speed": None,
                "condition": "Unavailable"
            }

        url = "https://api.openweathermap.org/data/2.5/forecast"

        params = {
            "lat": location["lat"],
            "lon": location["lon"],
            "appid": WEATHER_API_KEY,
            "units": "metric"
        }

        response = requests.get(url, params=params)
        data = response.json()

        if response.status_code != 200:
            return {
                "summary": f"Weather error: {data}",
                "temperature": None,
                "humidity": None,
                "wind_speed": None,
                "condition": "Unavailable"
            }

        forecasts = data["list"][:8]

        weather_text = (
            f"Weather forecast for {location['name']}, {location['country']}:\n"
        )

        for item in forecasts:
            date_time = item["dt_txt"]
            temp = item["main"]["temp"]
            condition = item["weather"][0]["description"]

            weather_text += f"{date_time}: {temp}°C, {condition}\n"

        first_forecast = forecasts[0]

        return {
            "summary": weather_text,
            "temperature": first_forecast["main"]["temp"],
            "humidity": first_forecast["main"]["humidity"],
            "wind_speed": first_forecast["wind"]["speed"],
            "condition": first_forecast["weather"][0]["main"]
        }

    except Exception as e:
        return {
            "summary": f"Weather data unavailable. Error: {e}",
            "temperature": None,
            "humidity": None,
            "wind_speed": None,
            "condition": "Unavailable"
        }