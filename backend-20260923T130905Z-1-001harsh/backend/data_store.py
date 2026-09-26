import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from models import (
    Trainee, VerificationStatus, EmploymentStatus, RetentionStatus,
    FollowUpStage, FollowUpStatus, CommChannel, CareerEvent,
    VerificationItem, FollowUpRecord
)
from geography import GEOGRAPHY, STATE_CODES

# Geographic Context: Three States, Exactly Three Districts Each
DISTRICTS = [
    # Bihar
    {"name": "Muzaffarpur", "state": "Bihar", "lat": 26.1209, "lng": 85.3647, "division": "Tirhut Division", "zone": "North Bihar Industrial & Agro Hub"},
    {"name": "Patna", "state": "Bihar", "lat": 25.6093, "lng": 85.1376, "division": "Patna Division", "zone": "Central Bihar Enterprise Corridor"},
    {"name": "Gaya", "state": "Bihar", "lat": 24.7914, "lng": 85.0002, "division": "Magadh Division", "zone": "South Bihar Energy & Tourism Corridor"},
    # Uttar Pradesh
    {"name": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462, "division": "Lucknow Division", "zone": "Awadh Industrial & Tech Corridor"},
    {"name": "Varanasi", "state": "Uttar Pradesh", "lat": 25.3176, "lng": 82.9739, "division": "Varanasi Division", "zone": "Eastern UP Precision & Textile Hub"},
    {"name": "Prayagraj", "state": "Uttar Pradesh", "lat": 25.4358, "lng": 81.8463, "division": "Prayagraj Division", "zone": "Triveni Heavy Engineering & Logistics Hub"},
    # Maharashtra
    {"name": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567, "division": "Pune Division", "zone": "Western Maharashtra Industrial Corridor"},
    {"name": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lng": 73.7898, "division": "Nashik Division", "zone": "Northern Maharashtra Agro-Industrial Belt"},
    {"name": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lng": 79.0882, "division": "Nagpur Division", "zone": "Vidarbha Multi-Modal Hub"}
]

STATE_NAME = "Multi-State (Bihar, Uttar Pradesh, Maharashtra)"

CANONICAL_SKILLS = [
    "Data Entry Operator",
    "Solar Technician",
    "Electrician",
    "EV Technician",
    "Retail Associate",
    "Field Technician"
]

# Multi-State Skilling Programmes aligned with the 6 major economic trade areas
PROGRAMMES = [
    {
        "name": "State Skilling Mission - Data Entry & Office Automation",
        "sector": "IT & Digital Services",
        "primary_skill": "Data Entry Operator",
        "skills": ["Data Entry Operator", "Advanced MS Office & Excel", "Database Record Management", "Digital Documentation", "Speed & Accuracy Typing"],
        "target_districts": ["Muzaffarpur", "Patna", "Gaya", "Lucknow", "Varanasi", "Prayagraj", "Pune", "Nashik", "Nagpur"]
    },
    {
        "name": "Suryamitra - Solar PV Installation & Maintenance",
        "sector": "Renewable Energy",
        "primary_skill": "Solar Technician",
        "skills": ["Solar Technician", "Solar PV Array Mounting", "Inverter & Battery Wiring", "Grid Synchronization", "Electrical Safety & Earthing"],
        "target_districts": ["Muzaffarpur", "Patna", "Gaya", "Lucknow", "Varanasi", "Prayagraj", "Pune", "Nashik", "Nagpur"]
    },
    {
        "name": "Power Sector Skill Council - Domestic & Industrial Electrician",
        "sector": "Electrical & Power",
        "primary_skill": "Electrician",
        "skills": ["Electrician", "Wiring & Conduit Installation", "Switchgear & Panel Board Assembly", "Transformer Maintenance", "Fault Diagnostics & Safety"],
        "target_districts": ["Muzaffarpur", "Patna", "Gaya", "Lucknow", "Varanasi", "Prayagraj", "Pune", "Nashik", "Nagpur"]
    },
    {
        "name": "MSSD - Electric Vehicle & Battery Diagnostics",
        "sector": "EV & Clean Mobility",
        "primary_skill": "EV Technician",
        "skills": ["EV Technician", "EV Powertrain Diagnostics", "BMS Calibration", "High Voltage Safety", "Wiring Harness Inspection"],
        "target_districts": ["Muzaffarpur", "Patna", "Gaya", "Lucknow", "Varanasi", "Prayagraj", "Pune", "Nashik", "Nagpur"]
    },
    {
        "name": "Retail Association - Retail Sales & Store Operations",
        "sector": "Retail & E-commerce",
        "primary_skill": "Retail Associate",
        "skills": ["Retail Associate", "POS Billing Systems", "Omnichannel Fulfillment", "Visual Merchandising", "Customer Relationship Management"],
        "target_districts": ["Muzaffarpur", "Patna", "Gaya", "Lucknow", "Varanasi", "Prayagraj", "Pune", "Nashik", "Nagpur"]
    },
    {
        "name": "Telecom & Hardware Council - Field Technician & Maintenance",
        "sector": "Field Operations & Hardware",
        "primary_skill": "Field Technician",
        "skills": ["Field Technician", "Broadband & Fiber Splicing", "Hardware Troubleshooting", "CCTV & Security Installation", "Field Service SLA Support"],
        "target_districts": ["Muzaffarpur", "Patna", "Gaya", "Lucknow", "Varanasi", "Prayagraj", "Pune", "Nashik", "Nagpur"]
    }
]

PROGRAMME_PRIMARY_SKILLS = {p["name"]: p["primary_skill"] for p in PROGRAMMES}

# Local Training Centres by District
DISTRICT_TRAINING_CENTRES = {
    # Bihar
    "Muzaffarpur": [
        "Government ITI Muzaffarpur",
        "North Bihar Technical Skilling Institute",
        "Muzaffarpur Vocational Training Centre",
        "Kaushal Vikas Kendra Muzaffarpur"
    ],
    "Patna": [
        "Government ITI Digha (Patna)",
        "Bihar State Skill Development Centre Patna",
        "Patliputra Vocational Training Academy",
        "National Skill Training Institute Patna"
    ],
    "Gaya": [
        "Government ITI Gaya",
        "Bodh Gaya Skill Development Centre",
        "Magadh Technical Training Institute",
        "Gaya Industrial Training Centre"
    ],
    # Uttar Pradesh
    "Lucknow": [
        "Government ITI Aliganj (Lucknow)",
        "UP Skill Development Mission Hub Lucknow",
        "Lucknow Advanced Vocational Institute",
        "Gomti Nagar Technical Training Centre"
    ],
    "Varanasi": [
        "Government ITI Karaundi (Varanasi)",
        "Kashi Vocational Training Academy",
        "Banaras Skill Development Hub",
        "Varanasi Precision Engineering Centre"
    ],
    "Prayagraj": [
        "Government ITI Naini (Prayagraj)",
        "Sangam Technical Training Institute",
        "Prayagraj Vocational Skilling Centre",
        "Naini Industrial Training Academy"
    ],
    # Maharashtra
    "Pune": [
        "Government ITI Aundh (Pune)",
        "MSSD Skilling Hub Chakan",
        "Pimpri-Chinchwad Advanced Vocational Centre",
        "Tata-STRIVE Academy Hinjewadi"
    ],
    "Nashik": [
        "Government ITI Satpur (Nashik)",
        "Amrutvahini Technical Vocational Center",
        "Nashik Engineering Cluster Skilling Lab",
        "Maharashtra Agro-Skilling Hub Dindori"
    ],
    "Nagpur": [
        "Government ITI Nagpur",
        "Vidarbha Skill Development Hub",
        "MIHAN Technical Training Institute",
        "Butibori Industrial Training Centre"
    ]
}

# District & Sector Specific Employers for the 6 Canonical Trades
EMPLOYERS_BY_DISTRICT_AND_SKILL = {
    "Data Entry Operator": {
        "Pune": ["TCS Sahyadri Park IT", "Persistent Systems Hinjewadi", "Infosys Pune Phase 2", "Wipro Digital Pune"],
        "Nashik": ["Winjit Technologies Nashik", "Datamatics Global Nashik Road", "Nashik Infotech Hub"],
        "Nagpur": ["TCS MIHAN Nagpur", "Infosys SEZ Nagpur", "Persistent Systems IT Park"],
        "Patna": ["TCS Ion Centre Patna", "HCL State Delivery Centre Patna", "Bihar e-Governance Services"],
        "Muzaffarpur": ["North Bihar IT Solutions", "Digital Bihar Hub Muzaffarpur", "Tirhut Infotech"],
        "Gaya": ["Gaya Digital Services", "Magadh IT Infotech", "Bodh Gaya Data Ops"],
        "Lucknow": ["TCS Gomti Nagar Lucknow", "HCL Technologies IT City", "Tech Mahindra Cyber Hub"],
        "Varanasi": ["Banaras SoftTech Centre", "Kashi Digital Solutions", "Varanasi IT Services"],
        "Prayagraj": ["Naini Software Technology Park", "Prayag InfoTech Services", "Sangam Digital Ops"]
    },
    "Solar Technician": {
        "Pune": ["Suzlon Energy Pune", "Tata Power Solar Pune Hub", "CleanMax Solar Solutions"],
        "Nashik": ["Maharashtra Solar Park Dindori", "Sula Solar Green Initiative", "Nashik Rooftop Solar"],
        "Nagpur": ["Mahagenco Solar Project Butibori", "Orange City Solar Power", "Vidarbha Solar Energy"],
        "Patna": ["Bihar Renewable Energy Solutions", "Patna Solar Rooftop Hub", "Surya Urja Bihar"],
        "Muzaffarpur": ["North Bihar Solar Hub", "Mithila Solar Energy EPC", "Tirhut Solar Solutions"],
        "Gaya": ["Bodh Gaya Solar Power Grid", "Magadh Clean Energy Works", "SunPower Bihar Gaya"],
        "Lucknow": ["UPNEDA Solar Installation Hub", "Awadh Solar Power Works", "Lucknow Green Solar"],
        "Varanasi": ["Kashi Solar Smart Grid", "Banaras Rooftop Solar Works", "Purvanchal Solar Energy"],
        "Prayagraj": ["Triveni Solar Energy Plant Naini", "Sangam Solar Power Systems", "Prayag Green Energy"]
    },
    "Electrician": {
        "Pune": ["Schneider Electric Bhosari", "L&T Electrical & Automation Pune", "Siemens Industrial Pune"],
        "Nashik": ["Crompton Greaves Ambad", "Legrand India Satpur", "ABB Power Nashik"],
        "Nagpur": ["Mahatransco Substation Butibori", "Bajaj Electricals MIHAN", "Vidarbha Power Systems"],
        "Patna": ["South Bihar Power Distribution Co", "Bihar State Electricity Board", "Patliputra Electrical Works"],
        "Muzaffarpur": ["North Bihar Power Distribution (NBPDCL)", "Muzaffarpur Electrical Substation", "Tirhut Power Line Ops"],
        "Gaya": ["Magadh Power Grid Gaya", "Gaya Transmission Services", "Bodhi Electric Infrastructure"],
        "Lucknow": ["Madhyanchal Vidyut Vitaran Nigam", "BHEL Ancillary Lucknow", "Lucknow Power & Grid"],
        "Varanasi": ["Purvanchal Vidyut Vitaran Nigam (PVVNL)", "Kashi Electric Works", "Banaras Switchgear Hub"],
        "Prayagraj": ["Alstom Grid Naini", "GE T&D India Prayagraj", "Sangam Power Distribution"]
    },
    "EV Technician": {
        "Pune": ["Tata Motors EV Chakan", "Bajaj Auto EV Division Akurdi", "Ather Energy Hub Baner", "Kalyani Powertrain R&D"],
        "Nashik": ["Mahindra & Mahindra Plant Igatpuri", "Bosch India Satpur", "Minda Corporation EV"],
        "Nagpur": ["JSW EV Component Hub Butibori", "Mahindra Auto Logistics MIHAN", "Nagpur E-Mobility Fleet"],
        "Patna": ["Hero Electric Hub Patna", "Kinetic Green Service Centre", "Patliputra EV Mobility"],
        "Muzaffarpur": ["North Bihar EV Fleet Hub", "EcoRide Electric Service Centre", "Tirhut EV Works"],
        "Gaya": ["Magadh EV Mobility Centre", "Gaya Green Energy Fleet", "Bodh Gaya E-Rickshaw & EV Hub"],
        "Lucknow": ["Tata Motors Lucknow Plant", "Lohia Auto Industries", "Lucknow Green Wheels"],
        "Varanasi": ["Banaras Electric Auto Works", "Varanasi EV Mobility Hub", "Kashi E-Mobility Solutions"],
        "Prayagraj": ["Prayag EV Service Hub", "Naini Electric Vehicles", "Sangam Green Mobility"]
    },
    "Retail Associate": {
        "Pune": ["Reliance Retail Smart Bazaar Phoenix", "Trent Ltd (Zudio) FC Road", "DMart Pune"],
        "Nashik": ["DMart Avenue Supermarts Nashik Road", "Reliance Smart City Centre", "Zudio Nashik"],
        "Nagpur": ["Shoppers Stop Nagpur", "Westside Dharampeth", "Big Bazaar Nagpur"],
        "Patna": ["City Centre Mall Retail Hub Patna", "Reliance Trends Bailey Road", "DMart Patna"],
        "Muzaffarpur": ["Grand Mall Retail Associates", "Smart Point Muzaffarpur", "V-Mart Muzaffarpur"],
        "Gaya": ["Gaya Central Mall Retail", "V-Mart Retail Gaya", "Reliance Trends Gaya"],
        "Lucknow": ["Phoenix Palassio Retail Hub", "Lulu Mall Lucknow", "Reliance Retail Gomti Nagar"],
        "Varanasi": ["IP Sigra Retail Centre", "JHV Mall Varanasi", "Zudio Kashi"],
        "Prayagraj": ["Civil Lines Retail Square", "PVR Vinayak City Centre", "Reliance Smart Naini"]
    },
    "Field Technician": {
        "Pune": ["Jio Fiber Field Operations Pune", "Airtel Broadband Hub", "Tata Play Services Pune"],
        "Nashik": ["BSNL Fiber Splicing Unit Nashik", "Jio Digital Field Nashik", "Voltas Service Center"],
        "Nagpur": ["Airtel Fiber Maintenance MIHAN", "Jio Infra Services Butibori", "Godrej Field Service"],
        "Patna": ["RailTel Fiber Ops Patna", "Jio Point Bihar HQ", "Airtel Teleinfra Patna"],
        "Muzaffarpur": ["North Bihar Fiber Telecom Hub", "BSNL Broadband Field Depot", "Jio Centre Muzaffarpur"],
        "Gaya": ["Magadh Broadband & CCTV Field Ops", "Airtel Field Operations Gaya", "BSNL Gaya Hub"],
        "Lucknow": ["Jio State Network Operations Lucknow", "Airtel Field Engineering Hub", "UP Telecom Field Hub"],
        "Varanasi": ["Kashi Fiber & Smart City Field Ops", "BSNL Eastern Telecom Depot", "Jio Network Kashi"],
        "Prayagraj": ["Sangam Broadband & Hardware Splicing", "Airtel Field Depot Naini", "Naini Hardware Maintenance"]
    }
}

FIRST_NAMES_BIHAR_UP = [
    "Aarav", "Ananya", "Rahul", "Neha", "Imran", "Pooja", "Suresh", "Kavita", "Amit", "Rani",
    "Priya", "Vivek", "Rajesh", "Sunita", "Vikas", "Rakesh", "Manish", "Deepa", "Santosh", "Jyoti",
    "Ankit", "Swati", "Alok", "Archana", "Sandeep", "Ritu", "Deepak", "Shweta", "Manoj", "Poonam",
    "Ravi", "Shalini", "Ajay", "Pratima", "Pankaj", "Suman", "Gaurav", "Nidhi", "Abhishek", "Rekha",
    "Rohit", "Priyanka", "Sunil", "Vandana", "Satish", "Meena", "Vinay", "Sarita", "Mukesh", "Anjali",
    "Ashish", "Kajal", "Dharmendra", "Preeti", "Sanjay", "Kiran", "Naveen", "Mamta", "Bipin", "Anita",
    "Shyam", "Seema", "Kamal", "Usha", "Arun", "Chanda", "Brijesh", "Geeta", "Harish", "Babita",
    "Lalit", "Shanti", "Guddu", "Kusum", "Pradeep", "Tara", "Akhilesh", "Laxmi", "Rambabu", "Madhu"
]

LAST_NAMES_BIHAR_UP = [
    "Kumar", "Sharma", "Yadav", "Singh", "Das", "Verma", "Jha", "Mishra", "Gupta", "Tiwari",
    "Pandey", "Prasad", "Chaudhary", "Shukla", "Tripathi", "Patel", "Srivastava", "Dubey", "Rai",
    "Thakur", "Paswan", "Sah", "Sinha", "Ojha", "Chauhan", "Maurya", "Rajak", "Bind", "Kushwaha", "Kashyap",
    "Manjhi", "Agrahari", "Keshri", "Bhagat", "Khatri", "Sahu", "Poddar", "Mahato", "Kanojia", "Chaurasia",
    "Goswami", "Upadhyay", "Dwivedi", "Pathak", "Chaubey", "Bhardwaj", "Dixit", "Awasthi", "Bajpai", "Agrawal"
]

FIRST_NAMES_MH = [
    "Aditya", "Pooja", "Rohan", "Sneha", "Tanmay", "Shruti", "Akshay", "Gauri", "Pranav", "Anjali",
    "Siddharth", "Kavita", "Saurabh", "Priyanka", "Nikhil", "Neha", "Mayur", "Sayali", "Omkar", "Divya",
    "Sachin", "Manasi", "Tejas", "Ashwini", "Amol", "Kalyani", "Swapnil", "Pallavi", "Ganesh", "Vaishnavi",
    "Chetan", "Meenal", "Rahul", "Rupali", "Vikram", "Shweta", "Abhishek", "Mugdha", "Kunal", "Rutuja",
    "Harshal", "Smita", "Yogesh", "Leena", "Nitin", "Aparna", "Vinayak", "Suvarna", "Vishal", "Radhika",
    "Mandar", "Shilpa", "Sameer", "Tejashree", "Digambar", "Madhuri", "Ajinkya", "Shraddha", "Dnyanesh", "Sonali",
    "Mahesh", "Varsha", "Parag", "Tanuja", "Sandip", "Komal", "Vaibhav", "Prachi", "Baban", "Vidya",
    "Sanket", "Pradnya", "Avinash", "Dipali", "Shrikant", "Archana", "Kedar", "Prajakta", "Milind", "Sampada"
]

LAST_NAMES_MH = [
    "Patil", "Deshmukh", "Kadam", "Jadhav", "Shinde", "Pawar", "Chavan", "Bhosale", "More", "Gaikwad",
    "Tambe", "Wagh", "Kulkarni", "Deshpande", "Joshi", "Bhide", "Chitnis", "Sawant", "Salunkhe", "Thakur",
    "Rane", "Gore", "Bhandari", "Jagtap", "Sonawane", "Kale", "Thorat", "Mahajan", "Khot", "Gawande",
    "Suryavanshi", "Ghate", "Gholap", "Ghuge", "Dumbre", "Dhumal", "Londhe", "Mohite", "Ghorpade", "Satpute",
    "Shelke", "Shirke", "Mane", "Mhatre", "Nikam", "Nimbalkar", "Ingale", "Borse", "Kharat", "Gawali"
]

ALL_VERIFICATION_STATUSES = [
    VerificationStatus.MULTI_VERIFIED,
    VerificationStatus.EMPLOYER_VERIFIED,
    VerificationStatus.TRAINING_VERIFIED,
    VerificationStatus.ASSESSMENT_VERIFIED,
    VerificationStatus.SELF_REPORTED,
    VerificationStatus.PENDING_VERIFICATION,
    VerificationStatus.CONFLICTING_INFORMATION,
    VerificationStatus.INSUFFICIENT_EVIDENCE
]


def get_verification_sources(status_str: str) -> List[str]:
    if status_str == "Multi-Verified":
        return ["Trainee confirmation", "Employer confirmation", "Programme/authorized data"]
    elif status_str == "Employer Verified":
        return ["Employer confirmation", "Programme/authorized data"]
    elif status_str == "Training Verified":
        return ["Programme/authorized data", "Training Centre Biometrics"]
    elif status_str == "Assessment Verified":
        return ["Sector Skill Council Evaluation", "Programme/authorized data"]
    elif status_str in ("Self Reported", "Self-Reported"):
        return ["Trainee confirmation"]
    elif status_str == "Conflicting Information":
        return ["Trainee confirmation", "Employer registry mismatch"]
    elif status_str == "Insufficient Evidence":
        return ["Initial registration entry"]
    else:
        return ["Awaiting multi-stakeholder verification"]


def get_verification_history(status_str: str, updated_date: str) -> List[Dict[str, str]]:
    if status_str == "Multi-Verified":
        return [
            {"source": "Programme / Authorized SSDM Registry", "date": "2024-08-20", "status": "Training Verified"},
            {"source": "Employer HR Confirmation Desk", "date": "2026-03-05", "status": "Employer Verified"},
            {"source": "Trainee WhatsApp Follow-up Check-in", "date": updated_date, "status": "Multi-Verified"}
        ]
    elif status_str == "Employer Verified":
        return [
            {"source": "Programme / Authorized SSDM Registry", "date": "2024-08-20", "status": "Training Verified"},
            {"source": "Employer HR Confirmation Desk", "date": updated_date, "status": "Employer Verified"}
        ]
    elif status_str == "Training Verified":
        return [
            {"source": "Training Centre Biometric AEPS Attendance Portal", "date": updated_date, "status": "Training Verified"}
        ]
    elif status_str == "Assessment Verified":
        return [
            {"source": "Sector Skill Council Third-Party Assessment Scorecard", "date": updated_date, "status": "Assessment Verified"}
        ]
    elif status_str in ("Self Reported", "Self-Reported"):
        return [
            {"source": "Trainee WhatsApp Micro-Checkin", "date": updated_date, "status": "Self-Reported"}
        ]
    elif status_str == "Conflicting Information":
        return [
            {"source": "Trainee WhatsApp Self-Report", "date": "2026-03-01", "status": "Self Reported"},
            {"source": "Employer Wage Return Signal", "date": updated_date, "status": "Conflicting Information"}
        ]
    elif status_str == "Insufficient Evidence":
        return [
            {"source": "Preliminary Batch Register", "date": updated_date, "status": "Insufficient Evidence"}
        ]
    else:
        return [
            {"source": "SkillPulse AI Intake Engine", "date": updated_date, "status": "Pending Verification"}
        ]


def build_checkpoints(duration: int, status: EmploymentStatus, role: str, employer: str, verif_status: str, wage: Optional[int]) -> List[Dict[str, Any]]:
    working = status in (EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP)
    stages = [
        ("30D", 1, "30-Day Checkpoint", "1 Month"),
        ("90D", 3, "90-Day Post-Placement Checkpoint", "3 Months"),
        ("180D", 6, "180-Day Retention Milestone", "6 Months"),
        ("270D", 9, "270-Day Career Progress Checkpoint", "9 Months"),
        ("9M", 9, "9-Month Outcome Checkpoint", "9 Months"),
        ("12M", 12, "12-Month Long-Term Outcome Milestone", "12 Months")
    ]
    rows = []
    wage_str = f"₹{wage:,}/mo" if wage else "₹18,000–₹24,000/mo"
    last_date = "2026-03-12"
    
    for label, months, title, dur_label in stages:
        reached = working and duration >= months
        is_12m = (label == "12M")
        is_9m = (label == "9M")
        cp_verif = verif_status if reached else "Pending Verification"
        
        row = {
            "stage": label,
            "title": title,
            "months": months,
            "status": "Confirmed" if reached else "Pending",
            "employment_status": status.value if reached else "Not yet due",
            "role": role if reached else (role if working else None),
            "employer": employer if reached else (employer if working else None),
            "employment_duration": f"{duration} months" if reached else dur_label,
            "role_relevance": "Relevant" if reached else "Pending Confirmation",
            "skill_utilisation": "High" if reached else "Pending Confirmation",
            "retention_status": (
                "Retained through 12 months (Long-Term Outcome)" if (reached and is_12m)
                else ("Retained 9M+" if (reached and is_9m)
                else ("Retained" if reached else "Pending Milestone"))
            ),
            "verification_status": cp_verif,
            "verification_sources": get_verification_sources(cp_verif),
            "verification_history": get_verification_history(cp_verif, last_date),
            "last_verification_date": last_date if reached else "Scheduled",
            "wage_band": wage_str if reached else "Pending Wage Verification",
            "update_source": "Employer confirmation portal & quarterly trainee micro-checkin" if reached else "Scheduled automated check-in",
            "last_updated": last_date if reached else "Scheduled",
            "long_term_outcome": is_12m,
            "employer_verified": reached and verif_status in ("Employer Verified", "Multi-Verified"),
            "trainee_confirmed": reached
        }
        rows.append(row)
    return rows


class DataStore:
    def __init__(self):
        self.trainees: List[Trainee] = []
        self.jobs: List[Dict[str, Any]] = []
        self.applications: List[Dict[str, Any]] = []
        self.employer_outcomes: List[Dict[str, Any]] = []
        self.organisations: List[Dict[str, Any]] = []
        self._initialize_dataset()
        from ecosystem import expand_store
        expand_store(self)

    def _initialize_dataset(self):
        random.seed(42)  # Fixed seed for consistent reproducible demo dataset
        self.trainees = []
        
        # We need ~900 trainees distributed evenly across 3 states and exactly 3 districts each:
        # Bihar: Muzaffarpur (100), Patna (100), Gaya (100) = 300
        # Uttar Pradesh: Lucknow (100), Varanasi (100), Prayagraj (100) = 300
        # Maharashtra: Pune (100), Nashik (100), Nagpur (100) = 300
        # Total = 900 trainees.

        # 5 Showcase Accounts for presentation & testing
        showcases = [
            {
                "name": "Aarav Kumar", "phone": "9800000001", "state": "Bihar", "district": "Muzaffarpur",
                "id": "SP-BR-10001", "prog": "Suryamitra - Solar PV Installation & Maintenance",
                "role": "Solar Technician", "emp": "North Bihar Solar Hub", "status": EmploymentStatus.EMPLOYED,
                "dur": 14, "wage": 24500, "verif": VerificationStatus.MULTI_VERIFIED
            },
            {
                "name": "Ananya Sharma", "phone": "9800000002", "state": "Bihar", "district": "Patna",
                "id": "SP-BR-10002", "prog": "MSSD - Electric Vehicle & Battery Diagnostics",
                "role": "EV Technician", "emp": None, "status": EmploymentStatus.UNEMPLOYED,
                "dur": 0, "wage": None, "verif": VerificationStatus.TRAINING_VERIFIED
            },
            {
                "name": "Rahul Yadav", "phone": "9800000003", "state": "Bihar", "district": "Gaya",
                "id": "SP-BR-10003", "prog": "State Skilling Mission - Data Entry & Office Automation",
                "role": "Data Entry Operator", "emp": "Magadh IT Infotech", "status": EmploymentStatus.APPRENTICESHIP,
                "dur": 4, "wage": 16500, "verif": VerificationStatus.ASSESSMENT_VERIFIED
            },
            {
                "name": "Pooja Patil", "phone": "9800000004", "state": "Maharashtra", "district": "Pune",
                "id": "SP-MH-30001", "prog": "MSSD - Electric Vehicle & Battery Diagnostics",
                "role": "EV Technician", "emp": "Tata Motors EV Chakan", "status": EmploymentStatus.EMPLOYED,
                "dur": 13, "wage": 28500, "verif": VerificationStatus.MULTI_VERIFIED
            },
            {
                "name": "Amit Verma", "phone": "9800000005", "state": "Uttar Pradesh", "district": "Lucknow",
                "id": "SP-UP-20001", "prog": "Telecom & Hardware Council - Field Technician & Maintenance",
                "role": "Field Technician", "emp": "Jio State Network Operations Lucknow", "status": EmploymentStatus.EMPLOYED,
                "dur": 10, "wage": 23000, "verif": VerificationStatus.EMPLOYER_VERIFIED
            }
        ]

        target_distribution = [
            ("Bihar", "Muzaffarpur", 400),
            ("Bihar", "Patna", 400),
            ("Bihar", "Gaya", 400),
            ("Uttar Pradesh", "Lucknow", 400),
            ("Uttar Pradesh", "Varanasi", 400),
            ("Uttar Pradesh", "Prayagraj", 400),
            ("Maharashtra", "Pune", 400),
            ("Maharashtra", "Nashik", 400),
            ("Maharashtra", "Nagpur", 400),
        ]

        seq_by_state = {"Bihar": 10001, "Uttar Pradesh": 20001, "Maharashtra": 30001}
        trn_idx = 1

        for state, district, target_count in target_distribution:
            code = STATE_CODES[state]
            first_names = FIRST_NAMES_MH if state == "Maharashtra" else FIRST_NAMES_BIHAR_UP
            last_names = LAST_NAMES_MH if state == "Maharashtra" else LAST_NAMES_BIHAR_UP
            centres = DISTRICT_TRAINING_CENTRES.get(district, ["District Skill Development Centre"])

            # Ensure all 9 programmes and skills are represented in every district
            matching_progs = PROGRAMMES

            for i in range(target_count):
                seq = seq_by_state[state]
                seq_by_state[state] += 1
                sp_id = f"SP-{code}-{seq}"
                t_id = f"TRN-{code}-2025-{trn_idx:04d}"
                trn_idx += 1

                # Check if this matches a showcase account
                showcase = next((s for s in showcases if s["district"] == district and s["state"] == state and s.get("_used") is not True), None)
                if showcase and i == 0:
                    showcase["_used"] = True
                    name = showcase["name"]
                    phone = showcase["phone"]
                    f_name = name.split(" ")[0].lower()
                    l_name = name.split(" ")[1].lower() if " " in name else "trainee"
                    email = f"{f_name}.{l_name}@skillpulse.in"
                    sp_id = showcase["id"]
                    emp_status = showcase["status"]
                    duration = showcase["dur"]
                    current_wage = showcase["wage"]
                    verif_status = showcase["verif"]
                    prog_info = next((p for p in PROGRAMMES if p["name"] == showcase["prog"]), matching_progs[0])
                    job_role = showcase["role"]
                    employer = showcase["emp"]
                else:
                    first_name = random.choice(first_names)
                    last_name = random.choice(last_names)
                    name = f"{first_name} {last_name}"
                    phone = f"9{random.randint(6, 9)}{random.randint(10000000, 99999999)}"
                    email = f"{first_name.lower().replace(' ', '')}.{last_name.lower().replace(' ', '')}@skillpulse.in"

                    # Differentiated funnel distribution per state (Requirement 4)
                    outcome_roll = random.random()
                    if state == "Bihar":
                        # Bihar: Higher self-employment in local repair/solar micro-enterprises
                        if outcome_roll < 0.58:
                            emp_status = EmploymentStatus.EMPLOYED
                            duration = random.choice([3, 6, 8, 9, 12, 14])
                        elif outcome_roll < 0.77:
                            emp_status = EmploymentStatus.SELF_EMPLOYED
                            duration = random.choice([4, 6, 9, 12])
                        elif outcome_roll < 0.84:
                            emp_status = EmploymentStatus.APPRENTICESHIP
                            duration = random.choice([2, 4, 6])
                        elif outcome_roll < 0.90:
                            emp_status = EmploymentStatus.FURTHER_EDUCATION
                            duration = 0
                        elif outcome_roll < 0.97:
                            emp_status = EmploymentStatus.UNEMPLOYED
                            duration = 0
                        else:
                            emp_status = EmploymentStatus.UNKNOWN
                            duration = 0
                    elif state == "Uttar Pradesh":
                        # Uttar Pradesh: Balanced trade, retail, and service cluster employment
                        if outcome_roll < 0.61:
                            emp_status = EmploymentStatus.EMPLOYED
                            duration = random.choice([3, 6, 8, 9, 12, 14, 16])
                        elif outcome_roll < 0.74:
                            emp_status = EmploymentStatus.SELF_EMPLOYED
                            duration = random.choice([4, 6, 9, 12])
                        elif outcome_roll < 0.82:
                            emp_status = EmploymentStatus.APPRENTICESHIP
                            duration = random.choice([2, 4, 6, 8])
                        elif outcome_roll < 0.88:
                            emp_status = EmploymentStatus.FURTHER_EDUCATION
                            duration = 0
                        elif outcome_roll < 0.96:
                            emp_status = EmploymentStatus.UNEMPLOYED
                            duration = 0
                        else:
                            emp_status = EmploymentStatus.UNKNOWN
                            duration = 0
                    else:
                        # Maharashtra: High formal industrial auto/EV manufacturing placement
                        if outcome_roll < 0.66:
                            emp_status = EmploymentStatus.EMPLOYED
                            duration = random.choice([3, 6, 9, 12, 14, 16, 18])
                        elif outcome_roll < 0.76:
                            emp_status = EmploymentStatus.SELF_EMPLOYED
                            duration = random.choice([4, 6, 9, 12])
                        elif outcome_roll < 0.85:
                            emp_status = EmploymentStatus.APPRENTICESHIP
                            duration = random.choice([3, 6, 8, 12])
                        elif outcome_roll < 0.90:
                            emp_status = EmploymentStatus.FURTHER_EDUCATION
                            duration = 0
                        elif outcome_roll < 0.97:
                            emp_status = EmploymentStatus.UNEMPLOYED
                            duration = 0
                        else:
                            emp_status = EmploymentStatus.UNKNOWN
                            duration = 0

                    prog_info = matching_progs[i % len(matching_progs)]
                    primary_skill = prog_info["primary_skill"]

                    # Pick employer appropriate for district & skill
                    emp_candidates = EMPLOYERS_BY_DISTRICT_AND_SKILL.get(primary_skill, {}).get(district, [])
                    if not emp_candidates:
                        emp_candidates = [f"{district} {prog_info['sector']} Enterprises", f"{district} Vocational Works"]
                    employer = random.choice(emp_candidates) if emp_status == EmploymentStatus.EMPLOYED else None
                    job_role = f"{primary_skill} Specialist" if emp_status == EmploymentStatus.EMPLOYED else None

                    # Distinct state-based wage tiers
                    if emp_status == EmploymentStatus.EMPLOYED:
                        if state == "Maharashtra":
                            base_wage = 20500 + (trn_idx % 8) * 1600
                            if district == "Pune":
                                base_wage += 3000
                            elif district == "Nagpur":
                                base_wage += 2200
                        elif state == "Uttar Pradesh":
                            base_wage = 17500 + (trn_idx % 7) * 1400
                            if district == "Lucknow":
                                base_wage += 2200
                            elif district == "Varanasi":
                                base_wage += 1500
                        else: # Bihar
                            base_wage = 16500 + (trn_idx % 6) * 1200
                            if district == "Patna":
                                base_wage += 1800
                            elif district == "Muzaffarpur":
                                base_wage += 1200
                        current_wage = base_wage
                    elif emp_status == EmploymentStatus.APPRENTICESHIP:
                        current_wage = 12000 + (trn_idx % 4) * 1000
                    elif emp_status == EmploymentStatus.SELF_EMPLOYED:
                        current_wage = 16000 + (trn_idx % 6) * 1200
                    else:
                        current_wage = None

                    verif_status = ALL_VERIFICATION_STATUSES[trn_idx % len(ALL_VERIFICATION_STATUSES)]

                primary_skill = prog_info["primary_skill"]
                programme = prog_info["name"]
                training_centre = centres[i % len(centres)]
                batch = random.choice(["2024-Q3", "2024-Q4", "2025-Q1", "2025-Q2"])
                enrolled_dt = datetime(2024, ((i % 6) + 1), ((i % 25) + 1))
                comp_dt = enrolled_dt + timedelta(days=90)
                cert_score = 65 + (trn_idx % 30)

                # Retention status calculation with district-specific survival variations
                if duration >= 12:
                    retention_status = RetentionStatus.RETAINED_12M
                    retention_risk = "Low"
                elif duration >= 6:
                    retention_status = RetentionStatus.RETAINED_6M
                    retention_risk = "Low"
                elif duration >= 3:
                    retention_status = RetentionStatus.RETAINED_3M
                    retention_risk = "Medium"
                elif emp_status in (EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED):
                    retention_status = RetentionStatus.EXITED_EARLY
                    retention_risk = "High"
                else:
                    retention_status = RetentionStatus.NOT_APPLICABLE
                    retention_risk = "Not Applicable"

                starting_wage = (current_wage - 2000) if (current_wage and current_wage > 15000) else current_wage
                joining_dt = (comp_dt + timedelta(days=20)).strftime("%Y-%m-%d") if employer else None

                # Build 6 detailed outcome checkpoints (30D, 90D, 180D, 270D, 9M, 12M)
                checkpoints = build_checkpoints(duration, emp_status, job_role or primary_skill, employer or f"{district} Industrial Unit", verif_status.value, current_wage)

                # Build career events
                career_events = [
                    CareerEvent(
                        id=f"EV-{t_id}-1",
                        stage="Enrolled",
                        title="Enrolled in Vocational Program",
                        date=enrolled_dt.strftime("%Y-%m-%d"),
                        description=f"Enrolled in {programme} at {training_centre} ({district}, {state}).",
                        status="Completed",
                        metadata={"centre": training_centre}
                    ),
                    CareerEvent(
                        id=f"EV-{t_id}-2",
                        stage="Training Completed",
                        title="Completed Technical Training",
                        date=comp_dt.strftime("%Y-%m-%d"),
                        description=f"Successfully satisfied attendance and practical curriculum benchmarks in {primary_skill}.",
                        status="Completed",
                        metadata={"attendance": "91%"}
                    ),
                    CareerEvent(
                        id=f"EV-{t_id}-3",
                        stage="Assessment",
                        title="State & Sector Council Assessment",
                        date=(comp_dt + timedelta(days=6)).strftime("%Y-%m-%d"),
                        description=f"Achieved {cert_score}% in standard trade practical and viva examination.",
                        status="Passed",
                        metadata={"score": cert_score}
                    ),
                    CareerEvent(
                        id=f"EV-{t_id}-4",
                        stage="Certified",
                        title="NSQF Credential Issued",
                        date=(comp_dt + timedelta(days=12)).strftime("%Y-%m-%d"),
                        description=f"National Skills Qualification Framework Certificate stamped on National Registry.",
                        status="Issued",
                        metadata={"credential_id": f"{code}-CERT-2025-{trn_idx:04d}"}
                    )
                ]

                if employer:
                    career_events.append(CareerEvent(
                        id=f"EV-{t_id}-5",
                        stage="Placed",
                        title="Employment Placement",
                        date=(comp_dt + timedelta(days=22)).strftime("%Y-%m-%d"),
                        description=f"Placed with {employer} as {job_role}. Starting wage: ₹{starting_wage:,}/mo.",
                        status="Offer Accepted",
                        metadata={"employer": employer}
                    ))
                    career_events.append(CareerEvent(
                        id=f"EV-{t_id}-6",
                        stage="Employed",
                        title="Commenced Active Employment",
                        date=joining_dt,
                        description=f"Joined workforce in {district}, {state}. Status: Active.",
                        status="Active",
                        metadata={"location": district}
                    ))

                acquired_skills = [primary_skill] + [s for s in prog_info["skills"] if s != primary_skill][:3]
                missing_skills = [prog_info["skills"][-1]] if len(prog_info["skills"]) > 3 else ["Digital Compliance"]
                recommended_skills = ["Advanced Industrial Safety", "Data Logging & Diagnostics", "Supervisory Operations"]

                # Detailed skill profile
                skill_profile = [
                    {
                        "name": sk,
                        "level": "Advanced" if idx == 0 else "Intermediate",
                        "verification": "Multi-Verified" if idx == 0 else ("Training Verified" if idx == 1 else "Assessment Verified"),
                        "acquired_from": programme,
                        "assessment_score": cert_score - (idx * 4),
                        "related_jobs": [job_role] if job_role else [f"{primary_skill} Associate"]
                    }
                    for idx, sk in enumerate(acquired_skills)
                ]

                # Detailed verification items
                verif_items = [
                    VerificationItem(
                        id=f"V-{t_id}-1",
                        field_name="Skills Competency",
                        claimed_value=f"Proficient in {primary_skill}",
                        source=f"{training_centre} Practical Examination",
                        date=(comp_dt + timedelta(days=6)).strftime("%Y-%m-%d"),
                        evidence_type="Trade Assessment Scorecard",
                        evidence_notes=f"Practical score {cert_score}% stamped by assessing body.",
                        status=VerificationStatus.ASSESSMENT_VERIFIED
                    ),
                    VerificationItem(
                        id=f"V-{t_id}-2",
                        field_name="Training Attendance",
                        claimed_value=f"Completed {programme}",
                        source=training_centre,
                        date=comp_dt.strftime("%Y-%m-%d"),
                        evidence_type="Biometric Attendance Registry",
                        evidence_notes="Course hours verified via biometric batch logs.",
                        status=VerificationStatus.TRAINING_VERIFIED
                    )
                ]

                if employer:
                    verif_items.append(
                        VerificationItem(
                            id=f"V-{t_id}-3",
                            field_name="Active Employment & Wage",
                            claimed_value=f"{job_role} at {employer} (₹{current_wage:,}/mo)",
                            source=f"{employer} HR Portal & PF Registry",
                            date="2026-02-28",
                            evidence_type="Employer Confirmation Slip",
                            evidence_notes=f"Quarterly employment continuity verified by {employer}.",
                            status=verif_status
                        )
                    )

                trainee_followups = []
                channels_cycle = [CommChannel.WHATSAPP, CommChannel.SMS, CommChannel.CALL_CENTRE, CommChannel.WEB, CommChannel.IVR]
                for cp_idx, cp in enumerate(checkpoints):
                    stg = cp["stage"]
                    is_done = cp["status"] == "Confirmed"
                    fu_status = FollowUpStatus.COMPLETED if is_done else (FollowUpStatus.OVERDUE if (duration > 0 and not is_done and random.random() < 0.25) else FollowUpStatus.PENDING)
                    fu_channel = channels_cycle[(trn_idx + cp_idx) % len(channels_cycle)]
                    
                    trainee_followups.append(
                        FollowUpRecord(
                            id=f"FU-{t_id}-{stg}",
                            stage=stg,
                            due_date="2026-03-12" if is_done else "2026-04-15",
                            channel=fu_channel,
                            status=fu_status,
                            completed_date="2026-03-12" if is_done else None,
                            employment_status=cp["employment_status"],
                            employer=cp["employer"],
                            job_role=cp["role"],
                            wage=current_wage if is_done else None,
                            job_relevance=cp["role_relevance"],
                            skill_usage=cp["skill_utilisation"],
                            job_satisfaction="High" if is_done else "Neutral",
                            training_usefulness="Very Useful",
                            consent_given=True,
                            verification_status=cp["verification_status"],
                            verification_sources=cp["verification_sources"],
                            last_updated=cp["last_updated"],
                            update_source=cp["update_source"]
                        )
                    )

                # Demographics and status variations
                t_gender = "Female" if ((trn_idx * 7) % 10 < 4) else "Male"
                t_age = 19 + (trn_idx % 14)
                edu_options = ["ITI Technical Trade", "Polytechnic Diploma", "12th Vocational", "Graduate (B.Sc / BCA / B.Com)", "10th Standard Technical"]
                t_education = edu_options[trn_idx % len(edu_options)]
                t_cert_status = "Certified" if (trn_idx % 10 < 8) else ("Appeared" if (trn_idx % 10 == 8) else "Pending")
                t_comp_status = "Completed" if (trn_idx % 10 < 9) else "In Progress"

                trainee = Trainee(
                    id=t_id,
                    name=name,
                    district=district,
                    state=state,
                    gender=t_gender,
                    age=t_age,
                    education=t_education,
                    programme=programme,
                    training_centre=training_centre,
                    batch=batch,
                    enrollment_date=enrolled_dt.strftime("%Y-%m-%d"),
                    completion_date=comp_dt.strftime("%Y-%m-%d"),
                    certification_status=t_cert_status,
                    certification_score=cert_score,
                    skills_acquired=acquired_skills,
                    skills_used=acquired_skills[:2] if emp_status == EmploymentStatus.EMPLOYED else [],
                    skills_missing=missing_skills,
                    skills_recommended=recommended_skills,
                    employment_status=emp_status,
                    employer=employer,
                    job_role=job_role,
                    joining_date=joining_dt,
                    current_wage=current_wage,
                    starting_wage=starting_wage,
                    wage_history=[{"stage": "Placement", "wage": starting_wage, "date": joining_dt}, {"stage": "Progression", "wage": current_wage, "date": "2026-01-15"}] if current_wage else [],
                    employment_duration_months=duration,
                    retention_status=retention_status,
                    retention_risk=retention_risk,
                    skill_relevance="High" if emp_status == EmploymentStatus.EMPLOYED else "Unknown",
                    current_location=district,
                    reason_for_leaving=None if emp_status == EmploymentStatus.EMPLOYED else "Pursuing advancement / Local wage mismatch",
                    verification_status=verif_status,
                    verifications=verif_items,
                    follow_ups=trainee_followups,
                    last_follow_up_date=(comp_dt + timedelta(days=90)).strftime("%Y-%m-%d") if employer else None,
                    consent_status="Consent Active",
                    preferred_channel=CommChannel.WHATSAPP,
                    career_events=career_events,
                    phone=phone,
                    email=email,
                    skillpulse_id=sp_id,
                    sector=prog_info["sector"],
                    skill_profile=skill_profile,
                    checkpoints=checkpoints,
                    availability="Immediate" if emp_status != EmploymentStatus.EMPLOYED else "Employed",
                    wage_expectation=(current_wage or 18000) + 2000,
                    institution=training_centre,
                    graduation_year="2024",
                    completion_status=t_comp_status,
                    preferred_role=job_role or f"{primary_skill} Associate",
                    preferred_sector=prog_info["sector"],
                    preferred_location=district,
                    willing_to_relocate=(i % 3 == 0),
                    experience_years=round(duration / 12, 1)
                )
                self.trainees.append(trainee)

    def get_trainees(
        self,
        district: Optional[str] = None,
        state: Optional[str] = None,
        sector: Optional[str] = None,
        programme: Optional[str] = None,
        skill: Optional[str] = None,
        status: Optional[str] = None,
        verification: Optional[str] = None,
        search: Optional[str] = None,
        batch: Optional[str] = None,
        risk: Optional[str] = None
    ) -> List[Trainee]:
        results = self.trainees
        if state and state not in ("All States", "All", ""):
            results = [t for t in results if (t.state or "").strip().lower() == state.strip().lower()]
        if district and district not in ("All Districts", "All", ""):
            results = [t for t in results if (t.district or "").strip().lower() == district.strip().lower()]
        if sector and sector not in ("All Sectors", "All", ""):
            results = [t for t in results if (t.sector or "").lower() == sector.lower() or sector.lower() in (t.programme or "").lower()]
        if programme and programme != "All Programmes":
            results = [t for t in results if programme.lower() in t.programme.lower()]
        if skill and skill != "All Skills":
            skill_clean = skill.strip().lower()
            results = [
                t for t in results
                if any(skill_clean == s.strip().lower() or skill_clean in s.lower() for s in t.skills_acquired)
                or (t.programme in PROGRAMME_PRIMARY_SKILLS and skill_clean in PROGRAMME_PRIMARY_SKILLS[t.programme].lower())
                or skill_clean in t.programme.lower()
                or (t.job_role and skill_clean in t.job_role.lower())
            ]
        if status and status != "All Statuses":
            results = [t for t in results if (t.employment_status.value if hasattr(t.employment_status, "value") else str(t.employment_status)).lower() == status.lower()]
        if verification and verification not in ("All Verifications", "All Verification", "All", ""):
            v_norm = verification.strip().lower().replace("-", " ")
            def _verif_matches(t):
                raw = t.verification_status.value if hasattr(t.verification_status, "value") else str(t.verification_status or "")
                val_norm = raw.strip().lower().replace("-", " ")
                if val_norm == v_norm or v_norm in val_norm or val_norm in v_norm:
                    return True
                if "conflict" in v_norm and "conflict" in val_norm:
                    return True
                if "pending" in v_norm and "pending" in val_norm:
                    return True
                return False
            results = [t for t in results if _verif_matches(t)]
        if batch and batch != "All Batches":
            results = [t for t in results if t.batch.lower() == batch.lower()]
        if risk and risk != "All Risks":
            results = [t for t in results if t.retention_risk.lower() == risk.lower()]
        if search:
            q = search.lower()
            results = [
                t for t in results
                if q in t.name.lower() or q in t.id.lower() or q in (t.skillpulse_id or "").lower() or q in (t.phone or "") or q in (t.district or "").lower() or q in (t.state or "").lower() or (t.employer and q in t.employer.lower()) or (t.job_role and q in t.job_role.lower()) or any(q in s.lower() for s in (t.skills_acquired or []))
            ]
        return results

    def add_trainee(self, payload: Dict[str, Any]) -> Trainee:
        if not isinstance(payload, dict):
            payload = payload.dict() if hasattr(payload, "dict") else dict(payload)

        requested_id = (payload.get("trainee_id") or "").strip()
        state = payload.get("state") or "Bihar"
        code = STATE_CODES.get(state, "BR")
        
        if requested_id:
            if self.get_trainee_by_id(requested_id):
                raise ValueError(f"Trainee ID {requested_id} already exists.")
            trainee_id = requested_id
        else:
            n = len(self.trainees) + 1
            trainee_id = f"TRN-{code}-2025-{n:04d}"

        skills = payload.get("skills_acquired") or []
        skill_level = payload.get("skill_level") or "Intermediate"
        status = payload.get("employment_status") or EmploymentStatus.UNKNOWN
        if isinstance(status, str):
            status = EmploymentStatus(status)

        completion = payload.get("completion_status") or "Completed"
        cert = payload.get("certification_status") or "Certified"
        enrolled = payload.get("enrollment_date") or datetime.now().strftime("%Y-%m-%d")
        district = payload.get("district") or GEOGRAPHY[state][0]
        
        from geography import GEOGRAPHY as G_MAP
        allowed = {name for names in G_MAP.values() for name in names}
        if district not in allowed:
            raise ValueError(f"District {district} must be one of the nine supported districts.")

        wage = payload.get("current_wage")
        number = 10000 + len(self.trainees) + 1
        skillpulse_id = payload.get("skillpulse_id") or f"SP-{code}-{number}"
        prog = payload.get("programme") or "Vocational Skilling"

        events = [
            CareerEvent(
                id=f"EV-{trainee_id}-1",
                stage="Enrolled",
                title="Training enrollment recorded",
                date=enrolled,
                description=f"Enrolled in {prog} ({district}, {state}).",
                status="Recorded",
                metadata={"source": "Add Trainee"}
            ),
            CareerEvent(
                id=f"EV-{trainee_id}-2",
                stage="Training Completed",
                title="Training completion recorded",
                date=enrolled,
                description=f"Completion status: {completion}. Certification: {cert}.",
                status=completion,
                metadata={}
            )
        ]

        checkpoints = build_checkpoints(6, status, payload.get("job_role") or "Trade Specialist", payload.get("employer") or f"{district} Works", "Training Verified", wage)

        trainee = Trainee(
            id=trainee_id,
            name=payload["name"].strip(),
            district=district,
            state=state,
            gender=payload.get("gender") or "Not specified",
            age=int(payload.get("age") or 22),
            education=payload.get("education") or "ITI Technical Trade",
            programme=prog,
            training_centre=payload.get("training_provider") or payload.get("institution") or f"{district} Skill Centre",
            batch="2025-Q2",
            enrollment_date=enrolled,
            completion_date=enrolled,
            certification_status=cert,
            certification_score=80,
            skills_acquired=skills,
            skills_used=skills if status == EmploymentStatus.EMPLOYED else [],
            skills_missing=payload.get("target_skills") or [],
            skills_recommended=payload.get("target_skills") or [],
            employment_status=status,
            employer=payload.get("employer"),
            job_role=payload.get("job_role"),
            joining_date=payload.get("joining_date"),
            current_wage=wage,
            starting_wage=wage,
            wage_history=[{"stage": "Recorded", "wage": wage, "date": enrolled}] if wage else [],
            employment_duration_months=6 if status == EmploymentStatus.EMPLOYED else 0,
            retention_status=RetentionStatus.RETAINED_6M if status == EmploymentStatus.EMPLOYED else RetentionStatus.NOT_APPLICABLE,
            retention_risk="Low" if status == EmploymentStatus.EMPLOYED else "Not Applicable",
            skill_relevance="High" if status == EmploymentStatus.EMPLOYED else "Unknown",
            current_location=district,
            verification_status=VerificationStatus.TRAINING_VERIFIED,
            verifications=[],
            follow_ups=[],
            consent_status="Consent Active",
            preferred_channel=CommChannel.WHATSAPP,
            career_events=events,
            phone=payload.get("phone") or f"98{random.randint(10000000, 99999999)}",
            email=payload.get("email") or f"{payload['name'].strip().lower().replace(' ', '.')}@skillpulse.in",
            skillpulse_id=skillpulse_id,
            sector=payload.get("sector") or "Technical Trades",
            skill_profile=[{"name": s, "level": skill_level, "verification": "Training Verified", "acquired_from": prog, "assessment_score": 80, "related_jobs": [payload.get("job_role")] if payload.get("job_role") else []} for s in skills],
            checkpoints=checkpoints,
            availability="Immediate" if status != EmploymentStatus.EMPLOYED else "Employed",
            wage_expectation=(wage or 18000) + 2000,
            institution=payload.get("institution") or f"{district} Skill Centre",
            graduation_year="2024",
            completion_status=completion,
            experience_years=float(payload.get("experience_years") or 0.5),
            preferred_role=payload.get("job_role") or "Trade Specialist",
            preferred_sector=payload.get("sector") or "Technical Trades",
            preferred_location=district,
            willing_to_relocate=True
        )
        self.trainees.insert(0, trainee)
        return trainee

    def get_trainee_by_id(self, trainee_id: str) -> Optional[Trainee]:
        key = (trainee_id or "").strip().lower()
        for t in self.trainees:
            if t.id.lower() == key or (t.skillpulse_id or "").lower() == key:
                return t
        return None

    def get_trainee_by_phone(self, phone: str) -> Optional[Trainee]:
        digits = "".join(ch for ch in (phone or "") if ch.isdigit())[-10:]
        for t in self.trainees:
            if "".join(ch for ch in (t.phone or "") if ch.isdigit())[-10:] == digits and digits:
                return t
        return None

    def update_trainee_outcome(self, trainee_id: str, update_data: Dict[str, Any]) -> Optional[Trainee]:
        trainee = self.get_trainee_by_id(trainee_id)
        if not trainee:
            return None
        
        for k, v in update_data.items():
            if v is not None and hasattr(trainee, k):
                setattr(trainee, k, v)
        
        new_event = CareerEvent(
            id=f"EV-{trainee.id}-{len(trainee.career_events) + 1}",
            stage="Outcome Updated",
            title=f"Outcome Updated: {trainee.employment_status.value}",
            date=datetime.now().strftime("%Y-%m-%d"),
            description=f"Status: {trainee.employment_status.value} at {trainee.employer or 'Self/Direct'}. Wage: ₹{trainee.current_wage or 0:,}/mo.",
            status="Updated by Officer",
            metadata={"updated_at": datetime.now().isoformat()}
        )
        trainee.career_events.append(new_event)
        return trainee

    def update_trainee_verification(self, trainee_id: str, new_status: VerificationStatus, notes: Optional[str] = None, verified_by: Optional[str] = None) -> Optional[Trainee]:
        trainee = self.get_trainee_by_id(trainee_id)
        if not trainee:
            return None
        
        trainee.verification_status = new_status
        new_verif = VerificationItem(
            id=f"V-{trainee.id}-{len(trainee.verifications) + 1}",
            field_name="Audit Review Verification",
            claimed_value=f"Employment Status: {trainee.employment_status.value}",
            source=f"{trainee.state} State Skill Registry Desk",
            date=datetime.now().strftime("%Y-%m-%d"),
            evidence_type="Audit Review Protocol",
            evidence_notes=notes or "Status verified during state demonstration audit panel.",
            status=new_status,
            verified_by=verified_by or "SkillPulse AI Verification Officer",
            verification_date=datetime.now().strftime("%Y-%m-%d")
        )
        trainee.verifications.append(new_verif)
        
        trainee.career_events.append(
            CareerEvent(
                id=f"EV-{trainee.id}-VERIF-{len(trainee.career_events)+1}",
                stage="Verification Update",
                title=f"Status Changed to {new_status.value}",
                date=datetime.now().strftime("%Y-%m-%d"),
                description=f"Verification state officially updated to '{new_status.value}'. Audit notes: {notes or 'None'}.",
                status=new_status.value,
                metadata={"verified_by": verified_by}
            )
        )
        return trainee

    def complete_follow_up(self, trainee_id: str, follow_up_id: str, data: Dict[str, Any]) -> Optional[Trainee]:
        trainee = self.get_trainee_by_id(trainee_id)
        if not trainee:
            return None
        
        target_stage = None
        now_str = datetime.now().strftime("%Y-%m-%d")
        for fu in trainee.follow_ups:
            if fu.id == follow_up_id:
                target_stage = fu.stage
                fu.status = FollowUpStatus.COMPLETED
                fu.completed_date = now_str
                fu.employment_status = data.get("employment_status", trainee.employment_status.value)
                fu.employer = data.get("employer", trainee.employer)
                fu.job_role = data.get("job_role", trainee.job_role)
                fu.wage = data.get("wage", trainee.current_wage)
                fu.job_relevance = data.get("job_relevance", "Relevant")
                fu.skill_usage = data.get("skill_usage", "High")
                fu.job_satisfaction = data.get("job_satisfaction", "High")
                fu.training_usefulness = data.get("training_usefulness", "Very Useful")
                fu.reason_for_leaving = data.get("reason_for_leaving")
                fu.additional_training_needed = data.get("additional_training_needed")
                fu.consent_given = data.get("consent_given", True)

                # Set verified outcome status: respect provided verification_status (default to Self-Reported per requirement 8)
                new_verif = data.get("verification_status") or "Self-Reported"
                fu.verification_status = new_verif
                fu.verification_sources = get_verification_sources(new_verif)
                fu.last_updated = now_str
                fu.update_source = "WhatsApp Micro-Checkin"
                trainee.last_follow_up_date = now_str

                # Synchronize matching checkpoint
                for cp in trainee.checkpoints:
                    stg = cp["stage"]
                    if stg == target_stage or (target_stage in ("9M", "9 Months") and stg == "9M") or (target_stage in ("12M", "12 Months", "365 Days") and stg == "12M"):
                        cp["status"] = "Confirmed"
                        cp["employment_status"] = fu.employment_status
                        cp["employer"] = fu.employer
                        cp["role"] = fu.job_role
                        cp["role_relevance"] = fu.job_relevance
                        cp["skill_utilisation"] = fu.skill_usage
                        cp["verification_status"] = new_verif
                        cp["verification_sources"] = fu.verification_sources
                        cp["verification_history"] = get_verification_history(new_verif, now_str)
                        cp["last_verification_date"] = now_str
                        cp["last_updated"] = now_str
                        cp["update_source"] = "WhatsApp Follow-up (Simulated Check-in)"
                        break
                
                trainee.career_events.append(
                    CareerEvent(
                        id=f"EV-{trainee.id}-FU-{len(trainee.career_events)+1}",
                        stage=f"{target_stage} Completed",
                        title=f"{target_stage} Follow-up Recorded",
                        date=now_str,
                        description=f"Candidate check-in captured via {fu.channel.value if hasattr(fu.channel, 'value') else fu.channel}. Reported Status: {fu.employment_status} ({new_verif}), Wage: ₹{fu.wage or 0:,}/mo.",
                        status="Follow-up Logged",
                        metadata={"channel": "WhatsApp", "satisfaction": fu.job_satisfaction, "stage": target_stage}
                    )
                )
                break
        return trainee

# Global instance
db = DataStore()
