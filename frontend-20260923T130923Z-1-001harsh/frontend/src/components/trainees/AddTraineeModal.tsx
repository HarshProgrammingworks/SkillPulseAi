"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { StateDistrictFields } from "@/components/geo/StateDistrictFields";

interface AddTraineeModalProps {
  programmes: string[];
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

const EMPTY = {
  name: "",
  trainee_id: "",
  age: "",
  gender: "Female",
  phone: "",
  email: "",
  district: "Pune",
  state: "Maharashtra",
  education: "ITI Technical Trade",
  institution: "",
  graduation_year: "",
  programme: "",
  training_provider: "",
  enrollment_date: "",
  completion_status: "In Progress",
  certification_status: "Pending",
  skills_acquired: "",
  skill_level: "Beginner",
  target_skills: "",
  experience_years: "0",
  employment_status: "Unknown",
  job_role: "",
  employer: "",
  current_wage: "",
  joining_date: "",
  current_location: "",
  preferred_role: "",
  preferred_sector: "",
  preferred_location: "Pune",
  willing_to_relocate: "No"
};

export const AddTraineeModal: React.FC<AddTraineeModalProps> = ({ programmes, onClose, onSubmit }) => {
  const [form, setForm] = useState({ ...EMPTY, programme: programmes.find((item) => !item.startsWith("All")) || "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.age || !form.education.trim() || !form.programme || !form.enrollment_date) {
      setError("Name, age, education, programme, and enrollment date are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        age: Number(form.age),
        experience_years: Number(form.experience_years || 0),
        current_wage: form.current_wage ? Number(form.current_wage) : null,
        skills_acquired: form.skills_acquired.split(",").map((item) => item.trim()).filter(Boolean),
        target_skills: form.target_skills.split(",").map((item) => item.trim()).filter(Boolean),
        willing_to_relocate: form.willing_to_relocate === "Yes",
        trainee_id: form.trainee_id.trim() || undefined
      });
    } catch (err: any) {
      setError(err?.message || "The trainee could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: string, label: string, type = "text", required = false) => (
    <label key={key} className="block text-[11px] font-bold text-slate-600">
      {label}{required ? " *" : ""}
      <input
        type={type}
        required={required}
        value={(form as any)[key]}
        onChange={(event) => set(key, event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-900"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4">
      <form onSubmit={submit} className="my-6 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Add Trainee</h2>
            <p className="text-xs text-slate-500">The record is stored in the same trainee dataset used by the directory.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close add trainee form" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <section>
            <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Basic information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {field("name", "Name", "text", true)}
              {field("trainee_id", "Trainee ID")}
              {field("age", "Age", "number", true)}
              <label className="text-[11px] font-bold text-slate-600">Gender
                <select value={form.gender} onChange={(event) => set("gender", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                  <option>Female</option><option>Male</option><option>Other</option>
                </select>
              </label>
              {field("phone", "Phone")}
              {field("email", "Email", "email")}
              <div className="sm:col-span-2">
                <StateDistrictFields state={form.state} district={form.district} onChange={(state, district) => { set("state", state); set("district", district); }} />
              </div>
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Education and training</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field("education", "Highest qualification", "text", true)}
              {field("institution", "Institution")}
              {field("graduation_year", "Graduation year")}
              <label className="text-[11px] font-bold text-slate-600">Training programme *
                <select required value={form.programme} onChange={(event) => set("programme", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                  {programmes.filter((item) => !item.startsWith("All")).map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              {field("training_provider", "Training provider")}
              {field("enrollment_date", "Enrollment date", "date", true)}
              <label className="text-[11px] font-bold text-slate-600">Completion status
                <select value={form.completion_status} onChange={(event) => set("completion_status", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                  <option>In Progress</option><option>Completed</option><option>Certified</option>
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">Certification
                <select value={form.certification_status} onChange={(event) => set("certification_status", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                  <option>Pending</option><option>Certified</option><option>Appeared</option>
                </select>
              </label>
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Skills, employment, and preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field("skills_acquired", "Current skills (comma separated)")}
              {field("skill_level", "Skill level")}
              {field("target_skills", "Target skills (comma separated)")}
              {field("experience_years", "Experience (years)", "number")}
              <label className="text-[11px] font-bold text-slate-600">Employment status
                <select value={form.employment_status} onChange={(event) => set("employment_status", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                  {["Unknown", "Employed", "Self-Employed", "Apprenticeship", "Further Education", "Unemployed"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              {field("job_role", "Job role")}
              {field("employer", "Employer")}
              {field("current_wage", "Salary / wage (₹ per month)", "number")}
              {field("joining_date", "Employment start date", "date")}
              {field("current_location", "Work location")}
              {field("preferred_role", "Preferred role")}
              {field("preferred_sector", "Preferred sector")}
              {field("preferred_location", "Preferred location")}
              <label className="text-[11px] font-bold text-slate-600">Willing to relocate
                <select value={form.willing_to_relocate} onChange={(event) => set("willing_to_relocate", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                  <option>No</option><option>Yes</option>
                </select>
              </label>
            </div>
          </section>
        </div>
        {error && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Cancel</button>
          <button disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save trainee"}</button>
        </div>
      </form>
    </div>
  );
};
