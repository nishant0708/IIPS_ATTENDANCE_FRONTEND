import React from "react";
import "./RollbackModal.css";

const RollbackModal = ({
  isOpen,
  onClose,
  onRollbackOnly,
  onRollbackWithReset,
  loading = false,
  theme = "light"
}) => {
  if (!isOpen) return null;

  return (
    <div className="rollback_modal_overlay">
      <div className={`rollback_modal ${theme}`}>
        <h2 className="rollback_modal_title">
          Rollback Promotion
        </h2>

        <p className="rollback_modal_text">
          Do you want to reset attendance for the selected students?
        </p>

        <div className="rollback_modal_actions">
          <div className="rollback_modal_actions_row">
            <button
              className="rollback_btn danger"
              onClick={onRollbackWithReset}
              disabled={loading}
            >
              Rollback + Reset Attendance
            </button>

            <button
              className="rollback_btn primary"
              onClick={onRollbackOnly}
              disabled={loading}
            >
              Rollback Only
            </button>
          </div>

          <button
            className="rollback_btn secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RollbackModal;
