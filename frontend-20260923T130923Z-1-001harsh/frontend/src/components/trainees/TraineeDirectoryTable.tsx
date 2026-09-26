"use client";

import React, { useState } from "react";
import { Trainee, VerificationStatus } from "@/types";
import { StateDistrictFields } from "@/components/geo/StateDistrictFields";
import {
  Search,
  Download,
  Plus,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Building,
  UserCheck
} from "lucide-react";

interface TraineeDirectoryTableProps {
  trainees: Trainee[];
  totalTrainees: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectTrainee: (trainee: Trainee) => void;
  onExport: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  selectedState?: string;
  onStateChange?: (state: string) => void;
  onStateDistrictChange?: (state: string, district: string) => void;
  selectedProgramme: string;
  onProgrammeChange: (programme: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  districtsList: string[];
  programmesList: string[];
  onAddTrainee?: () => void;
}

export const TraineeDirectoryTable: React.FC<TraineeDirectoryTableProps> = ({
  trainees,
  totalTrainees,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onSelectTrainee,
  onExport,
  onSearchChange,
  searchQuery,
  selectedDistrict,
  onDistrictChange,
  selectedState = "All States",
  onStateChange,
  onStateDistrictChange,
  selectedProgramme,
  onProgrammeChange,
  selectedStatus,
  onStatusChange,
  districtsList,
  programmesList,
  onAddTrainee
}) => {
  const [sortField, setSortField] = useState<string>("id");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTrainees = [...trainees].sort((a: any, b: any) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = (bVal || "").toLowerCase();
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case "Multi-Verified":
        return <span className="badge-multi-verified text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> Multi-Verified</span>;
      case "Employer Verified":
        return <span className="badge-employer-verified text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> Employer Verified</span>;
      case "Self Reported":
        return <span className="badge-self-reported text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">Self Reported</span>;
      case "Pending Verification":
        return <span className="badge-pending-verification text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">Pending</span>;
      case "Conflicting Information":
        return <span className="badge-conflicting-information text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5 text-rose-600" /> Conflict</span>;
      default:
        return <span className="badge-insufficient-evidence text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">Insufficient</span>;
    }
  };

  return (
    <div className="gov-card p-5 bg-white border border-slate-200">
      {/* Top Controls: Search, Filters, and Export */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, ID, employer, trade..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Quick Filter Selectors & Export */}
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="All Statuses">All Employment</option>
            <option value="Employed">Employed</option>
            <option value="Self-Employed">Self-Employed</option>
            <option value="Apprenticeship">Apprenticeship</option>
            <option value="Further Education">Further Education</option>
            <option value="Unemployed">Unemployed</option>
            <option value="Unknown">Unknown</option>
          </select>

          {onAddTrainee && (
            <button
              onClick={onAddTrainee}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Trainee</span>
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Trainees Data Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="gov-table-header">
              <th onClick={() => handleSort("id")} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">Trainee ID <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th onClick={() => handleSort("name")} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">Candidate <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th onClick={() => handleSort("district")} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">District <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-3 px-3">Programme / Trade</th>
              <th onClick={() => handleSort("certification_score")} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">Cert. Score <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th onClick={() => handleSort("employment_status")} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">Employment <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-3 px-3">Employer & Role</th>
              <th onClick={() => handleSort("current_wage")} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">Wage/mo <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-3 px-3">Retention</th>
              <th className="py-3 px-3">Verification</th>
              <th className="py-3 px-3">Last Follow-up</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {sortedTrainees.length > 0 ? (
              sortedTrainees.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onSelectTrainee(t)}
                  className="hover:bg-sky-50/40 transition cursor-pointer group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-sky-800">{t.id}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 group-hover:text-sky-900">{t.name}</div>
                    <div className="text-[10px] text-slate-400">{t.gender}, {t.age} yrs • {t.education}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">{t.district}</td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="truncate font-semibold text-slate-800">{t.programme}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{t.skills_acquired[0]}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900">{t.certification_score}%</span>
                    <div className="text-[10px] text-emerald-600 font-medium">Passed</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.employment_status === "Employed"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.employment_status === "Self-Employed"
                          ? "bg-blue-100 text-blue-800"
                          : t.employment_status === "Apprenticeship"
                          ? "bg-purple-100 text-purple-800"
                          : t.employment_status === "Unemployed"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.employment_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-[160px]">
                    <div className="truncate font-semibold text-slate-900">{t.employer || "—"}</div>
                    <div className="truncate text-[10px] text-slate-500">{t.job_role || "—"}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {t.current_wage ? `₹${t.current_wage.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[11px] font-medium text-slate-700">{t.retention_status}</span>
                  </td>
                  <td className="py-3 px-3">
                    {getVerificationBadge(t.verification_status)}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {t.last_follow_up_date || "Pending"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrainee(t);
                      }}
                      className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-sky-600 hover:text-white transition"
                      title="View Career Journey"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-500">
                  No matching records found. Try changing your filters.
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
          <span className="font-bold text-slate-900">{totalPages}</span> ({totalTrainees} total trainees)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <div className="px-2 font-mono font-bold text-slate-800">{currentPage} / {totalPages}</div>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
