"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Search,
  ListFilter,
  Loader2
} from "lucide-react";
import { WhatsAppSimulatorModal } from "./WhatsAppSimulatorModal";
import { StateDistrictFields } from "@/components/geo/StateDistrictFields";

interface FollowUpEngineProps {
  followupsData: {
    total: number;
    page: number;
    page_size?: number;
    total_pages?: number;
    summary: {
      all?: number;
      pending: number;
      completed: number;
      overdue: number;
      response_rate: number;
    };
    items: any[];
  };
  onCompleteFollowUp: (traineeId: string, payload: any) => Promise<void>;
  onSelectTraineeId?: (traineeId: string) => void;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  selectedState?: string;
  onStateChange?: (state: string) => void;
  onStateDistrictChange?: (state: string, district: string) => void;
  districtsList: string[];
  // Controlled filter props
  activeStatus?: string;
  onStatusChange?: (status: string) => void;
  selectedStage?: string;
  onStageChange?: (stage: string) => void;
  selectedChannel?: string;
  onChannelChange?: (channel: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export const FollowUpEngine: React.FC<FollowUpEngineProps> = ({
  followupsData,
  onCompleteFollowUp,
  onSelectTraineeId,
  selectedDistrict,
  onDistrictChange,
  selectedState = "All States",
  onStateChange,
  onStateDistrictChange,
  districtsList,
  activeStatus: controlledStatus,
  onStatusChange,
  selectedStage: controlledStage,
  onStageChange,
  selectedChannel: controlledChannel,
  onChannelChange,
  searchQuery: controlledSearch,
  onSearchChange,
  currentPage: controlledPage,
  pageSize = 15,
  totalPages: controlledTotalPages,
  onPageChange,
  isLoading = false
}) => {
  // Local fallbacks if parent does not control
  const [internalStatus, setInternalStatus] = useState<string>("Pending");
  const [internalStage, setInternalStage] = useState<string>("All Stages");
  const [internalChannel, setInternalChannel] = useState<string>("All Channels");
  const [internalSearch, setInternalSearch] = useState<string>("");
  const [internalPage, setInternalPage] = useState<number>(1);
  const [activeSimulatorTrainee, setActiveSimulatorTrainee] = useState<any | null>(null);

  const activeStatus = controlledStatus !== undefined ? controlledStatus : internalStatus;
  const currentStage = controlledStage !== undefined ? controlledStage : internalStage;
  const currentChannel = controlledChannel !== undefined ? controlledChannel : internalChannel;
  const currentSearch = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const currentPage = controlledPage !== undefined ? controlledPage : internalPage;

  const handleStatusSelect = (status: string) => {
    if (onStatusChange) {
      onStatusChange(status);
    } else {
      setInternalStatus(status);
      setInternalPage(1);
    }
  };

  const handleStageSelect = (stage: string) => {
    if (onStageChange) {
      onStageChange(stage);
    } else {
      setInternalStage(stage);
      setInternalPage(1);
    }
  };

  const handleChannelSelect = (channel: string) => {
    if (onChannelChange) {
      onChannelChange(channel);
    } else {
      setInternalChannel(channel);
      setInternalPage(1);
    }
  };

  const handleSearchInput = (q: string) => {
    if (onSearchChange) {
      onSearchChange(q);
    } else {
      setInternalSearch(q);
      setInternalPage(1);
    }
  };

  const handlePageSelect = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setInternalPage(page);
    }
  };

  const summary = followupsData?.summary || { all: 0, pending: 0, completed: 0, overdue: 0, response_rate: 0 };
  const allCount = summary.all ?? (summary.pending + summary.completed + summary.overdue);
  const items = Array.isArray(followupsData?.items) ? followupsData.items : [];
  const totalRecords = followupsData?.total ?? items.length;
  const totalPages = controlledTotalPages || followupsData?.total_pages || Math.max(1, Math.ceil(totalRecords / pageSize));

  const getVerifBadge = (verif: string) => {
    switch (verif) {
      case "Multi-Verified":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Employer Verified":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Training Verified":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Assessment Verified":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Pending Verification":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Overdue":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* All Check-ins Card */}
        <div
          onClick={() => handleStatusSelect("All")}
          className={`gov-card p-4 cursor-pointer transition-all border ${
            activeStatus.toLowerCase() === "all"
              ? "ring-2 ring-slate-900 bg-slate-100/60 border-slate-400 shadow-sm"
              : "hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-700">All Follow-ups</span>
            <ListFilter className="h-4 w-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 my-1">{allCount.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500">Total verified &amp; active records</p>
        </div>

        {/* Pending Check-ins Card */}
        <div
          onClick={() => handleStatusSelect("Pending")}
          className={`gov-card p-4 cursor-pointer transition-all border ${
            activeStatus.toLowerCase() === "pending"
              ? "ring-2 ring-sky-500 bg-sky-50/40 border-sky-300 shadow-sm"
              : "hover:border-sky-200 hover:bg-sky-50/20"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-700">Pending Check-ins</span>
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-900 my-1">{summary.pending.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500">Scheduled 30D / 90D / 180D / 9M / 12M</p>
        </div>

        {/* Completed Records Card */}
        <div
          onClick={() => handleStatusSelect("Completed")}
          className={`gov-card p-4 cursor-pointer transition-all border ${
            activeStatus.toLowerCase() === "completed"
              ? "ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-300 shadow-sm"
              : "hover:border-emerald-200 hover:bg-emerald-50/20"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-700">Completed Records</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 my-1">{summary.completed.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500">Verified through digital &amp; assisted channels</p>
        </div>

        {/* Overdue Follow-ups Card */}
        <div
          onClick={() => handleStatusSelect("Overdue")}
          className={`gov-card p-4 cursor-pointer transition-all border ${
            activeStatus.toLowerCase() === "overdue"
              ? "ring-2 ring-rose-500 bg-rose-50/40 border-rose-300 shadow-sm"
              : "hover:border-rose-200 hover:bg-rose-50/20"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-700">Overdue Follow-ups</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 my-1">{summary.overdue.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500">Unanswered &gt;14 days past due milestone</p>
        </div>

        {/* Response Rate Card */}
        <div className="gov-card p-4 bg-indigo-50/30 border-indigo-200 border">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-indigo-900">Response Rate</span>
            <Smartphone className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 my-1">
            {summary.response_rate}%
          </div>
          <p className="text-[10px] text-indigo-700 font-medium">Automated reply compliance</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="gov-card p-5 bg-white border border-slate-200">
        {/* Navigation Tabs and Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "All", label: "All Records", count: allCount },
                { id: "Pending", label: "Pending Check-ins", count: summary.pending },
                { id: "Completed", label: "Completed", count: summary.completed },
                { id: "Overdue", label: "Overdue", count: summary.overdue }
              ].map((tab) => {
                const isActive = activeStatus.toLowerCase() === tab.id.toLowerCase();
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleStatusSelect(tab.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate, ID, employer, trade…"
                value={currentSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {currentSearch && (
                <button
                  onClick={() => handleSearchInput("")}
                  className="absolute right-2 top-2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Secondary Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Stage filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stage:</span>
              <select
                value={currentStage}
                onChange={(e) => handleStageSelect(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="All Stages">All Stages</option>
                <option value="30D">30D (1 Month)</option>
                <option value="90D">90D (3 Months)</option>
                <option value="180D">180D (6 Months)</option>
                <option value="270D">270D (9 Months)</option>
                <option value="9M">9M (9 Months Outcome)</option>
                <option value="12M">12M (12 Months Long-Term)</option>
              </select>
            </div>

            {/* Channel filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Channel:</span>
              <select
                value={currentChannel}
                onChange={(e) => handleChannelSelect(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="All Channels">All Channels</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="Web">Web Portal</option>
                <option value="IVR">IVR Call</option>
                <option value="Call Centre">Call Centre</option>
              </select>
            </div>

            {/* District filter */}
            <div className="min-w-[220px]">
              <StateDistrictFields
                allowAll
                state={selectedState}
                district={selectedDistrict}
                onChange={(st, dist) => {
                  const targetDist = dist || "All Districts";
                  if (onStateDistrictChange) {
                    onStateDistrictChange(st, targetDist);
                  } else {
                    onStateChange?.(st);
                    onDistrictChange(targetDist);
                  }
                }}
              />
            </div>

            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold ml-auto">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Refreshing records…</span>
              </div>
            )}
          </div>
        </div>

        {/* Follow-ups Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="gov-table-header">
                <th className="py-3 px-3">Trainee Candidate</th>
                <th className="py-3 px-3">Milestone Stage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Employment Details</th>
                <th className="py-3 px-3">Verification Outcome</th>
                <th className="py-3 px-3">Monthly Wage</th>
                <th className="py-3 px-3 text-center">Interactive Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.length > 0 ? (
                items.map((item) => {
                  const is12M = item.stage === "12M" || item.stage === "12 Months" || item.stage === "365 Days";
                  const is9M = item.stage === "9M" || item.stage === "9 Months";
                  const verifStatus = item.verification_status || "Multi-Verified";
                  const statusVal = item.status || "Pending";

                  return (
                    <tr key={item.follow_up_id} className="hover:bg-sky-50/40 transition">
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectTraineeId?.(item.trainee_id)}
                          className="font-bold text-slate-900 hover:text-sky-700 text-left block"
                        >
                          {item.trainee_name}
                        </button>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.skillpulse_id || item.trainee_id} • {item.district}, {item.state || ""}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`font-black px-2 py-0.5 rounded text-[11px] border ${
                            is12M
                              ? "bg-sky-100 text-sky-950 border-sky-300"
                              : is9M
                              ? "bg-indigo-100 text-indigo-950 border-indigo-300"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}>
                            {item.stage}
                          </span>
                          {is12M && (
                            <span className="text-[9px] font-bold text-sky-700 uppercase tracking-tighter">
                              Long-Term Outcome
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">Due: {item.due_date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadge(statusVal)}`}>
                          {statusVal}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {item.employment_status || "Employed"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.job_role || "Trade Specialist"} at <strong className="text-slate-700">{item.employer || "Employer Desk"}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] border ${getVerifBadge(verifStatus)}`}>
                            <ShieldCheck className="h-3 w-3" />
                            {verifStatus}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            Sources: {(item.verification_sources || ["Trainee confirmation", "Employer confirmation"]).slice(0, 2).join(" + ")}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            Updated: {item.last_updated || "12 Sep 2026"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {item.wage ? `₹${item.wage.toLocaleString()}/mo` : "₹22,000–₹26,000/mo"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveSimulatorTrainee(item)}
                            className="flex items-center gap-1.5 rounded-xl bg-[#075E54] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#064e46] shadow-xs transition cursor-pointer"
                            title="Open WhatsApp Follow-up Simulation"
                          >
                            <Smartphone className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {onSelectTraineeId && (
                            <button
                              onClick={() => onSelectTraineeId(item.trainee_id)}
                              className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                              title="Inspect Candidate Profile & Longitudinal Ledger"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs space-y-1">
                    <p className="font-bold text-slate-700">No matching follow-up records found.</p>
                    <p className="text-slate-400">
                      Try adjusting the status tabs, milestone stage, communication channel, or search query.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-900">{totalPages}</span> (
            <span className="font-bold text-slate-900">{totalRecords.toLocaleString()}</span> total{" "}
            {activeStatus.toLowerCase() === "all" ? "matching" : activeStatus.toLowerCase()} records)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1 || isLoading}
              onClick={() => handlePageSelect(currentPage - 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <div className="px-2 font-mono font-bold text-slate-800">
              {currentPage} / {totalPages}
            </div>

            <button
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => handlePageSelect(currentPage + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded WhatsApp Simulator Modal (Preserved exactly as working) */}
      {activeSimulatorTrainee && (
        <WhatsAppSimulatorModal
          trainee={activeSimulatorTrainee}
          targetStage={activeSimulatorTrainee.stage}
          onClose={() => setActiveSimulatorTrainee(null)}
          onComplete={async (data) => {
            await onCompleteFollowUp(activeSimulatorTrainee.trainee_id, data);
            setActiveSimulatorTrainee(null);
          }}
        />
      )}
    </div>
  );
};

