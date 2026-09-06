from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether
)
from reportlab.lib.units import mm


def generate_pdf_report(report, output_path):

    # ==================================================
    # DOCUMENT
    # ==================================================

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="TraceMail AI - Email Forensic Investigation Report",
        author="TraceMail AI"
    )

    styles = getSampleStyleSheet()

    # ==================================================
    # STYLES
    # ==================================================

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=22,
        leading=26,
        spaceAfter=5
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Heading1"],
        alignment=TA_CENTER,
        fontSize=13,
        leading=17,
        spaceAfter=12
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        spaceBefore=10,
        spaceAfter=7,
        keepWithNext=True
    )

    normal_style = ParagraphStyle(
        "NormalCustom",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        spaceAfter=3
    )

    small_style = ParagraphStyle(
        "Small",
        parent=styles["BodyText"],
        fontSize=8,
        leading=11
    )

    table_text_style = ParagraphStyle(
        "TableText",
        parent=styles["BodyText"],
        fontSize=8,
        leading=10
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=table_text_style,
        fontName="Helvetica-Bold"
    )

    explanation_style = ParagraphStyle(
        "Explanation",
        parent=styles["BodyText"],
        fontSize=8.5,
        leading=12,
        spaceAfter=5
    )

    # ==================================================
    # HELPER FUNCTIONS
    # ==================================================

    def safe_text(value):
        """
        Convert a value into safe plain text.
        """

        if value is None:
            return "N/A"

        return str(value)

    def table_text(value):
        """
        Create a simple table paragraph.
        """

        text = safe_text(value)

        return Paragraph(
            text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;"),
            table_text_style
        )

    def table_header(value):
        """
        Create a table header.
        """

        text = safe_text(value)

        return Paragraph(
            text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;"),
            table_header_style
        )

    def formatted_text(label, value):
        """
        Create formatted text where HTML tags are intentionally
        interpreted by ReportLab.
        """

        value = safe_text(value)

        return Paragraph(
            f"<b>{label}</b> {value}",
            normal_style
        )

    def footer(canvas, document):

        canvas.saveState()

        canvas.setFont(
            "Helvetica",
            7
        )

        canvas.drawString(
            18 * mm,
            10 * mm,
            "TraceMail AI — Email Threat Detection & Forensic Intelligence"
        )

        canvas.drawRightString(
            A4[0] - 18 * mm,
            10 * mm,
            f"Page {document.page}"
        )

        canvas.restoreState()

    # ==================================================
    # STORY
    # ==================================================

    story = []

    # ==================================================
    # TITLE
    # ==================================================

    metadata = report.get(
        "report_metadata",
        {}
    )

    title_block = [

        Paragraph(
            "TraceMail AI",
            title_style
        ),

        Paragraph(
            "Email Forensic Investigation Report",
            subtitle_style
        ),

        formatted_text(
            "Case ID:",
            metadata.get(
                "case_id",
                "N/A"
            )
        ),

        formatted_text(
            "Report Generated:",
            metadata.get(
                "generated_at",
                "N/A"
            )
        ),

        Spacer(1, 8)
    ]

    story.append(
        KeepTogether(title_block)
    )

    # ==================================================
    # 1. EXECUTIVE SUMMARY
    # ==================================================

    summary = report.get(
        "executive_summary",
        {}
    )

    summary_section = [

        Paragraph(
            "1. Executive Summary",
            section_style
        )
    ]

    summary_data = [

        [
            table_header("Severity"),
            table_text(
                summary.get(
                    "severity",
                    "UNKNOWN"
                )
            )
        ],

        [
            table_header("Risk Score"),
            table_text(
                f"{summary.get('risk_score', 0)}/100"
            )
        ],

        [
            table_header("Threat Type"),
            table_text(
                summary.get(
                    "classification",
                    "Unknown"
                )
            )
        ]
    ]

    summary_table = Table(
        summary_data,
        colWidths=[
            45 * mm,
            125 * mm
        ]
    )

    summary_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6)
        ])
    )

    summary_section.append(
        summary_table
    )

    summary_section.append(
        Spacer(1, 7)
    )

    summary_section.append(
        formatted_text(
            "Assessment:",
            summary.get(
                "conclusion",
                "No assessment available."
            )
        )
    )

    story.append(
        KeepTogether(summary_section)
    )

    # ==================================================
    # 2. EMAIL EVIDENCE
    # ==================================================

    email = report.get(
        "email_evidence",
        {}
    )

    email_section = [

        Paragraph(
            "2. Email Evidence",
            section_style
        )
    ]

    email_data = [

        [
            table_header("Filename"),
            table_text(
                email.get(
                    "filename",
                    "N/A"
                )
            )
        ],

        [
            table_header("Sender"),
            table_text(
                email.get(
                    "sender",
                    "N/A"
                )
            )
        ],

        [
            table_header("Recipient"),
            table_text(
                email.get(
                    "recipient",
                    "N/A"
                )
            )
        ],

        [
            table_header("Reply-To"),
            table_text(
                email.get(
                    "reply_to",
                    "N/A"
                )
            )
        ],

        [
            table_header("Subject"),
            table_text(
                email.get(
                    "subject",
                    "N/A"
                )
            )
        ],

        [
            table_header("Date"),
            table_text(
                email.get(
                    "date",
                    "N/A"
                )
            )
        ],

        [
            table_header("Message ID"),
            table_text(
                email.get(
                    "message_id",
                    "N/A"
                )
            )
        ]
    ]

    email_table = Table(
        email_data,
        colWidths=[
            40 * mm,
            130 * mm
        ]
    )

    email_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5)
        ])
    )

    email_section.append(
        email_table
    )

    story.append(
        KeepTogether(email_section)
    )

    # ==================================================
    # 3. EMAIL AUTHENTICATION
    # ==================================================

    auth = report.get(
        "authentication_findings",
        {}
    )

    auth_section = [

        Paragraph(
            "3. Email Authentication",
            section_style
        )
    ]

    auth_data = [

        [
            table_header("Authentication Check"),
            table_header("Result")
        ],

        [
            table_text("SPF"),
            table_text(
                auth.get(
                    "received_spf",
                    "Not available"
                )
            )
        ],

        [
            table_text("DKIM Signature"),
            table_text(
                "Present"
                if auth.get(
                    "dkim_signature_present",
                    False
                )
                else
                "Missing"
            )
        ],

        [
            table_text("Authentication Summary"),
            table_text(
                auth.get(
                    "authentication_results",
                    "Not available"
                )
            )
        ]
    ]

    auth_table = Table(
        auth_data,
        colWidths=[
            65 * mm,
            105 * mm
        ],
        repeatRows=1
    )

    auth_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5)
        ])
    )

    auth_section.append(
        auth_table
    )

    auth_section.append(
        Spacer(1, 6)
    )

    auth_section.append(
        Paragraph(
            "These checks help determine whether the sender's domain "
            "was properly authenticated. Failed checks increase the "
            "suspicion level but should be considered together with "
            "the other evidence.",
            explanation_style
        )
    )

    story.append(
        KeepTogether(auth_section)
    )

    # ==================================================
    # 4. HEADER & RELAY FORENSICS
    # ==================================================

    relay = report.get(
        "relay_forensics",
        {}
    )

    relay_section = [

        Paragraph(
            "4. Email Header & Relay Analysis",
            section_style
        ),

        formatted_text(
            "Total Relay Hops:",
            relay.get(
                "total_hops",
                0
            )
        ),

        formatted_text(
            "Earliest Observed Public IP:",
            relay.get(
                "earliest_observed_public_ip",
                "N/A"
            )
        )
    ]

    public_ips = relay.get(
        "public_ips",
        []
    )

    if public_ips:

        relay_section.append(
            Paragraph(
                "<b>Observed Public IP Addresses</b>",
                normal_style
            )
        )

        for ip in public_ips:

            relay_section.append(
                Paragraph(
                    f"• {ip}",
                    small_style
                )
            )

    relay_section.append(
        Spacer(1, 4)
    )

    relay_section.append(
        Paragraph(
            "Note: The earliest observed IP represents source "
            "infrastructure visible in the email headers. It should "
            "not automatically be treated as the attacker's physical "
            "location.",
            explanation_style
        )
    )

    story.append(
        KeepTogether(relay_section)
    )

    # ==================================================
    # 5. IP INTELLIGENCE
    # ==================================================

    ip_data = report.get(
        "ip_intelligence",
        []
    )

    ip_section = [

        Paragraph(
            "5. IP Intelligence",
            section_style
        )
    ]

    if ip_data:

        rows = [

            [
                table_header("IP Address"),
                table_header("Country"),
                table_header("City"),
                table_header("Network / ISP"),
                table_header("Risk")
            ]
        ]

        for item in ip_data:

            rows.append([

                table_text(
                    item.get(
                        "ip",
                        "N/A"
                    )
                ),

                table_text(
                    item.get(
                        "country",
                        "Unknown"
                    )
                ),

                table_text(
                    item.get(
                        "city",
                        "Unknown"
                    )
                ),

                table_text(
                    item.get(
                        "isp",
                        "Unknown"
                    )
                ),

                table_text(
                    item.get(
                        "risk",
                        "Unknown"
                    )
                )
            ])

        ip_table = Table(
            rows,
            colWidths=[
                32 * mm,
                30 * mm,
                30 * mm,
                42 * mm,
                25 * mm
            ],
            repeatRows=1
        )

        ip_table.setStyle(
            TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5)
            ])
        )

        ip_section.append(
            ip_table
        )

        ip_section.append(
            Spacer(1, 6)
        )

        ip_section.append(
            Paragraph(
                "IP location data describes the network infrastructure "
                "associated with the observed address. It does not "
                "necessarily identify the attacker's real-world location.",
                explanation_style
            )
        )

    else:

        ip_section.append(
            Paragraph(
                "No public IP intelligence was available.",
                normal_style
            )
        )

    story.append(
        KeepTogether(ip_section)
    )

    # ==================================================
    # 6. URL & DOMAIN INTELLIGENCE
    # ==================================================

    url_data = report.get(
        "url_intelligence",
        {}
    )

    urls = url_data.get(
        "urls",
        []
    )

    domains = url_data.get(
        "domains",
        []
    )

    url_section = [

        Paragraph(
            "6. URL & Domain Intelligence",
            section_style
        ),

        formatted_text(
            "URLs Found:",
            len(urls)
        )
    ]

    if urls:

        for url in urls:

            url_section.append(
                Paragraph(
                    f"• {safe_text(url)}",
                    small_style
                )
            )

    else:

        url_section.append(
            Paragraph(
                "No URLs were found in the email.",
                normal_style
            )
        )

    url_section.append(
        Spacer(1, 4)
    )

    url_section.append(
        formatted_text(
            "Domains Found:",
            ", ".join(domains)
            if domains
            else "None"
        )
    )

    url_section.append(
        Spacer(1, 5)
    )

    url_section.append(
        Paragraph(
            "The domain and URL analysis checks for suspicious "
            "naming patterns, unsafe links and indicators that may "
            "suggest impersonation or phishing activity.",
            explanation_style
        )
    )

    story.append(
        KeepTogether(url_section)
    )

    # ==================================================
    # 7. THREAT DNA
    # ==================================================

    dna = report.get(
        "threat_dna",
        {}
    )

    fingerprint = dna.get(
        "fingerprint",
        {}
    )

    dna_section = [

        Paragraph(
            "7. Threat DNA",
            section_style
        ),

        Paragraph(
            "Threat DNA is a compact summary of the email's "
            "important security characteristics. It helps investigators "
            "quickly compare this email with other suspicious emails.",
            explanation_style
        )
    ]

    # Human-readable labels
    dna_labels = {

        "spf": "SPF Authentication",

        "dkim": "DKIM Authentication",

        "dmarc": "DMARC Authentication",

        "url": "Contains URL",

        "url_count": "Number of URLs",

        "financial": "Financial / Payment Intent",

        "urgency": "Urgency Language",

        "reply_to_mismatch": "Reply-To Different From Sender",

        "attachment": "Contains Attachment",

        "hop_count": "Email Relay Hops",

        "typosquatting": "Suspicious / Impersonating Domain"
    }

    dna_rows = [

        [
            table_header("Security Feature"),
            table_header("Finding")
        ]
    ]

    for key, value in fingerprint.items():

        label = dna_labels.get(
            key,
            key.replace("_", " ").title()
        )

        # Convert boolean values into understandable text
        if isinstance(value, bool):

            display_value = (
                "Yes"
                if value
                else
                "No"
            )

        else:

            display_value = value

        dna_rows.append([

            table_text(label),

            table_text(display_value)

        ])

    dna_table = Table(
        dna_rows,
        colWidths=[
            90 * mm,
            80 * mm
        ],
        repeatRows=1
    )

    dna_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5)
        ])
    )

    dna_section.append(
        dna_table
    )

    dna_section.append(
        Spacer(1, 7)
    )

    dna_section.append(
        Paragraph(
            "<b>Threat DNA Fingerprint</b>",
            normal_style
        )
    )

    dna_section.append(
        Paragraph(
            safe_text(
                dna.get(
                    "dna_string",
                    "N/A"
                )
            ),
            small_style
        )
    )

    dna_section.append(
        Spacer(1, 5)
    )

    dna_section.append(
        formatted_text(
            "Detected Pattern:",
            dna.get(
                "risk_pattern",
                "Unknown"
            )
        )
    )

    story.append(
        KeepTogether(dna_section)
    )

    # ==================================================
    # 8. IDENTIFIED RISK FACTORS
    # ==================================================

    risk_factors = report.get(
        "risk_factors",
        []
    )

    risk_section = [

        Paragraph(
            "8. Identified Risk Factors",
            section_style
        ),

        Paragraph(
            "The following indicators contributed to the threat "
            "assessment.",
            explanation_style
        )
    ]

    if risk_factors:

        for factor in risk_factors:

            # Handle structured dictionary output
            if isinstance(factor, dict):

                message = factor.get(
                    "message",
                    "Suspicious indicator detected."
                )

                severity = factor.get(
                    "severity",
                    "unknown"
                )

                risk_section.append(

                    Paragraph(
                        f"<b>{message}</b> "
                        f"<font size='7'>[{severity.upper()}]</font>",
                        normal_style
                    )
                )

                matches = factor.get(
                    "matches",
                    []
                )

                if matches:

                    risk_section.append(

                        Paragraph(
                            "Detected terms: "
                            + ", ".join(
                                str(x)
                                for x in matches
                            ),
                            small_style
                        )
                    )

            else:

                risk_section.append(
                    Paragraph(
                        f"• {safe_text(factor)}",
                        normal_style
                    )
                )

    else:

        risk_section.append(
            Paragraph(
                "No additional risk factors were identified.",
                normal_style
            )
        )

    story.append(
        KeepTogether(risk_section)
    )

    # ==================================================
    # 9. EVIDENCE INTEGRITY
    # ==================================================

    integrity = report.get(
        "evidence_integrity",
        {}
    )

    integrity_section = [

        Paragraph(
            "9. Evidence Integrity",
            section_style
        ),

        formatted_text(
            "Integrity Method:",
            integrity.get(
                "integrity_method",
                "SHA-256"
            )
        ),

        Paragraph(
            "<b>Evidence Hash</b>",
            normal_style
        ),

        Paragraph(
            safe_text(
                integrity.get(
                    "sha256",
                    "N/A"
                )
            ),
            small_style
        ),

        Spacer(1, 5),

        Paragraph(
            "This SHA-256 hash acts as a digital fingerprint of "
            "the analyzed email evidence. If the original evidence "
            "changes, its hash will also change, helping investigators "
            "detect unexpected modification.",
            explanation_style
        )
    ]

    story.append(
        KeepTogether(integrity_section)
    )

    # ==================================================
    # 10. INVESTIGATOR CONCLUSION
    # ==================================================

    conclusion = report.get(
        "investigator_conclusion",
        "No conclusion available."
    )

    conclusion_section = [

        Paragraph(
            "10. Investigator Conclusion",
            section_style
        ),

        Paragraph(
            safe_text(conclusion),
            normal_style
        ),

        Spacer(1, 10),

        Paragraph(
            "<b>TraceMail AI</b>",
            small_style
        ),

        Paragraph(
            "Email Threat Detection & Forensic Intelligence Platform",
            small_style
        )
    ]

    story.append(
        KeepTogether(conclusion_section)
    )

    # ==================================================
    # BUILD PDF
    # ==================================================

    doc.build(
        story,
        onFirstPage=footer,
        onLaterPages=footer
    )