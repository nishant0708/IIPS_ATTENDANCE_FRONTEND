import { useState } from 'react';
import axios from 'axios';

export const useSpecializations = () => {
  const [availableSpecializations, setAvailableSpecializations] = useState([]);
  const [hasSpecializations, setHasSpecializations] = useState(false);
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);
  const token = localStorage.getItem("token");
   const teacherId = localStorage.getItem("teacherId");

  const fetchSpecializations = async (courseName, semesterNum, courseConfig) => {
    if (!courseName || !semesterNum || !courseConfig[courseName]) return;

    setLoadingSpecializations(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getspecializations`,
        {
          course: courseConfig[courseName]?.displayName,
          semester: semesterNum,
          teacherId: teacherId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;
      setHasSpecializations(data.hasSpecializations);
      setAvailableSpecializations(data.specializations || []);
      
      return { hasSpecializations: data.hasSpecializations, specializations: data.specializations };
    } catch (error) {
      console.error("Error fetching specializations:", error);
      setHasSpecializations(false);
      setAvailableSpecializations([]);
      throw error;
    } finally {
      setLoadingSpecializations(false);
    }
  };

  const resetSpecializations = () => {
    setHasSpecializations(false);
    setAvailableSpecializations([]);
  };

  return {
    availableSpecializations,
    hasSpecializations,
    loadingSpecializations,
    fetchSpecializations,
    resetSpecializations
  };
};