import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './profile.css';
import Navbar from '../Navbar/Navbar';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Modal from 'react-modal';
import AlertModal from '../AlertModal/AlertModal';
import defaultPhoto from "../Assets/profile_photo.png";

Modal.setAppElement('#root');

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
  const [passwordsMatch, setPasswordMatch] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/teacher/getteacherDetails`, {
          teacherId: localStorage.getItem("teacherId"),
        });

        const teacherData = response?.data?.teacher;
        if (teacherData) {
          setProfileData({
            name: teacherData.name,
            email: teacherData.email,
            mobile_no: teacherData.mobileNumber,
            password: teacherData.password,
            photo: teacherData.photo || defaultPhoto,
            confirmPassword: teacherData.password,
          });
        }
      } catch (error) {
        console.log("Error fetching teacher details:", error);
      }
    };

    fetchTeacherDetails();
  }, []);

  const openModal = () => {
    setNewProfileData({ ...profileData, password: "", confirmPassword: "" });
    setEditPassword(false);
    setPasswordMatch(true);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const openAlertModal = (message, isError = false) => {
    setAlertMessage(message);
    setIsError(isError);
    setAlertIsOpen(true);
  };

  const handleSave = () => {
  const { mobile_no, password, confirmPassword } = newProfileData;

  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(mobile_no)) {
    openAlertModal("Please enter a valid 10-digit mobile number.", true);
    return;
  }

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

  axios.post(`${process.env.REACT_APP_BACKEND_URL}/teacher/edit`, {
    teacherId: localStorage.getItem("teacherId"),
    ...newProfileData,
  })
    .then((response) => {
      openAlertModal("Profile updated successfully!");

      // Close the modal and reload the page after a short delay
      setTimeout(() => {
        closeModal();
        window.location.reload(); // Refresh the page
      }, 1500); // Optional delay to allow alert to be seen
    })
    .catch((error) => {
      openAlertModal("An error occurred while updating the profile.", true);
      console.log(error);
    });
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

  return (
    <>
       
      <div className={`profile-container-main ${theme}`}>
       <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className={`profile-card ${theme}`}>
          <div className="profile-header">
            <img src={profileData.photo} alt="Profile" className="profile-image" />
          </div>
          <div className="profile-details">
            <div className="profile-name">{profileData.name}</div>
            <p className="profile-email">Email: {profileData.email}</p>
            <p className="profile-mob">Mobile: {profileData.mobile_no}</p>
          </div>
          <button className={`profile-edit-button ${theme}`} onClick={openModal}>
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
        <form className="profile-modal-form">
          <label>
            Name:
            <input type="text" value={newProfileData.name} disabled className={theme} />
          </label>
          <label>
            Email:
            <input type="email" value={newProfileData.email} disabled className={theme} />
          </label>
          <label>
            Mobile:
            <input
              type="text"
              value={newProfileData.mobile_no}
              onChange={(e) => setNewProfileData({ ...newProfileData, mobile_no: e.target.value })}
              className={theme}
            />
          </label>

          <button
            type="button"
            className={`profile-edit-password-button ${theme}`}
            onClick={() => setEditPassword(!editPassword)}
          >
            {editPassword ? "Cancel Edit Password" : "Edit Password"}
          </button>

          {editPassword && (
            <>
              <label>
                Password:
                <div className="profile-password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${passwordsMatch ? "profile-input-normal" : "profile-input-faded"} ${theme}`}
                    value={newProfileData.password}
                    onChange={(e) => {
                      setNewProfileData({
                        ...newProfileData,
                        password: e.target.value,
                      });
                      setPasswordMatch(e.target.value === newProfileData.confirmPassword);
                    }}
                  />
                  <span onClick={togglePasswordVisibility} className="profile-eye-icon">
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </label>
              <label>
                Confirm Password:
                <div className="profile-password-field">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`${passwordsMatch ? "profile-input-normal" : "profile-input-faded"} ${theme}`}
                    value={newProfileData.confirmPassword}
                    onChange={(e) => {
                      setNewProfileData({
                        ...newProfileData,
                        confirmPassword: e.target.value,
                      });
                      setPasswordMatch(newProfileData.password === e.target.value);
                    }}
                  />
                  <span onClick={toggleConfirmPasswordVisibility} className="profile-eye-icon">
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </label>
            </>
          )}

          <div className="profile-modal-buttons">
            <button type="button" onClick={handleSave} className={theme}>Save</button>
            <button type="button" onClick={closeModal} className={theme}>Cancel</button>
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