import React from 'react';
import { COURSES, SEMESTERS, SECTIONS } from '../constants/Constants';

const StudentForm = ({
  selectedCourse,
  setSelectedCourse,
  selectedSemester,
  setSelectedSemester,
  selectedSection,
  setSelectedSection,
  onGetStudents,
  loading,
  isFormValid
}) => {

  return (
    <div className="form-container">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="course">Course:</label>
          <select 
            id="course" 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Select Course</option>
            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="semester">Semester:</label>
          <select 
            id="semester" 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="section">Section:</label>
          <select 
            id="section" 
            value={selectedSection} 
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">Select Section</option>
            {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
          </select>
        </div>

        <div className="form-group button-group">
          <button 
            onClick={onGetStudents} 
            disabled={!isFormValid || loading} 
            className="get-students-btn"
          >
            {loading ? 'Loading...' : 'Get Students'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;