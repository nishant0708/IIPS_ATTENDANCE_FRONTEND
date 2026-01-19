import React, { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { FaPowerOff } from "react-icons/fa";
import "./Navbar.css";
import defaultPhoto from "../Assets/profile_photo.png";


const Navbar = ({ theme, toggleTheme }) => {
  const [open, setOpen] = useState(false);
  const [adminMenu, setAdminMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    setPhoto(localStorage.getItem("photo") || defaultPhoto);
    setIsAdmin(localStorage.getItem("email") === "nishantkaushal0708@gmail.com");
  }, []);

  useEffect(() => {
    // Add/remove class to body for page content shifting
    if (adminMenu && isAdmin) {
      document.body.classList.add('admin-dropdown-open');
      
      // Find and shift multiple possible content containers
      const selectors = [
        '.page-content', 
        'main', 
        '.container', 
        '.app-container',
        '#root > div',
        'body > div:first-child'
      ];
      
      let contentFound = false;
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Skip navbar and sidebar elements
          if (element && 
              !element.classList.contains('navbar') && 
              !element.classList.contains('navbar-sidebar') &&
              !element.closest('.navbar') && 
              !element.closest('.navbar-sidebar')) {
            element.classList.add('shifted');
            contentFound = true;
          }
        });
      });
      
      // If no specific containers found, try the first div after body
      if (!contentFound) {
        const firstDiv = document.querySelector('body > div:first-child');
        if (firstDiv && !firstDiv.classList.contains('navbar')) {
          firstDiv.classList.add('shifted');
        }
      }
    } else {
      document.body.classList.remove('admin-dropdown-open');
      
      // Remove shifted class from all elements
      const allShifted = document.querySelectorAll('.shifted');
      allShifted.forEach(element => {
        element.classList.remove('shifted');
      });
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('admin-dropdown-open');
      const allShifted = document.querySelectorAll('.shifted');
      allShifted.forEach(element => {
        element.classList.remove('shifted');
      });
    };
  }, [adminMenu, isAdmin]);

  const responsive = () => {
    const sidebar = document.getElementsByClassName("navbar-sidebar")[0];
    if (!open) {
      sidebar.style.transform = "translateX(0%)";
      setOpen(true);
      document.body.style.overflow = "hidden";
    } else {
      sidebar.style.transform = "translateX(100%)";
      setOpen(false);
      document.body.style.overflow = "auto";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sessionId");
    navigate("/");
  };

  const toggleAdminMenu = () => {
    setAdminMenu(!adminMenu);
  };

  const closeAdminMenu = () => {
    setAdminMenu(false);
  };

  // Handle theme toggle for admin users
  const handleThemeToggle = () => {
    toggleTheme();
    // Keep the dropdown open and maintain the shifted state after theme change
    setTimeout(() => {
      if (adminMenu && isAdmin) {
        // Re-apply the shifted state after theme change
        document.body.classList.add('admin-dropdown-open');
        const selectors = [
          '.page-content', 
          'main', 
          '.container', 
          '.app-container',
          '#root > div',
          'body > div:first-child'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element && 
                !element.classList.contains('navbar') && 
                !element.classList.contains('navbar-sidebar') &&
                !element.closest('.navbar') && 
                !element.closest('.navbar-sidebar')) {
              element.classList.add('shifted');
            }
          });
        });
      }
    }, 50);
  };

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminMenu && !event.target.closest('.admin-hamburger') && !event.target.closest('.admin-dropdown')) {
        setAdminMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminMenu]);

  return (
    <>
      <div className={`navbar ${theme}`}>
        <div
          className="navbar-contents navbar-left-margin"
          onClick={() => navigate(`/edit_profile`)}
        >
          <img
            className="pfp"
            src={photo}
            width="35"
            height="35"
            alt="profile"
          />
          <div>{localStorage.getItem("name")}</div>
        </div>

        {/* If not admin → normal menu */}
        {!isAdmin && (
          <div className="navbar-contents navbar-displayed">
            <p
              className={`navbar-links ${
                location.pathname === `/Dashboard` ? "active" : ""
              }`}
              onClick={() => navigate(`/Dashboard`)}
            >
              Dashboard
            </p>
            <p
              className={`navbar-links ${
                location.pathname === `/attendance_record` ? "active" : ""
              }`}
              onClick={() => navigate(`/attendance_record`)}
            >
              Attendance Record
            </p>
             <p
              className={`navbar-links ${
                location.pathname === `/attendance_history` ? "active" : ""
              }`}
              onClick={() => navigate(`/attendance_history`)}
            >
             Attendance History
            </p>
          </div>
        )}

        {/* Admin → hamburger dropdown */}
        {isAdmin && (
          <div className="navbar-contents navbar-displayed admin-nav">
            <div className="admin-hamburger" onClick={toggleAdminMenu}>
              {!adminMenu ? <FaBars size={22} /> : <FaTimes size={22} />}
            </div>
            
            <div
              className={`admin-dropdown ${theme} ${
                adminMenu ? "show" : "hide"
              }`}
            >
              <p
                className={`navbar-links ${
                  location.pathname === `/Dashboard` ? "active" : ""
                }`}
                onClick={() => {
                  navigate(`/Dashboard`);
                  closeAdminMenu();
                }}
              >
                Dashboard
              </p>
              <p
                className={`navbar-links ${
                  location.pathname === `/attendance_record` ? "active" : ""
                }`}
                onClick={() => {
                  navigate(`/attendance_record`);
                  closeAdminMenu();
                }}
              >
                Attendance Record
              </p>
              <p
              className={`navbar-links ${
                location.pathname === `/attendance_history` ? "active" : ""
              }`}
              onClick={() => navigate(`/attendance_history`)}
            >
             Attendance History
            </p>
              <p
                    className={`navbar-links ${theme} ${
                    location.pathname === `/TeacherManagement` ? "active" : ""
                     }`}
                    onClick={() => {
                    navigate(`/TeacherManagement`);
                     closeAdminMenu();
                       }}
                    >
                    Teacher Management
                     </p>

              <hr />
               <p
                    className={`navbar-links ${theme} ${
                    location.pathname === `/StudentManagement` ? "active" : ""
                     }`}
                    onClick={() => {
                    navigate(`/StudentManagement`);
                     closeAdminMenu();
                       }}
                    >
                    Student Management
                     </p>
              <p
                className={`navbar-links ${
                  location.pathname === `/admin` ? "active" : ""
                }`}
                onClick={() => {
                  navigate(`/admin`);
                  closeAdminMenu();
                }}
              >
                Upload Data
              </p>
             

              <hr />
               
              <p className="toggle-head">
                Toggle Theme:
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={handleThemeToggle}
                  />
                  <span className="slider round"></span>
                </label>
              </p>
             
               <hr />
              <p
                className="navbar-logout"
                onClick={() => {
                  handleLogout();
                  closeAdminMenu();
                }}
              >
               
                <span className="logbut">
                  <FaPowerOff size={15} /> Logout
                </span>
              </p>
             
            </div>
          </div>
        )}

        {/* Normal users still see toggle + logout */}
        {!isAdmin && (
          <div className="navbar-right-margin navbar-displayed">
            <p className="toggle-head">
              Toggle Theme:
              <label className="switch">
                <input
                  type="checkbox"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                />
                <span className="slider round"></span>
              </label>
            </p>
            <p className="navbar-logout" onClick={handleLogout}>
              <span className="logbut">
                <FaPowerOff size={15} /> Logout
              </span>
            </p>
          </div>
        )}

        {/* Mobile menu toggle (same for all) */}
        <div className="navbar-menu navbar-right-margin">
          <div
            className={`icon-container ${open ? "open" : ""}`}
            onClick={responsive}
          >
            {!open ? <FaBars size={24} /> : <FaTimes size={24} />}
          </div>
        </div>
      </div>

      {/* Sidebar (kept same) */}
      <div className={`navbar-sidebar ${theme}`}>
        <ul type="none" className="navbar-sidebar-ul">
          <li>
            <p
              className={`navbar-links ${theme} ${
                location.pathname === `/Dashboard` ? "active" : ""
              }`}
              onClick={() => {
                navigate(`/Dashboard`);
                responsive();
              }}
            >
              Dashboard
            </p>
          </li>
          <li>
            <p
              className={`navbar-links ${theme} ${
                location.pathname === `/attendance_record` ? "active" : ""
              }`}
              onClick={() => {
                navigate(`/attendance_record`);
                responsive();
              }}
            >
              Attendance Record
            </p>
            {isAdmin && (
              <>
                <p
                  className={`navbar-links ${theme} ${
                    location.pathname === `/admin` ? "active" : ""
                  }`}
                  onClick={() => {
                    navigate(`/admin`);
                    responsive();
                  }}
                >
                  Upload Data
                </p>
                <p
                  className={`navbar-links ${theme} ${
                    location.pathname === `/TeacherManagement` ? "active" : ""
                  }`}
                  onClick={() => {
                    navigate(`/TeacherManagement`);
                    responsive();
                  }}
                >
                  Teacher Management
                </p>
                <p
                  className={`navbar-links ${theme} ${
                    location.pathname === `/StudentManagement` ? "active" : ""
                  }`}
                  onClick={() => {
                    navigate(`/StudentManagement`);
                    responsive();
                  }}
                >
                  Student Management
                </p>
              </>
            )}
          </li>
          <li>
            <p
              className={`navbar-links ${theme} ${
                location.pathname === `/attendance_history` ? "active" : ""
              }`}
              onClick={() => {
                navigate(`/attendance_history`);
                responsive();
              }}
            >
              Attendance History
            </p>
          </li>

          {!isAdmin && (
            <li>
              <p className={`toggle-head ${theme}`}>
                Toggle Theme:
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                  />
                  <span className="slider round"></span>
                </label>
              </p>
              <p
                className={`navbar-logout navbar-logout-menu ${theme}`}
                onClick={() => {
                  handleLogout();
                  responsive();
                }}
              >
                <span className="logbut">
                  <FaPowerOff size={15} /> Logout
                </span>
              </p>
            </li>
          )}

          {isAdmin && (
            <li>
              <p className={`toggle-head ${theme}`}>
                Toggle Theme:
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                  />
                  <span className="slider round"></span>
                </label>
              </p>
              <p
                className={`navbar-logout navbar-logout-menu ${theme}`}
                onClick={() => {
                  handleLogout();
                  responsive();
                }}
              >
                <span className="logbut">
                  <FaPowerOff size={15} /> Logout
                </span>
              </p>
            </li>
          )}
        </ul>
      </div>
    </>
  );
};

export default Navbar;