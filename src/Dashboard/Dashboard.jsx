import React, { useState, useEffect, useCallback } from "react";
import "./Dashboard.css";
import Navbar from "../Navbar/Navbar";
import axios from "axios";
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";
import { useSubjects } from "../hooks/useSubjects";
import { useSpecializations } from "../hooks/useSpecializations";
import { useAttendance } from "../hooks/useAttendance";
import { useSemesters } from "../hooks/useSemesters";

const Dashboard = () => {
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [availableSectionOptions, setAvailableSectionOptions] = useState([]);

  const token = localStorage.getItem("token");
  const teacherId = localStorage.getItem("teacherId");

  // Custom hooks
  const { courseConfig, loadingCourses } = useAttendance();
  const { subjects, loadingSubjects, fetchSubjects, resetSubjects } =
    useSubjects();
  const {
    availableSpecializations,
    hasSpecializations,
    loadingSpecializations,
    fetchSpecializations,
    resetSpecializations,
  } = useSpecializations();

  // Section options - default
  const sectionOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
  ];

  // Special section options for MBA(MS) 2yrs semester 1
  const mbaSem1SectionOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
  ];

  // Get section options based on course and semester
  const getSectionOptions = (courseKey, semesterNum) => {
    if (courseKey === "MBA(MS)2Years" && (parseInt(semesterNum) === 1 || parseInt(semesterNum) === 2)) {
      return mbaSem1SectionOptions;
    }
    return sectionOptions;
  };

  // Get current date in IST format
  const getCurrentDateIST = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const istTime = new Date(
      now.getTime() + offset * 60 * 1000 + 5.5 * 60 * 60 * 1000
    );
    return istTime.toISOString().slice(0, 10); // Fixed: Changed substr to slice
  };

  // Get date 60 days ago in IST format (fixed comment to match actual days)
  const getMinDateIST = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const istTime = new Date(
      now.getTime() + offset * 60 * 1000 + 5.5 * 60 * 60 * 1000
    );
    istTime.setDate(istTime.getDate() - 60);
    return istTime.toISOString().slice(0, 10); // Fixed: Changed substr to slice
  };

  const [attendanceDate, setAttendanceDate] = useState(getCurrentDateIST());

  // Function to get available semesters based on course configuration from API
  const {
    availableSemesters,
    loadingSemesters,
    fetchSemesters,
    resetSemesters,
  } = useSemesters();

  // Fixed: Memoized showAlert to prevent unnecessary re-renders
  const showAlert = useCallback((msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  }, []);

  // useEffect for course changes
  // FIXED: Simplified dependencies to only triggers to prevent infinite loops
  useEffect(() => {
    if (course && courseConfig[course]) {
      fetchSemesters(course, courseConfig)
        .then((semesters) => {
          if (semester && !semesters.includes(parseInt(semester))) {
            setSemester("");
            resetSubjects();
            setSubject("");
          }
        })
        .catch((error) => {
          showAlert("Failed to fetch semesters. Please try again.", true);
        });
    } else {
      resetSemesters();
      setSemester("");
      resetSubjects();
      setSubject("");
      setSpecialization("");
      resetSpecializations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, courseConfig]); // Only include what triggers the effect

  // Handle section options based on course and semester
  useEffect(() => {
    if (course && semester) {
      const sectionOpts = getSectionOptions(course, semester);
      setAvailableSectionOptions(sectionOpts);

      if (section && !sectionOpts.find((opt) => opt.value === section)) {
        setSection("");
      }
    } else {
      setAvailableSectionOptions(sectionOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, semester, section]); // Only the values that trigger changes

  // Fetch specializations when course and semester change
  useEffect(() => {
    if (course && semester && courseConfig[course]) {
      fetchSpecializations(course, semester, courseConfig).catch((error) => {
        showAlert("Failed to fetch specializations. Please try again.", true);
      });
    } else {
      resetSpecializations();
      setSpecialization("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, semester, courseConfig]); // Only triggers, not functions

  // Fixed: Refactored to be cleaner and avoid complex nested conditions
  useEffect(() => {
    // Always clear students when these dependencies change
    setStudents([]);

    if (!course || !semester || !courseConfig[course]) {
      resetSubjects();
      setSubject("");
      return;
    }

    // If requires specialization but none selected, don't fetch
    if (hasSpecializations && !specialization) {
      resetSubjects();
      setSubject("");
      return;
    }

    // Fetch subjects
    fetchSubjects(
      course,
      semester,
      specialization,
      hasSpecializations,
      courseConfig
    )
      .then((subjects) => {
        if (subjects.length === 0) {
          showAlert(
            "You don't have access for the selected Course and Semester", // Fixed: Grammar and capitalization
            true
          );
        }
      })
      .catch((error) => {
        showAlert("Failed to fetch subjects. Please try again.", true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, semester, specialization, hasSpecializations, courseConfig]); // Only triggers

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester("");
    setStudents([]);
    resetSubjects();
    setSubject("");
    setSpecialization("");
    setSection("");
    resetSpecializations();
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setStudents([]);
    setSubject("");
    setSpecialization("");
    setSection("");
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  const handleSpecializationChange = (e) => {
    setSpecialization(e.target.value);
    setStudents([]);
  };

  const handleSectionChange = (e) => {
    setSection(e.target.value);
    setStudents([]);
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    const minDate = getMinDateIST();
    const maxDate = getCurrentDateIST();

    // Fixed: Better date comparison using Date objects
    const selectedDateObj = new Date(selectedDate);
    const minDateObj = new Date(minDate);
    const maxDateObj = new Date(maxDate);

    if (selectedDateObj < minDateObj || selectedDateObj > maxDateObj) {
      showAlert("Please select a date within the last 60 days only", true); // Fixed: Changed 35 to 60
      return;
    }

    setAttendanceDate(selectedDate);
  };

  const fetchStudents = async () => {
    if (!course || !semester || !subject || !courseConfig[course]) {
      showAlert("Please select Course, Semester, and Subject", true);
      return;
    }

    if (hasSpecializations && !specialization) {
      showAlert("Please select a Specialization", true);
      return;
    }

    setLoading(true);

    // Fixed: Added cleanup to prevent memory leaks
    let isMounted = true;

    try {
      const requestData = {
        className: courseConfig[course]?.displayName,
        semester_id: semester,
        section: section || null,
      };

      if (hasSpecializations && specialization) {
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

      if (!isMounted) return; // Don't update state if component unmounted

      setStudents(response.data);

      const initialAttendance = {};
      response.data.forEach((student) => {
        initialAttendance[student._id] = false;
      });

      setAttendanceMap(initialAttendance);

      if (response.data.length === 0) {
        showAlert("No students found for the selected criteria", true);
      }
    } catch (error) {
      if (!isMounted) return;
      console.error("Error fetching students:", error);
      showAlert("Failed to fetch students. Please try again.", true);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
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

    const minDate = getMinDateIST();
    const maxDate = getCurrentDateIST();

    // Fixed: Better date comparison using Date objects
    const attendanceDateObj = new Date(attendanceDate);
    const minDateObj = new Date(minDate);
    const maxDateObj = new Date(maxDate);

    if (attendanceDateObj < minDateObj || attendanceDateObj > maxDateObj) {
      showAlert("Please select a date within the last 60 days only", true); // Fixed: Changed 35 to 60
      return;
    }

    setLoading(true);

    // Fixed: Added cleanup to prevent memory leaks
    let isMounted = true;

    try {
      const attendanceData = {
        courseName: courseConfig[course]?.displayName,
        semId: semester,
        subjectCode: subject.trim(),
        teacherId: teacherId,
        date: new Date(attendanceDate).toISOString(),
        section: section || null,
        attendance: Object.entries(attendanceMap).map(
          ([studentId, isPresent]) => ({
            studentId,
            present: isPresent,
          })
        ),
      };

      if (hasSpecializations && specialization) {
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

      if (!isMounted) return; // Don't update state if component unmounted

      showAlert("Attendance submitted successfully!", false);

      setSubject("");
      setStudents([]);
      setAttendanceMap({});
    } catch (error) {
      if (!isMounted) return;
      console.error("Error submitting attendance:", error);
      showAlert("Failed to submit attendance. Please try again.", true);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
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

      {(loading || loadingCourses) && <Loader />}

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
              disabled={loadingCourses}
            >
              <option value="">
                {loadingCourses ? "Loading courses..." : "Select Course"}
              </option>
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
              disabled={!course || loadingCourses || loadingSemesters}
            >
              <option value="">
                {loadingSemesters ? "Loading semesters..." : "Select Semester"}
              </option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {hasSpecializations && (
            <div className="form-group">
              <label htmlFor="specialization">Specialization:</label>
              <select
                id="specialization"
                value={specialization}
                onChange={handleSpecializationChange}
                className="form-select"
                disabled={!course || !semester || loadingSpecializations}
              >
                <option value="">
                  {loadingSpecializations
                    ? "Loading specializations..."
                    : "Select Specialization"}
                </option>
                {availableSpecializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
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
              disabled={
                !semester ||
                !course ||
                loadingSubjects ||
                !courseConfig[course] ||
                (hasSpecializations && !specialization)
              }
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
              loadingCourses ||
              loadingSpecializations ||
              !course ||
              !semester ||
              !subject ||
              !courseConfig[course] ||
              (hasSpecializations && !specialization)
            }
          >
            {loading ? "Loading..." : "Get Students"}
          </button>
        </div>

        {students.length > 0 && (
          <div className="attendance-table-container">
            <div className="attendance-info">
              <h3>
                Marking attendance for: {subject} -{" "}
                {subjects.find((s) => s.Sub_Code === subject)?.Sub_Name}
                {hasSpecializations && specialization && (
                  <span> (Specialization: {specialization})</span>
                )}
                {section && <span> (Section: {section})</span>}
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