import React, { useState, useContext, useEffect } from 'react';
import './Roadmap.css';
import './RoadmapEdit.css'; // Import the new CSS file
import { Context } from '../Context';

// Helper functions
const formatDate = (dateStr, language = 'de') => {
  const date = new Date(dateStr);
  
  const daysDE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const daysEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const monthsDE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const days = language === 'de' ? daysDE : daysEN;
  const months = language === 'de' ? monthsDE : monthsEN;
  
  return {
    dayName: days[date.getDay()],
    day: date.getDate(),
    month: months[date.getMonth()],
    year: date.getFullYear(),
    fullDate: date.toLocaleDateString()
  };
};

const calculateEndTime = (startTime, hours) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const totalMinutes = startHour * 60 + startMinute + (hours * 60);
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
};

// Helper function to format date for input field (YYYY-MM-DD)
const formatDateForInput = (dateStr) => {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
};

// Helper function to generate ICS content
const generateICS = (roadmapData, labels) => {
  const icsHeader = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Coach//Roadmap//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

  const icsFooter = `END:VCALENDAR`;

  const events = roadmapData.map(item => {
    const date = new Date(item.date);
    const [startHour, startMinute] = (item.dailyStartTime || '10:00').split(':').map(Number);
    const duration = item.dailyHours || 1;
    
    const startDate = new Date(date);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setTime(startDate.getTime() + (duration * 60 * 60 * 1000));
    
    const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const isCompleted = item.completed;
    const summary = `${labels?.calendarEventPrefix || 'AI Coach'}: ${isCompleted ? '✅ ' : ''}${item.task}`;
    const description = `${labels?.taskLabel || 'Task'}: ${isCompleted ? '[Completed] ' : ''}${item.task}\\n\\n${labels?.startTimeLabel || 'START TIME'}: ${item.dailyStartTime || '10:00'}\\n${labels?.durationLabel || 'DURATION'}: ${item.dailyHours || 1} ${labels?.hoursLabel || 'hours'}\\n\\n${labels?.motivationLabel || 'Motivation'}: ${item.motivation}`;

    return `BEGIN:VEVENT
UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@aicoach.com
DTSTART:${startDateStr}
DTEND:${endDateStr}
SUMMARY:${summary}
DESCRIPTION:${description}
CATEGORIES:AI Coach,Personal Development
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
  }).join('\n');

  return `${icsHeader}\n${events}\n${icsFooter}`;
};

const generateGoogleCalendarUrl = (task, data, completedTasks) => {
  const labels = data.roadmapLabels;
  const date = new Date(task.date);
  const [startHour, startMinute] = (task.dailyStartTime || '10:00').split(':').map(Number);
  const duration = task.dailyHours || 1;

  const startDate = new Date(date);
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(startDate);
  endDate.setTime(startDate.getTime() + (duration * 60 * 60 * 1000));

  const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const isCompleted = completedTasks.has(task.date);
  const prefix = isCompleted ? '✅ ' : '';
  const label = isCompleted ? '[Completed] ' : '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${prefix}${labels?.calendarEventPrefix || ''}: ${task.task}`,
    dates: `${startDateStr}/${endDateStr}`,
    details: `${label}${labels?.taskLabel || 'Task'}: ${task.task}\n\n${labels?.startTimeLabel || 'START TIME'}: ${task.dailyStartTime || '10:00'}\n${labels?.durationLabel || 'DURATION'}: ${task.dailyHours || 1} ${labels?.hoursLabel || 'hours'}\n\n${labels?.motivationLabel || 'Motivation'}: ${task.motivation}`,
    location: isCompleted
      ? `[Completed] ${labels?.calendarLocation || 'Personal Development'}`
      : labels?.calendarLocation || 'Personal Development'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Main Roadmap Component
export default function Roadmap({ roadmapData, onRoadmapUpdate }) {
  const { data } = useContext(Context);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [localTasks, setLocalTasks] = useState(roadmapData || data.sampleRoadmapData || []);
  const [hoveredButton, setHoveredButton] = useState(null);
  
  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState(null);

  // This hook ensures the component updates if the parent's data changes
  useEffect(() => {
    setLocalTasks(roadmapData || data.sampleRoadmapData || []);
  }, [roadmapData, data.sampleRoadmapData]);

  // Use localTasks for rendering
  const currentRoadmapData = localTasks.map(item => ({
    ...item,
    completed: completedTasks.has(item.date),
  }));

  const toggleTaskComplete = (date) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(date)) {
      newCompleted.delete(date);
    } else {
      newCompleted.add(date);
    }
    setCompletedTasks(newCompleted);
  };

  const startEditing = (task) => {
    setEditingTask(task.date);
    setEditedData({
      date: task.date,
      dailyStartTime: task.dailyStartTime || '10:00',
      dailyHours: task.dailyHours || 1,
      task: task.task || '',
      motivation: task.motivation || ''
    });
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditedData({});
  };

  const saveTask = (originalDate) => {
    const updatedTasks = localTasks.map(task => {
      if (task.date === originalDate) {
        return { ...task, ...editedData };
      }
      return task;
    });
    
    // Update the local state for immediate UI feedback
    setLocalTasks(updatedTasks);

    // If the date changed, we need to update the completed tasks set
    if (editedData.date !== originalDate) {
      const newCompleted = new Set(completedTasks);
      if (newCompleted.has(originalDate)) {
        newCompleted.delete(originalDate);
        newCompleted.add(editedData.date);
      }
      setCompletedTasks(newCompleted);
    }

    // If the callback is provided, notify the parent component
    if (onRoadmapUpdate) {
      onRoadmapUpdate(updatedTasks);
    }

    setEditingTask(null);
    setEditedData({});
  };

  const showDeleteConfirmation = (date) => {
    const taskToDelete = localTasks.find(task => task.date === date);
    if (!taskToDelete) return;

    setConfirmationDialog({
      date: date,
      task: taskToDelete
    });
  };

  const confirmDelete = () => {
    if (!confirmationDialog) return;

    const { date } = confirmationDialog;
    
    // Remove from completed tasks if it was completed
    if (completedTasks.has(date)) {
      const newCompleted = new Set(completedTasks);
      newCompleted.delete(date);
      setCompletedTasks(newCompleted);
    }

    // Remove from task list
    const updatedTasks = localTasks.filter(task => task.date !== date);
    setLocalTasks(updatedTasks);

    // Notify parent component
    if (onRoadmapUpdate) {
      onRoadmapUpdate(updatedTasks);
    }

    // Close confirmation dialog
    setConfirmationDialog(null);
  };

  const cancelDelete = () => {
    setConfirmationDialog(null);
  };

  const updateEditedData = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const downloadICS = () => {
    const icsContent = generateICS(currentRoadmapData, data.roadmapLabels);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = data.roadmapLabels?.icsFileName || 'ai-coach-roadmap.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle ESC key to close confirmation dialog
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && confirmationDialog) {
        cancelDelete();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [confirmationDialog]);
  
  // Calculate statistics
  const totalHours = currentRoadmapData.reduce((sum, item) => sum + (item.dailyHours || 0), 0);
  const completedHours = currentRoadmapData
    .filter(item => completedTasks.has(item.date))
    .reduce((sum, item) => sum + (item.dailyHours || 0), 0);
  const avgHoursPerDay = currentRoadmapData.length > 0 ? totalHours / currentRoadmapData.length : 0;

  const language = data.language || 'de';

  return (
    <div className="container">
      {/* Confirmation Dialog */}
      {confirmationDialog && (
        <div className="confirmation-overlay" onClick={cancelDelete}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-title">
              {data.roadmapLabels?.deleteConfirmTitle || 'Delete Task?'}
            </div>
            <div className="confirmation-message">
              {data.roadmapLabels?.deleteConfirmMessage || 'Are you sure you want to delete this task? This action cannot be undone.'}
            </div>
            <div className="confirmation-task-preview">
              "{confirmationDialog.task.task}"
            </div>
            <div className="confirmation-buttons">
              <button
                onClick={confirmDelete}
                className="confirm-button"
              >
                {data.roadmapLabels?.deleteConfirmYes || 'Yes, Delete'}
              </button>
              <button
                onClick={cancelDelete}
                className="cancel-confirm-button"
              >
                {data.roadmapLabels?.deleteConfirmNo || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div className="headerTitle">
          <h1 className="title">{data.roadmapLabels?.title || 'Roadmap'}</h1>
        </div>
        <p className="subtitle">{data.roadmapLabels?.subtitle || 'Your personalized learning roadmap'}</p>
        <button onClick={downloadICS} className="exportButton">
          📅 {data.roadmapLabels?.downloadICS || 'Download ICS'}
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid">
        {currentRoadmapData.map((item) => {
          const dateInfo = formatDate(item.date, language);
          const isCompleted = completedTasks.has(item.date);
          const isEditing = editingTask === item.date;
          const currentData = isEditing ? editedData : item;
          const endTime = calculateEndTime(currentData.dailyStartTime || '10:00', currentData.dailyHours || 1);
          
          return (
            <div
              key={item.date}
              className={`card ${isCompleted ? 'cardCompleted' : ''}`}
            >
              <div className="cardHeader">
                <div className="dateInfo">
                  {isEditing ? (
                    <div className="editable-date-container">
                      <input
                        type="date"
                        value={formatDateForInput(currentData.date)}
                        onChange={(e) => updateEditedData('date', e.target.value)}
                        className="date-input"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="dayName">{dateInfo.dayName}</div>
                      <div className="day">{dateInfo.day}</div>
                      <div className="monthYear">{dateInfo.month} {dateInfo.year}</div>
                    </>
                  )}
                </div>
                         
                <button
                  onClick={() => toggleTaskComplete(item.date)}
                  className={`complete-button-edit ${isCompleted ? 'active' : 'inactive'}`}
                >
                  {isCompleted ? (
                    <span role="img" aria-label="Task completed">✅</span>
                  ) : (
                    <span role="img" aria-label="Task incomplete">⭕</span>
                  )}
                </button>
                
                <button
                  onClick={() => showDeleteConfirmation(item.date)}
                  className="delete-button"
                  style={{ marginLeft: '4px' }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>

              <div className="timeSection">
                <div className="timeInfo">
                  <div className="timeLabel">{data.roadmapLabels?.startTimeLabel || 'START TIME'}</div>
                  {isEditing ? (
                    <input
                      type="time"
                      value={currentData.dailyStartTime || '10:00'}
                      onChange={(e) => updateEditedData('dailyStartTime', e.target.value)}
                      className="time-input"
                    />
                  ) : (
                    <div className="timeValue">{currentData.dailyStartTime || '10:00'}</div>
                  )}
                </div>
                <div className="timeInfo">
                  <div className="timeLabel">{data.roadmapLabels?.endTimeLabel || 'END TIME'}</div>
                  <div className="timeValue">{endTime}</div>
                </div>
                <div className="timeInfo">
                  <div className="timeLabel">{data.roadmapLabels?.durationLabel || 'DURATION'}</div>
                  {isEditing ? (
                    <div className="duration-input-container">
                      <input
                        type="number"
                        value={currentData.dailyHours || 1}
                        onChange={(e) => updateEditedData('dailyHours', parseFloat(e.target.value) || 1)}
                        className="number-input"
                        min="0.5"
                        step="0.5"
                      />
                      <span>h</span>
                    </div>
                  ) : (
                    <div className="timeValue">{currentData.dailyHours || 1}h</div>
                  )}
                </div>
              </div>

              <div className="taskSection">
                <div className="sectionTitle">
                  {data.roadmapLabels?.taskLabel || 'TASK'}
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => startEditing(item)}
                        className="edit-button"
                        style={{ marginLeft: '8px' }}
                        title="Edit"
                      >
                        ✎
                      </button>
                      
                      <button
                        onClick={() => toggleTaskComplete(item.date)}
                        className={`complete-button-edit ${isCompleted ? 'active' : 'inactive'}`}
                      >
                        {isCompleted ? (
                          <span role="img" aria-label="Task completed">✅</span>
                        ) : (
                          <span role="img" aria-label="Task incomplete">⭕</span>
                        )}
                      </button>
                    </>
                  )}
                  {isEditing && (
                    <div className="button-container" style={{ marginLeft: '8px' }}>
                      <button
                        onClick={() => saveTask(item.date)}
                        className="save-button"
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="cancel-button"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.task || ''}
                    onChange={(e) => updateEditedData('task', e.target.value)}
                    className="edit-input"
                    placeholder="Task description"
                  />
                ) : (
                  <div className={`taskText ${isCompleted ? 'taskCompleted' : ''}`}>
                    {currentData.task}
                  </div>
                )}
              </div>

              <div className="taskSection">
                <div className="sectionTitle">{data.roadmapLabels?.motivationLabel || 'MOTIVATION'}</div>
                {isEditing ? (
                  <textarea
                    value={currentData.motivation || ''}
                    onChange={(e) => updateEditedData('motivation', e.target.value)}
                    className="text-area"
                    placeholder="Motivation..."
                  />
                ) : (
                  <div className="motivationText">{currentData.motivation}</div>
                )}
              </div>

              <a
                href={generateGoogleCalendarUrl(item, data, completedTasks)}
                target="_blank"
                rel="noopener noreferrer"
                className="googleCalendarLink"
              >
                📅 {data.roadmapLabels?.addToCalendar || 'Add to Google Calendar'}
              </a>
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="progressContainer">
        <h3 className="progressTitle">{data.roadmapLabels?.progressTitle || 'Progress Summary'}</h3>
        <div className="progressBar">
          <div className="progressBarTrack">
            <div 
              className="progressBarFill"
              style={{ width: `${Math.round((completedHours / totalHours) * 100) || 0}%` }}
            />
          </div>
          <div className="progressText">
            {Math.round((completedHours / totalHours) * 100) || 0}% {data.roadmapLabels?.completedLabel || 'completed'}
          </div>
        </div>
        <div className="timeStats">
          <div className="statCard">
            <div className="statValue">{completedHours.toFixed(1)}</div>
            <div className="statLabel">{data.roadmapLabels?.completedHoursLabel || 'Hours Completed'}</div>
          </div>
          <div className="statCard">
            <div className="statValue">{totalHours.toFixed(1)}</div>
            <div className="statLabel">{data.roadmapLabels?.totalHoursLabel || 'Total Hours'}</div>
          </div>
          <div className="statCard">
            <div className="statValue">{avgHoursPerDay.toFixed(1)}</div>
            <div className="statLabel">{data.roadmapLabels?.avgHoursLabel || 'Avg Hours/Day'}</div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="infoBox">
        <div className="infoTitle">{data.roadmapLabels?.infoTitle || 'How to use this roadmap'}</div>
        <div className="infoText">{data.roadmapLabels?.infoText || 'Click on tasks to mark them as complete, or edit them to customize your schedule and dates.'}</div>
      </div>
    </div>
  );
}