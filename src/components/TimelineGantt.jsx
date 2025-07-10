import React, { useState, useEffect } from 'react';

// Mock data based on your roadmap structure
const mockRoadmapData = [
  { 
    id: 'task-1', 
    date: '2025-07-10', 
    task: 'Write Value Proposition', 
    dailyStartTime: '10:00', 
    dailyHours: 6, 
    motivation: 'Drinks with colleagues',
    completed: false
  },
  { 
    id: 'task-2', 
    date: '2025-07-15', 
    task: 'Research 3 Landing Pages', 
    dailyStartTime: '09:00', 
    dailyHours: 4, 
    motivation: 'Call friends',
    completed: false
  },
  { 
    id: 'task-3', 
    date: '2025-07-20', 
    task: 'Design Mockups', 
    dailyStartTime: '11:00', 
    dailyHours: 8, 
    motivation: 'Weekend break',
    completed: true
  },
  { 
    id: 'task-4', 
    date: '2025-07-25', 
    task: 'Development Phase 1', 
    dailyStartTime: '10:00', 
    dailyHours: 6, 
    motivation: 'Launch celebration',
    completed: false
  }
];

const TimelineGantt = ({ roadmapData = mockRoadmapData, onTaskUpdate }) => {
  const [tasks, setTasks] = useState(roadmapData);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalDate, setOriginalDate] = useState('');

  // Calculate timeline bounds
  const dates = tasks.map(task => new Date(task.date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  // Add padding to the timeline
  const startDate = new Date(minDate);
  startDate.setDate(startDate.getDate() - 2);
  const endDate = new Date(maxDate);
  endDate.setDate(endDate.getDate() + 7);
  
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const dayWidth = 60; // pixels per day
  const timelineWidth = totalDays * dayWidth;

  // Helper function to get position from date
  const getPositionFromDate = (date) => {
    const taskDate = new Date(date);
    const daysDiff = Math.floor((taskDate - startDate) / (1000 * 60 * 60 * 24));
    return daysDiff * dayWidth;
  };

  // Helper function to get date from position
  const getDateFromPosition = (position) => {
    const days = Math.floor(position / dayWidth);
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + days);
    return newDate.toISOString().split('T')[0];
  };

  // Generate timeline header (dates)
  const generateTimelineHeader = () => {
    const headers = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      headers.push({
        date: new Date(current),
        position: getPositionFromDate(current)
      });
      current.setDate(current.getDate() + 1);
    }
    
    return headers;
  };

  const timelineHeaders = generateTimelineHeader();

  // Handle drag start
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    setDragStartX(e.clientX);
    setOriginalDate(task.date);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedTask) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newDate = getDateFromPosition(x);

    // Update task date
    const updatedTasks = tasks.map(task => 
      task.id === draggedTask.id 
        ? { ...task, date: newDate }
        : task
    );

    setTasks(updatedTasks);
    if (onTaskUpdate) onTaskUpdate(updatedTasks);
    
    setDraggedTask(null);
  };

  // Handle resize (duration change)
  const handleResize = (taskId, newDuration) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, dailyHours: newDuration }
        : task
    );
    setTasks(updatedTasks);
    if (onTaskUpdate) onTaskUpdate(updatedTasks);
  };

  return (
    <div className="timeline-container" style={{ 
      fontFamily: 'Arial, sans-serif',
      background: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Project Timeline</h2>
      
      {/* Timeline Header */}
      <div style={{ 
        height: '60px', 
        position: 'relative',
        borderBottom: '2px solid #e9ecef',
        marginBottom: '20px'
      }}>
        {timelineHeaders.map((header, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${header.position}px`,
              width: `${dayWidth}px`,
              height: '100%',
              borderRight: '1px solid #dee2e6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#6c757d'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              {header.date.toLocaleDateString('en', { weekday: 'short' })}
            </div>
            <div>
              {header.date.getDate()}/{header.date.getMonth() + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Tasks */}
      <div 
        style={{ 
          position: 'relative',
          minHeight: '400px',
          background: 'white',
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {tasks.map((task, index) => {
          const position = getPositionFromDate(task.date);
          const width = (task.dailyHours || 1) * (dayWidth / 24) * 24; // Full day width for hours
          const top = index * 80 + 20;
          
          return (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              style={{
                position: 'absolute',
                left: `${position}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: '60px',
                background: task.completed 
                  ? 'linear-gradient(135deg, #28a745, #20c997)'
                  : 'linear-gradient(135deg, #007bff, #6610f2)',
                borderRadius: '8px',
                padding: '8px',
                color: 'white',
                cursor: 'move',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {task.completed ? '✅ ' : ''}{task.task}
              </div>
              
              <div style={{ 
                fontSize: '12px',
                opacity: 0.9,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{task.dailyHours}h</span>
                <span>{new Date(task.date).toLocaleDateString('en', { 
                  month: 'short', 
                  day: 'numeric' 
                })}</span>
              </div>

              {/* Resize handle */}
              <div
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '0',
                  width: '8px',
                  height: '100%',
                  cursor: 'ew-resize',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '0 8px 8px 0'
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Add resize logic here
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ 
        marginTop: '20px',
        display: 'flex',
        gap: '20px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            background: 'linear-gradient(135deg, #007bff, #6610f2)',
            borderRadius: '4px'
          }}></div>
          <span>In Progress</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            borderRadius: '4px'
          }}></div>
          <span>Completed</span>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#e3f2fd',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#1976d2'
      }}>
        <strong>💡 How to use:</strong> Drag tasks horizontally to change their start date. 
        Use the resize handle on the right edge to adjust duration (coming soon).
      </div>
    </div>
  );
};

export default TimelineGantt;