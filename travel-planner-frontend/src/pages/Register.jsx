import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useToast } from "../context/ToastContext";
import "../styles/pages/auth.css";

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    gender: "",
    age: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    showToast("Creating your travel profile...", "info");

    try {
      await API.post("/register", {
        ...form,
        age: Number(form.age),
      });

      showToast("Account created successfully!", "success");

      setTimeout(() => {
        navigate("/");
      }, 900);
    } catch (err) {
      console.log(err);

      // Show backend error if available
      const errorMessage =
        err.response?.data?.detail ||
        "Registration failed. Please try again.";

      showToast(errorMessage, "error");

      setLoading(false);
    }
  };

  return (
    <div className="auth-premium-page">
      <div className="auth-overlay"></div>

      <section className="auth-left">
        <p className="auth-kicker">Premium Travel AI</p>

        <h1>
          Create your
          <br />
          travel profile.
        </h1>

        <p>
          Tell us a little about yourself so AI can create safer, smarter, and
          more personalized travel plans.
        </p>

        <div className="auth-features">
          <div>✦ Personalized by age and gender</div>
          <div>✦ Weather-aware recommendations</div>
          <div>✦ Saved luxury journeys</div>
          <div>✦ Smart AI planning</div>
        </div>
      </section>

      <section className="auth-card-premium">
        <div className="auth-logo">✈ LUXE TRAVEL AI</div>

        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Start your personalized travel journey.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              name="username"
              placeholder="Your name"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-row">
            <div className="field">
              <label>Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="field">
              <label>Age</label>
              <input
                type="number"
                name="age"
                placeholder="22"
                value={form.age}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account →"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <span onClick={() => navigate("/")}>Sign in</span>
        </p>
      </section>
    </div>
  );
}

export default Register;