"use client";

import React, { useState, useEffect, useRef } from "react";
import { AiStructuredResponse, AiTone } from "@/types";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Lightbulb,
  FileCheck,
  RefreshCw,
  HelpCircle,
  Clock,
  Trash2,
  ArrowRight,
  Info,
  Briefcase,
  Smile,
  Sparkles
} from "lucide-react";

interface ConversationItem {
  id: string;
  question: string;
  response: AiStructuredResponse;
  timestamp: string;
  tone?: AiTone;
}

interface AskSkillPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAsk: (question: string, history?: Array<{ role: string; content: string }>, tone?: AiTone) => Promise<AiStructuredResponse>;
  initialQuestion?: string;
  selectedDistrict: string;
}

export const AskSkillPulseModal: React.FC<AskSkillPulseModalProps> = ({
  isOpen,
  onClose,
  onAsk,
  initialQuestion = "",
  selectedDistrict
}) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tone, setTone] = useState<AiTone>(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem("skillpulse_ai_tone") as AiTone) || "formal";
    }
    return "formal";
  });

  const handleToneChange = (newTone: AiTone) => {
    setTone(newTone);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("skillpulse_ai_tone", newTone);
    }
  };

  useEffect(() => {
    if (isOpen) setQuestion(initialQuestion || "");
  }, [isOpen, initialQuestion]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const latestTurnRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(conversations.length);

  // Scroll to the start of the newly submitted question/turn once generated
  useEffect(() => {
    if (conversations.length > prevCountRef.current) {
      const timer = setTimeout(() => {
        if (latestTurnRef.current && chatContainerRef.current) {
          const container = chatContainerRef.current;
          const target = latestTurnRef.current;
          const targetOffset = target.offsetTop - container.offsetTop;
          container.scrollTo({
            top: Math.max(0, targetOffset - 12),
            behavior: "smooth"
          });
        }
      }, 60);
      prevCountRef.current = conversations.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = conversations.length;
  }, [conversations.length]);

  const suggestedQuestions = [
    "Why is the employment rate low in Pune?",
    "What skills are in demand for EV technicians?",
    "Which district has the largest skill gap?",
    "How do wages in Pune compare to Patna?",
    "What are the major retention factors for CNC operators?",
    "Which sectors have surging hiring in Western Maharashtra?"
  ];

  const handleSubmit = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMsg(null);

    // Build conversation history for context preservation
    const history: Array<{ role: string; content: string }> = [];
    conversations.forEach((item) => {
      history.push({ role: "user", content: item.question });
      const modelSummary = [
        item.response.insight,
        item.response.explanation ? `Context: ${item.response.explanation}` : ""
      ].filter(Boolean).join(" ");
      history.push({ role: "model", content: modelSummary || item.response.insight });
    });

    try {
      const res = await onAsk(q, history, tone);
      const newItem: ConversationItem = {
        id: `MSG-${Date.now()}`,
        question: q,
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tone
      };
      setConversations((prev) => [...prev, newItem]);
      setQuestion("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to retrieve AI analysis. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setConversations([]);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 h-[88vh] max-h-[850px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <SkillPulseMark className="h-9 w-9" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Ask SkillPulse AI</h3>
                <span className="rounded-md bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.2 text-[10px] font-semibold text-indigo-200">
                  Three-state workforce reasoning
                </span>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.2 text-[10px] font-medium text-emerald-300 hidden sm:inline">
                  Conversational Memory Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Ground-truth queries use the Bihar, Uttar Pradesh, and Maharashtra prototype dataset.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversations.length > 0 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition"
                title="Clear current conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Chat Body */}
        <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {/* Welcome Card if no messages yet */}
          {conversations.length === 0 && !isLoading && (
            <div className="gov-card p-6 bg-white border border-slate-200 text-center max-w-2xl mx-auto my-6 space-y-4 shadow-xs">
              <SkillPulseMark className="h-12 w-12 mx-auto rounded-2xl shadow-md" />
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Ask SkillPulse AI Assistant
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Query policy questions, trade deficits, and wage benchmarks for Bihar, Uttar Pradesh, and Maharashtra.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-left text-xs text-indigo-950 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed text-indigo-900">
                  <strong>Notice:</strong> Insights are grounded in the active Maharashtra demonstration prototype dataset for SIH evaluation. Responses clearly state prototype boundaries and never fabricate official census reports.
                </span>
              </div>
            </div>
          )}

          {/* Conversation History */}
          {conversations.map((item, index) => {
            const isLatest = index === conversations.length - 1;
            return (
              <div
                key={item.id}
                ref={isLatest ? latestTurnRef : undefined}
                className="space-y-3"
              >
              {/* User Question Bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-slate-900 text-white px-4 py-2.5 shadow-sm text-xs">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="font-semibold text-slate-300 text-[10px]">Your Inquiry</span>
                    <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                  </div>
                  <p className="leading-relaxed">{item.question}</p>
                </div>
              </div>

              {/* AI Structured Response Card */}
              <div className="flex justify-start">
                <div className="w-full max-w-[95%] sm:max-w-[90%] rounded-2xl rounded-tl-xs bg-white border border-indigo-200 shadow-md p-4 sm:p-5 space-y-4">
                  {/* Top Bar with Mode Badge & Tone Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <SkillPulseMark className="h-4 w-4" />
                      <span className="text-xs font-bold text-slate-900">SkillPulse Intelligence Evaluation</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        item.tone === "friendly"
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}>
                        {item.tone === "friendly" ? "Friendly" : "Formal"}
                      </span>
                      <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {item.response.source_mode || "SkillPulse AI"}
                      </span>
                    </div>
                  </div>

                  {/* Primary Direct Insight */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Core Insight</span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                      {item.response.insight}
                    </p>
                  </div>

                  {/* Evidence Points */}
                  {item.response.evidence && item.response.evidence.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Grounded Dataset Evidence
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {item.response.evidence.map((ev, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 p-2.5 text-xs text-slate-800"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-snug">{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation & Root Cause */}
                  {item.response.explanation && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                        Root Cause &amp; Market Dynamics
                      </span>
                      <p className="whitespace-pre-wrap break-words text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {item.response.explanation}
                      </p>
                    </div>
                  )}

                  {item.response.comparison?.entities && item.response.comparison.entities.length > 0 && (
                    <div className="space-y-2">
                      {item.response.comparison.entities.map((entity) => (
                        <div key={entity.name} className="rounded-lg border border-slate-200 p-3 text-xs">
                          <h4 className="font-black text-slate-900">{entity.name}</h4>
                          <p className="mt-1 whitespace-pre-wrap"><strong>Metrics: </strong>{entity.metrics || "Data unavailable"}</p>
                          <p className="whitespace-pre-wrap"><strong>Strengths: </strong>{entity.strengths || "Data unavailable"}</p>
                          <p className="whitespace-pre-wrap"><strong>Skill gaps: </strong>{entity.skill_gaps || "Data unavailable"}</p>
                          <p className="whitespace-pre-wrap"><strong>Employment: </strong>{entity.employment || "Data unavailable"}</p>
                        </div>
                      ))}
                      <div className="rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap">
                        <p><strong>Key differences: </strong>{item.response.comparison.differences || "Data unavailable"}</p>
                        <p className="mt-1"><strong>Possible reasons: </strong>{item.response.comparison.reasons || "Data unavailable"}</p>
                        <p className="mt-1"><strong>Implications: </strong>{item.response.comparison.implications || "Data unavailable"}</p>
                      </div>
                    </div>
                  )}

                  {/* Actionable Policy Recommendation */}
                  {item.response.recommendation && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                        <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
                        Actionable Policy Recommendation
                      </span>
                      <p className="text-xs font-medium text-indigo-950 leading-relaxed">
                        {item.response.recommendation}
                      </p>
                    </div>
                  )}

                  {/* Limitations Caveat */}
                  {item.response.limitations && (
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center gap-1.5">
                      <Info className="h-3 w-3 shrink-0" />
                      <span>{item.response.limitations}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-200 p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-700">
                  Analyzing SkillPulse data...
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Inquiry Error</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Inquiries */}
        <div className="border-t border-slate-200 bg-white px-4 py-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Suggested:
            </span>
            {suggestedQuestions.map((sq) => (
              <button
                key={sq}
                onClick={() => {
                  setQuestion(sq);
                  handleSubmit(sq);
                }}
                className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 transition"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Model & Tone Selector Bar */}
        <div 
          className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs shrink-0 transition-colors"
          style={{ backgroundColor: "var(--th-surface)", borderColor: "var(--th-border)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--th-text-secondary)" }}>
              AI Model:
            </span>
            <div 
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border transition-colors"
              style={{ backgroundColor: "var(--th-input-bg)", borderColor: "var(--th-border)", color: "var(--th-text)" }}
            >
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>Gemini 3.6 Flash</span>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--th-text-secondary)" }}>
              Tone:
            </span>
            <div 
              className="inline-flex items-center rounded-lg border p-0.5 shadow-2xs transition-colors"
              style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-input-bg)" }}
            >
              <button
                type="button"
                onClick={() => handleToneChange("formal")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                  tone === "formal"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-sky-600"
                    : "hover:opacity-80"
                }`}
                style={tone !== "formal" ? { color: "var(--th-text-secondary)" } : undefined}
                title="Formal: Professional, concise, and structured policy language"
              >
                <Briefcase className="h-3 w-3" />
                <span>Formal</span>
              </button>
              <button
                type="button"
                onClick={() => handleToneChange("friendly")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                  tone === "friendly"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "hover:opacity-80"
                }`}
                style={tone !== "friendly" ? { color: "var(--th-text-secondary)" } : undefined}
                title="Friendly: Conversational, approachable, and encouraging with tasteful emojis"
              >
                <Smile className="h-3 w-3" />
                <span>Friendly</span>
              </button>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask SkillPulse AI…"
              value={question}
              disabled={isLoading}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-24 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
            <button
              disabled={isLoading || !question.trim()}
              onClick={() => handleSubmit()}
              className="absolute right-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40 transition shadow-xs"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
