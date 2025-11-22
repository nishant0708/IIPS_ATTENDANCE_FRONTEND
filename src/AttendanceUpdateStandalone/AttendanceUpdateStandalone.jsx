// AttendanceUpdateStandalone.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./AttendanceUpdateStandalone.css"; // <- keep your CSS unchanged
import Navbar from "../Navbar/Navbar";
import AlertModal from "../AlertModal/AlertModal"; // <-- same modal as Dashboard

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const AttendanceUpdateStandalone = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectCode, date, subjectName } = location.state || {};

  // modal and redirect state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [redirectAfterSuccess, setRedirectAfterSuccess] = useState(false);

  const initialTeacherId = (location.state && location.state.teacherId) || localStorage.getItem("teacherId");
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [teacherId] = useState(initialTeacherId || null);

  const [students, setStudents] = useState([]); // { studentId, rollNumber, fullName, present }
  const [loading, setLoading] = useState(false);
  const [updatingAttendance, setUpdatingAttendance] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (!subjectCode || !date) return;
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCode, date]);

  async function fetchStudents() {
    try {
      setError(null);
      setLoading(true);

      const encodedSubject = encodeURIComponent(subjectCode);
      const encodedDate = encodeURIComponent(date);
      const url = `${BACKEND_URL}/attendance/fetch-students-for-update/${encodedSubject}/${encodedDate}`;

      const res = await axios.get(url, { headers: { ...getAuthHeader() } });
      const returned = res.data || {};
      const raw = returned.students || [];

      const normalized = raw.map(s => ({
        studentId: s.studentId ?? s._id ?? (s.student && (s.student._id ?? s.student.id)) ?? null,
        rollNumber: s.rollNumber ?? s.RollNo ?? (s.student && s.student.rollNumber) ?? "",
        fullName: s.fullName ?? s.name ?? (s.student && s.student.fullName) ?? "",
        present: typeof s.present === "boolean" ? s.present : !!s.present,
      })).filter(s => s.studentId);

      setStudents(normalized);
    } catch (err) {
      console.error("Error fetching students for update:", err);
      setError((err.response && err.response.data && err.response.data.message) || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }

  function handleAttendanceToggle(studentId) {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, present: !s.present } : s));
  }

  // showAlert now supports optional redirect-on-close behavior
  const showAlert = (msg, error = false, redirect = false) => {
    setModalMessage(msg);
    setIsError(error);
    setRedirectAfterSuccess(redirect && !error); // only set redirect if not an error
    setIsModalOpen(true);
  };

  // handle modal close -> possibly redirect
  const handleModalClose = () => {
    setIsModalOpen(false);
    if (redirectAfterSuccess) {
      setRedirectAfterSuccess(false);
      // navigate to attendance history (adjust route if your app uses a different path)
      navigate("/attendance_history");
    }
  };

  // Replace your existing handleSubmitUpdate with this implementation
  const handleSubmitUpdate = async () => {
    if (!subjectCode || !date) {
      showAlert("Missing subject or date", true);
      return;
    }

    // get token from localStorage (try common keys)
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("authToken");

    if (!token) {
      showAlert("You are not authenticated. Please log in and try again.", true);
      console.warn("No auth token found in localStorage under keys token/accessToken/authToken");
      return;
    }

    setUpdatingAttendance(true);
    try {
      const payload = {
        teacherId,
        subjectCode,
        date,
        updates: students.map(s => ({ studentId: s.studentId, present: !!s.present }))
      };

      const url = `${BACKEND_URL.replace(/\/$/, '')}/teacher/updateAttendance`; // adjust if your server endpoint differs

      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        timeout: 30000
      });

      console.log("Attendance update response:", res?.data);
      // show success and redirect after modal closes
      showAlert("Attendance submitted successfully!", false, true);
    } catch (err) {
      // Rich logging to help debug 403 reasons
      console.error("Error updating attendance (detailed):", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
        request: err.request && (err.request._currentRequest || err.request)
      });

      const msg = (err.response && err.response.data && (err.response.data.message || JSON.stringify(err.response.data))) || "Failed to update attendance. Please try again.";
      showAlert(msg, true, false);
    } finally {
      setUpdatingAttendance(false);
    }
  };

  if (loading) {
    return (
      <div className={`teacher-dashboard-container ${theme}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading attendance records...</p>
        </div>
      </div>
    );
  }

  if (!subjectCode || !date) {
    return (
      <div className={`aus-page aus-center ${theme}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="aus-card small">
          <h2>No attendance selected</h2>
          <p>Please open this page from the Teacher Dashboard (click Update on a record).</p>
          <div className="aus-footer">
            <button className="aus-btn" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`aus-page ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Global alert modal (same as Dashboard) */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        message={modalMessage}
        iserror={isError}
      />

      <div className="aus-card">
        <header className="aus-header">
          <div>
            <h2 className="aus-title">Update Attendance</h2>
            <p className="aus-subtitle">
              {subjectCode} {subjectName ? `- ${subjectName}` : ""} • {new Date(date).toLocaleDateString()}
            </p>
          </div>
        </header>

        <main className="aus-body">
          {loading ? (
            <div className="aus-loading">
              <div className="aus-spinner" />
              <p>Loading students...</p>
            </div>
          ) : error ? (
            <div className="aus-error">
              <p>{error}</p>
              <div className="aus-error-actions">
                <button className="aus-btn" onClick={fetchStudents}>Retry</button>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="aus-empty"><p>No students found for this subject/date.</p></div>
          ) : (
            <div className="aus-table-wrap">
              <table className="aus-table" role="table">
                <thead>
                  <tr>
                    <th className="aus-th">Attendance</th>
                    <th className="aus-th">Roll Number</th>
                    <th className="aus-th">Student Name</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.studentId} className="aus-tr">
                      <td className="aus-td aus-td-checkbox">
                        <label className="aus-checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!student.present}
                            onChange={() => handleAttendanceToggle(student.studentId)}
                            className="aus-checkbox"
                            aria-label={`Toggle attendance for ${student.fullName}`}
                          />
                        </label>
                      </td>
                      <td className="aus-td">{student.rollNumber}</td>
                      <td className="aus-td">{student.fullName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <footer className="aus-footer">
          <button className="aus-btn aus-btn-ghost" onClick={() => navigate(-1)} disabled={updatingAttendance}>Cancel</button>
          <button
            className="aus-btn aus-btn-primary"
            onClick={handleSubmitUpdate}
            disabled={updatingAttendance || loading || students.length === 0}
          >
            {updatingAttendance ? "Updating..." : "Save Changes"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AttendanceUpdateStandalone;
