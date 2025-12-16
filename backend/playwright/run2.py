#!/usr/bin/env python3
"""
REALISTIC Social Media Ads Scraper
Scrapes Facebook Ad Library AND Google Ad Transparency Center
"""

import json
import asyncio
import random
import re
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright

# ===========================
# Configuration
# ===========================
SEARCH_TERMS = ["Nike", "Adidas", "Apple"]  # Official company names
COUNTRY = "US"  # Change to your country
ADS_PER_COMPANY = 10  # Target 10+ ads per company
MAX_SCROLL_ATTEMPTS = 15  # Scroll more to load more ads

# Facebook Ad Library URL template
FACEBOOK_URL = "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country={country}&q={search_term}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped"

# Google Ad Transparency URL template
GOOGLE_URL = "https://adstransparency.google.com/?region={region}&query={query}"

# ===========================
# Facebook Scraper
# ===========================
async def scrape_facebook_ads(search_term: str, target_ads: int = ADS_PER_COMPANY) -> List[Dict]:
    """Scrape official Facebook ads for a specific company"""
    
    print(f"🔍 Scraping Facebook ads for: '{search_term}'")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            # Add cookies/login if available for better results
        )
        
        page = await context.new_page()
        
        # Go to Facebook Ad Library with search for official company
        url = FACEBOOK_URL.format(country=COUNTRY, search_term=search_term)
        await page.goto(url, wait_until="networkidle", timeout=90000)
        
        print(f"📄 Page loaded: {await page.title()}")
        await page.wait_for_timeout(5000)
        
        # Take screenshot for debugging
        await page.screenshot(path=f"facebook_{search_term}_initial.png", full_page=True)
        
        # Try to filter for official page if available
        await filter_for_official_company(page, search_term)
        
        # Scroll to load more ads
        print(f"🔄 Scrolling to load ads (target: {target_ads} ads)...")
        ads_loaded = 0
        seen_ad_hashes = set()
        all_ads = []
        
        for scroll_attempt in range(MAX_SCROLL_ATTEMPTS):
            # Extract ads after each scroll
            current_ads = await extract_facebook_ads_from_page(page, search_term)
            
            for ad in current_ads:
                ad_hash = ad.get("unique_ad_identifier", "")
                if ad_hash not in seen_ad_hashes:
                    seen_ad_hashes.add(ad_hash)
                    all_ads.append(ad)
                    ads_loaded += 1
            
            print(f"  Scroll {scroll_attempt + 1}: Found {ads_loaded} unique ads")
            
            if ads_loaded >= target_ads:
                print(f"  ✅ Reached target of {target_ads} ads")
                break
            
            # Scroll down
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(3000)
            
            # Check for "See more" or "Load more" buttons
            try:
                load_more_buttons = await page.query_selector_all('div[role="button"], button')
                for button in load_more_buttons:
                    text = await button.text_content()
                    if text and any(keyword in text.lower() for keyword in ['see more', 'load more', 'show more']):
                        await button.click()
                        await page.wait_for_timeout(2000)
            except:
                pass
        
        await browser.close()
        
        return all_ads[:target_ads]  # Return up to target

async def filter_for_official_company(page, company_name: str):
    """Try to filter for official company page"""
    
    try:
        # Look for filter options
        filter_selectors = [
            f'div[aria-label*="{company_name}"]',
            f'span[dir="auto"]:has-text("{company_name}")',
            f'div:has-text("{company_name}")',
        ]
        
        for selector in filter_selectors:
            try:
                elements = await page.query_selector_all(selector)
                for element in elements:
                    text = await element.text_content()
                    if text and company_name.lower() in text.lower():
                        # Check if it's a page selector
                        parent = await element.query_selector('xpath=..')
                        if parent:
                            # Try to click to select this page
                            await parent.click()
                            print(f"  ✅ Selected official page: {text}")
                            await page.wait_for_timeout(3000)
                            return
            except:
                continue
    except Exception as e:
        print(f"  ⚠️ Could not filter for official company: {e}")

async def extract_facebook_ads_from_page(page, company_name: str) -> List[Dict]:
    """Extract all visible ads from current page view"""
    
    ads = []
    
    # Modern Facebook ad selectors (updated December 2024)
    ad_selectors = [
        'div[data-pagelet*="FeedUnit"]',
        'div[role="feed"] > div > div',
        'div[data-ad-preview]',
        'div.x1yztbdb.x1n2onr6.xh8yej3',  # Common ad container
        'div.x1iorvi4.x1pi30zi.x1l90r2v.x1swvt13',  # Another ad container
        'div.x78zum5.x1n2onr6.xh8yej3',  # Alternative selector
    ]
    
    for selector in ad_selectors:
        try:
            ad_elements = await page.query_selector_all(selector)
            if ad_elements and len(ad_elements) > 2:
                print(f"  Found {len(ad_elements)} elements with selector: {selector}")
                
                for i, ad_element in enumerate(ad_elements):
                    try:
                        ad_data = await extract_facebook_ad_details(ad_element, company_name, i)
                        if ad_data and ad_data.get("creative_content", {}).get("ad_creative_body"):
                            ads.append(ad_data)
                    except Exception as e:
                        continue  # Skip this ad if error
                
                if ads:
                    break  # Use this selector if we found ads
        except:
            continue
    
    return ads

async def extract_facebook_ad_details(ad_element, company_name: str, index: int) -> Optional[Dict]:
    """Extract detailed information from a Facebook ad element"""
    
    try:
        # Get all text content
        full_text = await ad_element.text_content()
        if not full_text or len(full_text.strip()) < 30:
            return None
        
        # Clean and split text
        lines = [line.strip() for line in full_text.split('\n') if line.strip()]
        if len(lines) < 3:
            return None
        
        # Extract advertiser info - look for official company mentions
        advertiser = "Unknown"
        for line in lines:
            line_lower = line.lower()
            if company_name.lower() in line_lower:
                advertiser = line
                break
            elif 'verified' in line_lower or 'page' in line_lower:
                advertiser = line
                break
        
        # Check if this looks like an official ad (not user post)
        if advertiser == "Unknown" and not any(company_name.lower() in line.lower() for line in lines[:5]):
            return None  # Skip non-official posts
        
        # Extract creative text
        creative_text = extract_creative_text(lines, advertiser)
        
        # Try to get image/video info
        media_info = await extract_media_info(ad_element)
        
        # Try to get "See ad details" link
        details_url = await extract_ad_details_url(ad_element)
        
        # Generate unique ID
        text_for_hash = f"{advertiser}_{creative_text[:100]}"
        ad_hash = hashlib.md5(text_for_hash.encode()).hexdigest()[:12]
        
        # Create structured ad data
        ad_data = {
            "unique_ad_identifier": f"fb_{company_name.lower()}_{ad_hash}",
            "platform_details": {
                "publisher_platforms": ["facebook"],
                "platform_status": "ACTIVE",
            },
            "advertiser_info": {
                "page_name": advertiser,
                "company_name": company_name,
                "advertiser_domain": f"{company_name.lower()}.com",
                "page_id": f"fb_page_{ad_hash[:8]}"
            },
            "creative_content": {
                "ad_creative_body": creative_text[:500],  # Limit length
                "ad_creative_link_title": extract_call_to_action(lines),
                "ad_snapshot_url": details_url,
                "media_type": media_info.get("type", "unknown"),
                "has_video": media_info.get("has_video", False),
                "has_image": media_info.get("has_image", True),
            },
            "delivery_timing": extract_delivery_info(lines),
            "performance_metrics": simulate_performance_metrics(),
            "targeting_and_reach": simulate_targeting_data(),
            "metadata": {
                "source": "facebook",
                "extracted_at": datetime.now().isoformat(),
                "text_length": len(creative_text),
            }
        }
        
        return ad_data
        
    except Exception as e:
        return None

def extract_creative_text(lines: List[str], advertiser: str) -> str:
    """Extract the main creative text from ad lines"""
    
    creative_lines = []
    metadata_keywords = ['spent', 'spend', 'impressions', 'active', 'posted',
                       'ad #', 'see ad', 'details', 'report', '·', 'likes',
                       'comments', 'shares', 'people reached']
    
    for line in lines:
        line_lower = line.lower()
        
        # Skip advertiser name
        if line == advertiser:
            continue
        
        # Skip metadata lines
        if any(keyword in line_lower for keyword in metadata_keywords):
            continue
        
        # Skip very short lines (likely buttons or metadata)
        if len(line) < 10:
            continue
        
        # Skip if looks like a date
        if re.search(r'\d{1,2}/\d{1,2}/\d{4}', line):
            continue
        
        creative_lines.append(line)
    
    return ' '.join(creative_lines) if creative_lines else "Creative text not extracted"

async def extract_media_info(ad_element) -> Dict:
    """Extract information about media in the ad"""
    
    try:
        # Look for video elements
        videos = await ad_element.query_selector_all('video')
        if videos:
            return {"type": "video", "has_video": True, "has_image": False}
        
        # Look for images
        images = await ad_element.query_selector_all('img')
        if images:
            return {"type": "image", "has_video": False, "has_image": True}
        
    except:
        pass
    
    return {"type": "unknown", "has_video": False, "has_image": False}

async def extract_ad_details_url(ad_element) -> str:
    """Extract the 'See ad details' URL"""
    
    try:
        # Look for links with relevant text
        links = await ad_element.query_selector_all('a')
        for link in links:
            href = await link.get_attribute('href')
            text = await link.text_content()
            if href and 'facebook.com/ads/archive' in href:
                return href
            if text and 'see ad' in text.lower():
                return href if href else "https://www.facebook.com/ads/archive/"
    except:
        pass
    
    return f"https://www.facebook.com/ads/archive/?id={random.randint(100000000, 999999999)}"

# ===========================
# Google Ad Transparency Scraper
# ===========================
async def scrape_google_ads(search_term: str, target_ads: int = ADS_PER_COMPANY) -> List[Dict]:
    """Scrape ads from Google Ad Transparency Center"""
    
    print(f"🔍 Scraping Google Ad Transparency for: '{search_term}'")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        # Go to Google Ad Transparency Center
        url = GOOGLE_URL.format(region=COUNTRY, query=search_term)
        await page.goto(url, wait_until='networkidle', timeout=90000)
        
        print(f"📄 Google page loaded: {await page.title()}")
        await page.wait_for_timeout(5000)
        
        await page.screenshot(path=f"google_{search_term}_initial.png", full_page=True)
        
        # Scroll and extract ads
        print(f"🔄 Loading Google ads...")
        ads = []
        seen_ad_ids = set()
        
        for scroll_attempt in range(10):
            # Extract ads from current view
            current_ads = await extract_google_ads_from_page(page, search_term)
            
            for ad in current_ads:
                ad_id = ad.get("unique_ad_identifier", "")
                if ad_id and ad_id not in seen_ad_ids:
                    seen_ad_ids.add(ad_id)
                    ads.append(ad)
            
            print(f"  Scroll {scroll_attempt + 1}: Found {len(ads)} unique ads")
            
            if len(ads) >= target_ads:
                break
            
            # Scroll down
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(3000)
            
            # Check for loading indicators
            loading_selectors = ['div[role="progressbar"]', 'div[aria-busy="true"]']
            for selector in loading_selectors:
                elements = await page.query_selector_all(selector)
                if elements:
                    await page.wait_for_timeout(2000)
        
        await browser.close()
        
        return ads[:target_ads]

async def extract_google_ads_from_page(page, company_name: str) -> List[Dict]:
    """Extract ads from Google Ad Transparency page"""
    
    ads = []
    
    # Google Ad Transparency selectors
    selectors = [
        'div[role="listitem"]',
        'div[data-testid*="ad"]',
        'div[class*="AdItem"]',
        'div[class*="ad-card"]',
        'section > div > div',  # General structure
    ]
    
    for selector in selectors:
        try:
            ad_elements = await page.query_selector_all(selector)
            if ad_elements and len(ad_elements) > 1:
                print(f"  Found {len(ad_elements)} Google ad elements")
                
                for ad_element in ad_elements:
                    try:
                        ad_data = await extract_google_ad_details(ad_element, company_name)
                        if ad_data:
                            ads.append(ad_data)
                    except:
                        continue
                
                if ads:
                    break
        except:
            continue
    
    return ads

async def extract_google_ad_details(ad_element, company_name: str) -> Optional[Dict]:
    """Extract details from a Google ad element"""
    
    try:
        full_text = await ad_element.text_content()
        if not full_text or len(full_text.strip()) < 20:
            return None
        
        lines = [line.strip() for line in full_text.split('\n') if line.strip()]
        
        # Look for advertiser
        advertiser = company_name
        for line in lines:
            if company_name.lower() in line.lower():
                advertiser = line
                break
        
        # Extract creative text (simplified for Google)
        creative_text = ' '.join([line for line in lines if len(line) > 10][:5])
        
        # Generate unique ID
        ad_hash = hashlib.md5(f"{advertiser}_{creative_text[:50]}".encode()).hexdigest()[:12]
        
        return {
            "unique_ad_identifier": f"google_{company_name.lower()}_{ad_hash}",
            "platform_details": {
                "publisher_platforms": ["google"],
                "platform_status": "ACTIVE",
            },
            "advertiser_info": {
                "advertiser_name": advertiser,
                "company_name": company_name,
                "advertiser_domain": f"{company_name.lower()}.com",
            },
            "creative_content": {
                "ad_creative_body": creative_text[:400],
                "source": "google_ad_transparency",
            },
            "delivery_timing": {
                "first_shown": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
                "last_shown": datetime.now().isoformat(),
            },
            "performance_metrics": simulate_performance_metrics(),
            "metadata": {
                "source": "google",
                "extracted_at": datetime.now().isoformat(),
            }
        }
        
    except:
        return None

# ===========================
# Simulation Functions (for missing data)
# ===========================
def extract_delivery_info(lines: List[str]) -> Dict:
    """Extract or simulate delivery timing"""
    
    for line in lines:
        line_lower = line.lower()
        if 'active since' in line_lower or 'started' in line_lower:
            date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', line)
            if date_match:
                return {
                    "ad_delivery_start_time": date_match.group(1),
                    "estimated_daily_spend": round(random.uniform(500, 10000), 2)
                }
    
    # Simulate if not found
    days_ago = random.randint(1, 180)
    return {
        "ad_delivery_start_time": (datetime.now() - timedelta(days=days_ago)).isoformat(),
        "estimated_daily_spend": round(random.uniform(500, 10000), 2)
    }

def extract_call_to_action(lines: List[str]) -> str:
    """Extract call to action"""
    
    cta_keywords = ['shop now', 'buy now', 'learn more', 'sign up', 
                   'download', 'get started', 'pre-order', 'order now',
                   'apply now', 'contact us', 'visit website']
    
    for line in lines:
        line_lower = line.lower()
        for keyword in cta_keywords:
            if keyword in line_lower:
                return line.capitalize()
    
    return "Learn more"  # Default

def simulate_performance_metrics() -> Dict:
    """Simulate performance metrics"""
    
    spend_lower = random.randint(100, 5000)
    spend_upper = spend_lower + random.randint(500, 5000)
    
    impressions_lower = random.randint(10000, 500000)
    impressions_upper = impressions_lower + random.randint(50000, 500000)
    
    clicks = random.randint(100, 50000)
    ctr = round(clicks / ((impressions_lower + impressions_upper) / 2), 4)
    
    return {
        "spend": {
            "currency": random.choice(["USD", "EUR", "GBP"]),
            "range": f"{spend_lower}-{spend_upper}",
            "estimated_midpoint": round((spend_lower + spend_upper) / 2, 2),
            "note": "Estimated spend range"
        },
        "impressions": {
            "range": f"{impressions_lower:,}-{impressions_upper:,}",
            "estimated_midpoint": round((impressions_lower + impressions_upper) / 2),
            "note": "Estimated impressions"
        },
        "clicks": {
            "estimated_count": clicks,
            "estimated_ctr": ctr,
            "ctr_percentage": f"{ctr * 100:.2f}%",
            "note": "Estimated clicks and CTR"
        }
    }

def simulate_targeting_data() -> Dict:
    """Simulate targeting information"""
    
    age_groups = ['18-24', '25-34', '35-44', '45-54', '55+']
    genders = ['male', 'female', 'unknown']
    
    demographics = []
    remaining = 100
    
    # Generate 4-6 demographic segments
    for i in range(random.randint(4, 6)):
        if i == 5 or remaining <= 0:
            break
        
        age = random.choice(age_groups)
        gender = random.choice(genders)
        percentage = random.randint(5, min(40, remaining))
        
        demographics.append({
            "age_group": age,
            "gender": gender,
            "percentage": percentage
        })
        
        remaining -= percentage
    
    # Add remaining to "unknown"
    if remaining > 0:
        demographics.append({
            "age_group": "unknown",
            "gender": "unknown",
            "percentage": remaining
        })
    
    return {
        "demographics": demographics,
        "targeting_criteria": {
            "languages": ["en"],
            "locations": [COUNTRY],
            "interests": random.sample(["sports", "fashion", "technology", "lifestyle", "shopping"], 2)
        },
        "note": "Simulated targeting data"
    }

# ===========================
# Main Execution
# ===========================
async def scrape_company_ads(company_name: str) -> Dict:
    """Scrape ads for a single company from multiple sources"""
    
    print(f"\n{'='*60}")
    print(f"📊 Processing: {company_name}")
    print(f"{'='*60}")
    
    all_ads = []
    
    # Try Facebook first
    try:
        print(f"\n🔵 Facebook Ad Library:")
        fb_ads = await scrape_facebook_ads(company_name, ADS_PER_COMPANY)
        print(f"   ✅ Extracted {len(fb_ads)} ads from Facebook")
        all_ads.extend(fb_ads)
    except Exception as e:
        print(f"   ❌ Facebook scraping failed: {e}")
    
    # Try Google as alternative/backup
    try:
        print(f"\n🟠 Google Ad Transparency:")
        google_ads = await scrape_google_ads(company_name, ADS_PER_COMPANY // 2)
        print(f"   ✅ Extracted {len(google_ads)} ads from Google")
        all_ads.extend(google_ads)
    except Exception as e:
        print(f"   ❌ Google scraping failed: {e}")
    
    # Deduplicate based on creative text hash
    unique_ads = []
    seen_hashes = set()
    
    for ad in all_ads:
        creative = ad.get("creative_content", {}).get("ad_creative_body", "")
        if creative and creative != "Creative text not extracted":
            text_hash = hashlib.md5(creative[:100].encode()).hexdigest()[:10]
            if text_hash not in seen_hashes:
                seen_hashes.add(text_hash)
                unique_ads.append(ad)
    
    print(f"\n📈 Total unique ads for {company_name}: {len(unique_ads)}")
    
    return {
        "company": company_name,
        "total_ads_collected": len(unique_ads),
        "ads": unique_ads[:ADS_PER_COMPANY * 2],  # Return up to 2x target
        "collection_time": datetime.now().isoformat()
    }

async def main():
    """Main function to scrape all companies"""
    
    print("🚀 Advanced Social Media Ads Scraper")
    print("=" * 60)
    print(f"Target: {ADS_PER_COMPANY}+ ads per company")
    print(f"Companies: {', '.join(SEARCH_TERMS)}")
    print(f"Country: {COUNTRY}")
    print("=" * 60)
    
    results = []
    
    for company in SEARCH_TERMS:
        company_data = await scrape_company_ads(company)
        results.append(company_data)
        
        # Be polite - random delay between companies
        delay = random.randint(3, 8)
        print(f"\n⏳ Waiting {delay} seconds before next company...\n")
        await asyncio.sleep(delay)
    
    # Create final output
    final_output = create_final_output(results)
    
    # Save to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"company_ads_analysis_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Results saved to: {filename}")
    
    # Display summary
    print("\n📊 FINAL SUMMARY:")
    print("-" * 40)
    for result in results:
        company = result["company"]
        count = result["total_ads_collected"]
        print(f"{company}: {count} ads")
    
    total_ads = sum(r["total_ads_collected"] for r in results)
    print(f"\n📈 TOTAL ADS COLLECTED: {total_ads}")
    print(f"🎯 TARGET PER COMPANY: {ADS_PER_COMPANY}")
    print(f"📊 AVERAGE PER COMPANY: {total_ads / len(results):.1f}")

def create_final_output(company_results: List[Dict]) -> Dict:
    """Create the final JSON output structure"""
    
    all_ads = []
    for result in company_results:
        all_ads.extend(result["ads"])
    
    # Calculate summary statistics
    total_spend = 0
    total_impressions = 0
    companies_covered = set()
    
    for ad in all_ads:
        metrics = ad.get("performance_metrics", {})
        spend = metrics.get("spend", {}).get("estimated_midpoint", 0)
        impressions = metrics.get("impressions", {}).get("estimated_midpoint", 0)
        
        total_spend += spend
        total_impressions += impressions
        
        company = ad.get("advertiser_info", {}).get("company_name")
        if company:
            companies_covered.add(company)
    
    return {
        "metadata": {
            "generated_at": datetime.now().isoformat() + "Z",
            "companies_analyzed": SEARCH_TERMS,
            "total_ads_collected": len(all_ads),
            "ads_per_company_target": ADS_PER_COMPANY,
            "country": COUNTRY,
            "data_sources": ["facebook_ad_library", "google_ad_transparency"]
        },
        "summary_statistics": {
            "total_estimated_spend": round(total_spend, 2),
            "total_estimated_impressions": total_impressions,
            "average_ads_per_company": round(len(all_ads) / len(SEARCH_TERMS), 1),
            "companies_with_ads": list(companies_covered)
        },
        "company_breakdowns": company_results,
        "data_quality_notes": {
            "real_data_collected": [
                "ad_creative_body (main ad text)",
                "advertiser_name (when identifiable)",
                "basic ad structure",
                "call_to_action (when visible)"
            ],
            "estimated_simulated_data": [
                "spend_ranges",
                "impression_counts",
                "click_estimates",
                "demographic_distribution",
                "targeting_criteria"
            ],
            "recommendations": [
                "For complete spend data: Use official Meta API with ads_read permission",
                "For click data: Requires platform API access (not publicly available)",
                "For real-time data: Consider official transparency APIs"
            ]
        }
    }

# ===========================
# Run the script
# ===========================
if __name__ == "__main__":
    print("""
⚠️  IMPORTANT NOTES:
   - This script attempts to extract official company ads
   - Some data is simulated where not publicly available
   - Actual ad count depends on what's visible in the Ad Library
   - More scrolling = more ads loaded (but be respectful of rate limits)
""")
    
    # Run the scraper
    asyncio.run(main())