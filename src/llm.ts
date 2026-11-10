import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

// It automatically picks up process.env.GEMINI_API_KEY
export const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});

export const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";