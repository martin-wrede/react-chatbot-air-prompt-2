// functions/ai.js

export async function onRequest(context) {
  const { request, env } = context;

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

    const {
      message,
      messages = [],
      files = [],
      fileAttachments = [],
      lang = "de"
    } = parsedBody;

    if (!message) {
      return new Response(
        JSON.stringify({ error: lang === "en" ? "Missing 'message' field" : "Das 'message'-Feld fehlt" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );
    }

    // 🧠 Language-based system prompt
    let systemPrompt = lang === "en"
      ? "You are a helpful AI assistant. Respond politely and informatively in English."
      : "Du bist ein hilfsreicher AI-Assistent. Antworte höflich und informativ auf Deutsch.";

    if (files.length > 0) {
      systemPrompt += lang === "en"
        ? `

IMPORTANT: The user uploaded ${files.length} text file(s). These files appear in the message under "[Uploaded Files Context:]".
- Carefully read and analyze the file contents
- Refer directly to file content in your answers
- If the user asks about the files, quote relevant parts
- Confirm clearly that you've read the files`
        : `

WICHTIG: Der Benutzer hat ${files.length} Textdatei(en) hochgeladen. Diese Dateien sind im Nachrichteninhalt unter "[Uploaded Files Context:]" zu finden. 
- Lies und analysiere den Inhalt dieser Dateien sorgfältig
- Beziehe dich direkt auf den Dateiinhalt in deinen Antworten
- Wenn der Benutzer Fragen zu den Dateien stellt, zitiere relevante Teile daraus
- Bestätige explizit, dass du die Dateien gelesen hast`;
    }

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message }
    ];

    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_APP_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-1106-preview",
        messages: chatMessages,
        max_tokens: files.length > 0 ? 2000 : 1000,
        temperature: 0.7,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();

      if (errorText.includes("context_length_exceeded")) {
        const errorMsg = lang === "en"
          ? "Sorry, the uploaded files are too large. Please use smaller files or split them."
          : "Entschuldigung, die hochgeladenen Dateien sind zu groß. Bitte verwende kleinere Dateien oder teile sie auf.";

        return new Response(JSON.stringify({
          error: errorMsg,
          choices: [{
            message: { content: errorMsg }
          }]
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      throw new Error(`OpenAI API Error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    const botAnswer = data.choices?.[0]?.message?.content || (lang === "en"
      ? "Sorry, I couldn't generate a response."
      : "Entschuldigung, ich konnte keine Antwort generieren.");

    try {
      await saveToAirtable(env, message, botAnswer, files, fileAttachments);
    } catch (airtableError) {
      console.error("Airtable save failed:", airtableError);
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
    const fallbackMsg = {
      error: error.message,
      choices: [{
        message: {
          content: lang === "en"
            ? "Sorry, there was a technical error. Please try again."
            : "Entschuldigung, es gab einen technischen Fehler. Bitte versuche es erneut."
        }
      }]
    };

    return new Response(JSON.stringify(fallbackMsg), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// saveToAirtable function remains unchanged from your original script
