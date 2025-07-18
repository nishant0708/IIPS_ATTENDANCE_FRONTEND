import React, { useState, useEffect, useRef } from "react";
import "./Record.css";
import Navbar from "../Navbar/Navbar";
import axios from "axios";
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import NotificationModal from "../NotificationModel/NotificationModel";

const Record = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const filtersLoaded = useRef(false);
  const subjectsLoaded = useRef(false);
  const shouldFetchData = useRef(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [availableSemesters, setAvailableSemesters] = useState([]);
  
  // New state for caching subjects
  const [subjectsCache, setSubjectsCache] = useState({});

  // Course configuration with years - same as Dashboard
  const courseConfig = {
    "MTECH(IT)": { years: 5, displayName: "MTech(IT)5Years" },
    MCA: { years: 5, displayName: "MCA(5Years)" },
    "MTECH(CS)": { years: 5, displayName: "MTech(CS)5Years" },
    "MBA(MS)-5yrs": { years: 5, displayName: "MBA(MS)5Years" },
    "MBA(MS)-2Yrs": { years: 2, displayName: "MBA(MS)2Years" },
    "MBA(ESHIP)": { years: 2, displayName: "MBA(ESHIP)" },
    "MBA(APR)": { years: 2, displayName: "MBA(APR)" },
    "MBA(TM)": { years: 5, displayName: "MBA(T)5Years" },
    BCOM: { years: 4, displayName: "BCom(Hons)3-4Years" },
  };

  // Function to get available semesters based on course years - same as Dashboard
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

  // Function to get cache key for subjects
  const getSubjectsCacheKey = (courseName, semesterNum) => {
    return `${courseName}_${semesterNum}`;
  };

  // Load subjects cache from localStorage
  const loadSubjectsCache = () => {
    try {
      const cachedSubjects = localStorage.getItem("subjectsCache");
      if (cachedSubjects) {
        setSubjectsCache(JSON.parse(cachedSubjects));
      }
    } catch (error) {
      console.error("Error loading subjects cache:", error);
    }
  };

  // Save subjects cache to localStorage
  const saveSubjectsCache = (cache) => {
    try {
      localStorage.setItem("subjectsCache", JSON.stringify(cache));
    } catch (error) {
      console.error("Error saving subjects cache:", error);
    }
  };

  // Function to fetch subjects from API with caching
  const fetchSubjects = async (courseName, semesterNum) => {
    if (!courseName || !semesterNum) return;

    const cacheKey = getSubjectsCacheKey(courseName, semesterNum);
    
    // Check if subjects are already cached
    if (subjectsCache[cacheKey]) {
      console.log("Using cached subjects for", cacheKey);
      setSubjects(subjectsCache[cacheKey]);
      
      // Load saved subject if it exists in cache
      const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
      if (savedFilters.subject && savedFilters.course === courseName && savedFilters.semester === semesterNum) {
        const subjectExists = subjectsCache[cacheKey].some(
          s => (s.Sub_Code || s._id) === savedFilters.subject
        );
        if (subjectExists) {
          setSubject(savedFilters.subject);
        }
      }
      return;
    }

    setLoadingSubjects(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getsubjects`,
        {
          course: courseConfig[courseName]?.displayName,
          semester: semesterNum,
        }
      );

      const subjectsData = response.data || [];
      setSubjects(subjectsData);
      
      // Cache the subjects
      const updatedCache = {
        ...subjectsCache,
        [cacheKey]: subjectsData
      };
      setSubjectsCache(updatedCache);
      saveSubjectsCache(updatedCache);

      // Load saved subject if it exists in the new data
      const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
      if (savedFilters.subject && savedFilters.course === courseName && savedFilters.semester === semesterNum) {
        const subjectExists = subjectsData.some(
          s => (s.Sub_Code || s._id) === savedFilters.subject
        );
        if (subjectExists) {
          setSubject(savedFilters.subject);
        } else {
          setSubject(""); // Reset if subject doesn't exist
        }
      } else {
        setSubject(""); // Reset subject selection
      }

      if (subjectsData.length === 0) {
        showAlert(
          "No subjects found for the selected course and semester",
          true
        );
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showAlert("Failed to fetch subjects. Please try again.", true);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Generate academic year options
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 2; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }
    return years;
  };

  // Load subjects cache on component mount
  useEffect(() => {
    loadSubjectsCache();
  }, []);

  // Update available semesters when course changes - same as Dashboard
  useEffect(() => {
    if (course) {
      const semesters = getAvailableSemesters(course);
      setAvailableSemesters(semesters);

      // Reset semester if the current one isn't available
      if (semester && !semesters.includes(parseInt(semester))) {
        setSemester("");
        setSubjects([]);
        setSubject("");
      }
    } else {
      setAvailableSemesters([]);
      setSubjects([]);
      setSubject("");
    }
  }, [course]);

  // Update subjects when course or semester changes
  useEffect(() => {
    if (course && semester) {
      fetchSubjects(course, semester);
      setAttendanceSummary([]); // Reset attendance summary when course/semester changes
    } else {
      setSubjects([]);
      setSubject("");
      setAttendanceSummary([]);
    }
  }, [course, semester, subjectsCache]); // Added subjectsCache as dependency

  // Load saved filters on component mount only once
  useEffect(() => {
    const savedFilters =
      JSON.parse(localStorage.getItem("attendanceFilters")) || {};

    if (savedFilters.course && !filtersLoaded.current) {
      setCourse(savedFilters.course);
      if (savedFilters.semester) setSemester(savedFilters.semester);
      if (savedFilters.academicYear) setAcademicYear(savedFilters.academicYear);
      // Note: Subject will be loaded in fetchSubjects function

      filtersLoaded.current = true;

      // Set flag to fetch data if coming from detail page
      if (location.state?.returnFromDetail) {
        shouldFetchData.current = true;
      }
    }
  }, [location.state]);

  // Auto fetch data when all prerequisites are met and flagged to fetch
  useEffect(() => {
    const allFiltersSelected = course && semester && subject && academicYear;

    if (allFiltersSelected && shouldFetchData.current) {
      fetchAttendanceSummary();
      shouldFetchData.current = false;
    }
  }, [course, semester, subject, academicYear]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (course || semester || subject || academicYear) {
      const filtersToSave = {
        course,
        semester,
        subject,
        academicYear,
      };
      localStorage.setItem("attendanceFilters", JSON.stringify(filtersToSave));
    }
  }, [course, semester, subject, academicYear]);

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester("");
    setAttendanceSummary([]);
    setSubjects([]);
    setSubject("");
    subjectsLoaded.current = false;
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setAttendanceSummary([]);
    setSubject("");
    subjectsLoaded.current = false;
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  const handleAcademicYearChange = (e) => {
    setAcademicYear(e.target.value);
  };

  const showAlert = (msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  };

  const fetchAttendanceSummary = async () => {
    if (!course || !semester || !academicYear || !subject) {
      showAlert(
        "Please select Course, Semester, Subject, and Academic Year",
        true
      );
      return;
    }

    setLoading(true);

    try {
      const selectedSubject = subjects.find(
        (s) => s.Sub_Code === subject || s._id === subject
      );

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getAttendanceByCourseAndSubject`,
        {
          course: selectedSubject?.Course_ID || "", // Correct Course_ID like "C1"
          semester,
          subject: subject.trim(),
          academicYear,
        }
      );

      if (response.data.length === 0) {
        showAlert(
          "No attendance records found for the selected criteria",
          true
        );
      } else {
        setAttendanceSummary(response.data);
      }
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
      showAlert("Failed to fetch attendance summary. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance percentage
  const calculatePercentage = (present, total) => {
    if (!total) return 0;
    return ((present / total) * 100).toFixed(2);
  };

  // Navigate to student detail page
  const viewStudentDetail = (studentId) => {
    navigate(`/student/${studentId}`, {
      state: {
        subject: subject.trim(),
        semester: semester,
        academicYear: academicYear,
      },
    });
  };

  // Open notification modal
  const openNotificationModal = () => {
    if (attendanceSummary.length === 0) {
      showAlert("No student data available to send notifications", true);
      return;
    }
    setIsNotificationModalOpen(true);
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (attendanceSummary.length === 0) {
      showAlert("No data to export", true);
      return;
    }

    try {
      const subjectName =
        subjects.find((s) => (s.Sub_Code || s._id) === subject)?.Sub_Name ||
        subject;

      const worksheetData = attendanceSummary.map((record) => {
        const percentage = calculatePercentage(
          record.classesAttended,
          record.totalClasses
        );
        const status =
          percentage >= 75 ? "Good" : percentage >= 65 ? "Warning" : "Critical";

        return {
          "Roll Number": record.rollNumber,
          "Student Name": record.studentName,
          Subject:
            subjects.find((s) => (s.Sub_Code || s._id) === record.subject)
              ?.Sub_Name || record.subject,
          "Classes Attended": record.classesAttended,
          "Total Classes": record.totalClasses,
          "Attendance %": `${percentage}%`,
          Status: status,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Make the first row bold
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true },
        };
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Summary");

      const fileName = `${course}_${semester}Sem_${subjectName}_${academicYear}_Attendance.xlsx`;

      XLSX.writeFile(workbook, fileName);

      showAlert("Export successful!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showAlert("Failed to export data. Please try again.", true);
    }
  };

  const toggleTheme = () => {
    if (theme === "light" || !theme) {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
  };

  // Function to clear subjects cache (optional - for debugging/maintenance)
  const clearSubjectsCache = () => {
    setSubjectsCache({});
    localStorage.removeItem("subjectsCache");
    console.log("Subjects cache cleared");
  };

  return (
    <div className={`record_container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {loading && <Loader />}

      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
        iserror={isError}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        attendanceSummary={attendanceSummary}
      />

      <div className="record_summary-section">
        <h2>Attendance Record</h2>

        <div className="record_filter-row">
          <div className="record_filter-group">
            <label htmlFor="course">Course:</label>
            <select
              id="course"
              value={course}
              onChange={handleCourseChange}
              className="record_filter-select"
            >
              <option value="">Select Course</option>
              {Object.entries(courseConfig).map(([key]) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div className="record_filter-group">
            <label htmlFor="semester">Semester:</label>
            <select
              id="semester"
              value={semester}
              onChange={handleSemesterChange}
              className="record_filter-select"
              disabled={!course}
            >
              <option value="">Select Semester</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="record_filter-group">
            <label htmlFor="subject">Subject:</label>
            <select
              id="subject"
              value={subject}
              onChange={handleSubjectChange}
              className="record_filter-select"
              disabled={!semester || !course || loadingSubjects}
            >
              <option value="">
                {loadingSubjects ? "Loading subjects..." : "Select Subject"}
              </option>
              {subjects.map((sub) => (
                <option
                  key={sub.Sub_Code || sub._id}
                  value={sub.Sub_Code || sub._id}
                >
                  {sub.Sub_Name}
                </option>
              ))}
            </select>
          </div>

          <div className="record_filter-group">
            <label htmlFor="academicYear">Academic Year:</label>
            <select
              id="academicYear"
              value={academicYear}
              onChange={handleAcademicYearChange}
              className="record_filter-select"
            >
              <option value="">Select Academic Year</option>
              {generateAcademicYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            className="record_btn-fetch"
            onClick={fetchAttendanceSummary}
            disabled={
              loading || !course || !semester || !academicYear || !subject
            }
          >
            Get Students
          </button>
        </div>

        {attendanceSummary.length > 0 && (
          <div className="record_summary-table-container">
            <div className="record_export-container">
              <button className="record_btn-export" onClick={exportToExcel}>
                Export to Excel
              </button>
              <button
                disabled={true}
                className="record_btn-notify"
                //onClick={openNotificationModal}
              >
                Send Mail For Notification
              </button>
            </div>
            <table className="record_summary-table">
              <thead>
                <tr className="record_table-header">
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Subject</th>
                  <th>Classes Attended</th>
                  <th>Total Classes</th>
                  <th>Attendance %</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendanceSummary.map((record, index) => {
                  const percentage = calculatePercentage(
                    record.classesAttended,
                    record.totalClasses
                  );
                  const status =
                    percentage >= 75
                      ? "Good"
                      : percentage >= 65
                      ? "Warning"
                      : "Critical";

                  return (
                    <tr
                      key={index}
                      className={`record_status-${status.toLowerCase()} ${theme}`}
                    >
                      <td>{record.rollNumber}</td>
                      <td>{record.studentName}</td>
                      <td>
                        {subjects.find(
                          (s) => (s.Sub_Code || s._id) === record.subject
                        )?.Sub_Name || record.subject}
                      </td>
                      <td>{record.classesAttended}</td>
                      <td>{record.totalClasses}</td>
                      <td>{percentage}%</td>
                      <td>{status}</td>
                      <td>
                        <button
                          className="record_btn-view-details"
                          onClick={() => viewStudentDetail(record.studentId)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Record;