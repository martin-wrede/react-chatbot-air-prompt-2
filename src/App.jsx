import React, { useState, useEffect } from 'react';
import Form from './components/Form';
import Roadmap from './components/Roadmap';
import { Upload, X, File, Download } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const [gesamtPrompt, setGesamtPrompt] = useState("")
 
  
// If you want to parse the URL of current page in browser:

let params = new URLSearchParams(location.search);

let part1 = params.get('part1');
let part2 = params.get('part2');
let part3 = params.get('part3');


// State for roadmap data - starts with sample data
  const [roadmapData, setRoadmapData] = useState([
    {
      date: '2025-06-25',
      task: 'Write value proposition: What transformation does the reader get?',
      dailyStartTime: '10:00',
      dailyHours: 6,
      motivation: 'Exchange of drinks'
    },
    {
      date: '2025-06-18',
      task: 'Research 3 competitor landing pages and note what works.',
      dailyStartTime: '10:00',
      dailyHours: 6,
      motivation: 'Call some friends'
    },
    {
      date: '2025-06-19',
      task: 'Brainstorm page sections: Hero, About, Book Preview, Testimonials, Buy CTA.',
      dailyStartTime: '10:00',
      dailyHours: 6,
      motivation: 'Watch the movie about Steve Jobs'
    },
    {
      date: '2025-06-20',
     task: 'Write draft copy for each section (keep it concise + benefit-focused).',
      dailyStartTime: '10:00',
      dailyHours: 6,
      motivation: 'Get an ice cream'
    }
  ]);
 
  
   const [roadmapToday, setRoadmapToday] = useState([]);

  // Get today's date in the correct format
  const today = new Date().toISOString().split('T')[0];

  // Add this useEffect to update with real today's data
  useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = roadmapData.filter(item => item.date === today);
  setRoadmapToday(todayTasks); // always update, even if empty
}, [roadmapData]);
 

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
              motivation = 'Complete this important task!';
            }
            
            event.motivation = motivation || 'Stay focused and achieve your goals!';
          }
        });
        
        // Add event if it has required fields
        if (event.task && event.date) {
          // Set default values if missing
          if (!event.dailyStartTime) event.dailyStartTime = '09:00';
          if (!event.dailyHours) event.dailyHours = 2;
          if (!event.motivation) event.motivation = 'Keep pushing towards your goal!';
          
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
    if (!icsDate) return 'Unbekannt';
    
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
      return `ICS-Kalender mit ${events.length} Terminen:\n\n` + 
             events.map(event => 
               `- ${event.summary} (${formatIcsDate(event.start)})`
             ).join('\n') + 
             `\n\nOriginal ICS-Inhalt:\n${icsText}`;
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

  // COMPLETED: Function to process AI response and automatically import ICS data
  const processAIResponse = (content) => {
    const icsContents = extractIcsContent(content);
    const downloadLinks = [];
    let importedEvents = 0;
    let allParsedEvents = [];
    
    if (icsContents.length > 0) {
      // Process each ICS content
      icsContents.forEach((icsContent, index) => {
        const filename = `projekt-kalender-${index + 1}.ics`;
        const downloadLink = createIcsDownloadLink(icsContent, filename);
        downloadLinks.push(downloadLink);
        
        // Parse ICS content to roadmap data
        const parsedEvents = parseIcsToRoadmapData(icsContent);
        allParsedEvents = [...allParsedEvents, ...parsedEvents];
        importedEvents += parsedEvents.length;
      });
      
      // Update roadmap data if we have parsed events
      if (allParsedEvents.length > 0) {
        setRoadmapData(allParsedEvents);
        console.log(`Successfully imported ${importedEvents} events to roadmap`);
        
        // Add a success message to the chat
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'system',
            content: `✅ Automatisch ${importedEvents} Termine in den Projektplan importiert! Scrolle nach unten, um den aktualisierten Plan zu sehen.`
          }]);
        }, 1000);
      }
    }
    
    return {
      originalContent: content,
      icsContents,
      downloadLinks,
      importedEvents
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
        else {
          alert(`${file.name} ist kein unterstütztes Dateiformat. Nur .txt und .ics Dateien sind erlaubt.`);
          continue;
        }

        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          content: content,
          type: fileType,
          size: file.size,
          uploadedAt: new Date().toLocaleString('de-DE')
        };
        
        setUploadedFiles(prev => [...prev, fileData]);
      } catch (error) {
        console.error('Error reading file:', error);
        alert(`Fehler beim Lesen der Datei ${file.name}`);
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
        `[Datei: ${file.name} (${file.type})]\n${file.content}`
      ).join('\n\n---\n\n');

      messageContent = `${messageContent}\n\n[Hochgeladene Dateien:]\n${fileContext}`;
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

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || 'Keine Antwort generiert.';
      
      // Process the AI response for ICS content and auto-import
      const processedResponse = processAIResponse(aiContent);

      const assistantMessage = {
        role: 'assistant',
        content: processedResponse.originalContent,
        icsContents: processedResponse.icsContents,
        downloadLinks: processedResponse.downloadLinks,
        importedEvents: processedResponse.importedEvents
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Fehler bei der Verarbeitung.'
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
        <h2>1 Chatbot</h2>
      <div id="form-all-id">
        <Form onPromptChange={setGesamtPrompt} />
      </div>
      
      <br/>
      {gesamtPrompt && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f0f0f0',
          borderRadius: '5px',
          marginBottom: '10px',
          fontSize: '12px',
          maxHeight: '100px',
          overflow: 'auto'
        }}>
          <strong>Aktiver Prompt:</strong>  {gesamtPrompt}
        </div>
      )}
      <br/>
     
      {/* Chat Container All */}
      <div className="chat-container">
        <h2>AI Chatbot / Download link</h2>
        {/* Chat Messages Container */}
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="empty-chat">
              Beginne eine Unterhaltung...
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
                  {message.role === 'user' ? 'Du:' : 
                   message.role === 'system' ? 'System:' : 'AI:'}
                </strong>
                <div className="message-content">
                  {message.content}
                </div>
                
                {/* Import success indicator */}
                {message.role === 'assistant' && message.importedEvents > 0 && (
                  <div style={{
                    margin: '10px 0',
                    padding: '8px 12px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    ✅ {message.importedEvents} Termine automatisch in den Projektplan importiert
                  </div>
                )}
                
                {/* ICS Download Links */}
                {message.role === 'assistant' && message.downloadLinks && message.downloadLinks.length > 0 && (
                  <div className="ics-downloads">
                    <h4 style={{margin: '10px 0 5px 0', fontSize: '14px', color: '#666'}}>
                      📅 Kalender-Dateien:
                    </h4>
                    {message.downloadLinks.map((link, linkIndex) => (
                      <button
                        key={linkIndex}
                        onClick={link.download}
                        className="ics-download-button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          margin: '4px 8px 4px 0',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
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
              AI tippt...
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="file-section">
          <div className="file-upload-header">
            <label className="upload-button">
              <Upload size={16} />
              Text- und Kalender-Dateien hochladen
              <input
                type="file"
                multiple
                accept=".txt,.ics,text/plain,text/calendar"
                onChange={handleFileUpload}
                className="file-input"
              />
            </label>
            <span className="file-hint">
              .txt und .ics Dateien erlaubt (ICS-Dateien werden automatisch importiert)
            </span>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              <h4 className="files-title">
                Hochgeladene Dateien ({uploadedFiles.length}):
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
                          {formatFileSize(file.size)} • {file.uploadedAt} • {file.type === 'calendar' ? 'Kalender' : 'Text'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="delete-button"
                      title="Datei löschen"
                    >x
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
              <span>{uploadedFiles.length} Datei(en) angehängt</span>
            </div>
          )}
          <div className="input-controls">
            <textarea
              placeholder="Schreibe deine Nachricht..."
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
              {isLoading ? 'Senden...' : 'Senden'}
            </button>
          </div>
        </div>
      </div>
      {/* END OF PART 1 /////////////////////////////////////////////////////////////// */}
          </div>

        <div id="part2" style={{display:part2}}>
         {/*  
           <Roadmap
            roadmapData={roadmapToday}
           /> 
           */}
         

           
          {roadmapToday.length > 0 ? (
          <Roadmap roadmapData={roadmapToday} />
          ) : (
          <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          fontStyle: 'italic'
          }}>
          No tasks scheduled for today ! ({today})
       </div>
)}
        </div>



        
       
       <div id="part3" style={{ display:part3 }}>
        <h2>2 Projektplan</h2>
         <strong>ℹ️ Info:</strong> Der Projektplan wird automatisch aktualisiert, wenn die KI .ics-Kalender-Daten erstellt. 
         Aktuell werden <strong>{roadmapData.length} Termine</strong> angezeigt.
     
        <Roadmap 
          roadmapData={roadmapData}
          />
            </div>
    </div>
  );
}

export default App;