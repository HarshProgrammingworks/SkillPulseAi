"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Award,
  ChevronRight,
  Info,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Briefcase,
  MapPin,
  Search,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Filter,
  RotateCcw,
  Building2,
  UserCheck,
  DollarSign,
  Activity,
  Compass,
  Send,
  Sparkles,
  MoveRight,
  ChevronDown,
  Check
} from "lucide-react";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";
import { api } from "@/lib/api";
import { STATES, GEOGRAPHY, districtsFor, stateChosen } from "@/data/geography";
import { OutcomeEngineView } from "./OutcomeEngineView";
import { SkillRelevanceView } from "./SkillRelevanceView";

// Interface preserving existing prop
interface SkillGapAnalysisProps {
  onAskAiWhyGap: (skillName: string) => void;
}

// 5–6 Well-represented prototype skills aligned with state curriculum and economic data
const PROTOTYPE_SKILLS = [
  "EV Technician",
  "Solar Technician",
  "Electrician",
  "Field Technician",
  "Retail Associate",
  "Data Entry Operator"
] as const;

type PrototypeSkill = (typeof PROTOTYPE_SKILLS)[number];

interface SkillIntelligenceRecord {
  skill: PrototypeSkill;
  sector: string;
  occupation: string;
  state: string;
  district: string;
  trainingCentre: string;
  supply: number;
  certified: number;
  demand: number;
  gap: number; // demand - supply
  status: "Shortage" | "Balanced" | "Surplus";
  employmentRate: number; // percentage
  retention6m: number; // percentage
  initialWage: number;
  currentWage: number;
  demandTrend: string;
  demandTrendVal: number; // YoY percentage
  trendDir: "up" | "down" | "flat";
  relevanceRate: number; // percentage
  previousDemand: number;
  centresCount: number;
  trainingCapacity: number;
  curriculumSkills: string[];
  employerDemanded: string[];
  alignmentScore: number;
  missingSkills: string[];
  mobility: {
    localShare: number;
    interDistrictShare: number;
    interStateShare: number;
    destinations: { name: string; share: number; avgWage: number }[];
  };
  quarterlyDemand: { quarter: string; demand: number }[];
}

// Comprehensive grounded data model representing the 3 prototype states & districts
const BASE_SKILL_RECORDS: SkillIntelligenceRecord[] = [
  // PUNE, MAHARASHTRA
  {
    skill: "EV Technician",
    sector: "EV & Clean Mobility",
    occupation: "EV Powertrain & Battery Diagnostics Specialist",
    state: "Maharashtra",
    district: "Pune",
    trainingCentre: "Tata-STRIVE Academy Hinjewadi",
    supply: 820,
    certified: 710,
    demand: 1850,
    gap: 1030,
    status: "Shortage",
    employmentRate: 86.4,
    retention6m: 76.2,
    initialWage: 18500,
    currentWage: 25400,
    demandTrend: "+36% YoY",
    demandTrendVal: 36,
    trendDir: "up",
    relevanceRate: 94.2,
    previousDemand: 1360,
    centresCount: 4,
    trainingCapacity: 950,
    curriculumSkills: ["Battery Diagnostics", "High Voltage Safety", "Wiring Harness", "Motor Servicing"],
    employerDemanded: ["Battery Diagnostics", "High Voltage Safety", "BMS Telematics", "Thermal Management"],
    alignmentScore: 78,
    missingSkills: ["BMS Telematics Integration", "Thermal Runaway Safety Protocols"],
    mobility: {
      localShare: 72,
      interDistrictShare: 18,
      interStateShare: 10,
      destinations: [
        { name: "Local Pune Industrial Cluster (Chakan/Bhosari)", share: 72, avgWage: 25400 },
        { name: "Nagpur Multi-Modal Logistics Hub", share: 18, avgWage: 27800 },
        { name: "Nashik Industrial Belt", share: 10, avgWage: 20500 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 1360 },
      { quarter: "Q2 2024", demand: 1510 },
      { quarter: "Q3 2024", demand: 1690 },
      { quarter: "Q4 2024", demand: 1850 }
    ]
  },
  {
    skill: "Electrician",
    sector: "Electrical & Power",
    occupation: "Industrial Switchgear & Substation Electrician",
    state: "Maharashtra",
    district: "Pune",
    trainingCentre: "Bhosari Multi-Skill Institute",
    supply: 640,
    certified: 550,
    demand: 1200,
    gap: 560,
    status: "Shortage",
    employmentRate: 78.0,
    retention6m: 74.5,
    initialWage: 16000,
    currentWage: 22000,
    demandTrend: "+24% YoY",
    demandTrendVal: 24,
    trendDir: "up",
    relevanceRate: 88.5,
    previousDemand: 968,
    centresCount: 3,
    trainingCapacity: 750,
    curriculumSkills: ["House Wiring", "Conduit Laying", "Breaker Panel Installation", "Testing"],
    employerDemanded: ["House Wiring", "Commercial Switchgear", "PLC Automation Basics", "Earthing"],
    alignmentScore: 80,
    missingSkills: ["Industrial Switchgear Operation", "PLC Wiring Basics"],
    mobility: {
      localShare: 76,
      interDistrictShare: 16,
      interStateShare: 8,
      destinations: [
        { name: "Local Pune Cluster", share: 76, avgWage: 22000 },
        { name: "Nashik Industrial Belt", share: 16, avgWage: 19500 },
        { name: "Other Maharashtra Nodes", share: 8, avgWage: 18000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 968 },
      { quarter: "Q2 2024", demand: 1040 },
      { quarter: "Q3 2024", demand: 1120 },
      { quarter: "Q4 2024", demand: 1200 }
    ]
  },
  {
    skill: "Data Entry Operator",
    sector: "IT & Digital Services",
    occupation: "Office Automation & CRM Data Operator",
    state: "Maharashtra",
    district: "Pune",
    trainingCentre: "Chakan Automotive Skilling Centre",
    supply: 980,
    certified: 890,
    demand: 1600,
    gap: 620,
    status: "Shortage",
    employmentRate: 69.5,
    retention6m: 68.0,
    initialWage: 14500,
    currentWage: 18500,
    demandTrend: "-4% YoY",
    demandTrendVal: -4,
    trendDir: "down",
    relevanceRate: 72.0,
    previousDemand: 1670,
    centresCount: 5,
    trainingCapacity: 1100,
    curriculumSkills: ["MS Office & Excel", "Typing (35 WPM)", "Database Entry", "Documentation"],
    employerDemanded: ["SQL Queries", "CRM Data Validation", "Advanced Excel & BI", "Data Cleaning"],
    alignmentScore: 74,
    missingSkills: ["CRM Automation", "Data Cleaning & BI Dashboards"],
    mobility: {
      localShare: 84,
      interDistrictShare: 12,
      interStateShare: 4,
      destinations: [
        { name: "Local Pune IT Corridor", share: 84, avgWage: 18500 },
        { name: "Nagpur Digital Operations", share: 12, avgWage: 17200 },
        { name: "Other Nodes", share: 4, avgWage: 16000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 1670 },
      { quarter: "Q2 2024", demand: 1640 },
      { quarter: "Q3 2024", demand: 1620 },
      { quarter: "Q4 2024", demand: 1600 }
    ]
  },

  // NASHIK, MAHARASHTRA
  {
    skill: "Electrician",
    sector: "Electrical & Power",
    occupation: "Industrial Plant Maintenance Electrician",
    state: "Maharashtra",
    district: "Nashik",
    trainingCentre: "Satpur Industrial Training Institute",
    supply: 510,
    certified: 430,
    demand: 920,
    gap: 410,
    status: "Shortage",
    employmentRate: 71.2,
    retention6m: 70.1,
    initialWage: 15500,
    currentWage: 20500,
    demandTrend: "+21% YoY",
    demandTrendVal: 21,
    trendDir: "up",
    relevanceRate: 85.0,
    previousDemand: 760,
    centresCount: 3,
    trainingCapacity: 600,
    curriculumSkills: ["House Wiring", "Conduit Laying", "Motor Starters", "Testing"],
    employerDemanded: ["Industrial Wiring", "Motor Control Panels", "Earthing Systems"],
    alignmentScore: 82,
    missingSkills: ["Panel Instrumentation"],
    mobility: {
      localShare: 60,
      interDistrictShare: 22,
      interStateShare: 18,
      destinations: [
        { name: "Local Nashik Cluster", share: 60, avgWage: 20500 },
        { name: "Pune Industrial Hub", share: 22, avgWage: 24000 },
        { name: "Nagpur Corridor", share: 18, avgWage: 22000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 760 },
      { quarter: "Q2 2024", demand: 810 },
      { quarter: "Q3 2024", demand: 870 },
      { quarter: "Q4 2024", demand: 920 }
    ]
  },
  {
    skill: "Solar Technician",
    sector: "Renewable Energy",
    occupation: "Solar PV Rooftop & Inverter Technician",
    state: "Maharashtra",
    district: "Nashik",
    trainingCentre: "Ambad Precision Skilling Hub",
    supply: 390,
    certified: 330,
    demand: 680,
    gap: 290,
    status: "Shortage",
    employmentRate: 74.0,
    retention6m: 72.0,
    initialWage: 16000,
    currentWage: 21200,
    demandTrend: "+34% YoY",
    demandTrendVal: 34,
    trendDir: "up",
    relevanceRate: 91.0,
    previousDemand: 507,
    centresCount: 2,
    trainingCapacity: 450,
    curriculumSkills: ["Solar PV Assembly", "Inverter Wiring", "Structure Mounting"],
    employerDemanded: ["Grid Sync", "Micro-inverters", "Net Metering"],
    alignmentScore: 80,
    missingSkills: ["Net Metering Protocols"],
    mobility: {
      localShare: 65,
      interDistrictShare: 20,
      interStateShare: 15,
      destinations: [
        { name: "Local Nashik Agro-Solar", share: 65, avgWage: 21200 },
        { name: "Pune Clean Tech", share: 20, avgWage: 23500 },
        { name: "Inter-State Projects", share: 15, avgWage: 22000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 507 },
      { quarter: "Q2 2024", demand: 560 },
      { quarter: "Q3 2024", demand: 620 },
      { quarter: "Q4 2024", demand: 680 }
    ]
  },
  {
    skill: "Field Technician",
    sector: "Field Operations & Hardware",
    occupation: "Telecom & Broadband Network Technician",
    state: "Maharashtra",
    district: "Nashik",
    trainingCentre: "Satpur Industrial Training Institute",
    supply: 480,
    certified: 410,
    demand: 750,
    gap: 270,
    status: "Shortage",
    employmentRate: 75.5,
    retention6m: 73.0,
    initialWage: 15000,
    currentWage: 19800,
    demandTrend: "+19% YoY",
    demandTrendVal: 19,
    trendDir: "up",
    relevanceRate: 86.0,
    previousDemand: 630,
    centresCount: 2,
    trainingCapacity: 550,
    curriculumSkills: ["Broadband Installation", "Fiber Splicing", "Troubleshooting"],
    employerDemanded: ["Fiber Splicing", "OTDR Testing", "CCTV Networks"],
    alignmentScore: 84,
    missingSkills: ["OTDR Fiber Testing"],
    mobility: {
      localShare: 68,
      interDistrictShare: 20,
      interStateShare: 12,
      destinations: [
        { name: "Local Nashik", share: 68, avgWage: 19800 },
        { name: "Pune Network Hub", share: 20, avgWage: 22500 },
        { name: "Others", share: 12, avgWage: 18500 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 630 },
      { quarter: "Q2 2024", demand: 670 },
      { quarter: "Q3 2024", demand: 710 },
      { quarter: "Q4 2024", demand: 750 }
    ]
  },

  // NAGPUR, MAHARASHTRA
  {
    skill: "Data Entry Operator",
    sector: "IT & Digital Services",
    occupation: "Digital Data & Logistics Operator",
    state: "Maharashtra",
    district: "Nagpur",
    trainingCentre: "MIHAN Logistics & Telecom Academy",
    supply: 1100,
    certified: 980,
    demand: 1850,
    gap: 750,
    status: "Shortage",
    employmentRate: 76.5,
    retention6m: 74.2,
    initialWage: 15000,
    currentWage: 27800,
    demandTrend: "-2% YoY",
    demandTrendVal: -2,
    trendDir: "down",
    relevanceRate: 78.0,
    previousDemand: 1890,
    centresCount: 4,
    trainingCapacity: 1250,
    curriculumSkills: ["Office Excel", "Typing Speed", "Documentation", "ERP Entry"],
    employerDemanded: ["WMS Logistics Entry", "CRM Validation", "Advanced Excel"],
    alignmentScore: 76,
    missingSkills: ["Warehouse Management Systems (WMS)"],
    mobility: {
      localShare: 78,
      interDistrictShare: 15,
      interStateShare: 7,
      destinations: [
        { name: "Local Nagpur MMR Logistics", share: 78, avgWage: 27800 },
        { name: "Pune Tech Corridor", share: 15, avgWage: 26000 },
        { name: "Nashik Logistics", share: 7, avgWage: 21000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 1890 },
      { quarter: "Q2 2024", demand: 1870 },
      { quarter: "Q3 2024", demand: 1860 },
      { quarter: "Q4 2024", demand: 1850 }
    ]
  },
  {
    skill: "Retail Associate",
    sector: "Retail & E-commerce",
    occupation: "Store Merchandising & POS Specialist",
    state: "Maharashtra",
    district: "Nagpur",
    trainingCentre: "Vidarbha Skill Development Hub",
    supply: 980,
    certified: 890,
    demand: 1350,
    gap: 370,
    status: "Shortage",
    employmentRate: 73.0,
    retention6m: 71.0,
    initialWage: 14000,
    currentWage: 18500,
    demandTrend: "+16% YoY",
    demandTrendVal: 16,
    trendDir: "up",
    relevanceRate: 82.0,
    previousDemand: 1160,
    centresCount: 3,
    trainingCapacity: 1050,
    curriculumSkills: ["Customer Greeting", "Cash Counter", "POS Billing"],
    employerDemanded: ["Omnichannel POS", "Inventory Barcode Scanning"],
    alignmentScore: 86,
    missingSkills: ["Omnichannel Fulfillment"],
    mobility: {
      localShare: 82,
      interDistrictShare: 12,
      interStateShare: 6,
      destinations: [
        { name: "Local Nagpur Retail", share: 82, avgWage: 18500 },
        { name: "Pune Commercial Hubs", share: 12, avgWage: 20000 },
        { name: "Others", share: 6, avgWage: 17000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 1160 },
      { quarter: "Q2 2024", demand: 1220 },
      { quarter: "Q3 2024", demand: 1290 },
      { quarter: "Q4 2024", demand: 1350 }
    ]
  },

  // MUZAFFARPUR, BIHAR
  {
    skill: "Solar Technician",
    sector: "Renewable Energy",
    occupation: "Solar PV Array & Rooftop Installer",
    state: "Bihar",
    district: "Muzaffarpur",
    trainingCentre: "Patliputra Vocational Training Academy - Muzaffarpur",
    supply: 520,
    certified: 440,
    demand: 1150,
    gap: 630,
    status: "Shortage",
    employmentRate: 72.8,
    retention6m: 71.5,
    initialWage: 14500,
    currentWage: 21200,
    demandTrend: "+38% YoY",
    demandTrendVal: 38,
    trendDir: "up",
    relevanceRate: 92.0,
    previousDemand: 833,
    centresCount: 3,
    trainingCapacity: 600,
    curriculumSkills: ["Solar PV Assembly", "Inverter Wiring", "Earthing"],
    employerDemanded: ["Commercial Rooftop Assembly", "Micro-inverters", "Solar Pumping"],
    alignmentScore: 82,
    missingSkills: ["Solar Agricultural Pumping Stations"],
    mobility: {
      localShare: 65,
      interDistrictShare: 25,
      interStateShare: 10,
      destinations: [
        { name: "Local Muzaffarpur Hub", share: 65, avgWage: 21200 },
        { name: "Patna Enterprise Corridor", share: 25, avgWage: 24500 },
        { name: "Inter-State Industrial Zones", share: 10, avgWage: 23000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 833 },
      { quarter: "Q2 2024", demand: 930 },
      { quarter: "Q3 2024", demand: 1040 },
      { quarter: "Q4 2024", demand: 1150 }
    ]
  },
  {
    skill: "Electrician",
    sector: "Electrical & Power",
    occupation: "Power Distribution Electrician",
    state: "Bihar",
    district: "Muzaffarpur",
    trainingCentre: "Mithila Solar & Electrical Centre",
    supply: 490,
    certified: 410,
    demand: 950,
    gap: 460,
    status: "Shortage",
    employmentRate: 73.5,
    retention6m: 70.8,
    initialWage: 14000,
    currentWage: 19500,
    demandTrend: "+25% YoY",
    demandTrendVal: 25,
    trendDir: "up",
    relevanceRate: 87.0,
    previousDemand: 760,
    centresCount: 2,
    trainingCapacity: 550,
    curriculumSkills: ["House Wiring", "Conduit Laying", "Testing"],
    employerDemanded: ["Substation Wiring", "3-Phase Motor Control"],
    alignmentScore: 78,
    missingSkills: ["Rural Feeder Substation Safety"],
    mobility: {
      localShare: 68,
      interDistrictShare: 22,
      interStateShare: 10,
      destinations: [
        { name: "Local Muzaffarpur", share: 68, avgWage: 19500 },
        { name: "Patna Urban Cluster", share: 22, avgWage: 23000 },
        { name: "Others", share: 10, avgWage: 20000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 760 },
      { quarter: "Q2 2024", demand: 820 },
      { quarter: "Q3 2024", demand: 885 },
      { quarter: "Q4 2024", demand: 950 }
    ]
  },

  // PATNA, BIHAR
  {
    skill: "Data Entry Operator",
    sector: "IT & Digital Services",
    occupation: "Data Operations Specialist",
    state: "Bihar",
    district: "Patna",
    trainingCentre: "Patna Skill Development Centre",
    supply: 950,
    certified: 840,
    demand: 1700,
    gap: 750,
    status: "Shortage",
    employmentRate: 77.2,
    retention6m: 75.0,
    initialWage: 16000,
    currentWage: 24800,
    demandTrend: "+8% YoY",
    demandTrendVal: 8,
    trendDir: "up",
    relevanceRate: 81.5,
    previousDemand: 1574,
    centresCount: 5,
    trainingCapacity: 1100,
    curriculumSkills: ["MS Office", "Typing (Hindi/English)", "Data Entry"],
    employerDemanded: ["Govt E-Portal Submissions", "CRM Data Validation", "Advanced Excel"],
    alignmentScore: 80,
    missingSkills: ["Government E-Governance Portals"],
    mobility: {
      localShare: 74,
      interDistrictShare: 14,
      interStateShare: 12,
      destinations: [
        { name: "Local Patna Enterprise Hub", share: 74, avgWage: 24800 },
        { name: "Gaya Growth Corridor", share: 14, avgWage: 20000 },
        { name: "Muzaffarpur Regional Centre", share: 12, avgWage: 19500 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 1574 },
      { quarter: "Q2 2024", demand: 1610 },
      { quarter: "Q3 2024", demand: 1655 },
      { quarter: "Q4 2024", demand: 1700 }
    ]
  },
  {
    skill: "EV Technician",
    sector: "EV & Clean Mobility",
    occupation: "E-Rickshaw & Fleet Diagnostics Technician",
    state: "Bihar",
    district: "Patna",
    trainingCentre: "Danapur Tech Institute",
    supply: 850,
    certified: 760,
    demand: 1400,
    gap: 550,
    status: "Shortage",
    employmentRate: 81.0,
    retention6m: 78.5,
    initialWage: 17500,
    currentWage: 23500,
    demandTrend: "+42% YoY",
    demandTrendVal: 42,
    trendDir: "up",
    relevanceRate: 95.0,
    previousDemand: 986,
    centresCount: 3,
    trainingCapacity: 950,
    curriculumSkills: ["Battery Servicing", "Controller Testing", "Motor Wiring"],
    employerDemanded: ["Lithium Pack Diagnostics", "Regen Braking Systems", "Charging Stations"],
    alignmentScore: 80,
    missingSkills: ["Fast-Charging Station Diagnostics"],
    mobility: {
      localShare: 70,
      interDistrictShare: 18,
      interStateShare: 12,
      destinations: [
        { name: "Local Patna EV Fleets", share: 70, avgWage: 23500 },
        { name: "Muzaffarpur Node", share: 18, avgWage: 21000 },
        { name: "Inter-State Industrial", share: 12, avgWage: 24500 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 986 },
      { quarter: "Q2 2024", demand: 1110 },
      { quarter: "Q3 2024", demand: 1250 },
      { quarter: "Q4 2024", demand: 1400 }
    ]
  },

  // LUCKNOW, UTTAR PRADESH
  {
    skill: "Data Entry Operator",
    sector: "IT & Digital Services",
    occupation: "Data Operations & ERP Specialist",
    state: "Uttar Pradesh",
    district: "Lucknow",
    trainingCentre: "Awadh Technical Training Centre",
    supply: 1020,
    certified: 910,
    demand: 1800,
    gap: 780,
    status: "Shortage",
    employmentRate: 77.9,
    retention6m: 75.8,
    initialWage: 16500,
    currentWage: 26200,
    demandTrend: "+5% YoY",
    demandTrendVal: 5,
    trendDir: "up",
    relevanceRate: 80.0,
    previousDemand: 1714,
    centresCount: 5,
    trainingCapacity: 1200,
    curriculumSkills: ["MS Office", "Typing", "Database Entry"],
    employerDemanded: ["ERP Billing", "Advanced Excel & Macros", "CRM Data Validation"],
    alignmentScore: 78,
    missingSkills: ["ERP Billing Integrations"],
    mobility: {
      localShare: 75,
      interDistrictShare: 15,
      interStateShare: 10,
      destinations: [
        { name: "Local Lucknow Cluster", share: 75, avgWage: 26200 },
        { name: "Prayagraj Corridor", share: 15, avgWage: 22000 },
        { name: "Varanasi Hub", share: 10, avgWage: 21500 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 1714 },
      { quarter: "Q2 2024", demand: 1740 },
      { quarter: "Q3 2024", demand: 1770 },
      { quarter: "Q4 2024", demand: 1800 }
    ]
  },
  {
    skill: "EV Technician",
    sector: "EV & Clean Mobility",
    occupation: "EV Powertrain Technician",
    state: "Uttar Pradesh",
    district: "Lucknow",
    trainingCentre: "Gomti Digital Skilling Academy",
    supply: 780,
    certified: 690,
    demand: 1400,
    gap: 620,
    status: "Shortage",
    employmentRate: 83.2,
    retention6m: 79.0,
    initialWage: 18000,
    currentWage: 24500,
    demandTrend: "+39% YoY",
    demandTrendVal: 39,
    trendDir: "up",
    relevanceRate: 94.0,
    previousDemand: 1007,
    centresCount: 3,
    trainingCapacity: 900,
    curriculumSkills: ["Battery Packs", "High Voltage Safety", "Wiring"],
    employerDemanded: ["High Voltage Isolation", "Telematics & BMS", "Motor Inverters"],
    alignmentScore: 79,
    missingSkills: ["BMS Telematics Protocols"],
    mobility: {
      localShare: 72,
      interDistrictShare: 18,
      interStateShare: 10,
      destinations: [
        { name: "Local Lucknow EV Belt", share: 72, avgWage: 24500 },
        { name: "Varanasi Logistics", share: 18, avgWage: 22500 },
        { name: "National Capital Region", share: 10, avgWage: 28000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 1007 },
      { quarter: "Q2 2024", demand: 1125 },
      { quarter: "Q3 2024", demand: 1260 },
      { quarter: "Q4 2024", demand: 1400 }
    ]
  },

  // VARANASI, UTTAR PRADESH
  {
    skill: "Electrician",
    sector: "Electrical & Power",
    occupation: "Power Electrician & Switchgear Operator",
    state: "Uttar Pradesh",
    district: "Varanasi",
    trainingCentre: "Kashi Industrial & Solar Training Academy",
    supply: 680,
    certified: 580,
    demand: 1250,
    gap: 570,
    status: "Shortage",
    employmentRate: 73.5,
    retention6m: 72.1,
    initialWage: 15000,
    currentWage: 22400,
    demandTrend: "+24% YoY",
    demandTrendVal: 24,
    trendDir: "up",
    relevanceRate: 88.0,
    previousDemand: 1008,
    centresCount: 3,
    trainingCapacity: 750,
    curriculumSkills: ["Domestic Wiring", "Conduit Laying", "Earthing"],
    employerDemanded: ["Industrial Switchgear", "Power Distribution", "Testing"],
    alignmentScore: 80,
    missingSkills: ["Industrial Switchgear"],
    mobility: {
      localShare: 68,
      interDistrictShare: 20,
      interStateShare: 12,
      destinations: [
        { name: "Local Varanasi Cluster", share: 68, avgWage: 22400 },
        { name: "Prayagraj Engineering Zone", share: 20, avgWage: 21800 },
        { name: "Lucknow Metro Hub", share: 12, avgWage: 25000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 1008 },
      { quarter: "Q2 2024", demand: 1080 },
      { quarter: "Q3 2024", demand: 1160 },
      { quarter: "Q4 2024", demand: 1250 }
    ]
  },
  {
    skill: "Solar Technician",
    sector: "Renewable Energy",
    occupation: "Solar Smart Grid Installer",
    state: "Uttar Pradesh",
    district: "Varanasi",
    trainingCentre: "Kashi Industrial & Solar Training Academy",
    supply: 580,
    certified: 500,
    demand: 1000,
    gap: 420,
    status: "Shortage",
    employmentRate: 75.0,
    retention6m: 73.0,
    initialWage: 16000,
    currentWage: 21500,
    demandTrend: "+32% YoY",
    demandTrendVal: 32,
    trendDir: "up",
    relevanceRate: 91.0,
    previousDemand: 757,
    centresCount: 2,
    trainingCapacity: 650,
    curriculumSkills: ["Solar PV Mounting", "Inverter Wiring", "Earthing"],
    employerDemanded: ["Smart Grid Inverters", "Net Metering", "Array Troubleshooting"],
    alignmentScore: 82,
    missingSkills: ["Smart Grid Inverters"],
    mobility: {
      localShare: 66,
      interDistrictShare: 22,
      interStateShare: 12,
      destinations: [
        { name: "Local Varanasi Smart City", share: 66, avgWage: 21500 },
        { name: "Prayagraj Hub", share: 22, avgWage: 21800 },
        { name: "Lucknow Zone", share: 12, avgWage: 23500 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 757 },
      { quarter: "Q2 2024", demand: 830 },
      { quarter: "Q3 2024", demand: 910 },
      { quarter: "Q4 2024", demand: 1000 }
    ]
  },

  // PRAYAGRAJ, UTTAR PRADESH
  {
    skill: "Electrician",
    sector: "Electrical & Power",
    occupation: "Industrial Electrician",
    state: "Uttar Pradesh",
    district: "Prayagraj",
    trainingCentre: "Naini Industrial Training Academy",
    supply: 620,
    certified: 530,
    demand: 1100,
    gap: 480,
    status: "Shortage",
    employmentRate: 72.1,
    retention6m: 71.0,
    initialWage: 15500,
    currentWage: 21800,
    demandTrend: "+23% YoY",
    demandTrendVal: 23,
    trendDir: "up",
    relevanceRate: 86.5,
    previousDemand: 894,
    centresCount: 3,
    trainingCapacity: 700,
    curriculumSkills: ["House Wiring", "Conduit Laying", "Motor Starters"],
    employerDemanded: ["Industrial Wiring", "Motor Control Panels", "Substation Earthing"],
    alignmentScore: 81,
    missingSkills: ["Motor Control Panels"],
    mobility: {
      localShare: 66,
      interDistrictShare: 22,
      interStateShare: 12,
      destinations: [
        { name: "Local Prayagraj Hub", share: 66, avgWage: 21800 },
        { name: "Varanasi Industrial Belt", share: 22, avgWage: 22400 },
        { name: "Lucknow Growth Node", share: 12, avgWage: 24000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 894 },
      { quarter: "Q2 2024", demand: 955 },
      { quarter: "Q3 2024", demand: 1025 },
      { quarter: "Q4 2024", demand: 1100 }
    ]
  },
  {
    skill: "Field Technician",
    sector: "Field Operations & Hardware",
    occupation: "Field Hardware & Telecom Specialist",
    state: "Uttar Pradesh",
    district: "Prayagraj",
    trainingCentre: "Sangam Renewable Energy Centre",
    supply: 570,
    certified: 490,
    demand: 980,
    gap: 410,
    status: "Shortage",
    employmentRate: 74.0,
    retention6m: 71.5,
    initialWage: 15000,
    currentWage: 20200,
    demandTrend: "+20% YoY",
    demandTrendVal: 20,
    trendDir: "up",
    relevanceRate: 85.0,
    previousDemand: 816,
    centresCount: 2,
    trainingCapacity: 620,
    curriculumSkills: ["Broadband Setup", "Cable Crimping", "CCTV Installation"],
    employerDemanded: ["Fiber Optic Splicing", "OTDR Diagnostics", "IP Cameras"],
    alignmentScore: 83,
    missingSkills: ["OTDR Fiber Testing"],
    mobility: {
      localShare: 70,
      interDistrictShare: 18,
      interStateShare: 12,
      destinations: [
        { name: "Local Prayagraj", share: 70, avgWage: 20200 },
        { name: "Lucknow Enterprise Hub", share: 18, avgWage: 23000 },
        { name: "Others", share: 12, avgWage: 19000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 816 },
      { quarter: "Q2 2024", demand: 865 },
      { quarter: "Q3 2024", demand: 920 },
      { quarter: "Q4 2024", demand: 980 }
    ]
  },

  // STATEWIDE BALANCED / SURPLUS CASES (Ensuring realistic supply > demand scenarios)
  {
    skill: "Retail Associate",
    sector: "Retail & E-commerce",
    occupation: "Retail Store Customer Associate",
    state: "Bihar",
    district: "Gaya",
    trainingCentre: "Magadh Vocational Training Hub",
    supply: 650,
    certified: 580,
    demand: 620,
    gap: -30,
    status: "Balanced",
    employmentRate: 70.4,
    retention6m: 69.8,
    initialWage: 13500,
    currentWage: 17200,
    demandTrend: "+4% YoY",
    demandTrendVal: 4,
    trendDir: "up",
    relevanceRate: 76.0,
    previousDemand: 596,
    centresCount: 2,
    trainingCapacity: 700,
    curriculumSkills: ["Customer Greeting", "Cash Counter", "POS Billing"],
    employerDemanded: ["POS Billing", "Inventory Handling", "Customer Care"],
    alignmentScore: 89,
    missingSkills: ["Digital Wallet Reconciliation"],
    mobility: {
      localShare: 62,
      interDistrictShare: 26,
      interStateShare: 12,
      destinations: [
        { name: "Local Gaya Corridor", share: 62, avgWage: 17200 },
        { name: "Patna Enterprise Hub", share: 26, avgWage: 21000 },
        { name: "Varanasi Inter-State Node", share: 12, avgWage: 19500 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 596 },
      { quarter: "Q2 2024", demand: 605 },
      { quarter: "Q3 2024", demand: 612 },
      { quarter: "Q4 2024", demand: 620 }
    ]
  },
  {
    skill: "Data Entry Operator",
    sector: "IT & Digital Services",
    occupation: "Basic Clerical & Typist",
    state: "Bihar",
    district: "Gaya",
    trainingCentre: "Bodh Gaya Clean Tech Centre",
    supply: 720,
    certified: 640,
    demand: 520,
    gap: -200,
    status: "Surplus",
    employmentRate: 64.2,
    retention6m: 61.5,
    initialWage: 12500,
    currentWage: 15200,
    demandTrend: "-12% YoY",
    demandTrendVal: -12,
    trendDir: "down",
    relevanceRate: 68.0,
    previousDemand: 590,
    centresCount: 3,
    trainingCapacity: 800,
    curriculumSkills: ["Typing (30 WPM)", "MS Word", "Data Entry"],
    employerDemanded: ["Basic Office Operations", "Spreadsheet Entry"],
    alignmentScore: 70,
    missingSkills: ["Modern Cloud Spreadsheet Collaboration"],
    mobility: {
      localShare: 58,
      interDistrictShare: 30,
      interStateShare: 12,
      destinations: [
        { name: "Local Gaya Office Sector", share: 58, avgWage: 15200 },
        { name: "Patna Services Hub", share: 30, avgWage: 18500 },
        { name: "Others", share: 12, avgWage: 16000 }
      ]
    },
    quarterlyDemand: [
      { quarter: "Q1 2024", demand: 590 },
      { quarter: "Q2 2024", demand: 565 },
      { quarter: "Q3 2024", demand: 540 },
      { quarter: "Q4 2024", demand: 520 }
    ]
  }
];

export const SkillGapAnalysis: React.FC<SkillGapAnalysisProps> = ({ onAskAiWhyGap }) => {
  // Independent Filter State (Requirement 20)
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All Districts");
  const [selectedCentre, setSelectedCentre] = useState<string>("All Centres");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("All Skills");
  const [selectedEmploymentStatus, setSelectedEmploymentStatus] = useState<string>("All Statuses");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Last 6 Months"); // Dropdown only, no horizontal scrubber

  // Navigation tab within Skill Intelligence (Requirement 28)
  const [activeTab, setActiveTab] = useState<
    "overview" | "geography" | "mobility" | "pipeline" | "relevance" | "trends" | "wages" | "ai"
  >("overview");

  // Selection state for drill-down inspection
  const [inspectedSkill, setInspectedSkill] = useState<PrototypeSkill>("EV Technician");
  const [selectedMapDistrict, setSelectedMapDistrict] = useState<string>("Pune");
  const [geoMetric, setGeoMetric] = useState<"gap" | "demand" | "supply" | "conversion" | "volume">("gap");
  const [sortOption, setSortOption] = useState<
    "shortage" | "surplus" | "conversion_high" | "conversion_low" | "demand_high" | "supply_high"
  >("shortage");

  // Natural language query input state (Requirement 18)
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Available districts when state is chosen
  const availableDistricts = useMemo(() => {
    if (!stateChosen(selectedState)) {
      return ["All Districts", ...Object.values(GEOGRAPHY).flat()];
    }
    return ["All Districts", ...districtsFor(selectedState)];
  }, [selectedState]);

  // Available centres based on state and district
  const availableCentres = useMemo(() => {
    let filtered = BASE_SKILL_RECORDS;
    if (stateChosen(selectedState)) {
      filtered = filtered.filter((r) => r.state === selectedState);
    }
    if (selectedDistrict !== "All Districts") {
      filtered = filtered.filter((r) => r.district === selectedDistrict);
    }
    const centres = Array.from(new Set(filtered.map((r) => r.trainingCentre)));
    return ["All Centres", ...centres.sort()];
  }, [selectedState, selectedDistrict]);

  // Reset dependent filters when parent changes
  useEffect(() => {
    if (selectedDistrict !== "All Districts" && !availableDistricts.includes(selectedDistrict)) {
      setSelectedDistrict("All Districts");
    }
  }, [selectedState, availableDistricts, selectedDistrict]);

  useEffect(() => {
    if (selectedCentre !== "All Centres" && !availableCentres.includes(selectedCentre)) {
      setSelectedCentre("All Centres");
    }
  }, [selectedDistrict, availableCentres, selectedCentre]);

  // Main filtered dataset (Requirements 19 & 25: All charts derive from the same data source)
  const filteredRecords = useMemo(() => {
    return BASE_SKILL_RECORDS.filter((item) => {
      if (stateChosen(selectedState) && item.state !== selectedState) return false;
      if (selectedDistrict !== "All Districts" && item.district !== selectedDistrict) return false;
      if (selectedCentre !== "All Centres" && item.trainingCentre !== selectedCentre) return false;
      if (selectedSkillFilter !== "All Skills" && item.skill !== selectedSkillFilter) return false;
      return true;
    });
  }, [selectedState, selectedDistrict, selectedCentre, selectedSkillFilter]);

  // Aggregated skill level data for summary and comparison charts
  const aggregatedSkills = useMemo(() => {
    const map = new Map<
      PrototypeSkill,
      {
        skill: PrototypeSkill;
        sector: string;
        supply: number;
        certified: number;
        demand: number;
        gap: number;
        avgEmploymentRate: number;
        avgRetention6m: number;
        avgInitialWage: number;
        avgCurrentWage: number;
        count: number;
        status: "Shortage" | "Balanced" | "Surplus";
        demandTrendVal: number;
        relevanceRate: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const existing = map.get(r.skill);
      if (!existing) {
        map.set(r.skill, {
          skill: r.skill,
          sector: r.sector,
          supply: r.supply,
          certified: r.certified,
          demand: r.demand,
          gap: r.gap,
          avgEmploymentRate: r.employmentRate,
          avgRetention6m: r.retention6m,
          avgInitialWage: r.initialWage,
          avgCurrentWage: r.currentWage,
          count: 1,
          status: r.status,
          demandTrendVal: r.demandTrendVal,
          relevanceRate: r.relevanceRate
        });
      } else {
        existing.supply += r.supply;
        existing.certified += r.certified;
        existing.demand += r.demand;
        existing.gap = existing.demand - existing.supply;
        existing.avgEmploymentRate += r.employmentRate;
        existing.avgRetention6m += r.retention6m;
        existing.avgInitialWage += r.initialWage;
        existing.avgCurrentWage += r.currentWage;
        existing.count += 1;
        // Re-evaluate aggregated status
        if (existing.demand > existing.supply * 1.1) {
          existing.status = "Shortage";
        } else if (existing.supply > existing.demand * 1.1) {
          existing.status = "Surplus";
        } else {
          existing.status = "Balanced";
        }
      }
    });

    const result = Array.from(map.values()).map((item) => ({
      ...item,
      avgEmploymentRate: Math.round(item.avgEmploymentRate / item.count),
      avgRetention6m: Math.round(item.avgRetention6m / item.count),
      avgInitialWage: Math.round(item.avgInitialWage / item.count),
      avgCurrentWage: Math.round(item.avgCurrentWage / item.count)
    }));

    return result;
  }, [filteredRecords]);

  // Section 3: Summary KPIs
  const summaryKpis = useMemo(() => {
    const totalSkills = aggregatedSkills.length;
    const highDemandSkills = aggregatedSkills.filter((s) => s.demand >= 1000).length;
    const shortagesCount = aggregatedSkills.filter((s) => s.demand > s.supply).length;
    const employmentLinked = aggregatedSkills.filter((s) => s.avgEmploymentRate >= 70).length;
    const emergingSkills = aggregatedSkills.filter((s) => s.demandTrendVal > 20).length;

    const totalEmployedProxy = aggregatedSkills.reduce((acc, curr) => acc + Math.round((curr.supply * curr.avgEmploymentRate) / 100), 0);
    const relevantEmployedProxy = aggregatedSkills.reduce(
      (acc, curr) => acc + Math.round((curr.supply * (curr.avgEmploymentRate / 100) * (curr.relevanceRate / 100))),
      0
    );
    const overallRelevancePct = totalEmployedProxy > 0 ? Math.round((relevantEmployedProxy / totalEmployedProxy) * 100) : 0;

    return {
      totalSkills,
      highDemandSkills,
      shortagesCount,
      employmentLinked,
      emergingSkills,
      overallRelevancePct
    };
  }, [aggregatedSkills]);

  // Sorted records for the Skill Gap Intelligence Table (Section 5)
  const sortedTableRecords = useMemo(() => {
    const list = [...filteredRecords];
    switch (sortOption) {
      case "shortage":
        return list.sort((a, b) => b.gap - a.gap);
      case "surplus":
        return list.sort((a, b) => a.gap - b.gap);
      case "conversion_high":
        return list.sort((a, b) => b.employmentRate - a.employmentRate);
      case "conversion_low":
        return list.sort((a, b) => a.employmentRate - b.employmentRate);
      case "demand_high":
        return list.sort((a, b) => b.demand - a.demand);
      case "supply_high":
        return list.sort((a, b) => b.supply - a.supply);
      default:
        return list;
    }
  }, [filteredRecords, sortOption]);

  // Record currently selected for deep curriculum & pipeline inspection
  const activeInspectedRecord = useMemo(() => {
    const match = filteredRecords.find((r) => r.skill === inspectedSkill);
    return match || filteredRecords[0] || BASE_SKILL_RECORDS[0];
  }, [filteredRecords, inspectedSkill]);

  // District-wise aggregation for Geographic Intelligence (Section 6 & 7)
  const districtGeoData = useMemo(() => {
    const map = new Map<
      string,
      {
        district: string;
        state: string;
        totalSupply: number;
        totalDemand: number;
        netGap: number;
        avgEmploymentRate: number;
        avgRetention: number;
        skills: { skill: PrototypeSkill; supply: number; demand: number; gap: number }[];
      }
    >();

    filteredRecords.forEach((r) => {
      const existing = map.get(r.district);
      if (!existing) {
        map.set(r.district, {
          district: r.district,
          state: r.state,
          totalSupply: r.supply,
          totalDemand: r.demand,
          netGap: r.gap,
          avgEmploymentRate: r.employmentRate,
          avgRetention: r.retention6m,
          skills: [{ skill: r.skill, supply: r.supply, demand: r.demand, gap: r.gap }]
        });
      } else {
        existing.totalSupply += r.supply;
        existing.totalDemand += r.demand;
        existing.netGap = existing.totalDemand - existing.totalSupply;
        existing.avgEmploymentRate = Math.round((existing.avgEmploymentRate + r.employmentRate) / 2);
        existing.avgRetention = Math.round((existing.avgRetention + r.retention6m) / 2);
        existing.skills.push({ skill: r.skill, supply: r.supply, demand: r.demand, gap: r.gap });
      }
    });

    return Array.from(map.values());
  }, [filteredRecords]);

  // Data for the hovered/selected district card in the Map section
  const selectedDistrictInfo = useMemo(() => {
    const found = districtGeoData.find((d) => d.district === selectedMapDistrict);
    if (found) return found;
    return districtGeoData[0] || null;
  }, [districtGeoData, selectedMapDistrict]);

  // Specific skill metrics within the selected district
  const selectedDistrictSkillMetrics = useMemo(() => {
    if (!selectedDistrictInfo) return null;
    const match = selectedDistrictInfo.skills.find((s) => s.skill === inspectedSkill);
    if (match) {
      return {
        skill: inspectedSkill,
        supply: match.supply,
        demand: match.demand,
        gap: match.gap,
        conversion: selectedDistrictInfo.avgEmploymentRate,
        retention: selectedDistrictInfo.avgRetention
      };
    }
    return {
      skill: inspectedSkill,
      supply: Math.round(selectedDistrictInfo.totalSupply / Math.max(selectedDistrictInfo.skills.length, 1)),
      demand: Math.round(selectedDistrictInfo.totalDemand / Math.max(selectedDistrictInfo.skills.length, 1)),
      gap: Math.round(selectedDistrictInfo.netGap / Math.max(selectedDistrictInfo.skills.length, 1)),
      conversion: selectedDistrictInfo.avgEmploymentRate,
      retention: selectedDistrictInfo.avgRetention
    };
  }, [selectedDistrictInfo, inspectedSkill]);

  // Max values for horizontal bar charts
  const maxDemand = useMemo(() => {
    return Math.max(...aggregatedSkills.map((s) => s.demand), 1);
  }, [aggregatedSkills]);

  // Handle Natural-Language Skill Query
  const handleRunAiQuery = async (queryText?: string) => {
    const q = queryText || aiQuestion;
    if (!q.trim()) return;
    setIsAskingAi(true);
    setAiAnswer(null);

    try {
      // Build compact grounding context from filtered data
      const groundContext = {
        active_filters: {
          state: selectedState,
          district: selectedDistrict,
          skill: selectedSkillFilter
        },
        skills_summary: aggregatedSkills.map((s) => ({
          skill: s.skill,
          supply: s.supply,
          demand: s.demand,
          gap: s.gap,
          status: s.status,
          conversion: `${s.avgEmploymentRate}%`,
          wage: `₹${s.avgCurrentWage}`
        })),
        district_intelligence: districtGeoData.slice(0, 5).map((d) => ({
          district: d.district,
          supply: d.totalSupply,
          demand: d.totalDemand,
          gap: d.netGap
        }))
      };

      const res = await api.askAi(
        `[Grounding Context: ${JSON.stringify(groundContext)}] Question regarding Skill Intelligence: ${q}`,
        {
          district: selectedDistrict,
          state: selectedState,
          tone: "formal"
        }
      );

      const fullAnswer = [res.insight, res.explanation, res.recommendation ? `Recommendation: ${res.recommendation}` : ""]
        .filter(Boolean)
        .join("\n\n");
      setAiAnswer(fullAnswer || "No response received from the intelligence model.");
    } catch {
      // Graceful fallback using local grounded calculations
      setAiAnswer(
        `Based on observed cohort data in ${selectedState === "All States" ? "Bihar, Maharashtra, and Uttar Pradesh" : selectedState}: ` +
        `Observed demand for ${inspectedSkill} is ${activeInspectedRecord.demand.toLocaleString()} against available supply of ${activeInspectedRecord.supply.toLocaleString()} ` +
        `(Net ${activeInspectedRecord.gap > 0 ? "deficit" : "surplus"} of ${Math.abs(activeInspectedRecord.gap)}). ` +
        `Employment conversion is ${activeInspectedRecord.employmentRate}%, with an average post-placement wage of ₹${activeInspectedRecord.currentWage.toLocaleString()}.`
      );
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedState("All States");
    setSelectedDistrict("All Districts");
    setSelectedCentre("All Centres");
    setSelectedSkillFilter("All Skills");
    setSelectedEmploymentStatus("All Statuses");
    setSelectedPeriod("Last 6 Months");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Title (Renamed everywhere to Skill Intelligence) */}
      <div className="gov-card p-5 bg-white border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                <GitCompare className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Skill Intelligence
                  </h2>
                  <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                    Longitudinal Workforce & Demand Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connects training supply, industry demand, post-training placement, retention, wage progression, and geographic mobility.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAskAiWhyGap(inspectedSkill)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm transition"
            >
              <SkillPulseMark className="h-3.5 w-3.5" />
              <span>Ask SkillPulse AI: Analyze Gap in {inspectedSkill}</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>AI Insights</span>
            </button>
          </div>
        </div>

        {/* 19. SKILL INTELLIGENCE FILTERS BAR (Independent State, 5–6 prototype skills, No horizontal time option) */}
        <div className="rounded-xl bg-slate-50/70 border border-slate-200 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Filter className="h-3.5 w-3.5 text-sky-700" />
              <span>Skill Intelligence Filters</span>
              <span className="text-[11px] font-normal text-slate-500">
                (Independent parameters calibrated for prototype cohort)
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* State Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option>All States</option>
                {STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Training Centre Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Training Centre</label>
              <select
                value={selectedCentre}
                onChange={(e) => setSelectedCentre(e.target.value)}
                className="w-full truncate rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                {availableCentres.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade / Skill Filter: 5–6 well-represented prototype skills */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Trade / Skill Area</label>
              <select
                value={selectedSkillFilter}
                onChange={(e) => setSelectedSkillFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="All Skills">All Skills (Prototype Set)</option>
                {PROTOTYPE_SKILLS.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Status Filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Employment</label>
              <select
                value={selectedEmploymentStatus}
                onChange={(e) => setSelectedEmploymentStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option>All Statuses</option>
                <option>Employed</option>
                <option>Self-Employed</option>
                <option>Apprenticeship</option>
                <option>Unemployed</option>
              </select>
            </div>

            {/* Date/Period Filter (clean dropdown, NO horizontal time option per Requirement 21) */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Reporting Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Last 6 Months</option>
                <option>Last 1 Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. SKILL INTELLIGENCE OVERVIEW CARDS (Dynamically Calculated from Dataset) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Skills Tracked</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{summaryKpis.totalSkills}</span>
              <span className="text-[10px] text-slate-500">core trades</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">Unique occupations</p>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200">
            <span className="text-[10px] uppercase font-bold text-sky-800 block">High-Demand Skills</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-sky-950">{summaryKpis.highDemandSkills}</span>
              <span className="text-[10px] font-bold text-sky-700">high volume</span>
            </div>
            <p className="text-[10px] text-sky-700 mt-0.5 truncate">Reqs &gt; 1,000 positions</p>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">Skill Shortages</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-rose-950">{summaryKpis.shortagesCount}</span>
              <span className="text-[10px] font-bold text-rose-700">unfilled</span>
            </div>
            <p className="text-[10px] text-rose-700 mt-0.5 truncate">Demand &gt; Trained Supply</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Employment-Linked</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-950">{summaryKpis.employmentLinked}</span>
              <span className="text-[10px] font-bold text-emerald-700">&gt;70% conv.</span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5 truncate">High outcome conversion</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Emerging Skills</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-950">{summaryKpis.emergingSkills}</span>
              <span className="text-[10px] font-bold text-amber-700">&gt;20% YoY</span>
            </div>
            <p className="text-[10px] text-amber-700 mt-0.5 truncate">Green tech &amp; automation</p>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
            <span className="text-[10px] uppercase font-bold text-indigo-800 block">Relevant Employment</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-950">{summaryKpis.overallRelevancePct}%</span>
              <span className="text-[10px] font-bold text-indigo-700">matched</span>
            </div>
            <p className="text-[10px] text-indigo-700 mt-0.5 truncate">Trained skill = Job role</p>
          </div>
        </div>

        {/* Cohesive Sub-Navigation Tabs (Requirement 28) */}
        <div className="flex items-center gap-1 border-b border-slate-200 pt-5 mt-2 overflow-x-auto text-xs">
          {[
            { id: "overview", label: "Supply vs Demand & Gaps", icon: GitCompare },
            { id: "geography", label: "Geographic Intelligence", icon: MapPin },
            { id: "mobility", label: "Skill Mobility", icon: Compass },
            { id: "pipeline", label: "Outcome Pipeline", icon: UserCheck },
            { id: "relevance", label: "Skill Relevance", icon: Briefcase },
            { id: "trends", label: "Demand Trends & Surplus", icon: TrendingUp },
            { id: "wages", label: "Wage Intelligence", icon: DollarSign },
            { id: "ai", label: "AI Insights & Query", icon: Sparkles }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold whitespace-nowrap transition ${
                  isActive
                    ? "border-sky-600 text-sky-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW A: OVERVIEW & SUPPLY VS DEMAND + SKILL GAP TABLE */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4. SKILL SUPPLY VS DEMAND INTELLIGENCE (Horizontal Comparison Bar Chart) */}
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Skill Supply vs. Employment Demand Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Calibrated formula: <code className="font-mono font-bold text-slate-800">Skill Gap = Employment Demand − Available Skill Supply</code>
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-xs bg-slate-400" /> Supply
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-xs bg-sky-600" /> Employer Demand
                </span>
              </div>
            </div>

            {/* Horizontal Bar Chart representation */}
            <div className="space-y-4">
              {aggregatedSkills.map((sk) => {
                const supplyWidth = maxDemand > 0 ? (sk.supply / maxDemand) * 100 : 0;
                const demandWidth = maxDemand > 0 ? (sk.demand / maxDemand) * 100 : 0;
                const isShortage = sk.gap > 0;
                const isSurplus = sk.gap < 0;

                return (
                  <div
                    key={sk.skill}
                    onClick={() => setInspectedSkill(sk.skill)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      inspectedSkill === sk.skill
                        ? "border-sky-500 bg-sky-50/40 shadow-xs"
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{sk.skill}</span>
                        <span className="text-[10px] text-slate-500">({sk.sector})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isShortage
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : isSurplus
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          }`}
                        >
                          {isShortage ? `Shortage: -${sk.gap.toLocaleString()}` : isSurplus ? `Surplus: +${Math.abs(sk.gap).toLocaleString()}` : "Balanced"}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          {sk.avgEmploymentRate}% Placement
                        </span>
                      </div>
                    </div>

                    {/* Dual Horizontal Bars */}
                    <div className="space-y-1.5">
                      {/* Supply Bar */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-16 shrink-0 text-[10px] font-semibold text-slate-500">Supply</span>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(supplyWidth, 100)}%` }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right font-mono font-bold text-slate-700 text-xs">
                          {sk.supply.toLocaleString()}
                        </span>
                      </div>

                      {/* Demand Bar */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-16 shrink-0 text-[10px] font-semibold text-sky-800">Demand</span>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(demandWidth, 100)}%` }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right font-mono font-bold text-sky-800 text-xs">
                          {sk.demand.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. SKILL GAP INTELLIGENCE TABLE (Preserving & Expanding Existing Capabilities) */}
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Skill Gap Intelligence Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Descriptive analytics across skills, districts, certified trainees, demand, placement, retention, and wages.
                </p>
              </div>

              {/* Table Sorting Controls */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="shortage">Largest Shortage</option>
                  <option value="surplus">Largest Surplus</option>
                  <option value="conversion_high">Highest Employment Conversion</option>
                  <option value="conversion_low">Lowest Employment Conversion</option>
                  <option value="demand_high">Highest Demand</option>
                  <option value="supply_high">Highest Supply</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="gov-table-header">
                    <th className="py-2.5 px-3">Skill / Trade</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3 text-right">Supply</th>
                    <th className="py-2.5 px-3 text-right">Certified</th>
                    <th className="py-2.5 px-3 text-right">Demand</th>
                    <th className="py-2.5 px-3 text-right">Skill Gap</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Placement</th>
                    <th className="py-2.5 px-3 text-right">6M Retention</th>
                    <th className="py-2.5 px-3 text-right">Observed Wage</th>
                    <th className="py-2.5 px-3 text-center">Diagnostics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTableRecords.map((r, idx) => {
                    const isSelected = r.skill === inspectedSkill && r.district === activeInspectedRecord.district;
                    const isShortage = r.gap > 0;
                    const isSurplus = r.gap < 0;

                    return (
                      <tr
                        key={`${r.skill}-${r.district}-${idx}`}
                        onClick={() => setInspectedSkill(r.skill)}
                        className={`cursor-pointer transition ${
                          isSelected ? "bg-sky-50/90 font-semibold" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900">{r.skill}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.state}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{r.district}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 text-right">{r.supply.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-right">{r.certified.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-800 text-right">{r.demand.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-black text-right">
                          <span className={isShortage ? "text-rose-600" : isSurplus ? "text-emerald-600" : "text-indigo-600"}>
                            {isShortage ? `-${r.gap.toLocaleString()}` : isSurplus ? `+${Math.abs(r.gap).toLocaleString()}` : "0"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.status === "Shortage"
                                ? "bg-rose-100 text-rose-800"
                                : r.status === "Surplus"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 text-right">{r.employmentRate}%</td>
                        <td className="py-2.5 px-3 text-slate-700 text-right">{r.retention6m}%</td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 text-right">
                          {r.currentWage ? `₹${r.currentWage.toLocaleString()}` : "Insufficient wage data"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedSkill(r.skill);
                            }}
                            className="rounded bg-slate-100 hover:bg-sky-600 hover:text-white px-2 py-1 text-[11px] font-bold text-slate-700 transition"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Curriculum & 3-Pillar Diagnostics (Preserved from existing implementation) */}
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Curriculum-Market Semantic Matching Engine
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  Curriculum &amp; Skill Diagnostics: {activeInspectedRecord.skill}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Semantic Alignment</span>
                  <strong className="text-sm font-black text-emerald-600">
                    {activeInspectedRecord.alignmentScore}% Match
                  </strong>
                </div>
                <div className="h-9 w-9 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-800">
                  {activeInspectedRecord.alignmentScore}%
                </div>
              </div>
            </div>

            {/* 3 Pillars Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                  <span>1. Course Syllabus (Skills Taught)</span>
                </div>
                <div className="space-y-1">
                  {activeInspectedRecord.curriculumSkills.map((sk) => (
                    <div key={sk} className="flex items-center gap-1.5 text-slate-700 bg-white p-1.5 rounded border border-slate-100">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span>{sk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                  <span>2. Employer Requisitions (Skills Demanded)</span>
                </div>
                <div className="space-y-1">
                  {activeInspectedRecord.employerDemanded.map((sk) => (
                    <div key={sk} className="flex items-center gap-1.5 text-slate-700 bg-white p-1.5 rounded border border-slate-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span>{sk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>3. Identified Curriculum Mismatches</span>
                </div>
                <div className="space-y-1">
                  {activeInspectedRecord.missingSkills.map((sk) => (
                    <div key={sk} className="flex items-center gap-1.5 text-rose-800 bg-white p-1.5 rounded border border-rose-200 font-medium">
                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                      <span>{sk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                  <SkillPulseMark className="h-3.5 w-3.5" />
                  <span>Targeted Curriculum Intervention for {activeInspectedRecord.skill}</span>
                </div>
                <p className="text-indigo-800 text-[11px] mt-0.5">
                  Update practical lab hours and apprenticeship modules for:{" "}
                  <strong>{activeInspectedRecord.missingSkills.join(", ")}</strong> before campus drive placement.
                </p>
              </div>

              <button
                onClick={() => onAskAiWhyGap(activeInspectedRecord.skill)}
                className="flex items-center gap-1 rounded-lg bg-indigo-700 px-3 py-1.5 font-bold text-white hover:bg-indigo-600 transition shadow-xs shrink-0 self-start sm:self-center"
              >
                <span>Analyze with SkillPulse AI</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: GEOGRAPHIC SKILL INTELLIGENCE (Sections 6 & 7 - Visual Centerpiece) */}
      {activeTab === "geography" && (
        <div className="space-y-6">
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Geographic Skill Intelligence: State → District → Training Centre
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Spatial distribution of supply, employer demand, and localized workforce deficit across districts.
                </p>
              </div>

              {/* Metric Selector for Map Encoding */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500">Map Metric:</span>
                <select
                  value={geoMetric}
                  onChange={(e) => setGeoMetric(e.target.value as any)}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="gap">Skill Gap (Shortage / Surplus)</option>
                  <option value="demand">Employment Demand</option>
                  <option value="supply">Training Supply</option>
                  <option value="conversion">Employment Conversion %</option>
                  <option value="volume">Total Training Volume</option>
                </select>
              </div>
            </div>

            {/* Interactive Geo-Intelligence Map & Info Card Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left / Center: Interactive District Cards / Map Grid */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">
                    Showing Districts in {selectedState === "All States" ? "Bihar, Maharashtra & Uttar Pradesh" : selectedState}
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> High Shortage
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate Gap
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Balanced / Surplus
                    </span>
                  </div>
                </div>

                {/* District Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {districtGeoData.map((d) => {
                    const isSelected = selectedMapDistrict === d.district;
                    const isCritical = d.netGap > 800;
                    const isModerate = d.netGap > 0 && d.netGap <= 800;

                    return (
                      <div
                        key={d.district}
                        onClick={() => setSelectedMapDistrict(d.district)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/80 shadow-md ring-2 ring-sky-500/20"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 text-xs">{d.district}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{d.state}</span>
                        </div>

                        <div className="flex items-baseline justify-between text-xs mb-2">
                          <span className="text-[11px] text-slate-500">
                            {geoMetric === "gap"
                              ? "Net Gap"
                              : geoMetric === "demand"
                              ? "Demand"
                              : geoMetric === "supply"
                              ? "Supply"
                              : "Placement Rate"}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              isCritical ? "text-rose-600" : isModerate ? "text-amber-700" : "text-emerald-700"
                            }`}
                          >
                            {geoMetric === "gap"
                              ? `-${d.netGap.toLocaleString()}`
                              : geoMetric === "demand"
                              ? d.totalDemand.toLocaleString()
                              : geoMetric === "supply"
                              ? d.totalSupply.toLocaleString()
                              : `${d.avgEmploymentRate}%`}
                          </span>
                        </div>

                        {/* Mini ratio bar */}
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-slate-400 h-full"
                            style={{ width: `${(d.totalSupply / (d.totalSupply + d.totalDemand)) * 100}%` }}
                          />
                          <div
                            className="bg-sky-600 h-full"
                            style={{ width: `${(d.totalDemand / (d.totalSupply + d.totalDemand)) * 100}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Sup: {d.totalSupply}</span>
                          <span>Dem: {d.totalDemand}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Compact District Intelligence Card (Requirement 6.1) */}
              <div className="lg:col-span-4">
                {selectedDistrictSkillMetrics && (
                  <div className="p-4 rounded-xl border border-sky-300 bg-sky-50/50 shadow-sm space-y-3 sticky top-4">
                    <div className="flex items-center justify-between border-b border-sky-200/80 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-sky-800 block">
                          District Intelligence Card
                        </span>
                        <h4 className="text-base font-black text-slate-900">{selectedMapDistrict}</h4>
                      </div>
                      <span className="rounded bg-sky-200/70 px-2 py-0.5 text-[10px] font-bold text-sky-900">
                        {selectedDistrictInfo?.state}
                      </span>
                    </div>

                    <div className="text-xs space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Selected Skill:</span>
                        <strong className="text-slate-900">{inspectedSkill}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Training Supply:</span>
                        <strong className="font-mono text-slate-800">{selectedDistrictSkillMetrics.supply}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Employment Demand:</span>
                        <strong className="font-mono text-sky-800">{selectedDistrictSkillMetrics.demand}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Skill Gap:</span>
                        <strong className="font-mono text-rose-600">
                          {selectedDistrictSkillMetrics.gap > 0 ? `-${selectedDistrictSkillMetrics.gap}` : `+${Math.abs(selectedDistrictSkillMetrics.gap)}`}
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Employment Conversion:</span>
                        <strong className="text-emerald-700">{selectedDistrictSkillMetrics.conversion}%</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Retention Rate (6M):</span>
                        <strong className="text-slate-800">{selectedDistrictSkillMetrics.retention}%</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-sky-200/80">
                      <button
                        onClick={() =>
                          onAskAiWhyGap(
                            `${inspectedSkill} in ${selectedMapDistrict}`
                          )
                        }
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-600 transition"
                      >
                        <SkillPulseMark className="h-3.5 w-3.5" />
                        <span>Policy Brief for {selectedMapDistrict}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 7. GEOGRAPHIC SKILL GAP CHART (Supply vs Demand by District) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Supply vs. Demand by District
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Comparative workforce deficit analysis across regional centres.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="h-2 w-2 rounded-xs bg-slate-400" /> Supply
                  </span>
                  <span className="flex items-center gap-1 text-sky-700">
                    <span className="h-2 w-2 rounded-xs bg-sky-600" /> Demand
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {districtGeoData.map((d) => {
                  const maxVal = Math.max(...districtGeoData.map((item) => Math.max(item.totalSupply, item.totalDemand)), 1);
                  const supplyW = (d.totalSupply / maxVal) * 100;
                  const demandW = (d.totalDemand / maxVal) * 100;

                  return (
                    <div key={d.district} className="grid grid-cols-12 items-center gap-2 text-xs">
                      <div className="col-span-3 sm:col-span-2 font-bold text-slate-800 truncate">
                        {d.district}
                      </div>
                      <div className="col-span-7 sm:col-span-8 space-y-1">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${supplyW}%` }} />
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-600 rounded-full" style={{ width: `${demandW}%` }} />
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-[11px] text-rose-600">
                        -{d.netGap}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: SKILL MOBILITY INTELLIGENCE (Section 8) */}
      {activeTab === "mobility" && (
        <div className="space-y-6">
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-sky-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Skill Mobility Intelligence: Training Location → Employment Location
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Evaluates post-certification candidate migration flows: local employment, inter-district movement, and inter-state relocation.
                </p>
              </div>
              <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                Longitudinal Flow Radar
              </span>
            </div>

            {/* Mobility Overview for Active Inspected Skill */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Local District Employment</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {activeInspectedRecord.mobility.localShare}%
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Retained within training district</p>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 text-center">
                <span className="text-[10px] uppercase font-bold text-sky-800">Inter-District Movement</span>
                <div className="text-2xl font-black text-sky-950 mt-1">
                  {activeInspectedRecord.mobility.interDistrictShare}%
                </div>
                <p className="text-[11px] text-sky-700 mt-0.5">Moved to adjacent economic corridors</p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-800">Inter-State Relocation</span>
                <div className="text-2xl font-black text-indigo-950 mt-1">
                  {activeInspectedRecord.mobility.interStateShare}%
                </div>
                <p className="text-[11px] text-indigo-700 mt-0.5">Relocated to metropolitan clusters</p>
              </div>
            </div>

            {/* Visual Destination Nodes Flow */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Observed Destination Nodes for {activeInspectedRecord.skill}
                </span>
                <span className="text-[11px] text-slate-500">
                  Origin: <strong>{activeInspectedRecord.district}</strong>
                </span>
              </div>

              <div className="space-y-3">
                {activeInspectedRecord.mobility.destinations.map((dest, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white border border-slate-200 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{dest.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Candidate Share: <strong className="text-slate-800 font-mono">{dest.share}%</strong></span>
                          <span>•</span>
                          <span>Average Wage: <strong className="text-emerald-700 font-mono">₹{dest.avgWage.toLocaleString()}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${dest.share}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-900">{dest.share}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW D: OUTCOME ENGINE (EXPANDED) */}
      {activeTab === "pipeline" && (
        <OutcomeEngineView
          filteredRecords={filteredRecords}
          allRecords={BASE_SKILL_RECORDS}
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          selectedCentre={selectedCentre}
          selectedSkillFilter={selectedSkillFilter}
          selectedPeriod={selectedPeriod}
          inspectedSkill={inspectedSkill}
          onSelectSkill={(sk) => setInspectedSkill(sk as PrototypeSkill)}
          onAskAi={onAskAiWhyGap}
        />
      )}

      {/* VIEW E: SKILL RELEVANCE INTELLIGENCE (EXPANDED) */}
      {activeTab === "relevance" && (
        <SkillRelevanceView
          filteredRecords={filteredRecords}
          allRecords={BASE_SKILL_RECORDS}
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          selectedCentre={selectedCentre}
          selectedSkillFilter={selectedSkillFilter}
          inspectedSkill={inspectedSkill}
          onSelectSkill={(sk) => setInspectedSkill(sk as PrototypeSkill)}
          onAskAi={onAskAiWhyGap}
        />
      )}

      {/* VIEW F: EMERGING SKILLS & DEMAND TRENDS (Sections 11, 12 & 16) */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          {/* Emerging Skills Intelligence Table */}
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Emerging Skills &amp; Growth Trajectories
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Comparative momentum across prototype clean-tech, electrical, hardware, and clerical occupations.
                </p>
              </div>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-[10px] font-mono text-slate-600 border border-slate-200">
                Prototype Trend Intelligence
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="gov-table-header">
                    <th className="py-2.5 px-3">Skill Area</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3 text-right">Previous Demand</th>
                    <th className="py-2.5 px-3 text-right">Current Demand</th>
                    <th className="py-2.5 px-3 text-right">Observed Change</th>
                    <th className="py-2.5 px-3 text-right">Training Supply</th>
                    <th className="py-2.5 px-3 text-right">Conversion Rate</th>
                    <th className="py-2.5 px-3 text-right">Skill Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aggregatedSkills.map((sk) => {
                    const isPositive = sk.demandTrendVal > 0;
                    return (
                      <tr key={sk.skill} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{sk.skill}</td>
                        <td className="py-2.5 px-3 text-slate-600">{sk.sector}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-right">
                          {Math.round(sk.demand / (1 + sk.demandTrendVal / 100)).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-800 text-right">
                          {sk.demand.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              isPositive ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isPositive ? `+${sk.demandTrendVal}%` : `${sk.demandTrendVal}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 text-right">{sk.supply.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 text-right">{sk.avgEmploymentRate}%</td>
                        <td className="py-2.5 px-3 font-mono font-black text-right text-rose-600">
                          {sk.gap > 0 ? `-${sk.gap.toLocaleString()}` : `+${Math.abs(sk.gap).toLocaleString()}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time Series Demand Line Chart (Section 12) */}
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                  Demand Progression Over Time: {inspectedSkill}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Quarterly observed industry requisitions for the selected trade.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold">Select Skill:</span>
                <select
                  value={inspectedSkill}
                  onChange={(e) => setInspectedSkill(e.target.value as PrototypeSkill)}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {PROTOTYPE_SKILLS.map((sk) => (
                    <option key={sk} value={sk}>
                      {sk}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200">
              <div className="grid grid-cols-4 gap-3 text-center mb-3">
                {activeInspectedRecord.quarterlyDemand.map((qd) => (
                  <div key={qd.quarter} className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">{qd.quarter}</span>
                    <strong className="text-xs font-mono text-sky-900">{qd.demand.toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div className="h-32 flex items-end gap-6 px-4 pt-4 border-b border-slate-200">
                {activeInspectedRecord.quarterlyDemand.map((qd, idx) => {
                  const maxVal = Math.max(...activeInspectedRecord.quarterlyDemand.map((x) => x.demand), 1);
                  const barH = (qd.demand / maxVal) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono text-slate-600 font-bold">{qd.demand}</span>
                      <div className="w-full max-w-[48px] bg-sky-600 rounded-t-md transition-all duration-500" style={{ height: `${barH}%` }} />
                      <span className="text-[10px] font-medium text-slate-500">{qd.quarter}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 16. SKILL SURPLUS INTELLIGENCE */}
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                  Skill Surplus &amp; Training Alignment Intelligence
                </h4>
                <p className="text-[11px] text-slate-500">
                  Identifies situations where Training Supply exceeds observed demand to avoid oversupply risks.
                </p>
              </div>
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                Capacity Optimization
              </span>
            </div>

            <div className="space-y-3">
              {filteredRecords
                .filter((r) => r.status === "Surplus" || r.status === "Balanced")
                .map((r, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{r.skill}</strong>
                        <span className="text-slate-500 font-medium">({r.district}, {r.state})</span>
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Training supply ({r.supply}) exceeds current demand ({r.demand}). Placement conversion remains {r.employmentRate}%.
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Surplus Delta</span>
                      <strong className="font-mono text-emerald-700 text-sm">+{Math.abs(r.gap)}</strong>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW G: WAGE INTELLIGENCE (Section 14) */}
      {activeTab === "wages" && (
        <div className="space-y-6">
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Wage Intelligence &amp; Progression Milestones
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Observed compensation trajectories from initial campus placement to 12-month follow-up.
                </p>
              </div>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-[10px] font-mono text-slate-600 border border-slate-200">
                EPF &amp; Micro-Survey Calibrated
              </span>
            </div>

            {/* Wage summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500">Initial Observed Wage</span>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                  ₹{activeInspectedRecord.initialWage.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Median starting placement compensation</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Current Observed Wage</span>
                <div className="text-xl font-black text-emerald-950 mt-1 font-mono">
                  ₹{activeInspectedRecord.currentWage.toLocaleString()}
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">Observed follow-up median</p>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200">
                <span className="text-[10px] uppercase font-bold text-sky-800">Average Wage Growth</span>
                <div className="text-xl font-black text-sky-950 mt-1">
                  +{Math.round(((activeInspectedRecord.currentWage - activeInspectedRecord.initialWage) / activeInspectedRecord.initialWage) * 100)}%
                </div>
                <p className="text-[11px] text-sky-700 mt-0.5">Lift across 6–12 month tenure</p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <span className="text-[10px] uppercase font-bold text-indigo-800">Top Earning Trade</span>
                <div className="text-xl font-black text-indigo-950 mt-1">
                  EV Technician
                </div>
                <p className="text-[11px] text-indigo-700 mt-0.5">Up to ₹28,500/mo in Pune hub</p>
              </div>
            </div>

            {/* Progression Milestones */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                Longitudinal Wage Progression Curve
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">Placement Milestone</span>
                  <div className="text-base font-bold font-mono text-slate-800">₹18,500/mo</div>
                  <span className="text-[10px] text-slate-500">Initial campus joining median</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">6 Months Follow-up</span>
                  <div className="text-base font-bold font-mono text-sky-800">₹23,800/mo</div>
                  <span className="text-[10px] text-sky-700">+28.6% confirmation increment</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">12 Months Retention</span>
                  <div className="text-base font-bold font-mono text-emerald-800">₹26,800/mo</div>
                  <span className="text-[10px] text-emerald-700">+44.8% annual career progression</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW H: AI-POWERED SKILL INSIGHTS & NATURAL-LANGUAGE SKILL QUERY (Sections 17 & 18) */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="gov-card p-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    AI-Powered Skill Insights &amp; Natural-Language Query
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Interprets live dataset parameters using Gemini. All assertions correspond directly to observed cohort metrics.
                </p>
              </div>
              <span className="rounded bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-800 border border-indigo-200">
                Grounded Analysis
              </span>
            </div>

            {/* Pre-Generated Key Insights Panel (Section 17) */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                Automated Analytical Takeaways
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Critical Clean-Tech Deficit</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Observed demand for EV Technician and Solar Technician exceeds available certified supply by 2,140 positions across Pune and Muzaffarpur. Employment conversion averages 84.2%, correlating with strong hiring intent.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Clerical Skill Plateau</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Traditional Data Entry shows modest growth in commercial corridors but an emerging surplus (+200) in rural clusters like Gaya. Re-skilling curricula toward CRM and BI validation is indicated.
                  </p>
                </div>
              </div>
            </div>

            {/* 18. NATURAL-LANGUAGE SKILL QUERY INTERACTION */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-indigo-950 text-xs">
                <SkillPulseMark className="h-4 w-4" />
                <span>Ask SkillPulse AI about Current Skill Intelligence</span>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px]">
                {[
                  "Which skills have the largest observed supply-demand gaps?",
                  "Show skill demand in Patna.",
                  "Which districts have high training supply but lower conversion?",
                  "How relevant are trained skills to current jobs?",
                  "Which skills show increasing observed demand?"
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => {
                      setAiQuestion(promptText);
                      handleRunAiQuery(promptText);
                    }}
                    className="rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 px-2.5 py-1 text-indigo-800 transition"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunAiQuery()}
                  placeholder="Ask a question about skills, supply, demand, wages, or geography..."
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none shadow-xs"
                />
                <button
                  disabled={isAskingAi || !aiQuestion.trim()}
                  onClick={() => handleRunAiQuery()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isAskingAi ? "Analyzing..." : "Ask"}</span>
                </button>
              </div>

              {/* Answer display */}
              {aiAnswer && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-indigo-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>SkillPulse AI Analysis</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {aiAnswer}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-100">
                    Grounding source: Active Skill Intelligence dataset for {selectedState}, {selectedDistrict}.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
