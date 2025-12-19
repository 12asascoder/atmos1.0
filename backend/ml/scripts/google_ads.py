import os
import json
import time
from datetime import datetime
from playwright.sync_api import sync_playwright

# ========================
# CONFIG
# ========================

ADVERTISER_URL = "https://adstransparency.google.com/advertiser/AR16735076323512287233?region=ALL"
BASE_DIR = "google_ads"

SCROLL_COUNT = 10
SCROLL_DELAY = 2
SAFETY_DELAY = 3
SCREENSHOT_TIMES = [1, 3, 6]

MAX_ADS = 20   

os.makedirs(BASE_DIR, exist_ok=True)



def extract_ids(url):
    advertiser_id = None
    creative_id = None

    if "/advertiser/" in url:
        advertiser_id = url.split("/advertiser/")[1].split("/")[0].split("?")[0]

    if "/creative/" in url:
        creative_id = url.split("/creative/")[1].split("?")[0]

    return advertiser_id, creative_id


# ========================
# PHASE 1: COLLECT CREATIVE URLS
# ========================

def collect_creative_urls(page):
    creative_urls = []

    for _ in range(SCROLL_COUNT):
        links = page.query_selector_all("a[href*='/creative/']")
        for link in links:
            href = link.get_attribute("href")
            if href:
                if href.startswith("/"):
                    href = "https://adstransparency.google.com" + href
                if href not in creative_urls:
                    creative_urls.append(href)

                # 🔥 STOP once we have 20 ads
                if len(creative_urls) >= MAX_ADS:
                    return creative_urls

        page.mouse.wheel(0, 3000)
        page.wait_for_timeout(SCROLL_DELAY * 1000)

    return creative_urls[:MAX_ADS]


# ========================
# PHASE 2: EXTRACT AD DATA
# ========================

def extract_ad_data(page, url):
    advertiser_id, creative_id = extract_ids(url)

    raw_text = page.inner_text("body")
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]

    headline = lines[0] if lines else ""
    description = " ".join(lines[1:4]) if len(lines) > 4 else ""

    possible_ctas = [
        "Learn more", "Shop now", "Sign up", "Download",
        "Apply now", "Watch now", "Get started"
    ]
    cta = next((l for l in lines if l in possible_ctas), "")

    is_video = False
    try:
        page.locator("video").first.wait_for(timeout=3000)
        is_video = True
    except:
        pass

    return {
        "platform": "google",
        "source": "ads_transparency_ui",
        "advertiser_id": advertiser_id,
        "creative_id": creative_id,
        "ad_url": url,
        "headline": headline,
        "description": description,
        "cta": cta,
        "is_video": is_video,
        "date_collected": datetime.utcnow().isoformat()
    }


# ========================
# VIDEO SCREENSHOTS
# ========================

def capture_video_frames(page, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    try:
        page.click("button[aria-label='Play']", timeout=3000)
    except:
        pass

    for t in SCREENSHOT_TIMES:
        time.sleep(t)
        page.screenshot(
            path=os.path.join(out_dir, f"frame_{t}s.png"),
            full_page=False
        )


# ========================
# REACH ESTIMATION (PROXY)
# ========================

def estimate_reach(ad_data, creative_index):
    if ad_data["is_video"]:
        base_score = 30
        ad_format = "video"
    else:
        base_score = 15
        ad_format = "search_or_display"

    days_active_estimate = 30

    reach_score = (
        base_score +
        (days_active_estimate * 0.5) +
        (creative_index * 5)
    )

    if reach_score >= 80:
        reach_level = "High"
    elif reach_score >= 40:
        reach_level = "Medium"
    else:
        reach_level = "Low"

    return {
        "ad_format": ad_format,
        "days_active_estimate": days_active_estimate,
        "estimated_reach_score": round(reach_score, 2),
        "reach_level": reach_level
    }


# ========================
# MAIN
# ========================

def main():
    advertiser_id, _ = extract_ids(ADVERTISER_URL)
    advertiser_dir = os.path.join(BASE_DIR, advertiser_id)
    os.makedirs(advertiser_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=100)
        page = browser.new_page()

        # ---- Phase 1 ----
        page.goto(ADVERTISER_URL, timeout=60000)
        page.wait_for_timeout(4000)

        creative_urls = collect_creative_urls(page)
        print(f"🔍 Processing {len(creative_urls)} ads (limit = {MAX_ADS})")

        # ---- Phase 2 ----
        for idx, url in enumerate(creative_urls, start=1):
            advertiser_id, creative_id = extract_ids(url)
            if not creative_id:
                continue

            ad_dir = os.path.join(advertiser_dir, creative_id)
            frames_dir = os.path.join(ad_dir, "frames")
            os.makedirs(ad_dir, exist_ok=True)

            page.goto(url, timeout=60000)
            page.wait_for_timeout(3000)

            ad_data = extract_ad_data(page, url)

            # Add estimated reach
            ad_data.update(estimate_reach(ad_data, creative_index=idx))

            with open(os.path.join(ad_dir, "metadata.json"), "w", encoding="utf-8") as f:
                json.dump(ad_data, f, indent=2)

            if ad_data["is_video"]:
                capture_video_frames(page, frames_dir)

            time.sleep(SAFETY_DELAY)

        browser.close()

    print("✅ Finished extracting 20 ads successfully")


if __name__ == "__main__":
    main()
