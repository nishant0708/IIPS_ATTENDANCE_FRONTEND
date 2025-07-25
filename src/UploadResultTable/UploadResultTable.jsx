import React from 'react';
import './UploadResultsTable.css';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEdit, 
  FaExclamationTriangle,
  FaUsers,
  FaGraduationCap,
  FaBook,
  FaChalkboardTeacher
} from 'react-icons/fa';

const UploadResultsTable = ({ uploadResult, category, theme }) => {
  if (!uploadResult) return null;

  const getCategoryIcon = (category) => {
    const iconMap = {
      student: <FaUsers />,
      course: <FaGraduationCap />,
      subject: <FaBook />,
      teacher: <FaChalkboardTeacher />
    };
    return iconMap[category] || <FaUsers />;
  };

  const getCategoryLabel = (category) => {
    const labelMap = {
      student: 'Students',
      course: 'Courses',
      subject: 'Subjects',
      teacher: 'Teachers'
    };
    return labelMap[category] || 'Items';
  };

  const getItemKey = (category) => {
    const keyMap = {
      student: 'Students',
      course: 'Courses',
      subject: 'Subjects',
      teacher: 'Teachers'
    };
    return keyMap[category] || 'Items';
  };

  const renderFailedSection = () => {
    const failedKey = `failed${getItemKey(category)}`;
    const skippedKey = `skipped${getItemKey(category)}`;
    const invalidKey = category === 'student' ? 'invalidRollNumbers' : null;
    
    const failedItems = uploadResult[failedKey] || [];
    const skippedItems = uploadResult[skippedKey] || [];
    const invalidItems = invalidKey ? uploadResult[invalidKey] || [] : [];
    
    const allFailedItems = [...failedItems, ...skippedItems, ...invalidItems];
    
    if (allFailedItems.length === 0) return null;

    return (
      <div className="results-section failed-section">
        <div className="section-header failed-header">
          <FaTimesCircle className="section-icon" />
          <h4>Failed ({allFailedItems.length})</h4>
        </div>
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Name/ID</th>
                <th>Details</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {allFailedItems.map((item, index) => (
                <tr key={index} className="failed-row">
                  <td className="item-name">
                    {item.name || item.Course_Id || item.Sub_Code || item.email || 'N/A'}
                  </td>
                  <td className="item-details">
                    {category === 'student' && (
                      <>
                        {item.rollNumber && <div><strong>Roll:</strong> {item.rollNumber}</div>}
                        {item.Course_Id && <div><strong>Course:</strong> {item.Course_Id}</div>}
                      </>
                    )}
                    {category === 'course' && (
                      <>
                        {item.Course_Name && <div><strong>Name:</strong> {item.Course_Name}</div>}
                        {item.No_of_Sem && <div><strong>Semesters:</strong> {item.No_of_Sem}</div>}
                      </>
                    )}
                    {category === 'subject' && (
                      <>
                        {item.Sub_Name && <div><strong>Name:</strong> {item.Sub_Name}</div>}
                        {item.Course_ID && <div><strong>Course:</strong> {item.Course_ID}</div>}
                      </>
                    )}
                    {category === 'teacher' && (
                      <>
                        {item.email && <div><strong>Email:</strong> {item.email}</div>}
                      </>
                    )}
                  </td>
                  <td className="item-reason">
                    <span className="error-badge">
                      {item.error || item.reason || 'Unknown error'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSuccessSection = (type, icon, color) => {
    const key = `${type}${getItemKey(category)}`;
    const items = uploadResult[key] || [];
    const count = uploadResult[type] || 0;
    
    if (count === 0) {
      return (
        <div className="results-section success-section">
          <div className={`section-header ${type}-header`}>
            {icon}
            <h4>{type.charAt(0).toUpperCase() + type.slice(1)} (0)</h4>
          </div>
          <div className="no-items-message">
            <p>No {getCategoryLabel(category).toLowerCase()} {type}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="results-section success-section">
        <div className={`section-header ${type}-header`}>
          {icon}
          <h4>{type.charAt(0).toUpperCase() + type.slice(1)} ({count})</h4>
        </div>
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Name/ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={`${type}-row`}>
                  <td className="item-name">
                    {typeof item === 'string' ? item : (item.name || item.Course_Id || item.Sub_Code || item.email || 'N/A')}
                  </td>
                  <td className="item-status">
                    <span className={`status-badge ${type}-badge`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`upload-results-container ${theme}`}>
      <div className="results-header">
        <div className="results-title">
          {getCategoryIcon(category)}
          <h3>Upload Results - {getCategoryLabel(category)}</h3>
        </div>
        <div className={`results-summary ${theme}`}>
          <div className="summary-item total">
            <span className="summary-label">Total Processed:</span>
            <span className="summary-value">{uploadResult.total || uploadResult.totalProcessed || 0}</span>
          </div>
          <div className="summary-item inserted">
            <span className="summary-label">Inserted:</span>
            <span className="summary-value">{uploadResult.inserted || 0}</span>
          </div>
          <div className="summary-item updated">
            <span className="summary-label">Updated:</span>
            <span className="summary-value">{uploadResult.updated || 0}</span>
          </div>
          <div className="summary-item failed">
            <span className="summary-label">Failed:</span>
            <span className="summary-value">
              {(uploadResult.skipped || 0) + (uploadResult.failed || 0) + (uploadResult.invalidRollNumbers?.length || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="results-content">
        {renderFailedSection()}
        {renderSuccessSection('inserted', <FaCheckCircle className="section-icon" />, 'success')}
        {renderSuccessSection('updated', <FaEdit className="section-icon" />, 'warning')}
      </div>
    </div>
  );
};

export default UploadResultsTable;