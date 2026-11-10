import "dotenv/config";
import OpenAI from "openai";

export const llm = new OpenAI({
    baseURL: "https://ollama.com/v1",
    apiKey: process.env.OLLAMA_API_KEY
});

export const MODEL = process.env.OLLAMA_MODEL!;