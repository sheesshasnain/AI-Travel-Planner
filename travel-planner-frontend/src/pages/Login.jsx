import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useToast } from "../context/ToastContext";
import "../styles/pages/auth.css";

function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    showToast("Signing you in...", "info");

    try {
      const res = await API.post("/login", form);

      const token = res.data.access_token;
      localStorage.setItem("token", token);

      const me = await API.get("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showToast("Welcome back.", "success");

      setTimeout(() => {
        if (me.data.is_admin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 700);
    } catch (err) {
      console.log(err);
      showToast("Invalid email or password.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="auth-premium-page">
      <div className="auth-overlay"></div>

      <section className="auth-left">
        <p className="auth-kicker">AI Travel Concierge</p>

        <h1>
          Explore the world
          <br />
          with intelligence.
        </h1>

        <p>
          Plan personalized luxury trips with AI itineraries, weather-aware
          planning, destination images, and smart travel recommendations.
        </p>

        <div className="auth-features">
          <div>✦ AI personalized itineraries</div>
          <div>✦ Weather-aware planning</div>
          <div>✦ Smart budget guidance</div>
          <div>✦ Premium destination experience</div>
        </div>
      </section>

      <section className="auth-card-premium">
        <div className="auth-logo">✈ LUXE TRAVEL AI</div>

        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue your journey.</p>

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In →"}
          </button>
        </form>

        <p className="auth-switch">
          New here?{" "}
          <span onClick={() => navigate("/register")}>Create account</span>
        </p>
      </section>
    </div>
  );
}

export default Login;