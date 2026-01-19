import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useAttendance = () => {
  const [courseConfig, setCourseConfig] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const token = localStorage.getItem("token");
  const teacherId = localStorage.getItem("teacherId");  

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance`,
         {
          teacherId: teacherId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCourseConfig(response.data.data);
      } else {
        throw new Error("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourseConfig({});
      throw error;
    } finally {
      setLoadingCourses(false);
    }
  },[teacherId,token])

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courseConfig, loadingCourses, fetchCourses };
};