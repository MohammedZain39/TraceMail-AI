import ipaddress
import requests


def is_public_ip(ip: str) -> bool:
    try:
        obj = ipaddress.ip_address(ip)

        return (
            obj.version == 4
            and obj.is_global
        )

    except ValueError:
        return False


def get_ip_intelligence(ip: str) -> dict:
    if not is_public_ip(ip):
        return {
            "ip": ip,
            "status": "not_public",
            "country": None,
            "region": None,
            "city": None,
            "latitude": None,
            "longitude": None,
            "isp": None,
            "organization": None,
            "asn": None,
            "hosting": False,
            "vpn": False,
            "tor": False,
            "risk": "UNKNOWN",
        }

    try:
        response = requests.get(
            f"https://ipwho.is/{ip}",
            timeout=5
        )

        response.raise_for_status()

        data = response.json()

        if not data.get("success"):
            raise RuntimeError(
                data.get("message", "GeoIP lookup failed")
            )

        connection = data.get("connection") or {}
        security = data.get("security") or {}

        hosting = bool(
            security.get("hosting")
            or security.get("proxy")
        )

        vpn = bool(
            security.get("vpn")
        )

        tor = bool(
            security.get("tor")
        )

        if tor:
            risk = "HIGH"
        elif vpn or hosting:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return {
            "ip": ip,
            "status": "success",

            "country": data.get("country"),
            "country_code": data.get("country_code"),

            "region": data.get("region"),
            "city": data.get("city"),

            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),

            "isp": connection.get("isp"),
            "organization": connection.get("org"),
            "asn": connection.get("asn"),

            "hosting": hosting,
            "vpn": vpn,
            "tor": tor,

            "risk": risk,

            "lookup_source": "IP Geolocation Intelligence",
        }

    except Exception as error:

        return {
            "ip": ip,
            "status": "lookup_failed",

            "country": None,
            "country_code": None,
            "region": None,
            "city": None,

            "latitude": None,
            "longitude": None,

            "isp": None,
            "organization": None,
            "asn": None,

            "hosting": False,
            "vpn": False,
            "tor": False,

            "risk": "UNKNOWN",

            "error": str(error),
        }


def enrich_ips(ips: list) -> list:
    results = []

    seen = set()

    for ip in ips:

        if ip in seen:
            continue

        seen.add(ip)

        results.append(
            get_ip_intelligence(ip)
        )

    return results