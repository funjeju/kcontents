import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

function getClient() {
  if (!_client) {
    _client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "");
  }
  return _client;
}

export async function generateText(prompt: string): Promise<string> {
  const model = getClient().getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
