import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing. Please add it in your .env file.")

client = Groq(
    api_key=GROQ_API_KEY
)
def generate_itinerary(
    origin,
    destination,
    start_date,
    end_date,
    budget,
    people,
    travel_style,
    interests,
    age,
    gender,
    weather,
    transport_mode,
    trip_type,
    hotel_preference,
    pace,
    route_context
):
    road_distance_km = route_context.get("road_distance_km")
    road_travel_time = route_context.get("road_travel_time")
    route_note = route_context.get("route_note")
    user_budget_num = float(budget or 0)

    backend_transport_total = route_context.get("transport_total_estimate", 0)
    backend_hotel_total = route_context.get("hotel_estimate", 0)

    known_required_budget = 0

    if isinstance(backend_transport_total, (int, float)):
      known_required_budget += backend_transport_total

    if isinstance(backend_hotel_total, (int, float)):
      known_required_budget += backend_hotel_total

    shortfall = max(known_required_budget - user_budget_num, 0)
    is_budget_enough = shortfall <= 0


    prompt = f"""
You are a professional AI travel planner for Pakistan and international trips.

Create a realistic, personalized travel itinerary.
Budget Reality Check:
User Budget: PKR {user_budget_num}
Backend Known Required Budget: PKR {known_required_budget}
Budget Shortfall: PKR {shortfall}
Is Budget Enough: {is_budget_enough}

CRITICAL BUDGET RULE:
Use the exact budget_status values provided above.
Do not invent shortfall.
Do not say budget is enough if Budget Shortfall is greater than 0.
The trip duration is {route_context.get("days")} days.
The "days" array must contain exactly {route_context.get("days")} objects.
Do not summarize multiple days into one object.
Do not generate fewer days than the trip duration.
If the trip is long, still create one object per day.
Return ONLY valid JSON.
Do not use markdown.
Do not add explanation outside JSON.
Do not use #, *, bullet symbols, or extra text outside JSON.
All budget amounts must be in PKR.
All plans must be geographically realistic.
If exact live price data is not provided, clearly mention inside JSON that the amount is an estimate.
Do not invent flight prices, petrol prices, tolls, hotels, or route distances if backend data is missing.

Trip Details:
Starting Location: {origin}
Destination: {destination}
Dates: {start_date} to {end_date}
Budget: PKR {budget}
Number of Travelers: {people}

Traveler Profile:
Age: {age}
Gender: {gender}

Travel Preferences:
Travel Style: {travel_style}
Trip Type: {trip_type}
Transport Mode Selected By User: {transport_mode}
Hotel Preference: {hotel_preference}
Travel Pace: {pace}
Interests: {interests}

Weather Forecast:
{weather}

Verified Backend Route and Cost Context:
Use this backend context as the source of truth. Do not replace backend-provided values with your own guesses.

Road Distance One Way: {route_context.get("road_distance_km")}
Road Distance Round Trip: {route_context.get("round_trip_distance_km")}
Estimated Road Travel Time One Way: {route_context.get("road_travel_time")}

Current Petrol Price Per Liter: PKR {route_context.get("petrol_price")}
Vehicle Average Fuel Efficiency: {route_context.get("vehicle_avg_km_per_liter")} km/liter
Estimated Petrol Cost Round Trip: PKR {route_context.get("estimated_petrol_cost")}
Estimated Toll/Tax Cost Round Trip: PKR {route_context.get("toll_cost")}
Local Transport Estimate: PKR {route_context.get("local_transport_estimate")}
Backend Transport Total Estimate: PKR {route_context.get("transport_total_estimate")}

Hotel Estimate: PKR {route_context.get("hotel_estimate")}
Trip Days: {route_context.get("days")}

Origin Airports: {route_context.get("origin_airports")}
Destination Airports: {route_context.get("destination_airports")}
Available Direct Flights: {route_context.get("direct_flights")}
Available Connecting Flights: {route_context.get("connecting_flights")}
Flight Price Per Person: PKR {route_context.get("flight_price_per_person")}
Flight Total Estimate: PKR {route_context.get("flight_total_estimate")}

Route Data Note:
{route_context.get("route_note")}

Planning Rules:
Use the starting location and backend route/cost context to make transport and budget realistic.
If transport mode is "AI Decide", recommend the best option based on budget, distance, road travel time, comfort, weather, accessibility, and available backend data.
If road distance or travel time is missing, mention inside JSON that route data was unavailable and provide a conservative explanation without inventing exact route values.
Do not ignore transport cost.
Do not include attractions from the origin city unless they are part of a departure-day plan.
Do not include attractions from unrelated cities.
If trip type is family, keep the schedule safer and more relaxed.
If trip type is couple, include romantic or scenic experiences where appropriate.
If trip type is friends, include fun group activities.
If trip type is solo, include safe and flexible activities.
If pace is relaxed, keep fewer activities per day.
If pace is packed, include more activities per day.
If rain is expected, suggest indoor activities.
If weather is clear, prioritize outdoor activities.
If temperature is high, avoid outdoor plans in the afternoon.
Match hotel suggestions with hotel preference.

Transport Budget Rules:
If user transport mode is road-based such as car, private car, road, bus, taxi, cab, vehicle, drive, or driving:
Use Backend Transport Total Estimate exactly for budget_breakdown.transport when it is available.
The petrol cost is already calculated for round trip, including going and returning. Do not double it again.
The toll/tax cost is already calculated for round trip when available. Do not double it again.
Backend Transport Total Estimate already includes petrol, toll/tax, and local transport.

If user transport mode is air-based such as air, flight, plane, airplane, or by air:
Use Flight Total Estimate only if backend provides a real numeric value.
If Flight Price Per Person or Flight Total Estimate is Unknown, do not invent ticket price.
If flight price is Unknown, write in JSON that real-time ticket pricing is unavailable and needs flight API/live booking data.
For air trips, still include Local Transport Estimate in the transport budget if available.

If transport mode is "AI Decide":
If road distance is very long and flight price is available, compare road cost with flight cost and select the more practical option.
If flight price is Unknown, do not pretend that air is cheaper. Base the final recommendation on available backend data.

Budget Rules:
The user's entered budget is fixed and must never be changed.
User Budget: PKR {budget}
Always include budget_status.shortfall.
If estimated_required_budget is greater than user_budget, calculate:
shortfall = estimated_required_budget - user_budget.
If budget is enough, shortfall must be "PKR 0".
Do not omit the shortfall field.
Do not present estimated_total_budget as the user's budget.
estimated_total_budget means the realistic required trip cost based on backend transport, hotel, food, activities, and buffer.

First calculate fixed backend costs:
- Backend Transport Total Estimate
- Hotel Estimate

Then calculate remaining budget:
remaining_budget = User Budget - Backend Transport Total Estimate - Hotel Estimate

If remaining_budget is positive:
Plan food, activities, and emergency buffer within the remaining budget.
Try to keep estimated_total_budget less than or equal to the user's budget.

If remaining_budget is zero or negative:
Clearly state that the selected trip is over budget.
Do not fake cheaper petrol, toll, route, or hotel costs.
Suggest practical changes such as fewer days, cheaper hotel, fewer activities, different transport mode, or higher budget.

If estimated realistic cost is greater than user budget:
Set budget_status.is_budget_enough to false.
Set budget_status.message to clearly explain the shortfall amount.
Do not say the trip fits the budget if it does not.
Use this exact JSON structure:

{{
  "summary": "Short personalized trip summary. Mention whether route data, prices, petrol, tolls, hotel, or flight prices are estimated or unavailable.",
  "selected_transport_mode": "Final recommended transport mode",
  "route_reality_check": {{
    "is_original_request_fully_possible": true,
    "adjustment_made": "No major adjustment needed",
    "reason": "Short reason based on geography, budget, roads, flights, weather, or backend cost context"
  }},
  "estimated_total_budget": "PKR amount",
  "budget_status": {{
  "user_budget": "PKR {user_budget_num}",
  "estimated_required_budget": "PKR {known_required_budget}",
  "is_budget_enough": {str(is_budget_enough).lower()},
  "shortfall": "PKR {shortfall}",
  "message": "Short explanation"
  }},
  "days": [
    {{
      "day": 1,
      "location_focus": "Main city/area for this day",
      "morning": "Plan for morning",
      "afternoon": "Plan for afternoon",
      "evening": "Plan for evening",
      "night": "Plan for night",
      "estimated_day_cost": "PKR amount"
    }}
  ],
  "food_suggestions": ["food 1", "food 2", "food 3"],
  "transport_suggestions": ["transport 1", "transport 2"],
  "hotel_suggestions": ["hotel suggestion 1", "hotel suggestion 2"],
  "budget_breakdown": {{
    "hotel": "PKR amount",
    "food": "PKR amount",
    "transport": "PKR amount",
    "petrol": "PKR amount or Unavailable",
    "toll_tax": "PKR amount or Unavailable",
    "local_transport": "PKR amount",
    "flight": "PKR amount or Unavailable",
    "activities": "PKR amount",
    "emergency_buffer": "PKR amount"
  }},
  "backend_costs_used": {{
    "flight_airline": "{route_context.get("flight_airline")}",
    "flight_number": "{route_context.get("flight_number")}",
    "flight_duration_minutes": "{route_context.get("flight_duration_minutes")}",
    "flight_stops": "{route_context.get("flight_stops")}",
    "flight_note": "{route_context.get("flight_note")}",
    "road_distance_one_way": "{route_context.get("road_distance_km")}",
    "road_distance_round_trip": "{route_context.get("round_trip_distance_km")}",
    "road_travel_time_one_way": "{route_context.get("road_travel_time")}",
    "petrol_cost_round_trip": "{route_context.get("estimated_petrol_cost")}",
    "toll_tax_round_trip": "{route_context.get("toll_cost")}",
    "local_transport_estimate": "{route_context.get("local_transport_estimate")}",
    "backend_transport_total": "{route_context.get("transport_total_estimate")}",
    "hotel_estimate": "{route_context.get("hotel_estimate")}",
    "flight_price_per_person": "{route_context.get("flight_price_per_person")}",
    "flight_total_estimate": "{route_context.get("flight_total_estimate")}"
  }},
  "packing_tips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "safety_tips": ["tip 1", "tip 2", "tip 3"]
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a premium AI travel planner creating realistic, practical, weather-aware, route-aware, and budget-conscious itineraries."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content