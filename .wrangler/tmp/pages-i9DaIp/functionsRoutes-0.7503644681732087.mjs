import { onRequestOptions as __ai_js_onRequestOptions } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai.js"
import { onRequestPost as __ai_js_onRequestPost } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai.js"
import { onRequestOptions as __ai_copy_js_onRequestOptions } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai copy.js"
import { onRequestPost as __ai_copy_js_onRequestPost } from "D:\\Documents\\CODING\\JAVASCRIPT\\react-chatbot-air-prompt-2\\functions\\ai copy.js"

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
      method: "OPTIONS",
      middlewares: [],
      modules: [__ai_copy_js_onRequestOptions],
    },
  {
      routePath: "/ai copy",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__ai_copy_js_onRequestPost],
    },
  ]