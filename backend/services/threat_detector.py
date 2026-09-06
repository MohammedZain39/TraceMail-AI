import re
from urllib.parse import urlparse


URGENT_KEYWORDS = [
    "urgent",
    "immediately",
    "action required",
    "act now",
    "within 24 hours",
    "today",
    "as soon as possible",
]

FINANCIAL_KEYWORDS = [
    "payment",
    "invoice",
    "bank",
    "transfer",
    "wire",
    "account",
    "refund",
    "billing",
    "transaction",
]

THREAT_KEYWORDS = [
    "suspend",
    "suspended",
    "blocked",
    "terminate",
    "legal action",
    "account will be closed",
]

CREDENTIAL_KEYWORDS = [
    "password",
    "login",
    "verify your account",
    "verification",
    "credentials",
    "sign in",
]


def extract_urls(text: str) -> list:
    """Extract URLs from email text."""

    url_pattern = r'https?://[^\s<>"\']+'

    return re.findall(url_pattern, text or "")


def extract_domains_from_urls(urls: list) -> list:
    """Extract domains from URLs."""

    domains = []

    for url in urls:
        try:
            domain = urlparse(url).netloc

            if domain:
                domains.append(domain.lower())

        except Exception:
            pass

    return list(set(domains))


def check_reply_to_mismatch(sender: str, reply_to: str) -> bool:
    """Check whether Reply-To domain differs from sender domain."""

    if not sender or not reply_to:
        return False

    sender_match = re.search(r'@([\w.-]+)', sender)
    reply_match = re.search(r'@([\w.-]+)', reply_to)

    if not sender_match or not reply_match:
        return False

    sender_domain = sender_match.group(1).lower()
    reply_domain = reply_match.group(1).lower()

    return sender_domain != reply_domain


def keyword_matches(text: str, keywords: list) -> list:
    """Return keywords found in text."""

    text_lower = text.lower()

    return [
        keyword
        for keyword in keywords
        if keyword.lower() in text_lower
    ]


def detect_threat(email_data: dict) -> dict:
    """
    Analyze parsed email data and generate
    an explainable threat assessment.
    """

    score = 0
    risk_factors = []

    sender = email_data.get("sender", "")
    reply_to = email_data.get("reply_to", "")
    subject = email_data.get("subject", "")
    body = email_data.get("body", "")

    authentication = email_data.get("authentication", {})

    authentication_results = (
        authentication.get("authentication_results", "")
    ).lower()

    received_spf = (
        authentication.get("received_spf", "")
    ).lower()

    dkim_present = authentication.get(
        "dkim_signature_present",
        False
    )

    full_text = f"{subject} {body}"

    # ------------------------------------------------
    # 1. SPF
    # ------------------------------------------------

    if "spf=fail" in authentication_results or "fail" in received_spf:

        score += 20

        risk_factors.append({
            "type": "authentication",
            "severity": "high",
            "message": "SPF authentication failed"
        })

    # ------------------------------------------------
    # 2. DKIM
    # ------------------------------------------------

    if not dkim_present or "dkim=fail" in authentication_results:

        score += 15

        risk_factors.append({
            "type": "authentication",
            "severity": "medium",
            "message": "DKIM authentication is missing or failed"
        })

    # ------------------------------------------------
    # 3. DMARC
    # ------------------------------------------------

    if "dmarc=fail" in authentication_results:

        score += 20

        risk_factors.append({
            "type": "authentication",
            "severity": "high",
            "message": "DMARC authentication failed"
        })

    # ------------------------------------------------
    # 4. Reply-To mismatch
    # ------------------------------------------------

    if check_reply_to_mismatch(sender, reply_to):

        score += 15

        risk_factors.append({
            "type": "header",
            "severity": "high",
            "message": "Reply-To domain differs from sender domain"
        })

    # ------------------------------------------------
    # 5. Urgency
    # ------------------------------------------------

    urgent_matches = keyword_matches(
        full_text,
        URGENT_KEYWORDS
    )

    if urgent_matches:

        score += 10

        risk_factors.append({
            "type": "content",
            "severity": "medium",
            "message": "Urgency language detected",
            "matches": urgent_matches
        })

    # ------------------------------------------------
    # 6. Financial intent
    # ------------------------------------------------

    financial_matches = keyword_matches(
        full_text,
        FINANCIAL_KEYWORDS
    )

    if financial_matches:

        score += 10

        risk_factors.append({
            "type": "content",
            "severity": "high",
            "message": "Financial/payment-related intent detected",
            "matches": financial_matches
        })

    # ------------------------------------------------
    # 7. Threat / account pressure
    # ------------------------------------------------

    threat_matches = keyword_matches(
        full_text,
        THREAT_KEYWORDS
    )

    if threat_matches:

        score += 5

        risk_factors.append({
            "type": "content",
            "severity": "medium",
            "message": "Threatening or account-pressure language detected",
            "matches": threat_matches
        })

    # ------------------------------------------------
    # 8. Credential harvesting indicators
    # ------------------------------------------------

    credential_matches = keyword_matches(
        full_text,
        CREDENTIAL_KEYWORDS
    )

    if credential_matches:

        score += 10

        risk_factors.append({
            "type": "content",
            "severity": "high",
            "message": "Credential-related language detected",
            "matches": credential_matches
        })

    # ------------------------------------------------
    # 9. URL detection
    # ------------------------------------------------

    urls = extract_urls(full_text)

    domains = extract_domains_from_urls(urls)

    if urls:

        score += 10

        risk_factors.append({
            "type": "url",
            "severity": "medium",
            "message": f"{len(urls)} URL(s) detected in email"
        })

    # ------------------------------------------------
    # Limit score
    # ------------------------------------------------

    score = min(score, 100)

    # ------------------------------------------------
    # Classification
    # ------------------------------------------------

    if score >= 80:
        severity = "CRITICAL"

    elif score >= 60:
        severity = "HIGH"

    elif score >= 40:
        severity = "MEDIUM"

    elif score >= 20:
        severity = "LOW"

    else:
        severity = "SAFE"

    # ------------------------------------------------
    # Determine threat type
    # ------------------------------------------------

    if financial_matches and urgent_matches:

        threat_type = "Business Email Compromise / Financial Phishing"

    elif credential_matches:

        threat_type = "Credential Phishing"

    elif urgent_matches and urls:

        threat_type = "Phishing"

    elif urls:

        threat_type = "Suspicious Email"

    else:

        threat_type = "Potentially Suspicious"

    return {
        "risk_score": score,
        "severity": severity,
        "classification": threat_type,
        "risk_factors": risk_factors,
        "extracted_urls": urls,
        "extracted_domains": domains,
        "analysis_engine": "TraceMail Rule Engine v1"
    }