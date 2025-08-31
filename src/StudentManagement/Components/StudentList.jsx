import React from 'react';
import { Users } from 'lucide-react';
import StudentCard from './StudentCard';

const StudentList = ({ students, onEdit, onDelete, onSave, theme, toggleTheme }) => {
  return (
    <div className="students-container">
      <div className="students-header">
        <Users className="icon" />
        <h2>Student List</h2>
      </div>
      
      <div className="students-grid">
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onEdit={onEdit}
            onDelete={onDelete}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
};

export default StudentList;