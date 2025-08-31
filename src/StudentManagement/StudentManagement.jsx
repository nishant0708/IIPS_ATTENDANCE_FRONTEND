import React, { useState, useEffect } from 'react';
import Navbar from "../Navbar/Navbar";
import StudentForm from './Components/StudentForm';
import StudentList from './Components/StudentList';
import { fetchStudents, updateStudent, deleteStudent } from './api/StudentApi';
import './StudentManagement.css';

const StudentManagement = () => {
  const [theme, setTheme] = useState("dark");
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [showStudents, setShowStudents] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (theme === "light") document.body.classList.add('light');
    else document.body.classList.remove('light');
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const handleGetStudents = async () => {
    if (selectedCourse && selectedSemester && selectedSection) {
      setLoading(true);
      setError(null);
      try {
        const studentData = await fetchStudents(selectedCourse, selectedSemester, selectedSection);
        setStudents(studentData);
        setShowStudents(true);
      } catch (err) {
        setError(err.message || 'Failed to fetch students');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveStudent = async (studentId, updatedStudent) => {
    try {
      await updateStudent(studentId, updatedStudent);
      
      // Update local state
      setStudents(prev =>
        prev.map(s => (s.id === studentId ? { ...s, ...updatedStudent } : s))
      );

      alert(`${updatedStudent.name}'s information has been updated successfully!`);
    } catch (err) {
      alert(`Error updating student: ${err.message}`);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (!window.confirm(`Are you sure you want to delete ${student.name}?`)) return;

    try {
      await deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      alert(`${student.name} has been deleted successfully.`);
    } catch (err) {
      alert(`Error deleting student: ${err.message}`);
    }
  };

  const isFormValid = selectedCourse && selectedSemester && selectedSection;

  return (
    <div className={`dashboard-container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <div className="header">
        <h1>Student Management</h1>
      </div>

      <StudentForm
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        selectedSemester={selectedSemester}
        setSelectedSemester={setSelectedSemester}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        onGetStudents={handleGetStudents}
        loading={loading}
        isFormValid={isFormValid}
      />

      {error && (
        <div className="error-container">
          <strong>Error:</strong> {error}
        </div>
      )}

      {showStudents && (
        <StudentList 
          students={students}
          onEdit={() => {}}
          onDelete={handleDeleteStudent}
          onSave={handleSaveStudent}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};

export default StudentManagement;