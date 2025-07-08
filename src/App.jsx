import React, { useState, useEffect, useContext } from 'react';
import Form from './components/Form';
import RoadmapEdit from './components/RoadmapEdit';
import ChatInterface from './components/ChatInterface'; // Import new component
import { Context } from './Context';
import * as fileUtils from './utils/fileUtils'; // Import all utils
import './App.css';

// Sample Data can be moved outside the component or to another file
const initialRoadmapData = [
  { date: '2025-07-08', task: 'Schreibe Value Proposition: was bekommt der Users?', dailyStartTime: '10:00', dailyHours: 6, motivation: 'Drinks mit Kollegen' },
  { date: '2025-06-18', task: 'Recherchiere 3 Landing Pages und schreib auf, was funktioniert.', dailyStartTime: '10:00', dailyHours: 6, motivation: 'Freunde anrufen' }
];

function App() {
  const { data } = useContext(Context);

  // State Management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [gesamtPrompt, setGesamtPrompt] = useState("");
  const [roadmapData, setRoadmapData] = useState(initialRoadmapData);
  const [roadmapToday, setRoadmapToday] = useState([]);
  
  // URL Params
  const params = new URLSearchParams(location.search);
  const part1 = params.get('part1');
  const part2 = params.get('part2');
  const part3 = params.get('part3');
  const today = new Date().toISOString().split('T')[0];

  // Effects
  useEffect(() => {
    const todayTasks = roadmapData.filter(item => item.date === today);
    setRoadmapToday(todayTasks);
  }, [roadmapData, today]);

  // Handlers
  const handleRoadmapUpdate = (updatedData) => {
    updatedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    setRoadmapData(updatedData);
  };

  const processAIResponse = (content) => {
    const defaultMotivation = data?.chat_defaultMotivation || 'Erreiche dein Ziel!';
    const icsContents = fileUtils.extractIcsContent(content);
    const jsonContents = fileUtils.extractJsonContent(content);
    
    let allNewEvents = [];
    
    // Prefer JSON over ICS
    if (jsonContents.length > 0) {
      jsonContents.forEach(json => {
        allNewEvents.push(...fileUtils.parseJsonToRoadmapData(json, defaultMotivation));
      });
    } else if (icsContents.length > 0) {
      icsContents.forEach(ics => {
        allNewEvents.push(...fileUtils.parseIcsToRoadmapData(ics, defaultMotivation));
      });
    }

    if (allNewEvents.length > 0) {
      setRoadmapData(allNewEvents);
      // Add a system message about the import
      setTimeout(() => {
        const successMessage = (data?.chat_autoImportSuccess || 'Automatisch {count} Termine importiert!').replace('{count}', allNewEvents.length);
        setMessages(prev => [...prev, { role: 'system', content: successMessage }]);
      }, 500);
    }

    // Create download links for all found content
    const icsDownloadLinks = icsContents.map((ics, i) => fileUtils.createIcsDownloadLink(ics, `kalender-${i+1}.ics`));
    const jsonDownloadLinks = jsonContents.map((json, i) => fileUtils.createJsonDownloadLink(json, `roadmap-${i+1}.json`));
    
    return {
      originalContent: content,
      downloadLinks: [...jsonDownloadLinks, ...icsDownloadLinks],
      importedEvents: allNewEvents.length,
    };
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    for (const file of files) {
      try {
        const content = await file.text();
        let fileType = 'text';
        let parsedEvents = [];
        const defaultMotivation = data?.chat_defaultMotivation || 'Erreiche dein Ziel!';

        if (file.name.endsWith('.ics')) {
          fileType = 'calendar';
          parsedEvents = fileUtils.parseIcsToRoadmapData(content, defaultMotivation);
        } else if (file.name.endsWith('.json')) {
          fileType = 'json';
          parsedEvents = fileUtils.parseJsonToRoadmapData(content, defaultMotivation);
        }

        if (parsedEvents.length > 0) {
          setRoadmapData(parsedEvents);
        }

        setUploadedFiles(prev => [...prev, {
          id: Date.now() + Math.random(), name: file.name, content, type: fileType, size: file.size
        }]);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
    event.target.value = ''; // Reset file input
  };
  // start sendmessage
 
  const sendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    const fileContext = uploadedFiles.map(f => `[Datei: ${f.name}]\n${f.content}`).join('\n\n---\n\n');
    const messageContent = `${inputMessage}\n\n${fileContext}`.trim();
    const userMessage = { role: 'user', content: messageContent };
    
    // The conversation history to be sent to the AI.
    // It should be the messages state BEFORE adding the new user message.
    // THIS LINE WAS MISSING.
    const conversatsionHistory = [...messages]; 

    // Add user message to the local state for immediate display
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/ai', { // This URL is correct.
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          messages: conversationHistory, // Now this variable exists.
          files: uploadedFiles,
          prompt: gesamtPrompt,
        }),
      });
      
       if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      const aiContent = responseData.choices?.[0]?.message?.content || 'Fehler: Keine Antwort erhalten.';
      
      const processed = processAIResponse(aiContent);
      const assistantMessage = { role: 'assistant', ...processed };

      // We already added the user's message, now we add the assistant's
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      // If you open the browser console (F12), you would see the ReferenceError here.
      setMessages(prev => [...prev, { role: 'assistant', content: 'Fehler bei der Verarbeitung Ihrer Anfrage.' }]);
    } finally {
      setIsLoading(false);
    }
  };
  // end sendmessage


  const deleteFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="app-container">
      <div id="part1" style={{ display: part1 }}>
        <h2>{data?.app_Headline1}</h2>
        <div id="form-all-id">
          <Form onPromptChange={setGesamtPrompt} />
        </div>
        {gesamtPrompt && (
          <div className="active-prompt-display">
            <strong>{data?.chat_activePromptLabel || 'Aktiver Prompt'}:</strong> {gesamtPrompt}
          </div>
        )}
        
        <ChatInterface
            data={data}
            messages={messages}
            isLoading={isLoading}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            uploadedFiles={uploadedFiles}
            handleFileUpload={handleFileUpload}
            deleteFile={deleteFile}
            sendMessage={sendMessage}
        />
      </div>

      <div id="part2" style={{ display: part2 }}>
        {roadmapToday.length > 0 ? (
          <RoadmapEdit titleDisplay2='block' titleDisplay3='none' roadmapData={roadmapToday} isToday={true} />
        ) : (
          <div className="info-box">
            {(data?.chat_noTasksToday || 'Keine Aufgaben für heute! ({today})').replace('{today}', today)}
          </div>
        )}
      </div>

      <div id="part3" style={{ display: part3 }}>
        <h2>{data?.app_Headline3}</h2>
        <p className="info-box">
          <strong>ℹ️ {data?.chat_infoLabel || 'Info'}:</strong>
          {' '}
          {(data?.chat_roadmapInfo || 'Der Projektplan wird automatisch aktualisiert, wenn die KI Kalenderdaten erstellt. Aktuell werden {count} Termine angezeigt.').replace('{count}', roadmapData.length)}
        </p>
        <RoadmapEdit
          roadmapData={roadmapData}
          onRoadmapUpdate={handleRoadmapUpdate}
          titleDisplay2='none'
          titleDisplay3='block'
        />
      </div>
    </div>
  );
}

export default App;