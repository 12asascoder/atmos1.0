from playwright.sync_api import sync_playwright
import json
import time
from datetime import datetime

# ===========================
# CONFIG
# ===========================
COMPANIES = [
    "Nike",
    "Adidas",
    "Apple"
]

COUNTRY = "GB"        # UK / EU recommended
MAX_ADS_PER_COMPANY = 10
OUTPUT_FILE = "output_ads.json"

# ===========================
# HELPER FUNCTIONS
# ===========================
def safe_text(el):
    try:
        return el.inner_text().strip()
    except:
        return ""

# ===========================
# MAIN CRAWLER
# ===========================
def crawl_ads():
    all_ads = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for company in COMPANIES:
            print(f"🔍 Crawling ads for {company}")

            url = (
                "https://www.facebook.com/ads/library/"
                f"?active_status=all&ad_type=all&country={COUNTRY}&q={company}"
            )

            page.goto(url, timeout=60000)
            page.wait_for_timeout(6000)

            ads = page.query_selector_all("div[role='article']")
            print(f"   Found {len(ads)} ads")

            count = 0
            for ad in ads:
                if count >= MAX_ADS_PER_COMPANY:
                    break

                ad_data = {}

                ad_data["company"] = company
                ad_data["scraped_at"] = datetime.utcnow().isoformat() + "Z"

                # Ad text
                ad_data["ad_text"] = safe_text(
                    ad.query_selector("div[data-ad-preview='message']")
                )

                # Page name
                ad_data["page_name"] = safe_text(
                    ad.query_selector("strong")
                )

                # Snapshot URL
                link = ad.query_selector("a[href*='ads/library']")
                ad_data["ad_snapshot_url"] = link.get_attribute("href") if link else None

                # Meta info text (contains spend, impressions, date)
                meta_text = safe_text(ad)

                # Extract spend range (basic heuristic)
                if "Spent" in meta_text:
                    ad_data["spend_info"] = meta_text.split("Spent")[1][:60]
                else:
                    ad_data["spend_info"] = None

                # Extract impressions
                if "Impressions" in meta_text:
                    ad_data["impressions_info"] = meta_text.split("Impressions")[1][:60]
                else:
                    ad_data["impressions_info"] = None

                ad_data["raw_meta_text"] = meta_text

                all_ads.append(ad_data)
                count += 1

            time.sleep(3)

        browser.close()

    return all_ads


# ===========================
# RUN
# ===========================
if __name__ == "__main__":
    ads = crawl_ads()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(ads, f, indent=2, ensure_ascii=False)

    print("\n✅ Crawling complete")
    print(f"📁 Saved {len(ads)} ads to {OUTPUT_FILE}")
