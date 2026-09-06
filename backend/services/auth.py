import os
import requests
from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.getenv(
    "SUPABASE_PUBLISHABLE_KEY", ""
).strip()


def get_current_user(
    authorization: str | None = Header(default=None),
):
    if not SUPABASE_URL:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_URL is not configured.",
        )

    if not SUPABASE_PUBLISHABLE_KEY:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_PUBLISHABLE_KEY is not configured.",
        )

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication header.",
        )

    token = authorization[len("Bearer "):].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing access token.",
        )

    try:
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_PUBLISHABLE_KEY,
            },
            timeout=10,
        )

    except requests.RequestException as error:
        print("SUPABASE CONNECTION ERROR:", error)

        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable.",
        )

    print(
        "SUPABASE AUTH:",
        response.status_code,
        response.text[:300],
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session.",
        )

    try:
        user = response.json()
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication response.",
        )

    if not user.get("id"):
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    return user