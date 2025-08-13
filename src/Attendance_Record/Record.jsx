import React, { useState, useEffect, useRef } from "react";
import "./Record.css";
import Navbar from "../Navbar/Navbar";
import axios from "axios";
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import NotificationModal from "../NotificationModel/NotificationModel";
import DateFilterModal from "../DateFilterModel/DateFilterModel";

const Record = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [section, setSection] = useState(""); // Section state
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
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const token = localStorage.getItem("token");
  
  // New state for caching subjects
  const [subjectsCache, setSubjectsCache] = useState({});

  // Updated specialization options for different courses and semesters
  const getSpecializationOptions = (courseKey, semesterNum) => {
    if (courseKey === "MBA(MS)-2Yrs" && semesterNum === "1") {
      return [
        { value: "Core", label: "Core" },
        { value: "Accounting-Elective", label: "Accounting-Elective" },
        { value: "QT-Elective", label: "QT-Elective" }
      ];
    } else {
      // Default specializations for other MBA courses
      return [
        { value: "Core", label: "Core" },
        { value: "FA", label: "FA" },
        { value: "BA", label: "BA" },
        { value: "FB", label: "FB" },
        { value: "HA", label: "HA" },
        { value: "MA", label: "MA" }
      ];
    }
  };

  // Updated section options based on course and semester
  const getSectionOptions = (courseKey, semesterNum) => {
    if (courseKey === "MBA(MS)-2Yrs" && semesterNum === "1") {
      return [
        { value: "A", label: "A" },
        { value: "B", label: "B" },
        { value: "C", label: "C" }
      ];
    } else {
      // Default sections for other courses
      return [
        { value: "A", label: "A" },
        { value: "B", label: "B" }
      ];
    }
  };

  // ✅ UPDATED: Function to check specialization requirements
  const requiresSpecialization = (courseKey, semesterNum) => {
    if (!courseKey || !semesterNum) return false;
    const semesterNumber = parseInt(semesterNum);
    
    if (courseKey === "MBA(MS)-2Yrs") return true;
    if (courseKey === "MBA(MS)-5yrs" && semesterNumber >= 7) return true;
    return false;
  };

  // Course configuration with years - same as Dashboard
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

  // Function to get cache key for subjects (now includes specialization and section)
  const getSubjectsCacheKey = (courseName, semesterNum, specializationValue = "", sectionValue = "") => {
    return `${courseName}_${semesterNum}_${specializationValue}_${sectionValue}`;
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

  // ✅ UPDATED: fetchSubjects function with section support
  const fetchSubjects = async (courseName, semesterNum, specializationValue = "", sectionValue = "", forceRefresh = false) => {
    if (!courseName || !semesterNum) return;

    // For MBA(MS) courses, specialization is required only for specific semesters
    if (requiresSpecialization(courseName, semesterNum) && !specializationValue) {
      console.log("Specialization required but not provided, clearing subjects");
      setSubjects([]);
      setSubject("");
      return;
    }

    const cacheKey = getSubjectsCacheKey(courseName, semesterNum, specializationValue, sectionValue);
 
    // Check if subjects are already cached and not forcing refresh
    if (subjectsCache[cacheKey] && !forceRefresh) {
      console.log("✅ Using cached subjects for", cacheKey);
      setSubjects(subjectsCache[cacheKey]);
      
      // Load saved subject if it exists in cache
      const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
      if (savedFilters.subject && savedFilters.course === courseName && 
          savedFilters.semester === semesterNum && 
          savedFilters.specialization === specializationValue &&
          savedFilters.section === sectionValue) {
        const subjectExists = subjectsCache[cacheKey].some(
          s => (s.Sub_Code || s._id) === savedFilters.subject
        );
        if (subjectExists) {
          setSubject(savedFilters.subject);
        }
      }
      return;
    }

    console.log("🚀 Fetching subjects from API for", cacheKey);
    setLoadingSubjects(true);
    try {
      const requestData = {
        course: courseConfig[courseName]?.displayName,
        semester: semesterNum,
      };

      // Add specialization to request if required
      if (requiresSpecialization(courseName, semesterNum) && specializationValue) {
        requestData.specialization = specializationValue;
      }

      // Add section to request if selected (convert empty string to null)
      if (sectionValue) {
        requestData.section = sectionValue;
      }

      console.log("📤 Request data:", requestData);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getsubjects`,
        requestData,
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      );

      const subjectsData = response.data || [];
      console.log("📥 Subjects received:", subjectsData.length);
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
      if (savedFilters.subject && savedFilters.course === courseName && 
          savedFilters.semester === semesterNum && 
          savedFilters.specialization === specializationValue &&
          savedFilters.section === sectionValue) {
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
      console.error("❌ Error fetching subjects:", error);
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

  // ✅ UPDATED: Available semesters effect with proper specialization reset
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

      // ✅ UPDATED: Reset specialization and section if course/semester combination changes
      if (!requiresSpecialization(course, semester)) {
        setSpecialization("");
      }
      // Reset section when course changes as section options might be different
      setSection("");
    } else {
      setAvailableSemesters([]);
      setSubjects([]);
      setSubject("");
      setSpecialization("");
      setSection("");
    }
  }, [course, semester]); // Added semester to dependencies

  // ✅ UPDATED: Subjects fetching effect with section support
  useEffect(() => {
    console.log("🔄 Subjects effect triggered:", { course, semester, specialization, section });
    
    if (course && semester) {
      if (requiresSpecialization(course, semester)) {
        if (specialization) {
          console.log("📚 Fetching subjects with specialization and section:", specialization, section);
          fetchSubjects(course, semester, specialization, section);
        } else {
          console.log("⏳ Waiting for specialization selection");
          setSubjects([]);
          setSubject("");
        }
      } else {
        console.log("📚 Fetching subjects with section (no specialization required):", section);
        fetchSubjects(course, semester, "", section);
      }
      setAttendanceSummary([]); // Reset attendance summary when filters change
    } else {
      console.log("❌ Missing course or semester");
      setSubjects([]);
      setSubject("");
      setAttendanceSummary([]);
    }
  }, [course, semester, specialization, section]); // Added section to dependencies

useEffect(() => {
  const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
  console.log("💾 Loading saved filters:", savedFilters);

  if (savedFilters.course && !filtersLoaded.current) {
    console.log("🔄 Restoring saved filters");
    setCourse(savedFilters.course);
    
    if (savedFilters.semester) {
      setSemester(savedFilters.semester);
    }
    
    // Properly handle specialization restoration with semester check
    if (savedFilters.specialization && savedFilters.semester && 
        requiresSpecialization(savedFilters.course, savedFilters.semester)) {
      console.log("🎯 Restoring specialization:", savedFilters.specialization);
      setSpecialization(savedFilters.specialization);
    }

    // Restore section if saved
    if (savedFilters.section) {
      console.log("📚 Restoring section:", savedFilters.section);
      setSection(savedFilters.section);
    }
    
    if (savedFilters.academicYear) {
      setAcademicYear(savedFilters.academicYear);
    }

    // Restore date filters if saved
    if (savedFilters.startDate && savedFilters.endDate) {
      setStartDate(savedFilters.startDate);
      setEndDate(savedFilters.endDate);
    }

    filtersLoaded.current = true;

    // Set flag to fetch data if coming from detail page
    if (location.state?.returnFromDetail) {
      console.log("🔙 Returning from detail page, will fetch data");
      shouldFetchData.current = true;
    }
  }
}, [location.state]);


  // ✅ UPDATED: Auto-fetch effect with section support
  useEffect(() => {
    const allFiltersSelected = course && semester && subject && academicYear &&
      (!requiresSpecialization(course, semester) || specialization);

    console.log("🎯 Auto-fetch check:", { 
      allFiltersSelected, 
      shouldFetch: shouldFetchData.current,
      course, 
      semester, 
      subject, 
      academicYear, 
      specialization,
      section,
      requiresSpec: requiresSpecialization(course, semester)
    });

    if (allFiltersSelected && shouldFetchData.current) {
      console.log("🚀 Auto-fetching attendance data");
      fetchAttendanceSummary();
      shouldFetchData.current = false;
    }
  }, [course, semester, subject, academicYear, specialization, section, subjects]); // Added section to dependencies

  // Save filters to localStorage whenever they change (including section)
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
    console.log("💾 Saving filters to localStorage:", filtersToSave);
    localStorage.setItem("attendanceFilters", JSON.stringify(filtersToSave));
  }
}, [course, semester, subject, academicYear, specialization, section, startDate, endDate]);

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester("");
    setSpecialization("");
    setSection("");
    setAttendanceSummary([]);
    setSubjects([]);
    setSubject("");
    subjectsLoaded.current = false;
  };

  // ✅ UPDATED: Semester change handler to reset section as well
  const handleSemesterChange = (e) => {
    const newSemester = e.target.value;
    setSemester(newSemester);
    setAttendanceSummary([]);
    setSubject("");
    
    // Reset specialization if the new semester doesn't require it
    if (!requiresSpecialization(course, newSemester)) {
      setSpecialization("");
    } else {
      // Reset specialization when semester changes for courses that require it
      // This ensures the correct specialization options are shown
      setSpecialization("");
    }
    
    // Reset section when semester changes as section options might be different
    setSection("");
    
    subjectsLoaded.current = false;
  };

  // ✅ UPDATED: Specialization change handler with section support
  const handleSpecializationChange = (e) => {
    console.log("🎯 Specialization changed to:", e.target.value);
    setSpecialization(e.target.value);
    setAttendanceSummary([]);
    setSubject("");
    subjectsLoaded.current = false;
    
    // Force fetch subjects when specialization changes
    if (course && semester && e.target.value) {
      console.log("🔄 Force fetching subjects due to specialization change");
      fetchSubjects(course, semester, e.target.value, section, true); // Force refresh
    }
  };

  // UPDATED: Section change handler
  const handleSectionChange = (e) => {
    console.log("📚 Section changed to:", e.target.value);
    setSection(e.target.value);
    setAttendanceSummary([]);
    setSubject("");
    subjectsLoaded.current = false;
    
    // Force fetch subjects when section changes
    if (course && semester) {
      console.log("🔄 Force fetching subjects due to section change");
      const specializationToUse = requiresSpecialization(course, semester) ? specialization : "";
      if (!requiresSpecialization(course, semester) || specializationToUse) {
        fetchSubjects(course, semester, specializationToUse, e.target.value, true); // Force refresh
      }
    }
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
  
  // If we have attendance data, refetch with NEW date filter values (not state)
  if (course && semester && subject && academicYear) {
    await fetchAttendanceSummaryWithDates(newStartDate, newEndDate);
  }
};

// Add this new function to handle fetching with specific date parameters:
const fetchAttendanceSummaryWithDates = async (startDateParam, endDateParam) => {
  if (!course || !semester || !academicYear || !subject) {
    showAlert(
      "Please select Course, Semester, Subject, and Academic Year",
      true
    );
    return;
  }

  // Check if specialization is required but not selected
  if (requiresSpecialization(course, semester) && !specialization) {
    showAlert("Please select a Specialization", true);
    return;
  }

  setLoading(true);

  try {
    const selectedSubject = subjects.find(
      (s) => s.Sub_Code === subject || s._id === subject
    );

    const requestData = {
      course: selectedSubject?.Course_ID || "", // Correct Course_ID like "C1"
      semester,
      subject: subject.trim(),
      academicYear,
    };

    // Add specialization to request if required
    if (requiresSpecialization(course, semester) && specialization) {
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

    console.log("🚀 Request Data being sent:", requestData);

    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/attendance/getAttendanceByCourseAndSubject`,
      requestData,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("🚀 Full API Response:", response.data);

    // Extract students array from response
    const studentsData = response.data.students || response.data || [];
    
    console.log("🚀 Students Data:", studentsData);
    console.log("🚀 Students Count:", studentsData.length);

    if (studentsData.length === 0) {
      const message = startDateParam && endDateParam 
        ? `No attendance records found for the selected criteria between ${startDateParam} and ${endDateParam}`
        : "No attendance records found for the selected criteria";
      showAlert(message, true);
      setAttendanceSummary([]);
    } else {
      setAttendanceSummary(studentsData);
      console.log("✅ Attendance Summary Set Successfully:", studentsData);
    }
  } catch (error) {
    console.error("❌ Error fetching attendance summary:", error);
    console.error("❌ Error response:", error.response?.data);
    showAlert("Failed to fetch attendance summary. Please try again.", true);
    setAttendanceSummary([]);
  } finally {
    setLoading(false);
  }
};

// Also update your existing fetchAttendanceSummary function to use the current state:
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
  if (requiresSpecialization(course, semester) && specialization) {
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

  // ✅ UPDATED: Export to Excel function with section support
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

      const rowData = {
        "Roll Number": record.rollNumber,
        "Student Name": record.studentName,
        Subject:
          subjects.find((s) => (s.Sub_Code || s._id) === record.subjectCode)
            ?.Sub_Name || record.subjectCode || subject,
        "Classes Attended": record.classesAttended,
        "Total Classes": record.totalClasses,
        "Attendance %": `${percentage}%`,
        Status: status,
      };

      // Add specialization column if applicable
      if (requiresSpecialization(course, semester) && specialization) {
        rowData.Specialization = specialization;
      }

      // Add section column if selected
      if (section) {
        rowData.Section = section;
      }

      return rowData;
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

    let fileName = `${course}_${semester}Sem_${subjectName}_${academicYear}`;
    if (requiresSpecialization(course, semester) && specialization) {
      fileName += `_${specialization}`;
    }
    if (section) {
      fileName += `_Section${section}`;
    }
    // Add date range to filename if filters are applied
    if (startDate && endDate) {
      fileName += `_${startDate}_to_${endDate}`;
    }
    fileName += "_Attendance.xlsx";

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

  // Debug: Monitor attendance summary changes
  useEffect(() => {
    console.log("🚀 Attendance Summary Updated:", attendanceSummary);
    console.log("🚀 Should render table:", attendanceSummary.length > 0);
  }, [attendanceSummary]);

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

          {/* ✅ FIXED: Specialization dropdown - only shown when required */}
          {requiresSpecialization(course, semester) && (
            <div className="record_filter-group">
              <label htmlFor="specialization">Specialization:</label>
              <select
                id="specialization"
                value={specialization}
                onChange={handleSpecializationChange}
                className="record_filter-select"
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

          {/* New Section dropdown - always visible and optional */}
          <div className="record_filter-group">
            <label htmlFor="section">Section:</label>
            <select
              id="section"
              value={section}
              onChange={handleSectionChange}
              className="record_filter-select"
              disabled={!course || !semester}
            >
              <option value="">Select Section (Optional)</option>
              {getSectionOptions(course, semester).map((sec) => (
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
              disabled={!semester || !course || loadingSubjects || 
                       (requiresSpecialization(course, semester) && !specialization)}
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
              !course || 
              !semester || 
              !academicYear || 
              !subject || 
              (requiresSpecialization(course, semester) && !specialization)
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
                  {requiresSpecialization(course, semester) && specialization && <th>Specialization</th>}
                  <th>Classes Attended</th>
                  <th>Total Classes</th>
                  <th>Attendance %</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* ✅ FIXED: Updated table rendering to use correct field names */}
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
                        {/* Updated to use subjectCode from API response */}
                        {subjects.find(
                          (s) => (s.Sub_Code || s._id) === record.subjectCode
                        )?.Sub_Name || record.subjectCode || record.subject}
                      </td>
                      {requiresSpecialization(course, semester) && specialization && (
                        <td>{specialization}</td>
                      )}
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