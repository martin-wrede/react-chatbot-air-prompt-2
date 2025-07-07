import React, { useState, useEffect, useContext } from 'react';
import Form from './components/Form';
import Roadmap from './components/RoadmapEdit';
import { Context } from './Context';
import { Upload, X, File, Download } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [gesamtPrompt, setGesamtPrompt] = useState("");
  const { data } = useContext(Context);
 
  // If you want to parse the URL of current page in browser:
  let params = new URLSearchParams(location.search);
  let part1 = params.get('part1');
  let part2 = params.get('part2');
  let part3 = params.get('part3');

  // State for roadmap data - starts with sample data
  const [roadmapData, setRoadmapData] = useState([
    {
      date: '2025-06-25',
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
      motivation: 'Freunde anrufen'
    }
  ]);
 
  const [roadmapToday, setRoadmapToday] = useState([]);

  // useEffect to update with real today's data
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = roadmapData.filter(item => item.date === today);
    setRoadmapToday(todayTasks); // always update, even if empty
  }, [roadmapData]);

  // Handler for updates made in the RoadmapEdit component
  const handleRoadmapUpdate = (updatedData) => {
    updatedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    setRoadmapData(updatedData);
  };

  // Function to parse JSON content and convert to roadmap data format
  const parseJsonToRoadmapData = (jsonContent) => {
    try {
      let parsedData = (typeof jsonContent === 'string') ? JSON.parse(jsonContent) : jsonContent;
      if (!Array.isArray(parsedData)) parsedData = [parsedData];
      
      const validatedData = parsedData.map(item => {
        if (!item.date || !item.task) return null;
        return {
          date: item.date,
          task: item.task,
          dailyStartTime: item.dailyStartTime || '09:00',
          dailyHours: item.dailyHours || 2,
          motivation: item.motivation || (data?.chat_defaultMotivation || 'Erreiche dein Ziel!')
        };
      }).filter(Boolean);
      
      validatedData.sort((a, b) => new Date(a.date) - new Date(b.date));
      console.log(`Successfully parsed ${validatedData.length} tasks from JSON`);
      return validatedData;
    } catch (error) {
      console.error('Error parsing JSON content:', error);
      return [];
    }
  };

  // Function to extract JSON content from text
  const extractJsonContent = (text) => {
    const jsonContents = [];
    const jsonCodeBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
    let match;
    while ((match = jsonCodeBlockRegex.exec(text)) !== null) {
      jsonContents.push(match[1]);
    }
    
    // Fallback for plain JSON arrays/objects
    if (jsonContents.length === 0) {
        const potentialJson = text.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/);
        if (potentialJson) {
            try {
                JSON.parse(potentialJson[0]);
                jsonContents.push(potentialJson[0]);
            } catch (e) { /* Ignore invalid JSON */ }
        }
    }
    return jsonContents;
  };

  // Function to create download link for JSON files
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
            let task = line.replace('SUMMARY:', '').trim();
            if (task.startsWith('AI Coach:')) task = task.replace('AI Coach:', '').trim();
            event.task = task;
          }
          if (line.startsWith('DTSTART')) {
            const dateTimeStr = line.substring(line.lastIndexOf(':') + 1).replace('Z', '');
            const match = dateTimeStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
            if (match) {
              event.date = `${match[1]}-${match[2]}-${match[3]}`;
              event.dailyStartTime = `${match[4]}:${match[5]}`;
            }
          }
          if (line.startsWith('DURATION:PT')) {
            const durationStr = line.replace('DURATION:PT', '');
            event.dailyHours = parseInt(durationStr) || 1;
          }
          if (line.startsWith('DESCRIPTION:')) {
            const description = line.replace('DESCRIPTION:', '').trim();
            const motivationMatch = description.match(/Motivation:\s*(.+?)(?:\\n|$)/i);
            if (motivationMatch) event.motivation = motivationMatch[1].trim();
          }
        });
        
        if (event.task && event.date) {
          events.push({
            dailyStartTime: '09:00',
            dailyHours: 2,
            motivation: data?.chat_defaultMotivation || 'Keep pushing!',
            ...event
          });
        }
      });
      
      events.sort((a, b) => new Date(a.date) - new Date(b.date));    
      return events;
    } catch (error) {
      console.error('Error parsing ICS content:', error);
      return [];
    }
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

  // UPDATED: Function to process AI response and automatically import data
  const processAIResponse = (content) => {
    const icsContents = extractIcsContent(content);
    const jsonContents = extractJsonContent(content);
    
    let allIcsEvents = [], allJsonEvents = [];
    
    icsContents.forEach(ics => allIcsEvents.push(...parseIcsToRoadmapData(ics)));
    jsonContents.forEach(json => allJsonEvents.push(...parseJsonToRoadmapData(json)));

    const icsDownloadLinks = icsContents.map((ics, i) => createIcsDownloadLink(ics, `kalender-${i+1}.ics`));
    const jsonDownloadLinks = jsonContents.map((json, i) => createJsonDownloadLink(json, `roadmap-${i+1}.json`));
    
    // Prefer JSON data if available, otherwise use ICS
    const finalEvents = allJsonEvents.length > 0 ? allJsonEvents : allIcsEvents;
    
    if (finalEvents.length > 0) {
        setRoadmapData(finalEvents);
        setTimeout(() => {
            const count = finalEvents.length;
            const type = allJsonEvents.length > 0 ? "JSON" : "ICS";
            const successMessage = (data?.chat_autoImportSuccess || `✅ Automatically imported {count} ${type} events into the project plan. Scroll down to see the result.`)
                .replace('{count}', count);

            setMessages(prev => [...prev, { role: 'system', content: successMessage }]);
        }, 1000);
    }
    
    return {
      originalContent: content,
      downloadLinks: [...icsDownloadLinks, ...jsonDownloadLinks],
      importedEvents: finalEvents.length,
      icsImportedEvents: allIcsEvents.length,
      jsonImportedEvents: allJsonEvents.length,
    };
  };

  // File upload function
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    for (const file of files) {
      try {
        const content = await file.text();
        let fileType = 'text';
        let imported = false;

        if (file.name.endsWith('.json') || file.type === 'application/json') {
          fileType = 'json';
          const parsedEvents = parseJsonToRoadmapData(content);
          if (parsedEvents.length > 0) {
            setRoadmapData(parsedEvents);
            imported = true;
          }
        } else if (file.name.endsWith('.ics') || file.type === 'text/calendar') {
          fileType = 'calendar';
          const parsedEvents = parseIcsToRoadmapData(content);
          if (parsedEvents.length > 0) {
            setRoadmapData(parsedEvents);
            imported = true;
          }
        } else if (!file.type.startsWith('text/')) {
           alert((data?.chat_unsupportedFileFormat || '{filename} is not a supported file format.').replace('{filename}', file.name));
           continue;
        }

        if (imported) {
            console.log(`Imported events from uploaded ${file.name}`);
        }

        setUploadedFiles(prev => [...prev, {
          id: Date.now() + Math.random(), name: file.name, content: content, type: fileType, size: file.size, uploadedAt: new Date().toLocaleString('de-DE')
        }]);
      } catch (error) {
        console.error('Error reading file:', error);
        alert((data?.chat_fileReadError || 'Error reading file {filename}').replace('{filename}', file.name));
      }
    }
    event.target.value = '';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    const fileContext = uploadedFiles.map(file => `[File: ${file.name}]\n${file.content}`).join('\n---\n');
    const messageContent = `${inputMessage}\n\n${fileContext}`.trim();
    const userMessage = { role: 'user', content: messageContent };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = [{ role: "system", content: gesamtPrompt }, ...messages, userMessage];

      const response = await fetch('/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent, messages: conversationHistory, files: uploadedFiles }),
      });

      const responseData = await response.json();
      const aiContent = responseData.choices?.[0]?.message?.content || (data?.chat_noResponseGenerated || 'No response generated.');
      
      const processedResponse = processAIResponse(aiContent);
      const assistantMessage = { role: 'assistant', ...processedResponse };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: data?.chat_processingError || 'Error processing request.' }]);
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

  const deleteFile = (fileId) => setUploadedFiles(prev => prev.filter(file => file.id !== fileId));

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
        <h2>{data?.app_Headline1}</h2>
        <div id="form-all-id">
          <Form onPromptChange={setGesamtPrompt} />
        </div>
        <br/>
        {gesamtPrompt && (
          <div className="active-prompt">
            <strong>{data?.chat_activePromptLabel || 'Active Prompt'}:</strong> {gesamtPrompt}
          </div>
        )}
        <br/>
        <div className="chat-container">
          <h2>{data?.app_Headline2}</h2>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">{data?.chat_startConversation || 'Start a conversation...'}</div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`message message-${message.role}`}>
                  <strong>
                    {message.role === 'user' ? (data?.chat_youLabel || 'You:') :
                     message.role === 'system' ? (data?.chat_systemLabel || 'System:') : (data?.chat_aiLabel || 'AI:')}
                  </strong>
                  <div className="message-content">{message.content}</div>
                  
                  {message.role === 'assistant' && message.importedEvents > 0 && (
                    <div className="import-success-indicator">
                      ✅ {message.jsonImportedEvents > 0
                        ? (data?.chat_importedJsonToRoadmap || '{count} JSON events imported').replace('{count}', message.jsonImportedEvents)
                        : (data?.chat_importedToRoadmap || '{count} ICS events imported').replace('{count}', message.icsImportedEvents)}
                    </div>
                  )}
                  
                  {message.role === 'assistant' && message.downloadLinks?.length > 0 && (
                    <div className="download-links">
                      <h4>📄 {data?.chat_downloadFilesLabel || 'Downloadable Files:'}</h4>
                      {message.downloadLinks.map((link, linkIndex) => (
                        <button key={linkIndex} onClick={link.download} className="download-button">
                          <Download size={14} />
                          {link.filename}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && <div className="message message-loading">{data?.chat_aiTyping || 'AI is typing...'}</div>}
          </div>

          <div className="file-section">
            <div className="file-upload-header">
              <label className="upload-button">
                <Upload size={16} />
                {data?.chat_uploadFilesLabel || 'Upload Files'}
                <input type="file" multiple accept=".txt,.ics,.json,text/*,application/json" onChange={handleFileUpload} className="file-input" />
              </label>
              <span className="file-hint">{data?.chat_fileHint || '.txt, .json, and .ics are auto-imported'}</span>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                <h4 className="files-title">{(data?.chat_uploadedFilesTitle || 'Uploaded files ({count}):').replace('{count}', uploadedFiles.length)}</h4>
                <div className="files-list">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="file-item">
                      <File size={14} />
                      <div className="file-details">
                        <div className="file-name">{file.name}</div>
                        <div className="file-meta">{formatFileSize(file.size)} • {file.type}</div>
                      </div>
                      <button onClick={() => deleteFile(file.id)} className="delete-button" title={data?.chat_deleteFileTooltip || 'Delete file'}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="input-area">
            <div className="input-controls">
              <textarea
                placeholder={data?.chat_messagePlaceholder || 'Write your message...'}
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
                className="send-button"
              >
                {isLoading ? (data?.chat_sendingButton || 'Sending...') : (data?.chat_sendButton || 'Send')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="part2" style={{display:part2}}>
        {roadmapToday.length > 0 ? (
          <Roadmap roadmapData={roadmapToday} isToday={true} />
        ) : (
          <div className="no-tasks-today">
            {(data?.chat_noTasksToday || 'No tasks for today!').replace('{today}', new Date().toISOString().split('T')[0])}
          </div>
        )}
      </div>

      <div id="part3" style={{ display:part3 }}>   
        <h2>{data?.app_Headline3}</h2>
        <p style={{marginBottom: '15px'}}>
          <strong>ℹ️ {data?.chat_infoLabel || 'Info'}:</strong>
          {' '}{(data?.chat_roadmapInfo || 'The roadmap updates automatically when the AI generates .ics or .json calendar data. Currently showing {count} events.')
            .replace('{count}', roadmapData.length)}
        </p>
        <Roadmap roadmapData={roadmapData} onRoadmapUpdate={handleRoadmapUpdate} />
      </div>
    </div>
  );
}

export default App;