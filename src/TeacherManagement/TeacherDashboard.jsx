import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Info, X, Plus } from "lucide-react";
import "./TeacherDashboard.css"; 
import Navbar from "../Navbar/Navbar";
import TeacherCard from "./TeacherCard"; 
import axios from "axios";
import Loader from "../Loader/Loader";
import AlertModal from "../AlertModal/AlertModal";

const TeacherDashboard = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    faculty_id: "",
    password: "",
    subjectAccess: []
  });

  // Subject access related states
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState("");
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const token = localStorage.getItem("token");

  // Helper function to convert empty strings to null for backend
  const convertEmptyToNull = (value) => {
    if (value === "" || value === undefined) return null;
    return value;
  };

  // Fetch all subjects from API - FIXED
// Fixed fetchAllSubjects function - replace your existing one with this
const fetchAllSubjects = async () => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/teacher/getallsubjects`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log("API Response:", response.data); // Debug log
    
    let subjectOptions = [];
    
    // Check if response.data is directly an array of strings
    if (Array.isArray(response.data)) {
      subjectOptions = response.data.map(subjectCode => ({
        value: subjectCode,
        label: subjectCode
      }));
    } 
    // Check if response.data has a subjects property that's an array
    else if (response.data.subjects && Array.isArray(response.data.subjects)) {
      subjectOptions = response.data.subjects.map(subject => {
        // Handle if subjects array contains objects
        if (typeof subject === 'object') {
          const subjectCode = subject.subjectCode || subject.Sub_Code || subject.code || subject.name || subject.id;
          return {
            value: subjectCode,
            label: subjectCode
          };
        } 
        // Handle if subjects array contains strings
        else {
          return {
            value: subject,
            label: subject
          };
        }
      });
    }
    // Handle other possible structures
    else if (response.data.data && Array.isArray(response.data.data)) {
      subjectOptions = response.data.data.map(subject => {
        if (typeof subject === 'string') {
          return { value: subject, label: subject };
        } else {
          const subjectCode = subject.subjectCode || subject.Sub_Code || subject.code || subject.name || subject.id;
          return { value: subjectCode, label: subjectCode };
        }
      });
    }
    
    console.log("Processed subjects:", subjectOptions); // Debug log
    setAllSubjects(subjectOptions);
    
    if (subjectOptions.length === 0) {
      showAlert("No subjects found in the system", false);
    }
    
  } catch (error) {
    console.error("Error fetching subjects:", error);
    showAlert("Failed to fetch subjects. Using default options.", false);
    
    // Fallback to default options if API fails
    setAllSubjects([
      { value: "Mathematics", label: "Mathematics" },
      { value: "Physics", label: "Physics" },
      { value: "Chemistry", label: "Chemistry" },
      { value: "Biology", label: "Biology" },
      { value: "Computer Science", label: "Computer Science" },
      { value: "Information Technology", label: "Information Technology" }
    ]);
  }
};

  // Filter subjects based on search term
  const getFilteredSubjects = () => {
    if (!subjectSearchTerm) {
      return allSubjects.filter(subject => 
        !newTeacher.subjectAccess.includes(subject.value)
      );
    }
    
    return allSubjects.filter(subject => 
      subject.label.toLowerCase().includes(subjectSearchTerm.toLowerCase()) &&
      !newTeacher.subjectAccess.includes(subject.value)
    );
  };

  // Function to add subject access to new teacher
  const addSubjectAccessToNewTeacher = (subjectValue) => {
    if (subjectValue && typeof subjectValue === 'string' && !newTeacher.subjectAccess.includes(subjectValue)) {
      setNewTeacher(prev => ({
        ...prev,
        subjectAccess: [...prev.subjectAccess, subjectValue]
      }));
      setSubjectSearchTerm("");
      setShowSubjectDropdown(false);
    }
  };

  // Function to remove subject access from new teacher
  const removeSubjectAccessFromNewTeacher = (subjectToRemove) => {
    setNewTeacher(prev => ({
      ...prev,
      subjectAccess: prev.subjectAccess.filter(subject => subject !== subjectToRemove)
    }));
  };

  // Filter teachers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTeachers(teachers);
    } else {
      const filtered = teachers.filter(teacher => {
        const name = teacher.name?.toLowerCase() || '';
        const email = teacher.email?.toLowerCase() || '';
        const facultyId = teacher.faculty_id?.toLowerCase() || '';
        const mobile = teacher.mobileNumber || '';
        const searchLower = searchTerm.toLowerCase();
        
        return name.includes(searchLower) ||
               email.includes(searchLower) ||
               facultyId.includes(searchLower) ||
               mobile.includes(searchLower);
      });
      setFilteredTeachers(filtered);
    }
  }, [teachers, searchTerm]);

  // Fetch teachers and subjects on component mount
  useEffect(() => {
    fetchTeachers();
    fetchAllSubjects();
  }, []);

  const showAlert = (msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  };

  const fetchTeachers = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/teacher/getall`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTeachers(response.data.teachers || []);

      if (response.data.teachers.length === 0) {
        showAlert("No teachers found", false);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showAlert("Failed to fetch teachers. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.faculty_id || !newTeacher.password) {
      showAlert("Please fill in all required fields", true);
      return;
    }

    setLoading(true);

    try {
      const teacherData = {
        name: newTeacher.name,
        email: newTeacher.email,
        mobileNumber: convertEmptyToNull(newTeacher.mobileNumber),
        faculty_id: newTeacher.faculty_id,
        password: newTeacher.password,
        subjectAccess: newTeacher.subjectAccess.length > 0 ? newTeacher.subjectAccess : []
      };

      console.log("Teacher data being sent:", teacherData); // For debugging

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/teacher/create`,
        teacherData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert("Teacher added successfully!", false);
      setShowAddForm(false);
      setNewTeacher({
        name: "",
        email: "",
        mobileNumber: "",
        faculty_id: "",
        password: "",
        subjectAccess: []
      });
      
      // Refresh the teacher list
      fetchTeachers();
    } catch (error) {
      console.error("Error adding teacher:", error);
      showAlert(error.response?.data?.message || "Failed to add teacher. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = async (teacherId, editedData) => {
    setLoading(true);

    try {
      const updateData = {
        name: editedData.name,
        email: editedData.email,
        mobileNumber: convertEmptyToNull(editedData.mobileNumber),
        faculty_id: editedData.faculty_id,
        subjectAccess: editedData.subjectAccess || []
      };

      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/teacher/${teacherId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert("Teacher updated successfully!", false);
      fetchTeachers(); // Refresh the teacher list
    } catch (error) {
      console.error("Error updating teacher:", error);
      showAlert("Failed to update teacher. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeacherPassword = async (teacherId, newPassword) => {
    setLoading(true);

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/teacher/${teacherId}/password`,
        { password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert("Teacher password updated successfully!", false);
    } catch (error) {
      console.error("Error updating teacher password:", error);
      showAlert("Failed to update teacher password. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) {
      return;
    }

    setLoading(true);

    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/teacher/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert("Teacher deleted successfully!", false);
      fetchTeachers(); // Refresh the teacher list
    } catch (error) {
      console.error("Error deleting teacher:", error);
      showAlert("Failed to delete teacher. Please try again.", true);
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
    <div className={`teacherdashboard_container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {loading && <Loader />}

      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
        iserror={isError}
      />

      <div className="teacherdashboard_section">
        <div className="teacherdashboard_header">
          <h2>Teacher Management</h2>
        </div>

        {/* Search Bar and Add Teacher Button */}
        <div className="teacherdashboard_search_add_container">
          <button
            className="teacherdashboard_add_btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <PlusCircle className="teacherdashboard_icon" />
            Add Teacher
          </button>
          <div className="teacherdashboard_search_bar">
            <Search className="teacherdashboard_search_icon" />
            <input
              type="text"
              placeholder="Search by name, email, faculty ID, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="teacherdashboard_search_input"
            />
          </div>
        </div>

        {/* Add Teacher Form */}
        {showAddForm && (
          <div className="teacherdashboard_add_form">
            <h3>Add New Teacher</h3>

            <div className="teacherdashboard_form_grid">
              <div className="teacherdashboard_form_group">
                <label>Name (Required):</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  placeholder="Enter teacher's full name"
                  className="teacherdashboard_form_input"
                />
              </div>

              <div className="teacherdashboard_form_group">
                <label>Email (Required):</label>
                <input
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  placeholder="Enter email address"
                  className="teacherdashboard_form_input"
                />
              </div>

              <div className="teacherdashboard_form_group">
                <label>Faculty ID (Required):</label>
                <input
                  type="text"
                  value={newTeacher.faculty_id}
                  onChange={(e) => setNewTeacher({...newTeacher, faculty_id: e.target.value})}
                  placeholder="Enter faculty ID"
                  className="teacherdashboard_form_input"
                />
              </div>

              <div className="teacherdashboard_form_group">
                <label>Password (Required):</label>
                <input
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                  placeholder="Enter password"
                  className="teacherdashboard_form_input"
                />
              </div>

              <div className="teacherdashboard_form_group">
                <label>Mobile Number:</label>
                <input
                  type="tel"
                  value={newTeacher.mobileNumber}
                  onChange={(e) => setNewTeacher({...newTeacher, mobileNumber: e.target.value})}
                  placeholder="Enter mobile number"
                  className="teacherdashboard_form_input"
                />
              </div>
            </div>

            {/* Enhanced Subject Access Section with Search - FIXED CSS CLASSES */}
            <div className="teacherdashboard_form_group_check">
              <label>Subject Access (Optional):</label>
              
              {/* Add Subject Access with Search */}
              <div className="teacherdashboard_subject_search_container">
                <div className="teacherdashboard_subject_input_container">
                  <input
                    type="text"
                    value={subjectSearchTerm}
                    onChange={(e) => {
                      setSubjectSearchTerm(e.target.value);
                      setShowSubjectDropdown(true);
                    }}
                    onFocus={() => setShowSubjectDropdown(true)}
                    placeholder="Type to search subjects (e.g., 'IT', 'Math', 'CS')"
                    className="teacherdashboard_form_input"
                  />
                   <Plus 
                  className="teacherdashboard_subject_add_icon" 
                />
                  
                  {/* Dropdown for filtered subjects */}
                  {showSubjectDropdown && (
                    <div className={`teacherdashboard_subject_dropdown ${theme}`}>
                      {getFilteredSubjects().length > 0 ? (
                        getFilteredSubjects().map((subject) => (
                          <div
                            key={subject.value}
                            onClick={() => addSubjectAccessToNewTeacher(subject.value)}
                            className="teacherdashboard_subject_dropdown_item"
                          >
                            {subject.label} 
                          </div>
                        ))
                      ) : (
                        <div className="teacherdashboard_subject_dropdown_empty">
                          No subjects found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
               
              </div>

              {/* Click outside to close dropdown */}
              {showSubjectDropdown && (
                <div
                  className="teacherdashboard_dropdown_overlay"
                  onClick={() => setShowSubjectDropdown(false)}
                />
              )}

              {/* Display Selected Subject Access */}
              {newTeacher.subjectAccess.length > 0 && (
                <div className="teacherdashboard_selected_subjects">
                  <h4 className="teacherdashboard_selected_subjects_title">
                    Selected Subjects ({newTeacher.subjectAccess.length}):
                  </h4>
                  <div className="teacherdashboard_subject_tags">
                    {newTeacher.subjectAccess.map((subject, index) => (
                      <div key={index} className="teacherdashboard_subject_tag">
                        <span>{subject}</span>
                        <X
                          size={16}
                          className="teacherdashboard_subject_tag_remove"
                          onClick={() => removeSubjectAccessFromNewTeacher(subject)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {newTeacher.subjectAccess.length === 0 && (
                <p className="teacherdashboard_no_subjects_message">
                  No subjects selected. Teacher will have no access.
                </p>
              )}
            </div>

            <div className="teacherdashboard_form_actions">
              <button
                onClick={handleAddTeacher}
                className="teacherdashboard_btn_save"
                disabled={
                  !newTeacher.name || 
                  !newTeacher.email || 
                  !newTeacher.faculty_id ||
                  !newTeacher.password
                }
              >
                Add Teacher
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTeacher({
                    name: "",
                    email: "",
                    mobileNumber: "",
                    faculty_id: "",
                    password: "",
                    subjectAccess: []
                  });
                  setSubjectSearchTerm("");
                  setShowSubjectDropdown(false);
                }}
                className="teacherdashboard_btn_cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Teachers Grid */}
        {filteredTeachers.length > 0 && (
          <div className="teacherdashboard_teachers_container">
            <div className="teacherdashboard_teachers_info">
              <h3>Teachers ({filteredTeachers.length})</h3>
            </div>

            <div className="teacherdashboard_teachers_grid">
              {filteredTeachers.map((teacher) => (
                <TeacherCard
                  key={teacher._id}
                  teacher={teacher}
                  onEdit={handleEditTeacher}
                  onDelete={handleDeleteTeacher}
                  onUpdatePassword={handleUpdateTeacherPassword}
                  allSubjects={allSubjects}
                />
              ))}
            </div>
          </div>
        )}

        {filteredTeachers.length === 0 && !loading && teachers.length > 0 && (
          <div className="teacherdashboard_empty_state">
            <p>No teachers found matching your search criteria.</p>
          </div>
        )}

        {teachers.length === 0 && !loading && (
          <div className="teacherdashboard_empty_state">
            <p>No teachers found. Add your first teacher to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;