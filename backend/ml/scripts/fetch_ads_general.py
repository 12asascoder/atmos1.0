import json
import os
from pathlib import Path
from datetime import datetime

import requests
from dotenv import load_dotenv

# ===========================
# Load env vars
# ===========================

load_dotenv()  # loads from .env into environment

META_ACCESS_TOKEN = os.getenv("META_ADS_ACCESS_TOKEN")
if not META_ACCESS_TOKEN:
    raise RuntimeError("META_ADS_ACCESS_TOKEN not found in environment (.env).")

# ===========================
# Config – you can change these
# ===========================

META_API_VERSION = "v18.0"

SEARCH_TERMS = "test"      # "" = no keyword filter, general ads
COUNTRY = "US"             # change to "GB", "DE", etc. if needed
AD_TYPE = "POLITICAL_AND_ISSUE_ADS"
LIMIT = 20

# ===========================
# Paths – store under backend/ml/data/
# ===========================

BASE_DIR = Path(__file__).resolve().parents[2] / "ml"
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_FILE = DATA_DIR / f"ads_general_{COUNTRY}_{timestamp}.json"


# ===========================
# Fetch from Meta Ad Library
# ===========================

def fetch_ads_general():
    url = f"https://graph.facebook.com/{META_API_VERSION}/ads_archive"

    params = {
        "access_token": META_ACCESS_TOKEN,
        "ad_reached_countries": COUNTRY,   # ✅ just "US"
        "ad_active_status": "ALL",
        "ad_type": AD_TYPE,
        "limit": LIMIT,
        "fields": ",".join([
            "id",
            "page_id",
            "page_name",
            "ad_delivery_start_time",
            "ad_delivery_stop_time",
            "ad_snapshot_url",
        ]),
        "search_terms": SEARCH_TERMS,
    }

    print(f"[INFO] Fetching up to {LIMIT} ads for country={COUNTRY}, type={AD_TYPE}...")
    print("[DEBUG] Request URL:", url)
    print("[DEBUG] Params:", params)

    resp = requests.get(url, params=params)

    print("[DEBUG] Status code:", resp.status_code)

    # 🔍 Show full error info if request failed
    if not resp.ok:
        print("[DEBUG] Raw response text:", resp.text)
        try:
            err = resp.json().get("error", {})
            print("[ERROR] Meta API error message:", err.get("message"))
            print("        type:", err.get("type"),
                  "code:", err.get("code"),
                  "subcode:", err.get("error_subcode"))
        except Exception:
            print("[ERROR] Could not parse JSON error; body was:")
            print(resp.text)
        resp.raise_for_status()

    return resp.json()


def clean_ads(raw_json):
    ads = []
    for item in raw_json.get("data", []):
        ads.append({
            "ad_id": item.get("id"),
            "page_id": item.get("page_id"),
            "page_name": item.get("page_name"),
            "start_time": item.get("ad_delivery_start_time"),
            "stop_time": item.get("ad_delivery_stop_time"),
            "snapshot_url": item.get("ad_snapshot_url"),
        })
    return ads


def save_ads(ads):
    with open(OUTPUT_FILE, "w") as f:
        json.dump(ads, f, indent=2)
    print(f"[OK] Saved {len(ads)} ads to:\n  {OUTPUT_FILE}")


if __name__ == "__main__":
    raw = fetch_ads_general()
    ads = clean_ads(raw)
    save_ads(ads)

    for ad in ads[:5]:
        print(f"- {ad['ad_id']} | {ad['page_name']} | {ad['snapshot_url']}")
