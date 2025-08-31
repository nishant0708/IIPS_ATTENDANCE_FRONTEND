import React, { useState, useEffect } from 'react';
import { Users, Edit, Trash2, Save, X, PlusCircle, MinusCircle } from 'lucide-react';
import Navbar from "../Navbar/Navbar";
import './StudentManagement.css';

const API_BASE = "http://localhost:5000"; // <-- change to your backend origin

// ---------------- StudentCard ----------------
const StudentCard = ({ student, onEdit, onDelete, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState(student);

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
          {(isEditing ? editedStudent.name : student.name).charAt(0)}
        </div>
        <div className="student-details">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedStudent.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="edit-input name-input"
                placeholder="Student Name"
              />
              <div className="student-field">
                <span className="field-label">Roll No:</span>
                <input
                  type="text"
                  value={editedStudent.rollNo}
                  onChange={(e) => handleFieldChange('rollNo', e.target.value)}
                  className="edit-input"
                  placeholder="Roll Number"
                />
              </div>
              <div className="student-field">
                <span className="field-label">Section:</span>
                <input
                  type="text"
                  value={editedStudent.section}
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
                  value={editedStudent.mobile}
                  onChange={(e) => handleFieldChange('mobile', e.target.value)}
                  className="edit-input"
                  placeholder="Mobile Number"
                />
              </div>
              <div className="student-field">
                <span className="field-label">Email:</span>
                <input
                  type="email"
                  value={editedStudent.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="edit-input"
                  placeholder="Email Address"
                />
              </div>
            </>
          ) : (
            <>
              <h3>{student.name}</h3>
              <div className="student-field">
                <span className="field-label">Roll No:</span>
                <span className="field-value">{student.rollNo}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Section:</span>
                <span className="field-value">{student.section}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Specializations:</span>
                <span className="field-value">
                  {(student.specialization || []).join(", ")}
                </span>
              </div>
              <div className="student-field">
                <span className="field-label">Mobile:</span>
                <span className="field-value">{student.mobile}</span>
              </div>
              <div className="student-field">
                <span className="field-label">Email:</span>
                <span className="field-value">{student.email}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- StudentList (grid) ----------------
const StudentList = ({ students, onEdit, onDelete, onSave, theme, toggleTheme }) => {
  return (
    <div className="students-container">
      <div className="students-header">
        <Users className="icon" />
        <h2>Student List</h2>
      </div>
      
      <div className="students-grid">
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onEdit={onEdit}
            onDelete={onDelete}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------- StudentManagement (page) ----------------
const StudentManagement = () => {
  const [theme, setTheme] = useState("dark");
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [showStudents, setShowStudents] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // dropdowns (unchanged)
  const courses = [
    'Computer Science','Mathematics','Physics','Chemistry','Biology',
    'Mechanical Engineering','Electrical Engineering','Civil Engineering'
  ];
  const semesters = [
    '1st Semester','2nd Semester','3rd Semester','4th Semester',
    '5th Semester','6th Semester','7th Semester','8th Semester'
  ];
  const sections = ['A','B','C','D','E'];

  useEffect(() => {
    if (theme === "light") document.body.classList.add('light');
    else document.body.classList.remove('light');
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // -------- API: fetch all, then (optionally) filter by section ----------
  const fetchStudents = async (course, semester, section) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/students`);
      if (!res.ok) {
        const m = await res.json().catch(() => ({}));
        throw new Error(m.message || `HTTP ${res.status}`);
      }
      const data = await res.json();

      // map backend -> UI shape expected by your components
      const mapped = (data || []).map(s => ({
        id: s._id, // keep .id for your components
        name: s.fullName,
        rollNo: s.rollNumber,
        section: s.section,
        specialization: Array.isArray(s.specializations)
          ? s.specializations
          : (s.specializations ? [s.specializations] : []),
        mobile: s.phoneNumber,
        email: s.email,
        // keep original so we can send back on save if needed
        _raw: s
      }));

      // optional simple filter by section (course/semester labels may not match backend IDs)
      const filtered = section ? mapped.filter(s => s.section === section) : mapped;

      setStudents(filtered);
      setShowStudents(true);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError(err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // -------- API: update one ----------
  const handleSaveStudent = async (studentId, updatedStudent) => {
    try {
      const payload = {
        fullName: updatedStudent.name,
        rollNumber: updatedStudent.rollNo,
        section: updatedStudent.section,
        email: updatedStudent.email,
        phoneNumber: updatedStudent.mobile,
        specializations: (updatedStudent.specialization || []).filter(Boolean),
      };

      const res = await fetch(`${API_BASE}/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const m = await res.json().catch(() => ({}));
        throw new Error(m.message || `Update failed (HTTP ${res.status})`);
      }

      // merge back into local list
      setStudents(prev =>
        prev.map(s => (s.id === studentId ? { ...s, ...updatedStudent } : s))
      );

      alert(`${updatedStudent.name}'s information has been updated successfully!`);
    } catch (err) {
      alert(`Error updating student: ${err.message}`);
    }
  };

  // -------- API: delete one ----------
  const handleDelete = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (!window.confirm(`Are you sure you want to delete ${student.name}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/students/${studentId}`, { method: "DELETE" });
      if (!res.ok) {
        const m = await res.json().catch(() => ({}));
        throw new Error(m.message || `Delete failed (HTTP ${res.status})`);
      }
      setStudents(prev => prev.filter(s => s.id !== studentId));
      alert(`${student.name} has been deleted successfully.`);
    } catch (err) {
      alert(`Error deleting student: ${err.message}`);
    }
  };

  const handleGetStudents = () => {
    if (selectedCourse && selectedSemester && selectedSection) {
      // we still require all three to match your original UX
      fetchStudents(selectedCourse, selectedSemester, selectedSection);
    }
  };

  const isFormValid = selectedCourse && selectedSemester && selectedSection;

  return (
    <div className={`dashboard-container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <div className="header">
        <h1>Student Management</h1>
      </div>

      {/* Form Section (unchanged UI) */}
      <div className="form-container">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="course">Course:</label>
            <select id="course" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="semester">Semester:</label>
            <select id="semester" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
              <option value="">Select Semester</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="section">Section:</label>
            <select id="section" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
              <option value="">Select Section</option>
              {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>

          <div className="form-group button-group">
            <button onClick={handleGetStudents} disabled={!isFormValid || loading} className="get-students-btn">
              {loading ? 'Loading...' : 'Get Students'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-container"><strong>Error:</strong> {error}</div>}

      {showStudents && (
        <>
          <StudentList 
            students={students}
            onEdit={() => {}}
            onDelete={handleDelete}
            onSave={handleSaveStudent}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </>
      )}
    </div>
  );
};

export default StudentManagement;
