import type { AICallType, AIResponse } from "../types";

const FLASH_CALL_TYPES: AICallType[] = [
  "scenario_recommend",
  "chapter_intro",
  "event_narrative",
  "freeform_eval",
  "meta_chapter",
  "chapter_end",
  "quote_extract",
  "moderation",
];

function isFlashCallType(type: AICallType): boolean {
  return FLASH_CALL_TYPES.includes(type);
}

async function callGeminiFlash(prompt: string): Promise<AIResponse> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return { text, model: "gemini-2.0-flash" };
}

async function callGeminiPro(prompt: string): Promise<AIResponse> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp" });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return { text, model: "gemini-2.0-pro" };
}

async function callClaude(prompt: string): Promise<AIResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return { text, model: "claude-sonnet-4-6" };
}

function getFallbackNarrative(callType: AICallType): string {
  const fallbacks: Partial<Record<AICallType, string>> = {
    chapter_intro: "또 한 해가 흘렀다. 세상은 변하고, 당신도 변한다.",
    event_narrative:
      '{"narrative": "그 순간이 찾아왔다.", "choices": [{"id":"A","text":"나아간다"},{"id":"B","text":"물러선다"},{"id":"C","text":"(자유롭게 답하기)"}]}',
    ending_narrative:
      '{"endingNarrative": "당신의 인생이 막을 내렸다.", "iconicQuote": "지나간 것은 영원히 지나가지 않는다.", "finalAge": 20}',
  };
  return fallbacks[callType] ?? "";
}

export function parseJsonFromText(text: string): Record<string, unknown> {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/({[\s\S]*})/);
    const raw = match?.[1] ?? match?.[0] ?? text;
    return JSON.parse(raw.trim());
  } catch {
    return {};
  }
}

export async function callLLM(
  callType: AICallType,
  prompt: string,
  options?: { forceModel?: "flash" | "pro" | "claude" }
): Promise<AIResponse> {
  const useFlash = options?.forceModel === "flash" || (!options?.forceModel && isFlashCallType(callType));
  const useClause = options?.forceModel === "claude";
  const usePro = options?.forceModel === "pro" || (!options?.forceModel && !useFlash);

  try {
    if (useClause) return await callClaude(prompt);
    if (useFlash) return await callGeminiFlash(prompt);
    return await callGeminiPro(prompt);
  } catch (primaryError) {
    console.warn("Primary LLM failed:", primaryError);

    try {
      // Fallback 1: Try Pro if Flash failed (or Flash if Pro failed)
      if (useFlash) return await callGeminiPro(prompt);
      return await callGeminiFlash(prompt);
    } catch {
      try {
        return await callClaude(prompt);
      } catch {
        return { text: getFallbackNarrative(callType), cached: false };
      }
    }
  }
}
