import React, { useState } from "react";
import "./PromoteStudentsModal.css";

const PromoteStudentsModal = ({
    isOpen,
    onClose,
    onConfirm,
    loading,
    theme,
    selectedCount
}) => {
    const [promoteToNextYear] = useState(false);

    if (!isOpen) return null;


    return (
        <div className="promote_modal_overlay">
            <div className={`promote_modal ${theme === "light" ? "light" : "dark"}`}>
                <h2 className="promote_modal_title">
                    Promote Students
                </h2>

                <p className="promote_modal_text">
                    You are about to promote <strong>{selectedCount}</strong> student(s) to the next semester.
                </p>

                <div className="promote_modal_actions">
                    <div className="promote_modal_actions_row">
                        <button
                            className="promote_btn secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            className="promote_btn primary"
                            onClick={() => onConfirm({ promoteToNextYear })}
                            disabled={loading}
                        >
                            {loading ? "Promoting..." : "Confirm Promotion"}
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default PromoteStudentsModal;
