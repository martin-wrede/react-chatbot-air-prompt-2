import React, { useState } from 'react';
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
  const [display, setDisplay] = useState("none");

  // Sample data based on your example
const myRoadmapData = [
  {
    date: '2025-06-17',
    task: 'Write value proposition: What transformation does the reader get?',
    dailyStartTime: '10:00',
    dailyHours:6,
    motivation: 'Exchange of drinks'
  },
  {
    date: '2025-06-18',
    task: 'Research 3 competitor landing pages and note what works.',
    dailyStartTime: '10:00',
    dailyHours:6,
    motivation: 'Call some friends'
  },
  {
    date: '2025-06-19',
    task: 'Brainstorm page sections: Hero, About, Book Preview, Testimonials, Buy CTA.',
    dailyStartTime: '10:00',
    dailyHours:6,
    motivation: 'Watch the movie about Steve Jobs'
  },
  {
    date: '2025-06-20',
    task: 'Write draft copy for each section (keep it concise + benefit-focused).',
    dailyStartTime: '10:00',
    dailyHours:6,
    motivation: 'Get an ice cream'
  }
];

  // Hilfsfunktion zum Formatieren von ICS-Datumsangaben
  const formatIcsDate = (icsDate) => {
    if (!icsDate) return 'Unbekannt';
    
    // ICS-Format: 20250624T090000Z
    const year = icsDate.substring(0, 4);
    const month = icsDate.substring(4, 6);
    const day = icsDate.substring(6, 8);
    const hour = icsDate.substring(9, 11);
    const minute = icsDate.substring(11, 13);
    
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };

  // Hilfsfunktion zum Parsen von ICS-Inhalten
  const parseIcsContent = (icsText) => {
    // Einfache Extraktion der wichtigsten Informationen
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
    
    // Formatierte Ausgabe für den Chat-Kontext
    if (events.length > 0) {
      return `ICS-Kalender mit ${events.length} Terminen:\n\n` + 
             events.map(event => 
               `- ${event.summary} (${formatIcsDate(event.start)})`
             ).join('\n') + 
             `\n\nOriginal ICS-Inhalt:\n${icsText}`;
    }
    
    return icsText;
  };

  // Funktion zum Extrahieren von ICS-Inhalten aus Text
  const extractIcsContent = (text) => {
    const icsRegex = /```ics\n([\s\S]*?)\n```/g;
    const matches = [];
    let match;
    
    while ((match = icsRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  };

  // Funktion zum Erstellen eines Download-Links für ICS-Dateien
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

  // Funktion zum Verarbeiten der AI-Antwort und Extrahieren von ICS-Inhalten
  const processAIResponse = (content) => {
    const icsContents = extractIcsContent(content);
    const downloadLinks = [];
    
    if (icsContents.length > 0) {
      icsContents.forEach((icsContent, index) => {
        const filename = `projekt-kalender-${index + 1}.ics`;
        const downloadLink = createIcsDownloadLink(icsContent, filename);
        downloadLinks.push(downloadLink);
      });
    }
    
    return {
      originalContent: content,
      icsContents,
      downloadLinks
    };
  };

  // KORRIGIERTE handleFileUpload Funktion mit .ics Support
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      try {
        let content;
        let fileType;
        
        // Textdateien (.txt)
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          content = await file.text();
          fileType = 'text';
        }
        // ICS Kalender-Dateien
        else if (file.name.endsWith('.ics') || file.type === 'text/calendar') {
          content = await file.text();
          fileType = 'calendar';
          
          // ICS-Inhalt parsen für bessere Darstellung
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
      
      // Verarbeite die AI-Antwort für ICS-Inhalte
      const processedResponse = processAIResponse(aiContent);

      const assistantMessage = {
        role: 'assistant',
        content: processedResponse.originalContent,
        icsContents: processedResponse.icsContents,
        downloadLinks: processedResponse.downloadLinks
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
        <h2>1 Chatbot</h2>
      <div id="form-all-id">
        <Form onPromptChange={setGesamtPrompt} />
      </div>
      <br/>
      {gesamtPrompt}
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
                className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
              >
                <strong>{message.role === 'user' ? 'Du:' : 'AI:'}</strong>
                <div className="message-content">
                  {message.content}
                </div>
                
                {/* ICS Download Links anzeigen */}
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

        {/* KORRIGIERTE File Upload Section */}
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
              .txt und .ics Dateien erlaubt
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
              disabled={isLoading || !inputMessage.trim()}
              className={`send-button ${(isLoading || !inputMessage.trim()) ? 'disabled' : ''}`}
            >
              {isLoading ? 'Senden...' : 'Senden'}
            </button>
            
          </div>
          
        </div>
        
      </div>
          
       <h2>2  Plan</h2>
        <Roadmap 
          roadmapData={myRoadmapData}
          />
    </div>
  );
}

export default App;