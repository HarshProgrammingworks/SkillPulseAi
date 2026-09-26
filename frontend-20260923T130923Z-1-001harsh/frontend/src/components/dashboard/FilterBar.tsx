"use client";

import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { STATES, districtsFor, stateChosen } from "@/data/geography";

interface FilterBarProps {
  filters: {
    state: string;
    district: string;
    programme: string;
    batch: string;
    status: string;
  };
  filterOptions: {
    states: string[];
    districts: string[];
    programmes: string[];
    statuses: string[];
    batches: string[];
    time_periods?: string[];
  };
  onChangeFilter: (key: string, value: string) => void;
  onResetFilters: () => void;
  matchedCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  filterOptions,
  onChangeFilter,
  onResetFilters,
  matchedCount
}) => {
  return (
    <div className="gov-card p-4 mb-6 bg-white border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Longitudinal Intelligence Filters
            </span>
            <span className="ml-2 text-xs text-slate-500">
              (Live query updates all 9 KPIs, retention curves and ledger items)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {matchedCount !== undefined && (
            <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800 border border-sky-200">
              Active Cohort: <strong className="text-sky-950 font-black">{matchedCount}</strong> trainees
            </span>
          )}
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Select Controls Grid - 5 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* State */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">State</label>
          <select
            value={filters.state}
            onChange={(e) => onChangeFilter("state", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option>All States</option>
            {STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">District</label>
          <select
            value={filters.district}
            onChange={(e) => onChangeFilter("district", e.target.value)}
            className={`w-full rounded-lg border py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none ${
              filters.district !== "All Districts"
                ? "border-sky-500 bg-sky-50/50 font-bold text-sky-900"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <option>All Districts</option>
            {districtsFor(filters.state).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Training Programme */}
        <div className="col-span-2 lg:col-span-1">
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Programme</label>
          <select
            value={filters.programme}
            onChange={(e) => onChangeFilter("programme", e.target.value)}
            className="w-full truncate rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            {filterOptions.programmes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Batch */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Cohort Batch</label>
          <select
            value={filters.batch}
            onChange={(e) => onChangeFilter("batch", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            {filterOptions.batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Status */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Employment</label>
          <select
            value={filters.status}
            onChange={(e) => onChangeFilter("status", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            {filterOptions.statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
