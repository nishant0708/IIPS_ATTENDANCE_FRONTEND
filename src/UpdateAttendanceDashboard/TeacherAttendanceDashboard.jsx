import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Edit, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import './TeacherAttendanceDashboard.css';
import Navbar from '../Navbar/Navbar';
import axios from 'axios';

const TeacherAttendanceDashboard = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState({ name: '', hasAllAccess: false });
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [students, setStudents] = useState([]);
  const [updatingAttendance, setUpdatingAttendance] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const teacherId = localStorage.getItem('teacherId');

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchAttendances();
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/attendance/teacher-marked/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAttendances(response.data.attendances);
      setTeacherInfo({
        name: response.data.teacher,
        hasAllAccess: response.data.hasAllAccess,
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch attendance records');
      console.error('Error fetching attendances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = async (attendance) => {
    try {
      setSelectedAttendance(attendance);
      setShowUpdateModal(true);
      
      const response = await axios.get(
        `${BACKEND_URL}/attendance/fetch-students-for-update/${attendance.subjectCode}/${attendance.date}`,
        {
          
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStudents(response.data.students);
    } catch (err) {
      setError('Failed to fetch students for update');
      console.error('Error fetching students:', err);
    }
  };

  const handleAttendanceToggle = (studentId) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.studentId === studentId
          ? { ...student, present: !student.present }
          : student
      )
    );
  };

  const handleSubmitUpdate = async () => {
    try {
      setUpdatingAttendance(true);
      
      const updates = students.map(student => ({
        studentId: student.studentId,
        present: student.present,
      }));

      await axios.post(
        `${BACKEND_URL}/attendance/update-attendance`,
        {
          teacherId,
          subjectCode: selectedAttendance.subjectCode,
          date: selectedAttendance.date,
          updates,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Attendance updated successfully!');
      setShowUpdateModal(false);
      setSelectedAttendance(null);
      setStudents([]);
      fetchAttendances();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update attendance');
      console.error('Error updating attendance:', err);
    } finally {
      setUpdatingAttendance(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata', // Force IST timezone
    hour: '2-digit',
    minute: '2-digit',
  });
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

  return (
    <div className={`teacher-dashboard-container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <div className="attendance-section">
        <div className="teacher-header">
          <h2>My Marked Attendances</h2>
          <p className="teacher-info">
            Teacher: <span className="teacher-name">{teacherInfo.name}</span>
            {teacherInfo.hasAllAccess && (
              <span className="all-access-badge">All Access</span>
            )}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {attendances.length === 0 ? (
          <div className="empty-state">
            <BookOpen className="empty-state-icon" />
            <h3>No Attendance Records Found</h3>
            <p>You haven't marked any attendance yet.</p>
          </div>
        ) : (
          <div className="attendance-cards-grid">
            {attendances.map((attendance, index) => (
              <div key={index} className="attendance-card">
                <div className="card-header">
                  <h3>{attendance.subjectCode}</h3>
                  <p className="card-subject-name">
                    {attendance.subjectName || 'Subject Name'}
                  </p>
                </div>

                <div className="card-body">
                  <div className="card-info-row">
                    <Calendar className="card-icon" />
                    <div className="card-info-content">
                      <p className="card-info-label">Date</p>
                      <p className="card-info-value">{formatDate(attendance.date)}</p>
                    </div>
                  </div>

                  <div className="card-info-row">
                    <Clock className="card-icon" />
                    <div className="card-info-content">
                      <p className="card-info-label">Marked At</p>
                      <p className="card-info-value">{formatTime(attendance.markedAt)}</p>
                    </div>
                  </div>

                  <div className="card-info-row">
                    <Users className="card-icon" />
                    <div className="card-info-content">
                      <p className="card-info-label">Total Students</p>
                      <p className="card-info-value">{attendance.totalStudents}</p>
                    </div>
                  </div>

                  <div className="attendance-stats">
                    <div className="stat-row">
                      <div className="stat-label">
                        <CheckCircle className="stat-icon" style={{ color: '#4CAF50' }} />
                        <span>Present</span>
                      </div>
                      <span className="stat-value present">
                        {attendance.presentCount}
                      </span>
                    </div>
                    <div className="stat-row">
                      <div className="stat-label">
                        <XCircle className="stat-icon" style={{ color: '#f44336' }} />
                        <span>Absent</span>
                      </div>
                      <span className="stat-value absent">
                        {attendance.absentCount}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpdateClick(attendance)}
                    disabled={!attendance.canUpdate}
                    className={`update-button ${attendance.canUpdate ? 'active' : 'disabled'}`}
                  >
                    <Edit />
                    {attendance.canUpdate ? 'Update Attendance' : 'Update Expired'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Update Attendance</h2>
              <p>
                {selectedAttendance?.subjectCode} - {selectedAttendance?.subjectName}
              </p>
            </div>

            <div className="modal-body">
              {students.length === 0 ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading students...</p>
                </div>
              ) : (
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Attendance</th>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.studentId}>
                        <td>
                          <label className="attendance-checkbox">
                            <input
                              type="checkbox"
                              checked={student.present}
                              onChange={() => handleAttendanceToggle(student.studentId)}
                            />
                          </label>
                        </td>
                        <td>{student.rollNo}</td>
                        <td>{student.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedAttendance(null);
                  setStudents([]);
                }}
                className="modal-button cancel"
                disabled={updatingAttendance}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUpdate}
                disabled={updatingAttendance}
                className="modal-button save"
              >
                {updatingAttendance ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceDashboard;