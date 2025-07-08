// functions/ai.js

/**
 * Handles CORS pre-flight requests for the /ai endpoint.
 * This is now a separate function for clarity and best practice.
 */
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * Handles POST requests to the /ai endpoint.
 * By using `onRequestPost`, we tell Cloudflare to only route POST requests here,
 * which solves the "405 Method Not Allowed" error and simplifies the code.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Use request.json() directly. It's cleaner and handles parsing.
    // This will throw an error if the body is not valid JSON, which we catch below.
    const body = await request.json();

    // Destructure the expected fields from the frontend payload.
    // We now also expect 'prompt' which is the `gesamtPrompt`.
    const {
      message,
      messages = [],
      files = [],
      prompt // This is the `gesamtPrompt` from your frontend Form
    } = body;

    // The validation for the main message remains important.
    if (!message) {
      return new Response(JSON.stringify({ error: "Missing 'message' field in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // --- LOGIC FIX & IMPROVEMENT ---
    // 1. Use the `prompt` from the frontend if it exists. Fallback to a default.
    // 2. The `lang` parameter is no longer needed as the prompt itself defines the context.
    let systemPrompt = prompt || "Du bist ein hilfsreicher AI-Assistent. Antworte höflich und informativ auf Deutsch.";

    // Append file information to the system prompt, as before.
    if (files && files.length > 0) {
      systemPrompt += `\n\nWICHTIG: Der Benutzer hat ${files.length} Datei(en) hochgeladen. Diese Dateien sind im Nachrichteninhalt unter "[Datei: ...]" zu finden. Lies und analysiere den Inhalt dieser Dateien sorgfältig und beziehe dich in deiner Antwort darauf.`;
    }

    // --- CRITICAL LOGIC FIX ---
    // The previous code used `messages.slice(0, -1)`, which was incorrect because it
    // cut off the last valid message from the history.
    // The correct approach is to take the entire history (`messages`) and add the new `message`.
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages, // Use the complete history array as sent by the frontend
      { role: "user", content: message } // Add the new user message at the end
    ];
    // --- END OF CRITICAL FIX ---


    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_APP_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-1106-preview", // or your preferred model
        messages: chatMessages,
        max_tokens: files.length > 0 ? 2000 : 1000,
        temperature: 0.7,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      // Handle context length error gracefully
      if (errorText.includes("context_length_exceeded")) {
        const errorMsg = "Entschuldigung, die Konversation oder die hochgeladenen Dateien sind zu groß. Bitte kürzen Sie Ihre Eingabe oder starten Sie ein neues Gespräch.";
        const errorResponse = { choices: [{ message: { content: errorMsg } }] };
        return new Response(JSON.stringify(errorResponse), {
            status: 200, // Send 200 so the frontend can display the message
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      // For other OpenAI errors, throw to the main catch block
      throw new Error(`OpenAI API Error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();

    // The Airtable logic can remain here if you are using it.
    // try {
    //   await saveToAirtable(env, message, data.choices?.[0]?.message?.content, files);
    // } catch (airtableError) {
    //   console.error("Airtable save failed:", airtableError);
    // }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    console.error("Error in AI function:", error);
    const fallbackMsg = {
      choices: [{
        message: { content: "Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut." }
      }]
    };

    // If the error is from invalid JSON, send a 400 status. Otherwise, 500.
    const status = error instanceof SyntaxError ? 400 : 500;
    
    return new Response(JSON.stringify(fallbackMsg), {
      status: status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}