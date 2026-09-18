import os
import hashlib

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends,
)
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from services.email_parser import extract_email_data
from services.threat_detector import detect_threat
from services.forensics import analyze_received_headers
from services.ip_intelligence import enrich_ips
from services.url_intelligence import analyze_urls
from services.threat_graph import build_threat_graph
from services.threat_dna import build_threat_dna
from services.report_generator import generate_forensic_report
from services.pdf_report import generate_pdf_report

from services.auth import get_current_user

from services.evidence_ledger import (
    initialize_ledger,
    add_ledger_entry,
    verify_ledger,
)

from services.supabase_case_manager import (
    create_case,
    get_case,
    list_cases,
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="MailTracer AI",
    description="AI-powered email threat detection and forensic intelligence platform",
    version="0.1.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://trace-mail-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# INITIALIZATION
# ============================================================

initialize_ledger()


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "TraceMail AI backend is running",
        "status": "online",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


# ============================================================
# AUTHENTICATION
# ============================================================

@app.get("/auth/me")
def auth_me(
    user=Depends(get_current_user),
):
    return {
        "success": True,
        "user": {
            "id": user.get("id"),
            "email": user.get("email"),
        },
    }


# ============================================================
# EVIDENCE LEDGER
# ============================================================

@app.get("/ledger/verify")
def verify_evidence_ledger(
    user=Depends(get_current_user),
):
    return verify_ledger()


# ============================================================
# CASES — LIST USER'S CASES
# ============================================================

@app.get("/cases")
def get_all_cases(
    user=Depends(get_current_user),
):
    try:
        cases = list_cases(user["id"])

        return {
            "success": True,
            "cases": cases,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch investigation cases: {str(error)}",
        )


# ============================================================
# CASES — GET SINGLE CASE
# ============================================================

@app.get("/cases/{case_id}")
def get_investigation_case(
    case_id: str,
    user=Depends(get_current_user),
):
    try:
        case = get_case(
            case_id,
            user["id"],
        )

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Investigation case not found",
            )

        return {
            "success": True,
            "case": case,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch investigation case: {str(error)}",
        )


# ============================================================
# CASES — DOWNLOAD FORENSIC REPORT
# ============================================================

@app.get("/cases/{case_id}/report")
def download_case_report(
    case_id: str,
    user=Depends(get_current_user),
):
    try:
        # IMPORTANT:
        # Verify that this case belongs to the authenticated user.
        case = get_case(
            case_id,
            user["id"],
        )

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Investigation case not found",
            )

        pdf_filename = (
            f"{case_id}_forensic_report.pdf"
        )

        pdf_path = os.path.join(
            "reports",
            pdf_filename,
        )

        if not os.path.exists(pdf_path):
            raise HTTPException(
                status_code=404,
                detail="Forensic report not found",
            )

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=pdf_filename,
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download forensic report: {str(error)}",
        )


# ============================================================
# EMAIL ANALYSIS
# ============================================================

@app.post("/analyze")
async def analyze_email(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):

    # --------------------------------------------------------
    # STEP 0 — Validate file
    # --------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file was provided.",
        )

    if not file.filename.lower().endswith(".eml"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid .eml email file.",
        )

    # --------------------------------------------------------
    # STEP 1 — Read email
    # --------------------------------------------------------

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded email file is empty.",
        )

    # --------------------------------------------------------
    # STEP 2 — Calculate evidence SHA-256
    # --------------------------------------------------------

    evidence_hash = hashlib.sha256(
        file_bytes
    ).hexdigest()

    # --------------------------------------------------------
    # STEP 3 — Parse email
    # --------------------------------------------------------

    email_data = extract_email_data(
        file_bytes
    )

    # --------------------------------------------------------
    # STEP 4 — Threat detection
    # --------------------------------------------------------

    threat_analysis = detect_threat(
        email_data
    )

    # --------------------------------------------------------
    # STEP 5 — Header forensics
    # --------------------------------------------------------

    forensic_analysis = analyze_received_headers(
        email_data.get(
            "received_headers",
            [],
        )
    )

    # --------------------------------------------------------
    # STEP 6 — IP intelligence / GeoIP
    # --------------------------------------------------------

    ip_intelligence = enrich_ips(
        forensic_analysis.get(
            "all_ips",
            [],
        )
    )

    # --------------------------------------------------------
    # STEP 7 — URL intelligence
    # --------------------------------------------------------

    url_intelligence = analyze_urls(
        threat_analysis.get(
            "extracted_urls",
            [],
        )
    )

    # --------------------------------------------------------
    # STEP 8 — Threat graph
    # --------------------------------------------------------

    threat_graph = build_threat_graph(
        email_data,
        threat_analysis,
        ip_intelligence,
        url_intelligence,
    )

    # --------------------------------------------------------
    # STEP 9 — Threat DNA
    # --------------------------------------------------------

    threat_dna = build_threat_dna(
        email_data,
        threat_analysis,
        forensic_analysis,
        url_intelligence,
    )

    # --------------------------------------------------------
    # STEP 10 — Evidence ledger
    # --------------------------------------------------------

    ledger_entry = add_ledger_entry(
        event_type="EMAIL_ANALYZED",
        evidence_hash=evidence_hash,
        details={
            "filename": file.filename,
            "user_id": user["id"],
            "risk_score": threat_analysis.get(
                "risk_score"
            ),
            "severity": threat_analysis.get(
                "severity"
            ),
            "classification": threat_analysis.get(
                "classification"
            ),
        },
    )

    # --------------------------------------------------------
    # STEP 11 — Create Supabase investigation case
    # --------------------------------------------------------

    case = create_case(
        user_id=user["id"],
        filename=file.filename,
        email_data=email_data,
        threat_analysis=threat_analysis,
        threat_dna=threat_dna,
        forensic_analysis=forensic_analysis,
        ip_intelligence=ip_intelligence,
        url_intelligence=url_intelligence,
        threat_graph=threat_graph,
        evidence_hash=evidence_hash,
    )

    # --------------------------------------------------------
    # STEP 12 — Generate forensic report
    # --------------------------------------------------------

    forensic_report = generate_forensic_report(
        case,
        email_data,
        threat_analysis,
        forensic_analysis,
        ip_intelligence,
        url_intelligence,
        threat_dna,
        evidence_hash,
    )

    # --------------------------------------------------------
    # STEP 13 — Generate PDF
    # --------------------------------------------------------

    os.makedirs(
        "reports",
        exist_ok=True,
    )

    pdf_filename = (
        f"{case['case_id']}_forensic_report.pdf"
    )

    pdf_path = os.path.join(
        "reports",
        pdf_filename,
    )

    generate_pdf_report(
        forensic_report,
        pdf_path,
    )

    # --------------------------------------------------------
    # STEP 14 — Return complete analysis
    # --------------------------------------------------------

    return {
        "success": True,

        "filename": file.filename,

        "email": email_data,

        "threat_analysis": threat_analysis,

        "forensic_analysis": forensic_analysis,

        "ip_intelligence": ip_intelligence,

        "url_intelligence": url_intelligence,

        "threat_graph": threat_graph,

        "threat_dna": threat_dna,

        "evidence": {
            "sha256": evidence_hash,

            "ledger": ledger_entry,

            "case": case,

            "forensic_report": forensic_report,
        },
    }