// functions/ai.js

export async function onRequest(context) {
  const { request, env } = context;
  
  console.log("=== AI Function Called ===");
  console.log("Method:", request.method);
  
  // ✅ CORS Preflight Handling
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // ✅ Only accept POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: `Method ${request.method} not allowed` }), { 
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }

  try {
    const body = await request.text();
    console.log("Raw request body length:", body.length);
    
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }

    console.log("Request contains files:", parsedBody.files?.length || 0);
    console.log("Request contains file attachments:", parsedBody.fileAttachments?.length || 0);
    console.log("Message length:", parsedBody.message?.length || 0);
    
    const { message, messages = [], files = [] } = parsedBody;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing 'message' field" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }

    // ✅ Enhanced system prompt for file handling
    let systemPrompt = "Du bist ein hilfsreicher AI-Assistent. Antworte höflich und informativ auf Deutsch.";
    
    if (files.length > 0) {
      systemPrompt += ` 
      
WICHTIG: Der Benutzer hat ${files.length} Textdatei(en) hochgeladen. Diese Dateien sind im Nachrichteninhalt unter "[Uploaded Files Context:]" zu finden. 
- Lies und analysiere den Inhalt dieser Dateien sorgfältig
- Beziehe dich direkt auf den Dateiinhalt in deinen Antworten
- Wenn der Benutzer Fragen zu den Dateien stellt, zitiere relevante Teile daraus
- Bestätige explizit, dass du die Dateien gelesen hast`;
    }

    // ✅ Prepare messages for OpenAI Chat API
    const chatMessages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation history (excluding the current message to avoid duplication)
    if (messages.length > 0) {
      // Only add messages that aren't the current one
      const historyMessages = messages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      chatMessages.push(...historyMessages);
    }

    // Add the current message (which includes file content)
    chatMessages.push({
      role: "user",
      content: message
    });

    console.log("=== DEBUG: Final message to OpenAI ===");
    console.log("System prompt:", systemPrompt);
    console.log("Total messages:", chatMessages.length);
    console.log("Current message preview:", message.substring(0, 500) + "...");
    console.log("=====================================");

    // ✅ Send request to OpenAI Chat API with increased max_tokens for file responses
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_APP_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    body: JSON.stringify({
  model: "gpt-4-1106-preview", // ✅ Valid model name
  messages: chatMessages,      // ✅ Should be an array of { role, content } objects
  max_tokens: files.length > 0 ? 2000 : 1000, // ✅ Smart token allocation
  temperature: 0.7,            // ✅ Good balance of creativity and coherence
}),

    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("OpenAI API Error:", apiResponse.status, errorText);
      
      // Check for context length error
      if (errorText.includes("context_length_exceeded")) {
        return new Response(JSON.stringify({ 
          error: "Die hochgeladenen Dateien sind zu groß. Bitte verwende kleinere Dateien oder teile sie auf.",
          choices: [{
            message: {
              content: "Entschuldigung, die hochgeladenen Dateien sind zu groß für die Verarbeitung. Bitte verwende kleinere Dateien oder teile sie in mehrere kleinere Dateien auf."
            }
          }]
        }), {
          status: 200, // Return 200 so frontend handles it normally
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      
      throw new Error(`OpenAI API Error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    console.log("OpenAI Response received successfully");
    
    // Get the AI response content
    const botAnswer = data.choices?.[0]?.message?.content || "Entschuldigung, ich konnte keine Antwort generieren.";
    
    // Log if the response mentions files
    console.log("Response mentions files:", botAnswer.toLowerCase().includes("datei"));

    // ✅ Save to Airtable DIRECTLY (no HTTP calls)
    try {
      await saveToAirtable(env, message, botAnswer, files, parsedBody.fileAttachments);
      console.log("Successfully saved to Airtable with bot answer");
    } catch (airtableError) {
      console.error("Airtable save failed:", airtableError);
      // Continue with AI response even if Airtable fails
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in AI function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      choices: [{
        message: {
          content: "Entschuldigung, es gab einen technischen Fehler. Bitte versuche es erneut."
        }
      }]
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// ✅ DIRECT Airtable Integration with File Attachments support
async function saveToAirtable(env, originalMessage, botAnswer, files, fileAttachments = []) {
  const AIRTABLE_API_KEY = env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = env.AIRTABLE_TABLE_NAME || "Prompts";

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Missing Airtable credentials");
  }

  // Extract just the user's original prompt (without file content)
  let userPrompt = originalMessage;
  
  // If message contains file context, extract only the original prompt
  if (originalMessage.includes("[Uploaded Files Context:]")) {
    userPrompt = originalMessage.split("\n\n[Uploaded Files Context:]")[0];
  }

  // Clean up bot answer - remove any potential formatting issues
  const cleanBotAnswer = botAnswer.replace(/\n\s*\n/g, '\n').trim();

  // Prepare file attachments for Airtable
  let airtableAttachments = [];
  
  if (fileAttachments && fileAttachments.length > 0) {
    console.log("Processing file attachments:", fileAttachments.length);
    
    for (const file of fileAttachments) {
      try {
        // Create a data URL for the file content
        const base64Content = btoa(file.content);
        const dataUrl = `data:${file.type || 'text/plain'};base64,${base64Content}`;
        
        // Airtable attachment format
        const attachment = {
          filename: file.name,
          url: dataUrl
        };
        
        airtableAttachments.push(attachment);
        console.log(`Prepared attachment: ${file.name} (${file.content.length} chars)`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
  }

  const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
  
  const fields = {
    "Prompt": userPrompt,
    "Bot_Answer": cleanBotAnswer,
    "Timestamp": new Date().toISOString(),
    "File_Count": files.length,
  };

  // Add file attachments if any
  if (airtableAttachments.length > 0) {
    fields["File_Attachments"] = airtableAttachments;
  }

  const recordData = {
    records: [{ fields }]
  };

  console.log("Saving to Airtable:", {
    url: airtableUrl,
    promptLength: userPrompt.length,
    botAnswerLength: cleanBotAnswer.length,
    hasFiles: files.length > 0,
    hasAttachments: airtableAttachments.length > 0
  });

  const response = await fetch(airtableUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recordData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Airtable API Error:", response.status, errorText);
    throw new Error(`Airtable API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("Airtable save successful:", result);
  return result;
}