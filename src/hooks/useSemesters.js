import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export const useSemesters = () => {
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [semestersError, setSemestersError] = useState(null);
  const lastFetchedCourse = useRef(null); // Track last fetched to prevent duplicate calls

  const token = localStorage.getItem("token");
  const teacherId = localStorage.getItem("teacherId");

  const fetchSemesters = useCallback(async (course, courseConfig) => {
    if (!course || !courseConfig || !courseConfig[course]) {
      setAvailableSemesters([]);
      return [];
    }

    // Prevent duplicate API calls for the same course
    if (lastFetchedCourse.current === course && availableSemesters.length > 0) {
      console.log("Semesters already fetched for", course, "- skipping API call");
      return availableSemesters;
    }

    setLoadingSemesters(true);
    setSemestersError(null);

    try {
      const courseId = courseConfig[course].courseId;
      
      if (!courseId) {
        console.error("No courseId found for course:", course);
        setAvailableSemesters([]);
        return [];
      }

      console.log("Fetching semesters for course:", course);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/${courseId}/${teacherId}/semesters`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const semesters = response.data.data.availableSemesters || [];
        setAvailableSemesters(semesters);
        lastFetchedCourse.current = course; // Mark as fetched
        return semesters;
      } else {
        setAvailableSemesters([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
      setSemestersError(error.message || "Failed to fetch semesters");
      setAvailableSemesters([]);
      return [];
    } finally {
      setLoadingSemesters(false);
    }
  }, [token, teacherId, availableSemesters]);

  const resetSemesters = useCallback(() => {
    setAvailableSemesters([]);
    setSemestersError(null);
    lastFetchedCourse.current = null; // Reset tracking
  }, []);

  return {
    availableSemesters,
    loadingSemesters,
    semestersError,
    fetchSemesters,
    resetSemesters,
  };
};