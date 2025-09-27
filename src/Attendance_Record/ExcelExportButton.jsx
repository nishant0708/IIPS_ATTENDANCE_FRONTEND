import React from "react";
import * as XLSX from "xlsx";

const ExcelExportButton = ({ 
  attendanceSummary, 
  subjects, 
  course, 
  semester, 
  subject, 
  academicYear, 
  specialization, 
  section, 
  hasSpecializations,
  startDate, 
  endDate,
  showAlert 
}) => {
  
  // Calculate attendance percentage
  const calculatePercentage = (present, total) => {
    if (!total || total === 0) return 0;
    return ((present / total) * 100).toFixed(2);
  };

  const exportToExcel = () => {
    if (attendanceSummary.length === 0) {
      showAlert("No data to export", true);
      return;
    }

    try {
      const subjectName =
        subjects.find((s) => (s.Sub_Code || s._id) === subject)?.Sub_Name ||
        subject;

      const worksheetData = attendanceSummary.map((record) => {
        const percentage = calculatePercentage(
          record.classesAttended,
          record.totalClasses
        );
        const status =
          percentage >= 75 ? "Good" : percentage >= 65 ? "Warning" : "Critical";

        const rowData = {
          "Roll Number": record.rollNumber,
          "Student Name": record.studentName,
          Subject:
            subjects.find((s) => (s.Sub_Code || s._id) === record.subjectCode)
              ?.Sub_Name || record.subjectCode || subject,
          "Classes Attended": record.classesAttended,
          "Total Classes": record.totalClasses,
          "Attendance %": `${percentage}%`,
          Status: status,
        };

        // Add specialization column if applicable
        if (hasSpecializations && specialization) {
          rowData.Specialization = specialization;
        }

        // Add section column if selected
        if (section) {
          rowData.Section = section;
        }

        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Make the first row bold
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true },
        };
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Summary");

      let fileName = `${course}_${semester}Sem_${subjectName}_${academicYear}`;
      if (hasSpecializations && specialization) {
        fileName += `_${specialization}`;
      }
      if (section) {
        fileName += `_Section${section}`;
      }
      // Add date range to filename if filters are applied
      if (startDate && endDate) {
        fileName += `_${startDate}_to_${endDate}`;
      }
      fileName += "_Attendance.xlsx";

      XLSX.writeFile(workbook, fileName);

      showAlert("Export successful!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showAlert("Failed to export data. Please try again.", true);
    }
  };

  return (
    <button className="record_btn-export" onClick={exportToExcel}>
      Export to Excel
    </button>
  );
};

export default ExcelExportButton;