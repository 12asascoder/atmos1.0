#!/usr/bin/env python3
"""
Simple terminal client for Snitch Competitor Surveillance.

Lets you:
1) List competitors
2) Add competitor
3) Delete competitor
without needing the frontend.
"""

import sys
import json
from uuid import UUID
from typing import Optional

import requests

# Change this if your API runs on a different host/port
BASE_URL = "http://localhost:8000/api/v1"


def print_header(title: str) -> None:
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def pause() -> None:
    input("\nPress Enter to continue...")


# ---------- API helpers ----------

def api_get(path: str):
    url = f"{BASE_URL}{path}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        print(f"[ERROR] GET {url} failed: {e}")
        return None


def api_post(path: str, data: dict):
    url = f"{BASE_URL}{path}"
    try:
        resp = requests.post(url, json=data, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        print(f"[ERROR] POST {url} failed: {e}")
        if hasattr(e, "response") and e.response is not None:
            print("Response:", e.response.text)
        return None


def api_delete(path: str):
    url = f"{BASE_URL}{path}"
    try:
        resp = requests.delete(url, timeout=10)
        if resp.status_code == 204:
            return True
        else:
            print(f"[ERROR] DELETE {url} failed: {resp.status_code} {resp.text}")
            return False
    except requests.RequestException as e:
        print(f"[ERROR] DELETE {url} failed: {e}")
        return False


# ---------- Feature: List competitors ----------

def list_competitors() -> None:
    print_header("List of Competitors")
    data = api_get("/competitors")
    if data is None:
        print("Could not fetch competitors.")
        return

    if len(data) == 0:
        print("No competitors found yet. Add one from the menu.")
        return

    for i, comp in enumerate(data, start=1):
        print(f"{i}. {comp.get('name')} (id: {comp.get('id')})")
        domain = comp.get("domain") or "-"
        industry = comp.get("industry") or "-"
        social = comp.get("social_handles") or {}
        print(f"   Domain   : {domain}")
        print(f"   Industry : {industry}")
        if social:
            print(f"   Handles  : {json.dumps(social)}")
        print()

    print(f"Total competitors: {len(data)}")


# ---------- Feature: Add competitor ----------

def add_competitor() -> None:
    print_header("Add Competitor")

    name = input("Brand name (required): ").strip()
    if not name:
        print("Name is required. Aborting.")
        return

    domain = input("Domain (optional, e.g. snitch.co.in): ").strip() or None
    industry = input("Industry (optional, e.g. Fashion): ").strip() or None

    print("\nAdd social handles (optional). Press Enter to skip a network.")
    instagram = input("Instagram handle (e.g. @snitch): ").strip()
    tiktok = input("TikTok handle (e.g. @snitch): ").strip()
    facebook = input("Facebook page (e.g. snitch): ").strip()

    social_handles = {}
    if instagram:
        social_handles["instagram"] = instagram
    if tiktok:
        social_handles["tiktok"] = tiktok
    if facebook:
        social_handles["facebook"] = facebook

    payload = {
        "name": name,
        "domain": domain,
        "industry": industry,
        "social_handles": social_handles or None,
    }

    print("\nSending to API:")
    print(json.dumps(payload, indent=2))

    confirm = input("Proceed? (y/n): ").strip().lower()
    if confirm != "y":
        print("Cancelled.")
        return

    result = api_post("/competitors", payload)
    if result is None:
        print("Failed to create competitor.")
        return

    print("\n✅ Competitor created:")
    print(json.dumps(result, indent=2))


# ---------- Feature: Delete competitor ----------

def delete_competitor() -> None:
    print_header("Delete Competitor")

    # First show the list to help the user choose the id
    data = api_get("/competitors")
    if not data:
        print("No competitors found or failed to fetch.")
        return

    for i, comp in enumerate(data, start=1):
        print(f"{i}. {comp.get('name')} (id: {comp.get('id')})")

    raw = input("\nEnter competitor ID to delete (copy from above): ").strip()
    if not raw:
        print("No ID entered. Aborting.")
        return

    try:
        # Validate UUID format
        UUID(raw)
    except ValueError:
        print("That doesn't look like a valid UUID. Aborting.")
        return

    confirm = input(f"Are you sure you want to delete {raw}? (y/n): ").strip().lower()
    if confirm != "y":
        print("Cancelled.")
        return

    ok = api_delete(f"/competitors/{raw}")
    if ok:
        print("✅ Competitor deleted.")
    else:
        print("Failed to delete competitor.")


# ---------- Menu loop ----------

def main_menu() -> None:
    while True:
        print_header("Snitch Competitor Surveillance – Terminal Client")
        print("Choose an option:")
        print("1) List competitors")
        print("2) Add competitor")
        print("3) Delete competitor")
        print("4) Exit")

        choice = input("\nEnter choice (1-4): ").strip()

        if choice == "1":
            list_competitors()
            pause()
        elif choice == "2":
            add_competitor()
            pause()
        elif choice == "3":
            delete_competitor()
            pause()
        elif choice == "4":
            print("Goodbye 👋")
            sys.exit(0)
        else:
            print("Invalid choice. Try again.")
            pause()


if __name__ == "__main__":
    main_menu()
