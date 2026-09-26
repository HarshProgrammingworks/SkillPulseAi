"use client";

import React from "react";
import { STATES, districtsFor, stateChosen } from "@/data/geography";

interface StateDistrictFieldsProps {
  state: string;
  district: string;
  onChange: (state: string, district: string) => void;
  allowAll?: boolean;
  className?: string;
}

export const StateDistrictFields: React.FC<StateDistrictFieldsProps> = ({
  state,
  district,
  onChange,
  allowAll = false,
  className = ""
}) => {
  const chosen = stateChosen(state);
  const districts = districtsFor(state);
  const selectClass = "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`}>
      <label className="text-[11px] font-bold text-slate-600">
        State
        <select
          value={state}
          onChange={(event) => {
            const next = event.target.value;
            const allowed = districtsFor(next);
            const keep = allowed.includes(district) ? district : allowAll && stateChosen(next) ? "All Districts" : "";
            onChange(next, keep);
          }}
          className={selectClass}
        >
          {allowAll ? <option>All States</option> : <option value="">Select state</option>}
          {STATES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="text-[11px] font-bold text-slate-600">
        District
        <select
          disabled={!chosen}
          value={chosen ? district : ""}
          onChange={(event) => onChange(state, event.target.value)}
          className={selectClass}
        >
          {!chosen && <option value="">Select State First</option>}
          {chosen && allowAll && <option>All Districts</option>}
          {chosen && !allowAll && !district && <option value="">Select district</option>}
          {districts.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
    </div>
  );
};
