import os
import uuid
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

TABLE_URL = f"{SUPABASE_URL}/rest/v1/investigation_cases"


def get_headers():
    return {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def create_case(
    user_id,
    filename,
    email_data,
    threat_analysis,
    threat_dna,
    forensic_analysis,
    ip_intelligence,
    url_intelligence,
    threat_graph,
    evidence_hash,
):
    # --------------------------------------------------
    # Check whether this exact email was already analyzed
    # by this user.
    # --------------------------------------------------

    response = requests.get(
        TABLE_URL,
        headers=get_headers(),
        params={
            "user_id": f"eq.{user_id}",
            "evidence_hash": f"eq.{evidence_hash}",
            "select": "case_data",
            "limit": "1",
        },
        timeout=10,
    )

    if response.status_code == 200:
        existing = response.json()

        if existing:
            return existing[0]["case_data"]

    # --------------------------------------------------
    # Generate case ID
    # --------------------------------------------------

    case_id = f"TM-{uuid.uuid4().hex[:8].upper()}"

    created_at = datetime.now(timezone.utc).isoformat()

    # --------------------------------------------------
    # Complete investigation object
    # --------------------------------------------------

    case_data = {
        "case_id": case_id,
        "user_id": user_id,
        "filename": filename,

        "email": email_data,

        "threat_analysis": threat_analysis,

        "threat_dna": threat_dna,

        "forensic_analysis": forensic_analysis,

        "ip_intelligence": ip_intelligence,

        "url_intelligence": url_intelligence,

        "threat_graph": threat_graph,

        "evidence_hash": evidence_hash,

        "status": "Open",

        "created_at": created_at,
    }

    # --------------------------------------------------
    # Database row
    # --------------------------------------------------

    row = {
        "case_id": case_id,
        "user_id": user_id,
        "filename": filename,

        "subject": email_data.get("subject"),

        "sender": email_data.get("sender"),

        "severity": threat_analysis.get("severity"),

        "risk_score": threat_analysis.get("risk_score"),

        "classification": threat_analysis.get(
            "classification"
        ),

        "evidence_hash": evidence_hash,

        "status": "Open",

        "created_at": created_at,

        "case_data": case_data,
    }

    response = requests.post(
        TABLE_URL,
        headers=get_headers(),
        json=row,
        timeout=10,
    )

    if response.status_code not in (200, 201):
        raise RuntimeError(
            f"Failed to create case: "
            f"{response.status_code} "
            f"{response.text}"
        )

    return case_data


def list_cases(user_id):
    response = requests.get(
        TABLE_URL,
        headers=get_headers(),
        params={
            "user_id": f"eq.{user_id}",
            "select": "*",
            "order": "created_at.desc",
        },
        timeout=10,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Failed to fetch cases: "
            f"{response.status_code} "
            f"{response.text}"
        )

    rows = response.json()

    cases = []

    for row in rows:
        case_data = row.get("case_data") or {}

        cases.append({
            "case_id": row.get("case_id"),
            "user_id": row.get("user_id"),
            "filename": row.get("filename"),
            "subject": row.get("subject"),
            "sender": row.get("sender"),
            "severity": row.get("severity"),
            "risk_score": row.get("risk_score"),
            "classification": row.get("classification"),
            "evidence_hash": row.get("evidence_hash"),
            "status": row.get("status"),
            "created_at": row.get("created_at"),

            "email": case_data.get("email"),
            "threat_analysis": case_data.get(
                "threat_analysis"
            ),
            "threat_dna": case_data.get(
                "threat_dna"
            ),
            "forensic_analysis": case_data.get(
                "forensic_analysis"
            ),
            "ip_intelligence": case_data.get(
                "ip_intelligence"
            ),
            "url_intelligence": case_data.get(
                "url_intelligence"
            ),
            "threat_graph": case_data.get(
                "threat_graph"
            ),
        })

    return cases


def get_case(case_id, user_id):
    response = requests.get(
        TABLE_URL,
        headers=get_headers(),
        params={
            "case_id": f"eq.{case_id}",
            "user_id": f"eq.{user_id}",
            "select": "*",
            "limit": "1",
        },
        timeout=10,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Failed to fetch case: "
            f"{response.status_code} "
            f"{response.text}"
        )

    rows = response.json()

    if not rows:
        return None

    row = rows[0]

    case_data = row.get("case_data") or {}

    case_data["case_id"] = row.get("case_id")
    case_data["user_id"] = row.get("user_id")
    case_data["status"] = row.get("status")
    case_data["created_at"] = row.get("created_at")

    return case_data