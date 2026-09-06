from urllib.parse import urlparse


def extract_domain_from_email(email_address: str):
    """
    Extract domain from an email address.
    """

    if not email_address:
        return None

    if "@" not in email_address:
        return None

    return email_address.split("@")[-1].strip().lower()


def build_threat_graph(email_data, threat_analysis, ip_intelligence, url_intelligence):
    """
    Build a relationship graph connecting email indicators,
    domains, URLs and observed infrastructure.
    """

    nodes = []
    edges = []

    def add_node(node_id, node_type, label, data=None):
        nodes.append({
            "id": node_id,
            "type": node_type,
            "label": label,
            "data": data or {}
        })

    def add_edge(source, target, relationship):
        edges.append({
            "source": source,
            "target": target,
            "relationship": relationship
        })

    # --------------------------------------------------
    # EMAIL NODE
    # --------------------------------------------------

    email_id = "email-1"

    add_node(
        email_id,
        "email",
        email_data.get("subject", "Suspicious Email"),
        {
            "sender": email_data.get("sender"),
            "recipient": email_data.get("recipient")
        }
    )

    # --------------------------------------------------
    # SENDER DOMAIN
    # --------------------------------------------------

    sender = email_data.get("sender", "")
    sender_domain = extract_domain_from_email(sender)

    if sender_domain:

        sender_domain_id = f"domain-sender-{sender_domain}"

        add_node(
            sender_domain_id,
            "domain",
            sender_domain
        )

        add_edge(
            email_id,
            sender_domain_id,
            "sent-from-domain"
        )

    # --------------------------------------------------
    # REPLY-TO DOMAIN
    # --------------------------------------------------

    reply_to = email_data.get("reply_to", "")
    reply_domain = extract_domain_from_email(reply_to)

    if reply_domain:

        reply_domain_id = f"domain-reply-{reply_domain}"

        add_node(
            reply_domain_id,
            "domain",
            reply_domain
        )

        add_edge(
            email_id,
            reply_domain_id,
            "reply-to-domain"
        )

    # --------------------------------------------------
    # URL NODES
    # --------------------------------------------------

    for index, url_data in enumerate(url_intelligence):

        url = url_data.get("url")

        if not url:
            continue

        url_id = f"url-{index + 1}"

        add_node(
            url_id,
            "url",
            url,
            url_data
        )

        add_edge(
            email_id,
            url_id,
            "contains-url"
        )

        domain = url_data.get("domain")

        if domain:

            domain_id = f"domain-url-{index + 1}"

            add_node(
                domain_id,
                "domain",
                domain,
                url_data.get("typosquatting", {})
            )

            add_edge(
                url_id,
                domain_id,
                "resolves-to-domain"
            )

    # --------------------------------------------------
    # IP NODES
    # --------------------------------------------------

    for index, ip_data in enumerate(ip_intelligence):

        ip = ip_data.get("ip")

        if not ip:
            continue

        ip_id = f"ip-{index + 1}"

        add_node(
            ip_id,
            "ip",
            ip,
            ip_data
        )

        # Connect IP to email as observed infrastructure.
        add_edge(
            email_id,
            ip_id,
            "observed-in-relay-path"
        )

    return {
        "nodes": nodes,
        "edges": edges,
        "node_count": len(nodes),
        "edge_count": len(edges)
    }