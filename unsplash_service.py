import os
import requests
from dotenv import load_dotenv

load_dotenv()

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")


def get_destination_image(destination: str):

    if not UNSPLASH_ACCESS_KEY:
        return None

    url = "https://api.unsplash.com/search/photos"

    params = {
        "query": f"{destination} travel landmark",
        "orientation": "landscape",
        "per_page": 1,
        "client_id": UNSPLASH_ACCESS_KEY,
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()

        if response.status_code != 200:
            print(data)
            return None

        if len(data["results"]) == 0:
            return None

        return data["results"][0]["urls"]["regular"]

    except Exception as e:
        print(e)
        return None