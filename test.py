import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

print("API KEY:", api_key)

if not api_key:
    print("GEMINI_API_KEY not found")
else:
    genai.configure(api_key=api_key)

    for model in genai.list_models():
        print(model.name)