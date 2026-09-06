from datetime import datetime


def generate_forensic_report(
    case,
    email_data,
    threat_analysis,
    forensic_analysis,
    ip_intelligence,
    url_intelligence,
    threat_dna,
    evidence_hash
):

    risk_score = threat_analysis.get(
        "risk_score",
        0
    )

    severity = threat_analysis.get(
        "severity",
        "UNKNOWN"
    )

    classification = threat_analysis.get(
        "classification",
        "Unknown"
    )

    risk_factors = threat_analysis.get(
        "risk_factors",
        []
    )

    # -------------------------
    # Authentication summary
    # -------------------------

    authentication = email_data.get(
        "authentication",
        {}
    )

    authentication_results = authentication.get(
        "authentication_results",
        ""
    )

    received_spf = authentication.get(
        "received_spf",
        ""
    )

    dkim_present = authentication.get(
        "dkim_signature_present",
        False
    )

    # -------------------------
    # Relay summary
    # -------------------------

    relay_path = forensic_analysis.get(
        "relay_path",
        []
    )

    public_ips = forensic_analysis.get(
        "public_ips",
        []
    )

    earliest_ip = forensic_analysis.get(
        "earliest_observed_public_ip"
    )

    # -------------------------
    # URL summary
    # -------------------------

    urls = threat_analysis.get(
        "extracted_urls",
        []
    )

    domains = threat_analysis.get(
        "extracted_domains",
        []
    )

    # -------------------------
    # Threat DNA
    # -------------------------

    dna = threat_dna.get(
        "fingerprint",
        {}
    )

    dna_string = threat_dna.get(
        "dna_string",
        ""
    )

    # -------------------------
    # Investigation conclusion
    # -------------------------

    if risk_score >= 80:

        conclusion = (
            "The email presents a high-confidence set of "
            "suspicious indicators and should be treated "
            "as a potentially malicious communication. "
            "Further investigation and containment are recommended."
        )

    elif risk_score >= 60:

        conclusion = (
            "The email contains multiple suspicious indicators "
            "and requires analyst review before any user action."
        )

    elif risk_score >= 40:

        conclusion = (
            "The email contains potentially suspicious characteristics "
            "and should be reviewed by an investigator."
        )

    else:

        conclusion = (
            "No strong malicious indicators were identified "
            "by the current analysis engine."
        )

    # -------------------------
    # Final report
    # -------------------------

    return {

        "report_metadata": {
            "generated_at": datetime.utcnow().isoformat(),
            "case_id": case.get("case_id"),
            "report_type": "Email Forensic Investigation Report"
        },

        "executive_summary": {
            "severity": severity,
            "risk_score": risk_score,
            "classification": classification,
            "conclusion": conclusion
        },

        "email_evidence": {
            "filename": case.get("filename"),
            "sender": email_data.get("sender"),
            "recipient": email_data.get("recipient"),
            "reply_to": email_data.get("reply_to"),
            "subject": email_data.get("subject"),
            "date": email_data.get("date"),
            "message_id": email_data.get("message_id")
        },

        "authentication_findings": {
            "authentication_results": authentication_results,
            "received_spf": received_spf,
            "dkim_signature_present": dkim_present
        },

        "relay_forensics": {
            "total_hops": len(relay_path),
            "public_ips": public_ips,
            "earliest_observed_public_ip": earliest_ip,
            "note": (
                "The earliest observed public IP represents "
                "observed source infrastructure and should not "
                "automatically be treated as the attacker's physical location."
            )
        },

        "ip_intelligence": ip_intelligence,

        "url_intelligence": {
            "urls": urls,
            "domains": domains,
            "analysis": url_intelligence
        },

        "threat_dna": {
            "fingerprint": dna,
            "dna_string": dna_string,
            "risk_pattern": threat_dna.get(
                "risk_pattern"
            )
        },

        "risk_factors": risk_factors,

        "evidence_integrity": {
            "sha256": evidence_hash,
            "integrity_method": "SHA-256",
            "description": (
                "SHA-256 hash uniquely identifies the analyzed "
                "email evidence and supports tamper-evident integrity verification."
            )
        },

        "investigator_conclusion": conclusion
    }