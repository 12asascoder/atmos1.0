#!/usr/bin/env python3
"""
Simple Meta Ads Fetcher for Competitors
Fetches ads from Meta Ad Library for competitors in database
"""

import json
import os
import sqlite3
from datetime import datetime
from typing import List, Dict

import requests
from dotenv import load_dotenv

# ===========================
# Load environment variables
# ===========================
load_dotenv()

# Meta API Configuration
META_ACCESS_TOKEN = os.getenv("META_ADS_ACCESS_TOKEN")
META_API_VERSION = os.getenv("META_API_VERSION", "v18.0")

if not META_ACCESS_TOKEN:
    print("❌ ERROR: META_ADS_ACCESS_TOKEN not found in .env file")
    print("💡 Create a .env file with your Facebook access token")
    exit(1)

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///competitors.db")

# API Settings
COUNTRY = "US"  # Change to your country code
AD_TYPE = "POLITICAL_AND_ISSUE_ADS"  # Note: Only political ads without special permission
LIMIT_PER_COMPETITOR = 10  # Max ads to fetch per competitor

# ===========================
# Database Functions
# ===========================
# Replace your get_competitors_from_db() function with this:

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from urllib.parse import urlparse

def get_competitors_from_db() -> List[Dict]:
    """Fetch all competitors from PostgreSQL database"""
    competitors = []
    
    try:
        # Get connection string from environment
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            print("❌ DATABASE_URL not found in .env file")
            print("💡 Make sure your .env file has: DATABASE_URL=postgresql://user:password@host:port/database")
            return []
        
        print(f"📂 Connecting to PostgreSQL database...")
        
        # Parse the URL to ensure it's in correct format
        parsed_url = urlparse(database_url)
        
        # Extract connection parameters
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
            sslmode="require"  # Required for Supabase
        )
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Fetch all competitors (prioritizing political ones)
        cursor.execute("""
            SELECT 
                id::text as id, 
                name, 
                COALESCE(domain, name) as domain,
                COALESCE(industry, 'Unknown') as industry,
                COALESCE(social_handles, '{}'::jsonb) as social_handles,
                COALESCE(estimated_monthly_spend, 0) as estimated_monthly_spend
            FROM public.competitors 
            ORDER BY 
                CASE 
                    WHEN industry ILIKE '%political%' THEN 1
                    WHEN industry ILIKE '%advocacy%' THEN 2
                    ELSE 3
                END,
                name
            LIMIT 15  -- Start with fewer to test
        """)
        
        rows = cursor.fetchall()
        
        for row in rows:
            competitors.append({
                "id": row["id"],
                "name": row["name"],
                "domain": row["domain"],
                "industry": row["industry"],
                "social_handles": row["social_handles"],
                "estimated_spend": row["estimated_monthly_spend"]
            })
        
        cursor.close()
        conn.close()
        
        print(f"✅ Found {len(competitors)} competitors in database")
        
        if len(competitors) == 0:
            print("💡 No competitors found. Did you run the SQL insert commands?")
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Common connection issues:")
        print("1. Check your DATABASE_URL in .env file")
        print("2. Make sure your Supabase password is correct")
        print("3. Check if your IP is allowed in Supabase settings")
        print("4. Try: DATABASE_URL=postgresql://postgres:Graysabodec205@db.syhypngkvalsakepxbtu.supabase.co:5432/postgres?sslmode=require")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        
    return competitors

def create_sample_table(cursor):
    """Create sample competitors table if it doesn't exist"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS competitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            domain TEXT,
            industry TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert sample data
    sample_data = [
        ("Nike", "nike.com", "Apparel"),
        ("Adidas", "adidas.com", "Apparel"),
        ("Apple", "apple.com", "Technology"),
        ("Microsoft", "microsoft.com", "Technology"),
        ("Democratic Party", "democrats.org", "Political"),
        ("Republican Party", "gop.com", "Political"),
    ]
    
    cursor.executemany(
        "INSERT INTO competitors (name, domain, industry) VALUES (?, ?, ?)",
        sample_data
    )
    
    print("📝 Created sample competitors table")

def get_sample_competitors() -> List[Dict]:
    """Return sample competitors if database fails"""
    return [
        {"id": 1, "name": "Nike", "domain": "nike.com", "industry": "Apparel"},
        {"id": 2, "name": "Adidas", "domain": "adidas.com", "industry": "Apparel"},
        {"id": 3, "name": "Apple", "domain": "apple.com", "industry": "Technology"},
    ]

# ===========================
# Meta API Functions
# ===========================
def fetch_meta_ads(competitor_name: str, search_limit: int = LIMIT_PER_COMPETITOR) -> List[Dict]:
    """Fetch ads from Meta Ad Library for a competitor"""
    
    url = f"https://graph.facebook.com/{META_API_VERSION}/ads_archive"
    
    params = {
        "access_token": META_ACCESS_TOKEN,
        "ad_reached_countries": COUNTRY,
        "ad_active_status": "ALL",
        "ad_type": AD_TYPE,
        "limit": search_limit,
        "fields": ",".join([
            "id",
            "page_id",
            "page_name",
            "ad_creative_body",
            "ad_creative_link_title",
            "ad_delivery_start_time",
            "ad_delivery_stop_time",
            "ad_snapshot_url",
        ]),
        "search_terms": competitor_name,
    }
    
    try:
        print(f"  🔍 Searching ads for: {competitor_name}")
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code != 200:
            print(f"  ⚠️ API Error: {response.status_code}")
            if response.status_code == 400:
                print("  💡 This usually means:")
                print("     - Only political ads available without ads_read permission")
                print("     - Try with political organizations instead of commercial brands")
            return []
        
        data = response.json()
        ads = data.get("data", [])
        
        # Clean the ads data
        cleaned_ads = []
        for ad in ads:
            cleaned_ads.append({
                "ad_id": ad.get("id"),
                "page_name": ad.get("page_name"),
                "ad_text": ad.get("ad_creative_body", "")[:100] + "..." if ad.get("ad_creative_body") else "No text",
                "link_title": ad.get("ad_creative_link_title", "No title"),
                "start_time": ad.get("ad_delivery_start_time"),
                "stop_time": ad.get("ad_delivery_stop_time"),
                "snapshot_url": ad.get("ad_snapshot_url"),
            })
        
        return cleaned_ads
        
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Request failed: {e}")
        return []
    except json.JSONDecodeError:
        print(f"  ❌ Failed to parse API response")
        return []

# ===========================
# Display Functions
# ===========================
def display_competitor_summary(competitor: Dict, ads: List[Dict]):
    """Display competitor and their ads in terminal"""
    
    print(f"\n{'='*60}")
    print(f"🏢 COMPETITOR: {competitor['name']}")
    print(f"{'='*60}")
    print(f"📊 Industry: {competitor['industry']}")
    print(f"🌐 Domain: {competitor['domain']}")
    print(f"📈 Ads Found: {len(ads)}")
    print(f"{'-'*60}")
    
    if not ads:
        print("  ⚠️ No ads found")
        print("\n  💡 Possible reasons:")
        print("     • Only political ads available without special permission")
        print("     • Company might not advertise on Facebook")
        print("     • Try searching with different name variations")
        return
    
    # Display each ad
    for i, ad in enumerate(ads, 1):
        print(f"\n  📢 AD #{i}:")
        print(f"     Page: {ad['page_name']}")
        print(f"     Text: {ad['ad_text']}")
        print(f"     Link: {ad['link_title']}")
        print(f"     Started: {ad['start_time'][:10] if ad['start_time'] else 'Unknown'}")
        if ad['snapshot_url']:
            print(f"     Snapshot: {ad['snapshot_url'][:50]}...")
    
    print(f"\n{'='*60}")

def display_overall_summary(results: List[Dict]):
    """Display overall summary"""
    
    total_competitors = len(results)
    competitors_with_ads = sum(1 for r in results if r['ads'])
    total_ads = sum(len(r['ads']) for r in results)
    
    print(f"\n{'='*60}")
    print("📊 OVERALL SUMMARY")
    print(f"{'='*60}")
    print(f"✅ Total competitors analyzed: {total_competitors}")
    print(f"✅ Competitors with ads found: {competitors_with_ads}")
    print(f"✅ Total ads fetched: {total_ads}")
    
    if total_ads > 0:
        print(f"\n🏆 Top competitors by ads:")
        sorted_results = sorted(results, key=lambda x: len(x['ads']), reverse=True)
        for i, result in enumerate(sorted_results[:3], 1):
            if result['ads']:
                print(f"  {i}. {result['competitor']['name']}: {len(result['ads'])} ads")
    
    print(f"\n{'='*60}")

# ===========================
# Main Execution
# ===========================
def main():
    """Main function to fetch and display competitor ads"""
    
    print("""
    🎯 META ADS COMPETITOR FETCHER
    ==============================
    Fetching ads from Meta Ad Library for competitors in database
    """)
    
    # Step 1: Get competitors from database
    competitors = get_competitors_from_db()
    
    if not competitors:
        print("❌ No competitors found. Exiting.")
        return
    
    # Step 2: Fetch ads for each competitor
    all_results = []
    
    for i, competitor in enumerate(competitors, 1):
        print(f"\n[{i}/{len(competitors)}] Processing: {competitor['name']}")
        
        # Fetch ads
        ads = fetch_meta_ads(competitor['name'])
        
        # Display results
        display_competitor_summary(competitor, ads)
        
        # Store results
        all_results.append({
            'competitor': competitor,
            'ads': ads
        })
        
        # Small delay to avoid rate limiting
        if i < len(competitors):
            import time
            time.sleep(1)
    
    # Step 3: Display overall summary
    display_overall_summary(all_results)
    
    # Step 4: Optional: Save results to file
    save_option = input("\n💾 Save results to JSON file? (y/n): ").lower().strip()
    if save_option == 'y':
        save_results_to_json(all_results)

def save_results_to_json(results: List[Dict]):
    """Save all results to JSON file"""
    filename = f"competitor_ads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    # Prepare data for JSON
    json_data = []
    for result in results:
        json_data.append({
            'competitor': result['competitor'],
            'ads_count': len(result['ads']),
            'ads': result['ads']
        })
    
    with open(filename, 'w') as f:
        json.dump(json_data, f, indent=2)
    
    print(f"✅ Results saved to: {filename}")

# ===========================
# Run the script
# ===========================
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️ Script interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("\n💡 Troubleshooting:")
        print("1. Check your .env file has META_ADS_ACCESS_TOKEN")
        print("2. Verify your database has competitors table")
        print("3. Check internet connection")
        print("4. Meta API might be down or changed")