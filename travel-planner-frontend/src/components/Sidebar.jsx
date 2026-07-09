import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import "../styles/components/sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const res = await API.get("/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const navItems = [
    {
      icon: "🏠",
      text: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: "✈",
      text: "Create Trip",
      path: "/create-trip",
    },
    {
      icon: "🧳",
      text: "My Trips",
      path: "/my-trips",
    },
    {
      icon: "👤",
      text: "Profile",
      path: "/profile",
    },
  ];

  return (
    <aside className="sidebar">

      <div className="brand">
        ✈ LUXE TRAVEL AI
      </div>

      <div className="sidebar-user">

        <div className="avatar">
          {user?.username
            ? user.username
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0,2)
            : "U"}
        </div>

        <h3>{user?.username || "Traveler"}</h3>

        <p>Travel Explorer</p>

      </div>

      <div className="sidebar-nav">

        {navItems.map((item)=>(
          <button
            key={item.path}
            className={
              location.pathname===item.path
                ? "active"
                : ""
            }
            onClick={()=>navigate(item.path)}
          >
            <span>{item.icon}</span>

            {item.text}
          </button>
        ))}

      </div>

      <div className="sidebar-bottom">

        <button
          className="logout-btn"
          onClick={logout}
        >
          🚪 Logout
        </button>

        <small>
          AI Travel Planner
          <br/>
          Version 1.0
        </small>

      </div>

    </aside>
  );
}

export default Sidebar;