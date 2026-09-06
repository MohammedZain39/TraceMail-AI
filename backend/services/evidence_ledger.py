import hashlib
import json
import sqlite3
from datetime import datetime


DATABASE = "tracemail.db"


def calculate_hash(data: str):
    """
    Generate SHA-256 hash for evidence integrity.
    """

    return hashlib.sha256(
        data.encode("utf-8")
    ).hexdigest()


def initialize_ledger():

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS evidence_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            evidence_hash TEXT NOT NULL,
            previous_hash TEXT,
            block_hash TEXT NOT NULL,
            details TEXT
        )
    """)

    connection.commit()
    connection.close()


def add_ledger_entry(
    event_type: str,
    evidence_hash: str,
    details: dict
):

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    # Get previous block
    cursor.execute("""
        SELECT block_hash
        FROM evidence_ledger
        ORDER BY id DESC
        LIMIT 1
    """)

    result = cursor.fetchone()

    previous_hash = result[0] if result else "GENESIS"

    timestamp = datetime.utcnow().isoformat()

    details_json = json.dumps(
        details,
        sort_keys=True
    )

    # Create current block data
    block_data = (
        f"{timestamp}|"
        f"{event_type}|"
        f"{evidence_hash}|"
        f"{previous_hash}|"
        f"{details_json}"
    )

    block_hash = calculate_hash(block_data)

    cursor.execute("""
        INSERT INTO evidence_ledger (
            timestamp,
            event_type,
            evidence_hash,
            previous_hash,
            block_hash,
            details
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        timestamp,
        event_type,
        evidence_hash,
        previous_hash,
        block_hash,
        details_json
    ))

    connection.commit()

    entry_id = cursor.lastrowid

    connection.close()

    return {
        "ledger_id": entry_id,
        "timestamp": timestamp,
        "event_type": event_type,
        "evidence_hash": evidence_hash,
        "previous_hash": previous_hash,
        "block_hash": block_hash
    }


def verify_ledger():

    connection = sqlite3.connect(DATABASE)

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            timestamp,
            event_type,
            evidence_hash,
            previous_hash,
            block_hash,
            details
        FROM evidence_ledger
        ORDER BY id ASC
    """)

    entries = cursor.fetchall()

    connection.close()

    previous_block_hash = "GENESIS"

    for entry in entries:

        (
            entry_id,
            timestamp,
            event_type,
            evidence_hash,
            previous_hash,
            stored_block_hash,
            details_json
        ) = entry

        if previous_hash != previous_block_hash:

            return {
                "valid": False,
                "failed_at": entry_id,
                "reason": "Previous hash mismatch"
            }

        block_data = (
            f"{timestamp}|"
            f"{event_type}|"
            f"{evidence_hash}|"
            f"{previous_hash}|"
            f"{details_json}"
        )

        calculated_hash = calculate_hash(
            block_data
        )

        if calculated_hash != stored_block_hash:

            return {
                "valid": False,
                "failed_at": entry_id,
                "reason": "Block hash mismatch"
            }

        previous_block_hash = stored_block_hash

    return {
        "valid": True,
        "entries_checked": len(entries),
        "message": "Evidence ledger integrity verified"
    }