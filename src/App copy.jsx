
import React, { useState, useEffect, useContext } from 'react';
import Form from './components/Form';
 import Roadmap from './components/RoadmapEdit';
// import Roadmap from './components/Roadmap';

import { Context } from './Context';
import { Upload, X, File, Download } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [gesamtPrompt, setGesamtPrompt] = useState("")
   const { data } = useContext(Context);
 
// If you want to parse the URL of current page in browser:
let params = new URLSearchParams(location.search);
let part1 = params.get('part1');
let part2 = params.get('part2');
let part3 = params.get('part3');

// State for roadmap data - starts with sample data
  const [roadmapData, setRoadmapData] = useState([
    {
      date: '2025-07-08',
      task: 'Schreibe Value Proposition: was bekommt der Users?',
      dailyStartTime: '10:00',
      dailyHours: 6,
      motivation: 'Drinks mit Kollegen'
    },
    {
      date: '2025-06-18',
      task: 'Recherchiere 3 Landing Pages und schreib auf, was funktioniert.',
      dailyStartTime: '10:00',
      dailyHours: 6,
      motivation: 'Freunde anrufenroad'
    }
  ]);
 
   const [roadmapToday, setRoadmapToday] = useState([]);
  // Get today's date in the correct format
  // Get today's date in the correct format
  const today = new Date().toISOString().split('T')[0];

  // Add this useEffect to update with real today's data
  useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = roadmapData.filter(item => item.date === today);
  setRoadmapToday(todayTasks); // always update, even if empty
}, [roadmapData]);

  // NEW: Handler for updates made in the RoadmapEdit component
  const handleRoadmapUpdate = (updatedData) => {
    // The child component returns the complete, updated list of tasks.
    // We sort it by date and set it as the new state.
    updatedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    setRoadmapData(updatedData);
  };

  // NEW: Function to parse JSON content and convert to roadmap data format
  const parseJsonToRoadmapData = (jsonContent) => {
    try {
      let parsedData;
      
      // Try to parse as JSON
      if (typeof jsonContent === 'string') {
        parsedData = JSON.parse(jsonContent);
      } else {
        parsedData = jsonContent;
      }
      
      // Ensure it's an array
      if (!Array.isArray(parsedData)) {
        console.warn('JSON data is not an array, wrapping in array');
        parsedData = [parsedData];
      }
      
      // Validate and normalize each item
      const validatedData = parsedData.map(item => {
        // Validate required fields
        if (!item.date || !item.task) {
          console.warn('Missing required fields in JSON item:', item);
          return null;
        }
        
        // Normalize the data structure
        return {
          date: item.date,
          task: item.task,
          dailyStartTime: item.dailyStartTime || '09:00',
          dailyHours: item.dailyHours || 2,
          motivation: item.motivation || (data?.chat_defaultMotivation || 'Erreiche dein Ziel!')
        };
      }).filter(item => item !== null); // Remove invalid items
      
      // Sort by date
      validatedData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log(`Successfully parsed ${validatedData.length} tasks from JSON`);
      return validatedData;
      
    } catch (error) {
      console.error('Error parsing JSON content:', error);
      return [];
    }
  };

  // NEW: Function to extract JSON content from text (supports multiple formats)
  const extractJsonContent = (text) => {
    const jsonContents = [];
    
    // Pattern 1: JSON code blocks (```json ... ```)
    const jsonCodeBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = jsonCodeBlockRegex.exec(text)) !== null) {
      jsonContents.push(match[1]);
    }
    
    // Pattern 2: Plain JSON arrays/objects (starting with [ or {)
    const jsonObjectRegex = /(\[[\s\S]*?\]|\{[\s\S]*?\})/g;
    const potentialJsonMatches = text.match(jsonObjectRegex);
    
    if (potentialJsonMatches) {
      potentialJsonMatches.forEach(potentialJson => {
        try {
          // Try to parse to verify it's valid JSON
          JSON.parse(potentialJson);
          // Only add if it's not already captured by code block regex
          if (!jsonContents.some(existing => existing.includes(potentialJson.trim()))) {
            jsonContents.push(potentialJson);
          }
        } catch (e) {
          // Not valid JSON, ignore
        }
      });
    }
    
    return jsonContents;
  };

  // NEW: Function to create download link for JSON files
  const createJsonDownloadLink = (jsonContent, filename = 'roadmap.json') => {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    return {
      url,
      filename,
      download: () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    };
  };

  // Function to parse ICS content and convert to roadmap data format
  const parseIcsToRoadmapData = (icsContent) => {
    try {
      const events = [];
      const eventBlocks = icsContent.split('BEGIN:VEVENT');
      
      eventBlocks.slice(1).forEach(block => {
        const lines = block.split('\n').map(line => line.trim());
        const event = {};
        
        lines.forEach(line => {
          if (line.startsWith('SUMMARY:')) {
            // Clean up the summary - remove "AI Coach:" prefix if present
            let task = line.replace('SUMMARY:', '').trim();
            if (task.startsWith('AI Coach:')) {
              task = task.replace('AI Coach:', '').trim();
            }
            event.task = task;
          }
          
          // Handle different datetime formats
          if (line.startsWith('DTSTART')) {
            let dateTimeStr = '';
            
            // Format 1: DTSTART;TZID=Europe/Berlin:20250702T090000
            if (line.includes('TZID=') && line.includes(':')) {
              const colonIndex = line.lastIndexOf(':');
              dateTimeStr = line.substring(colonIndex + 1);
            }
            // Format 2: DTSTART:20250702T090000Z
            else if (line.startsWith('DTSTART:')) {
              dateTimeStr = line.replace('DTSTART:', '').trim();
            }
            
            // Parse the datetime string
            if (dateTimeStr) {
              // Remove Z suffix if present
              dateTimeStr = dateTimeStr.replace('Z', '');
              
              // Parse YYYYMMDDTHHMMSS format
              const match = dateTimeStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
              if (match) {
                event.date = `${match[1]}-${match[2]}-${match[3]}`;
                event.dailyStartTime = `${match[4]}:${match[5]}`;
              }
              // Parse YYYY-MM-DDTHH:MM:SS format
              else {
                const isoMatch = dateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
                if (isoMatch) {
                  event.date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
                  event.dailyStartTime = `${isoMatch[4]}:${isoMatch[5]}`;
                }
              }
            }
          }
          
          // Handle DTEND to calculate duration
          if (line.startsWith('DTEND')) {
            let endDateTimeStr = '';
            
            if (line.includes('TZID=') && line.includes(':')) {
              const colonIndex = line.lastIndexOf(':');
              endDateTimeStr = line.substring(colonIndex + 1);
            } else if (line.startsWith('DTEND:')) {
              endDateTimeStr = line.replace('DTEND:', '').trim();
            }
            
            if (endDateTimeStr && event.dailyStartTime) {
              endDateTimeStr = endDateTimeStr.replace('Z', '');
              
              let endTime = '';
              const match = endDateTimeStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
              if (match) {
                endTime = `${match[4]}:${match[5]}`;
              } else {
                const isoMatch = endDateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
                if (isoMatch) {
                  endTime = `${isoMatch[4]}:${isoMatch[5]}`;
                }
              }
              
              // Calculate duration in hours
              if (endTime) {
                const [startHour, startMin] = event.dailyStartTime.split(':').map(Number);
                const [endHour, endMin] = endTime.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const durationMinutes = endMinutes - startMinutes;
                event.dailyHours = Math.max(1, Math.round(durationMinutes / 60));
              }
            }
          }   
          // Handle DURATION format
          if (line.startsWith('DURATION:PT')) {
            const durationStr = line.replace('DURATION:PT', '').trim();
            if (durationStr.includes('H')) {
              const hours = parseInt(durationStr.replace('H', '')) || 1;
              event.dailyHours = hours;
            } else if (durationStr.includes('M')) {
              const minutes = parseInt(durationStr.replace('M', '')) || 60;
              event.dailyHours = Math.max(1, Math.round(minutes / 60));
            }
          }
          
          // Extract motivation from description
          if (line.startsWith('DESCRIPTION:')) {
            const description = line.replace('DESCRIPTION:', '').trim();
            // Look for motivation in various formats
            const motivationPatterns = [
              /Motivation:\s*(.+?)(?:\\n|$)/i,
              /Belohnung:\s*(.+?)(?:\\n|$)/i,
              /Reward:\s*(.+?)(?:\\n|$)/i
            ];
            
            let motivation = '';
            for (const pattern of motivationPatterns) {
              const match = description.match(pattern);
              if (match) {
                motivation = match[1].trim();
                break;
              }
            }
            
            // If no specific motivation found, use a generic one
            if (!motivation && description.length > 10) {
              motivation = data?.chat_defaultMotivation || 'Complete this important task!';
            }
            
            event.motivation = motivation || (data?.chat_defaultMotivation || 'Stay focused and achieve your goals!');
          }
        });
        
        // Add event if it has required fields
        if (event.task && event.date) {
          // Set default values if missing
          if (!event.dailyStartTime) event.dailyStartTime = '09:00';
          if (!event.dailyHours) event.dailyHours = 2;
          if (!event.motivation) event.motivation = data?.chat_defaultMotivation || 'Keep pushing towards your goal!';     
          events.push(event);
        }
      });
      
      // Sort events by date
      events.sort((a, b) => new Date(a.date) - new Date(b.date));    
      return events;
    } catch (error) {
      console.error('Error parsing ICS content:', error);
      return [];
    }
  };

  // Helper function for formatting ICS dates
  const formatIcsDate = (icsDate) => {
    if (!icsDate) return data?.chat_unknownDate || 'Unbekannt';    
    const year = icsDate.substring(0, 4);
    const month = icsDate.substring(4, 6);
    const day = icsDate.substring(6, 8);
    const hour = icsDate.substring(9, 11);
    const minute = icsDate.substring(11, 13);
    
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };

  // Helper function for parsing ICS content for display
  const parseIcsContent = (icsText) => {
    const events = [];
    const eventBlocks = icsText.split('BEGIN:VEVENT');
    
    eventBlocks.slice(1).forEach(block => {
      const lines = block.split('\n');
      const event = {};
      
      lines.forEach(line => {
        if (line.startsWith('SUMMARY:')) {
          event.summary = line.replace('SUMMARY:', '').trim();
        }
        if (line.startsWith('DTSTART:')) {
          event.start = line.replace('DTSTART:', '').trim();
        }
        if (line.startsWith('DTEND:')) {
          event.end = line.replace('DTEND:', '').trim();
        }
        if (line.startsWith('DESCRIPTION:')) {
          event.description = line.replace('DESCRIPTION:', '').trim();
        }
      });
      
      if (event.summary) {
        events.push(event);
      }
    });
    
    if (events.length > 0) {
      const calendarText = data?.chat_icsCalendarWith || 'ICS-Kalender mit';
      const appointmentsText = data?.chat_appointments || 'Terminen';
      const originalContentText = data?.chat_originalIcsContent || 'Original ICS-Inhalt';
      
      return `${calendarText} ${events.length} ${appointmentsText}:\n\n` +
             events.map(event =>
               `- ${event.summary} (${formatIcsDate(event.start)})`
             ).join('\n') +
             `\n\n${originalContentText}:\n${icsText}`;
    }
    
    return icsText;
  };

  // Function to extract ICS content from text
  const extractIcsContent = (text) => {
    const icsRegex = /```ics\n([\s\S]*?)\n```/g;
    const matches = [];
    let match;
    
    while ((match = icsRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  };

  // Function to create download link for ICS files
  const createIcsDownloadLink = (icsContent, filename = 'calendar.ics') => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    return {
      url,
      filename,
      download: () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    };
  };

  // UPDATED: Function to process AI response and automatically import both ICS and JSON data
  const processAIResponse = (content) => {
    // Process ICS content
    const icsContents = extractIcsContent(content);
    const icsDownloadLinks = [];
    let icsImportedEvents = 0;
    let allIcsEvents = [];
    
    // Process JSON content
    const jsonContents = extractJsonContent(content);
    const jsonDownloadLinks = [];
    let jsonImportedEvents = 0;
    let allJsonEvents = [];
    
    // Handle ICS content
    if (icsContents.length > 0) {
      icsContents.forEach((icsContent, index) => {
        const filename = `projekt-kalender-${index + 1}.ics`;
        const downloadLink = createIcsDownloadLink(icsContent, filename);
        icsDownloadLinks.push(downloadLink);
        
        const parsedEvents = parseIcsToRoadmapData(icsContent);
        allIcsEvents = [...allIcsEvents, ...parsedEvents];
        icsImportedEvents += parsedEvents.length;
      });
    }
    
    // Handle JSON content
    if (jsonContents.length > 0) {
      jsonContents.forEach((jsonContent, index) => {
        const filename = `projekt-roadmap-${index + 1}.json`;
        const downloadLink = createJsonDownloadLink(jsonContent, filename);
        jsonDownloadLinks.push(downloadLink);
        
        const parsedEvents = parseJsonToRoadmapData(jsonContent);
        allJsonEvents = [...allJsonEvents, ...parsedEvents];
        jsonImportedEvents += parsedEvents.length;
      });
    }
    
    // Update roadmap data - prefer JSON over ICS if both exist
    const totalEvents = allJsonEvents.length + allIcsEvents.length;
    if (totalEvents > 0) {
      let finalEvents = [];
      
      if (allJsonEvents.length > 0) {
        finalEvents = allJsonEvents;
        console.log(`Successfully imported ${jsonImportedEvents} events from JSON to roadmap`);
      } else if (allIcsEvents.length > 0) {
        finalEvents = allIcsEvents;
        console.log(`Successfully imported ${icsImportedEvents} events from ICS to roadmap`);
      }
      
      // Combine and deduplicate if both exist
      if (allJsonEvents.length > 0 && allIcsEvents.length > 0) {
        const combinedEvents = [...allJsonEvents, ...allIcsEvents];
        // Remove duplicates based on date and task
        const uniqueEvents = combinedEvents.filter((event, index, self) =>
          index === self.findIndex(e => e.date === event.date && e.task === event.task)
        );
        finalEvents = uniqueEvents;
        console.log(`Combined ${uniqueEvents.length} unique events from JSON and ICS`);
      }
      
      setRoadmapData(finalEvents);
      
      // Add success message
      setTimeout(() => {
        let successMessage = '';
        if (allJsonEvents.length > 0 && allIcsEvents.length > 0) {
          successMessage = `✅ ${jsonImportedEvents} JSON-Termine und ${icsImportedEvents} ICS-Termine automatisch importiert!`;
        } else if (allJsonEvents.length > 0) {
          successMessage = data?.chat_autoImportSuccessJson || 'Automatisch {count} JSON-Termine in den Projektplan importiert!';
          successMessage = successMessage.replace('{count}', jsonImportedEvents);
        } else {
          successMessage = data?.chat_autoImportSuccess || 'Automatisch {count} Termine in den Projektplan importiert!';
          successMessage = successMessage.replace('{count}', icsImportedEvents);
        }
        
        setMessages(prev => [...prev, {
          role: 'system',
          content: successMessage + ' ' + (data?.chat_scrollDownToSee || 'Scrolle nach unten, um den aktualisierten Plan zu sehen.')
        }]);
      }, 1000);
    }
    
    const allDownloadLinks = [...icsDownloadLinks, ...jsonDownloadLinks];
    
    return {
      originalContent: content,icsContents, jsonContents, downloadLinks: allDownloadLinks, icsDownloadLinks,
      jsonDownloadLinks,   importedEvents: totalEvents,   icsImportedEvents,   jsonImportedEvents
    };
  };

  // File upload function with .ics support
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      try {
        let content;
        let fileType;
        
        // Text files (.txt)
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          content = await file.text();
          fileType = 'text';
        }
        // ICS calendar files
        else if (file.name.endsWith('.ics') || file.type === 'text/calendar') {
          content = await file.text();
          fileType = 'calendar';
          
          // Parse and import ICS content to roadmap
          const parsedEvents = parseIcsToRoadmapData(content);
          if (parsedEvents.length > 0) {
            setRoadmapData(parsedEvents);
            console.log(`Imported ${parsedEvents.length} events from uploaded ICS file`);
          }
          
          // ICS content for display
          content = parseIcsContent(content);
        }
        // JSON files
        else if (file.name.endsWith('.json') || file.type === 'application/json') {
          content = await file.text();
          fileType = 'json';
          
          // Parse and import JSON content to roadmap
          const parsedEvents = parseJsonToRoadmapData(content);
          if (parsedEvents.length > 0) {
            setRoadmapData(parsedEvents);
            console.log(`Imported ${parsedEvents.length} events from uploaded JSON file`);
          }
        }
        else {
          const errorMessage = data?.chat_unsupportedFileFormat || '{filename} ist kein unterstütztes Dateiformat. Nur .txt, .ics und .json Dateien sind erlaubt.';
          alert(errorMessage.replace('{filename}', file.name));
          continue;
        }

        const fileData = {
          id: Date.now() + Math.random(), name: file.name,
          content: content,
          type: fileType,
          size: file.size,
          uploadedAt: new Date().toLocaleString('de-DE')
        };
        
        setUploadedFiles(prev => [...prev, fileData]);
      } catch (error) {
        console.error('Error reading file:', error);
        const errorMessage = data?.chat_fileReadError || 'Fehler beim Lesen der Datei {filename}';
        alert(errorMessage.replace('{filename}', file.name));
      }
    }
    event.target.value = '';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    let messageContent = inputMessage;

    // Combine file content if available
    if (uploadedFiles.length > 0) {
      const fileContext = uploadedFiles.map(file =>
        `[${data?.chat_fileLabel || 'Datei'}: ${file.name} (${file.type})]\n${file.content}`
      ).join('\n\n---\n\n');

      const uploadedFilesLabel = data?.chat_uploadedFilesLabel || 'Hochgeladene Dateien';
      messageContent = `${messageContent}\n\n[${uploadedFilesLabel}:]\n${fileContext}`;
    }

    const userMessage = { role: 'user', content: messageContent };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = [
        { role: "system", content: gesamtPrompt },
        ...messages,
        userMessage
      ];

      const response = await fetch('/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          messages: conversationHistory,
          files: uploadedFiles
        }),
      });

      const responseData = await response.json();
      const aiContent = responseData.choices?.[0]?.message?.content || (data?.chat_noResponseGenerated || 'Keine Antwort generiert.');
      
      // Process the AI response for ICS and JSON content and auto-import
      const processedResponse = processAIResponse(aiContent);

      const assistantMessage = {
        role: 'assistant',
        content: processedResponse.originalContent,
        icsContents: processedResponse.icsContents,
        jsonContents: processedResponse.jsonContents,
        downloadLinks: processedResponse.downloadLinks,
        icsDownloadLinks: processedResponse.icsDownloadLinks,
        jsonDownloadLinks: processedResponse.jsonDownloadLinks,
        importedEvents: processedResponse.importedEvents,
        icsImportedEvents: processedResponse.icsImportedEvents,
        jsonImportedEvents: processedResponse.jsonImportedEvents
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data?.chat_processingError || 'Fehler bei der Verarbeitung.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app-container">
      <div id="part1" style={{backgroundColor:"white", display:part1}}>
      
          <h2>{data && data.app_Headline1}</h2>
        
      <div id="form-all-id">
        <Form onPromptChange={setGesamtPrompt} />
      </div>
      
      <br/>
      {gesamtPrompt && (
        <div style={{
         padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px', marginBottom: '10px',  fontSize: '12px',  maxHeight: '100px',  overflow: 'auto'
        }}>
          <strong>{data?.chat_activePromptLabel || 'Aktiver Prompt'}:</strong> {gesamtPrompt}
        </div>
      )}
      <br/>
     
      {/* Chat Container All */}
      <div className="chat-container">
          <h2>{data && data.app_Headline2}</h2>
        {/* Chat Messages Container */}
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="empty-chat">
              {data?.chat_startConversation || 'Beginne eine Unterhaltung...'}
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.role === 'user' ? 'message-user' :
                  message.role === 'system' ? 'message-system' : 'message-assistant'
                }`}
              >
                <strong>
                  {message.role === 'user' ? (data?.chat_youLabel || 'Du:') :
                   message.role === 'system' ? (data?.chat_systemLabel || 'System:') : (data?.chat_aiLabel || 'AI:')}
                </strong>
                <div className="message-content">
                  {message.content}
                </div>
                
                {/* Import success indicator */}
                {message.role === 'assistant' && message.importedEvents > 0 && (
                  <div style={{ margin: '10px 0', padding: '8px 12px', backgroundColor: '#d4edda',   color: '#155724',   borderRadius: '6px', fontSize: '12px',   fontWeight: '500'
                  }}>
                    ✅ {message.jsonImportedEvents > 0 && message.icsImportedEvents > 0
                      ? `${message.jsonImportedEvents} JSON-Termine und ${message.icsImportedEvents} ICS-Termine automatisch importiert`
                      : message.jsonImportedEvents > 0
                      ? (data?.chat_importedJsonToRoadmap || '{count} JSON-Termine automatisch in den Projektplan importiert').replace('{count}', message.jsonImportedEvents)
                      : (data?.chat_importedToRoadmap || '{count} Termine automatisch in den Projektplan importiert').replace('{count}', message.icsImportedEvents)}
                  </div>
                )}
                
                {/* Download Links */}
                {message.role === 'assistant' && message.downloadLinks && message.downloadLinks.length > 0 && (
                  <div className="download-links">
                    <h4 style={{margin: '10px 0 5px 0', fontSize: '14px', color: '#666'}}>
                      📄 {data?.chat_downloadFilesLabel || 'Download-Dateien:'}
                    </h4>
                    {message.downloadLinks.map((link, linkIndex) => (
                      <button
                        key={linkIndex}
                        onClick={link.download}
                        className="download-button"
                        // here starts the copy of old App.jsx  mw
                        style={{  display: 'inline-flex', alignItems: 'center',  gap: '6px',   padding: '8px 12px',   margin: '4px 8px 4px 0',  backgroundColor: '#4CAF50',
                          color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',  fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
                      >
                        <Download size={14} />
                        {link.filename}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message message-loading">
              {data?.chat_aiTyping || 'AI tippt...'}
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="file-section">
          <div className="file-upload-header">
            <label className="upload-button">
              <Upload size={16} />
              {data?.chat_uploadFilesLabel || 'Text- und Kalender-Dateien hochladen'}
              <input
                type="file"
                multiple
                accept=".txt,.ics,.json,text/plain,text/calendar,application/json"
                onChange={handleFileUpload}
                className="file-input"
              />
            </label>
            <span className="file-hint">
              {data?.chat_fileHint || '.txt, .json und .ics Dateien erlaubt (werden automatisch importiert)'}
            </span>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">

              <h4 className="files-title">
                {(data?.chat_uploadedFilesTitle || 'Hochgeladene Dateien ({count}):').replace('{count}', uploadedFiles.length)}
              </h4>
              <div className="files-list">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="file-item">
                    <div className="file-info">
                      <File size={14} color="#666" />
                      <div className="file-details">
                        <div className="file-name">
                          {file.name} {file.type === 'calendar' && '📅'}
                        </div>
                        <div className="file-meta">
                          {formatFileSize(file.size)} • {file.uploadedAt} • {file.type === 'calendar' ? (data?.chat_calendarType || 'Kalender') : (data?.chat_textType || 'Text')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="delete-button"
                      title={data?.chat_deleteFileTooltip || 'Datei löschen'}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          {uploadedFiles.length > 0 && (
            <div className="attached-files-indicator">
              <File size={14} />
              <span>{(data?.chat_filesAttached || '{count} Datei(en) angehängt').replace('{count}', uploadedFiles.length)}</span>
            </div>
          )}
          <div className="input-controls">
            <textarea
              placeholder={data?.chat_messagePlaceholder || 'Schreibe deine Nachricht...'}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="message-input"
              rows={2}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)}
              className={`send-button ${(isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)) ? 'disabled' : ''}`}
            >
              {isLoading ? (data?.chat_sendingButton || 'Senden...') : (data?.chat_sendButton || 'Senden')}
            </button>
          </div>
        </div>
      </div>
      {/* END OF PART 1 /////////////////////////////////////////////////////////////// */}
          </div>
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        <div id="part2" 
        //  style={{display:'block'}} 
         // 
        style={{display:part2}}
        >
               
          {roadmapToday.length > 0 ? (
            <Roadmap roadmapData={roadmapToday} isToday={true} />
          ) : (
            <div style={{padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic'
            }}>
            {(data?.chat_noTasksToday || 'Keine Aufgaben für heute! ({today})').replace('{today}', today)}
        </div>
          )}
        </div>

       <div id="part3" style={{ display:part3 }}>   
          <h2>{data && data.app_Headline3}</h2>
          <p style={{marginBottom: '15px'}}>
            <strong>ℹ️ {data?.chat_infoLabel || 'Info'}:</strong>
             
            {(data?.chat_roadmapInfo 
              || 'Der Projektplan wird automatisch aktualisiert, wenn die KI .ics- oder .json-Kalenderdaten erstellt. Aktuell werden {count} Termine angezeigt.'
            ).replace('{count}', roadmapData.length)}
          </p>
        <Roadmap 
          roadmapData={roadmapData}
          onRoadmapUpdate={handleRoadmapUpdate}
        />
       </div>
    </div>
  );
}

export default App;
