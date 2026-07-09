import { useNavigate } from "react-router-dom";
import "../styles/components/adminSidebar.css";

function AdminSidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <span>✦</span>
        <h2>Admin Panel</h2>
      </div>

      <nav>
        <button onClick={() => navigate("/admin")}>Dashboard</button>
        <button onClick={() => navigate("/dashboard")}>User View</button>
        <button onClick={logout}>Logout</button>
      </nav>
    </aside>
  );
}

export default AdminSidebar;