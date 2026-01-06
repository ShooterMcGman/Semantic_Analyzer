import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY, // set on server only
    defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:5173",
        "X-Title": "Semantic Transcript Analyzer",
    },
});

export default client;
