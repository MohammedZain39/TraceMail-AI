import re
import ipaddress


def extract_ips_from_header(header: str):
    """
    Extract IPv4 and IPv6 addresses from a Received header.
    """

    ipv4_pattern = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"

    ipv4_addresses = re.findall(ipv4_pattern, header)

    return ipv4_addresses


def classify_ip(ip: str):
    """
    Classify an IP address as public, private, reserved, loopback, etc.
    """

    try:
        ip_obj = ipaddress.ip_address(ip)

        if ip_obj.is_private:
            return "private"

        if ip_obj.is_loopback:
            return "loopback"

        if ip_obj.is_reserved:
            return "reserved"

        if ip_obj.is_multicast:
            return "multicast"

        if ip_obj.is_unspecified:
            return "unspecified"

        return "public"

    except ValueError:
        return "invalid"


def analyze_received_headers(received_headers: list):
    """
    Analyze Received headers and reconstruct the observed relay path.
    """

    relay_path = []

    all_ips = []

    for index, header in enumerate(received_headers, start=1):

        ips = extract_ips_from_header(header)

        hop_ips = []

        for ip in ips:

            classification = classify_ip(ip)

            hop_ips.append({
                "ip": ip,
                "classification": classification
            })

            all_ips.append(ip)

        relay_path.append({
            "hop": index,
            "raw_header": header,
            "ips": hop_ips
        })

    # Remove duplicate IPs while preserving order
    unique_ips = list(dict.fromkeys(all_ips))

    public_ips = [
        ip for ip in unique_ips
        if classify_ip(ip) == "public"
    ]

    # Received headers are normally listed newest → oldest.
    # Therefore, the last observed public IP is the earliest
    # observed public infrastructure in the header chain.
    earliest_observed_public_ip = (
        public_ips[-1] if public_ips else None
    )

    return {
        "total_received_headers": len(received_headers),
        "relay_path": relay_path,
        "all_ips": unique_ips,
        "public_ips": public_ips,
        "earliest_observed_public_ip": earliest_observed_public_ip
    }