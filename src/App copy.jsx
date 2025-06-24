import React, { useState } from 'react';
import Form from './components/Form';
import { Upload, X, File, Download } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const [gesamtPrompt, setGesamtPrompt] = useState("")
  const [display, setDisplay] = useState("none");

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

  const sendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    let messageContent = inputMessage;

    // Combine file content if available
    if (uploadedFiles.length > 0) {
      const fileContext = uploadedFiles.map(file =>
        `[Datei: ${file.name}]\n${file.content}`
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

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        try {
          const content = await file.text();
          const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            content: content,
            size: file.size,
            uploadedAt: new Date().toLocaleString('de-DE')
          };
          
          setUploadedFiles(prev => [...prev, fileData]);
        } catch (error) {
          console.error('Error reading file:', error);
          alert(`Fehler beim Lesen der Datei ${file.name}`);
        }
      } else {
        alert(`${file.name} ist keine Textdatei. Nur .txt Dateien sind erlaubt.`);
      }
    }
    
    event.target.value = '';
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
      {/*g
      <div>
        <button onClick={() => setDisplay("none")}>zurück</button>
        <button onClick={() => setDisplay("block")}>weiter</button>    
      </div>
      */}

      <div id="form-all-id"  
     // style={{display:"block"}}
      >
        <Form onPromptChange={setGesamtPrompt} />
      </div>
      <br/>
      {gesamtPrompt}
      <br/>
     
      {/* Chat Container All */}
      <div 
      //id="chatbot-all-id" 
       className="chat-container"
     //  style={{display:display}}
       >
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

        {/* File Upload Section */}
        <div className="file-section">
          <div className="file-upload-header">
            <label className="upload-button">
              <Upload size={16} />
              Textdateien hochladen
              <input
                type="file"
                multiple
                accept=".txt,text/plain"
                onChange={handleFileUpload}
                className="file-input"
              />
            </label>
            <span className="file-hint">
              Nur .txt Dateien erlaubt
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
                          {file.name}
                        </div>
                        <div className="file-meta">
                          {formatFileSize(file.size)} • {file.uploadedAt}
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
    </div>
  );
}

export default App;