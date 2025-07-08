import { onRequestOptions as __ai_js_onRequestOptions } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai.js"
import { onRequestPost as __ai_js_onRequestPost } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai.js"
import { onRequest as __ai_copy_js_onRequest } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai copy.js"
import { onRequest as __ai_de_js_onRequest } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai-de.js"

export const routes = [
    {
      routePath: "/ai",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__ai_js_onRequestOptions],
    },
  {
      routePath: "/ai",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__ai_js_onRequestPost],
    },
  {
      routePath: "/ai copy",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__ai_copy_js_onRequest],
    },
  {
      routePath: "/ai-de",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__ai_de_js_onRequest],
    },
  ]