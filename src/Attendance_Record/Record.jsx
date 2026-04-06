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
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const shouldFetchData = useRef(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [availableSectionOptions, setAvailableSectionOptions] = useState([]);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersReadyForFetch, setFiltersReadyForFetch] = useState(false);

  // Prevents downstream effects from clearing values while restoring
  const isRestoringFilters = useRef(false);
  // Holds saved filters until courseConfig is ready to accept them
  const pendingRestoredFilters = useRef(null);

  const fetchedSemesters = useRef(null);
  const fetchedSpecializations = useRef(null);
  const fetchedSubjects = useRef(null);

  const { courseConfig, loadingCourses } = useAttendance();
  const { subjects, loadingSubjects, fetchSubjects, resetSubjects } = useSubjects();
  const {
    availableSpecializations,
    hasSpecializations,
    loadingSpecializations,
    fetchSpecializations,
    resetSpecializations,
  } = useSpecializations();
  const { availableSemesters, loadingSemesters, fetchSemesters, resetSemesters } = useSemesters();
  const {
    attendanceSummary,
    loading: attendanceLoading,
    fetchAttendanceSummary,
    fetchWithDateFilter,
    clearAttendanceSummary,
    calculatePercentage,
    getAttendanceStatus,
  } = useAttendanceSummary();

  const sectionOptions = useMemo(() => [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
  ], []);

  const mbaSem1SectionOptions = useMemo(() => [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
  ], []);

  const getSectionOptions = useCallback((courseKey, semesterNum) => {
    if (courseKey === "MBA(MS)2Years" && (parseInt(semesterNum) === 1 || parseInt(semesterNum) === 2)) {
      return mbaSem1SectionOptions;
    }
    return sectionOptions;
  }, [sectionOptions, mbaSem1SectionOptions]);

  const generateAcademicYears = useCallback(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 2 }, (_, i) => {
      const s = currentYear - i;
      return `${s}-${s + 1}`;
    });
  }, []);

  const showAlert = useCallback((msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  }, []);

  // ── STEP 1: On mount, read localStorage but don't apply yet ──────────────────
  // courseConfig may not be loaded yet, so we park the saved filters in a ref.
  useEffect(() => {
    const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
    if (savedFilters.course) {
      pendingRestoredFilters.current = savedFilters;
      if (location.state?.returnFromDetail) {
        shouldFetchData.current = true;
      }
    } else {
      setFiltersLoaded(true); // nothing to restore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once

  // ── STEP 2: Apply saved filters once courseConfig is ready ────────────────────
  useEffect(() => {
    if (loadingCourses || !courseConfig || Object.keys(courseConfig).length === 0) return;
    if (!pendingRestoredFilters.current) return;

    const saved = pendingRestoredFilters.current;
    pendingRestoredFilters.current = null; // consume it — run this block only once

    if (!courseConfig[saved.course]) {
      console.warn("Saved course not in courseConfig, skipping restore.");
      setFiltersLoaded(true);
      return;
    }

    console.log("Applying restored filters now that courseConfig is ready:", saved);
    isRestoringFilters.current = true;

    fetchedSemesters.current = null;
    fetchedSpecializations.current = null;
    fetchedSubjects.current = null;

    setCourse(saved.course);
    if (saved.semester)       setSemester(saved.semester);
    if (saved.specialization) setSpecialization(saved.specialization);
    if (saved.section)        setSection(saved.section);
    if (saved.academicYear)   setAcademicYear(saved.academicYear);
    if (saved.subject)        setSubject(saved.subject);
    if (saved.startDate && saved.endDate) {
      setStartDate(saved.startDate);
      setEndDate(saved.endDate);
    }

    setTimeout(() => {
      isRestoringFilters.current = false;
      setFiltersLoaded(true);
      if (shouldFetchData.current) setFiltersReadyForFetch(true);
    }, 0);
  }, [courseConfig, loadingCourses]);

  // ── Fetch semesters whenever course or courseConfig changes ───────────────────
  useEffect(() => {
    if (!course || !courseConfig[course]) {
      resetSemesters();
      fetchedSemesters.current = null;
      if (!isRestoringFilters.current) {
        setSemester("");
        resetSubjects();
        setSubject("");
        setSpecialization("");
        resetSpecializations();
      }
      return;
    }
    if (fetchedSemesters.current === course) return;

    fetchSemesters(course, courseConfig)
      .then((semesters) => {
        fetchedSemesters.current = course;
        if (!isRestoringFilters.current && semester && !semesters.includes(parseInt(semester))) {
          setSemester("");
          resetSubjects();
          setSubject("");
        }
      })
      .catch(() => showAlert("Failed to fetch semesters. Please try again.", true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, courseConfig]); // <-- courseConfig here is the key fix

  // ── Section options ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (course && semester) {
      const opts = getSectionOptions(course, semester);
      setAvailableSectionOptions(opts);
      if (section && !opts.find((o) => o.value === section)) setSection("");
    } else {
      setAvailableSectionOptions(sectionOptions);
    }
  }, [course, semester, section, getSectionOptions, sectionOptions]);

  // ── Fetch specializations ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!course || !semester || !courseConfig[course]) {
      resetSpecializations();
      fetchedSpecializations.current = null;
      if (!isRestoringFilters.current) setSpecialization("");
      return;
    }
    const key = `${course}-${semester}`;
    if (fetchedSpecializations.current === key) return;

    fetchSpecializations(course, semester, courseConfig)
      .then(() => { fetchedSpecializations.current = key; })
      .catch(() => showAlert("Failed to fetch specializations. Please try again.", true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, semester, courseConfig]);

  // ── Fetch subjects ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!course || !semester || !courseConfig[course]) {
      if (!isRestoringFilters.current) { resetSubjects(); setSubject(""); clearAttendanceSummary(); }
      fetchedSubjects.current = null;
      return;
    }
    if (hasSpecializations && !specialization) {
      if (!isRestoringFilters.current) { resetSubjects(); setSubject(""); clearAttendanceSummary(); fetchedSubjects.current = null; }
      return;
    }
    const key = hasSpecializations ? `${course}-${semester}-${specialization}` : `${course}-${semester}`;
    if (fetchedSubjects.current === key) return;

    fetchSubjects(course, semester, specialization, hasSpecializations, courseConfig)
      .then((fetched) => {
        fetchedSubjects.current = key;
        if (fetched.length === 0 && filtersLoaded) showAlert("No subjects found for the selected course and semester", true);
      })
      .catch(() => showAlert("Failed to fetch subjects. Please try again.", true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, semester, specialization, hasSpecializations, courseConfig]);

  // ── Save filters ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (course || semester || subject || academicYear || specialization || section || startDate || endDate) {
      localStorage.setItem("attendanceFilters", JSON.stringify({
        course, semester, subject, academicYear, specialization, section, startDate, endDate,
      }));
    }
  }, [course, semester, subject, academicYear, specialization, section, startDate, endDate]);

  // ── Main fetch ────────────────────────────────────────────────────────────────
  const handleFetchAttendanceSummary = useCallback(async () => {
    return await fetchAttendanceSummary({
      course, semester, subject, academicYear, specialization, section,
      startDate, endDate, subjects, hasSpecializations, onError: showAlert,
    });
  }, [course, semester, subject, academicYear, specialization, section,
      startDate, endDate, subjects, hasSpecializations, fetchAttendanceSummary, showAlert]);

  // ── Auto-fetch after restore ──────────────────────────────────────────────────
  useEffect(() => {
    if (!filtersReadyForFetch) return;
    const allReady = course && semester && subject && academicYear && (!hasSpecializations || specialization);
    const subReady = subjects.length > 0 && subjects.some((s) => (s.Sub_Code || s._id) === subject);
    if (allReady && subReady && !loadingSubjects) {
      handleFetchAttendanceSummary();
      setFiltersReadyForFetch(false);
      shouldFetchData.current = false;
    }
  }, [filtersReadyForFetch, subjects, loadingSubjects, course, semester, subject,
      academicYear, specialization, hasSpecializations, handleFetchAttendanceSummary]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleCourseChange = useCallback((e) => {
    const v = e.target.value;
    setCourse(v); setSemester(""); setSpecialization(""); setSection(""); setSubject("");
    fetchedSemesters.current = null; fetchedSpecializations.current = null; fetchedSubjects.current = null;
    clearAttendanceSummary(); resetSubjects(); resetSpecializations();
  }, [clearAttendanceSummary, resetSubjects, resetSpecializations]);

  const handleSemesterChange = useCallback((e) => {
    setSemester(e.target.value); setSubject(""); setSpecialization(""); setSection("");
    fetchedSpecializations.current = null; fetchedSubjects.current = null;
    clearAttendanceSummary();
  }, [clearAttendanceSummary]);

  const handleSpecializationChange = useCallback((e) => {
    setSpecialization(e.target.value); setSubject("");
    fetchedSubjects.current = null;
    clearAttendanceSummary();
  }, [clearAttendanceSummary]);

  const handleSectionChange = useCallback((e) => { setSection(e.target.value); clearAttendanceSummary(); }, [clearAttendanceSummary]);
  const handleSubjectChange = useCallback((e) => setSubject(e.target.value), []);
  const handleAcademicYearChange = useCallback((e) => setAcademicYear(e.target.value), []);

  const handleDateFilterApply = useCallback(async (s, e) => {
    setStartDate(s); setEndDate(e);
    const saved = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
    localStorage.setItem("attendanceFilters", JSON.stringify({ ...saved, startDate: s, endDate: e }));
    if (course && semester && subject && academicYear) {
      await fetchWithDateFilter(
        { course, semester, subject, academicYear, specialization, section, subjects, hasSpecializations, onError: showAlert },
        s, e
      );
    }
  }, [course, semester, subject, academicYear, specialization, section, subjects, hasSpecializations, fetchWithDateFilter, showAlert]);

  const viewStudentDetail = useCallback((studentId) => {
    const state = { subject: subject.trim(), semester, academicYear };
    if (hasSpecializations && specialization) state.specialization = specialization;
    if (section) state.section = section;
    if (startDate && endDate) { state.startDate = startDate; state.endDate = endDate; }
    navigate(`/student/${studentId}`, { state });
  }, [subject, semester, academicYear, hasSpecializations, specialization, section, startDate, endDate, navigate]);

  const toggleTheme = useCallback(() => {
    const t = theme === "light" ? "dark" : "light";
    setTheme(t); localStorage.setItem("theme", t);
  }, [theme]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={`record_container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      {(attendanceLoading || loadingCourses || loadingSemesters) && <Loader />}

      <AlertModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} message={modalMessage} iserror={isError} />
      <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} attendanceSummary={attendanceSummary} />
      <DateFilterModal isOpen={isDateFilterModalOpen} onClose={() => setIsDateFilterModalOpen(false)} onApplyFilter={handleDateFilterApply} currentStartDate={startDate} currentEndDate={endDate} />

      <div className="record_summary-section">
        <h2>Attendance Record</h2>
        <div className="record_filter-row">

          <div className="record_filter-group">
            <label htmlFor="course">Course:</label>
            <select id="course" value={course} onChange={handleCourseChange} className="record_filter-select" disabled={loadingCourses}>
              <option value="">{loadingCourses ? "Loading courses..." : "Select Course"}</option>
              {Object.entries(courseConfig).map(([key]) => <option key={key} value={key}>{key}</option>)}
            </select>
          </div>

          <div className="record_filter-group">
            <label htmlFor="semester">Semester:</label>
            <select id="semester" value={semester} onChange={handleSemesterChange} className="record_filter-select" disabled={!course || loadingCourses || loadingSemesters}>
              <option value="">{loadingSemesters ? "Loading semesters..." : "Select Semester"}</option>
              {availableSemesters.map((sem) => <option key={sem} value={sem}>{sem}</option>)}
            </select>
          </div>

          {hasSpecializations && (
            <div className="record_filter-group">
              <label htmlFor="specialization">Specialization:</label>
              <select id="specialization" value={specialization} onChange={handleSpecializationChange} className="record_filter-select" disabled={!course || !semester || loadingSpecializations}>
                <option value="">{loadingSpecializations ? "Loading specializations..." : "Select Specialization"}</option>
                {availableSpecializations.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
              </select>
            </div>
          )}

          <div className="record_filter-group">
            <label htmlFor="section">Section (IF Applicable):</label>
            <select id="section" value={section} onChange={handleSectionChange} className="record_filter-select">
              <option value="">Select Section</option>
              {availableSectionOptions.map((sec) => <option key={sec.value} value={sec.value}>{sec.label}</option>)}
            </select>
          </div>

          <div className="record_filter-group">
            <label htmlFor="subject">Subject:</label>
            <select id="subject" value={subject} onChange={handleSubjectChange} className="record_filter-select"
              disabled={!semester || !course || loadingSubjects || !courseConfig[course] || (hasSpecializations && !specialization)}>
              <option value="">{loadingSubjects ? "Loading subjects..." : "Select Subject"}</option>
              {subjects.map((sub) => <option key={sub.Sub_Code || sub._id} value={sub.Sub_Code || sub._id}>{sub.Sub_Name}</option>)}
            </select>
          </div>

          <div className="record_filter-group">
            <label htmlFor="academicYear">Academic Year:</label>
            <select id="academicYear" value={academicYear} onChange={handleAcademicYearChange} className="record_filter-select">
              <option value="">Select Academic Year</option>
              {generateAcademicYears().map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          <button className="record_btn-fetch" onClick={handleFetchAttendanceSummary}
            disabled={attendanceLoading || loadingCourses || loadingSemesters || loadingSpecializations ||
              !course || !semester || !academicYear || !subject || !courseConfig[course] || (hasSpecializations && !specialization)}>
            {attendanceLoading ? "Loading..." : "Get Students"}
          </button>
        </div>

        {attendanceSummary.length > 0 && (
          <div className="record_summary-table-container">
            <div className="record_export-container">
              <ExcelExportButton
                attendanceSummary={attendanceSummary} subjects={subjects} course={course}
                semester={semester} subject={subject} academicYear={academicYear}
                specialization={specialization} section={section}
                hasSpecializations={hasSpecializations} startDate={startDate} endDate={endDate} showAlert={showAlert}
              />
              <button disabled={true} className="record_btn-notify">Send Mail For Notification</button>
              <button className={`record_btn-filter ${startDate && endDate ? "active" : ""}`} onClick={() => setIsDateFilterModalOpen(true)}>
                {startDate && endDate ? "Date Filter Applied" : "Filter by Date"}
              </button>
            </div>

            <table className="record_summary-table">
              <thead>
                <tr className="record_table-header">
                  <th>Roll Number</th><th>Student Name</th><th>Subject</th>
                  {hasSpecializations && specialization && <th>Specialization</th>}
                  {section && <th>Section</th>}
                  <th>Classes Attended</th><th>Total Classes</th><th>Attendance %</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendanceSummary.map((record, index) => {
                  const percentage = calculatePercentage(record.classesAttended, record.totalClasses);
                  const status = getAttendanceStatus(record.classesAttended, record.totalClasses);
                  return (
                    <tr key={index} className={`record_status-${status.toLowerCase()} ${theme}`}>
                      <td>{record.rollNumber}</td>
                      <td>{record.studentName}</td>
                      <td>{subjects.find((s) => (s.Sub_Code || s._id) === record.subjectCode)?.Sub_Name || record.subjectCode || record.subject}</td>
                      {hasSpecializations && specialization && <td>{specialization}</td>}
                      {section && <td>{section}</td>}
                      <td>{record.classesAttended}</td>
                      <td>{record.totalClasses}</td>
                      <td>{percentage}%</td>
                      <td>{status}</td>
                      <td><button className="record_btn-view-details" onClick={() => viewStudentDetail(record.studentId)}>View Details</button></td>
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
