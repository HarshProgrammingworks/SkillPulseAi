"use client";

import React, { useState } from "react";
import { AiInsightCard, AiStructuredResponse, AiTone } from "@/types";
import {
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle,
  Briefcase,
  Smile
} from "lucide-react";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";

interface AiInsightsDashboardProps {
  insights: AiInsightCard[];
  aiStatus: { mode: string; has_key: boolean; model: string };
  onOpenAskAi: (initialQuestion?: string) => void;
  onAskLive: (question: string, tone?: AiTone) => Promise<AiStructuredResponse>;
  selectedDistrict: string;
}

export const AiInsightsDashboard: React.FC<AiInsightsDashboardProps> = ({
  insights,
  aiStatus,
  onOpenAskAi,
  onAskLive,
  selectedDistrict
}) => {
  const [liveQuestion, setLiveQuestion] = useState("");
  const [liveAnswer, setLiveAnswer] = useState<AiStructuredResponse | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveTone, setLiveTone] = useState<AiTone>(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem("skillpulse_ai_tone") as AiTone) || "formal";
    }
    return "formal";
  });

  const handleLiveToneChange = (newTone: AiTone) => {
    setLiveTone(newTone);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("skillpulse_ai_tone", newTone);
    }
  };

  const askLive = async () => {
    const text = liveQuestion.trim();
    if (!text) return;
    setLiveLoading(true);
    setLiveError(null);
    try {
      setLiveAnswer(await onAskLive(text, liveTone));
    } catch (err: any) {
      setLiveAnswer(null);
      setLiveError(err?.message || "SkillPulse AI could not answer.");
    } finally {
      setLiveLoading(false);
    }
  };
  const samplePrompts = [
    "Which skills have the largest demand-supply gap in Patna?",
    "Summarize employment and 6-month retention across Bihar, Uttar Pradesh, and Maharashtra.",
    "Explain the wage progression of EV Diagnostics and CNC technicians.",
    "Where should vocational training capacity be reallocated in Lucknow?"
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: SkillPulse AI Ground Truth Foundation */}
      <div className="gov-card overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-sky-50/30 p-6 sm:p-7 border border-slate-200/90 shadow-sm rounded-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="shrink-0 p-1 rounded-2xl bg-gradient-to-tr from-sky-800 to-indigo-700 shadow-md shadow-sky-900/10">
              <SkillPulseMark className="h-12 w-12" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-900 border border-sky-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
                  Verified Data Foundation
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  900 Cohort Records
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {aiStatus.mode}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                SkillPulse AI Ground Truth
              </h2>
              <p className="max-w-3xl text-xs sm:text-sm text-slate-600 leading-relaxed">
                Empirical baseline verified across Bihar, Uttar Pradesh, and Maharashtra. All SkillPulse AI reasoning, labor market gaps, wage progressions, and candidate recommendations are strictly grounded in this multi-state cohort.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-start sm:items-end justify-between gap-2 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
            <button
              onClick={() => onOpenAskAi()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition"
            >
              <SkillPulseMark className="h-4 w-4" />
              <span>Ask SkillPulse AI</span>
            </button>
            <span className="text-[11px] font-semibold text-slate-400">
              Model: {aiStatus.model}
            </span>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Suggested Prompts:
          </span>
          {samplePrompts.map((q) => (
            <button
              key={q}
              onClick={() => onOpenAskAi(q)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-sky-400 hover:bg-sky-50 transition shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <section className="gov-card relative z-10 bg-white p-5 border border-slate-200 space-y-3 overflow-visible">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900">SkillPulse AI</h3>
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {aiStatus.has_key ? aiStatus.mode : "Key required"} · {aiStatus.model}
            </span>
          </div>
          {/* Tone Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tone:</span>
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleLiveToneChange("formal")}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                  liveTone === "formal"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
                title="Formal: Professional, concise, and structured policy language"
              >
                <Briefcase className="h-3 w-3" />
                <span>Formal</span>
              </button>
              <button
                type="button"
                onClick={() => handleLiveToneChange("friendly")}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                  liveTone === "friendly"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
                title="Friendly: Conversational, approachable, and encouraging with tasteful emojis"
              >
                <Smile className="h-3 w-3" />
                <span>Friendly</span>
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">Context: {selectedDistrict || "All Districts"}. Answers use the synthetic prototype dataset.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={liveQuestion}
            onChange={(event) => setLiveQuestion(event.target.value)}
            placeholder="Ask SkillPulse AI anything about employment, skills or workforce data..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button onClick={askLive} disabled={liveLoading} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {liveLoading ? "Asking…" : "Ask"}
          </button>
        </div>
        {liveError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {liveError}
            <button onClick={askLive} className="ml-2 font-bold underline">Retry</button>
          </div>
        )}
        {liveAnswer && (
          <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-indigo-100 bg-slate-50 p-3 text-sm leading-relaxed break-words">
            <p className="font-bold text-slate-900">{liveAnswer.insight}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
              {(liveAnswer.evidence || []).map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{liveAnswer.explanation}</p>
            <p className="mt-2 text-xs font-semibold text-indigo-950">{liveAnswer.recommendation}</p>
          </div>
        )}
      </section>

      {/* Structured Insight Cards (Section 16 Specification) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Strategic Policy Observations ({insights.length})
          </h4>
          <span className="text-xs text-slate-400">
            Active Scope: {selectedDistrict && selectedDistrict !== "All Districts" ? selectedDistrict : "Bihar, Uttar Pradesh, and Maharashtra"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {insights.map((card) => (
            <div
              key={card.id}
              className="gov-card p-5 bg-white border border-slate-200 space-y-4 hover:border-indigo-300 transition-all"
            >
              {/* Card Header: Category & AI Label */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase border border-indigo-200">
                    {card.category}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{card.tag}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <SkillPulseMark className="h-4 w-4 rounded-md" />
                  <span>AI-Assisted Decision Insight</span>
                </div>
              </div>

              {/* 1. Observation */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  1. Observation
                </span>
                <p className="text-sm font-bold text-slate-900 leading-snug">{card.observation}</p>
              </div>

              {/* 2. Supporting Ground Truth Data */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  2. Supporting Verified Data
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {card.supporting_data.map((sd, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border text-xs ${
                        sd.alert
                          ? "bg-rose-50/70 border-rose-200 text-rose-900"
                          : sd.positive
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 block line-clamp-1">{sd.metric}</span>
                      <strong className="text-xs font-bold block mt-0.5">{sd.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Possible Explanation & 4. Suggested Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                    <span>3. Possible Explanation</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{card.possible_explanation}</p>
                </div>

                <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-sky-950 mb-1">
                    <Lightbulb className="h-3.5 w-3.5 text-sky-600" />
                    <span>4. Suggested Policy Action</span>
                  </div>
                  <p className="text-sky-900 leading-relaxed text-[11px] font-medium">{card.suggested_action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
