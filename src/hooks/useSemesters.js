import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export const useSemesters = () => {
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [semestersError, setSemestersError] = useState(null);
  
  // Store both course and semesters to prevent duplicate calls
  const lastFetchedCourseRef = useRef(null);
  const cachedSemestersRef = useRef([]);

  const token = localStorage.getItem("token");
  const teacherId = localStorage.getItem("teacherId");

  const fetchSemesters = useCallback(async (course, courseConfig) => {
    if (!course || !courseConfig || !courseConfig[course]) {
      setAvailableSemesters([]);
      cachedSemestersRef.current = [];
      return [];
    }

    // Prevent duplicate API calls for the same course using ref
    if (lastFetchedCourseRef.current === course && cachedSemestersRef.current.length > 0) {
      console.log("Semesters already fetched for", course, "- returning cached");
      return cachedSemestersRef.current;
    }

    setLoadingSemesters(true);
    setSemestersError(null);

    try {
      const courseId = courseConfig[course].courseId;
      
      if (!courseId) {
        console.error("No courseId found for course:", course);
        setAvailableSemesters([]);
        cachedSemestersRef.current = [];
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
        cachedSemestersRef.current = semesters; // Cache in ref
        lastFetchedCourseRef.current = course;
        return semesters;
      } else {
        setAvailableSemesters([]);
        cachedSemestersRef.current = [];
        return [];
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
      setSemestersError(error.message || "Failed to fetch semesters");
      setAvailableSemesters([]);
      cachedSemestersRef.current = [];
      return [];
    } finally {
      setLoadingSemesters(false);
    }
  }, [token, teacherId]); // FIXED: Removed availableSemesters from dependencies

  const resetSemesters = useCallback(() => {
    setAvailableSemesters([]);
    setSemestersError(null);
    lastFetchedCourseRef.current = null;
    cachedSemestersRef.current = []; // Reset cache
  }, []);

  return {
    availableSemesters,
    loadingSemesters,
    semestersError,
    fetchSemesters,
    resetSemesters,
  };
};