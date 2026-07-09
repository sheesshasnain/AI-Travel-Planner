import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function EditTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  const journeyTitles = {
    Solo: "🌍 Solo Explorer",
    Couple: "❤️ Romantic Escape",
    Family: "👨‍👩‍👧 Family Vacation",
    Friends: "🎉 Friends Adventure",
    Business: "💼 Business Journey",
  };

  const journeyTitle = journeyTitles[form.trip_type] || "✨ Smart Journey";

  useEffect(() => {
    const fetchTrip = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        showToast("Please login first.", "error");
        navigate("/login");
        return;
      }

      try {
        const res = await API.get(`/trips/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const trip = res.data;

        const tripType = trip.trip_type || "";

        setForm({
          origin: trip.origin || "",
          destination: trip.destination || "",
          start_date: trip.start_date?.slice(0, 10) || "",
          end_date: trip.end_date?.slice(0, 10) || "",
          budget: trip.budget || "",
          people: tripType === "Solo" ? "1" : trip.people || "",
          travel_style: trip.travel_style || "",
          transport_mode: trip.transport_mode || "",
          trip_type: tripType,
          hotel_preference: trip.hotel_preference || "",
          pace: trip.pace || "",
          interests: Array.isArray(trip.interests)
            ? trip.interests
            : typeof trip.interests === "string"
            ? trip.interests
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
        });
      } catch (err) {
        console.log(err);
        showToast("Unable to load trip.", "error");
      } finally {
        setFetching(false);
      }
    };

    fetchTrip();
  }, [id, navigate, showToast]);

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
    showToast("Updating your itinerary...", "info");

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
      await API.put(`/trips/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showToast("Trip updated successfully!", "success");

      setTimeout(() => {
        navigate("/my-trips");
      }, 1000);
    } catch (err) {
      console.log(err);

      showToast(
        err.response?.data?.detail || "Unable to update trip.",
        "error"
      );

      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="luxury-page">
        <Sidebar />

        <main className="luxury-main planner-main">
          <div className="hero-content">
            <h1>Loading Journey...</h1>
            <p>Please wait while we load your trip details.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="luxury-page">
      <Sidebar />

      <main className="luxury-main planner-main">
        <div className="hero-content">
          <h1>Edit Journey ✦</h1>
          <p>Refine your travel plan and update your AI itinerary.</p>
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
              {loading ? "Updating..." : "Update Journey →"}
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
                    ? "Updating your personalized itinerary..."
                    : "Ready to update your journey."}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default EditTrip;