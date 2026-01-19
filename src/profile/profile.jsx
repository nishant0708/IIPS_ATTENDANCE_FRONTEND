import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './profile.css';
import Navbar from '../Navbar/Navbar';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Modal from 'react-modal';
import AlertModal from '../AlertModal/AlertModal';
import defaultPhoto from "../Assets/profile_photo.png";

Modal.setAppElement('#root');

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = () => {
  const [profileData, setProfileData] = useState({
    photo: "",
    name: "",
    email: "",
    mobile_no: "",
    password: "",
    confirmPassword: ""
  });
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [newProfileData, setNewProfileData] = useState(profileData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = useState(false);
  
  const token = localStorage.getItem("token");
  const teacherId = localStorage.getItem("teacherId");

  const fetchTeacherDetails = useCallback(async () => {
    if (!token || !teacherId) {
      openAlertModal("Authentication required. Please log in.", true);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/teacher/getteacherDetails`,
        {
          teacherId: teacherId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const teacherData = response?.data?.teacher;
      if (teacherData) {
        setProfileData({
          name: teacherData.name || "",
          email: teacherData.email || "",
          mobile_no: teacherData.mobileNumber || "",
          password: teacherData.password || "",
          photo: teacherData.photo || defaultPhoto,
          confirmPassword: teacherData.password || "",
        });
      }
    } catch (error) {
      console.error("Error fetching teacher details:", error);
      if (error.response?.status === 401) {
        openAlertModal("Session expired. Please log in again.", true);
      } else {
        openAlertModal("Failed to fetch profile data.", true);
      }
    } finally {
      setLoading(false);
    }
  }, [token, teacherId]);

  useEffect(() => {
    fetchTeacherDetails();
  }, [fetchTeacherDetails]);

  const openModal = () => {
    setNewProfileData({ ...profileData, password: "", confirmPassword: "" });
    setEditPassword(false);
    setPasswordsMatch(true);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openAlertModal = (message, isError = false) => {
    setAlertMessage(message);
    setIsError(isError);
    setAlertIsOpen(true);
  };

  const handleSave = async () => {
    const { mobile_no, password, confirmPassword } = newProfileData;

    // Mobile number validation
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile_no)) {
      openAlertModal("Please enter a valid 10-digit mobile number.", true);
      return;
    }

    // Password validation if editing password
    if (editPassword) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        openAlertModal("Password must be at least 8 characters, contain one uppercase letter, one number, and one special character.", true);
        return;
      }

      if (password !== confirmPassword) {
        openAlertModal("Passwords do not match.", true);
        return;
      }
    }

    try {
      setLoading(true);
      
      const updateData = {
        teacherId: teacherId,
        mobile_no: newProfileData.mobile_no,
      };

      // Only include password if editing
      if (editPassword) {
        updateData.password = newProfileData.password;
      }

      await axios.post(
        `${API_BASE_URL}/teacher/edit`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      openAlertModal("Profile updated successfully!");

      // Refresh profile data and close modal
      setTimeout(() => {
        closeModal();
        fetchTeacherDetails();
      }, 1500);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      openAlertModal(
        error.response?.data?.message || "An error occurred while updating the profile.", 
        true
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  
  const toggleTheme = () => {
    if (theme === "light" || !theme) {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
  };

  if (loading && !profileData.name) {
    return (
      <div className={`profile-container-main ${theme}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`profile-container-main ${theme}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className={`profile-card ${theme}`}>
          <div className="profile-header">
            <img 
              src={profileData.photo} 
              alt="Profile" 
              className="profile-image"
              onError={(e) => {
                e.target.src = defaultPhoto;
              }}
            />
          </div>
          <div className="profile-details">
            <div className="profile-name">{profileData.name}</div>
            <p className="profile-email">Email: {profileData.email}</p>
            <p className="profile-mob">Mobile: {profileData.mobile_no}</p>
          </div>
          <button 
            className={`profile-edit-button ${theme}`} 
            onClick={openModal}
            disabled={loading}
          >
            Edit Profile
          </button>
        </div>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Edit Profile"
        className={`profile-modal ${theme}`}
        overlayClassName="profile-overlay"
      >
        <h2>Edit Profile</h2>
        <form className="profile-modal-form" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="profile-name">
            Name:
            <input 
              id="profile-name"
              type="text" 
              value={newProfileData.name} 
              disabled 
              className={theme} 
            />
          </label>
          <label htmlFor="profile-email">
            Email:
            <input 
              id="profile-email"
              type="email" 
              value={newProfileData.email} 
              disabled 
              className={theme} 
            />
          </label>
          <label htmlFor="profile-mobile">
            Mobile:
            <input
              id="profile-mobile"
              type="text"
              value={newProfileData.mobile_no}
              onChange={(e) => setNewProfileData({ ...newProfileData, mobile_no: e.target.value })}
              className={theme}
              maxLength="10"
              pattern="\d{10}"
            />
          </label>

          <button
            type="button"
            className={`profile-edit-password-button ${theme}`}
            onClick={() => {
              setEditPassword(!editPassword);
              if (editPassword) {
                // Reset password fields when canceling
                setNewProfileData({
                  ...newProfileData,
                  password: "",
                  confirmPassword: ""
                });
                setPasswordsMatch(true);
              }
            }}
          >
            {editPassword ? "Cancel Edit Password" : "Edit Password"}
          </button>

          {editPassword && (
            <>
              <label htmlFor="profile-password">
                Password:
                <div className="profile-password-field">
                  <input
                    id="profile-password"
                    type={showPassword ? "text" : "password"}
                    className={`${passwordsMatch ? "profile-input-normal" : "profile-input-faded"} ${theme}`}
                    value={newProfileData.password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setNewProfileData({
                        ...newProfileData,
                        password: newPassword,
                      });
                      setPasswordsMatch(newPassword === newProfileData.confirmPassword);
                    }}
                    autoComplete="new-password"
                  />
                  <span 
                    onClick={togglePasswordVisibility} 
                    className="profile-eye-icon"
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        togglePasswordVisibility();
                      }
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </label>
              <label htmlFor="profile-confirm-password">
                Confirm Password:
                <div className="profile-password-field">
                  <input
                    id="profile-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`${passwordsMatch ? "profile-input-normal" : "profile-input-faded"} ${theme}`}
                    value={newProfileData.confirmPassword}
                    onChange={(e) => {
                      const confirmPass = e.target.value;
                      setNewProfileData({
                        ...newProfileData,
                        confirmPassword: confirmPass,
                      });
                      setPasswordsMatch(newProfileData.password === confirmPass);
                    }}
                    autoComplete="new-password"
                  />
                  <span 
                    onClick={toggleConfirmPasswordVisibility} 
                    className="profile-eye-icon"
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleConfirmPasswordVisibility();
                      }
                    }}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </label>
            </>
          )}

          <div className="profile-modal-buttons">
            <button 
              type="button" 
              onClick={handleSave} 
              className={theme}
              disabled={loading || (editPassword && !passwordsMatch)}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button 
              type="button" 
              onClick={closeModal} 
              className={theme}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <AlertModal
        isOpen={alertIsOpen}
        onClose={() => setAlertIsOpen(false)}
        message={alertMessage}
        iserror={isError}
      />
    </>
  );
};

export default Profile;