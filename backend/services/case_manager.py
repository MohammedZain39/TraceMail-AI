import sqlite3
import uuid
import json
from datetime import datetime


DATABASE = "tracemail.db"


def initialize_cases():

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investigation_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            filename TEXT,
            subject TEXT,
            sender TEXT,
            recipient TEXT,
            severity TEXT,
            risk_score INTEGER,
            classification TEXT,
            evidence_hash TEXT,
            investigation_data TEXT
        )
    """)

    connection.commit()
    connection.close()


def create_case(
    filename,
    email_data,
    threat_analysis,
    threat_dna,
    forensic_analysis,
    ip_intelligence,
    url_intelligence,
    threat_graph,
    evidence_hash
):

    connection = sqlite3.connect(DATABASE)
    cursor = connection.cursor()

    # ---------------------------------------------------------
    # DUPLICATE EVIDENCE CHECK
    # ---------------------------------------------------------
    #
    # The SHA-256 hash represents the exact uploaded email.
    # If the same .eml file is analyzed again, return the
    # existing investigation instead of creating another case.
    #
    cursor.execute("""
        SELECT case_id
        FROM investigation_cases
        WHERE evidence_hash = ?
        ORDER BY id ASC
        LIMIT 1
    """, (evidence_hash,))

    existing_case = cursor.fetchone()

    if existing_case:

        existing_case_id = existing_case[0]

        connection.close()

        print(
            f"[TraceMail] Duplicate evidence detected. "
            f"Returning existing case: {existing_case_id}"
        )

        return get_case(existing_case_id)

    # ---------------------------------------------------------
    # CREATE NEW CASE
    # ---------------------------------------------------------

    case_id = "TM-" + uuid.uuid4().hex[:8].upper()

    created_at = datetime.utcnow().isoformat()

    investigation_data = {
        "threat_analysis": threat_analysis,
        "threat_dna": threat_dna,
        "forensic_analysis": forensic_analysis,
        "ip_intelligence": ip_intelligence,
        "url_intelligence": url_intelligence,
        "threat_graph": threat_graph
    }

    cursor.execute("""
        INSERT INTO investigation_cases (
            case_id,
            created_at,
            status,
            filename,
            subject,
            sender,
            recipient,
            severity,
            risk_score,
            classification,
            evidence_hash,
            investigation_data
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id,
        created_at,
        "OPEN",
        filename,
        email_data.get("subject", ""),
        email_data.get("sender", ""),
        email_data.get("recipient", ""),
        threat_analysis.get("severity", "UNKNOWN"),
        threat_analysis.get("risk_score", 0),
        threat_analysis.get(
            "classification",
            "Unknown"
        ),
        evidence_hash,
        json.dumps(
            investigation_data,
            default=str
        )
    ))

    connection.commit()
    connection.close()

    print(
        f"[TraceMail] New investigation created: {case_id}"
    )

    return {
        "case_id": case_id,
        "created_at": created_at,
        "status": "OPEN",
        "filename": filename,

        "email": {
            "subject": email_data.get("subject", ""),
            "sender": email_data.get("sender", ""),
            "recipient": email_data.get("recipient", ""),
            "date": email_data.get("date", ""),
            "reply_to": email_data.get("reply_to", ""),
            "body": email_data.get("body", ""),
            "authentication": email_data.get(
                "authentication",
                {}
            ),
            "attachments": email_data.get(
                "attachments",
                []
            )
        },

        "threat_analysis": threat_analysis,

        "threat_dna": threat_dna,

        "forensic_analysis": forensic_analysis,

        "ip_intelligence": ip_intelligence,

        "url_intelligence": url_intelligence,

        "threat_graph": threat_graph,

        "severity": threat_analysis.get(
            "severity",
            "UNKNOWN"
        ),

        "risk_score": threat_analysis.get(
            "risk_score",
            0
        ),

        "classification": threat_analysis.get(
            "classification",
            "Unknown"
        ),

        "evidence_hash": evidence_hash
    }


def get_case(case_id):

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            case_id,
            created_at,
            status,
            filename,
            subject,
            sender,
            recipient,
            severity,
            risk_score,
            classification,
            evidence_hash,
            investigation_data
        FROM investigation_cases
        WHERE case_id = ?
    """, (case_id,))

    row = cursor.fetchone()

    connection.close()

    if not row:
        return None

    (
        case_id,
        created_at,
        status,
        filename,
        subject,
        sender,
        recipient,
        severity,
        risk_score,
        classification,
        evidence_hash,
        investigation_data
    ) = row

    # Safely decode stored investigation data
    try:
        investigation = json.loads(
            investigation_data
        )
    except (json.JSONDecodeError, TypeError):
        investigation = {}

    threat_analysis = investigation.get(
        "threat_analysis",
        {}
    )

    threat_dna = investigation.get(
        "threat_dna",
        {}
    )

    forensic_analysis = investigation.get(
        "forensic_analysis",
        {}
    )

    ip_intelligence = investigation.get(
        "ip_intelligence",
        {}
    )

    url_intelligence = investigation.get(
        "url_intelligence",
        {}
    )

    threat_graph = investigation.get(
        "threat_graph",
        {}
    )

    return {
        "case_id": case_id,

        "created_at": created_at,

        "status": status,

        "filename": filename,

        # -----------------------------------------------------
        # EMAIL
        # -----------------------------------------------------
        "email": {
            "subject": subject,
            "sender": sender,
            "recipient": recipient
        },

        # -----------------------------------------------------
        # THREAT ANALYSIS
        # -----------------------------------------------------
        "threat_analysis": threat_analysis,

        # -----------------------------------------------------
        # FORENSICS
        # -----------------------------------------------------
        "forensic_analysis": forensic_analysis,

        # -----------------------------------------------------
        # IP INTELLIGENCE
        # -----------------------------------------------------
        "ip_intelligence": ip_intelligence,

        # -----------------------------------------------------
        # URL INTELLIGENCE
        # -----------------------------------------------------
        "url_intelligence": url_intelligence,

        # -----------------------------------------------------
        # THREAT DNA
        # -----------------------------------------------------
        "threat_dna": threat_dna,

        # -----------------------------------------------------
        # THREAT GRAPH
        # -----------------------------------------------------
        "threat_graph": threat_graph,

        # -----------------------------------------------------
        # SUMMARY FIELDS
        # -----------------------------------------------------
        "severity": severity,

        "risk_score": risk_score,

        "classification": classification,

        "evidence_hash": evidence_hash
    }


def list_cases():

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            case_id,
            created_at,
            status,
            filename,
            subject,
            sender,
            severity,
            risk_score,
            classification,
            evidence_hash
        FROM investigation_cases
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    cases = []

    for row in rows:

        (
            case_id,
            created_at,
            status,
            filename,
            subject,
            sender,
            severity,
            risk_score,
            classification,
            evidence_hash
        ) = row

        cases.append({
            "case_id": case_id,
            "created_at": created_at,
            "status": status,
            "filename": filename,
            "subject": subject,
            "sender": sender,
            "severity": severity,
            "risk_score": risk_score,
            "classification": classification,
            "evidence_hash": evidence_hash
        })

    return cases