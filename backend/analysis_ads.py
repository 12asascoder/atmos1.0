#!/usr/bin/env python3
"""
Enhanced Meta Ads Fetcher & Analyzer
Fetches ads for competitors and generates a comprehensive analytics JSON.
"""

import json
import os
import requests
import psycopg2
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from urllib.parse import urlparse
from collections import defaultdict
import hashlib

# ===========================
# Configuration & Environment
# ===========================
from dotenv import load_dotenv
load_dotenv()

# Meta API Configuration
META_ACCESS_TOKEN = os.getenv("META_ADS_ACCESS_TOKEN")
META_API_VERSION = os.getenv("META_API_VERSION", "v18.0")

if not META_ACCESS_TOKEN:
    raise ValueError("❌ META_ADS_ACCESS_TOKEN not found in .env file")

# Database Configuration (for PostgreSQL/Supabase)
DATABASE_URL = os.getenv("DATABASE_URL")

# API Settings - NOTE: For non-political ads, COUNTRY must be an EU/UK country if AD_TYPE="ALL"
COUNTRY = "US"  # Change based on your needs (use 'GB', 'FR', 'DE' for all ad types)
AD_TYPE = "ALL"  # Change to "ALL" with ads_read permission in EU/UK
LIMIT_PER_COMPETITOR = 20  # Max ads to fetch per competitor
ANALYSIS_DAYS = 7  # How many days back to analyze for trends

# ===========================
# Database Functions
# ===========================
def get_competitors_from_db() -> List[Dict]:
    """Fetch all competitors from PostgreSQL database"""
    competitors = []
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in .env file")
        return competitors
    
    try:
        # Parse the database URL
        parsed_url = urlparse(DATABASE_URL)
        dbname = parsed_url.path[1:] if parsed_url.path else "postgres"
        user = parsed_url.username or "postgres"
        password = parsed_url.password or ""
        host = parsed_url.hostname or "localhost"
        port = parsed_url.port or 5432
        
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port,
            sslmode="require"
        )
        
        cursor = conn.cursor()
        
        # Fetch all competitors
        cursor.execute("""
            SELECT 
                id::text, 
                name, 
                COALESCE(domain, name) as domain,
                COALESCE(industry, 'Unknown') as industry
            FROM public.competitors 
            ORDER BY name
            LIMIT 20                                       
        """)            # Limit for testing, remove in production
        
        for row in cursor.fetchall():
            competitors.append({
                "id": row[0],
                "name": row[1],
                "domain": row[2],
                "industry": row[3]
            })
        
        cursor.close()
        conn.close()
        
        print(f"✅ Found {len(competitors)} competitors in database")
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        # Fallback to sample data if database fails
        return get_sample_competitors()
    
    return competitors

def get_sample_competitors() -> List[Dict]:
    """Return sample competitors if database fails"""
    return [
        {"id": "1", "name": "Nike", "domain": "nike.com", "industry": "Apparel"},
        {"id": "2", "name": "Adidas", "domain": "adidas.com", "industry": "Apparel"},
        {"id": "3", "name": "Apple", "domain": "apple.com", "industry": "Technology"},
    ]

# ===========================
# Meta API Functions
# ===========================
def fetch_meta_ads_for_competitor(competitor_name: str, search_limit: int = LIMIT_PER_COMPETITOR) -> List[Dict]:
    """Fetch ads from Meta Ad Library for a specific competitor"""
    
    url = f"https://graph.facebook.com/{META_API_VERSION}/ads_archive"
    
    # Define all possible fields we want to request
    # NOTE: Some fields (spend, impressions) only available with ads_read permission in EU/UK
    fields = [
        "id",
        "page_id",
        "page_name",
        "ad_creative_body",
        "ad_creative_link_title",
        "ad_creative_link_caption",
        "ad_creative_link_description",
        "ad_delivery_start_time",
        "ad_delivery_stop_time",
        "ad_snapshot_url",
        "currency",
        "spend",
        "impressions",
        "demographic_distribution",
        "publisher_platforms",
        "languages"
    ]
    
    params = {
        "access_token": META_ACCESS_TOKEN,
        "ad_reached_countries": [COUNTRY],
        "ad_active_status": "ALL",
        "ad_type": AD_TYPE,
        "limit": search_limit,
        "fields": ",".join(fields),
        "search_terms": f'"{competitor_name}"',  # Exact match
    }
    
    try:
        print(f"  🔍 Fetching ads for: {competitor_name}")
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code != 200:
            print(f"  ⚠️ API Error {response.status_code}: {response.text[:200]}")
            return []
        
        data = response.json()
        return data.get("data", [])
        
    except Exception as e:
        print(f"  ❌ Request failed: {e}")
        return []

# ===========================
# Data Processing Functions
# ===========================
def calculate_spend_midpoint(spend_data: Dict) -> float:
    """Calculate midpoint from Meta's spend range (e.g., '500-999')"""
    if not spend_data or 'amount' not in spend_data:
        return 0.0
    
    amount_str = spend_data.get('amount', '0-0')
    try:
        # Handle format like "500-999" or "1000+" or "1000"
        if '-' in amount_str:
            lower, upper = amount_str.split('-')
            return (float(lower) + float(upper)) / 2
        elif amount_str.endswith('+'):
            return float(amount_str[:-1]) * 1.5  # Estimate for "1000+" format
        else:
            return float(amount_str)
    except ValueError:
        return 0.0

def calculate_impressions_midpoint(impressions_data: Dict) -> float:
    """Calculate midpoint from Meta's impressions range"""
    if not impressions_data:
        return 0.0
    
    lower = impressions_data.get('lower_bound', 0)
    upper = impressions_data.get('upper_bound', lower)  # If no upper bound, use lower
    
    # If upper bound exists and is different, calculate midpoint
    if upper > lower:
        return (lower + upper) / 2
    else:
        return float(lower)

def infer_campaign_id(ad_data: Dict) -> str:
    """Generate a campaign ID by hashing page_id and first words of ad text"""
    page_id = ad_data.get('page_id', 'unknown')
    ad_text = ad_data.get('ad_creative_body', '')
    
    # Take first 5 words of ad text (or all if shorter)
    words = ad_text.split()[:5]
    text_snippet = ' '.join(words)
    
    # Create a hash for consistent campaign IDs
    hash_input = f"{page_id}_{text_snippet}".encode('utf-8')
    campaign_hash = hashlib.md5(hash_input).hexdigest()[:8]
    
    return f"campaign_{campaign_hash}"

def simulate_clicks(impressions_midpoint: float, industry: str) -> Dict:
    """Simulate clicks based on industry benchmarks since Meta doesn't provide click data"""
    
    # Industry benchmark CTRs (simplified estimates)
    ctr_benchmarks = {
        'Apparel': 0.035,      # 3.5%
        'Technology': 0.025,   # 2.5%
        'Political': 0.015,    # 1.5%
        'Default': 0.020       # 2.0% default
    }
    
    # Get CTR for this industry
    ctr = ctr_benchmarks.get(industry, ctr_benchmarks['Default'])
    
    # Calculate clicks
    clicks = int(impressions_midpoint * ctr)
    
    return {
        "count": clicks,
        "estimated_ctr": ctr,
        "calculation_note": f"Simulated using industry benchmark CTR of {ctr:.1%}"
    }

def calculate_daily_spend(spend_midpoint: float, start_time: str, stop_time: str = None) -> float:
    """Calculate estimated daily spend based on total spend and ad duration"""
    
    try:
        start_date = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(stop_time.replace('Z', '+00:00')) if stop_time else datetime.utcnow()
        
        # Calculate active days (minimum 1 day)
        active_days = max((end_date - start_date).days, 1)
        
        return spend_midpoint / active_days
        
    except Exception:
        return 0.0

def process_raw_ad(ad_data: Dict, competitor_info: Dict) -> Dict:
    """Process raw Meta API ad data into our enriched format"""
    
    # Calculate midpoints
    spend_midpoint = calculate_spend_midpoint(ad_data.get('spend', {}))
    impressions_midpoint = calculate_impressions_midpoint(ad_data.get('impressions', {}))
    
    # Simulate clicks (since Meta doesn't provide them)
    simulated_clicks = simulate_clicks(impressions_midpoint, competitor_info['industry'])
    
    # Calculate derived metrics
    daily_spend = calculate_daily_spend(
        spend_midpoint,
        ad_data.get('ad_delivery_start_time', ''),
        ad_data.get('ad_delivery_stop_time')
    )
    
    # Infer campaign structure
    campaign_id = infer_campaign_id(ad_data)
    
    # Determine platform status
    stop_time = ad_data.get('ad_delivery_stop_time')
    platform_status = "ACTIVE" if not stop_time else "PAUSED"
    
    # Determine discovery status (simplified - "NEW" if started in last 7 days)
    try:
        start_date = datetime.fromisoformat(ad_data.get('ad_delivery_start_time', '').replace('Z', '+00:00'))
        days_since_start = (datetime.utcnow() - start_date).days
        discovery_status = "NEW" if days_since_start <= 7 else None
    except Exception:
        discovery_status = None
    
    # Build the processed ad object
    processed_ad = {
        "unique_ad_identifier": f"ad_meta_{ad_data.get('id', 'unknown')}",
        "meta_ad_id": ad_data.get('id'),
        "platform_details": {
            "publisher_platforms": ad_data.get('publisher_platforms', []),
            "platform_status": platform_status,
            "discovery_status": discovery_status
        },
        "advertiser_info": {
            "page_name": ad_data.get('page_name', 'Unknown'),
            "page_id": ad_data.get('page_id'),
            "advertiser_domain": competitor_info['domain']
        },
        "creative_content": {
            "ad_creative_body": ad_data.get('ad_creative_body', ''),
            "ad_creative_link_title": ad_data.get('ad_creative_link_title', ''),
            "ad_snapshot_url": ad_data.get('ad_snapshot_url')
        },
        "delivery_timing": {
            "ad_delivery_start_time": ad_data.get('ad_delivery_start_time'),
            "ad_delivery_stop_time": stop_time,
            "estimated_daily_spend": round(daily_spend, 2) if daily_spend else 0.0
        },
        "performance_metrics": {
            "spend": {
                "currency": ad_data.get('currency', 'USD'),
                "amount": ad_data.get('spend', {}).get('amount', '0-0'),
                "estimated_midpoint": round(spend_midpoint, 2),
                "calculation_note": "Meta provides a range; dashboard uses midpoint"
            },
            "impressions": {
                "lower_bound": ad_data.get('impressions', {}).get('lower_bound', 0),
                "upper_bound": ad_data.get('impressions', {}).get('upper_bound', 0),
                "estimated_midpoint": round(impressions_midpoint),
                "calculation_note": "Meta provides a range; dashboard uses midpoint"
            },
            "clicks": simulated_clicks,
            "calculated_ctr": simulated_clicks["estimated_ctr"],
            "ctr_percentage": f"{simulated_clicks['estimated_ctr']:.1%}"
        },
        "campaign_structure": {
            "inferred_campaign_id": campaign_id,
            "inferred_creative_variants": 1,  # Will be updated after grouping
            "inferred_ab_tests_active": 0,     # Will be updated after grouping
            "calculation_note": "Campaign inferred from page and ad text similarity"
        },
        "targeting_and_reach": {
            "targeting_criteria": {
                "languages": ad_data.get('languages', [])
            },
            "demographic_distribution": ad_data.get('demographic_distribution', [])
        }
    }
    
    return processed_ad

def group_ads_into_campaigns(ads: List[Dict]) -> List[Dict]:
    """Group ads by campaign and update variant counts"""
    
    # Group ads by campaign_id
    campaigns = defaultdict(list)
    for ad in ads:
        campaign_id = ad['campaign_structure']['inferred_campaign_id']
        campaigns[campaign_id].append(ad)
    
    # Update each ad with campaign-level information
    updated_ads = []
    for campaign_id, campaign_ads in campaigns.items():
        # Count variants in this campaign
        variant_count = len(campaign_ads)
        
        # Estimate A/B tests (simplified: if we have 2+ variants, assume 1 A/B test)
        ab_test_count = 1 if variant_count >= 2 else 0
        
        # Update each ad in the campaign
        for ad in campaign_ads:
            ad['campaign_structure']['inferred_creative_variants'] = variant_count
            ad['campaign_structure']['inferred_ab_tests_active'] = ab_test_count
            updated_ads.append(ad)
    
    return updated_ads

def calculate_summary_metrics(processed_ads: List[Dict]) -> Dict:
    """Calculate summary metrics from all processed ads"""
    
    total_spend = 0.0
    total_impressions = 0.0
    total_ctr_sum = 0.0
    ad_count = 0
    
    # Track unique campaigns
    unique_campaigns = set()
    
    for ad in processed_ads:
        # Sum metrics
        total_spend += ad['performance_metrics']['spend']['estimated_midpoint']
        total_impressions += ad['performance_metrics']['impressions']['estimated_midpoint']
        total_ctr_sum += ad['performance_metrics']['calculated_ctr']
        ad_count += 1
        
        # Track unique campaigns
        campaign_id = ad['campaign_structure']['inferred_campaign_id']
        unique_campaigns.add(campaign_id)
    
    # Calculate averages
    avg_ctr = total_ctr_sum / ad_count if ad_count > 0 else 0.0
    
    # Determine analysis period (last 7 days)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=ANALYSIS_DAYS)
    
    return {
        "aggregation_period": {
            "start_date": start_date.isoformat() + "Z",
            "end_date": end_date.isoformat() + "Z"
        },
        "metrics": {
            "total_competitor_spend": {
                "estimated_total": round(total_spend, 2),
                "currency": "USD",
                "calculation_note": "Sum of estimated spend midpoints for all tracked ads in period"
            },
            "active_campaigns_count": {
                "count": len(unique_campaigns),
                "calculation_note": "Count of unique campaign identifiers inferred from ad grouping"
            },
            "total_impressions": {
                "estimated_total": int(total_impressions),
                "calculation_note": "Sum of estimated impression midpoints for all tracked ads"
            },
            "average_ctr": {
                "rate": round(avg_ctr, 4),
                "percentage": f"{avg_ctr:.2%}",
                "calculation_note": "WARNING: Based on simulated clicks using industry benchmarks"
            }
        }
    }

# ===========================
# Main Execution
# ===========================
def main() -> Dict:
    """Main function to fetch, process, and analyze competitor ads"""
    
    print("🚀 Enhanced Meta Ads Analyzer")
    print("=" * 50)
    
    # Step 1: Get competitors from database
    competitors = get_competitors_from_db()
    
    if not competitors:
        print("❌ No competitors found. Exiting.")
        return {}
    
    all_processed_ads = []
    
    # Step 2: Process each competitor
    for i, competitor in enumerate(competitors, 1):
        print(f"\n[{i}/{len(competitors)}] Processing: {competitor['name']}")
        
        # Fetch raw ads from Meta API
        raw_ads = fetch_meta_ads_for_competitor(competitor['name'])
        
        if not raw_ads:
            print(f"  ⚠️ No ads found for {competitor['name']}")
            continue
        
        print(f"  📊 Found {len(raw_ads)} raw ads")
        
        # Process each raw ad
        for raw_ad in raw_ads:
            processed_ad = process_raw_ad(raw_ad, competitor)
            all_processed_ads.append(processed_ad)
        
        # Add delay to avoid rate limiting
        if i < len(competitors):
            import time
            time.sleep(1)
    
    # Step 3: Group ads into campaigns and update counts
    if all_processed_ads:
        all_processed_ads = group_ads_into_campaigns(all_processed_ads)
    
    # Step 4: Calculate summary metrics
    summary = calculate_summary_metrics(all_processed_ads)
    
    # Step 5: Prepare data source notes
    data_source_notes = {
        "meta_api_fields": [
            "meta_ad_id",
            "page_name",
            "page_id",
            "ad_creative_body",
            "ad_creative_link_title",
            "ad_snapshot_url",
            "ad_delivery_start_time",
            "ad_delivery_stop_time",
            "spend.amount (range)",
            "impressions.lower_bound/upper_bound",
            "demographic_distribution",
            "publisher_platforms",
            "languages"
        ],
        "calculated_fields": [
            "estimated_daily_spend",
            "performance_metrics.spend.estimated_midpoint",
            "performance_metrics.impressions.estimated_midpoint",
            "calculated_ctr",
            "inferred_campaign_id",
            "inferred_creative_variants",
            "inferred_ab_tests_active"
        ],
        "simulated_external_data": [
            "performance_metrics.clicks.count",
            "summary.metrics.average_ctr"
        ],
        "critical_limitations": [
            "Click data is NOT available via Meta Ad Library API. CTR calculation uses simulated clicks based on industry benchmarks.",
            "Campaign and A/B test structures are not exposed by the API and are inferred heuristically.",
            f"For non-EU/UK delivery (country={COUNTRY}), spend/impression data may be limited to {AD_TYPE} only."
        ]
    }
    
    # Step 6: Build final output structure
    final_output = {
        "summary": summary,
        "advertisements": all_processed_ads,
        "data_source_notes": data_source_notes,
        "generation_info": {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "competitors_analyzed": len(competitors),
            "total_ads_processed": len(all_processed_ads),
            "script_version": "1.0.0"
        }
    }
    
    return final_output

# ===========================
# Script Execution
# ===========================
if __name__ == "__main__":
    try:
        # Run the main analysis
        result = main()
        
        if result:
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"competitor_ads_analysis_{timestamp}.json"
            
            # Save to JSON file
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            # Display summary
            print("\n" + "=" * 50)
            print("✅ ANALYSIS COMPLETE")
            print("=" * 50)
            print(f"📊 Summary Metrics:")
            print(f"   • Estimated Total Spend: ${result['summary']['metrics']['total_competitor_spend']['estimated_total']:,.2f}")
            print(f"   • Active Campaigns: {result['summary']['metrics']['active_campaigns_count']['count']}")
            print(f"   • Total Impressions: {result['summary']['metrics']['total_impressions']['estimated_total']:,}")
            print(f"   • Average CTR: {result['summary']['metrics']['average_ctr']['percentage']}")
            print(f"   • Ads Processed: {result['generation_info']['total_ads_processed']}")
            print(f"\n💾 Full results saved to: {filename}")
            
            # Display sample ad
            if result['advertisements']:
                sample = result['advertisements'][0]
                print(f"\n📄 Sample Ad Structure:")
                print(f"   • Advertiser: {sample['advertiser_info']['page_name']}")
                print(f"   • Daily Spend: ${sample['delivery_timing']['estimated_daily_spend']:,.2f}")
                print(f"   • Impressions: {sample['performance_metrics']['impressions']['estimated_midpoint']:,}")
                print(f"   • CTR: {sample['performance_metrics']['ctr_percentage']}")
                print(f"   • Campaign: {sample['campaign_structure']['inferred_campaign_id']}")
        else:
            print("❌ No data was generated. Check your database and API connections.")
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Script interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("\n💡 Troubleshooting:")
        print("1. Check your .env file has correct credentials")
        print("2. Verify Meta API token has required permissions")
        print("3. Check database connection")