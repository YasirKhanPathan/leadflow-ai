import "server-only";

import Groq from "groq-sdk";
import {
  analysisOutputSchema,
  draftOutputSchema,
  suggestionOutputSchema,
  type AnalysisOutput,
  type DraftOutput,
  type SuggestionOutput,
} from "@/lib/validations/ai";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

let client: Groq | null = null;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AiError("AI is not configured — contact the administrator");
  }
  if (!client) {
    client = new Groq({ apiKey, timeout: 30_000 });
  }
  return client;
}

function toFriendlyError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof Groq.APIConnectionTimeoutError) {
    return new AiError("The AI took too long — try again");
  }
  if (error instanceof Groq.APIError) {
    if (error.status === 429) {
      return new AiError("AI service is busy — try again in a minute");
    }
    if (
      error.status === 404 ||
      (error.status === 400 && /model/i.test(error.message))
    ) {
      return new AiError(
        "The configured AI model was not found — set GROQ_MODEL to a valid model from the Groq console",
      );
    }
  }
  return new AiError("AI request failed — try again");
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

function normalizeNulls(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(value)) {
    result[key] =
      typeof field === "string" && (field === "null" || field === "")
        ? null
        : field;
  }
  return result;
}

async function completeJson(options: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}): Promise<unknown> {
  const groq = getClient();
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  for (let attempt = 0; attempt < 2; attempt++) {
    let content: string;
    try {
      const response = await groq.chat.completions.create({
        model,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.user },
        ],
      });
      content = response.choices[0]?.message?.content ?? "";
    } catch (error) {
      throw toFriendlyError(error);
    }

    try {
      return JSON.parse(stripMarkdownFences(content));
    } catch {
      // parse failed — retry once, then fall through to the friendly error
    }
  }
  throw new AiError("AI request failed — try again");
}

const ANALYSIS_SYSTEM_PROMPT = `You analyze customer inquiries for a small web development agency. STRICT RULES — follow exactly:
Use ONLY facts explicitly written in the inquiry.
If a detail is not mentioned, return null for that field. NEVER guess, infer, or invent names, numbers, prices, timelines, or commitments.
Judge priority ONLY from signals in the inquiry (budget size, urgency, scope) and give a one-sentence reason citing the inquiry.
Output ONLY the JSON object — no markdown, no extra text. JSON shape: { summary: string (max ~80 words), service: string|null, budget: string|null (exactly as stated), timeline: string|null (exactly as stated), priority: 'HIGH'|'MEDIUM'|'LOW'|null, priorityReason: string|null }`;

const DRAFT_SYSTEM_PROMPT = `You draft a reply email for the owner of a small web development agency, responding to one customer inquiry. RULES:
Reply ONLY to what the inquiry says. Reference the specifics (service, budget, timeline) when they are present.
NEVER invent prices, dates, availability, commitments, team members, portfolio items, or guarantees.
Where the owner must supply information (exact quote, start date, questions), write a placeholder in [square brackets].
Warm, professional, under 180 words. Greet by name if known. No signature. Output ONLY: { reply: string }`;

async function parseWithRetry<T>(
  options: {
    system: string;
    user: string;
    temperature: number;
    maxTokens: number;
  },
  schema: { parse(value: unknown): T },
): Promise<T> {
  let lastError: AiError | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await completeJson(options);
    try {
      return schema.parse(normalizeNulls(raw));
    } catch {
      lastError = new AiError("AI request failed — try again");
    }
  }
  throw lastError ?? new AiError("AI request failed — try again");
}

export async function analyzeInquiry(lead: {
  inquiry: string;
}): Promise<AnalysisOutput> {
  return parseWithRetry(
    {
      system: ANALYSIS_SYSTEM_PROMPT,
      user: lead.inquiry,
      temperature: 0.2,
      maxTokens: 700,
    },
    analysisOutputSchema,
  );
}

export async function draftReply(lead: {
  name: string;
  company: string | null;
  inquiry: string;
}): Promise<DraftOutput> {
  const lines = [`Lead name: ${lead.name}`];
  if (lead.company) lines.push(`Company: ${lead.company}`);
  lines.push("", "Inquiry:", lead.inquiry);
  return parseWithRetry(
    {
      system: DRAFT_SYSTEM_PROMPT,
      user: lines.join("\n"),
      temperature: 0.4,
      maxTokens: 1024,
    },
    draftOutputSchema,
  );
}

const SUGGESTION_SYSTEM_PROMPT = `You draft a short follow-up message for the owner of a small web development agency to share with a lead. Use ONLY facts in the provided lead data and inquiry. NEVER invent prices, dates, availability, or commitments. Placeholders in [square brackets] where the owner must fill in. Warm, professional, under 120 words. Output ONLY { message: string }.`;

export async function suggestFollowUpMessage(lead: {
  name: string;
  company: string | null;
  serviceNeeded: string | null;
  inquiry: string | null;
  analysis: {
    summary: string | null;
    service: string | null;
    budget: string | null;
    timeline: string | null;
    priority: string | null;
  } | null;
}): Promise<SuggestionOutput> {
  const lines = [`Lead name: ${lead.name}`];
  if (lead.company) lines.push(`Company: ${lead.company}`);
  if (lead.serviceNeeded) lines.push(`Service they asked about: ${lead.serviceNeeded}`);
  lines.push("", "Inquiry:", lead.inquiry ?? "(no inquiry provided)");
  if (lead.analysis) {
    lines.push("", "Stored analysis:");
    lines.push(`Summary: ${lead.analysis.summary ?? "n/a"}`);
    lines.push(`Service: ${lead.analysis.service ?? "not mentioned"}`);
    lines.push(`Budget: ${lead.analysis.budget ?? "not mentioned"}`);
    lines.push(`Timeline: ${lead.analysis.timeline ?? "not mentioned"}`);
    lines.push(`Priority: ${lead.analysis.priority ?? "not set"}`);
  }
  return parseWithRetry(
    {
      system: SUGGESTION_SYSTEM_PROMPT,
      user: lines.join("\n"),
      temperature: 0.3,
      maxTokens: 600,
    },
    suggestionOutputSchema,
  );
}
