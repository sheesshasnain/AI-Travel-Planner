import { useEffect, useState } from "react";
import html2pdf from "html2pdf.js";
import { useLocation, useParams } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import LuxuryTravelReport from "../components/pdf/LuxuryTravelReport";
import { useToast } from "../context/ToastContext";
import "../styles/pages/tripDetail_refined.css";

function TripDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { showToast } = useToast();

  const [trip, setTrip] = useState(location.state?.trip || null);
  const [routeContext, setRouteContext] = useState(
    location.state?.routeContext || location.state?.route_context || null
  );

  useEffect(() => {
    const fetchTrip = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await API.get(`/trips/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseTrip = res.data?.trip || res.data;
        const responseRouteContext =
          res.data?.route_context || res.data?.routeContext;

        setTrip(responseTrip);

        if (responseRouteContext) {
          setRouteContext(responseRouteContext);
        }
      } catch (err) {
        console.log(err);
        showToast("Failed to load trip.", "error");
      }
    };

    fetchTrip();
  }, [id, showToast]);

  if (!trip) {
    return (
      <div className="luxury-page">
        <Sidebar />
        <main className="luxury-main">
          <div className="page">Loading trip...</div>

      </main>
      </div>
    );
  }

  const itinerary = parseItinerary(trip.ai_itinerary);
  const forecastItems = getForecastItems(trip.weather_summary);
  const interests = getInterests(trip.interests);
  const costContext = getCostContext(routeContext, itinerary);
  const budgetStatus = itinerary?.budget_status;
  const transportCategory = getTransportCategory(trip.transport_mode, costContext);

  const isCarTrip = transportCategory === "car";
  const isFlightTrip = transportCategory === "flight";
  const isBusTrip = transportCategory === "bus";
  const isAiDecide = transportCategory === "ai_decide";

  const exportPDF = () => {
    const element = document.getElementById("luxury-travel-report-pdf");

    if (!element) {
      showToast("Unable to export itinerary.", "error");
      return;
    }

    const destinationName = trip.destination || "Trip";
    const safeFileName = destinationName
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    const options = {
      margin: 0.25,
      filename: `${safeFileName}-ai-itinerary.pdf`,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 1.1,
        useCORS: true,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
      },
    };

    html2pdf().set(options).from(element).save();
  };

  return (
    <div className="luxury-page">
      <Sidebar />

      <main className="luxury-main trip-detail-main">
        <section className="trip-hero">
          <img
            src={
              trip.image_url ||
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
            }
            alt={trip.destination}
          />

          <div className="trip-hero-overlay">
            <p className="profile-label">Luxury AI Itinerary</p>
            <h1>{trip.destination} ✦</h1>

            <p className="hero-route-line">
              {trip.origin || "Origin"}
              <span>→</span>
              {trip.destination}
            </p>

            <p>
              {trip.start_date} → {trip.end_date}
            </p>
          </div>
        </section>

        <div className="export-actions">
          <button type="button" className="export-pdf-btn" onClick={exportPDF}>
            📄 Export Luxury PDF
          </button>
        </div>

        <div className="trip-page-content">
          <section className="pdf-cover">
            <div>
              <p className="pdf-kicker">AI Travel Planner</p>
              <h1>{trip.destination} Itinerary</h1>
              <p>
                {trip.origin || "Origin"} → {trip.destination}
              </p>
              <p>
                {trip.start_date} → {trip.end_date}
              </p>
            </div>
          </section>

        <section className="trip-info-grid">
          <JourneyStat label="📍 From" value={trip.origin || "Not set"} />
          <JourneyStat
            label="💰 Your Budget"
            value={`${Number(trip.budget).toLocaleString()} PKR`}
          />
          <JourneyStat label="👥 Travelers" value={trip.people} />
          <JourneyStat label="🧳 Style" value={trip.travel_style} />
          <JourneyStat label="✈ Transport" value={trip.transport_mode || "Not set"} />
          <JourneyStat label="❤️ Trip Type" value={trip.trip_type || "Not set"} />
          <JourneyStat label="🏨 Hotel" value={trip.hotel_preference || "Not set"} />
          <JourneyStat label="⚡ Pace" value={trip.pace || "Not set"} />
        </section>

        {budgetStatus && (
          <section className="itinerary-card premium-section">
            <div className="section-header">
              <p className="profile-label">Budget Reality Check</p>
              <h2>
                {toBoolean(budgetStatus.is_budget_enough)
                  ? "Budget Looks Manageable"
                  : "Budget May Be Short"}
              </h2>
            </div>

            <div className="trip-info-grid">
              <JourneyStat
                label="💰 User Budget"
                value={formatPKR(budgetStatus.user_budget || trip.budget)}
              />

              <JourneyStat
                label="📊 Estimated Required"
                value={formatPKR(
                  budgetStatus.estimated_required_budget ||
                    itinerary?.estimated_total_budget
                )}
              />

              <JourneyStat
                label="⚖ Status"
                value={
                  toBoolean(budgetStatus.is_budget_enough)
                    ? "Enough"
                    : "Over Budget"
                }
              />

              <JourneyStat
                label="📉 Shortfall"
                value={formatPKR(budgetStatus.shortfall || "PKR 0")}
              />
            </div>

            {budgetStatus.message && <p>{budgetStatus.message}</p>}
          </section>
        )}

        <RouteCostOverview
          context={costContext}
          transportCategory={transportCategory}
        />

        <section className="itinerary-card premium-section">
          <div className="section-header">
            <p className="profile-label">Personalization Inputs</p>
            <h2>Traveler Preferences</h2>
          </div>

          <section className="premium-section journey-overview-card">
            <div className="section-header">
              <p className="profile-label">AI Travel Profile</p>
              <h2>✈ Journey Overview</h2>
            </div>

            <div className="journey-route">
              <div>
                <span>FROM</span>
                <h3>{trip.origin || "Unknown"}</h3>
              </div>

              <div className="journey-arrow">↓</div>

              <div>
                <span>TO</span>
                <h3>{trip.destination}</h3>
              </div>
            </div>

            <div className="journey-trip-type">
              ❤️ {trip.trip_type || "Custom"} Journey
            </div>

            <div className="journey-features">
              <div className="journey-pill">✈ {trip.transport_mode || "Transport"}</div>
              <div className="journey-pill">🏨 {trip.hotel_preference || "Hotel"}</div>
              <div className="journey-pill">⚡ {trip.pace || "Pace"}</div>
            </div>

            {interests.length > 0 && (
              <div className="preview-chips">
                {interests.map((interest) => (
                  <span key={interest}>{interest}</span>
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="weather-card premium-section">
          <div className="section-header">
            <p className="profile-label">Weather-Aware Planning</p>
            <h2>Current Weather</h2>
          </div>

          <div className="weather-grid">
            <WeatherItem
              label="🌤 Condition"
              value={trip.weather_condition || "Unavailable"}
            />

            <WeatherItem
              label="🌡 Temperature"
              value={
                trip.temperature !== null && trip.temperature !== undefined
                  ? `${trip.temperature}°C`
                  : "N/A"
              }
            />

            <WeatherItem
              label="💧 Humidity"
              value={
                trip.humidity !== null && trip.humidity !== undefined
                  ? `${trip.humidity}%`
                  : "N/A"
              }
            />

            <WeatherItem
              label="💨 Wind"
              value={
                trip.wind_speed !== null && trip.wind_speed !== undefined
                  ? `${trip.wind_speed} m/s`
                  : "N/A"
              }
            />
          </div>

          {forecastItems.length > 0 ? (
            <div className="forecast-grid">
              {forecastItems.map((forecast, index) => (
                <ForecastCard forecast={forecast} key={index} />
              ))}
            </div>
          ) : (
            <div className="weather-summary">Weather forecast unavailable.</div>
          )}
        </section>

        {itinerary ? (
          <>
            <section className="itinerary-card premium-section">
              <div className="section-header">
                <p className="profile-label">AI Overview</p>
                <h2>Trip Summary</h2>
              </div>

              <p>{itinerary.summary}</p>

              {itinerary.estimated_total_budget && (
                <div className="estimated-budget-box">
                  <span>Estimated Required Budget: </span>
                  <strong>{formatPKR(itinerary.estimated_total_budget)}</strong>
                </div>
              )}
            </section>

            <section className="days-grid">
              {ensureArray(itinerary.days).map((day, index) => (
                <div className="day-card" key={day.day || index}>
                  <div className="day-badge">Day {day.day || index + 1}</div>

                  {day.location_focus && (
                    <div className="timeline-item">
                      <span>Location Focus</span>
                      <p>{day.location_focus}</p>
                    </div>
                  )}

                  <TimelineItem title="Morning" text={day.morning} />
                  <TimelineItem title="Afternoon" text={day.afternoon} />
                  <TimelineItem title="Evening" text={day.evening} />
                  <TimelineItem title="Night" text={day.night} />

                  {day.estimated_day_cost && (
                    <div className="estimated-budget-box">
                      <span>Estimated Day Cost: </span>
                      <strong>{formatPKR(day.estimated_day_cost)}</strong>
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section className="detail-section-grid">
              <InfoCard
                title="Food Suggestions"
                icon="🍽"
                items={itinerary.food_suggestions}
              />

              <InfoCard
                title="Transport"
                icon={isFlightTrip ? "✈️" : "🚗"}
                items={itinerary.transport_suggestions}
              />

              <InfoCard
                title="Hotel Suggestions"
                icon="🏨"
                items={itinerary.hotel_suggestions}
              />

              <InfoCard
                title="Packing Tips"
                icon="🎒"
                items={itinerary.packing_tips}
              />

              <InfoCard
                title="Safety Tips"
                icon="🛡"
                items={itinerary.safety_tips}
              />
            </section>

            <section className="itinerary-card premium-section">
              <div className="section-header">
                <p className="profile-label">Estimated Cost</p>
                <h2>Budget Breakdown</h2>
              </div>

              <div className="budget-list">
                <BudgetRow
                  icon="🏨"
                  label="Hotel"
                  value={itinerary.budget_breakdown?.hotel}
                />

                <BudgetRow
                  icon="🍔"
                  label="Food"
                  value={itinerary.budget_breakdown?.food}
                />

                <BudgetRow
                  icon="🚕"
                  label="Transport Total"
                  value={itinerary.budget_breakdown?.transport}
                />

                {(isCarTrip || isAiDecide) && (
                  <>
                    <BudgetRow
                      icon="⛽"
                      label="Petrol"
                      value={itinerary.budget_breakdown?.petrol}
                    />

                    <BudgetRow
                      icon="🧾"
                      label="Toll / Tax"
                      value={itinerary.budget_breakdown?.toll_tax}
                    />
                  </>
                )}

                {(isFlightTrip || isAiDecide) && (
                  <BudgetRow
                    icon="✈"
                    label="Flight"
                    value={itinerary.budget_breakdown?.flight}
                  />
                )}

                {!isCarTrip && (
                  <BudgetRow
                    icon="🚖"
                    label="Local Transport"
                    value={itinerary.budget_breakdown?.local_transport}
                  />
                )}

                {isBusTrip && (
                  <BudgetRow
                    icon="🚌"
                    label="Bus"
                    value={itinerary.budget_breakdown?.bus}
                  />
                )}

                <BudgetRow
                  icon="🎟"
                  label="Activities"
                  value={itinerary.budget_breakdown?.activities}
                />

                <BudgetRow
                  icon="💳"
                  label="Total Estimated Cost"
                  value={
                    itinerary.estimated_total_budget ||
                    itinerary.budget_breakdown?.total ||
                    budgetStatus?.estimated_required_budget
                  }
                />

                <BudgetRow
                  icon="🛟"
                  label="Emergency Buffer"
                  value={itinerary.budget_breakdown?.emergency_buffer}
                />
              </div>
            </section>
          </>
        ) : (
          <section className="itinerary-card premium-section">
            <div className="section-header">
              <p className="profile-label">AI Journey</p>
              <h2>Your AI-Crafted Journey</h2>
            </div>

            <div className="itinerary-text">{String(trip.ai_itinerary || "")}</div>
          </section>
        )}

        <section className="pdf-footer-note">
          <p>Generated by AI Travel Planner</p>
        </section>
        </div>

        {itinerary && (
          <div className="luxury-report-hidden">
            <LuxuryTravelReport
              trip={trip}
              itinerary={itinerary}
              costContext={costContext}
              budgetStatus={budgetStatus}
              forecastItems={forecastItems}
              interests={interests}
              transportCategory={transportCategory}
            />
          </div>
        )}

      </main>
    </div>
  );
}

function RouteCostOverview({ context, transportCategory }) {
  if (!context || !hasUsefulCostContext(context)) return null;

  const isCarTrip = transportCategory === "car";
  const isFlightTrip = transportCategory === "flight";
  const isBusTrip = transportCategory === "bus";
  const isAiDecide = transportCategory === "ai_decide";

  return (
    <section className="itinerary-card premium-section">
      <div className="section-header">
        <p className="profile-label">Backend Cost Intelligence</p>
        <h2>
          {isFlightTrip
            ? "Flight & Distance Overview"
            : isCarTrip
            ? "Car Route & Cost Overview"
            : isBusTrip
            ? "Bus & Route Overview"
            : "Route & Cost Overview"}
        </h2>
      </div>

      <div className="trip-info-grid">
        <JourneyStat
          label={isFlightTrip ? "🛣 Road Distance Reference" : "🛣 One-Way Distance"}
          value={formatDistance(context.road_distance_one_way)}
        />

        {(isCarTrip || isAiDecide) && (
          <JourneyStat
            label="🔁 Round-Trip Distance"
            value={formatDistance(context.road_distance_round_trip)}
          />
        )}

        {isFlightTrip ? (
          <JourneyStat
            label="✈ Flight Time"
            value={formatFlightTime(context.flight_duration_minutes)}
          />
        ) : (
          <JourneyStat
            label="⏱ Road Time"
            value={safeValue(context.road_travel_time_one_way)}
          />
        )}

        {(isCarTrip || isAiDecide) && (
          <>
            <JourneyStat
              label="⛽ Petrol Round Trip"
              value={formatPKR(context.petrol_cost_round_trip)}
            />

            <JourneyStat
              label="🧾 Toll / Tax"
              value={formatPKR(context.toll_tax_round_trip)}
            />
          </>
        )}

        {(isFlightTrip || isAiDecide) && (
          <>
            <JourneyStat
              label="✈ Flight / Person"
              value={formatPKR(context.flight_price_per_person)}
            />

            <JourneyStat
              label="🧳 Flight Total"
              value={formatPKR(context.flight_total_estimate)}
            />

            <JourneyStat
              label="🏷 Airline"
              value={safeValue(context.flight_airline)}
            />

            <JourneyStat
              label="🛫 Flight No."
              value={safeValue(context.flight_number)}
            />

            <JourneyStat
              label="🛑 Stops"
              value={formatStops(context.flight_stops)}
            />
          </>
        )}

        {!isCarTrip && (
          <JourneyStat
            label="🚖 Local Transport"
            value={formatPKR(context.local_transport_estimate)}
          />
        )}

        <JourneyStat
          label="🚕 Transport Total"
          value={formatPKR(context.backend_transport_total)}
        />

        <JourneyStat
          label="🏨 Hotel Estimate"
          value={formatPKR(context.hotel_estimate)}
        />
      </div>

      {context.route_note && (
        <p className="weather-summary">{context.route_note}</p>
      )}
    </section>
  );
}

function JourneyStat({ label, value }) {
  return (
    <div className="profile-stat">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function WeatherItem({ label, value }) {
  return (
    <div className="weather-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ForecastCard({ forecast }) {
  return (
    <div className="forecast-card">
      <div className="forecast-icon">{forecast.icon}</div>

      <div>
        <h4>{forecast.date}</h4>
        <p>{forecast.time}</p>
      </div>

      <strong>{forecast.weather}</strong>
    </div>
  );
}

function TimelineItem({ title, text }) {
  return (
    <div className="timeline-item">
      <span>{title}</span>
      <p>{text || "Not available."}</p>
    </div>
  );
}

function InfoCard({ title, icon, items }) {
  const safeItems = ensureArray(items);

  return (
    <div className="itinerary-card mini-info-card">
      <h2>
        {icon} {title}
      </h2>

      {safeItems.length > 0 ? (
        safeItems.map((item, index) => <p key={index}>✓ {item}</p>)
      ) : (
        <p>Not available.</p>
      )}
    </div>
  );
}

function BudgetRow({ icon, label, value }) {
  const displayValue = safeValue(value);

  if (displayValue === "Unavailable") {
    return null;
  }

  return (
    <div className="budget-row">
      <span>
        {icon} {label}
      </span>

      <strong>{displayValue}</strong>
    </div>
  );
}

function parseItinerary(aiItinerary) {
  if (!aiItinerary) return null;

  if (typeof aiItinerary === "object") {
    return aiItinerary;
  }

  if (typeof aiItinerary !== "string") {
    return null;
  }

  try {
    return JSON.parse(aiItinerary);
  } catch {
    try {
      const cleaned = aiItinerary
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function getCostContext(routeContext, itinerary) {
  const backend = itinerary?.backend_costs_used || {};

  return {
    transport_category:
      routeContext?.transport_category ??
      backend.transport_category,

    road_distance_one_way:
      routeContext?.road_distance_km ??
      routeContext?.road_distance_one_way ??
      backend.road_distance_one_way,

    road_distance_round_trip:
      routeContext?.round_trip_distance_km ??
      routeContext?.road_distance_round_trip ??
      backend.road_distance_round_trip,

    road_travel_time_one_way:
      routeContext?.road_travel_time ??
      routeContext?.road_travel_time_one_way ??
      backend.road_travel_time_one_way,

    route_note:
      routeContext?.route_note ??
      backend.route_note,

    petrol_cost_round_trip:
      routeContext?.estimated_petrol_cost ??
      routeContext?.petrol_cost_round_trip ??
      backend.petrol_cost_round_trip,

    toll_tax_round_trip:
      routeContext?.toll_cost ??
      routeContext?.toll_tax_round_trip ??
      backend.toll_tax_round_trip,

    local_transport_estimate:
      routeContext?.local_transport_estimate ??
      backend.local_transport_estimate,

    backend_transport_total:
      routeContext?.transport_total_estimate ??
      routeContext?.backend_transport_total ??
      backend.backend_transport_total,

    hotel_estimate:
      routeContext?.hotel_estimate ??
      backend.hotel_estimate,

    flight_price_per_person:
      routeContext?.flight_price_per_person ??
      backend.flight_price_per_person,

    flight_total_estimate:
      routeContext?.flight_total_estimate ??
      backend.flight_total_estimate,

    flight_airline:
      routeContext?.flight_airline ??
      backend.flight_airline ??
      itinerary?.backend_costs_used?.flight_airline ??
      itinerary?.flight_airline,

    flight_number:
      routeContext?.flight_number ??
      backend.flight_number ??
      itinerary?.backend_costs_used?.flight_number ??
      itinerary?.flight_number,

    flight_duration_minutes:
      routeContext?.flight_duration_minutes ??
      backend.flight_duration_minutes ??
      itinerary?.backend_costs_used?.flight_duration_minutes ??
      itinerary?.flight_duration_minutes,

    flight_stops:
      routeContext?.flight_stops ??
      backend.flight_stops ??
      itinerary?.backend_costs_used?.flight_stops ??
      itinerary?.flight_stops,

    bus_price_per_person:
      routeContext?.bus_price_per_person ??
      backend.bus_price_per_person,

    bus_total_estimate:
      routeContext?.bus_total_estimate ??
      backend.bus_total_estimate,
  };
}

function hasUsefulCostContext(context) {
  return Object.values(context).some(
    (value) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      String(value).toLowerCase() !== "unknown" &&
      String(value).toLowerCase() !== "unavailable"
  );
}

function getTransportCategory(mode, context = {}) {
  if (context?.transport_category) {
    if (context.transport_category === "own_car" || context.transport_category === "taxi") {
      return "car";
    }

    if (context.transport_category === "air") {
      return "flight";
    }

    if (context.transport_category === "bus") {
      return "bus";
    }

    if (context.transport_category === "ai_decide") {
      return "ai_decide";
    }
  }

  const value = (mode || "").toLowerCase();

  if (value.includes("flight") || value.includes("air") || value.includes("plane")) {
    return "flight";
  }

  if (value.includes("bus")) {
    return "bus";
  }

  if (
    value.includes("car") ||
    value.includes("road") ||
    value.includes("drive") ||
    value.includes("private") ||
    value.includes("vehicle")
  ) {
    return "car";
  }

  if (value.includes("ai") && value.includes("decide")) {
    return "ai_decide";
  }

  return "other";
}

function ensureArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function safeValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "Unknown" ||
    value === "Unavailable"
  ) {
    return "Unavailable";
  }

  return value;
}

function formatDistance(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "Unknown" ||
    value === "Unavailable"
  ) {
    return "Unavailable";
  }

  if (typeof value === "number") {
    return `${value.toLocaleString()} km`;
  }

  const text = String(value);

  if (text.toLowerCase().includes("km")) {
    return text;
  }

  const numeric = Number(text.replace(/,/g, ""));

  if (!Number.isNaN(numeric)) {
    return `${numeric.toLocaleString()} km`;
  }

  return text;
}

function formatPKR(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "Unknown" ||
    value === "Unavailable"
  ) {
    return "Unavailable";
  }

  if (typeof value === "number") {
    return `PKR ${value.toLocaleString()}`;
  }

  const text = String(value).trim();

  if (text.toLowerCase().includes("unavailable")) return "Unavailable";
  if (text.toLowerCase().includes("unknown")) return "Unavailable";
  if (text.toLowerCase() === "n/a") return "Unavailable";
  if (text.toLowerCase().includes("pkr")) return text;

  const numeric = Number(text.replace(/,/g, ""));

  if (!Number.isNaN(numeric)) {
    return `PKR ${numeric.toLocaleString()}`;
  }

  return text;
}

function formatFlightTime(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "Unknown" ||
    value === "Unavailable"
  ) {
    return "Unavailable";
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  const hours = Math.floor(numeric / 60);
  const minutes = numeric % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function formatStops(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "Unknown" ||
    value === "Unavailable"
  ) {
    return "Unavailable";
  }

  const numeric = Number(value);

  if (!Number.isNaN(numeric)) {
    if (numeric === 0) return "Direct";
    if (numeric === 1) return "1 stop";
    return `${numeric} stops`;
  }

  return String(value);
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function getInterests(interests) {
  if (!interests) return [];

  if (Array.isArray(interests)) {
    return interests.filter(Boolean);
  }

  return interests
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);
}

function getForecastItems(weatherSummary) {
  if (!weatherSummary) return [];

  return weatherSummary
    .split("\n")
    .filter((line) => line.includes(":"))
    .slice(1)
    .map((forecast) => {
      const parts = forecast.split(": ");
      const dateTime = parts[0];
      const weather = parts.slice(1).join(": ");

      const date = new Date(dateTime);
      const condition = weather?.toLowerCase() || "";

      return {
        date: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        time: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        weather,
        icon: getWeatherIcon(condition),
      };
    });
}

function getWeatherIcon(condition) {
  if (condition.includes("rain")) return "🌧";
  if (condition.includes("cloud")) return "☁️";
  if (condition.includes("clear")) return "☀️";
  if (condition.includes("snow")) return "❄️";
  if (condition.includes("storm")) return "⛈";
  return "🌤";
}

export default TripDetail;
  