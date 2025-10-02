import React, { useState, useEffect, useRef } from "react";
import "./Record.css";
import Navbar from "../Navbar/Navbar";
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationModal from "../NotificationModel/NotificationModel";
import DateFilterModal from "../DateFilterModel/DateFilterModel";
import ExcelExportButton from "./ExcelExportButton";
import { useSubjects } from "../hooks/useSubjects";
import { useSpecializations } from "../hooks/useSpecializations";
import { useAttendance } from "../hooks/useAttendance";
import { useAttendanceSummary } from "../hooks/useAttendanceSummary";
import { useSemesters } from "../hooks/useSemesters"; // Import the new hook

const Record = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const filtersLoaded = useRef(false);
  const shouldFetchData = useRef(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [availableSectionOptions, setAvailableSectionOptions] = useState([]);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersReadyForFetch, setFiltersReadyForFetch] = useState(false); // New state to trigger fetch
  
  // Track what's been fetched to avoid duplicate API calls
  const fetchedSemesters = useRef(null);
  const fetchedSpecializations = useRef(null);
  const fetchedSubjects = useRef(null);

  // Custom hooks
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
  const { 
    availableSemesters, 
    loadingSemesters, 
    fetchSemesters, 
    resetSemesters 
  } = useSemesters(); // Use the new hook
  
  // Use the attendance summary hook
  const {
    attendanceSummary,
    loading: attendanceLoading,
    error: attendanceError,
    fetchAttendanceSummary,
    fetchWithDateFilter,
    clearAttendanceSummary,
    calculatePercentage,
    getAttendanceStatus,
    getAttendanceStats
  } = useAttendanceSummary();

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

  // Handle course change - updated to use hook with memoization
  useEffect(() => {
    if (course && courseConfig[course]) {
      // Check if we already fetched semesters for this course
      if (fetchedSemesters.current !== course) {
        fetchSemesters(course, courseConfig)
          .then(semesters => {
            fetchedSemesters.current = course;
            // Only reset semester if it's not in the accessible list AND filters have been loaded
            if (semester && !semesters.includes(parseInt(semester)) && filtersLoaded.current) {
              setSemester("");
              if (filtersLoaded.current) {
                resetSubjects();
                setSubject("");
              }
            }
          })
          .catch(error => {
            showAlert("Failed to fetch semesters. Please try again.", true);
          });
      }
    } else {
      resetSemesters();
      fetchedSemesters.current = null;
      // Only reset if filters were already loaded (not initial mount)
      if (filtersLoaded.current) {
        setSemester("");
        resetSubjects();
        setSubject("");
        setSpecialization("");
        resetSpecializations();
      }
    }
  }, [course, courseConfig, fetchSemesters]);

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

  // Fetch specializations when course and semester change - with memoization
  useEffect(() => {
    if (course && semester && courseConfig[course]) {
      const specializationKey = `${course}-${semester}`;
      
      // Check if we already fetched specializations for this course/semester combo
      if (fetchedSpecializations.current !== specializationKey) {
        fetchSpecializations(course, semester, courseConfig)
          .then(() => {
            fetchedSpecializations.current = specializationKey;
          })
          .catch(error => {
            showAlert("Failed to fetch specializations. Please try again.", true);
          });
      }
    } else {
      resetSpecializations();
      fetchedSpecializations.current = null;
      setSpecialization("");
    }
  }, [course, semester, courseConfig]);

  // Fetch subjects when course, semester, or specialization change - with memoization
  useEffect(() => {
    if (course && semester && courseConfig[course]) {
      const subjectKey = hasSpecializations 
        ? `${course}-${semester}-${specialization}` 
        : `${course}-${semester}`;
      
      if (hasSpecializations) {
        if (specialization) {
          // Only fetch if we haven't fetched this combination before
          if (fetchedSubjects.current !== subjectKey) {
            fetchSubjects(course, semester, specialization, hasSpecializations, courseConfig)
              .then(subjects => {
                fetchedSubjects.current = subjectKey;
                if (subjects.length === 0 && filtersLoaded.current) {
                  showAlert("No subjects found for the selected course and semester", true);
                }
              })
              .catch(error => {
                showAlert("Failed to fetch subjects. Please try again.", true);
              });
          }
        } else {
          // Only reset if not restoring filters
          if (filtersLoaded.current) {
            resetSubjects();
            setSubject("");
            clearAttendanceSummary();
            fetchedSubjects.current = null;
          }
        }
      } else {
        // Only fetch if we haven't fetched this combination before
        if (fetchedSubjects.current !== subjectKey) {
          fetchSubjects(course, semester, specialization, hasSpecializations, courseConfig)
            .then(subjects => {
              fetchedSubjects.current = subjectKey;
              if (subjects.length === 0 && filtersLoaded.current) {
                showAlert("No subjects found for the selected course and semester", true);
              }
            })
            .catch(error => {
              showAlert("Failed to fetch subjects. Please try again.", true);
            });
        }
      }
    } else {
      // Only reset if not during initial load
      if (filtersLoaded.current) {
        resetSubjects();
        setSubject("");
        clearAttendanceSummary();
      }
      fetchedSubjects.current = null;
    }
  }, [course, semester, specialization, hasSpecializations, courseConfig]);

  // Load saved filters on component mount
  useEffect(() => {
    const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
    console.log("Loading saved filters:", savedFilters);

    if (savedFilters.course && !filtersLoaded.current) {
      console.log("Restoring saved filters");
      
      // Reset fetch tracking to allow fresh fetches for restored filters
      fetchedSemesters.current = null;
      fetchedSpecializations.current = null;
      fetchedSubjects.current = null;
      
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

      // Set flag to fetch data if coming from detail page
      if (location.state?.returnFromDetail) {
        console.log("Returning from detail page, will fetch data");
        shouldFetchData.current = true;
      }
      
      // Use setTimeout to mark filters as loaded after React finishes rendering
      // and all API calls (semesters, specializations, subjects) complete
      setTimeout(() => {
        filtersLoaded.current = true;
        console.log("Filters marked as loaded");
        // Trigger the fetch check
        if (shouldFetchData.current) {
          setFiltersReadyForFetch(true);
        }
      }, 500);
    } else if (!savedFilters.course) {
      // If no saved filters, mark as loaded immediately
      filtersLoaded.current = true;
    }
  }, [location.state]);

  // Auto-fetch effect - triggers when filters are ready
  useEffect(() => {
    if (!filtersReadyForFetch) return;

    const allFiltersSelected = course && semester && subject && academicYear &&
      (!hasSpecializations || specialization);

    // Check if subjects array has loaded and includes the selected subject
    const subjectIsReady = subjects.length > 0 && 
      subjects.some(s => (s.Sub_Code || s._id) === subject);

    // Also check that we're not currently loading subjects
    const notLoadingSubjects = !loadingSubjects;

    console.log("Auto-fetch triggered by filtersReadyForFetch:", { 
      allFiltersSelected, 
      subjectIsReady,
      notLoadingSubjects,
      course, 
      semester, 
      subject, 
      academicYear, 
      specialization,
      section,
      hasSpecializations,
      subjectsCount: subjects.length
    });

    if (allFiltersSelected && subjectIsReady && notLoadingSubjects) {
      console.log("Executing auto-fetch now!");
      handleFetchAttendanceSummary();
      // Reset the flag
      setFiltersReadyForFetch(false);
      shouldFetchData.current = false;
    }
  }, [filtersReadyForFetch, subjects, loadingSubjects]);

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
    const newCourse = e.target.value;
    setCourse(newCourse);
    setSemester("");
    setSpecialization("");
    setSection("");
    setSubject("");
    
    // Clear the fetch tracking when user manually changes course
    fetchedSemesters.current = null;
    fetchedSpecializations.current = null;
    fetchedSubjects.current = null;
    
    // Only clear and reset if user is manually changing
    if (filtersLoaded.current) {
      clearAttendanceSummary();
      resetSubjects();
      resetSpecializations();
    }
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setSubject("");
    setSpecialization("");
    setSection("");
    
    // Only clear if user is manually changing (not during filter restoration)
    if (filtersLoaded.current) {
      clearAttendanceSummary();
    }
  };

  const handleSpecializationChange = (e) => {
    setSpecialization(e.target.value);
    setSubject("");
    
    // Only clear if user is manually changing (not during filter restoration)
    if (filtersLoaded.current) {
      clearAttendanceSummary();
    }
  };

  const handleSectionChange = (e) => {
    setSection(e.target.value);
    // Only clear if user is manually changing (not during filter restoration)
    if (filtersLoaded.current) {
      clearAttendanceSummary();
    }
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  const handleAcademicYearChange = (e) => {
    setAcademicYear(e.target.value);
  };

  // Main fetch function using the hook
  const handleFetchAttendanceSummary = async () => {
    const result = await fetchAttendanceSummary({
      course,
      semester,
      subject,
      academicYear,
      specialization,
      section,
      startDate,
      endDate,
      subjects,
      hasSpecializations,
      onError: showAlert
    });

    return result;
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
    
    // If we have the required filters, refetch with NEW date filter values
    if (course && semester && subject && academicYear) {
      await fetchWithDateFilter({
        course,
        semester,
        subject,
        academicYear,
        specialization,
        section,
        subjects,
        hasSpecializations,
        onError: showAlert
      }, newStartDate, newEndDate);
    }
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

  // Get attendance statistics for display
  const stats = getAttendanceStats();

  return (
    <div className={`record_container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {(attendanceLoading || loadingCourses || loadingSemesters) && <Loader />}

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
            onClick={handleFetchAttendanceSummary}
            disabled={
              attendanceLoading || 
              loadingCourses ||
              loadingSemesters ||
              loadingSpecializations ||
              !course || 
              !semester || 
              !academicYear || 
              !subject || 
              !courseConfig[course] ||
              (hasSpecializations && !specialization)
            }
          >
            {attendanceLoading ? "Loading..." : "Get Students"}
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
                  const status = getAttendanceStatus(
                    record.classesAttended,
                    record.totalClasses
                  );

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