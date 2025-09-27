import React, { useState, useEffect, useRef } from "react";
import "./Record.css";
import Navbar from "../Navbar/Navbar";
import axios from "axios";
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationModal from "../NotificationModel/NotificationModel";
import DateFilterModal from "../DateFilterModel/DateFilterModel";
import ExcelExportButton from "./ExcelExportButton";
import { useSubjects } from "../hooks/useSubjects";
import { useSpecializations } from "../hooks/useSpecializations";
import { useAttendance } from "../hooks/useAttendance";

const Record = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const filtersLoaded = useRef(false);
  const shouldFetchData = useRef(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availableSectionOptions, setAvailableSectionOptions] = useState([]);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const token = localStorage.getItem("token");

  // Custom hooks - using same hooks as Dashboard
  const { courseConfig, loadingCourses } = useAttendance();
  const { 
    subjects, 
    loadingSubjects, 
    fetchSubjects, 
    resetSubjects 
  } = useSubjects();
  const {
    availableSpecializations,
    hasSpecializations,
    loadingSpecializations,
    fetchSpecializations,
    resetSpecializations
  } = useSpecializations();

  // Section options - same as Dashboard
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

  // Get section options based on course and semester - same as Dashboard
  const getSectionOptions = (courseKey, semesterNum) => {
    if (courseKey === "MBA(MS)-2Yrs" && parseInt(semesterNum) === 1) {
      return mbaSem1SectionOptions;
    }
    return sectionOptions;
  };

  // Function to get available semesters based on course configuration from API
  const getAvailableSemesters = (courseKey) => {
    if (!courseKey || !courseConfig[courseKey]) return [];

    const config = courseConfig[courseKey];
    const totalSemesters = config.totalSemesters || (config.years * 2);

    const availableSems = [];
    for (let i = 1; i <= Math.min(totalSemesters, 10); i++) {
      availableSems.push(i);
    }
    return availableSems;
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

  const showAlert = (msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  };

  // Handle course change - same logic as Dashboard
  useEffect(() => {
    if (course && courseConfig[course]) {
      const semesters = getAvailableSemesters(course);
      setAvailableSemesters(semesters);

      if (semester && !semesters.includes(parseInt(semester))) {
        setSemester("");
        resetSubjects();
        setSubject("");
      }
    } else {
      setAvailableSemesters([]);
      resetSubjects();
      setSubject("");
      setSpecialization("");
      resetSpecializations();
    }
  }, [course, courseConfig]);

  // Handle section options based on course and semester - same as Dashboard
  useEffect(() => {
    if (course && semester) {
      const sectionOpts = getSectionOptions(course, semester);
      setAvailableSectionOptions(sectionOpts);
      
      if (section && !sectionOpts.find(opt => opt.value === section)) {
        setSection("");
      }
    } else {
      setAvailableSectionOptions(sectionOptions);
    }
  }, [course, semester]);

  // Fetch specializations when course and semester change - same as Dashboard
  useEffect(() => {
    if (course && semester && courseConfig[course]) {
      fetchSpecializations(course, semester, courseConfig)
        .catch(error => {
          showAlert("Failed to fetch specializations. Please try again.", true);
        });
    } else {
      resetSpecializations();
      setSpecialization("");
    }
  }, [course, semester, courseConfig]);

  // Fetch subjects when course, semester, or specialization change - same as Dashboard
  useEffect(() => {
    if (course && semester && courseConfig[course]) {
      if (hasSpecializations) {
        if (specialization) {
          fetchSubjects(course, semester, specialization, hasSpecializations, courseConfig)
            .then(subjects => {
              if (subjects.length === 0) {
                showAlert("No subjects found for the selected course and semester", true);
              }
            })
            .catch(error => {
              showAlert("Failed to fetch subjects. Please try again.", true);
            });
        } else {
          resetSubjects();
          setSubject("");
          setAttendanceSummary([]);
        }
      } else {
        fetchSubjects(course, semester, specialization, hasSpecializations, courseConfig)
          .then(subjects => {
            if (subjects.length === 0) {
              showAlert("No subjects found for the selected course and semester", true);
            }
          })
          .catch(error => {
            showAlert("Failed to fetch subjects. Please try again.", true);
          });
      }
      
      setAttendanceSummary([]);
    } else {
      resetSubjects();
      setSubject("");
      setAttendanceSummary([]);
    }
  }, [course, semester, specialization, hasSpecializations, courseConfig]);

  // Load saved filters on component mount
  useEffect(() => {
    const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
    console.log("Loading saved filters:", savedFilters);

    if (savedFilters.course && !filtersLoaded.current) {
      console.log("Restoring saved filters");
      setCourse(savedFilters.course);
      
      if (savedFilters.semester) {
        setSemester(savedFilters.semester);
      }
      
      if (savedFilters.specialization) {
        setSpecialization(savedFilters.specialization);
      }

      if (savedFilters.section) {
        setSection(savedFilters.section);
      }
      
      if (savedFilters.academicYear) {
        setAcademicYear(savedFilters.academicYear);
      }

      if (savedFilters.subject) {
        setSubject(savedFilters.subject);
      }

      // Restore date filters if saved
      if (savedFilters.startDate && savedFilters.endDate) {
        setStartDate(savedFilters.startDate);
        setEndDate(savedFilters.endDate);
      }

      filtersLoaded.current = true;

      // Set flag to fetch data if coming from detail page
      if (location.state?.returnFromDetail) {
        console.log("Returning from detail page, will fetch data");
        shouldFetchData.current = true;
      }
    }
  }, [location.state]);

  // Auto-fetch effect
  useEffect(() => {
    const allFiltersSelected = course && semester && subject && academicYear &&
      (!hasSpecializations || specialization);

    console.log("Auto-fetch check:", { 
      allFiltersSelected, 
      shouldFetch: shouldFetchData.current,
      course, 
      semester, 
      subject, 
      academicYear, 
      specialization,
      section,
      hasSpecializations
    });

    if (allFiltersSelected && shouldFetchData.current) {
      console.log("Auto-fetching attendance data");
      fetchAttendanceSummary();
      shouldFetchData.current = false;
    }
  }, [course, semester, subject, academicYear, specialization, section, subjects]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (course || semester || subject || academicYear || specialization || section || startDate || endDate) {
      const filtersToSave = {
        course,
        semester,
        subject,
        academicYear,
        specialization,
        section,
        startDate,
        endDate,
      };
      console.log("Saving filters to localStorage:", filtersToSave);
      localStorage.setItem("attendanceFilters", JSON.stringify(filtersToSave));
    }
  }, [course, semester, subject, academicYear, specialization, section, startDate, endDate]);

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester("");
    setSpecialization("");
    setSection("");
    setAttendanceSummary([]);
    resetSubjects();
    setSubject("");
    resetSpecializations();
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setAttendanceSummary([]);
    setSubject("");
    setSpecialization("");
    setSection("");
  };

  const handleSpecializationChange = (e) => {
    setSpecialization(e.target.value);
    setAttendanceSummary([]);
    setSubject("");
  };

  const handleSectionChange = (e) => {
    setSection(e.target.value);
    setAttendanceSummary([]);
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  const handleAcademicYearChange = (e) => {
    setAcademicYear(e.target.value);
  };

  const handleDateFilterApply = async (newStartDate, newEndDate) => {
    // Update state first
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Save date filter to localStorage
    const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
    const updatedFilters = {
      ...savedFilters,
      startDate: newStartDate,
      endDate: newEndDate,
    };
    localStorage.setItem("attendanceFilters", JSON.stringify(updatedFilters));
    
    // If we have attendance data, refetch with NEW date filter values
    if (course && semester && subject && academicYear) {
      await fetchAttendanceSummaryWithDates(newStartDate, newEndDate);
    }
  };

  // Function to handle fetching with specific date parameters
  const fetchAttendanceSummaryWithDates = async (startDateParam, endDateParam) => {
    if (!course || !semester || !academicYear || !subject) {
      showAlert(
        "Please select Course, Semester, Subject, and Academic Year",
        true
      );
      return;
    }

    // Check if specialization is required but not selected
    if (hasSpecializations && !specialization) {
      showAlert("Please select a Specialization", true);
      return;
    }

    setLoading(true);

    try {
      const selectedSubject = subjects.find(
        (s) => s.Sub_Code === subject || s._id === subject
      );

      const requestData = {
        course: selectedSubject?.Course_ID || "", 
        semester,
        subject: subject.trim(),
        academicYear,
      };

      // Add specialization to request if required
      if (hasSpecializations && specialization) {
        requestData.specialization = specialization;
      }

      // Add section to request if selected
      if (section) {
        requestData.section = section;
      } else {
        requestData.section = null;
      }

      // Add date filters - use parameters instead of state
      if (startDateParam && endDateParam) {
        requestData.startDate = startDateParam;
        requestData.endDate = endDateParam;
      }

      console.log("Request Data being sent:", requestData);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getAttendanceByCourseAndSubject`,
        requestData,{
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Full API Response:", response.data);

      // Extract students array from response
      const studentsData = response.data.students || response.data || [];
      

      if (studentsData.length === 0) {
        const message = startDateParam && endDateParam 
          ? `No attendance records found for the selected criteria between ${startDateParam} and ${endDateParam}`
          : "No attendance records found for the selected criteria";
        showAlert(message, true);
        setAttendanceSummary([]);
      } else {
        setAttendanceSummary(studentsData);
        console.log("Attendance Summary Set Successfully:", studentsData);
      }
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
      console.error("Error response:", error.response?.data);
      showAlert("Failed to fetch attendance summary. Please try again.", true);
      setAttendanceSummary([]);
    } finally {
      setLoading(false);
    }
  };

  // Main fetch function
  const fetchAttendanceSummary = async () => {
    await fetchAttendanceSummaryWithDates(startDate, endDate);
  };

  // Calculate attendance percentage
  const calculatePercentage = (present, total) => {
    if (!total || total === 0) return 0;
    return ((present / total) * 100).toFixed(2);
  };

  // Navigate to student detail page with section support
  const viewStudentDetail = (studentId) => {
    const navigationState = {
      subject: subject.trim(),
      semester: semester,
      academicYear: academicYear,
    };

    // Add specialization to navigation state if required
    if (hasSpecializations && specialization) {
      navigationState.specialization = specialization;
    }

    // Add section to navigation state if selected
    if (section) {
      navigationState.section = section;
    }

    // Add date filters to navigation state if they exist
    if (startDate && endDate) {
      navigationState.startDate = startDate;
      navigationState.endDate = endDate;
    }

    navigate(`/student/${studentId}`, {
      state: navigationState,
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
    <div className={`record_container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {(loading || loadingCourses) && <Loader />}

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
      
      <DateFilterModal
        isOpen={isDateFilterModalOpen}
        onClose={() => setIsDateFilterModalOpen(false)}
        onApplyFilter={handleDateFilterApply}
        currentStartDate={startDate}
        currentEndDate={endDate}
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

          <div className="record_filter-group">
            <label htmlFor="semester">Semester:</label>
            <select
              id="semester"
              value={semester}
              onChange={handleSemesterChange}
              className="record_filter-select"
              disabled={!course || loadingCourses}
            >
              <option value="">Select Semester</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {hasSpecializations && (
            <div className="record_filter-group">
              <label htmlFor="specialization">Specialization:</label>
              <select
                id="specialization"
                value={specialization}
                onChange={handleSpecializationChange}
                className="record_filter-select"
                disabled={!course || !semester || loadingSpecializations}
              >
                <option value="">
                  {loadingSpecializations ? "Loading specializations..." : "Select Specialization"}
                </option>
                {availableSpecializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="record_filter-group">
            <label htmlFor="section">Section (IF Applicable):</label>
            <select
              id="section"
              value={section}
              onChange={handleSectionChange}
              className="record_filter-select"
            >
              <option value="">Select Section</option>
              {availableSectionOptions.map((sec) => (
                <option key={sec.value} value={sec.value}>
                  {sec.label}
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
              disabled={!semester || !course || loadingSubjects || !courseConfig[course] || (hasSpecializations && !specialization)}
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
              loading || 
              loadingCourses ||
              loadingSpecializations ||
              !course || 
              !semester || 
              !academicYear || 
              !subject || 
              !courseConfig[course] ||
              (hasSpecializations && !specialization)
            }
          >
            {loading ? "Loading..." : "Get Students"}
          </button>
        </div>

        {attendanceSummary.length > 0 && (
          <div className="record_summary-table-container">
            <div className="record_export-container">
              <ExcelExportButton
                attendanceSummary={attendanceSummary}
                subjects={subjects}
                course={course}
                semester={semester}
                subject={subject}
                academicYear={academicYear}
                specialization={specialization}
                section={section}
                hasSpecializations={hasSpecializations}
                startDate={startDate}
                endDate={endDate}
                showAlert={showAlert}
              />
              <button
                disabled={true}
                className="record_btn-notify"
              >
                Send Mail For Notification
              </button>
              <button
                className={`record_btn-filter ${startDate && endDate ? 'active' : ''}`}
                onClick={() => setIsDateFilterModalOpen(true)}
              >
                {startDate && endDate ? 'Date Filter Applied' : 'Filter by Date'}
              </button>
            </div>
            
            <table className="record_summary-table">
              <thead>
                <tr className="record_table-header">
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Subject</th>
                  {hasSpecializations && specialization && <th>Specialization</th>}
                  {section && <th>Section</th>}
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
                    percentage >= 50
                      ? "Good"
                      : percentage >= 30
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
                          (s) => (s.Sub_Code || s._id) === record.subjectCode
                        )?.Sub_Name || record.subjectCode || record.subject}
                      </td>
                      {hasSpecializations && specialization && (
                        <td>{specialization}</td>
                      )}
                      {section && <td>{section}</td>}
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