import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Filter, Info, X, Plus } from "lucide-react";
import "./StudentDashboard.css";
import Navbar from "../Navbar/Navbar";
import StudentCard from "./StudentCard";
import axios from "axios"; 
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";

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
  const [newStudent, setNewStudent] = useState({
    rollNumber: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    section: "",
    specializations: []
  });
  const [availableSectionOptions, setAvailableSectionOptions] = useState([]);

  const token = localStorage.getItem("token");

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
    if (courseKey === "BCOM") return true;
    return false;
  };

  // Get specialization options based on course and semester
  const getSpecializationOptions = (courseKey, semesterNum) => {
    if (courseKey === "BCOM") {
      return bcomSpecializationOptions;
    } else if (courseKey === "MBA(MS)-2Yrs") {
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
    if (courseKey === "MBA(MS)-2Yrs" && parseInt(semesterNum) === 1) {
      return mbaSem1SectionOptions;
    }
    return sectionOptions;
  };

  // Function to get available semesters based on course years
  const getAvailableSemesters = (courseKey) => {
    if (!courseKey || !courseConfig[courseKey]) return [];

    const years = courseConfig[courseKey].years;
    const totalSemesters = years * 2;

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

  // Function to add specialization to new student
  const addSpecializationToNewStudent = (specializationValue) => {
    if (specializationValue && !newStudent.specializations.includes(specializationValue)) {
      setNewStudent(prev => ({
        ...prev,
        specializations: [...prev.specializations, specializationValue]
      }));
    }
  };

  // Function to remove specialization from new student
  const removeSpecializationFromNewStudent = (specializationToRemove) => {
    setNewStudent(prev => ({
      ...prev,
      specializations: prev.specializations.filter(spec => spec !== specializationToRemove)
    }));
  };

  useEffect(() => {
    if (course) {
      const semesters = getAvailableSemesters(course);
      setAvailableSemesters(semesters);

      if (semester && !semesters.includes(parseInt(semester))) {
        setSemester("");
      }

      if (!requiresSpecialization(course, semester)) {
        setSpecialization("");
        // Clear specializations from new student form if not required
        setNewStudent(prev => ({ ...prev, specializations: [] }));
      }
    } else {
      setAvailableSemesters([]);
      setSpecialization("");
      setNewStudent(prev => ({ ...prev, specializations: [] }));
    }
  }, [course, semester]);

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
    if (!course || !semester) {
      showAlert("Please select Course and Semester", true);
      return;
    }

    if (requiresSpecialization(course, semester) && !specialization) {
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

      if (requiresSpecialization(course, semester) && specialization) {
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

  const handleAddStudent = async () => {
    if (!newStudent.rollNumber || !newStudent.fullName || !course || !semester) {
      showAlert("Please fill in all required fields", true);
      return;
    }

    // Check if specializations are required and provided
    if (requiresSpecialization(course, semester) && newStudent.specializations.length === 0) {
      showAlert("Please add at least one specialization", true);
      return;
    }

    setLoading(true);

    try {
      const courseId = courseConfig[course]?.displayName;
      
      const studentData = {
        rollNumber: newStudent.rollNumber,
        fullName: newStudent.fullName,
        courseName: courseId,
        semId: parseInt(semester),
        email: convertEmptyToNull(newStudent.email),
        phoneNumber: convertEmptyToNull(newStudent.phoneNumber),
        section: convertEmptyToNull(newStudent.section || section),
        specializations: newStudent.specializations.length > 0 ? newStudent.specializations : null
      };

      console.log("Student data being sent:", studentData); // For debugging

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/student/create`,
        studentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert("Student added successfully!", false);
      setShowAddForm(false);
      setNewStudent({
        rollNumber: "",
        fullName: "",
        email: "",
        phoneNumber: "",
        section: "",
        specializations: []
      });
      
      // Refresh the student list
      fetchStudents();
    } catch (error) {
      console.error("Error adding student:", error);
      showAlert(error.response?.data?.message || "Failed to add student. Please try again.", true);
    } finally {
      setLoading(false);
    }
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

      {loading && <Loader />}

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
            >
              <option value="">Select Course</option>
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

          {requiresSpecialization(course, semester) && (
            <div className="studentdashboard_form_group">
              <label htmlFor="specialization">Specialization:</label>
              <select
                id="specialization"
                value={specialization}
                onChange={handleSpecializationChange}
                className="studentdashboard_form_select"
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
                !course || 
                !semester || 
                (requiresSpecialization(course, semester) && !specialization)
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
          <div className="studentdashboard_add_form">
            <h3>Add New Student</h3>
            
            {/* Course Information Display */}
            {course && semester && (
              <div className="studentdashboard_course_info" style={{
                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f8ff',
                border: '1px solid #007bff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Info className="studentdashboard_icon" style={{ color: '#007bff' }} />
                <div>
                  <strong>Student will be added to:</strong>
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    <span style={{ marginRight: '20px' }}>
                      <strong>Course:</strong> {course} ({courseConfig[course]?.displayName})
                    </span>
                    <span style={{ marginRight: '20px' }}>
                      <strong>Semester:</strong> {semester}
                    </span>
                    {section && (
                      <span style={{ marginRight: '20px' }}>
                        <strong>Section:</strong> {section}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="studentdashboard_form_grid">
              <div className="studentdashboard_form_group">
                <label>Roll Number (Required):</label>
                <input
                  type="text"
                  value={newStudent.rollNumber}
                  onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
                  placeholder="e.g., IT-2K21-36"
                  className="studentdashboard_form_input"
                />
              </div>
              <div className="studentdashboard_form_group">
                <label>Full Name (Required):</label>
                <input
                  type="text"
                  value={newStudent.fullName}
                  onChange={(e) => setNewStudent({...newStudent, fullName: e.target.value})}
                  placeholder="Enter full name"
                  className="studentdashboard_form_input"
                />
              </div>
              <div className="studentdashboard_form_group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  placeholder="Enter email"
                  className="studentdashboard_form_input"
                />
              </div>
              <div className="studentdashboard_form_group">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  value={newStudent.phoneNumber}
                  onChange={(e) => setNewStudent({...newStudent, phoneNumber: e.target.value})}
                  placeholder="Enter phone number"
                  className="studentdashboard_form_input"
                />
              </div>
              <div className="studentdashboard_form_group">
                <label>Section:</label>
                <select
                  value={newStudent.section}
                  onChange={(e) => setNewStudent({...newStudent, section: e.target.value})}
                  className="studentdashboard_form_select"
                >
                  <option value="">Select Section (Optional)</option>
                  {availableSectionOptions.map((sec) => (
                    <option key={sec.value} value={sec.value}>
                      {sec.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multiple Specializations Section */}
            {requiresSpecialization(course, semester) && (
              <div className="studentdashboard_form_group_Check" style={{ marginTop: '20px' }}>
                <label>Specializations (Required):</label>
                
                {/* Add Specialization Dropdown */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addSpecializationToNewStudent(e.target.value);
                        e.target.value = ""; // Reset dropdown
                      }
                    }}
                    className="studentdashboard_form_select"
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Specialization to Add</option>
                    {getSpecializationOptions(course, semester)
                      .filter(spec => !newStudent.specializations.includes(spec.value))
                      .map((spec) => (
                        <option key={spec.value} value={spec.value}>
                          {spec.label}
                        </option>
                      ))}
                  </select>
                  <Plus 
                    className="studentdashboard_icon" 
                    style={{ 
                      color: '#007bff',
                      cursor: 'pointer',
                      minWidth: '20px'
                    }} 
                  />
                </div>

                {/* Display Selected Specializations */}
                {newStudent.specializations.length > 0 && (
                  <div style={{
                    margin: '10px 0px'
                  }}>
                    <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>
                      Selected Specializations ({newStudent.specializations.length}):
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {newStudent.specializations.map((spec, index) => {
                        const specOption = getSpecializationOptions(course, semester).find(s => s.value === spec);
                        return (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: '#007bff',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '14px',
                              gap: '8px'
                            }}
                          >
                            <span>{specOption?.label || spec}</span>
                            <X
                              size={16}
                              style={{ cursor: 'pointer' }}
                              onClick={() => removeSpecializationFromNewStudent(spec)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {newStudent.specializations.length === 0 && (
                  <p style={{ 
                    color: '#666', 
                    fontSize: '14px',
                    fontStyle: 'italic',
                    marginTop: '10px'
                  }}>
                    No specializations selected. Please add at least one specialization.
                  </p>
                )}
              </div>
            )}

            <div className="studentdashboard_form_actions">
              <button
                onClick={handleAddStudent}
                className="studentdashboard_btn_save"
                disabled={
                  !newStudent.rollNumber || 
                  !newStudent.fullName || 
                  !course || 
                  !semester ||
                  (requiresSpecialization(course, semester) && newStudent.specializations.length === 0)
                }
              >
                Add Student
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewStudent({
                    rollNumber: "",
                    fullName: "",
                    email: "",
                    phoneNumber: "",
                    section: "",
                    specializations: []
                  });
                }}
                className="studentdashboard_btn_cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Students Grid */}
        {filteredStudents.length > 0 && (
          <div className="studentdashboard_students_container">
            <div className="studentdashboard_students_info">
              <h3>
                Students ({filteredStudents.length})
                {requiresSpecialization(course, semester) && specialization && (
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

        {students.length === 0 && !loading && course && semester && (
          <div className="studentdashboard_empty_state">
            <p>No students found. Try different filters or add a new student.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;