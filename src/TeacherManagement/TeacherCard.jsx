import React, { useState } from 'react';
import { Edit, Trash2, Save, X, Key, Search } from 'lucide-react';
import "../StudentManagement/StudentCard.css";

const TeacherCard = ({ teacher, onEdit, onDelete, onUpdatePassword, allSubjects = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editedTeacher, setEditedTeacher] = useState(teacher);
  const [newPassword, setNewPassword] = useState("");
  const [subjectSearchTerm, setSubjectSearchTerm] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Helper function to extract subject code from object or return string as-is
  const getSubjectCode = (subject) => {
    if (typeof subject === 'string') {
      return subject;
    }
    if (typeof subject === 'object' && subject !== null) {
      return subject.subjectCode || subject.Sub_Code || subject.code || subject.name || subject.id || String(subject);
    }
    return String(subject);
  };

  // Helper function to normalize subject access array
  const normalizeSubjectAccess = (subjectAccess) => {
    if (!Array.isArray(subjectAccess)) return [];
    return subjectAccess.map(subject => getSubjectCode(subject));
  };

  // Helper function to display "null" for empty values
  const displayValue = (value) => {
    if (value === null || value === undefined || value === "") return "null";
    return value;
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // Normalize subject access when starting edit
    const normalizedTeacher = {
      ...teacher,
      subjectAccess: normalizeSubjectAccess(teacher.subjectAccess)
    };
    setEditedTeacher(normalizedTeacher);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTeacher({ ...teacher });
    setSubjectSearchTerm("");
    setShowSubjectDropdown(false);
  };

  const handleSaveClick = () => {
    // Call onEdit with the teacherId and edited data
    onEdit(teacher._id || teacher.id, editedTeacher);
    setIsEditing(false);
    setSubjectSearchTerm("");
    setShowSubjectDropdown(false);
  };

  const handlePasswordChange = () => {
    if (newPassword.trim() === "") {
      alert("Please enter a new password");
      return;
    }
    onUpdatePassword(teacher._id || teacher.id, newPassword);
    setIsChangingPassword(false);
    setNewPassword("");
  };

  const handleFieldChange = (field, value) => {
    setEditedTeacher(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get filtered subjects for dropdown based on search term
  const getFilteredSubjects = () => {
    const currentSubjects = normalizeSubjectAccess(editedTeacher.subjectAccess || []);
    
    if (!subjectSearchTerm) {
      return allSubjects.filter(subject => 
        !currentSubjects.includes(subject.value)
      );
    }
    
    return allSubjects.filter(subject => 
      subject.label.toLowerCase().includes(subjectSearchTerm.toLowerCase()) &&
      !currentSubjects.includes(subject.value)
    );
  };

  // Add subject to teacher's access
  const addSubjectAccess = (subjectValue) => {
    const currentSubjects = normalizeSubjectAccess(editedTeacher.subjectAccess || []);
    
    if (subjectValue && !currentSubjects.includes(subjectValue)) {
      setEditedTeacher(prev => ({
        ...prev,
        subjectAccess: [...currentSubjects, subjectValue]
      }));
      setSubjectSearchTerm("");
      setShowSubjectDropdown(false);
    }
  };

  // Remove subject from teacher's access
  const removeSubjectAccess = (subjectToRemove) => {
    const currentSubjects = normalizeSubjectAccess(editedTeacher.subjectAccess || []);
    
    setEditedTeacher(prev => ({
      ...prev,
      subjectAccess: currentSubjects.filter(subject => subject !== subjectToRemove)
    }));
  };

  // Helper function to display subject access
  const getSubjectAccessDisplay = (subjectAccess) => {
    const normalized = normalizeSubjectAccess(subjectAccess);
    if (normalized.length === 0) return "null";
    return normalized.join(", ");
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
              title="Edit Teacher"
            >
              <Edit className="icon" />
            </button>
            <button
              onClick={() => setIsChangingPassword(true)}
              className="action-btn password-btn"
              title="Change Password"
            >
              <Key className="icon" />
            </button>
            <button
              onClick={() => onDelete(teacher._id || teacher.id)}
              className="action-btn delete-btn"
              title="Delete Teacher"
            >
              <Trash2 className="icon" />
            </button>
          </>
        )}
      </div>

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <h3 className="password-modal-title">Change Password for {teacher.name}</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="password-input"
            />
            <div className="password-modal-actions">
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setNewPassword("");
                }}
                className="password-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="password-update-btn"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="student-info">
        <div className="student-avatar">
          {(isEditing ? editedTeacher.name : teacher.name)?.charAt(0) || "T"}
        </div>
        <div className="student-details">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedTeacher.name || ""}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="edit-input name-input"
                placeholder="Teacher Name"
              />
              <div className="student-field">
                <span className="field-label">Email:</span>
                <span className="field-value non-editable-field">{displayValue(teacher.email)}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Mobile:</span>
                <input
                  type="tel"
                  value={editedTeacher.mobileNumber || ""}
                  onChange={(e) => handleFieldChange('mobileNumber', e.target.value)}
                  className="edit-input"
                  placeholder="Mobile Number"
                />
              </div>
              <div className="student-field">
                <span className="field-label">Faculty ID:</span>
                <span className="field-value non-editable-field faculty-id-highlight">
                  {displayValue(teacher.faculty_id)}
                </span>
              </div>

              {/* Enhanced Subject Access Editing */}
              <div className="student-field subject-access-field">
                <span className="field-label subject-access-label">Subject Access:</span>
                
                {/* Search and Add Subjects */}
                <div className="subject-search-container">
                  <div className="subject-search-input-wrapper">
                    <input
                      type="text"
                      value={subjectSearchTerm}
                      onChange={(e) => {
                        setSubjectSearchTerm(e.target.value);
                        setShowSubjectDropdown(true);
                      }}
                      onFocus={() => setShowSubjectDropdown(true)}
                      placeholder="Search subjects to add..."
                      className="edit-input subject-search-input"
                    />
                    <Search className="subject-search-icon" />
                    
                    {/* Subject Dropdown */}
                    {showSubjectDropdown && (
                      <div className="subject-dropdown">
                        {getFilteredSubjects().length > 0 ? (
                          getFilteredSubjects().map((subject) => (
                            <div
                              key={subject.value}
                              onClick={() => addSubjectAccess(subject.value)}
                              className="subject-dropdown-item"
                            >
                              {subject.label}
                            </div>
                          ))
                        ) : (
                          <div className="subject-dropdown-empty">
                            No subjects found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                 
                </div>

                {/* Click outside to close dropdown */}
                {showSubjectDropdown && (
                  <div className="dropdown-overlay" onClick={() => setShowSubjectDropdown(false)} />
                )}

                {/* Display Selected Subjects */}
                {normalizeSubjectAccess(editedTeacher.subjectAccess).length > 0 ? (
                  <div className="selected-subjects">
                    {normalizeSubjectAccess(editedTeacher.subjectAccess).map((subject, index) => (
                      <div key={index} className="subject-tag">
                        <span>{subject}</span>
                        <X
                          className="subject-remove-icon"
                          onClick={() => removeSubjectAccess(subject)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-subjects-message">
                    No subjects assigned
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <h3>{displayValue(teacher.name)}</h3>
              <div className="student-field">
                <span className="field-label">Email:</span>
                <span className="field-value">{displayValue(teacher.email)}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Mobile:</span>
                <span className="field-value">{displayValue(teacher.mobileNumber)}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Faculty ID:</span>
                <span className="field-value faculty-id-highlight">
                  {displayValue(teacher.faculty_id)}
                </span>
              </div>
              <div className="student-field">
                <span className="field-label">Subject Access:</span>
                <span className="field-value subject-access-display">
                  {getSubjectAccessDisplay(teacher.subjectAccess)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherCard;