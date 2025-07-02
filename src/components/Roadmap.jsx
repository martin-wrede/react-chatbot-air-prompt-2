import React, { useState, useContext } from 'react';
import { Context } from '../Context';
import './Roadmap.css';

// CSS styles as JavaScript object
const styles = {

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
  const endHour = startHour + hours;
  const endMinute = startMinute;
  
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
};

// Helper function to generate ICS content with proper time handling
const generateICS = (roadmapData, labels) => {
  const icsHeader = `BEGIN:VCALENDAR
VE5RSION:2.0
PRODID:-//AI Coach//Roadmap//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

  const icsFooter = `END:VCALENDAR`;

  const events = roadmapData.map(item => {
    const date = new Date(item.date);
    const [startHour, startMinute] = (item.dailyStartTime || '10:00').split(':').map(Number);
    const duration = item.dailyHours || 1;
    
    // Set start time
    const startDate = new Date(date);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    // Set end time
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + duration);
    
    const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    // completion mw 2025-07-2
   ///  const isCompleted = item.completed === true; // or use a Set/map if needed
    
    const isCompleted = completedTasks.has(task.date);
const prefix = isCompleted ? '✅ ' : '';
const label = isCompleted ? '[Completed] ' : '';

// text:

// details: `${label}${data.roadmapLabels?.taskLabel}: ${task.task}\n\n${data.roadmapLabels?.startTimeLabel}: ${task.dailyStartTime || '10:00'}\n${data.roadmapLabels?.durationLabel}: ${task.dailyHours || 1} ${data.roadmapLabels?.hoursLabel}\n\n${data.roadmapLabels?.motivationLabel}: ${task.motivation}`;

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
  const [hoveredButton, setHoveredButton] = useState(null);

  // Use roadmapData from props or fallback to sample data from context
  ///  const currentRoadmapData = roadmapData || data.sampleRoadmapData || [];

  const currentRoadmapData = (roadmapData || data.sampleRoadmapData || []).map(item => ({
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

  // Set start and end time
  const startDate = new Date(date);
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + duration);

  const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // ✅ Check if this task is marked as completed
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

  // Get language from context or default to 'de'
  const language = data.language || 'en';

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
          style={{
            ...styles.exportButton,
            ...(hoveredButton === 'export' ? styles.exportButtonHover : {})
          }}
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
          const endTime = calculateEndTime(item.dailyStartTime || '10:00', item.dailyHours || 1);
          
          return (
            <div
              key={item.date}
              style={{
                ...styles.card,
                ...(isCompleted ? styles.cardCompleted : {}),
                ...(hoveredButton === item.date ? { transform: 'translateY(-2px)', boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)' } : {})
              }}
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
                <button
                  onClick={() => toggleTaskComplete(item.date)}
                  style={{
                    ...styles.completeButton,
                    ...(isCompleted ? styles.completeButtonActive : styles.completeButtonInactive)
                  }}
                >
                  {isCompleted ? (data.roadmapLabels?.completedIcon || '✅') : (data.roadmapLabels?.incompleteIcon || '⭕')}
                </button>
              </div>

              {/* Time Information */}
              <div className="timeSection">
                <div className="timeInfo">
                  <div className="timeValue">{data.roadmapLabels?.startTimeIcon || '🕘'} {item.dailyStartTime || '10:00'}</div>
                  <div className="timeLabel">{data.roadmapLabels?.startTimeLabel || 'START TIME'}</div>
                </div>
                <div className="timeInfo">
                  <div className="timeValue">{data.roadmapLabels?.durationIcon || '⏱️'} {item.dailyHours || 1}{data.roadmapLabels?.hoursShort || 'h'}</div>
                  <div className="timeLabel">{data.roadmapLabels?.durationLabel || 'DURATION'}</div>
                </div>
                <div className="timeInfo">
                  <div className="timeValue">{data.roadmapLabels?.endTimeIcon || '🕕'} {endTime}</div>
                  <div className="timeLabel">{data.roadmapLabels?.endTimeLabel || 'END TIME'}</div>
                </div>
              </div>

              {/* Task */}
              <div className="taskSection">
                <div className="sectionTitle">
                  {data.roadmapLabels?.taskIcon || '🎯'} {data.roadmapLabels?.todaysTask || "Today's Task"}
                </div>
                <p style={{
                  ...styles.taskText,
                  ...(isCompleted ? styles.taskCompleted : {})
                }}>

                  {item.task}
                </p>
              </div>

              {/* Motivation */}
              <div className="taskSection">
                <div className="sectionTitle">
                  {data.roadmapLabels?.motivationIcon || '💖'} {data.roadmapLabels?.motivationLabel || 'Motivation'}
                </div>
                <p className="motivationText">{item.motivation}</p>
              </div>

              {/* Google Calendar Link */}
              <a
                href={generateGoogleCalendarUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.googleCalendarLink,
                  ...(hoveredButton === `cal-${item.date}` ? { backgroundColor: '#bfdbfe' } : {})
                }}
                onMouseEnter={() => setHoveredButton(`cal-${item.date}`)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <span>{data.roadmapLabels?.calendarIcon || '🔗'}</span>
                {data.roadmapLabels?.addToGoogleCalendar || 'Add to Google Calendar'}
              </a>
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
              style={{
                ...styles.progressBarFill,
                width: `${currentRoadmapData.length > 0 ? (completedTasks.size / currentRoadmapData.length) * 100 : 0}%`
              }}
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
          {data.roadmapLabels?.infoText || 'The roadmap now includes detailed time management with start times, duration, and end times. Calendar exports include precise scheduling information.'}
        </p>
      </div>
    </div>
  );
}