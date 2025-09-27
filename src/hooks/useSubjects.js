// hooks/useSubjects.js
import { useState } from 'react';
import axios from 'axios';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const token = localStorage.getItem("token");

  const fetchSubjects = async (courseName, semesterNum, specialization, hasSpecializations, courseConfig) => {
    if (!courseName || !semesterNum || !courseConfig[courseName]) return [];

    setLoadingSubjects(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getsubjects`,
        {
          course: courseConfig[courseName]?.displayName,
          semester: semesterNum,
          specialization: hasSpecializations ? specialization : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const subjectsData = response.data || [];
      setSubjects(subjectsData);
      return subjectsData; // Return the subjects data so component can check length
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoadingSubjects(false);
    }
  };

  const resetSubjects = () => {
    setSubjects([]);
  };

  return { subjects, loadingSubjects, fetchSubjects, resetSubjects };
};