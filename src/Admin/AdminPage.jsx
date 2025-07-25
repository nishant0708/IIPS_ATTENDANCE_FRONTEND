import React, { useState, useEffect, useRef } from "react";
import "./Admin.css";
import {
  FaUpload,
  FaFileAlt,
  FaUsers,
  FaBook,
  FaGraduationCap,
  FaTrash,
  FaInfoCircle,
  FaChalkboardTeacher,
  FaListUl,
  FaCheckCircle,
} from "react-icons/fa";
import Navbar from "../Navbar/Navbar"; // Update path as needed
import AlertModal from "../AlertModal/AlertModal"; // Update path as needed
import UploadResultsTable from "../UploadResultTable/UploadResultTable";

const AdminPage = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    document.title = "Admin: Data Upload";
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const categoryOptions = [
    {
      value: "student",
      label: "Student",
      icon: <FaUsers />,
      endpoint: "/teacher/upload-students",
      requiredFields: ["Roll Number", "Student Name", "Course_Id", "Sem_Id"],
      optionalFields: ["Email", "Phone", "section", "Specialization"],
      instructions: {
        description:
          "Upload student data with roll numbers, names, and course information.",
        requiredColumns: [
          {
            name: "Roll Number (or Roll No.)",
            description: "Format: XX-2KYY-NNN (e.g., IT-2K21-36, CS-2K22-150)",
          },
          {
            name: "Student Name (or Name)",
            description: "Full name of the student",
          },
          {
            name: "Course_Id",
            description: "Course identifier (e.g., CSE, IT, ECE)",
          },
          {
            name: "Sem_Id",
            description: "Semester identifier (e.g., 1, 2, 3, etc.)",
          },
        ],
        optionalColumns: [
          { name: "Email", description: "Student email address" },
          { name: "Phone", description: "Student phone number" },
          { name: "section", description: "Class section (e.g., A, B, C)" },
          {
            name: "Specialization",
            description: "Student specialization area",
          },
        ],
        example:
          "Roll Number,Student Name,Course_Id,Sem_Id,Email,Phone,section,Specialization\nIT-2K21-36,John Doe,CSE,3,john.doe@email.com,9876543210,A,AI/ML",
      },
    },
    {
      value: "course",
      label: "Course",
      icon: <FaGraduationCap />,
      endpoint: "/teacher/upload-courses",
      requiredFields: ["Course_Id", "Course_Name", "No_of_Sem"],
      optionalFields: [],
      instructions: {
        description:
          "Upload course information including course ID, name, and number of semesters.",
        requiredColumns: [
          {
            name: "Course_Id",
            description: "Unique course identifier (e.g., CSE, IT, ECE)",
          },
          { name: "Course_Name", description: "Full name of the course" },
          {
            name: "No_of_Sem",
            description: "Total number of semesters (numeric value)",
          },
        ],
        optionalColumns: [],
        example:
          "Course_Id,Course_Name,No_of_Sem\nCSE,Computer Science Engineering,8\nIT,Information Technology,8",
      },
    },
    {
      value: "subject",
      label: "Subject",
      icon: <FaBook />,
      endpoint: "/teacher/upload-subjects",
      requiredFields: ["Sub_Code", "Sub_Name", "Course_ID", "Sem_Id"],
      optionalFields: ["Specialization", "Semester", "Year"],
      instructions: {
        description:
          "Upload subject information with codes, names, and course mapping.",
        requiredColumns: [
          {
            name: "Sub_Code",
            description: "Unique subject code (e.g., CS101, IT201)",
          },
          { name: "Sub_Name", description: "Full name of the subject" },
          { name: "Course_ID", description: "Associated course identifier" },
          { name: "Sem_Id", description: "Semester identifier" },
        ],
        optionalColumns: [
          {
            name: "Specialization",
            description: "Subject specialization area",
          },
          { name: "Semester", description: "Semester number" },
          { name: "Year", description: "Academic year" },
        ],
        example:
          "Sub_Code,Sub_Name,Course_ID,Sem_Id,Specialization,Semester,Year\nCS101,Programming Fundamentals,CSE,1,,1,2024",
      },
    },
    {
      value: "teacher",
      label: "Teacher",
      icon: <FaChalkboardTeacher />,
      endpoint: "/teacher/upload-teachers",
      requiredFields: ["name", "email", "password"],
      optionalFields: [],
      instructions: {
        description: "Upload teacher information with login credentials.",
        requiredColumns: [
          { name: "name", description: "Full name of the teacher" },
          {
            name: "email",
            description: "Teacher email address (used for login)",
          },
          {
            name: "password",
            description: "Initial password (will be hashed)",
          },
        ],
        optionalColumns: [],
        example:
          "name,email,password\nDr. John Smith,john.smith@university.edu,password123",
      },
    },
  ];
  

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type === "text/csv" ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);
      } else {
        setModalMessage("Please select a valid CSV file.");
        setIsError(true);
        setModalIsOpen(true);
        e.target.value = "";
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "text/csv" ||
        droppedFile.name.endsWith(".csv")
      ) {
        setFile(droppedFile);
      } else {
        setModalMessage("Please drop a valid CSV file.");
        setIsError(true);
        setModalIsOpen(true);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!category) {
      setModalMessage("Please select a category.");
      setIsError(true);
      setModalIsOpen(true);
      return;
    }

    if (!file) {
      setModalMessage("Please select a CSV file to upload.");
      setIsError(true);
      setModalIsOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const selectedCategory = categoryOptions.find(
        (opt) => opt.value === category
      );
      const endpoint =
        selectedCategory?.endpoint || `/teacher/upload-${category}s`;

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}${endpoint}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Store the upload result for the table
        setUploadResult(result);
setTimeout(() => {
  resultRef.current?.scrollIntoView({ behavior: 'smooth' });
}, 100); // Give DOM a brief moment to render

        let successMessage = `${selectedCategory?.label} data uploaded successfully!`;

        // Add detailed success information if available
        if (result.inserted !== undefined) {
          successMessage += `\n\nInserted: ${result.inserted}`;
        }
        if (result.updated !== undefined) {
          successMessage += `\nUpdated: ${result.updated}`;
        }
        if (result.skipped !== undefined) {
          successMessage += `\nSkipped: ${result.skipped}`;
        }
        if (result.total !== undefined) {
          successMessage += `\nTotal processed: ${result.total}`;
        }
        if (result.count !== undefined) {
          successMessage += `\nTotal: ${result.count}`;
        }

        setModalMessage(successMessage);
        setIsError(false);
        setFile(null);
        // Don't reset category here so the table shows the correct category
        // setCategory('');
        // Reset file input
        document.getElementById("file-input").value = "";
      } else {
        setUploadResult(null);
        setModalMessage(
          result.message || result.error || "Upload failed. Please try again."
        );
        setIsError(true);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult(null);
      setModalMessage(
        "Upload failed. Please check your connection and try again."
      );
      setIsError(true);
    } finally {
      setIsLoading(false);
      setModalIsOpen(true);
    }
  };

  // Add this function to reset the results when category changes
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setUploadResult(null); // Clear previous results when category changes
  };

  const removeFile = () => {
    setFile(null);
    document.getElementById("file-input").value = "";
  };

  const handleCloseModal = () => {
    setModalIsOpen(false);
  };

  const selectedCategoryData = categoryOptions.find(
    (opt) => opt.value === category
  );

  const renderInstructionsContent = () => {
    if (!category) {
      return (
        <div className="default-instructions">
          <div
            style={{
              fontSize: "48px",
              marginBottom: "20px",
              color: "var(--button-background-color-light)",
            }}
          >
            📋
          </div>
          <h3>Select a Category</h3>
          <p>
            Choose which type of data you want to upload to see specific
            instructions and CSV format requirements.
          </p>
          <div
            style={{
              marginTop: "30px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {categoryOptions.map((option) => (
              <div
                key={option.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                {option.icon}
                <span>{option.label} Data</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="category-instructions">
        <div className="instructions-description">
          {selectedCategoryData.instructions.description}
        </div>

        <div className="instructions-section">
          <h4>
            <FaCheckCircle style={{ color: "var(--error-color)" }} />
            Required Columns:
          </h4>
          <ul className="instructions-list">
            {selectedCategoryData.instructions.requiredColumns.map(
              (col, index) => (
                <li key={index}>
                  <code className="column-name required">{col.name}</code>
                  <span className="column-description">{col.description}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {selectedCategoryData.instructions.optionalColumns.length > 0 && (
          <div className="instructions-section">
            <h4>
              <FaListUl style={{ color: "var(--warning-color)" }} />
              Optional Columns:
            </h4>
            <ul className="instructions-list">
              {selectedCategoryData.instructions.optionalColumns.map(
                (col, index) => (
                  <li key={index}>
                    <code className="column-name optional">{col.name}</code>
                    <span className="column-description">
                      {col.description}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        <div className="instructions-section">
          <h4>
            <FaFileAlt
              style={{ color: "var(--button-background-color-light)" }}
            />
            Example CSV Format:
          </h4>
          <pre className="csv-example">
            {selectedCategoryData.instructions.example}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className={`admin-container-main ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <AlertModal
        isOpen={modalIsOpen}
        onClose={handleCloseModal}
        message={modalMessage}
        iserror={isError}
      />

      <div className={`admin-split-container ${theme}`}>
        {/* Left Panel - Instructions */}
        <div className="admin-instructions-panel">
          <div className="instructions-header">
            <FaInfoCircle className="instruction-icon" />
            <span>CSV Format Instructions</span>
          </div>
          {renderInstructionsContent()}
        </div>

        {/* Right Panel - Upload Form */}
        <div className="admin-form-panel">
          <h3>Upload Data</h3>

          <form onSubmit={handleUpload}>
            <div className="admin-form-group">
              <label>
                <FaFileAlt className="label-icon" />
                Category:
              </label>
              <select
                value={category}
                onChange={handleCategoryChange} // Use the new handler
                className="admin-select"
                required
              >
                <option value="">Select Category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label>
                <FaUpload className="label-icon" />
                Upload CSV File:
              </label>
              <div
                className={`file-upload-area ${
                  dragActive ? "drag-active" : ""
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input").click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="file-input"
                  required
                />

                {!file ? (
                  <>
                    <FaUpload className="upload-icon" />
                    <p className="upload-text">
                      Click to select or drag and drop your CSV file
                    </p>
                    <p className="upload-subtext">
                      Only CSV files are accepted
                    </p>
                  </>
                ) : (
                  <div className="selected-file">
                    <div className="file-info">
                      <FaFileAlt className="file-icon" />
                      <div>
                        <p className="file-name">{file.name}</p>
                        <p className="file-size">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="admin-upload-btn"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload />
                  Upload Data
                </>
              )}
            </button>
          </form>
        </div>
        
      </div>
      {uploadResult && (
  <div className="upload-results-table" ref={resultRef}>
    <UploadResultsTable 
      uploadResult={uploadResult}
      category={category}
      theme={theme}
    />
  </div>
)}

    </div>
  );
};

export default AdminPage;
