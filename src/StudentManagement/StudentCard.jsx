import React, { useState } from 'react';
import { Edit, Trash2, Save, X, PlusCircle, MinusCircle } from 'lucide-react';
import "./StudentCard.css";

const StudentCard = ({ student, onEdit, onDelete, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState(student);

  // ✅ Helper function to display "null" for empty values
  const displayValue = (value) => {
    if (value === null || value === undefined || value === "") return "null";
    return value;
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedStudent(student);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedStudent(student);
  };

  const handleSaveClick = () => {
    onSave(student.id, editedStudent);
    setIsEditing(false);
  };

  const handleFieldChange = (field, value) => {
    setEditedStudent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="student-card">
      <div className="card-actions">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveClick}
              className="action-btn save-btn"
              title="Save Changes"
            >
              <Save className="icon" />
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="action-btn cancel-btn"
              title="Cancel Edit"
            >
              <X className="icon" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEditClick}
              className="action-btn edit-btn"
              title="Edit Student"
            >
              <Edit className="icon" />
            </button>
            <button
              onClick={() => onDelete(student.id)}
              className="action-btn delete-btn"
              title="Delete Student"
            >
              <Trash2 className="icon" />
            </button>
          </>
        )}
      </div>

      <div className="student-info">
        <div className="student-avatar">
          {(isEditing ? editedStudent.name : student.name)?.charAt(0) || "N"}
        </div>
        <div className="student-details">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedStudent.name || ""}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="edit-input name-input"
                placeholder="Student Name"
              />
              <div className="student-field">
                <span className="field-label">Roll No:</span>
                <input
                  type="text"
                  value={editedStudent.rollNo || ""}
                  onChange={(e) => handleFieldChange('rollNo', e.target.value)}
                  className="edit-input"
                  placeholder="Roll Number"
                />
              </div>
              <div className="student-field">
                <span className="field-label">Section:</span>
                <input
                  type="text"
                  value={editedStudent.section || ""}
                  onChange={(e) => handleFieldChange('section', e.target.value)}
                  className="edit-input"
                  placeholder="Section"
                />
              </div>
              <div className="student-field">
                <span className="field-label">Specializations:</span>
                <div className="specialization-edit">
                  {(editedStudent.specialization || []).map((spec, index) => (
                    <div key={index} className="specialization-item">
                      <input
                        type="text"
                        value={spec}
                        onChange={(e) => {
                          const newSpecs = [...editedStudent.specialization];
                          newSpecs[index] = e.target.value;
                          handleFieldChange("specialization", newSpecs);
                        }}
                        className="edit-input"
                        placeholder="Specialization"
                      />
                      <button
                        onClick={() => {
                          const newSpecs = editedStudent.specialization.filter(
                            (_, i) => i !== index
                          );
                          handleFieldChange("specialization", newSpecs);
                        }}
                        className="action-btn delete-btn"
                        type="button"
                        title="Remove Specialization"
                      >
                        <MinusCircle className="icon" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      handleFieldChange("specialization", [
                        ...(editedStudent.specialization || []),
                        "",
                      ])
                    }
                    className="action-btn add-btn"
                    type="button"
                    title="Add Specialization"
                  >
                    <PlusCircle className="icon" />
                  </button>
                </div>
              </div>
              <div className="student-field">
                <span className="field-label">Mobile:</span>
                <input
                  type="tel"
                  value={editedStudent.mobile || ""}
                  onChange={(e) => handleFieldChange('mobile', e.target.value)}
                  className="edit-input"
                  placeholder="Mobile Number"
                />
              </div>
              <div className="student-field">
                <span className="field-label">Email:</span>
                <input
                  type="email"
                  value={editedStudent.email || ""}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="edit-input"
                  placeholder="Email Address"
                />
              </div>
            </>
          ) : (
            <>
              <h3>{displayValue(student.name)}</h3>
              <div className="student-field">
                <span className="field-label">Roll No:</span>
                <span className="field-value">{displayValue(student.rollNo)}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Section:</span>
                <span className="field-value">{displayValue(student.section)}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Specializations:</span>
                <span className="field-value">
                  {(student.specialization && student.specialization.length > 0)
                    ? student.specialization.join(", ")
                    : "null"}
                </span>
              </div>
              <div className="student-field">
                <span className="field-label">Mobile:</span>
                <span className="field-value">{displayValue(student.mobile)}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Email:</span>
                <span className="field-value">{displayValue(student.email)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCard;
