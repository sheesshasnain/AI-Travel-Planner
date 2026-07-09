import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import SelectionGrid from "../components/SelectionGrid";
import { useToast } from "../context/ToastContext";
import {
  travelStyles,
  transportModes,
  tripTypes,
  hotelPreferences,
  travelPaces,
} from "../constants/plannerOptions";

const interestOptions = [
  "🏔 Mountains",
  "🍜 Food",
  "📷 Photography",
  "🏖 Beach",
  "🥾 Hiking",
  "🕌 Culture",
  "🛍 Shopping",
  "🌲 Nature",
  "🏛 History",
  "🎨 Art",
];

function CreateTrip() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [routePreview, setRoutePreview] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const [form, setForm] = useState({
    origin: "",
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
    people: "",
    travel_style: "",
    transport_mode: "",
    trip_type: "",
    hotel_preference: "",
    pace: "",
    interests: [],
  });

  const transportCategory = getTransportCategory(form.transport_mode);

  const journeyTitles = {
    Solo: "🌍 Solo Explorer",
    Couple: "❤️ Romantic Escape",
    Family: "👨‍👩‍👧 Family Vacation",
    Friends: "🎉 Friends Adventure",
    Business: "💼 Business Journey",
  };

  const journeyTitle = journeyTitles[form.trip_type] || "✨ Smart Journey";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === "trip_type" && value === "Solo") {
        return {
          ...prev,
          trip_type: value,
          people: "1",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const toggleInterest = (interest) => {
    const cleanInterest = interest.replace(/^[^\w]+ /, "");

    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(cleanInterest)
        ? prev.interests.filter((item) => item !== cleanInterest)
        : [...prev.interests, cleanInterest],
    }));
  };

  useEffect(() => {
    const origin = form.origin.trim();
    const destination = form.destination.trim();

    if (origin.length < 2 || destination.length < 2) {
      setRoutePreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setRouteLoading(true);

        /*
          Important:
          This preview should NOT call SerpApi while user is typing.
          It is only for road distance/cost preview through /route-preview.
          Real flight price should be fetched only on Generate Trip.
        */
        const response = await API.get("/route-preview", {
          params: {
            origin,
            destination,
            start_date: form.start_date || undefined,
            end_date: form.end_date || undefined,
            people: Number(form.people) || 1,
            transport_mode: form.transport_mode || "Car",
            hotel_preference: form.hotel_preference || "standard",
          },
        });

        setRoutePreview(response.data);
      } catch (err) {
        console.log("Route preview error:", err);
        setRoutePreview(null);
      } finally {
        setRouteLoading(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [
    form.origin,
    form.destination,
    form.start_date,
    form.end_date,
    form.people,
    form.transport_mode,
    form.hotel_preference,
  ]);

  const validateForm = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);

    if (!form.origin.trim()) {
      showToast("Please enter starting location.", "error");
      return false;
    }

    if (!form.destination.trim()) {
      showToast("Please enter destination.", "error");
      return false;
    }

    if (!form.start_date || !form.end_date) {
      showToast("Please select travel dates.", "error");
      return false;
    }

    if (startDate < today) {
      showToast("Start date cannot be in the past.", "error");
      return false;
    }

    if (endDate < startDate) {
      showToast("End date cannot be before start date.", "error");
      return false;
    }

    if (Number(form.budget) <= 0) {
      showToast("Budget must be greater than 0.", "error");
      return false;
    }

    if (Number(form.people) < 1) {
      showToast("Travelers must be at least 1.", "error");
      return false;
    }

    if (!form.travel_style) {
      showToast("Please select travel style.", "error");
      return false;
    }

    if (!form.transport_mode) {
      showToast("Please select transport mode.", "error");
      return false;
    }

    if (!form.trip_type) {
      showToast("Please select trip type.", "error");
      return false;
    }

    if (form.trip_type === "Solo" && Number(form.people) !== 1) {
      showToast("Solo trip can only have 1 traveler.", "error");
      return false;
    }

    if (!form.hotel_preference) {
      showToast("Please select hotel preference.", "error");
      return false;
    }

    if (!form.pace) {
      showToast("Please select travel pace.", "error");
      return false;
    }

    if (form.interests.length === 0) {
      showToast("Please select at least one interest.", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const token = localStorage.getItem("token");

    if (!token) {
      showToast("Please login first.", "error");
      navigate("/login");
      return;
    }

    setLoading(true);
    showToast("Generating your AI itinerary...", "info");

    const payload = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      budget: Number(form.budget),
      people: Number(form.people),
      travel_style: form.travel_style,
      transport_mode: form.transport_mode,
      trip_type: form.trip_type,
      hotel_preference: form.hotel_preference,
      pace: form.pace,
      interests: form.interests,
    };

    try {
      /*
        SerpApi should only be called inside /plan-trip
        and only if backend decides transport mode needs flight data.
      */
      const response = await API.post("/plan-trip", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;

      showToast("Your luxury itinerary has been created successfully!", "success");

      setTimeout(() => {
        navigate(`/trips/${data.trip.id}`, {
          state: {
            trip: data.trip,
            routeContext: data.route_context,
          },
        });
      }, 1000);
    } catch (err) {
      console.log(err);
      showToast(
        err.response?.data?.detail || "Unable to create itinerary.",
        "error"
      );
      setLoading(false);
    }
  };

  return (
    <div className="luxury-page">
      <Sidebar />

      <main className="luxury-main planner-main">
        <div className="hero-content">
          <h1>Create Your Journey ✦</h1>
          <p>
            Design a smarter trip with origin-aware budget, transport and AI
            planning.
          </p>
        </div>

        <div className="planner-layout">
          <form className="planner-form" onSubmit={handleSubmit}>
            <section className="planner-section trip-details-card">
              <h2>✈ Trip Details</h2>

              <div className="trip-row">
                <div className="field">
                  <label>📍 Starting From</label>
                  <input
                    name="origin"
                    placeholder="Lahore"
                    value={form.origin}
                    onChange={handleChange}
                  />
                </div>

                <div className="route-divider">→</div>

                <div className="field">
                  <label>📍 Destination</label>
                  <input
                    name="destination"
                    placeholder="Skardu"
                    value={form.destination}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="trip-row simple">
                <div className="field">
                  <label>🗓 Departure</label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label>🗓 Return</label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="trip-row simple">
                <div className="field">
                  <label>👥 Travelers</label>
                  <input
                    type="number"
                    name="people"
                    min="1"
                    placeholder="2"
                    value={form.people}
                    onChange={handleChange}
                    disabled={form.trip_type === "Solo"}
                  />
                </div>

                <div className="field budget-field">
                  <label>💰 Budget</label>

                  <div className="budget-input">
                    <span>PKR</span>

                    <input
                      type="number"
                      name="budget"
                      min="1"
                      placeholder="80000"
                      value={form.budget}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="planner-section">
              <h2>⚙ Travel Preferences</h2>

              <div className="preferences-layout">
                <SelectionGrid
                  title="🧳 Travel Style"
                  name="travel_style"
                  value={form.travel_style}
                  onChange={handleChange}
                  options={travelStyles}
                />

                <SelectionGrid
                  title="🚗 Transport"
                  name="transport_mode"
                  value={form.transport_mode}
                  onChange={handleChange}
                  options={transportModes}
                />

                <SelectionGrid
                  title="❤️ Trip Type"
                  name="trip_type"
                  value={form.trip_type}
                  onChange={handleChange}
                  options={tripTypes}
                />

                <SelectionGrid
                  title="🏨 Hotel"
                  name="hotel_preference"
                  value={form.hotel_preference}
                  onChange={handleChange}
                  options={hotelPreferences}
                />

                <div className="preferences-full">
                  <SelectionGrid
                    title="⚡ Travel Pace"
                    name="pace"
                    value={form.pace}
                    onChange={handleChange}
                    options={travelPaces}
                  />
                </div>
              </div>
            </section>

            <section className="planner-section">
              <h2>✨ Interests</h2>

              <div className="interest-chips">
                {interestOptions.map((interest) => {
                  const cleanInterest = interest.replace(/^[^\w]+ /, "");

                  return (
                    <button
                      type="button"
                      key={interest}
                      className={
                        form.interests.includes(cleanInterest)
                          ? "interest-chip active"
                          : "interest-chip"
                      }
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </section>

            <button type="submit" className="planner-submit" disabled={loading}>
              {loading ? "Generating..." : "✨ Generate AI Journey"}
            </button>
          </form>

          <aside className="planner-preview">
            <p className="profile-label">✨ Live AI Planner</p>

            <h2>{journeyTitle}</h2>

            <div className="preview-route">
              <div>
                <small>FROM</small>
                <h3>{form.origin || "Your City"}</h3>
              </div>

              <div className="route-arrow">↓</div>

              <div>
                <small>TO</small>
                <h3>{form.destination || "Destination"}</h3>
              </div>
            </div>

            <RoutePreviewCard
              routePreview={routePreview}
              routeLoading={routeLoading}
              transportCategory={transportCategory}
            />

            <div className="preview-list">
              <p>
                <span>👥 Travelers</span>
                <strong>{form.people || "-"}</strong>
              </p>

              <p>
                <span>💰 Budget</span>
                <strong>
                  {form.budget
                    ? `${Number(form.budget).toLocaleString()} PKR`
                    : "-"}
                </strong>
              </p>

              <p>
                <span>✈ Transport</span>
                <strong>{form.transport_mode || "-"}</strong>
              </p>

              <p>
                <span>🏨 Hotel</span>
                <strong>{form.hotel_preference || "-"}</strong>
              </p>

              <p>
                <span>⚡ Pace</span>
                <strong>{form.pace || "-"}</strong>
              </p>
            </div>

            <div className="preview-interests">
              <h4>🎯 Interests</h4>

              <div className="preview-chips">
                {form.interests.length === 0 ? (
                  <span className="preview-empty">Select your interests</span>
                ) : (
                  form.interests.map((interest) => (
                    <span key={interest}>{interest}</span>
                  ))
                )}
              </div>
            </div>

            <div className="ai-status">
              <div className="pulse"></div>

              <div>
                <h4>AI Status</h4>
                <p>
                  {loading
                    ? "Building your personalized itinerary..."
                    : "Ready to generate your luxury journey."}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function RoutePreviewCard({ routePreview, routeLoading, transportCategory }) {
  const isFlight = transportCategory === "flight";
  const isCar = transportCategory === "car";
  const isBus = transportCategory === "bus";
  const isAiDecide = transportCategory === "ai_decide";

  return (
    <div className="route-preview-box">
      <h4>{isFlight ? "Flight Preview" : "Route Intelligence"}</h4>

      {routeLoading ? (
        <p className="route-preview-muted">Checking route distance...</p>
      ) : routePreview ? (
        <>
          <PreviewRow
            label={isFlight ? "Road Distance Reference" : "Road Distance"}
            value={formatDistance(routePreview.road_distance_km)}
          />

          {!isFlight && (
            <PreviewRow
              label="Travel Time"
              value={safeValue(routePreview.road_travel_time)}
            />
          )}

          {(isCar || isAiDecide) && (
            <>
              <PreviewRow
                label="Round Trip Distance"
                value={formatDistance(routePreview.round_trip_distance_km)}
              />

              <PreviewRow
                label="Petrol Estimate"
                value={formatPKR(routePreview.estimated_petrol_cost)}
              />

              <PreviewRow
                label="Toll / Tax"
                value={formatPKR(routePreview.toll_cost)}
              />
            </>
          )}

          {isBus && (
            <PreviewRow
              label="Bus Fare"
              value={formatPKR(routePreview.bus_total_estimate)}
            />
          )}

          {isFlight && (
            <>
              <PreviewRow
                label="Flight Price"
                value="After Generate"
              />

              <PreviewRow
                label="Note"
                value="Checked on generation"
              />
            </>
          )}

          {!isCar && (
            <PreviewRow
              label="Local Transport"
              value={formatPKR(routePreview.local_transport_estimate)}
            />
          )}

          <PreviewRow
            label="Transport Total"
            value={formatPKR(routePreview.transport_total_estimate)}
          />
        </>
      ) : (
        <p className="route-preview-muted">
          Enter starting location and destination to preview distance.
        </p>
      )}
    </div>
  );
}

function PreviewRow({ label, value }) {
  if (!value || value === "Unavailable") return null;

  return (
    <p>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function getTransportCategory(mode) {
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

export default CreateTrip;
