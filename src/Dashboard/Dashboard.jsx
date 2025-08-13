import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Navbar from "../Navbar/Navbar";
import axios from "axios";
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";

const Dashboard = () => {
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [section, setSection] = useState(""); // New section state
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const token = localStorage.getItem("token");

  // Specialization options for MBA(MS) courses
  const mbaSpecializationOptions = [
    { value: "Core", label: "Core" },
    { value: "FA", label: "FA" },
    { value: "BA", label: "BA" },
    { value: "FB", label: "FB" },
    { value: "HA", label: "HA" },
    { value: "MA", label: "MA" }
  ];

  // Special specialization options for MBA(MS) 2yrs semester 1
  const mbaSem1SpecializationOptions = [
    { value: "Core", label: "Core" },
    { value: "Accounting-Elective", label: "Accounting-Elective" },
    { value: "QT-Elective", label: "QT-Elective" }
  ];

  // Specialization options for BCom courses
  const bcomSpecializationOptions = [
    { value: "Core", label: "Core" },
    { value: "Elective-MktMgmt", label: "Marketing Management" },
    { value: "Elective-HumanValues", label: "Human Values" },
    { value: "Elective-IFS", label: "Indian Financial System" },
    { value: "Elective-BankingInsurance", label: "Banking and Insurance" },
    { value: "Elective-CorporateRV", label: "Corporate Restructuring and Valuation" },
    { value: "Elective-BusinessAnalytics", label: "Business Analytics" },
    { value: "Project", label: "Project" }
  ];

  // Section options - default
  const sectionOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" }
  ];

  // Special section options for MBA(MS) 2yrs semester 1
  const mbaSem1SectionOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" }
  ];

  // Check if current course requires specialization
  const requiresSpecialization = (courseKey, semester) => {
    if (courseKey === "MBA(MS)-2Yrs") return true;
    if (courseKey === "MBA(MS)-5yrs" && parseInt(semester) >= 7) return true;
    if (courseKey === "BCOM") return true; // BCom also requires specialization
    return false;
  };

  // Get specialization options based on course and semester
  const getSpecializationOptions = (courseKey, semesterNum) => {
    if (courseKey === "BCOM") {
      return bcomSpecializationOptions;
    } else if (courseKey === "MBA(MS)-2Yrs") {
      // Special case for MBA(MS) 2yrs semester 1
      if (parseInt(semesterNum) === 1) {
        return mbaSem1SpecializationOptions;
      }
      return mbaSpecializationOptions;
    } else if (courseKey === "MBA(MS)-5yrs") {
      return mbaSpecializationOptions;
    }
    return [];
  };

  // Get section options based on course and semester
  const getSectionOptions = (courseKey, semesterNum) => {
    // Special case for MBA(MS) 2yrs semester 1
    if (courseKey === "MBA(MS)-2Yrs" && parseInt(semesterNum) === 1) {
      return mbaSem1SectionOptions;
    }
    // Default section options for all other cases
    return sectionOptions;
  };

  // Get current date in IST format
  const getCurrentDateIST = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    // IST is UTC+5:30, so we add 5 hours and 30 minutes to the UTC time
    const istTime = new Date(
      now.getTime() + offset * 60 * 1000 + 5.5 * 60 * 60 * 1000
    );
    return istTime.toISOString().substr(0, 10);
  };

  // Get date 5 days ago in IST format
  const getMinDateIST = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    // IST is UTC+5:30, so we add 5 hours and 30 minutes to the UTC time
    const istTime = new Date(
      now.getTime() + offset * 60 * 1000 + 5.5 * 60 * 60 * 1000
    );
    // Subtract 35 days
    istTime.setDate(istTime.getDate() - 35);
    return istTime.toISOString().substr(0, 10);
  };

  const [attendanceDate, setAttendanceDate] = useState(getCurrentDateIST());
  const [availableSectionOptions, setAvailableSectionOptions] = useState(sectionOptions);

  // Course configuration with years
  const courseConfig = {
    "MTECH(IT)": { years: 5, displayName: "MTech(IT)5Years" },
    MCA: { years: 5, displayName: "MCA(5Years)" },
    "MTECH(CS)": { years: 5, displayName: "MTech(CS)5Years" },
    "MBA(MS)-5yrs": { years: 5, displayName: "MBA(MS)5Years" },
    "MBA(MS)-2Yrs": { years: 2, displayName: "MBA(MS)2Years" },
    "MBA(ESHIP)": { years: 2, displayName: "MBA(E-Ship)" },
    "MBA(APR)": { years: 2, displayName: "MBA(APR)" },
    "MBA(TM)": { years: 5, displayName: "MBA(T)5Years" },
    BCOM: { years: 4, displayName: "BCom(Hons)3-4Years" },
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
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getsubjects`,
        {
          course: courseConfig[course]?.displayName,
          semester: semesterNum,
          specialization: requiresSpecialization(course,semester) ? specialization : null,
        },{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      );

      setSubjects(response.data || []);
      setSubject(""); // Reset subject selection

      if (response.data.length === 0) {
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

      // Reset specialization if course doesn't require it
      if (!requiresSpecialization(course, semester)) {
        setSpecialization("");
      }
    } else {
      setAvailableSemesters([]);
      setSubjects([]);
      setSubject("");
      setSpecialization("");
    }
  }, [course]);

  useEffect(() => {
    // Update available section options when course or semester changes
    if (course && semester) {
      const sectionOpts = getSectionOptions(course, semester);
      setAvailableSectionOptions(sectionOpts);
      
      // Reset section if current selection is not available in new options
      if (section && !sectionOpts.find(opt => opt.value === section)) {
        setSection("");
      }
    } else {
      setAvailableSectionOptions(sectionOptions);
    }
  }, [course, semester]);

  useEffect(() => {
    if (course && semester) {
      // Check if specialization is required for this course
      if (requiresSpecialization(course, semester)) {
        // Only fetch subjects if specialization is also selected
        if (specialization) {
          fetchSubjects(course, semester);
        } else {
          // Clear subjects and students if specialization is required but not selected
          setSubjects([]);
          setSubject("");
          setStudents([]);
        }
      } else {
        // Fetch subjects directly if no specialization is required
        fetchSubjects(course, semester);
      }
      
      // Reset students when course/semester changes (moved outside the specialization check)
      setStudents([]);
    } else {
      setSubjects([]);
      setSubject("");
      setStudents([]);
    }
  }, [course, semester, specialization]); // Added specialization as dependency

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester("");
    setStudents([]);
    setSubjects([]);
    setSubject("");
    setSpecialization("");
    setSection(""); // Reset section when course changes
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setStudents([]);
    setSubject("");
    setSpecialization(""); // Reset specialization when semester changes
    setSection(""); // Reset section when semester changes
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  const handleSpecializationChange = (e) => {
    setSpecialization(e.target.value);
    setStudents([]); // Reset students when specialization changes
  };

  const handleSectionChange = (e) => {
    setSection(e.target.value);
    setStudents([]); // Reset students when section changes
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    const minDate = getMinDateIST();
    const maxDate = getCurrentDateIST();
    
    // Validate date range
    if (selectedDate < minDate || selectedDate > maxDate) {
      showAlert("Please select a date within the last 5 days only", true);
      return;
    }
    
    setAttendanceDate(selectedDate);
  };

  const showAlert = (msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  };

  const fetchStudents = async () => {
    if (!course || !semester || !subject) {
      showAlert("Please select Course, Semester, and Subject", true);
      return;
    }

    // Check if specialization is required but not selected
    if (requiresSpecialization(course,semester) && !specialization) {
      showAlert("Please select a Specialization", true);
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        className: courseConfig[course]?.displayName,
        semester_id: semester,
        section: section || null, // Send null if section is not selected
      };

      // Add specialization to request if required
      if (requiresSpecialization(course,semester) && specialization) {
        requestData.specialization = specialization;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getByCourseAndSemester`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStudents(response.data);

      // Initialize attendance map with all students absent by default
      const initialAttendance = {};
      response.data.forEach((student) => {
        initialAttendance[student._id] = false;
      });

      setAttendanceMap(initialAttendance);

      if (response.data.length === 0) {
        showAlert("No students found for the selected criteria", true);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      showAlert("Failed to fetch students. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const submitAttendance = async () => {
    if (students.length === 0) {
      showAlert("No students to mark attendance for", true);
      return;
    }

    if (!subject) {
      showAlert("Please select a subject", true);
      return;
    }

    if (!attendanceDate) {
      showAlert("Please select a date", true);
      return;
    }

    // Additional validation for date range before submission
    const minDate = getMinDateIST();
    const maxDate = getCurrentDateIST();
    
    if (attendanceDate < minDate || attendanceDate > maxDate) {
      showAlert("Please select a date within the last 5 days only", true);
      return;
    }

    setLoading(true);

    try {
      const attendanceData = {
        courseName: courseConfig[course]?.displayName,
        semId: semester,
        subjectCode: subject.trim(),
        date: new Date(attendanceDate).toISOString(),
        section: section || null, // Send null if section is not selected
        attendance: Object.entries(attendanceMap).map(
          ([studentId, isPresent]) => ({
            studentId,
            present: isPresent,
          })
        ),
      };

      // Add specialization to attendance data if required
      if (requiresSpecialization(course,semester) && specialization) {
        attendanceData.specialization = specialization;
      }

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/markattendance`,
        attendanceData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showAlert("Attendance submitted successfully!", false);

      // Reset form after successful submission
      setSubject("");
      setStudents([]);
      setAttendanceMap({});
    } catch (error) {
      console.error("Error submitting attendance:", error);
      showAlert("Failed to submit attendance. Please try again.", true);
    } finally {
      setLoading(false);
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

  return (
    <div className={`dashboard-container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

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
              {Object.entries(courseConfig).map(([key]) => (
                <option key={key} value={key}>
                  {key}
                </option>
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
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Specialization dropdown - shown for MBA(MS) and BCom courses */}
          {requiresSpecialization(course, semester) && (
            <div className="form-group">
              <label htmlFor="specialization">Specialization:</label>
              <select
                id="specialization"
                value={specialization}
                onChange={handleSpecializationChange}
                className="form-select"
                disabled={!course || !semester}
              >
                <option value="">Select Specialization</option>
                {getSpecializationOptions(course, semester).map((spec) => (
                  <option key={spec.value} value={spec.value}>
                    {spec.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          
          <div className="form-group">
            <label htmlFor="section">Section (IF Applicable):</label>
            <select
              id="section"
              value={section}
              onChange={handleSectionChange}
              className="form-select"
            >
              <option value="">Select Section</option>
              {availableSectionOptions.map((sec) => (
                <option key={sec.value} value={sec.value}>
                  {sec.label}
                </option>
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

          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              value={attendanceDate}
              onChange={handleDateChange}
              className="form-input"
              min={getMinDateIST()}
              max={getCurrentDateIST()}
            />
          </div>

          <button
            className="btn-fetch"
            onClick={fetchStudents}
            disabled={
              loading || 
              !course || 
              !semester || 
              !subject || 
              (requiresSpecialization(course,semester) && !specialization)
            }
          >
            {loading ? "Loading..." : "Get Students"}
          </button>
        </div>

        {students.length > 0 && (
          <div className="attendance-table-container">
            <div className="attendance-info">
              <h3>
                Marking attendance for: {subject} - {subjects.find(s => s.Sub_Code === subject)?.Sub_Name}
                {requiresSpecialization(course,semester) && specialization && (
                  <span> (Specialization: {specialization})</span>
                )}
                {section && (
                  <span> (Section: {section})</span>
                )}
              </h3>
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
                {students.map((student) => (
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
              {loading ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;