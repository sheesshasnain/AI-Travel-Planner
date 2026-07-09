import { motion } from "framer-motion";
import "../styles/components/selectionGrid.css";

function SelectionGrid({ title, name, value, options, onChange }) {
  return (
    <div className="selection-group">
      <h3 className="selection-title">{title}</h3>

      <div className="selection-grid">
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className={
              value === option.value
                ? "selection-card active"
                : "selection-card"
            }
            onClick={() =>
              onChange({
                target: {
                  name,
                  value: option.value,
                },
              })
            }
          >
            <div className="selection-glow"></div>
            <span className="selection-icon">{option.icon}</span>
            <h3>{option.label}</h3>

            {value === option.value && (
              <motion.div
                className="selection-check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                ✓
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default SelectionGrid;