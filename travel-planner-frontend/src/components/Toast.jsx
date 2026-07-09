import "../styles/components/toast.css";

function Toast({ message, type, onClose }) {
  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type] || "ℹ️"}</span>

      <p>{message}</p>

      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default Toast;