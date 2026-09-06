import re
from urllib.parse import urlparse


def extract_domain(url: str):
    """
    Extract the hostname/domain from a URL.
    """

    try:
        parsed = urlparse(url)

        domain = parsed.hostname

        if not domain:
            return None

        return domain.lower()

    except Exception:
        return None


def detect_typosquatting(domain: str):
    """
    Detect common suspicious lookalike domain patterns.
    """

    trusted_brands = [
        "paypal.com",
        "microsoft.com",
        "google.com",
        "amazon.com",
        "apple.com"
    ]

    suspicious_patterns = [
        "paypa1",
        "micros0ft",
        "g00gle",
        "amaz0n",
        "app1e",
        "secure-",
        "-security",
        "-support",
        "-login",
        "-verify"
    ]

    domain_lower = domain.lower()

    matched_patterns = []

    for pattern in suspicious_patterns:
        if pattern in domain_lower:
            matched_patterns.append(pattern)

    exact_trusted_domain = domain_lower in trusted_brands

    return {
        "possible_typosquatting": len(matched_patterns) > 0,
        "matched_patterns": matched_patterns,
        "exact_trusted_domain": exact_trusted_domain
    }


def analyze_url(url: str):
    """
    Perform URL and domain intelligence analysis.
    """

    domain = extract_domain(url)

    if not domain:
        return {
            "url": url,
            "status": "invalid"
        }

    parsed = urlparse(url)

    typo_analysis = detect_typosquatting(domain)

    risk_factors = []

    if parsed.scheme != "https":
        risk_factors.append("URL does not use HTTPS")

    if typo_analysis["possible_typosquatting"]:
        risk_factors.append(
            "Domain resembles a trusted brand or contains suspicious naming patterns"
        )

    if "login" in url.lower():
        risk_factors.append("Login-related URL")

    if "verify" in url.lower():
        risk_factors.append("Verification-related URL")

    if "invoice" in url.lower():
        risk_factors.append("Invoice-related URL")

    if len(risk_factors) >= 2:
        risk = "HIGH"
    elif len(risk_factors) == 1:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "url": url,
        "domain": domain,
        "scheme": parsed.scheme,
        "path": parsed.path,
        "typosquatting": typo_analysis,
        "risk": risk,
        "risk_factors": risk_factors
    }


def analyze_urls(urls: list):
    """
    Analyze all URLs extracted from an email.
    """

    return [
        analyze_url(url)
        for url in urls
    ]