import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

function getClient() {
  if (!_client) {
    _client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "");
  }
  return _client;
}

export async function generateText(prompt: string): Promise<string> {
  const model = getClient().getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateScenarioImage(prompt: string): Promise<{ data: Buffer; mimeType: string } | null> {
  const model = getClient().getGenerativeModel({
    model: "gemini-2.5-flash-image",
    // @ts-expect-error responseModalities is supported but not in older type defs
    generationConfig: { responseModalities: ["IMAGE"] },
  });

  const result = await model.generateContent(prompt);
  const parts = result.response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inlineData = (part as { inlineData?: { data: string; mimeType: string } }).inlineData;
    if (inlineData?.mimeType?.startsWith("image/")) {
      return {
        data: Buffer.from(inlineData.data, "base64"),
        mimeType: inlineData.mimeType,
      };
    }
  }
  return null;
}
