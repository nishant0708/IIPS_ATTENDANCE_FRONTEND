import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { useSemesters } from "../hooks/useSemesters";

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
  const [filtersReadyForFetch, setFiltersReadyForFetch] = useState(false);

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
  } = useSemesters();

  // Use the attendance summary hook
  const {
    attendanceSummary,
    loading: attendanceLoading,
    fetchAttendanceSummary,
    fetchWithDateFilter,
    clearAttendanceSummary,
    calculatePercentage,
    getAttendanceStatus,
  } = useAttendanceSummary();

  // Memoized section options
  const sectionOptions = useMemo(() => [
    { value: "A", label: "A" },
    { value: "B", label: "B" }
  ], []);

  const mbaSem1SectionOptions = useMemo(() => [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" }
  ], []);

  // Memoized helper functions
  const getSectionOptions = useCallback((courseKey, semesterNum) => {
    if (
      courseKey === "MBA(MS)2Years" &&
      (parseInt(semesterNum) === 1 || parseInt(semesterNum) === 2)
    ) {
      return mbaSem1SectionOptions;
    }
    return sectionOptions;
  }, [sectionOptions, mbaSem1SectionOptions]);

  const generateAcademicYears = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 2; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }
    return years;
  }, []);

  const showAlert = useCallback((msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  }, []);

  // Handle course change - fetch semesters
  useEffect(() => {
    if (course && courseConfig[course]) {
      if (fetchedSemesters.current !== course) {
        fetchSemesters(course, courseConfig)
          .then(semesters => {
            fetchedSemesters.current = course;
            if (semester && !semesters.includes(parseInt(semester)) && filtersLoaded.current) {
              setSemester("");
              if (filtersLoaded.current) {
                resetSubjects();
                setSubject("");
              }
            }
          })
          .catch(() => {
            showAlert("Failed to fetch semesters. Please try again.", true);
          });
      }
    } else {
      resetSemesters();
      fetchedSemesters.current = null;
      if (filtersLoaded.current) {
        setSemester("");
        resetSubjects();
        setSubject("");
        setSpecialization("");
        resetSpecializations();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, semester]); // Removed courseConfig, fetchSemesters, resetSemesters, resetSpecializations, resetSubjects

  // Handle section options based on course and semester
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
  }, [course, semester, section, getSectionOptions, sectionOptions]);

  // Fetch specializations when course and semester change
  useEffect(() => {
    if (course && semester && courseConfig[course]) {
      const specializationKey = `${course}-${semester}`;

      if (fetchedSpecializations.current !== specializationKey) {
        fetchSpecializations(course, semester, courseConfig)
          .then(() => {
            fetchedSpecializations.current = specializationKey;
          })
          .catch(() => {
            showAlert("Failed to fetch specializations. Please try again.", true);
          });
      }
    } else {
      resetSpecializations();
      fetchedSpecializations.current = null;
      setSpecialization("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, semester]); // Removed courseConfig, fetchSpecializations, resetSpecializations

  // Fetch subjects when course, semester, or specialization change
  useEffect(() => {
    if (course && semester && courseConfig[course]) {
      const subjectKey = hasSpecializations
        ? `${course}-${semester}-${specialization}`
        : `${course}-${semester}`;

      if (hasSpecializations) {
        if (specialization) {
          if (fetchedSubjects.current !== subjectKey) {
            fetchSubjects(course, semester, specialization, hasSpecializations, courseConfig)
              .then(subjects => {
                fetchedSubjects.current = subjectKey;
                if (subjects.length === 0 && filtersLoaded.current) {
                  showAlert("No subjects found for the selected course and semester", true);
                }
              })
              .catch(() => {
                showAlert("Failed to fetch subjects. Please try again.", true);
              });
          }
        } else {
          if (filtersLoaded.current) {
            resetSubjects();
            setSubject("");
            clearAttendanceSummary();
            fetchedSubjects.current = null;
          }
        }
      } else {
        if (fetchedSubjects.current !== subjectKey) {
          fetchSubjects(course, semester, specialization, hasSpecializations, courseConfig)
            .then(subjects => {
              fetchedSubjects.current = subjectKey;
              if (subjects.length === 0 && filtersLoaded.current) {
                showAlert("No subjects found for the selected course and semester", true);
              }
            })
            .catch(() => {
              showAlert("Failed to fetch subjects. Please try again.", true);
            });
        }
      }
    } else {
      if (filtersLoaded.current) {
        resetSubjects();
        setSubject("");
        clearAttendanceSummary();
      }
      fetchedSubjects.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, semester, specialization, hasSpecializations]); // Removed courseConfig, clearAttendanceSummary, fetchSubjects, resetSubjects

  // Load saved filters on component mount
  useEffect(() => {
    const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
    console.log("Loading saved filters:", savedFilters);

    if (savedFilters.course && !filtersLoaded.current) {
      console.log("Restoring saved filters");

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

      if (savedFilters.startDate && savedFilters.endDate) {
        setStartDate(savedFilters.startDate);
        setEndDate(savedFilters.endDate);
      }

      if (location.state?.returnFromDetail) {
        console.log("Returning from detail page, will fetch data");
        shouldFetchData.current = true;
      }

      setTimeout(() => {
        filtersLoaded.current = true;
        console.log("Filters marked as loaded");
        if (shouldFetchData.current) {
          setFiltersReadyForFetch(true);
        }
      }, 500);
    } else if (!savedFilters.course) {
      filtersLoaded.current = true;
    }
  }, [location.state]);

  // Main fetch function using the hook
  const handleFetchAttendanceSummary = useCallback(async () => {
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
  }, [
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
    fetchAttendanceSummary,
    showAlert
  ]);

  // Auto-fetch effect - triggers when filters are ready
  useEffect(() => {
    if (!filtersReadyForFetch) return;

    const allFiltersSelected = course && semester && subject && academicYear &&
      (!hasSpecializations || specialization);

    const subjectIsReady = subjects.length > 0 &&
      subjects.some(s => (s.Sub_Code || s._id) === subject);

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
      setFiltersReadyForFetch(false);
      shouldFetchData.current = false;
    }
  }, [
    filtersReadyForFetch,
    subjects,
    loadingSubjects,
    academicYear,
    course,
    handleFetchAttendanceSummary,
    hasSpecializations,
    section,
    semester,
    specialization,
    subject
  ]);

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

  const handleCourseChange = useCallback((e) => {
    const newCourse = e.target.value;
    setCourse(newCourse);
    setSemester("");
    setSpecialization("");
    setSection("");
    setSubject("");

    fetchedSemesters.current = null;
    fetchedSpecializations.current = null;
    fetchedSubjects.current = null;

    if (filtersLoaded.current) {
      clearAttendanceSummary();
      resetSubjects();
      resetSpecializations();
    }
  }, [clearAttendanceSummary, resetSubjects, resetSpecializations]);

  const handleSemesterChange = useCallback((e) => {
    setSemester(e.target.value);
    setSubject("");
    setSpecialization("");
    setSection("");

    if (filtersLoaded.current) {
      clearAttendanceSummary();
    }
  }, [clearAttendanceSummary]);

  const handleSpecializationChange = useCallback((e) => {
    setSpecialization(e.target.value);
    setSubject("");

    if (filtersLoaded.current) {
      clearAttendanceSummary();
    }
  }, [clearAttendanceSummary]);

  const handleSectionChange = useCallback((e) => {
    setSection(e.target.value);
    if (filtersLoaded.current) {
      clearAttendanceSummary();
    }
  }, [clearAttendanceSummary]);

  const handleSubjectChange = useCallback((e) => {
    setSubject(e.target.value);
  }, []);

  const handleAcademicYearChange = useCallback((e) => {
    setAcademicYear(e.target.value);
  }, []);

  const handleDateFilterApply = useCallback(async (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);

    const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
    const updatedFilters = {
      ...savedFilters,
      startDate: newStartDate,
      endDate: newEndDate,
    };
    localStorage.setItem("attendanceFilters", JSON.stringify(updatedFilters));

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
  }, [
    course,
    semester,
    subject,
    academicYear,
    specialization,
    section,
    subjects,
    hasSpecializations,
    fetchWithDateFilter,
    showAlert
  ]);

  const viewStudentDetail = useCallback((studentId) => {
    const navigationState = {
      subject: subject.trim(),
      semester: semester,
      academicYear: academicYear,
    };

    if (hasSpecializations && specialization) {
      navigationState.specialization = specialization;
    }

    if (section) {
      navigationState.section = section;
    }

    if (startDate && endDate) {
      navigationState.startDate = startDate;
      navigationState.endDate = endDate;
    }

    navigate(`/student/${studentId}`, {
      state: navigationState,
    });
  }, [subject, semester, academicYear, hasSpecializations, specialization, section, startDate, endDate, navigate]);

  const toggleTheme = useCallback(() => {
    if (theme === "light" || !theme) {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

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