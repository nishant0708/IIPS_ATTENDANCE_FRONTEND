import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, Edit, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import './TeacherAttendanceDashboard.css';
import Navbar from '../Navbar/Navbar';
import axios from 'axios';
import PagePaginate from '../PagePaginate/PagePaginate.jsx';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const TeacherAttendanceDashboard = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState({ name: '', hasAllAccess: false });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem('token');
  const teacherId = localStorage.getItem('teacherId');
  const navigate = useNavigate();

  // Sync theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Memoized fetch function to prevent infinite loops
  const fetchAttendances = useCallback(async () => {
    if (!token || !teacherId) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/attendance/teacher-marked/${teacherId}?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAttendances(response.data.attendances || []);
      setTeacherInfo({
        name: response.data.teacher,
        hasAllAccess: response.data.hasAllAccess,
      });
      setTotalPages(response.data.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching attendances:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch attendance records');
      }
    } finally {
      setLoading(false);
    }
  }, [token, teacherId, page]);

  // Fetch attendances when page changes
  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const handleUpdateClick = (attendance) => {
    if (!attendance.canUpdate) return;
    
    navigate('/update_attendance', {
      state: {
        subjectCode: attendance.subjectCode,
        date: attendance.date,
        subjectName: attendance.subjectName,
        teacherId: teacherId
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
      timeZone: 'Asia/Kolkata',
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
              <div key={`${attendance.subjectCode}-${attendance.date}-${index}`} className="attendance-card">
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
                    aria-label={attendance.canUpdate ? 'Update attendance' : 'Update period expired'}
                  >
                    <Edit />
                    {attendance.canUpdate ? 'Update Attendance' : 'Update Expired'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <div className='paginate'>
            <PagePaginate page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendanceDashboard;