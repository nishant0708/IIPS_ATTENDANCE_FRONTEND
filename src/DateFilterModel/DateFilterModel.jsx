import React, { useEffect, useState } from 'react';
import './DateFilter.css';

const DateFilterModal = ({ isOpen, onClose, onApplyFilter, currentStartDate, currentEndDate }) => {
   const [startDate, setStartDate] = useState(currentStartDate || '');
  const [endDate, setEndDate] = useState(currentEndDate || '');
  const [error, setError] = useState('');

  // Update local state when props change
  useEffect(() => {
    setStartDate(currentStartDate || '');
    setEndDate(currentEndDate || '');
  }, [currentStartDate, currentEndDate, isOpen]); // Added isOpen to ensure it updates when modal opens

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleStartDateChange = (e) => {
    const selectedStartDate = e.target.value;
    setStartDate(selectedStartDate);
    setError('');

    // If end date is already selected and is before start date, clear end date
    if (endDate && selectedStartDate > endDate) {
      setEndDate('');
    }
  };

  const handleEndDateChange = (e) => {
    const selectedEndDate = e.target.value;
    const today = getTodayDate();

    if (selectedEndDate > today) {
      setError('End date cannot be greater than current date');
      return;
    }

    if (startDate && selectedEndDate < startDate) {
      setError('End date cannot be earlier than start date');
      return;
    }

    setEndDate(selectedEndDate);
    setError('');
  };

  const handleApply = () => {
    if (!startDate || !endDate) {
      setError('Both start date and end date are required');
      return;
    }

    if (startDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }

    const today = getTodayDate();
    if (endDate > today) {
      setError('End date cannot be greater than current date');
      return;
    }

    onApplyFilter(startDate, endDate);
    onClose();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setError('');
    onApplyFilter('', ''); // Clear filters
    onClose();
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="date-filter-modal-overlay">
      <div className="date-filter-modal">
        <div className="date-filter-modal-header">
          <h3>Filter by Date Range</h3>
          <button className="date-filter-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="date-filter-modal-body">
          <div className="date-filter-input-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={handleStartDateChange}
              max={getTodayDate()}
              className="date-filter-input"
            />
          </div>

          <div className="date-filter-input-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || undefined}
              max={getTodayDate()}
              className="date-filter-input"
            />
          </div>

          {error && <div className="date-filter-error">{error}</div>}
        </div>

        <div className="date-filter-modal-footer">
          <button 
            className="date-filter-btn date-filter-btn-clear" 
            onClick={handleClear}
          >
            Clear Filter
          </button>
          <button 
            className="date-filter-btn date-filter-btn-apply" 
            onClick={handleApply}
            disabled={!startDate || !endDate || error}
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateFilterModal;