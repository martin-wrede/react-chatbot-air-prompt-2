import React, { useState, useContext, useEffect } from 'react';
import './Roadmap.css';
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

// CSS styles as JavaScript object for edit mode
const editStyles = {
  editButton: {
    padding: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editButtonHover: {
    backgroundColor: '#f3f4f6',
    color: '#4f46e5'
  },
  saveButton: {
    padding: '6px',
    backgroundColor: '#dcfce7',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#059669',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    padding: '6px',
    backgroundColor: '#fef2f2',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#dc2626',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editInput: {
    padding: '4px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
    color: '#1f2937',
    width: '100%'
  },
  timeInput: {
    padding: '2px 4px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: 'white',
    color: '#1f2937',
    width: '60px',
    textAlign: 'center'
  },
  numberInput: {
    padding: '2px 4px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: 'white',
    color: '#1f2937',
    width: '50px',
    textAlign: 'center'
  },
  textArea: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    color: '#1f2937',
    width: '100%',
    resize: 'vertical',
    minHeight: '60px',
    fontFamily: 'inherit'
  },
  buttonContainer: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center'
  }
};

// Main Roadmap Component
export default function Roadmap({ roadmapData, onRoadmapUpdate }) {
  const { data } = useContext(Context);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [localTasks, setLocalTasks] = useState(roadmapData || data.sampleRoadmapData || []);
  const [hoveredButton, setHoveredButton] = useState(null);

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

  const saveTask = (date) => {
    const updatedTasks = localTasks.map(task =>
      task.date === date
        ? { ...task, ...editedData }
        : task
    );
    
    // Update the local state for immediate UI feedback
    setLocalTasks(updatedTasks);

    // If the callback is provided, notify the parent component
    if (onRoadmapUpdate) {
      onRoadmapUpdate(updatedTasks);
    }

    setEditingTask(null);
    setEditedData({});
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
  
  // Calculate statistics
  const totalHours = currentRoadmapData.reduce((sum, item) => sum + (item.dailyHours || 0), 0);
  const completedHours = currentRoadmapData
    .filter(item => completedTasks.has(item.date))
    .reduce((sum, item) => sum + (item.dailyHours || 0), 0);
  const avgHoursPerDay = currentRoadmapData.length > 0 ? totalHours / currentRoadmapData.length : 0;

  const language = data.language || 'de';

  return (
    <div className="container">
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
                  <div className="dayName">{dateInfo.dayName}</div>
                  <div className="day">{dateInfo.day}</div>
                  <div className="monthYear">{dateInfo.month} {dateInfo.year}</div>
                </div>
                <button
                  onClick={() => toggleTaskComplete(item.date)}
                  className={`completeButton ${isCompleted ? 'completeButtonActive' : 'completeButtonInactive'}`}
                >
                  {isCompleted ? '✓' : '○'}
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
                      style={editStyles.timeInput}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        value={currentData.dailyHours || 1}
                        onChange={(e) => updateEditedData('dailyHours', parseFloat(e.target.value) || 1)}
                        style={editStyles.numberInput}
                        min="0.5"
                        step="0.5"
                      />
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>h</span>
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
                    <button
                      onClick={() => startEditing(item)}
                      style={{
                        ...editStyles.editButton,
                        ...(hoveredButton === `edit-${item.date}` ? editStyles.editButtonHover : {}),
                        marginLeft: '8px'
                      }}
                      onMouseEnter={() => setHoveredButton(`edit-${item.date}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      title="Edit"
                    >
                      ✎
                    </button>
                  )}
                  {isEditing && (
                    <div style={{ ...editStyles.buttonContainer, marginLeft: '8px' }}>
                      <button
                        onClick={() => saveTask(item.date)}
                        style={editStyles.saveButton}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={editStyles.cancelButton}
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
                    style={editStyles.editInput}
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
                    style={editStyles.textArea}
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
        <div className="infoText">{data.roadmapLabels?.infoText || 'Click on tasks to mark them as complete, or edit them to customize your schedule.'}</div>
      </div>
    </div>
  );
}