import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import { useToast } from "../context/ToastContext";

function EditProfile() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    gender: "",
    age: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await API.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setForm({
          username: res.data.username || "",
          gender: res.data.gender || "",
          age: res.data.age || "",
        });
      } catch (err) {
        console.log(err);
        showToast("Unable to load profile.", "error");
      }
    };

    fetchProfile();
  }, [showToast]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.username.trim()) {
      showToast("Username is required.", "error");
      return false;
    }

    if (!form.gender) {
      showToast("Please select your gender.", "error");
      return false;
    }

    if (Number(form.age) < 1) {
      showToast("Please enter a valid age.", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    showToast("Updating profile...", "info");

    const token = localStorage.getItem("token");

    try {
      await API.put(
        "/me",
        {
          username: form.username.trim(),
          gender: form.gender,
          age: Number(form.age),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showToast("Profile updated successfully.", "success");

      setTimeout(() => {
        navigate("/profile");
      }, 900);
    } catch (err) {
      console.log(err);

      const errorMessage =
        err.response?.data?.detail || "Unable to update profile.";

      showToast(errorMessage, "error");
      setLoading(false);
    }
  };

  return (
    <div className="luxury-page">
      <Sidebar />

      <main className="luxury-main">
        <div className="hero-content">
          <h1>Edit Profile ✦</h1>
          <p>
            Update your traveler profile for more personalized AI itineraries.
          </p>
        </div>

        <form className="glass-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="field">
            <label>Age</label>
            <input
              name="age"
              type="number"
              min="1"
              value={form.age}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="gold-btn" disabled={loading}>
            {loading ? "Saving..." : "Save Changes →"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default EditProfile;