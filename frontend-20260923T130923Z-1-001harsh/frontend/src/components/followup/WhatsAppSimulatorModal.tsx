"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, CheckCheck, ShieldCheck, Smartphone, Clock, Building, Briefcase, Award, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  topic?: string;
  timestamp?: string;
}

interface WhatsAppSimulatorModalProps {
  trainee: any;
  targetStage?: string;
  onClose: () => void;
  onComplete: (data: any) => Promise<void>;
}

export const WhatsAppSimulatorModal: React.FC<WhatsAppSimulatorModalProps> = ({
  trainee,
  targetStage,
  onClose,
  onComplete
}) => {
  const traineeId = trainee.trainee_id || trainee.id;
  const traineeName = trainee.trainee_name || trainee.name || "Candidate";
  const skillpulseId = trainee.skillpulse_id || trainee.trainee_id || trainee.id || "SP-DEMO";
  const district = trainee.district || "State District";
  const state = trainee.state || "";

  // Determine stage to follow up on (defaults to 9M or 12M if available, or trainee.stage)
  const stage = targetStage || trainee.stage || "9M";
  const is12M = stage === "12M" || stage === "12 Months" || stage === "365 Days";
  const is9M = stage === "9M" || stage === "9 Months";
  const stageTitle = is12M ? "12-Month Long-Term Outcome" : is9M ? "9-Month Career Outcome" : `${stage} Checkpoint`;

  // Pre-existing checkpoint details from trainee if present
  const existingCheckpoint = (trainee.checkpoints || []).find((c: any) => c.stage === stage) || {};
  const currentEmpStatus = existingCheckpoint.employment_status || trainee.employment_status || "Employed";
  const currentRole = existingCheckpoint.role || trainee.job_role || trainee.programme || "Specialist";
  const currentEmployer = existingCheckpoint.employer || trainee.employer || "Enterprise Partner";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [replies, setReplies] = useState<string[]>([
    "Still employed",
    "Changed employer",
    "Looking for a job",
    "Self-employed",
    "Further training",
    "Not currently working"
  ]);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Free-text check-ins start as Self-Reported per requirement 8
  const [outcomeForm, setOutcomeForm] = useState({
    employment_status: currentEmpStatus,
    employer: currentEmployer,
    job_role: currentRole,
    wage: existingCheckpoint.wage || trainee.wage || trainee.current_wage || 24500,
    duration: is12M ? "12+ months" : is9M ? "9 months" : "6 months",
    role_relevance: "Relevant",
    skill_utilisation: "High",
    verification_status: "Self-Reported"
  });

  const scroller = useRef<HTMLDivElement>(null);

  const getNowTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Initialize opening question dynamically from backend API with fallback
  useEffect(() => {
    let isMounted = true;
    setBusy(true);

    api.nextFollowUpQuestion(traineeId, [], stage)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.question) {
          setMessages([
            {
              role: "assistant",
              content: res.question,
              topic: res.topic || "employment_check",
              timestamp: getNowTime()
            }
          ]);
          if (res.suggested_replies || res.quick_replies) {
            setReplies(res.suggested_replies || res.quick_replies);
          }
        } else {
          fallbackInitial();
        }
      })
      .catch(() => {
        if (isMounted) fallbackInitial();
      })
      .finally(() => {
        if (isMounted) setBusy(false);
      });

    const fallbackInitial = () => {
      setMessages([
        {
          role: "assistant",
          content: `Hi ${traineeName.split(" ")[0]}, we'd like to update your employment status for your ${stageTitle} follow-up.\n\nAre you currently employed?`,
          topic: "employment_check",
          timestamp: getNowTime()
        }
      ]);
    };

    return () => {
      isMounted = false;
    };
  }, [traineeId, stage]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Escape key listener for clean closing
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy || complete) return;
    setDraft("");

    const userMsg: ChatMessage = {
      role: "user",
      content,
      timestamp: getNowTime()
    };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setBusy(true);
    setError(null);

    try {
      // Call backend dynamic conversational follow-up
      const apiHistory = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
        topic: m.topic
      }));

      const res = await api.nextFollowUpQuestion(traineeId, apiHistory, stage);

      if (res && res.question) {
        setMessages([
          ...updatedHistory,
          {
            role: "assistant",
            content: res.question,
            topic: res.topic,
            timestamp: getNowTime()
          }
        ]);
        setReplies(res.suggested_replies || res.quick_replies || []);

        if (res.complete) {
          setComplete(true);
          const collected = res.collected || {};
          setOutcomeForm((prev) => ({
            ...prev,
            employment_status: collected.employment_status || prev.employment_status,
            employer: collected.employer || prev.employer,
            job_role: collected.job_role || prev.job_role,
            wage: collected.wage || prev.wage,
            duration: collected.duration || prev.duration,
            role_relevance: collected.role_relevance || prev.role_relevance,
            skill_utilisation: collected.skill_utilisation || prev.skill_utilisation,
            verification_status: collected.verification_status || "Self-Reported"
          }));
        }
      } else {
        // Safe fallback question if API returns empty
        fallbackResponse(updatedHistory, content);
      }
    } catch (err: any) {
      console.warn("Followup dynamic API call error:", err);
      fallbackResponse(updatedHistory, content);
    } finally {
      setBusy(false);
    }
  };

  const fallbackResponse = (currentHistory: ChatMessage[], lastUserText: string) => {
    const lower = lastUserText.toLowerCase();
    let nextQ = "Thanks for the update. Could you please confirm your current employer or work location?";
    let nextR = ["Still with same employer", "Changed employer recently", "Working independently"];
    let isDone = false;

    if (currentHistory.length >= 6) {
      nextQ = `Thank you ${traineeName.split(" ")[0]}! Your ${stageTitle} follow-up has been logged as Self-Reported.`;
      nextR = [];
      isDone = true;
      setComplete(true);
    } else if (lower.includes("not working") || lower.includes("unemployed") || lower.includes("looking")) {
      nextQ = "Thank you for letting us know. Are you currently actively looking for work or interested in further training?";
      nextR = ["Actively looking for work", "Interested in further training", "Not looking right now"];
      setOutcomeForm((prev) => ({ ...prev, employment_status: "Unemployed", verification_status: "Self-Reported" }));
    }

    setMessages([
      ...currentHistory,
      {
        role: "assistant",
        content: nextQ,
        topic: isDone ? "done" : "fallback",
        timestamp: getNowTime()
      }
    ]);
    setReplies(nextR);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await onComplete({
        follow_up_id: trainee.follow_up_id || `FU-${traineeId}-${stage}`,
        stage: stage,
        employment_status: outcomeForm.employment_status,
        employer: outcomeForm.employer,
        job_role: outcomeForm.job_role,
        wage: outcomeForm.wage,
        job_relevance: outcomeForm.role_relevance,
        skill_usage: outcomeForm.skill_utilisation,
        verification_status: outcomeForm.verification_status || "Self-Reported",
        channel_used: "WhatsApp",
        consent_given: true,
        completed_date: new Date().toISOString().split("T")[0]
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not save follow-up check-in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/75 p-3 sm:items-center backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="flex h-[min(680px,94vh)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border-4 border-slate-800 bg-[#ECE5DD] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* WhatsApp Top Header Bar */}
        <div className="flex items-center justify-between bg-[#075E54] px-4 py-3 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 font-black text-sm text-white border-2 border-emerald-400">
                {traineeName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#075E54]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold leading-tight">{traineeName}</span>
                <span className="rounded-full bg-emerald-900/60 px-2 py-0.2 text-[10px] font-mono text-emerald-200 border border-emerald-500/30">
                  {skillpulseId}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-200">
                <span>{district}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-100">{stage} Checkpoint</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-900/80 px-2 py-1 text-[10px] font-bold text-emerald-100 border border-emerald-500/40 hidden sm:inline-block">
              {stageTitle}
            </span>
            <button
              onClick={onClose}
              aria-label="Close WhatsApp Follow-up"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-emerald-800/80 text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Trainee Checkpoint Status Strip */}
        <div className="flex items-center justify-between bg-[#054D44] px-4 py-1.5 text-[11px] text-emerald-100/90 border-t border-emerald-600/30">
          <div className="flex items-center gap-2">
            <span className="text-emerald-300 font-medium">Recorded Status:</span>
            <strong className="text-white">{outcomeForm.employment_status}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span className="font-semibold">{outcomeForm.verification_status}</span>
          </div>
        </div>

        {/* WhatsApp Chat Conversation Body */}
        <div
          ref={scroller}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]"
        >
          {/* WhatsApp Encryption / AI Disclaimer banner */}
          <div className="flex justify-center">
            <span className="rounded-lg bg-[#FFF3C4] px-3 py-1 text-center text-[10px] font-medium text-amber-900 shadow-2xs border border-amber-200/80 max-w-xs">
              🔒 Simulated SkillPulse AI conversational check-in. Natural-language answers update longitudinal outcome records.
            </span>
          </div>

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-xs ${
                  message.role === "user"
                    ? "bg-[#DCF8C6] text-slate-900 rounded-tr-xs"
                    : "bg-white text-slate-900 rounded-tl-xs"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400">
                  <span>{message.timestamp || "Just now"}</span>
                  {message.role === "user" && <CheckCheck className="h-3 w-3 text-sky-600" />}
                </div>
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-xs bg-white px-3.5 py-2 text-xs text-slate-500 shadow-xs flex items-center gap-1.5">
                <span className="animate-pulse">Typing follow-up query…</span>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-800">
              {error}
            </p>
          )}

          {/* Outcome Summary Preview when dialogue wraps */}
          {complete && (
            <div className="rounded-2xl border-2 border-emerald-500 bg-white p-4 shadow-sm space-y-3 text-xs animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Outcome Check-in Summary ({stage})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  {outcomeForm.verification_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Employment Status</span>
                  <strong className="text-slate-900">{outcomeForm.employment_status}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Employer</span>
                  <strong className="text-slate-900">{outcomeForm.employer}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Current Role</span>
                  <span className="font-semibold text-slate-800">{outcomeForm.job_role}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Duration</span>
                  <span className="font-semibold text-slate-800">{outcomeForm.duration}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Role Relevance</span>
                  <span className="font-semibold text-emerald-700">{outcomeForm.role_relevance}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Skill Utilisation</span>
                  <span className="font-semibold text-sky-800">{outcomeForm.skill_utilisation}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between">
                <span>Update Source: <strong>Trainee WhatsApp Check-in (Self-Reported)</strong></span>
                <span className="font-mono text-[10px]">Today</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Reply Interactive Pills (Optional shortcuts per requirement 7) */}
        {replies.length > 0 && !complete && (
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 pt-1 border-t border-slate-200/60 bg-[#E5DDD5]">
            {replies.map((reply) => (
              <button
                key={reply}
                onClick={() => send(reply)}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 shadow-2xs hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-900 transition cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input / Save Action Bar */}
        <div className="flex gap-2 bg-[#F0F0F0] p-3 border-t border-slate-200">
          {complete ? (
            <button
              onClick={handleSave}
              disabled={busy}
              className="w-full rounded-2xl bg-[#075E54] py-3 text-xs font-black text-white hover:bg-[#064e46] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Confirm & Sync with Career Journey ({stage})</span>
            </button>
          ) : (
            <>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && draft.trim()) send(draft);
                }}
                placeholder="Type your response..."
                className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => send(draft)}
                disabled={busy || !draft.trim()}
                className="rounded-full bg-[#075E54] px-4 text-xs font-bold text-white hover:bg-[#064e46] transition disabled:opacity-50 cursor-pointer"
              >
                Send
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
