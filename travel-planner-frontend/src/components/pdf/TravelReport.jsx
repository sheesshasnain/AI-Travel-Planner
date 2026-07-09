import "../../styles/components/travelReport.css";

function TravelReport({
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

  return (
    <div id="travel-report-pdf" className="travel-report">
      <section className="report-cover">
        <div className="report-cover-image">
          <img
            src={
              trip.image_url ||
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
            }
            alt={trip.destination}
          />
        </div>

        <div className="report-cover-content">
          <p className="report-kicker">AI Travel Planner</p>
          <h1>{trip.destination}</h1>
          <p className="report-subtitle">Personalized Travel Itinerary</p>

          <div className="report-route">
            <span>{trip.origin || "Origin"}</span>
            <strong>→</strong>
            <span>{trip.destination}</span>
          </div>

          <p className="report-date">
            {trip.start_date} to {trip.end_date}
          </p>
        </div>
      </section>

      <section className="report-section">
        <div className="report-section-title">
          <span>01</span>
          <h2>Trip Overview</h2>
        </div>

        <div className="report-grid">
          <ReportStat label="Budget" value={formatPKR(trip.budget)} />
          <ReportStat label="Travelers" value={trip.people} />
          <ReportStat label="Travel Style" value={trip.travel_style} />
          <ReportStat label="Transport" value={trip.transport_mode} />
          <ReportStat label="Trip Type" value={trip.trip_type} />
          <ReportStat label="Hotel" value={trip.hotel_preference} />
          <ReportStat label="Pace" value={trip.pace} />
          <ReportStat
            label="Interests"
            value={interests?.length ? interests.join(", ") : "Not specified"}
          />
        </div>

        {itinerary.summary && (
          <div className="report-summary-box">
            <h3>AI Summary</h3>
            <p>{itinerary.summary}</p>
          </div>
        )}
      </section>

      {budgetStatus && (
        <section className="report-section">
          <div className="report-section-title">
            <span>02</span>
            <h2>Budget Reality Check</h2>
          </div>

          <div className="report-grid">
            <ReportStat
              label="User Budget"
              value={formatPKR(budgetStatus.user_budget || trip.budget)}
            />
            <ReportStat
              label="Estimated Required"
              value={formatPKR(
                budgetStatus.estimated_required_budget ||
                  itinerary.estimated_total_budget
              )}
            />
            <ReportStat
              label="Status"
              value={toBoolean(budgetStatus.is_budget_enough) ? "Enough" : "Over Budget"}
            />
            <ReportStat
              label="Shortfall"
              value={formatPKR(budgetStatus.shortfall || "PKR 0")}
            />
          </div>

          {budgetStatus.message && (
            <p className="report-note">{budgetStatus.message}</p>
          )}
        </section>
      )}

      <section className="report-section">
        <div className="report-section-title">
          <span>03</span>
          <h2>{isFlightTrip ? "Flight Details" : "Route Details"}</h2>
        </div>

        <div className="report-grid">
          <ReportStat
            label={isFlightTrip ? "Road Distance Reference" : "One-Way Distance"}
            value={formatDistance(costContext?.road_distance_one_way)}
          />

          {(isCarTrip || isAiDecide) && (
            <>
              <ReportStat
                label="Round Trip Distance"
                value={formatDistance(costContext?.road_distance_round_trip)}
              />
              <ReportStat
                label="Road Time"
                value={safeValue(costContext?.road_travel_time_one_way)}
              />
              <ReportStat
                label="Petrol Round Trip"
                value={formatPKR(costContext?.petrol_cost_round_trip)}
              />
              <ReportStat
                label="Toll / Tax"
                value={formatPKR(costContext?.toll_tax_round_trip)}
              />
            </>
          )}

          {(isFlightTrip || isAiDecide) && (
            <>
              <ReportStat
                label="Flight Time"
                value={formatFlightTime(costContext?.flight_duration_minutes)}
              />
              <ReportStat
                label="Ticket / Person"
                value={formatPKR(costContext?.flight_price_per_person)}
              />
              <ReportStat
                label="Flight Total"
                value={formatPKR(costContext?.flight_total_estimate)}
              />
              <ReportStat
                label="Airline"
                value={safeValue(costContext?.flight_airline)}
              />
              <ReportStat
                label="Flight No."
                value={safeValue(costContext?.flight_number)}
              />
              <ReportStat
                label="Stops"
                value={formatStops(costContext?.flight_stops)}
              />
            </>
          )}

          {!isCarTrip && (
            <ReportStat
              label="Local Transport"
              value={formatPKR(costContext?.local_transport_estimate)}
            />
          )}

          <ReportStat
            label="Transport Total"
            value={formatPKR(costContext?.backend_transport_total)}
          />
          <ReportStat
            label="Hotel Estimate"
            value={formatPKR(costContext?.hotel_estimate)}
          />
        </div>

        {costContext?.route_note && (
          <p className="report-note">{costContext.route_note}</p>
        )}
      </section>

      <section className="report-section">
        <div className="report-section-title">
          <span>04</span>
          <h2>Weather Snapshot</h2>
        </div>

        <div className="report-grid">
          <ReportStat label="Condition" value={trip.weather_condition || "Unavailable"} />
          <ReportStat
            label="Temperature"
            value={
              trip.temperature !== null && trip.temperature !== undefined
                ? `${trip.temperature}°C`
                : "N/A"
            }
          />
          <ReportStat
            label="Humidity"
            value={
              trip.humidity !== null && trip.humidity !== undefined
                ? `${trip.humidity}%`
                : "N/A"
            }
          />
          <ReportStat
            label="Wind"
            value={
              trip.wind_speed !== null && trip.wind_speed !== undefined
                ? `${trip.wind_speed} m/s`
                : "N/A"
            }
          />
        </div>

        {forecastItems?.length > 0 && (
          <div className="report-forecast">
            {forecastItems.slice(0, 6).map((forecast, index) => (
              <div className="report-forecast-card" key={index}>
                <strong>{forecast.date}</strong>
                <span>{forecast.time}</span>
                <p>{forecast.weather}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="report-section page-break">
        <div className="report-section-title">
          <span>05</span>
          <h2>Day-wise Itinerary</h2>
        </div>

        <div className="report-days">
          {ensureArray(itinerary.days).map((day, index) => (
            <div className="report-day-card" key={day.day || index}>
              <div className="report-day-header">
                <span>Day {day.day || index + 1}</span>
                <strong>{day.location_focus || trip.destination}</strong>
              </div>

              <ReportTimeline title="Morning" text={day.morning} />
              <ReportTimeline title="Afternoon" text={day.afternoon} />
              <ReportTimeline title="Evening" text={day.evening} />
              <ReportTimeline title="Night" text={day.night} />

              {day.estimated_day_cost && (
                <p className="report-day-cost">
                  Estimated Day Cost: <strong>{formatPKR(day.estimated_day_cost)}</strong>
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <div className="report-section-title">
          <span>06</span>
          <h2>Recommendations</h2>
        </div>

        <div className="report-columns">
          <ReportList title="Food Suggestions" items={itinerary.food_suggestions} />
          <ReportList title="Transport Tips" items={itinerary.transport_suggestions} />
          <ReportList title="Hotel Suggestions" items={itinerary.hotel_suggestions} />
          <ReportList title="Packing Tips" items={itinerary.packing_tips} />
          <ReportList title="Safety Tips" items={itinerary.safety_tips} />
        </div>
      </section>

      <section className="report-section">
        <div className="report-section-title">
          <span>07</span>
          <h2>Budget Breakdown</h2>
        </div>

        <div className="report-budget">
          <ReportBudgetRow label="Hotel" value={itinerary.budget_breakdown?.hotel} />
          <ReportBudgetRow label="Food" value={itinerary.budget_breakdown?.food} />
          <ReportBudgetRow label="Transport" value={itinerary.budget_breakdown?.transport} />

          {(isCarTrip || isAiDecide) && (
            <>
              <ReportBudgetRow label="Petrol" value={itinerary.budget_breakdown?.petrol} />
              <ReportBudgetRow label="Toll / Tax" value={itinerary.budget_breakdown?.toll_tax} />
            </>
          )}

          {(isFlightTrip || isAiDecide) && (
            <ReportBudgetRow label="Flight" value={itinerary.budget_breakdown?.flight} />
          )}

          {!isCarTrip && (
            <ReportBudgetRow
              label="Local Transport"
              value={itinerary.budget_breakdown?.local_transport}
            />
          )}

          <ReportBudgetRow label="Activities" value={itinerary.budget_breakdown?.activities} />
          <ReportBudgetRow
            label="Emergency Buffer"
            value={itinerary.budget_breakdown?.emergency_buffer}
          />

          <div className="report-budget-total">
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
      </section>

      <footer className="report-footer">
        <strong>Generated by AI Travel Planner</strong>
        <span>Personalized itinerary report</span>
      </footer>
    </div>
  );
}

function ReportStat({ label, value }) {
  return (
    <div className="report-stat">
      <span>{label}</span>
      <strong>{safeValue(value)}</strong>
    </div>
  );
}

function ReportTimeline({ title, text }) {
  return (
    <div className="report-timeline">
      <span>{title}</span>
      <p>{text || "Not available."}</p>
    </div>
  );
}

function ReportList({ title, items }) {
  const safeItems = ensureArray(items);

  return (
    <div className="report-list">
      <h3>{title}</h3>
      {safeItems.length > 0 ? (
        safeItems.map((item, index) => <p key={index}>• {item}</p>)
      ) : (
        <p>Not available.</p>
      )}
    </div>
  );
}

function ReportBudgetRow({ label, value }) {
  const displayValue = safeValue(value);

  if (displayValue === "Unavailable") return null;

  return (
    <div className="report-budget-row">
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

  if (typeof value === "number") {
    return `${value.toLocaleString()} km`;
  }

  const text = String(value);

  if (text.toLowerCase().includes("km")) return text;

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

export default TravelReport;
