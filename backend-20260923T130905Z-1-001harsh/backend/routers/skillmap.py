from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from data_store import DISTRICTS, STATE_NAME, db
from intelligence import build_intelligence

router = APIRouter(prefix="/api/skillmap", tags=["SkillMap Intelligence"])

DISTRICT_METRICS = {
    # Maharashtra
    "Pune": {
        "workforce_supply": 4800,
        "job_demand": 6400,
        "net_gap": -1600,
        "gap_level": "High Skill Gap",
        "employment_rate": 78.4,
        "retention_6m": 76.2,
        "avg_wage": 25400,
        "top_skills": [
            {"skill": "EV Technician", "demand": 1850, "supply": 820, "gap": 1030},
            {"skill": "Electrician", "demand": 1200, "supply": 640, "gap": 560},
            {"skill": "Data Entry Operator", "demand": 1600, "supply": 980, "gap": 620}
        ],
        "top_occupations": ["EV Diagnostics Specialist", "Industrial Electrician", "Data Entry Specialist", "Field Maintenance Lead"],
        "recommended_training": "Expand EV powertrain diagnostics and industrial electrical training capacity across Chakan, Bhosari, and Pimpri-Chinchwad skilling hubs.",
        "mobility_outflow": [
            {"destination": "Local Pune Cluster", "share": "72%"},
            {"destination": "Nagpur MMR", "share": "18%"},
            {"destination": "Nashik Industrial Belt", "share": "10%"}
        ],
        "layer_values": {
            "supply": 88,
            "demand": 95,
            "gap": -1600,
            "wage": 25400,
            "future_index": 9.4,
            "recommendation_priority": "High"
        }
    },
    "Nashik": {
        "workforce_supply": 2900,
        "job_demand": 3750,
        "net_gap": -850,
        "gap_level": "Moderate Shortage",
        "employment_rate": 71.2,
        "retention_6m": 70.1,
        "avg_wage": 20500,
        "top_skills": [
            {"skill": "Electrician", "demand": 920, "supply": 510, "gap": 410},
            {"skill": "Solar Technician", "demand": 680, "supply": 390, "gap": 290},
            {"skill": "Field Technician", "demand": 750, "supply": 480, "gap": 270}
        ],
        "top_occupations": ["Industrial Electrician", "Solar PV Technician", "Field Network Technician", "Hardware Maintenance Lead"],
        "recommended_training": "Introduce dual-apprenticeship programs with Satpur and Ambad industrial manufacturers; scale renewable solar installation.",
        "mobility_outflow": [
            {"destination": "Local Nashik Cluster", "share": "60%"},
            {"destination": "Pune Industrial Hub", "share": "22%"},
            {"destination": "Nagpur Corridor", "share": "18%"}
        ],
        "layer_values": {
            "supply": 72,
            "demand": 78,
            "gap": -850,
            "wage": 20500,
            "future_index": 7.9,
            "recommendation_priority": "Medium"
        }
    },
    "Nagpur": {
        "workforce_supply": 5600,
        "job_demand": 6900,
        "net_gap": -1300,
        "gap_level": "High Skill Gap",
        "employment_rate": 76.5,
        "retention_6m": 74.2,
        "avg_wage": 27800,
        "top_skills": [
            {"skill": "Data Entry Operator", "demand": 1850, "supply": 1100, "gap": 750},
            {"skill": "Field Technician", "demand": 1450, "supply": 920, "gap": 530},
            {"skill": "Retail Associate", "demand": 1350, "supply": 980, "gap": 370}
        ],
        "top_occupations": ["Digital Data Operator", "Field Service Engineer", "Store Operations Associate", "Logistics Coordinator"],
        "recommended_training": "Scale digital office administration certifications; expand field technician credentials in the Multi-Modal corridor.",
        "mobility_outflow": [
            {"destination": "Local Nagpur MMR", "share": "78%"},
            {"destination": "Pune Tech Corridor", "share": "15%"},
            {"destination": "Nashik Agro-Logistics", "share": "7%"}
        ],
        "layer_values": {
            "supply": 94,
            "demand": 97,
            "gap": -1300,
            "wage": 27800,
            "future_index": 9.1,
            "recommendation_priority": "High"
        }
    },
    # Bihar
    "Muzaffarpur": {
        "workforce_supply": 3100,
        "job_demand": 4200,
        "net_gap": -1100,
        "gap_level": "High Skill Gap",
        "employment_rate": 72.8,
        "retention_6m": 71.5,
        "avg_wage": 21200,
        "top_skills": [
            {"skill": "Solar Technician", "demand": 1150, "supply": 520, "gap": 630},
            {"skill": "Electrician", "demand": 950, "supply": 490, "gap": 460},
            {"skill": "Data Entry Operator", "demand": 820, "supply": 510, "gap": 310}
        ],
        "top_occupations": ["Solar PV Array Technician", "Power Distribution Electrician", "Office Data Operator"],
        "recommended_training": "Expand solar rooftop installer certifications and domestic electrical infrastructure programs.",
        "mobility_outflow": [
            {"destination": "Local Muzaffarpur Hub", "share": "65%"},
            {"destination": "Patna Enterprise Corridor", "share": "25%"},
            {"destination": "Inter-State Industrial Zones", "share": "10%"}
        ],
        "layer_values": {
            "supply": 75,
            "demand": 84,
            "gap": -1100,
            "wage": 21200,
            "future_index": 8.3,
            "recommendation_priority": "High"
        }
    },
    "Patna": {
        "workforce_supply": 4900,
        "job_demand": 6200,
        "net_gap": -1300,
        "gap_level": "High Skill Gap",
        "employment_rate": 77.2,
        "retention_6m": 75.0,
        "avg_wage": 24800,
        "top_skills": [
            {"skill": "Data Entry Operator", "demand": 1700, "supply": 950, "gap": 750},
            {"skill": "EV Technician", "demand": 1400, "supply": 850, "gap": 550},
            {"skill": "Field Technician", "demand": 1100, "supply": 600, "gap": 500}
        ],
        "top_occupations": ["Data Operations Specialist", "EV Fleet Technician", "Fiber Field Specialist"],
        "recommended_training": "Scale digital office automation, EV commercial fleet diagnostics, and broadband fiber splicing.",
        "mobility_outflow": [
            {"destination": "Local Patna Hub", "share": "74%"},
            {"destination": "Gaya Growth Corridor", "share": "14%"},
            {"destination": "Muzaffarpur Regional Centre", "share": "12%"}
        ],
        "layer_values": {
            "supply": 86,
            "demand": 92,
            "gap": -1300,
            "wage": 24800,
            "future_index": 8.9,
            "recommendation_priority": "High"
        }
    },
    "Gaya": {
        "workforce_supply": 2700,
        "job_demand": 3450,
        "net_gap": -750,
        "gap_level": "Moderate Shortage",
        "employment_rate": 70.4,
        "retention_6m": 69.8,
        "avg_wage": 19800,
        "top_skills": [
            {"skill": "Solar Technician", "demand": 1050, "supply": 580, "gap": 470},
            {"skill": "Retail Associate", "demand": 820, "supply": 540, "gap": 280},
            {"skill": "Electrician", "demand": 680, "supply": 450, "gap": 230}
        ],
        "top_occupations": ["Solar O&M Technician", "Customer Experience Lead", "Substation Electrician"],
        "recommended_training": "Boost grid-connected solar maintenance and modern retail operations credentials.",
        "mobility_outflow": [
            {"destination": "Local Gaya Corridor", "share": "62%"},
            {"destination": "Patna Enterprise Hub", "share": "26%"},
            {"destination": "Varanasi Inter-State Node", "share": "12%"}
        ],
        "layer_values": {
            "supply": 70,
            "demand": 77,
            "gap": -750,
            "wage": 19800,
            "future_index": 7.8,
            "recommendation_priority": "Medium"
        }
    },
    # Uttar Pradesh
    "Lucknow": {
        "workforce_supply": 5200,
        "job_demand": 6700,
        "net_gap": -1500,
        "gap_level": "High Skill Gap",
        "employment_rate": 77.9,
        "retention_6m": 75.8,
        "avg_wage": 26200,
        "top_skills": [
            {"skill": "Data Entry Operator", "demand": 1800, "supply": 1020, "gap": 780},
            {"skill": "EV Technician", "demand": 1400, "supply": 780, "gap": 620},
            {"skill": "Electrician", "demand": 1300, "supply": 840, "gap": 460}
        ],
        "top_occupations": ["Data Operations Specialist", "EV Powertrain Technician", "Industrial Electrician"],
        "recommended_training": "Expand IT office operations and EV mobility test lab apprenticeships.",
        "mobility_outflow": [
            {"destination": "Local Lucknow Cluster", "share": "75%"},
            {"destination": "Prayagraj Corridor", "share": "15%"},
            {"destination": "Varanasi Hub", "share": "10%"}
        ],
        "layer_values": {
            "supply": 90,
            "demand": 94,
            "gap": -1500,
            "wage": 26200,
            "future_index": 9.2,
            "recommendation_priority": "High"
        }
    },
    "Varanasi": {
        "workforce_supply": 3800,
        "job_demand": 4900,
        "net_gap": -1100,
        "gap_level": "High Skill Gap",
        "employment_rate": 73.5,
        "retention_6m": 72.1,
        "avg_wage": 22400,
        "top_skills": [
            {"skill": "Electrician", "demand": 1250, "supply": 680, "gap": 570},
            {"skill": "Solar Technician", "demand": 1000, "supply": 580, "gap": 420},
            {"skill": "Field Technician", "demand": 950, "supply": 610, "gap": 340}
        ],
        "top_occupations": ["Power Electrician", "Solar Smart Grid Installer", "Field Telecom Technician"],
        "recommended_training": "Introduce power switchgear hubs and solar microgrid installation modules.",
        "mobility_outflow": [
            {"destination": "Local Varanasi Cluster", "share": "68%"},
            {"destination": "Prayagraj Engineering Zone", "share": "20%"},
            {"destination": "Lucknow Metro Hub", "share": "12%"}
        ],
        "layer_values": {
            "supply": 80,
            "demand": 87,
            "gap": -1100,
            "wage": 22400,
            "future_index": 8.5,
            "recommendation_priority": "High"
        }
    },
    "Prayagraj": {
        "workforce_supply": 3500,
        "job_demand": 4500,
        "net_gap": -1000,
        "gap_level": "Moderate Shortage",
        "employment_rate": 72.1,
        "retention_6m": 71.0,
        "avg_wage": 21800,
        "top_skills": [
            {"skill": "Electrician", "demand": 1100, "supply": 620, "gap": 480},
            {"skill": "Field Technician", "demand": 980, "supply": 570, "gap": 410},
            {"skill": "Solar Technician", "demand": 850, "supply": 530, "gap": 320}
        ],
        "top_occupations": ["Industrial Electrician", "Field Hardware Technician", "Solar Energy Specialist"],
        "recommended_training": "Scale industrial electrification and hardware/telecom field maintenance.",
        "mobility_outflow": [
            {"destination": "Local Prayagraj Hub", "share": "66%"},
            {"destination": "Varanasi Industrial Belt", "share": "21%"},
            {"destination": "Lucknow Tech Corridor", "share": "13%"}
        ],
        "layer_values": {
            "supply": 78,
            "demand": 85,
            "gap": -1000,
            "wage": 21800,
            "future_index": 8.2,
            "recommendation_priority": "Medium"
        }
    }
}

LAYERS_CONFIG = [
    {
        "id": "supply",
        "name": "Skill Supply Map",
        "tagline": "Where are skilled/trained workers located in Maharashtra?",
        "description": "District skill availability, certification counts, and active workforce concentration across Pune, Nashik, and Nagpur.",
        "legend": [
            {"label": "High Availability (>4,000)", "color": "#10B981"},
            {"label": "Moderate Availability (2,500-4,000)", "color": "#F59E0B"},
            {"label": "Developing (<2,500)", "color": "#3B82F6"}
        ]
    },
    {
        "id": "demand",
        "name": "Job Demand Map",
        "tagline": "Where are Maharashtra employers actively hiring?",
        "description": "Aggregated employer job requisitions, portal postings, and sector expansion indices in Pune, Nashik, and Nagpur.",
        "legend": [
            {"label": "Very High Demand (>6,000)", "color": "#4338CA"},
            {"label": "High Demand (4,000-6,000)", "color": "#3B82F6"},
            {"label": "Moderate Demand (<4,000)", "color": "#93C5FD"}
        ]
    },
    {
        "id": "gap",
        "name": "Skill Gap Map",
        "tagline": "Where does demand exceed supply? (Gap = Demand - Supply)",
        "description": "Net deficit/surplus indicating critical shortages and priority training expansion targets in Maharashtra.",
        "legend": [
            {"label": "High Skill Gap (>1,000 Deficit)", "color": "#DC2626"},
            {"label": "Moderate Gap (500-1,000 Deficit)", "color": "#F97316"},
            {"label": "Balanced / Surplus", "color": "#10B981"}
        ]
    },
    {
        "id": "future_radar",
        "name": "Future Demand Radar",
        "tagline": "Which skills are growing fastest in Maharashtra?",
        "description": "Emerging tech trajectories: EV powertrain diagnostics, industrial automation, and cloud support.",
        "legend": [
            {"label": "High Growth Trajectory (>9.0)", "color": "#06B6D4"},
            {"label": "Moderate Growth (7.5-9.0)", "color": "#3B82F6"},
            {"label": "Stable / Legacy (<7.5)", "color": "#64748B"}
        ]
    },
    {
        "id": "mobility",
        "name": "Mobility Map",
        "tagline": "Where do trained workers move within Maharashtra?",
        "description": "Career migration corridors between Pune, Nashik, and Nagpur Golden Industrial Triangle.",
        "legend": [
            {"label": "Primary Golden Corridor", "color": "#EC4899"},
            {"label": "Secondary Regional Link", "color": "#F472B6"},
            {"label": "Intra-District Retention", "color": "#10B981"}
        ]
    },
    {
        "id": "wage",
        "name": "Wage Map",
        "tagline": "How do verified monthly wages vary across Maharashtra?",
        "description": "Aggregated verified monthly salary benchmarks and regional wage progression premiums.",
        "legend": [
            {"label": "Premium Tier (₹25,000+/mo)", "color": "#047857"},
            {"label": "Standard Tier (₹20,000-₹25,000/mo)", "color": "#10B981"},
            {"label": "Entry Tier (<₹20,000/mo)", "color": "#6EE7B7"}
        ]
    },
    {
        "id": "recommendation",
        "name": "Training Recommendation Map",
        "tagline": "Where should Maharashtra training capacity expand?",
        "description": "Synthesized decision-support layer linking supply, employer demand, retention, and training batch capacity.",
        "legend": [
            {"label": "High Expansion Priority", "color": "#7C3AED"},
            {"label": "Targeted Curriculum Modernization", "color": "#8B5CF6"},
            {"label": "Balanced Capacity", "color": "#C4B5FD"}
        ]
    }
]

@router.get("/intelligence")
def get_intelligence(
    district: Optional[str] = None,
    sector: Optional[str] = None,
    role: Optional[str] = None,
    skill: Optional[str] = None,
) -> Dict[str, Any]:
    return build_intelligence(district=district, sector=sector, role=role, skill=skill)

@router.get("/layers")
def get_layers() -> List[Dict[str, Any]]:
    return LAYERS_CONFIG

@router.get("/districts")
def get_all_districts() -> List[Dict[str, Any]]:
    from geography import GEOGRAPHY
    coords = {item["name"]: item for item in DISTRICTS}
    extra = {
        "Muzaffarpur": (26.1209, 85.3647), "Patna": (25.5941, 85.1376), "Gaya": (24.7955, 84.9994),
        "Lucknow": (26.8467, 80.9462), "Varanasi": (25.3176, 82.9739), "Prayagraj": (25.4358, 81.8463),
    }
    results = []
    for state, names in GEOGRAPHY.items():
        for name in names:
            d = coords.get(name, {})
            lat, lng = extra.get(name, (d.get("lat", 0), d.get("lng", 0)))
            results.append({
                "name": name,
                "state": state,
                "lat": d.get("lat", lat),
                "lng": d.get("lng", lng),
                "division": d.get("division", state),
                "workforce_supply": DISTRICT_METRICS.get(name, {}).get("workforce_supply", 0),
                "job_demand": DISTRICT_METRICS.get(name, {}).get("job_demand", 0),
                "net_gap": DISTRICT_METRICS.get(name, {}).get("net_gap", 0),
                "gap_level": DISTRICT_METRICS.get(name, {}).get("gap_level", "From trainee records"),
                "employment_rate": DISTRICT_METRICS.get(name, {}).get("employment_rate", 0),
                "retention_6m": DISTRICT_METRICS.get(name, {}).get("retention_6m", 0),
                "avg_wage": DISTRICT_METRICS.get(name, {}).get("avg_wage", 0),
                "layer_values": DISTRICT_METRICS.get(name, {}).get("layer_values", {}),
            })
    return results

@router.get("/district/{district_name}")
def get_district_details(district_name: str) -> Dict[str, Any]:
    matched = None
    for name, info in DISTRICT_METRICS.items():
        if name.lower() == district_name.lower():
            matched = info
            break
    
    if not matched:
        people = [t for t in db.trainees if t.district.lower() == district_name.lower()]
        return {
            "district": district_name,
            "notice": "Counts are from the synthetic prototype cohort for this district.",
            "tracked_trainees": len(people),
            "employed": sum(1 for t in people if t.employment_status.value == "Employed"),
        }
    return matched

@router.get("/mobility-flows")
def get_mobility_flows() -> Dict[str, Any]:
    return {
        "origin": "Pune",
        "flows": [
            {"destination": "Nagpur", "share": 18, "avg_wage": "₹26K–₹38K", "primary_roles": "Cloud Operations, Financial Services, Tech Sales"},
            {"destination": "Nashik Industrial Belt", "share": 10, "avg_wage": "₹19K–₹27K", "primary_roles": "Precision Tooling, Plant Maintenance"},
            {"destination": "Local Pune Nodes (Chakan/Hinjewadi)", "share": 72, "avg_wage": "₹22K–₹35K", "primary_roles": "EV Diagnostics, CNC Operation, Mechatronics"}
        ]
    }
