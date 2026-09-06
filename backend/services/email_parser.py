from email import policy
from email.parser import BytesParser
from email.message import Message


def extract_email_data(file_bytes: bytes) -> dict:
    """
    Parse a raw .eml email and extract important forensic information.
    """

    msg: Message = BytesParser(policy=policy.default).parsebytes(file_bytes)

    # Basic email information
    sender = msg.get("From", "")
    recipient = msg.get("To", "")
    subject = msg.get("Subject", "")
    date = msg.get("Date", "")
    reply_to = msg.get("Reply-To", "")
    message_id = msg.get("Message-ID", "")

    # Authentication information
    authentication_results = msg.get("Authentication-Results", "")
    received_spf = msg.get("Received-SPF", "")
    dkim_signature = msg.get("DKIM-Signature", "")

    # Extract body
    body = ""

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()

            if content_type == "text/plain":
                try:
                    body = part.get_content()
                    break
                except Exception:
                    pass

    else:
        try:
            body = msg.get_content()
        except Exception:
            body = ""

    # Extract all Received headers
    received_headers = msg.get_all("Received", [])

    # Extract attachments
    attachments = []

    for part in msg.iter_attachments():
        filename = part.get_filename()

        if filename:
            attachments.append({
                "filename": filename,
                "content_type": part.get_content_type()
            })

    return {
        "sender": sender,
        "recipient": recipient,
        "subject": subject,
        "date": date,
        "reply_to": reply_to,
        "message_id": message_id,

        "authentication": {
            "authentication_results": authentication_results,
            "received_spf": received_spf,
            "dkim_signature_present": bool(dkim_signature)
        },

        "received_headers": received_headers,

        "body": body,

        "attachments": attachments
    }