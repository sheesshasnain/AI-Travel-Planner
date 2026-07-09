import { useEffect, useState } from "react";
import API from "../api";
import { useToast } from "../context/ToastContext";
import "../styles/pages/adminDashboard.css";
import AdminSidebar from "../components/AdminSidebar";


function AdminDashboard() {
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const [usersRes, tripsRes] = await Promise.all([
        API.get("/admin/users", authHeaders),
        API.get("/admin/trips", authHeaders),
      ]);

      setUsers(usersRes.data || []);
      setTrips(tripsRes.data || []);
    } catch (err) {
      console.log(err);
      showToast("Admin access denied or failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await API.delete(`/admin/users/${userId}`, authHeaders);
      showToast("User deleted successfully.", "success");
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      console.log(err);
      showToast(err.response?.data?.detail || "Failed to delete user.", "error");
    }
  };

  const deleteTrip = async (tripId) => {
    if (!window.confirm("Delete this trip?")) return;

    try {
      await API.delete(`/admin/trips/${tripId}`, authHeaders);
      showToast("Trip deleted successfully.", "success");
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
    } catch (err) {
      console.log(err);
      showToast(err.response?.data?.detail || "Failed to delete trip.", "error");
    }
  };

  return (
    <div className="luxury-page">
      <AdminSidebar />

      <main className="luxury-main admin-main">
        <div className="admin-hero">
          <p className="admin-label">Admin Control Center</p>
          <h1>Manage Users & Trips</h1>
          <p>Monitor platform activity and remove unwanted records.</p>
        </div>

        {loading ? (
          <div className="admin-loading">Loading admin dashboard...</div>
        ) : (
          <>
            <section className="admin-stats-grid">
              <AdminStat label="Total Users" value={users.length} />
              <AdminStat label="Total Trips" value={trips.length} />
            </section>

            <section className="admin-card">
              <div className="admin-section-header">
                <h2>Users</h2>
                <span>{users.length} records</span>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username || "N/A"}</td>
                        <td>{user.email}</td>
                        <td>{user.age || "N/A"}</td>
                        <td>{user.gender || "N/A"}</td>
                        <td>
                          <button
                            className="admin-danger-btn"
                            onClick={() => deleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-card">
              <div className="admin-section-header">
                <h2>Trips</h2>
                <span>{trips.length} records</span>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Budget</th>
                      <th>Transport</th>
                      <th>User ID</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip.id}>
                        <td>{trip.id}</td>
                        <td>{trip.origin || "N/A"}</td>
                        <td>{trip.destination || "N/A"}</td>
                        <td>
                          {trip.budget
                            ? `PKR ${Number(trip.budget).toLocaleString()}`
                            : "N/A"}
                        </td>
                        <td>{trip.transport_mode || "N/A"}</td>
                        <td>{trip.user_id || "N/A"}</td>
                        <td>
                          <button
                            className="admin-danger-btn"
                            onClick={() => deleteTrip(trip.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function AdminStat({ label, value }) {
  return (
    <div className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default AdminDashboard;