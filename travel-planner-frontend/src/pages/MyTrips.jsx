import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api";
import Sidebar from "../components/Sidebar";
import { useToast } from "../context/ToastContext";

function MyTrips() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const fetchTrips = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await API.get("/my-trips", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTrips(res.data);
      } catch (err) {
        console.log(err);
        showToast("Unable to load your trips.", "error");
      }
    };

    fetchTrips();
  }, [showToast]);

  const deleteTrip = async (tripId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this trip?"
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    showToast("Deleting trip...", "info");

    try {
      await API.delete(`/trips/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTrips((prevTrips) =>
        prevTrips.filter((trip) => trip.id !== tripId)
      );

      showToast("Trip deleted successfully.", "success");
    } catch (err) {
      console.log(err);

      const errorMessage =
        err.response?.data?.detail ||
        "Unable to delete trip. Please try again.";

      showToast(errorMessage, "error");
    }
  };

  return (
    <div className="luxury-page">
      <Sidebar />

      <main className="luxury-main">
        <div className="hero-content">
          <h1>My Journeys ✦</h1>
          <p>Your saved AI-crafted travel experiences.</p>
        </div>

        <div className="trips-grid">
          {trips.length === 0 ? (
            <div className="trip-card">
              <h2>No trips yet</h2>
              <p>Create your first luxury AI itinerary.</p>

              <button onClick={() => navigate("/create-trip")}>
                Create Trip
              </button>
            </div>
          ) : (
            trips.map((trip) => (
              <motion.div
                className="trip-card"
                key={trip.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
                transition={{
                  duration: 0.35,
                }}
              >
                <img
                  className="trip-image"
                  src={
                    trip.image_url ||
                    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
                  }
                  alt={trip.destination}
                />

                <h2>{trip.destination}</h2>

                <p>{trip.start_date} → {trip.end_date}</p>

                <p>
                  {Number(trip.budget).toLocaleString()} PKR • {trip.people} travelers
                </p>

                <p>{trip.travel_style}</p>

                <div className="trip-actions">
                  <button onClick={() => navigate(`/trips/${trip.id}`)}>
                    👁 View
                  </button>

                  <button
                    className="edit-btn"
                    onClick={() => navigate(`/edit-trip/${trip.id}`)}
                  >
                    ✏ Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteTrip(trip.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default MyTrips;