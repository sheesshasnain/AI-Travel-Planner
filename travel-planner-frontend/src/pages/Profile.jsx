import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import { useToast } from "../context/ToastContext";

function Profile() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [tripCount, setTripCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await API.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const tripsRes = await API.get("/my-trips", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        setTripCount(tripsRes.data.length);
      } catch (err) {
        console.log(err);
        showToast("Unable to load profile.", "error");
      }
    };

    fetchProfile();
  }, [showToast]);

  if (!user) {
    return (
      <div className="luxury-page">
        <Sidebar />
        <main className="luxury-main">
          <div className="page">Loading profile...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="luxury-page">
      <Sidebar />

      <main className="luxury-main">
        <div className="hero-content">
          <h1>Traveler Profile ✦</h1>
          <p>
            Your personal travel details used to craft smarter AI itineraries.
          </p>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            {user.username?.charAt(0).toUpperCase()}
          </div>

          <p className="profile-label">Premium Traveler</p>
          <h2>{user.username}</h2>
          <p className="profile-email">{user.email}</p>

          <div className="profile-stats">
            <ProfileStat label="Age" value={user.age || "Not set"} />
            <ProfileStat label="Gender" value={user.gender || "Not set"} />
            <ProfileStat label="Trips Created" value={tripCount} />
            <ProfileStat label="AI Personalization" value="Active" />
          </div>

          <button
            className="gold-btn"
            onClick={() => navigate("/edit-profile")}
          >
            Edit Profile
          </button>
        </div>
      </main>
    </div>
  );
}

function ProfileStat({ label, value }) {
  return (
    <div className="profile-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default Profile;