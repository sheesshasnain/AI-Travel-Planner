import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("token");

      try {
        const userRes = await API.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const tripsRes = await API.get("/my-trips", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(userRes.data);
        setTrips(tripsRes.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchDashboard();
  }, []);

  const toggleTheme = () => {
    document.body.style.opacity = "0.96";

    setTimeout(() => {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"));

      requestAnimationFrame(() => {
        document.body.style.opacity = "1";
      });
    }, 120);
  };

  const recentTrips = trips.slice(-3).reverse();

  return (
    <div className="luxury-page">
      <Sidebar />

      <motion.main
        className="luxury-main dashboard-main"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="top-bar">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "🥂 Champagne" : "🌙 Dark"}
          </button>
        </div>

        <motion.section
          className="dashboard-hero"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <p className="profile-label">AI Travel Concierge</p>

            <h1>
              Welcome back,
              <br />
              {user?.username || "Traveler"} ✦
            </h1>

            <p>
              Plan weather-aware, personalized luxury trips powered by AI.
            </p>

            <div className="dashboard-actions">
              <button onClick={() => navigate("/create-trip")}>
                Create New Journey
              </button>

              <button
                className="outline-btn"
                onClick={() => navigate("/my-trips")}
              >
                View My Trips
              </button>
            </div>
          </div>
        </motion.section>

        <section className="dashboard-stats">
          {[
            ["Total Trips", trips.length],
            ["AI Personalization", "Active"],
            ["Traveler Profile", user?.age ? `${user.age} yrs` : "Ready"],
            ["Preferred Style", trips[0]?.travel_style || "Explore"],
          ].map(([label, value]) => (
            <motion.div
              className="dash-stat-card"
              key={label}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </motion.div>
          ))}
        </section>

        <section className="dashboard-grid">
          <motion.div
            className="dashboard-panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="section-header">
              <p className="profile-label">Quick Actions</p>
              <h2>Start Planning</h2>
            </div>

            <div className="quick-actions">
              <button onClick={() => navigate("/create-trip")}>
                ✈ Generate Itinerary
              </button>

              <button onClick={() => navigate("/profile")}>
                👤 Edit Travel Profile
              </button>

              <button onClick={() => navigate("/my-trips")}>
                📍 Manage Journeys
              </button>
            </div>
          </motion.div>

          <motion.div
            className="dashboard-panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="section-header">
              <p className="profile-label">Recent Journeys</p>
              <h2>Your Latest Trips</h2>
            </div>

            {recentTrips.length === 0 ? (
              <div className="empty-state">
                <h3>No trips yet</h3>
                <p>Create your first AI-powered journey.</p>
              </div>
            ) : (
              <div className="recent-trip-list">
                {recentTrips.map((trip) => (
                  <div
                    className="recent-trip-item"
                    key={trip.id}
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  >
                    <div>
                      <h3>{trip.destination}</h3>
                      <p>
                        {trip.start_date} → {trip.end_date}
                      </p>
                    </div>

                    <span>{trip.travel_style}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      </motion.main>
    </div>
  );
}

export default Dashboard;