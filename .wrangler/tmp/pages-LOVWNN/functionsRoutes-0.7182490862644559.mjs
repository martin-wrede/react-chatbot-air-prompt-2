import { onRequest as __ai_js_onRequest } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai.js"
import { onRequest as __ai_airtable_js_onRequest } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai-airtable.js"
import { onRequest as __airtable_js_onRequest } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\airtable.js"
import { onRequest as __airtable_copy_js_onRequest } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\airtable copy.js"

export const routes = [
    {
      routePath: "/ai",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__ai_js_onRequest],
    },
  {
      routePath: "/ai-airtable",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__ai_airtable_js_onRequest],
    },
  {
      routePath: "/airtable",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__airtable_js_onRequest],
    },
  {
      routePath: "/airtable copy",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__airtable_copy_js_onRequest],
    },
  ]