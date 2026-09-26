import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Ensure this route is never statically cached
export const dynamic = "force-dynamic";

// Active Gemini Flash models supported on Google AI Studio
const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest"
];

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "SkillPulse AI is not configured on this prototype."
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { userQuestion, dashboardData, context, conversationHistory, tone = "formal" } = body;

    const question = (userQuestion || "").trim();
    if (!question) {
      return NextResponse.json(
        { error: "Question cannot be empty. Please provide a valid inquiry." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const selectedTone = tone === "friendly" ? "friendly" : "formal";

    const toneInstruction = selectedTone === "friendly"
      ? `TONE & STYLE SPECIFICATION: FRIENDLY (Approachable & Conversational)
- Tone: Approachable, warm, conversational, and naturally engaging, while remaining truthful, accurate, respectful, and helpful.
- Phrasing: Use slightly relaxed, intuitive, and easy-to-understand language. Avoid dense, intimidating bureaucratic jargon where practical.
- Emojis: You may use a small number of tasteful, relevant emojis (e.g. 💡, 📊, 🎯, 🚀) to highlight insights and make key takeaways easy to grasp.
- Light-hearted yet professional: Maintain high standards of usefulness and respect. Do NOT use childish slang or trivial jokes.
- Structure: Keep findings clear, structured, and actionable.`
      : `TONE & STYLE SPECIFICATION: FORMAL (Professional & Structured)
- Tone: Highly professional, formal, objective, precise, and analytical, suited for government officials, policymakers, and institutional stakeholders.
- Phrasing: Rigorous, concise, empirical, and structured policy language.
- Emojis: Strictly avoid unnecessary emojis, jokes, slang, or overly casual phrasing.
- Focus: Unbiased evidence, structural dynamics, and data-backed recommendations.`;

    // Official System Instruction for SkillPulse AI
    const systemInstruction = `You are the AI intelligence assistant for SkillPulse AI.

SkillPulse AI analyzes employment outcomes, workforce supply and demand, skill gaps, placement, retention, wage progression, training outcomes, career progression, and livelihood outcomes.

${toneInstruction}

Answer the user's exact question using the SkillPulse AI data and context provided with the request.

Your response must dynamically change according to the user's question, selected district, selected state, selected metric, filters, and supplied data.

Never return a generic pre-written response when relevant data is available.

Never invent statistics, employment rates, wages, skill gaps, districts, trends, or government data.

Use only the information supplied by the application.

If the available data is insufficient, explicitly say that the available data is insufficient.

Clearly distinguish between:
- observed data
- interpretation
- possible analytical recommendations

If dashboard data has grounding.comparison_required set to true, you MUST analyze every district and every trainee listed in grounding.comparison_targets. Do not analyze only the selected filter district. For each entity include metrics, strengths, skill gaps, and employment when present, then key differences, reasons supported by the data, and implications. If a value is missing, say the data is unavailable. Never invent statistics.

When appropriate, structure the response with:
1. Key finding (direct answer to the question)
2. Supporting data (concrete metrics and trades from context)
3. Interpretation (root cause analysis explaining why the data shows this pattern)
4. Suggested next analytical action (actionable policy or skilling recommendation)

For comparisons, also include a comparison object:
{"entities":[{"name":"","metrics":"","strengths":"","skill_gaps":"","employment":""}],"differences":"","reasons":"","implications":""}
Set comparison to null when the question is not a comparison.

You MUST respond strictly in valid JSON format matching this schema:
{
  "insight": "Key finding directly answering the user question (1-2 sentences)",
  "evidence": ["Supporting data point 1 with specific metrics/trades", "Supporting data point 2", "Supporting data point 3"],
  "explanation": "Interpretation and root cause analysis explaining why the data shows this pattern",
  "recommendation": "Suggested next analytical action or actionable policy/skilling intervention",
  "limitations": "Confidence or prototype dataset boundary notice",
  "comparison": null
}

Follow the specified tone guidelines precisely throughout every field.`;

    const fullPrompt = `${systemInstruction}

USER QUESTION:
${question}

CURRENT SKILLPULSE DATA:
${JSON.stringify(dashboardData || {}, null, 2)}

CURRENT CONTEXT:
${JSON.stringify(context || {}, null, 2)}

Provide your structured analysis in the exact JSON format specified.`;

    // Safe Development Debug Logging (does not log API key)
    console.log("\n" + "=".repeat(60));
    console.log("[DEBUG] USER QUESTION:\n", question);
    console.log("-".repeat(60));

    let lastError = "SkillPulse AI could not answer.";

    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[DEBUG] REQUEST SENT TO GEMINI (Model: ${model})`);

        const response = await ai.models.generateContent({
          model,
          contents: fullPrompt,
          config: {
            temperature: 0.2,
            topP: 0.95,
            responseMimeType: "application/json"
          }
        });

        const rawText = (response.text || "").trim();
        console.log("-".repeat(60));
        console.log(`[DEBUG] RESPONSE RECEIVED (Model: ${model}):\n`, rawText);
        console.log("=".repeat(60) + "\n");

        if (!rawText) {
          lastError = "SkillPulse AI returned an empty response.";
          continue;
        }

        // Clean potential markdown wrappers
        let cleaned = rawText;
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();

        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            throw new Error("SkillPulse AI returned an unreadable response");
          }
        }

        return NextResponse.json({
          insight: parsed.insight || "Analysis completed for the requested inquiry.",
          evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [parsed.evidence].filter(Boolean),
          explanation: parsed.explanation || "",
          recommendation: parsed.recommendation || "",
          limitations: parsed.limitations || "Based on available SkillPulse demonstration dataset. Not official government statistics.",
          source_mode: "SkillPulse AI",
          comparison: parsed.comparison && typeof parsed.comparison === "object" ? parsed.comparison : null
        });
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`[DEBUG] Model ${model} encountered error:`, errMsg);
        lastError = errMsg;

        if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("403")) {
          return NextResponse.json(
            { error: "SkillPulse AI could not answer." },
            { status: 403 }
          );
        }
        if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          lastError = "SkillPulse AI is busy. Please wait a moment and retry.";
        }
        continue;
      }
    }

    console.error("[DEBUG] All Gemini models failed:", lastError);
    return NextResponse.json(
      { error: "AI analysis is temporarily unavailable. Please try again." },
      { status: 503 }
    );
  } catch (err: any) {
    console.error("Unhandled error in /api/gemini route:", err);
    return NextResponse.json(
      { error: "AI analysis is temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}
