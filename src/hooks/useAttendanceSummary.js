import { useState, useCallback } from 'react';
import axios from 'axios';

export const useAttendanceSummary = () => {
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  // Clear attendance summary
  const clearAttendanceSummary = useCallback(() => {
    setAttendanceSummary([]);
    setError(null);
  }, []);

  // Calculate attendance percentage
  const calculatePercentage = useCallback((present, total) => {
    if (!total || total === 0) return 0;
    return ((present / total) * 100).toFixed(2);
  }, []);

  // Main fetch function with date filtering support
  const fetchAttendanceSummary = useCallback(async ({
    course,
    semester,
    subject,
    academicYear,
    specialization = null,
    section = null,
    startDate = null,
    endDate = null,
    subjects = [],
    hasSpecializations = false,
    onSuccess = null,
    onError = null
  }) => {
    // Validation
    if (!course || !semester || !academicYear || !subject) {
      const errorMsg = "Please select Course, Semester, Subject, and Academic Year";
      setError(errorMsg);
      if (onError) onError(errorMsg, true);
      return { success: false, error: errorMsg };
    }

    // Check if specialization is required but not selected
    if (hasSpecializations && !specialization) {
      const errorMsg = "Please select a Specialization";
      setError(errorMsg);
      if (onError) onError(errorMsg, true);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    setError(null);

    const normalizeAcademicYear = (year) => {
      // "2025-2026" → "2025-26"
      if (/^\d{4}-\d{4}$/.test(year)) {
        const [start, end] = year.split("-");
        return `${start}-${end.slice(-2)}`;
      }

      // already correct: "2025-26"
      if (/^\d{4}-\d{2}$/.test(year)) {
        return year;
      }

      return null; // invalid format
    };

    const normalizedAcademicYear = normalizeAcademicYear(academicYear)
    try {
      const selectedSubject = subjects.find(
        (s) => s.Sub_Code === subject || s._id === subject
      );
      
      const requestData = {
        course: selectedSubject?.Course_ID || "",
        semester,
        subject: subject.trim(),
        academicYear: normalizedAcademicYear,
      };

      // Add specialization to request if required
      if (hasSpecializations && specialization) {
        requestData.specialization = specialization;
      }

      // Add section to request if selected
      if (section) {
        requestData.section = section;
      } else {
        requestData.section = null;
      }

      // Add date filters if provided
      if (startDate && endDate) {
        requestData.startDate = startDate;
        requestData.endDate = endDate;
      }

      console.log("Request Data being sent:", requestData);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/getAttendanceByCourseAndSubject`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Full API Response:", response.data);

      // Extract students array from response
      const studentsData = response.data.students || response.data || [];

      if (studentsData.length === 0) {
        const message = startDate && endDate
          ? `No attendance records found for the selected criteria between ${startDate} and ${endDate}`
          : "No attendance records found for the selected criteria";
        setError(message);
        setAttendanceSummary([]);
        if (onError) onError(message, true);
        return { success: false, error: message, data: [] };
      } else {
        setAttendanceSummary(studentsData);
        console.log("Attendance Summary Set Successfully:", studentsData);
        if (onSuccess) onSuccess(`Successfully fetched ${studentsData.length} student records`);
        return { success: true, data: studentsData };
      }
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
      console.error("Error response:", error.response?.data);

      const errorMsg = error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch attendance summary. Please try again.";

      setError(errorMsg);
      setAttendanceSummary([]);
      if (onError) onError(errorMsg, true);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Convenience function for fetching with date filters
  const fetchWithDateFilter = useCallback(async (params, startDate, endDate) => {
    return await fetchAttendanceSummary({
      ...params,
      startDate,
      endDate
    });
  }, [fetchAttendanceSummary]);

  // Function to update attendance summary (useful for real-time updates)
  const updateAttendanceSummary = useCallback((updatedData) => {
    setAttendanceSummary(updatedData);
  }, []);

  // Function to get attendance status based on percentage
  const getAttendanceStatus = useCallback((classesAttended, totalClasses) => {
    const percentage = calculatePercentage(classesAttended, totalClasses);
    if (percentage >= 50) return "Good";
    if (percentage >= 30) return "Warning";
    return "Critical";
  }, [calculatePercentage]);

  // Function to filter attendance summary by status
  const filterByStatus = useCallback((status) => {
    return attendanceSummary.filter(record => {
      const recordStatus = getAttendanceStatus(record.classesAttended, record.totalClasses);
      return recordStatus.toLowerCase() === status.toLowerCase();
    });
  }, [attendanceSummary, getAttendanceStatus]);

  // Function to get attendance statistics
  const getAttendanceStats = useCallback(() => {
    if (attendanceSummary.length === 0) {
      return {
        total: 0,
        good: 0,
        warning: 0,
        critical: 0,
        averageAttendance: 0
      };
    }

    const stats = attendanceSummary.reduce((acc, record) => {
      const percentage = parseFloat(calculatePercentage(record.classesAttended, record.totalClasses));
      const status = getAttendanceStatus(record.classesAttended, record.totalClasses);

      acc.total++;
      acc.totalPercentage += percentage;

      switch (status.toLowerCase()) {
        case 'good':
          acc.good++;
          break;
        case 'warning':
          acc.warning++;
          break;
        case 'critical':
          acc.critical++;
          break;
        default:
          break;
      }

      return acc;
    }, {
      total: 0,
      good: 0,
      warning: 0,
      critical: 0,
      totalPercentage: 0
    });

    return {
      ...stats,
      averageAttendance: (stats.totalPercentage / stats.total).toFixed(2)
    };
  }, [attendanceSummary, calculatePercentage, getAttendanceStatus]);

  return {
    // State
    attendanceSummary,
    loading,
    error,

    // Functions
    fetchAttendanceSummary,
    fetchWithDateFilter,
    clearAttendanceSummary,
    updateAttendanceSummary,

    // Utility functions
    calculatePercentage,
    getAttendanceStatus,
    filterByStatus,
    getAttendanceStats
  };
};