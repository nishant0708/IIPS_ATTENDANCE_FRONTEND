import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Navbar from '../Navbar/Navbar';
import axios from 'axios';
import Loader from '../Loader/Loader';
import AlertModal from '../AlertModal/AlertModal';

const Dashboard = () => {
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Get current date in IST format
  const getCurrentDateIST = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    // IST is UTC+5:30, so we add 5 hours and 30 minutes to the UTC time
    const istTime = new Date(now.getTime() + (offset * 60 * 1000) + (5.5 * 60 * 60 * 1000));
    return istTime.toISOString().substr(0, 10);
  };

  const [attendanceDate, setAttendanceDate] = useState(getCurrentDateIST());

  // Course configuration with years
  const courseConfig = {
    'MTECH(IT)': { years: 5, displayName: 'MTECH(IT)' },
    'MCA': { years: 5, displayName: 'MCA' },
    'MTECH(CS)': { years: 5, displayName: 'MTECH(CS)' },
    'MBA(MS)-5yrs': { years: 5, displayName: 'MBA(MS)-5yrs' },
    'MBA(MS)-2Yrs': { years: 2, displayName: 'MBA(MS)-2Yrs' },
    'MBA(ESHIP)': { years: 2, displayName: 'MBA(ESHIP)' },
    'MBA(APR)': { years: 2, displayName: 'MBA(APR)' },
    'MBA(TM)': { years: 5, displayName: 'MBA(TM)' },
    'BCOM': { years: 4, displayName: 'BCOM' }
  };

  // Function to get available semesters based on course years
  const getAvailableSemesters = (courseKey) => {
    if (!courseKey || !courseConfig[courseKey]) return [];
    
    const years = courseConfig[courseKey].years;
    const totalSemesters = years * 2; // Each year has 2 semesters
    
    const availableSems = [];
    for (let i = 1; i <= Math.min(totalSemesters, 10); i++) {
      availableSems.push(i);
    }
    return availableSems;
  };

  // Function to fetch subjects from API
  const fetchSubjects = async (courseName, semesterNum) => {
    if (!courseName || !semesterNum) return;
    
    setLoadingSubjects(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/attendance/getsubjects`, {
        course: courseName,
        semester: semesterNum
      });
      
      setSubjects(response.data || []);
      setSubject(''); // Reset subject selection
      
      if (response.data.length === 0) {
        showAlert('No subjects found for the selected course and semester', true);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showAlert('Failed to fetch subjects. Please try again.', true);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    if (course) {
      const semesters = getAvailableSemesters(course);
      setAvailableSemesters(semesters);
      
      // Reset semester if the current one isn't available
      if (semester && !semesters.includes(parseInt(semester))) {
        setSemester('');
        setSubjects([]);
        setSubject('');
      }
    } else {
      setAvailableSemesters([]);
      setSubjects([]);
      setSubject('');
    }
  }, [course]);

  useEffect(() => {
    if (course && semester) {
      fetchSubjects(course, semester);
      setStudents([]); // Reset students when course/semester changes
    } else {
      setSubjects([]);
      setSubject('');
      setStudents([]);
    }
  }, [course, semester]);

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester('');
    setStudents([]);
    setSubjects([]);
    setSubject('');
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setStudents([]);
    setSubject('');
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  const handleDateChange = (e) => {
    setAttendanceDate(e.target.value);
  };

  const showAlert = (msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  };

  const fetchStudents = async () => {
    if (!course || !semester || !subject) {
      showAlert('Please select Course, Semester, and Subject', true);
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/attendance/getByCourseAndSemester`, {
        className: course,
        semester: semester
      });
      
      setStudents(response.data);
      
      // Initialize attendance map with all students absent by default
      const initialAttendance = {};
      response.data.forEach(student => {
        initialAttendance[student._id] = false;
      });
      
      setAttendanceMap(initialAttendance);
      
      if (response.data.length === 0) {
        showAlert('No students found for the selected criteria', true);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showAlert('Failed to fetch students. Please try again.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const submitAttendance = async () => {
    if (students.length === 0) {
      showAlert('No students to mark attendance for', true);
      return;
    }

    if (!subject) {
      showAlert('Please select a subject', true);
      return;
    }

    if (!attendanceDate) {
      showAlert('Please select a date', true);
      return;
    }

    setLoading(true);
    
    try {
      const attendanceData = {
        course,
        semester: `${semester}th_sem`,
        subject,
        date: new Date(attendanceDate).toISOString(),
        attendance: Object.entries(attendanceMap).map(([studentId, isPresent]) => ({
          studentId,
          present: isPresent
        }))
      };
      
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/attendance/markattendance`, attendanceData);
      showAlert('Attendance submitted successfully!', false);
      
      // Reset form after successful submission
      setSubject('');
      setStudents([]);
      setAttendanceMap({});
    } catch (error) {
      console.error('Error submitting attendance:', error);
      showAlert('Failed to submit attendance. Please try again.', true);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    if(theme === 'light' || !theme){
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
    else{
      setTheme('light');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className={`dashboard-container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme}/>
      
      {loading && <Loader />}
      
      <AlertModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        message={modalMessage} 
        iserror={isError} 
      />
      
      <div className="attendance-section">
        <h2>Mark Attendance</h2>
        
        <div className="filter-controls">
          <div className="form-group">
            <label htmlFor="course">Course:</label>
            <select 
              id="course" 
              value={course} 
              onChange={handleCourseChange}
              className="form-select"
            >
              <option value="">Select Course</option>
              {Object.entries(courseConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.displayName}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="semester">Semester:</label>
            <select 
              id="semester" 
              value={semester} 
              onChange={handleSemesterChange}
              className="form-select"
              disabled={!course}
            >
              <option value="">Select Semester</option>
              {availableSemesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <select 
              id="subject" 
              value={subject} 
              onChange={handleSubjectChange}
              className="form-select"
              disabled={!semester || !course || loadingSubjects}
            >
              <option value="">
                {loadingSubjects ? 'Loading subjects...' : 'Select Subject'}
              </option>
              {subjects.map(sub => (
                <option key={sub.code || sub._id} value={sub.code || sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              value={attendanceDate}
              onChange={handleDateChange}
              className="form-input"
            />
          </div>
          
          <button 
            className="btn-fetch" 
            onClick={fetchStudents}
            disabled={loading || !course || !semester || !subject}
          >
            {loading ? 'Loading...' : 'Get Students'}
          </button>
        </div>
        
        {students.length > 0 && (
          <div className="attendance-table-container">
            <div className="attendance-info">
              <h3>Marking attendance for: {subject} - {subjects.find(s => (s.code || s._id) === subject)?.name}</h3>
              <p>Date: {new Date(attendanceDate).toLocaleDateString()}</p>
            </div>
            
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Attendance</th>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student._id}>
                    <td>
                      <label className="attendance-checkbox">
                        <input 
                          type="checkbox"
                          checked={attendanceMap[student._id] || false}
                          onChange={() => handleAttendanceChange(student._id)}
                        />
                      </label>
                    </td>
                    <td>{student.rollNumber}</td>
                    <td>{student.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button 
              className="btn-submit" 
              onClick={submitAttendance}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Attendance'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;