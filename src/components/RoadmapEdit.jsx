import React, { useState, useContext } from 'react';
import './Roadmap.css';

// Mock Context for demo - replace with your actual Context
const Context = React.createContext({
  data: {
    language: 'de',
    roadmapLabels: {
      headerIcon: '📅',
      title: 'AI Coach Roadmap',
      subtitle: 'Your personalized journey to success',
      exportIcon: '⬇️',
      exportButton: 'Export to Calendar (.ics)',
      completedIcon: '✅',
      incompleteIcon: '⭕',
      startTimeIcon: '🕘',
      startTimeLabel: 'STARTZEIT',
      durationIcon: '⏱️',
      durationLabel: 'DAUER',
      endTimeIcon: '🕕',
      endTimeLabel: 'ENDZEIT',
      taskIcon: '🎯',
      todaysTask: 'Heutige Aufgabe',
      motivationIcon: '💖',
      motivationLabel: 'Motivation',
      calendarIcon: '🔗',
      addToGoogleCalendar: 'Add to Google Calendar',
      progressTitle: 'Progress Summary',
      ofLabel: 'of',
      tasksCompleted: 'tasks completed',
      hoursShort: 'h',
      totalHours: 'Total Hours',
      completedHours: 'Completed Hours',
      avgHoursPerDay: 'Avg Hours/Day',
      remainingHours: 'Remaining Hours',
      infoTitle: 'Enhanced Time Tracking',
      infoText: 'The roadmap now includes detailed time management with start times, duration, and end times. Calendar exports include precise scheduling information.',
      calendarEventPrefix: 'AI Coach',
      taskLabel: 'Task',
      motivationLabel: 'Motivation',
      hoursLabel: 'hours',
      icsFileName: 'ai-coach-roadmap.ics',
      calendarLocation: 'Personal Development'
    },
    sampleRoadmapData: [
      {
        date: '2025-07-03',
        dailyStartTime: '09:00',
        dailyHours: 2,
        task: 'Complete React component refactoring',
        motivation: 'Improve code maintainability and performance'
      },
      {
        date: '2025-07-04',
        dailyStartTime: '10:30',
        dailyHours: 1.5,
        task: 'Design new user interface mockups',
        motivation: 'Create better user experience'
      },
      {
        date: '2025-07-05',
        dailyStartTime: '14:00',
        dailyHours: 3,
        task: 'Implement authentication system',
        motivation: 'Enhance application security'
      }
    ]
  }
});

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

// Helper function to format date based on language
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

// Helper function to calculate end time
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
    endDate.setHours(startDate.getHours() + duration);
    
    const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const isCompleted = item.completed;
    const summary = `${labels.calendarEventPrefix}: ${isCompleted ? '✅ ' : ''}${item.task}`;
    const description = `${labels.taskLabel}: ${isCompleted ? '[Completed] ' : ''}${item.task}\\n\\n${labels.startTimeLabel}: ${item.dailyStartTime || '10:00'}\\n${labels.durationLabel}: ${item.dailyHours || 1} ${labels.hoursLabel}\\n\\n${labels.motivationLabel}: ${item.motivation}`;

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

// Main Roadmap Component
export default function Roadmap({ roadmapData }) {
  const { data } = useContext(Context);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [tasks, setTasks] = useState(roadmapData || data.sampleRoadmapData || []);
  const [hoveredButton, setHoveredButton] = useState(null);

  const currentRoadmapData = tasks.map(item => ({
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
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.date === date 
          ? { ...task, ...editedData }
          : task
      )
    );
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

  const generateGoogleCalendarUrl = (task) => {
    const date = new Date(task.date);
    const [startHour, startMinute] = (task.dailyStartTime || '10:00').split(':').map(Number);
    const duration = task.dailyHours || 1;

    const startDate = new Date(date);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + duration);

    const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const isCompleted = completedTasks.has(task.date);
    const prefix = isCompleted ? '✅ ' : '';
    const label = isCompleted ? '[Completed] ' : '';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${prefix}${data.roadmapLabels?.calendarEventPrefix || ''}: ${task.task}`,
      dates: `${startDateStr}/${endDateStr}`,
      details: `${label}${data.roadmapLabels?.taskLabel}: ${task.task}\n\n${data.roadmapLabels?.startTimeLabel}: ${task.dailyStartTime || '10:00'}\n${data.roadmapLabels?.durationLabel}: ${task.dailyHours || 1} ${data.roadmapLabels?.hoursLabel}\n\n${data.roadmapLabels?.motivationLabel}: ${task.motivation}`,
      location: isCompleted
        ? `[Completed] ${data.roadmapLabels?.calendarLocation || 'Personal Development'}`
        : data.roadmapLabels?.calendarLocation || 'Personal Development'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
          <span style={{ fontSize: '24px' }}>{data.roadmapLabels?.headerIcon || '📅'}</span>
          <h1 className="title">{data.roadmapLabels?.title || 'AI Coach Roadmap'}</h1>
        </div>
        <p className="subtitle">{data.roadmapLabels?.subtitle || 'Your personalized journey to success'}</p>
        
        {/* Export Button */}
        <button
          className="exportButton"
          style={hoveredButton === 'export' ? { backgroundColor: '#4338ca', transform: 'translateY(-1px)' } : {}}
          onClick={downloadICS}
          onMouseEnter={() => setHoveredButton('export')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <span>{data.roadmapLabels?.exportIcon || '⬇️'}</span>
          {data.roadmapLabels?.exportButton || 'Export to Calendar (.ics)'}
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
              style={hoveredButton === item.date ? { transform: 'translateY(-2px)', boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)' } : {}}
              onMouseEnter={() => setHoveredButton(item.date)}
              onMouseLeave={() => setHoveredButton(null)}
            >
              {/* Date Header */}
              <div className="cardHeader">
                <div className="dateInfo">
                  <div className="dayName">{dateInfo.dayName}</div>
                  <div className="day">{dateInfo.day}</div>
                  <div className="monthYear">{dateInfo.month} {dateInfo.year}</div>
                </div>
                
                {/* Edit and Complete Controls */}
                <div style={editStyles.buttonContainer}>
                  {!isEditing && (
                    <button
                      onClick={() => startEditing(item)}
                      style={{
                        ...editStyles.editButton,
                        ...(hoveredButton === `edit-${item.date}` ? editStyles.editButtonHover : {})
                      }}
                      onMouseEnter={() => setHoveredButton(`edit-${item.date}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      title="Edit task"
                    >
                      ✏️
                    </button>
                  )}
                  
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveTask(item.date)}
                        style={editStyles.saveButton}
                        title="Save changes"
                      >
                        ✅
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={editStyles.cancelButton}
                        title="Cancel editing"
                      >
                        ❌
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleTaskComplete(item.date)}
                      className={`completeButton ${isCompleted ? 'completeButtonActive' : 'completeButtonInactive'}`}
                    >
                      {isCompleted ? (data.roadmapLabels?.completedIcon || '✅') : (data.roadmapLabels?.incompleteIcon || '⭕')}
                    </button>
                  )}
                </div>
              </div>

              {/* Time Information */}
              <div className="timeSection">
                <div className="timeInfo">
                  <div className="timeValue">
                    {data.roadmapLabels?.startTimeIcon || '🕘'} 
                    {isEditing ? (
                      <input
                        type="time"
                        value={currentData.dailyStartTime || '10:00'}
                        onChange={(e) => updateEditedData('dailyStartTime', e.target.value)}
                        style={editStyles.timeInput}
                      />
                    ) : (
                      currentData.dailyStartTime || '10:00'
                    )}
                  </div>
                  <div className="timeLabel">{data.roadmapLabels?.startTimeLabel || 'STARTZEIT'}</div>
                </div>
                
                <div className="timeInfo">
                  <div className="timeValue">
                    {data.roadmapLabels?.durationIcon || '⏱️'} 
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="24"
                        value={currentData.dailyHours || 1}
                        onChange={(e) => updateEditedData('dailyHours', parseFloat(e.target.value) || 1)}
                        style={editStyles.numberInput}
                      />
                    ) : (
                      currentData.dailyHours || 1
                    )}
                    {data.roadmapLabels?.hoursShort || 'h'}
                  </div>
                  <div className="timeLabel">{data.roadmapLabels?.durationLabel || 'DAUER'}</div>
                </div>
                
                <div className="timeInfo">
                  <div className="timeValue">{data.roadmapLabels?.endTimeIcon || '🕕'} {endTime}</div>
                  <div className="timeLabel">{data.roadmapLabels?.endTimeLabel || 'ENDZEIT'}</div>
                </div>
              </div>

              {/* Task */}
              <div className="taskSection">
                <div className="sectionTitle">
                  {data.roadmapLabels?.taskIcon || '🎯'} {data.roadmapLabels?.todaysTask || "Heutige Aufgabe"}
                </div>
                {isEditing ? (
                  <textarea
                    value={currentData.task || ''}
                    onChange={(e) => updateEditedData('task', e.target.value)}
                    style={editStyles.textArea}
                    placeholder="Enter task description..."
                  />
                ) : (
                  <p className={`taskText ${isCompleted ? 'taskCompleted' : ''}`}>
                    {currentData.task}
                  </p>
                )}
              </div>

              {/* Motivation */}
              <div className="taskSection">
                <div className="sectionTitle">
                  {data.roadmapLabels?.motivationIcon || '💖'} {data.roadmapLabels?.motivationLabel || 'Motivation'}
                </div>
                {isEditing ? (
                  <textarea
                    value={currentData.motivation || ''}
                    onChange={(e) => updateEditedData('motivation', e.target.value)}
                    style={editStyles.textArea}
                    placeholder="Enter motivation..."
                  />
                ) : (
                  <p className="motivationText">{currentData.motivation}</p>
                )}
              </div>

              {/* Google Calendar Link */}
              {!isEditing && (
                <a
                  href={generateGoogleCalendarUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="googleCalendarLink"
                  style={hoveredButton === `cal-${item.date}` ? { backgroundColor: '#bfdbfe' } : {}}
                  onMouseEnter={() => setHoveredButton(`cal-${item.date}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <span>{data.roadmapLabels?.calendarIcon || '🔗'}</span>
                  {data.roadmapLabels?.addToGoogleCalendar || 'Add to Google Calendar'}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="progressContainer">
        <h2 className="progressTitle">{data.roadmapLabels?.progressTitle || 'Progress Summary'}</h2>
        <div className="progressBar">
          <div className="progressBarTrack">
            <div 
              className="progressBarFill"
              style={{ width: `${currentRoadmapData.length > 0 ? (completedTasks.size / currentRoadmapData.length) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="progressText">
            {completedTasks.size} {data.roadmapLabels?.ofLabel || 'of'} {currentRoadmapData.length} {data.roadmapLabels?.tasksCompleted || 'tasks completed'}
          </span>
        </div>
        
        {/* Time Statistics */}
        <div className="timeStats">
          <div className="statCard">
            <div className="statValue">{totalHours}{data.roadmapLabels?.hoursShort || 'h'}</div>
            <div className="statLabel">{data.roadmapLabels?.totalHours || 'Total Hours'}</div>
          </div>
          <div className="statCard">
            <div className="statValue">{completedHours}{data.roadmapLabels?.hoursShort || 'h'}</div>
            <div className="statLabel">{data.roadmapLabels?.completedHours || 'Completed Hours'}</div>
          </div>
          <div className="statCard">
            <div className="statValue">{avgHoursPerDay.toFixed(1)}{data.roadmapLabels?.hoursShort || 'h'}</div>
            <div className="statLabel">{data.roadmapLabels?.avgHoursPerDay || 'Avg Hours/Day'}</div>
          </div>
          <div className="statCard">
            <div className="statValue">{totalHours - completedHours}{data.roadmapLabels?.hoursShort || 'h'}</div>
            <div className="statLabel">{data.roadmapLabels?.remainingHours || 'Remaining Hours'}</div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="infoBox">
        <h3 className="infoTitle">{data.roadmapLabels?.infoTitle || 'Enhanced Time Tracking'}</h3>
        <p className="infoText">
          {data.roadmapLabels?.infoText || 'The roadmap now includes detailed time management with start times, duration, and end times. Calendar exports include precise scheduling information. Click the edit icon (✏️) to modify any task details.'}
        </p>
      </div>
    </div>
  );
}