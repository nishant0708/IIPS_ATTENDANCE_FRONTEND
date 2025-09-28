import React, { useState } from "react";
import { Info, X, Plus } from "lucide-react";
import axios from "axios";

const AddStudentForm = ({
  course,
  semester,
  section,
  courseConfig,
  hasSpecializations,
  availableSpecializations,
  availableSectionOptions,
  theme,
  onSuccess,
  onCancel,
  showAlert
}) => {
  const [newStudent, setNewStudent] = useState({
    rollNumber: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    section: "",
    specializations: []
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Helper function to convert empty strings to null for backend
  const convertEmptyToNull = (value) => {
    if (value === "" || value === undefined) return null;
    return value;
  };

  // Get specialization options based on available specializations
  const getSpecializationOptions = () => {
    return availableSpecializations.map(spec => ({
      value: spec,
      label: spec
    }));
  };

  // Function to add specialization to new student
  const addSpecializationToNewStudent = (specializationValue) => {
    if (specializationValue && !newStudent.specializations.includes(specializationValue)) {
      setNewStudent(prev => ({
        ...prev,
        specializations: [...prev.specializations, specializationValue]
      }));
    }
  };

  // Function to remove specialization from new student
  const removeSpecializationFromNewStudent = (specializationToRemove) => {
    setNewStudent(prev => ({
      ...prev,
      specializations: prev.specializations.filter(spec => spec !== specializationToRemove)
    }));
  };

  const handleAddStudent = async () => {
    if (!newStudent.rollNumber || !newStudent.fullName || !course || !semester) {
      showAlert("Please fill in all required fields", true);
      return;
    }

    // Check if specializations are required and provided
    if (hasSpecializations && newStudent.specializations.length === 0) {
      showAlert("Please add at least one specialization", true);
      return;
    }

    setLoading(true);

    try {
      const courseId = courseConfig[course]?.displayName;
      
      const studentData = {
        rollNumber: newStudent.rollNumber,
        fullName: newStudent.fullName,
        courseName: courseId,
        semId: parseInt(semester),
        email: convertEmptyToNull(newStudent.email),
        phoneNumber: convertEmptyToNull(newStudent.phoneNumber),
        section: convertEmptyToNull(newStudent.section || section),
        specializations: newStudent.specializations.length > 0 ? newStudent.specializations : null
      };

      console.log("Student data being sent:", studentData); // For debugging

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/student/create`,
        studentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert("Student added successfully!", false);
      
      // Reset form
      setNewStudent({
        rollNumber: "",
        fullName: "",
        email: "",
        phoneNumber: "",
        section: "",
        specializations: []
      });
      
      // Call success callback
      onSuccess();
    } catch (error) {
      console.error("Error adding student:", error);
      showAlert(error.response?.data?.message || "Failed to add student. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewStudent({
      rollNumber: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      section: "",
      specializations: []
    });
    onCancel();
  };

  return (
    <div className="studentdashboard_add_form">
      <h3>Add New Student</h3>
      
      {/* Course Information Display */}
      {course && semester && courseConfig[course] && (
        <div className="studentdashboard_course_info" style={{
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f8ff',
          border: '1px solid #007bff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Info className="studentdashboard_icon" style={{ color: '#007bff' }} />
          <div>
            <strong>Student will be added to:</strong>
            <div style={{ marginTop: '8px', fontSize: '14px' }}>
              <span style={{ marginRight: '20px' }}>
                <strong>Course:</strong> {course} ({courseConfig[course]?.displayName})
              </span>
              <span style={{ marginRight: '20px' }}>
                <strong>Semester:</strong> {semester}
              </span>
              {section && (
                <span style={{ marginRight: '20px' }}>
                  <strong>Section:</strong> {section}
                </span>
              )}
              {hasSpecializations && availableSpecializations.length > 0 && (
                <span style={{ marginRight: '20px' }}>
                  <strong>Available Specializations:</strong> {availableSpecializations.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="studentdashboard_form_grid">
        <div className="studentdashboard_form_group">
          <label>Roll Number (Required):</label>
          <input
            type="text"
            value={newStudent.rollNumber}
            onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
            placeholder="e.g., IT-2K21-36"
            className="studentdashboard_form_input"
          />
        </div>
        <div className="studentdashboard_form_group">
          <label>Full Name (Required):</label>
          <input
            type="text"
            value={newStudent.fullName}
            onChange={(e) => setNewStudent({...newStudent, fullName: e.target.value})}
            placeholder="Enter full name"
            className="studentdashboard_form_input"
          />
        </div>
        <div className="studentdashboard_form_group">
          <label>Email:</label>
          <input
            type="email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
            placeholder="Enter email"
            className="studentdashboard_form_input"
          />
        </div>
        <div className="studentdashboard_form_group">
          <label>Phone Number:</label>
          <input
            type="tel"
            value={newStudent.phoneNumber}
            onChange={(e) => setNewStudent({...newStudent, phoneNumber: e.target.value})}
            placeholder="Enter phone number"
            className="studentdashboard_form_input"
          />
        </div>
        <div className="studentdashboard_form_group">
          <label>Section:</label>
          <select
            value={newStudent.section}
            onChange={(e) => setNewStudent({...newStudent, section: e.target.value})}
            className="studentdashboard_form_select"
          >
            <option value="">Select Section (Optional)</option>
            {availableSectionOptions.map((sec) => (
              <option key={sec.value} value={sec.value}>
                {sec.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Multiple Specializations Section */}
      {hasSpecializations && (
        <div className="studentdashboard_form_group_Check" style={{ marginTop: '20px' }}>
          <label>Specializations (Required):</label>
          
          {/* Add Specialization Dropdown */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addSpecializationToNewStudent(e.target.value);
                  e.target.value = ""; // Reset dropdown
                }
              }}
              className="studentdashboard_form_select"
              style={{ flex: 1 }}
            >
              <option value="">Select Specialization to Add</option>
              {getSpecializationOptions()
                .filter(spec => !newStudent.specializations.includes(spec.value))
                .map((spec) => (
                  <option key={spec.value} value={spec.value}>
                    {spec.label}
                  </option>
                ))}
            </select>
            <Plus 
              className="studentdashboard_icon" 
              style={{ 
                color: '#007bff',
                cursor: 'pointer',
                minWidth: '20px'
              }} 
            />
          </div>

          {/* Display Selected Specializations */}
          {newStudent.specializations.length > 0 && (
            <div style={{
              margin: '10px 0px'
            }}>
              <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>
                Selected Specializations ({newStudent.specializations.length}):
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {newStudent.specializations.map((spec, index) => {
                  const specOption = getSpecializationOptions().find(s => s.value === spec);
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        gap: '8px'
                      }}
                    >
                      <span>{specOption?.label || spec}</span>
                      <X
                        size={16}
                        style={{ cursor: 'pointer' }}
                        onClick={() => removeSpecializationFromNewStudent(spec)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {newStudent.specializations.length === 0 && (
            <p style={{ 
              color: '#666', 
              fontSize: '14px',
              fontStyle: 'italic',
              marginTop: '10px'
            }}>
              No specializations selected. Please add at least one specialization.
            </p>
          )}
        </div>
      )}

      <div className="studentdashboard_form_actions">
        <button
          onClick={handleAddStudent}
          className="studentdashboard_btn_save"
          disabled={
            loading ||
            !newStudent.rollNumber || 
            !newStudent.fullName || 
            !course || 
            !semester ||
            !courseConfig[course] ||
            (hasSpecializations && newStudent.specializations.length === 0)
          }
        >
          {loading ? "Adding..." : "Add Student"}
        </button>
        <button
          onClick={handleCancel}
          className="studentdashboard_btn_cancel"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddStudentForm;