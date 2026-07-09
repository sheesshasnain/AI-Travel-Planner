import "../../styles/components/luxuryTravelReport.css";

function LuxuryTravelReport({
  trip,
  itinerary,
  costContext,
  budgetStatus,
  forecastItems,
  interests,
  transportCategory,
}) {
  if (!trip || !itinerary) return null;

  const isFlightTrip = transportCategory === "flight";
  const isCarTrip = transportCategory === "car";
  const isAiDecide = transportCategory === "ai_decide";
  const showCarDetails = isCarTrip || isAiDecide;
  const showFlightDetails = isFlightTrip || isAiDecide;
  const showLocalTransport = !isCarTrip;
  const days = ensureArray(itinerary.days);
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div id="luxury-travel-report-pdf" className="luxury-report">
      <section className="luxury-page-cover">
        <div className="luxury-cover-image">
          <img
            src={
              trip.image_url ||
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
            }
            alt={trip.destination}
          />
        </div>

        <div className="luxury-cover-overlay"></div>

        <div className="luxury-cover-content">
          <p className="luxury-small-title">AI Travel Planner</p>
          <h1>{trip.destination}</h1>
          <p className="luxury-cover-subtitle">Personalized Luxury Journey</p>

          <div className="luxury-cover-route">
            <span>{trip.origin || "Origin"}</span>
            <b>→</b>
            <span>{trip.destination}</span>
          </div>

          <p className="luxury-cover-date">
            {trip.start_date} — {trip.end_date}
          </p>

          <div className="luxury-prepared">
            <span>Prepared Exclusively For</span>
            <strong>{trip.username || "Valued Traveler"}</strong>
            <small>Generated on {generatedDate}</small>
          </div>
        </div>
      </section>

      <LuxuryPage page="01" title="Executive Summary">
        <div className="luxury-two-column">
          <div>
            <p className="luxury-section-kicker">Journey Overview</p>
            <h2>{trip.destination} Travel Plan</h2>
            <p className="luxury-paragraph">
              {itinerary.summary ||
                "A personalized itinerary created according to your travel preferences, budget, weather, and route context."}
            </p>
          </div>

          <div className="luxury-mini-grid">
            <LuxuryStat label="Budget" value={formatPKR(trip.budget)} />
            <LuxuryStat label="Travelers" value={trip.people} />
            <LuxuryStat label="Duration" value={`${days.length || "-"} Days`} />
            <LuxuryStat label="Transport" value={trip.transport_mode} />
            <LuxuryStat label="Hotel" value={trip.hotel_preference} />
            <LuxuryStat label="Pace" value={trip.pace} />
          </div>
        </div>

        {interests?.length > 0 && (
          <div className="luxury-tags">
            {interests.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
      </LuxuryPage>

      {budgetStatus && (
        <LuxuryPage page="02" title="Budget Reality Check">
          <div className="luxury-budget-hero">
            <div>
              <span>User Budget</span>
              <strong>{formatPKR(budgetStatus.user_budget || trip.budget)}</strong>
            </div>
            <div>
              <span>Estimated Required</span>
              <strong>
                {formatPKR(
                  budgetStatus.estimated_required_budget ||
                    itinerary.estimated_total_budget
                )}
              </strong>
            </div>
            <div>
              <span>Shortfall</span>
              <strong>{formatPKR(budgetStatus.shortfall || "PKR 0")}</strong>
            </div>
          </div>

          <div className="luxury-note">
            <strong>
              {toBoolean(budgetStatus.is_budget_enough)
                ? "Budget Status: Manageable"
                : "Budget Status: Needs Adjustment"}
            </strong>
            <p>
              {budgetStatus.message ||
                "Budget status was calculated using backend travel estimates and AI-generated planning costs."}
            </p>
          </div>
        </LuxuryPage>
      )}

      <LuxuryPage page="03" title={isFlightTrip ? "Flight Experience" : isCarTrip ? "Road Journey" : "Travel Experience"}>
        <div className="luxury-route-panel">
          <div className="luxury-location">
            <span>From</span>
            <strong>{trip.origin || "Origin"}</strong>
          </div>

          <div className="luxury-route-line">{isFlightTrip ? "✈" : isCarTrip ? "🚗" : "✦"}</div>

          <div className="luxury-location">
            <span>To</span>
            <strong>{trip.destination}</strong>
          </div>
        </div>

        <div className="luxury-mini-grid">
          <LuxuryStat
            label={isFlightTrip ? "Road Distance Reference" : "One-Way Distance"}
            value={formatDistance(costContext?.road_distance_one_way)}
          />

          {showCarDetails && (
            <>
              <LuxuryStat
                label="Round-Trip Distance"
                value={formatDistance(costContext?.road_distance_round_trip)}
              />
              <LuxuryStat
                label="Road Time"
                value={safeValue(costContext?.road_travel_time_one_way)}
              />
              <LuxuryStat
                label="Petrol Round Trip"
                value={formatPKR(costContext?.petrol_cost_round_trip)}
              />
              <LuxuryStat
                label="Toll / Tax"
                value={formatPKR(costContext?.toll_tax_round_trip)}
              />
            </>
          )}

          {showFlightDetails && (
            <>
              <LuxuryStat
                label="Flight Time"
                value={formatFlightTime(costContext?.flight_duration_minutes)}
              />
              <LuxuryStat
                label="Ticket / Person"
                value={formatPKR(costContext?.flight_price_per_person)}
              />
              <LuxuryStat
                label="Flight Total"
                value={formatPKR(costContext?.flight_total_estimate)}
              />
              <LuxuryStat label="Airline" value={safeValue(costContext?.flight_airline)} />
              <LuxuryStat label="Flight No." value={safeValue(costContext?.flight_number)} />
              <LuxuryStat label="Stops" value={formatStops(costContext?.flight_stops)} />
            </>
          )}

          {showLocalTransport && (
            <LuxuryStat
              label="Local Transport"
              value={formatPKR(costContext?.local_transport_estimate)}
            />
          )}

          <LuxuryStat
            label="Transport Total"
            value={formatPKR(costContext?.backend_transport_total)}
          />
          <LuxuryStat label="Hotel Estimate" value={formatPKR(costContext?.hotel_estimate)} />
        </div>

        {costContext?.route_note && <p className="luxury-footnote">{costContext.route_note}</p>}
      </LuxuryPage>

      <LuxuryPage page="04" title="Weather & Comfort">
        <div className="luxury-weather-card">
          <div className="luxury-weather-main">
            <span>☀</span>
            <strong>
              {trip.temperature !== null && trip.temperature !== undefined
                ? `${trip.temperature}°C`
                : "N/A"}
            </strong>
            <p>{trip.weather_condition || "Weather unavailable"}</p>
          </div>

          <div className="luxury-weather-side">
            <LuxuryStat
              label="Humidity"
              value={
                trip.humidity !== null && trip.humidity !== undefined
                  ? `${trip.humidity}%`
                  : "N/A"
              }
            />
            <LuxuryStat
              label="Wind"
              value={
                trip.wind_speed !== null && trip.wind_speed !== undefined
                  ? `${trip.wind_speed} m/s`
                  : "N/A"
              }
            />
          </div>
        </div>

        {forecastItems?.length > 0 && (
          <div className="luxury-forecast-grid">
            {forecastItems.slice(0, 6).map((forecast, index) => (
              <div className="luxury-forecast-item" key={index}>
                <strong>{forecast.date}</strong>
                <span>{forecast.time}</span>
                <p>{forecast.weather}</p>
              </div>
            ))}
          </div>
        )}
      </LuxuryPage>

      {days.map((day, index) => (
        <LuxuryPage
          key={day.day || index}
          page={String(index + 5).padStart(2, "0")}
          title={`Day ${day.day || index + 1}`}
          subtitle={day.location_focus || trip.destination}
        >
          <div className="luxury-day-intro">
            <span>Daily Experience</span>
            <h2>{day.location_focus || trip.destination}</h2>
          </div>

          <div className="luxury-timeline">
            <LuxuryTimeline title="Morning" text={day.morning} />
            <LuxuryTimeline title="Afternoon" text={day.afternoon} />
            <LuxuryTimeline title="Evening" text={day.evening} />
            <LuxuryTimeline title="Night" text={day.night} />
          </div>

          {day.estimated_day_cost && (
            <div className="luxury-day-cost">
              <span>Estimated Day Cost</span>
              <strong>{formatPKR(day.estimated_day_cost)}</strong>
            </div>
          )}
        </LuxuryPage>
      ))}

      <LuxuryPage page={String(days.length + 5).padStart(2, "0")} title="Curated Recommendations">
        <div className="luxury-recommend-grid">
          <LuxuryList title="Food Suggestions" items={itinerary.food_suggestions} />
          <LuxuryList title="Transport Tips" items={itinerary.transport_suggestions} />
          <LuxuryList title="Hotel Suggestions" items={itinerary.hotel_suggestions} />
          <LuxuryList title="Packing Essentials" items={itinerary.packing_tips} />
          <LuxuryList title="Safety Notes" items={itinerary.safety_tips} />
        </div>
      </LuxuryPage>

      <LuxuryPage page={String(days.length + 6).padStart(2, "0")} title="Budget Invoice">
        <div className="luxury-invoice">
          <LuxuryBudgetRow label="Hotel" value={itinerary.budget_breakdown?.hotel} />
          <LuxuryBudgetRow label="Food" value={itinerary.budget_breakdown?.food} />
          <LuxuryBudgetRow label="Transport" value={itinerary.budget_breakdown?.transport} />

          {showCarDetails && (
            <>
              <LuxuryBudgetRow label="Petrol" value={itinerary.budget_breakdown?.petrol} />
              <LuxuryBudgetRow label="Toll / Tax" value={itinerary.budget_breakdown?.toll_tax} />
            </>
          )}

          {showFlightDetails && (
            <LuxuryBudgetRow label="Flight" value={itinerary.budget_breakdown?.flight} />
          )}

          {showLocalTransport && (
            <LuxuryBudgetRow
              label="Local Transport"
              value={itinerary.budget_breakdown?.local_transport}
            />
          )}

          <LuxuryBudgetRow label="Activities" value={itinerary.budget_breakdown?.activities} />
          <LuxuryBudgetRow
            label="Emergency Buffer"
            value={itinerary.budget_breakdown?.emergency_buffer}
          />

          <div className="luxury-invoice-total">
            <span>Total Estimated Cost</span>
            <strong>
              {formatPKR(
                itinerary.estimated_total_budget ||
                  itinerary.budget_breakdown?.total ||
                  budgetStatus?.estimated_required_budget
              )}
            </strong>
          </div>
        </div>
      </LuxuryPage>

      <section className="luxury-thankyou-page">
        <div>
          <p className="luxury-small-title">AI Travel Planner</p>
          <h1>Safe Travels</h1>
          <p>
            We hope this journey creates unforgettable memories and a seamless travel experience.
          </p>
          <span>Generated with care for your next adventure.</span>
        </div>
      </section>
    </div>
  );
}

function LuxuryPage({ page, title, subtitle, children }) {
  return (
    <section className="luxury-report-page">
      <header className="luxury-page-header">
        <span>{page}</span>
        <div>
          <p>Luxury Itinerary</p>
          <h1>{title}</h1>
          {subtitle && <strong>{subtitle}</strong>}
        </div>
      </header>

      <main>{children}</main>

      <footer className="luxury-page-footer">
        <span>AI Travel Planner</span>
        <b>{page}</b>
      </footer>
    </section>
  );
}

function LuxuryStat({ label, value }) {
  return (
    <div className="luxury-stat">
      <span>{label}</span>
      <strong>{safeValue(value)}</strong>
    </div>
  );
}

function LuxuryTimeline({ title, text }) {
  return (
    <div className="luxury-timeline-item">
      <span>{title}</span>
      <p>{text || "Not available."}</p>
    </div>
  );
}

function LuxuryList({ title, items }) {
  const safeItems = ensureArray(items);

  return (
    <div className="luxury-list">
      <h3>{title}</h3>
      {safeItems.length > 0 ? (
        safeItems.map((item, index) => <p key={index}>✦ {item}</p>)
      ) : (
        <p>Not available.</p>
      )}
    </div>
  );
}

function LuxuryBudgetRow({ label, value }) {
  const displayValue = safeValue(value);
  if (displayValue === "Unavailable") return null;

  return (
    <div className="luxury-budget-row">
      <span>{label}</span>
      <strong>{displayValue}</strong>
    </div>
  );
}

function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

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

  if (typeof value === "number") return `${value.toLocaleString()} km`;

  const text = String(value);
  if (text.toLowerCase().includes("km")) return text;

  const numeric = Number(text.replace(/,/g, ""));
  if (!Number.isNaN(numeric)) return `${numeric.toLocaleString()} km`;

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

  if (typeof value === "number") return `PKR ${value.toLocaleString()}`;

  const text = String(value).trim();

  if (text.toLowerCase().includes("unavailable")) return "Unavailable";
  if (text.toLowerCase().includes("unknown")) return "Unavailable";
  if (text.toLowerCase() === "n/a") return "Unavailable";
  if (text.toLowerCase().includes("pkr")) return text;

  const numeric = Number(text.replace(/,/g, ""));
  if (!Number.isNaN(numeric)) return `PKR ${numeric.toLocaleString()}`;

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
  if (Number.isNaN(numeric)) return String(value);

  const hours = Math.floor(numeric / 60);
  const minutes = numeric % 60;

  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;

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

export default LuxuryTravelReport;
