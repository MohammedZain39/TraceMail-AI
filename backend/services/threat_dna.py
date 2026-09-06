import re


def extract_domain(email_address: str):
    if not email_address or "@" not in email_address:
        return None

    return email_address.split("@")[-1].strip().lower()


def get_auth_status(authentication_results: str, key: str):
    """
    Extract authentication status such as:
    spf=pass
    dkim=fail
    dmarc=fail
    """

    if not authentication_results:
        return "UNKNOWN"

    pattern = rf"\b{key}\s*=\s*(pass|fail|softfail|neutral|none|temperror|permerror)\b"

    match = re.search(
        pattern,
        authentication_results.lower()
    )

    if match:
        return match.group(1).upper()

    return "UNKNOWN"


def build_threat_dna(
    email_data: dict,
    threat_analysis: dict,
    forensics_analysis: dict,
    url_intelligence: list
):

    authentication = email_data.get("authentication", {})

    authentication_results = authentication.get(
        "authentication_results",
        ""
    )

    received_spf = authentication.get(
        "received_spf",
        ""
    )

    # -------------------------
    # Authentication
    # -------------------------

    spf = get_auth_status(
        authentication_results,
        "spf"
    )

    if spf == "UNKNOWN" and "fail" in received_spf.lower():
        spf = "FAIL"

    dkim = get_auth_status(
        authentication_results,
        "dkim"
    )

    if dkim == "UNKNOWN":
        if authentication.get("dkim_signature_present"):
            dkim = "PRESENT"
        else:
            dkim = "MISSING"

    dmarc = get_auth_status(
        authentication_results,
        "dmarc"
    )

    # -------------------------
    # Email content
    # -------------------------

    subject = email_data.get("subject", "")
    body = email_data.get("body", "")

    text = f"{subject} {body}".lower()

    urgency_words = [
        "urgent",
        "immediately",
        "today",
        "asap",
        "action required",
        "deadline",
        "suspend",
        "suspension"
    ]

    financial_words = [
        "payment",
        "invoice",
        "bank",
        "transfer",
        "money",
        "refund",
        "transaction",
        "account"
    ]

    urgency = any(
        word in text
        for word in urgency_words
    )

    financial = any(
        word in text
        for word in financial_words
    )

    # -------------------------
    # Reply-To mismatch
    # -------------------------

    sender_domain = extract_domain(
        email_data.get("sender", "")
    )

    reply_domain = extract_domain(
        email_data.get("reply_to", "")
    )

    reply_to_mismatch = (
        bool(sender_domain)
        and bool(reply_domain)
        and sender_domain != reply_domain
    )

    # -------------------------
    # URLs
    # -------------------------

    url_count = len(
        threat_analysis.get(
            "extracted_urls",
            []
        )
    )

    has_url = url_count > 0

    # -------------------------
    # Attachments
    # -------------------------

    attachments = email_data.get(
        "attachments",
        []
    )

    has_attachment = len(attachments) > 0

    # -------------------------
    # Typosquatting
    # -------------------------

    typosquatting = any(
        item.get("typosquatting", {}).get(
            "possible_typosquatting",
            False
        )
        for item in url_intelligence
    )

    # -------------------------
    # Relay hops
    # -------------------------

    hop_count = forensics_analysis.get(
        "total_received_headers",
        0
    )

    # -------------------------
    # Threat classification
    # -------------------------

    classification = threat_analysis.get(
        "classification",
        "Unknown"
    )

    # -------------------------
    # DNA fingerprint
    # -------------------------

    dna_string = (
        f"SPF-{spf}"
        f"|DKIM-{dkim}"
        f"|DMARC-{dmarc}"
        f"|URL-{url_count}"
        f"|FIN-{int(financial)}"
        f"|URG-{int(urgency)}"
        f"|RPLY-{int(reply_to_mismatch)}"
        f"|ATT-{int(has_attachment)}"
        f"|HOP-{hop_count}"
        f"|TYPO-{int(typosquatting)}"
    )

    fingerprint = {
        "spf": spf,
        "dkim": dkim,
        "dmarc": dmarc,
        "url": has_url,
        "url_count": url_count,
        "financial": financial,
        "urgency": urgency,
        "reply_to_mismatch": reply_to_mismatch,
        "attachment": has_attachment,
        "hop_count": hop_count,
        "typosquatting": typosquatting
    }

    return {
        "fingerprint": fingerprint,
        "dna_string": dna_string,
        "risk_pattern": classification,
        "description": (
            "Threat DNA represents the behavioral and "
            "technical fingerprint of this email attack."
        )
    }