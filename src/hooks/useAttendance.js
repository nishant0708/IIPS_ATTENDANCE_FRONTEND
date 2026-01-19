import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export const useAttendance = () => {
  const [courseConfig, setCourseConfig] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // Use refs to avoid dependency issues with values from localStorage
  const tokenRef = useRef(localStorage.getItem("token"));
  const teacherIdRef = useRef(localStorage.getItem("teacherId"));

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance`,
        {
          teacherId: teacherIdRef.current
        },
        {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
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
  }, []); // Empty dependency array since we're using refs

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courseConfig, loadingCourses, fetchCourses };
};