import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Filter } from "lucide-react";
import "./StudentDashboard.css";
import Navbar from "../Navbar/Navbar";
import StudentCard from "./StudentCard";
import AddStudentForm from "./AddStudentForm";
import axios from "axios"; 
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";
import { useAttendance } from "../hooks/useAttendance";
import { useSpecializations } from "../hooks/useSpecializations";

const StudentDashboard = () => {
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableSectionOptions, setAvailableSectionOptions] = useState([]);

  const token = localStorage.getItem("token");

  // Custom hooks
  const { courseConfig, loadingCourses } = useAttendance();
  const {
    availableSpecializations,
    hasSpecializations,
    loadingSpecializations,
    fetchSpecializations,
    resetSpecializations
  } = useSpecializations();

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

  // Get section options based on course and semester
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

  // Helper function to convert empty strings to null for backend
  const convertEmptyToNull = (value) => {
    if (value === "" || value === undefined) return null;
    return value;
  };

  // Handle course change
  useEffect(() => {
    if (course && courseConfig[course]) {
      const semesters = getAvailableSemesters(course);
      setAvailableSemesters(semesters);

      if (semester && !semesters.includes(parseInt(semester))) {
        setSemester("");
      }
    } else {
      setAvailableSemesters([]);
      setSpecialization("");
      resetSpecializations();
    }
  }, [course, courseConfig]);

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
  }, [course, semester]);

  // Fetch specializations when course and semester change
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

  // Clear students when relevant filters change
  useEffect(() => {
    if (hasSpecializations && !specialization) {
      setStudents([]);
    }
  }, [hasSpecializations, specialization]);

  // Filter students based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [students, searchTerm]);

  const showAlert = (msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  };

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setSemester("");
    setStudents([]);
    setSpecialization("");
    setSection("");
    resetSpecializations();
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setStudents([]);
    setSpecialization("");
    setSection("");
  };

  const handleSpecializationChange = (e) => {
    setSpecialization(e.target.value);
    setStudents([]);
  };

  const handleSectionChange = (e) => {
    setSection(e.target.value);
    setStudents([]);
  };

  const fetchStudents = async () => {
    if (!course || !semester || !courseConfig[course]) {
      showAlert("Please select Course and Semester", true);
      return;
    }

    if (hasSpecializations && !specialization) {
      showAlert("Please select a Specialization", true);
      return;
    }

    setLoading(true);

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

      // Transform data to match StudentCard expected format
      const transformedStudents = response.data.map(student => ({
        id: student._id,
        name: student.fullName,
        rollNo: student.rollNumber,
        section: student.section || 'N/A',
        specialization: student.specializations || [],
        mobile: student.phoneNumber || '',
        email: student.email || ''
      }));

      setStudents(transformedStudents);

      if (transformedStudents.length === 0) {
        showAlert("No students found for the selected criteria", false);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      showAlert("Failed to fetch students. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudentSuccess = () => {
    setShowAddForm(false);
    // Refresh the student list
    fetchStudents();
  };

  const handleAddStudentCancel = () => {
    setShowAddForm(false);
  };

  const handleEditStudent = async (studentId, editedData) => {
    setLoading(true);

    try {
      // Process specializations
      let specializations = null;
      if (editedData.specialization && Array.isArray(editedData.specialization) && editedData.specialization.length > 0) {
        const filteredSpecs = editedData.specialization.filter(spec => spec !== "" && spec !== null && spec !== undefined);
        specializations = filteredSpecs.length > 0 ? filteredSpecs : null;
      }

      const updateData = {
        rollNumber: editedData.rollNo,
        fullName: editedData.name,
        email: convertEmptyToNull(editedData.email),
        phoneNumber: convertEmptyToNull(editedData.mobile),
        section: convertEmptyToNull(editedData.section),
        specializations: specializations
      };

      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/student/update/${studentId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert("Student updated successfully!", false);
      fetchStudents(); // Refresh the student list
    } catch (error) {
      console.error("Error updating student:", error);
      showAlert("Failed to update student. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    setLoading(true);

    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/student/delete/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert("Student deleted successfully!", false);
      fetchStudents(); // Refresh the student list
    } catch (error) {
      console.error("Error deleting student:", error);
      showAlert("Failed to delete student. Please try again.", true);
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
    <div className={`studentdashboard_container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {(loading || loadingCourses) && <Loader />}

      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
        iserror={isError}
      />

      <div className="studentdashboard_section">
        <div className="studentdashboard_header">
          <h2>Student Management</h2>
        </div>

        {/* Filter Controls */}
        <div className="studentdashboard_filter_controls">
          <div className="studentdashboard_form_group">
            <label htmlFor="course">Course:</label>
            <select
              id="course"
              value={course}
              onChange={handleCourseChange}
              className="studentdashboard_form_select"
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

          <div className="studentdashboard_form_group">
            <label htmlFor="semester">Semester:</label>
            <select
              id="semester"
              value={semester}
              onChange={handleSemesterChange}
              className="studentdashboard_form_select"
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
            <div className="studentdashboard_form_group">
              <label htmlFor="specialization">Specialization:</label>
              <select
                id="specialization"
                value={specialization}
                onChange={handleSpecializationChange}
                className="studentdashboard_form_select"
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

          <div className="studentdashboard_form_group">
            <label htmlFor="section">Section (If Applicable):</label>
            <select
              id="section"
              value={section}
              onChange={handleSectionChange}
              className="studentdashboard_form_select"
            >
              <option value="">Select Section</option>
              {availableSectionOptions.map((sec) => (
                <option key={sec.value} value={sec.value}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              className="studentdashboard_btn_fetch"
              onClick={fetchStudents}
              disabled={
                loading || 
                loadingCourses ||
                loadingSpecializations ||
                !course || 
                !semester || 
                !courseConfig[course] ||
                (hasSpecializations && !specialization)
              }
            >
              <Filter className="studentdashboard_icon" />
              {loading ? "Loading..." : "Get Students"}
            </button>
          </div>
        </div>

        {/* Search Bar and Add Student Button - Only show when students are loaded */}
        {students.length > 0 && (
          <div className="studentdashboard_search_add_container">
            <button
              className="studentdashboard_add_btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <PlusCircle className="studentdashboard_icon" />
              Add Student
            </button>
            <div className="studentdashboard_search_bar">
              <Search className="studentdashboard_search_icon" />
              <input
                type="text"
                placeholder="Search by name, roll number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="studentdashboard_search_input"
              />
            </div>
          </div>
        )}

        {/* Add Student Form */}
        {showAddForm && (
          <AddStudentForm
            course={course}
            semester={semester}
            section={section}
            courseConfig={courseConfig}
            hasSpecializations={hasSpecializations}
            availableSpecializations={availableSpecializations}
            availableSectionOptions={availableSectionOptions}
            theme={theme}
            onSuccess={handleAddStudentSuccess}
            onCancel={handleAddStudentCancel}
            showAlert={showAlert}
          />
        )}

        {/* Students Grid */}
        {filteredStudents.length > 0 && (
          <div className="studentdashboard_students_container">
            <div className="studentdashboard_students_info">
              <h3>
                Students ({filteredStudents.length})
                {hasSpecializations && specialization && (
                  <span> - Specialization: {specialization}</span>
                )}
                {section && (
                  <span> - Section: {section}</span>
                )}
              </h3>
            </div>

            <div className="studentdashboard_students_grid">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onEdit={handleEditStudent}
                  onDelete={handleDeleteStudent}
                  onSave={handleEditStudent}
                />
              ))}
            </div>
          </div>
        )}

        {students.length === 0 && !loading && course && semester && !loadingCourses && (
          <div className="studentdashboard_empty_state">
            <p>No students found. Try different filters or add a new student.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;