#!/usr/bin/env python3
"""
INSERT CONNECTED DUMMY DATA - FIXED FOREIGN KEY ISSUE
Ensures all UUIDs match across tables
"""

import os
import psycopg2
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from urllib.parse import urlparse
import random
import uuid

# ===========================
# Configuration
# ===========================
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found in .env file")

# ===========================
# Database Connection
# ===========================
def get_db_connection():
    """Create a database connection"""
    parsed_url = urlparse(DATABASE_URL)
    dbname = parsed_url.path[1:] if parsed_url.path else "postgres"
    user = parsed_url.username or "postgres"
    password = parsed_url.password or ""
    host = parsed_url.hostname or "localhost"
    port = parsed_url.port or 5432
    
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port,
        sslmode="require"
    )
    return conn

# ===========================
# FIXED: Store UUIDs in memory for reference
# ===========================
class DataStore:
    """Stores UUIDs to ensure foreign key consistency"""
    def __init__(self):
        self.competitors = {}  # name -> id mapping
        self.campaigns = {}    # campaign_name -> id mapping
        self.ads = {}          # ad_identifier -> id mapping
    
data_store = DataStore()

# ===========================
# Dummy Data Generators - FIXED
# ===========================
def generate_and_insert_competitors(conn) -> List[Dict]:
    """Generate AND INSERT competitors, store their IDs"""
    competitors_data = [
        {
            "name": "Nike",
            "domain": "nike.com",
            "industry": "Apparel",
            "estimated_monthly_spend": 50000.00,
            "social_handles": {"facebook": "nike", "instagram": "nike", "twitter": "nike"}
        },
        {
            "name": "Adidas",
            "domain": "adidas.com",
            "industry": "Apparel",
            "estimated_monthly_spend": 35000.00,
            "social_handles": {"facebook": "adidas", "instagram": "adidas", "twitter": "adidas"}
        },
        {
            "name": "Apple",
            "domain": "apple.com",
            "industry": "Technology",
            "estimated_monthly_spend": 150000.00,
            "social_handles": {"facebook": "apple", "instagram": "apple", "twitter": "apple"}
        },
        {
            "name": "Microsoft",
            "domain": "microsoft.com",
            "industry": "Technology",
            "estimated_monthly_spend": 80000.00,
            "social_handles": {"facebook": "microsoft", "instagram": "microsoft", "twitter": "microsoft"}
        },
        {
            "name": "Coca-Cola",
            "domain": "coca-cola.com",
            "industry": "Beverages",
            "estimated_monthly_spend": 45000.00,
            "social_handles": {"facebook": "cocacola", "instagram": "cocacola", "twitter": "CocaCola"}
        }
    ]
    
    cursor = conn.cursor()
    inserted_competitors = []
    
    for comp_data in competitors_data:
        # Generate UUID for this competitor
        competitor_id = str(uuid.uuid4())
        
        # Insert into database
        cursor.execute("""
            INSERT INTO public.competitors 
            (id, name, domain, industry, estimated_monthly_spend, social_handles)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (domain) DO UPDATE SET
            name = EXCLUDED.name,
            industry = EXCLUDED.industry,
            estimated_monthly_spend = EXCLUDED.estimated_monthly_spend,
            updated_at = NOW()
            RETURNING id
        """, (
            competitor_id, comp_data['name'], comp_data['domain'], 
            comp_data['industry'], comp_data['estimated_monthly_spend'], 
            json.dumps(comp_data['social_handles'])
        ))
        
        # Get the actual ID (in case of conflict)
        result = cursor.fetchone()
        actual_id = result[0] if result else competitor_id
        
        # Store in data_store for reference
        data_store.competitors[comp_data['name']] = actual_id
        
        # Add to return list
        inserted_competitors.append({
            "id": actual_id,
            **comp_data
        })
    
    conn.commit()
    cursor.close()
    print(f"✅ Inserted {len(inserted_competitors)} competitors")
    return inserted_competitors

def generate_and_insert_campaigns(conn, competitors: List[Dict]) -> List[Dict]:
    """Generate AND INSERT campaigns using actual competitor IDs"""
    campaigns_data = []
    campaign_names = [
        "Holiday Sale 2025",
        "Spring Collection Launch", 
        "Product Launch Campaign",
        "Brand Awareness Q4",
        "Back to School Promo",
        "Black Friday Blitz",
        "New Year Reset",
        "Summer Fitness Challenge"
    ]
    
    objectives = ["Sales", "Brand Awareness", "Lead Generation", "Traffic", "Engagement"]
    statuses = ["ACTIVE", "PAUSED", "COMPLETED"]
    
    cursor = conn.cursor()
    
    for competitor in competitors:
        comp_name = competitor['name']
        comp_id = data_store.competitors[comp_name]
        
        # Each competitor gets 2-3 campaigns
        num_campaigns = random.randint(2, 3)
        for i in range(num_campaigns):
            campaign_id = str(uuid.uuid4())
            inferred_id = f"campaign_{comp_name.lower()}_{random.randint(1000, 9999)}"
            
            campaign_data = {
                "id": campaign_id,
                "inferred_campaign_id": inferred_id,
                "competitor_id": comp_id,  # Use the ACTUAL ID from database
                "competitor_name": comp_name,
                "campaign_name": f"{random.choice(campaign_names)} {random.randint(1, 100)}",
                "objective": random.choice(objectives),
                "status": random.choice(statuses),
                "creative_variants_count": random.randint(1, 5),
                "ab_tests_active": random.randint(0, 2),
                "total_estimated_spend": random.randint(5000, 50000),
                "total_estimated_impressions": random.randint(100000, 1000000),
                "first_seen_at": datetime.now() - timedelta(days=random.randint(1, 30)),
                "last_seen_at": datetime.now() - timedelta(days=random.randint(0, 5))
            }
            
            # Insert into database
            cursor.execute("""
                INSERT INTO public.ad_campaigns 
                (id, inferred_campaign_id, competitor_id, campaign_name, objective,
                 status, creative_variants_count, ab_tests_active, total_estimated_spend,
                 total_estimated_impressions, first_seen_at, last_seen_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (inferred_campaign_id) DO UPDATE SET
                campaign_name = EXCLUDED.campaign_name,
                status = EXCLUDED.status,
                total_estimated_spend = EXCLUDED.total_estimated_spend,
                last_seen_at = EXCLUDED.last_seen_at,
                updated_at = NOW()
                RETURNING id
            """, (
                campaign_data['id'], campaign_data['inferred_campaign_id'], 
                campaign_data['competitor_id'], campaign_data['campaign_name'],
                campaign_data['objective'], campaign_data['status'],
                campaign_data['creative_variants_count'], campaign_data['ab_tests_active'],
                campaign_data['total_estimated_spend'], campaign_data['total_estimated_impressions'],
                campaign_data['first_seen_at'], campaign_data['last_seen_at']
            ))
            
            # Get the actual ID
            result = cursor.fetchone()
            actual_id = result[0] if result else campaign_id
            
            # Store in data_store
            data_store.campaigns[campaign_data['inferred_campaign_id']] = actual_id
            
            campaigns_data.append({
                "id": actual_id,
                **campaign_data
            })
    
    conn.commit()
    cursor.close()
    print(f"✅ Inserted {len(campaigns_data)} campaigns")
    return campaigns_data

def generate_and_insert_advertisements(conn, competitors: List[Dict], campaigns: List[Dict]) -> List[Dict]:
    """Generate AND INSERT ads using actual campaign IDs"""
    advertisements_data = []
    
    # Create quick lookup maps
    competitor_map = {c['name']: c for c in competitors}
    campaign_map = {c['id']: c for c in campaigns}
    
    ad_templates = {
        "Nike": [
            "Just Do It. Get {discount}% off our latest collection.",
            "Run like never before. New {product} available now.",
            "Unleash your potential with Nike {product}."
        ],
        "Adidas": [
            "Impossible is Nothing. Shop the {collection} collection.",
            "Create the new. Limited time offer: {discount}% off.",
            "Adidas {product}: Made for athletes."
        ],
        "Apple": [
            "Think different. Introducing the new {product}.",
            "{product}: The future is here. Pre-order now.",
            "Experience innovation with Apple {product}."
        ],
        "Microsoft": [
            "Empower your productivity with {product}.",
            "{product}: Work smarter, not harder.",
            "Microsoft {product}: Built for business."
        ],
        "Coca-Cola": [
            "Taste the feeling. Enjoy {product} today.",
            "Open happiness with Coca-Cola {product}.",
            "Refresh your world with {product}."
        ]
    }
    
    products = {
        "Apparel": ["Running Shoes", "T-shirts", "Jackets", "Shorts", "Hoodies"],
        "Technology": ["iPhone 16", "Surface Pro", "MacBook Pro", "iPad", "Watch"],
        "Beverages": ["Coke Zero", "Sprite", "Fanta", "Diet Coke", "Energy Drink"]
    }
    
    cursor = conn.cursor()
    
    for campaign in campaigns:
        comp_name = campaign['competitor_name']
        competitor = competitor_map[comp_name]
        industry = competitor['industry']
        
        # Each campaign gets 1-3 ads
        num_ads = random.randint(1, 3)
        for ad_num in range(num_ads):
            ad_id = str(uuid.uuid4())
            meta_ad_id = f"{random.randint(100000000, 999999999)}"
            unique_ad_id = f"ad_meta_{meta_ad_id}"
            
            # Generate ad content
            template = random.choice(ad_templates.get(comp_name, ad_templates["Nike"]))
            product = random.choice(products.get(industry, ["Product"]))
            discount = random.choice([20, 30, 40, 50])
            
            ad_body = template.format(product=product, discount=discount, collection=f"{industry} Collection")
            
            # Determine platform
            platforms = random.choice([
                ["facebook"],
                ["instagram"], 
                ["facebook", "instagram"],
                ["facebook", "messenger"]
            ])
            
            # Generate performance data
            spend_range = f"{random.randint(100, 500)}-{random.randint(600, 1000)}"
            impressions_lower = random.randint(5000, 50000)
            impressions_upper = impressions_lower + random.randint(10000, 50000)
            
            # Calculate CTR based on industry
            ctr_benchmarks = {"Apparel": 0.035, "Technology": 0.025, "Beverages": 0.020}
            ctr = ctr_benchmarks.get(industry, 0.025)
            clicks = int(((impressions_lower + impressions_upper) / 2) * ctr)
            
            # Create ad data
            ad_data = {
                "id": ad_id,
                "unique_ad_identifier": unique_ad_id,
                "meta_ad_id": meta_ad_id,
                "campaign_id": campaign['id'],  # Use ACTUAL campaign ID
                "competitor_id": competitor['id'],  # Use ACTUAL competitor ID
                "publisher_platforms": platforms,
                "platform_status": random.choice(["ACTIVE", "PAUSED", "COMPLETED"]),
                "discovery_status": random.choice([None, "NEW", "TRENDING"]),
                "page_name": f"{comp_name} {random.choice(['Official', 'Store', 'Global', 'EU'])}",
                "page_id": f"{random.randint(1000000000, 9999999999)}",
                "ad_creative_body": ad_body,
                "ad_creative_link_title": f"Shop Now - {random.choice(['Limited Time', 'Exclusive', 'Special'])} Offer",
                "ad_snapshot_url": f"https://www.facebook.com/ads/archive/creative-snapshot/?id={meta_ad_id}",
                "ad_delivery_start_time": campaign['first_seen_at'] + timedelta(hours=random.randint(0, 72)),
                "ad_delivery_stop_time": random.choice([None, datetime.now() - timedelta(days=random.randint(1, 10))]),
                "estimated_daily_spend": round(random.uniform(100, 2000), 2),
                "spend_data": {
                    "currency": random.choice(["USD", "EUR", "GBP"]),
                    "amount": spend_range,
                    "estimated_midpoint": random.randint(300, 800)
                },
                "impressions_data": {
                    "lower_bound": impressions_lower,
                    "upper_bound": impressions_upper,
                    "estimated_midpoint": (impressions_lower + impressions_upper) // 2
                },
                "clicks_data": {
                    "count": clicks,
                    "estimated_ctr": ctr,
                    "calculation_note": "Simulated using industry benchmark"
                },
                "calculated_ctr": ctr,
                "targeting_criteria": {
                    "languages": random.choice([["en"], ["en", "fr"], ["en", "de"], ["en", "es"]]),
                    "age_range": [str(random.randint(18, 25)), str(random.randint(45, 65))],
                    "genders": random.choice([[1, 2], [1], [2]])
                },
                "demographic_distribution": generate_demographics(industry),
                "first_seen_at": campaign['first_seen_at'],
                "last_seen_at": datetime.now() - timedelta(days=random.randint(0, 2))
            }
            
            # Insert into database
            cursor.execute("""
                INSERT INTO public.advertisements 
                (id, unique_ad_identifier, meta_ad_id, campaign_id, competitor_id,
                 publisher_platforms, platform_status, discovery_status, page_name,
                 page_id, ad_creative_body, ad_creative_link_title, ad_snapshot_url,
                 ad_delivery_start_time, ad_delivery_stop_time, estimated_daily_spend,
                 spend_data, impressions_data, clicks_data, calculated_ctr,
                 targeting_criteria, demographic_distribution, first_seen_at, last_seen_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (unique_ad_identifier) DO UPDATE SET
                platform_status = EXCLUDED.platform_status,
                estimated_daily_spend = EXCLUDED.estimated_daily_spend,
                spend_data = EXCLUDED.spend_data,
                last_seen_at = EXCLUDED.last_seen_at,
                updated_at = NOW()
                RETURNING id
            """, (
                ad_data['id'], ad_data['unique_ad_identifier'], ad_data['meta_ad_id'], 
                ad_data['campaign_id'], ad_data['competitor_id'], ad_data['publisher_platforms'],
                ad_data['platform_status'], ad_data['discovery_status'], ad_data['page_name'],
                ad_data['page_id'], ad_data['ad_creative_body'], ad_data['ad_creative_link_title'],
                ad_data['ad_snapshot_url'], ad_data['ad_delivery_start_time'], ad_data['ad_delivery_stop_time'],
                ad_data['estimated_daily_spend'], json.dumps(ad_data['spend_data']),
                json.dumps(ad_data['impressions_data']), json.dumps(ad_data['clicks_data']),
                ad_data['calculated_ctr'], json.dumps(ad_data['targeting_criteria']),
                json.dumps(ad_data['demographic_distribution']), ad_data['first_seen_at'],
                ad_data['last_seen_at']
            ))
            
            # Get the actual ID
            result = cursor.fetchone()
            actual_id = result[0] if result else ad_id
            
            # Store in data_store
            data_store.ads[ad_data['unique_ad_identifier']] = actual_id
            
            advertisements_data.append({
                "id": actual_id,
                **ad_data
            })
    
    conn.commit()
    cursor.close()
    print(f"✅ Inserted {len(advertisements_data)} advertisements")
    return advertisements_data

def generate_demographics(industry: str) -> List[Dict]:
    """Generate demographic distribution based on industry"""
    if industry == "Apparel":
        return [
            {"age": "18-24", "gender": "male", "percentage": 35.5},
            {"age": "25-34", "gender": "male", "percentage": 28.2},
            {"age": "18-24", "gender": "female", "percentage": 18.7},
            {"age": "25-34", "gender": "female", "percentage": 17.6}
        ]
    elif industry == "Technology":
        return [
            {"age": "25-34", "gender": "male", "percentage": 42.3},
            {"age": "35-44", "gender": "male", "percentage": 32.1},
            {"age": "25-34", "gender": "female", "percentage": 15.4},
            {"age": "35-44", "gender": "female", "percentage": 10.2}
        ]
    else:  # Beverages
        return [
            {"age": "13-17", "gender": "male", "percentage": 25.5},
            {"age": "18-24", "gender": "male", "percentage": 22.8},
            {"age": "13-17", "gender": "female", "percentage": 28.3},
            {"age": "18-24", "gender": "female", "percentage": 23.4}
        ]

def generate_and_insert_daily_metrics(conn, advertisements: List[Dict]) -> List[Dict]:
    """Generate AND INSERT daily metrics using actual ad IDs"""
    daily_metrics_data = []
    today = datetime.now().date()
    
    cursor = conn.cursor()
    
    for ad in advertisements:
        # Generate 7 days of data
        for day_offset in range(7, 0, -1):
            date = today - timedelta(days=day_offset)
            metric_id = str(uuid.uuid4())
            
            # Add some randomness to daily metrics
            base_spend = ad['estimated_daily_spend'] * random.uniform(0.7, 1.3)
            base_impressions = ad['impressions_data']['estimated_midpoint'] / 7 * random.uniform(0.8, 1.2)
            
            daily_metric = {
                "id": metric_id,
                "date": date,
                "competitor_id": ad['competitor_id'],  # Use actual IDs
                "campaign_id": ad['campaign_id'],
                "ad_id": ad['id'],
                "daily_spend": round(base_spend, 2),
                "daily_impressions": int(base_impressions),
                "daily_clicks": int(base_impressions * ad['calculated_ctr']),
                "daily_ctr": ad['calculated_ctr'] * random.uniform(0.9, 1.1),
                "spend_lower_bound": round(base_spend * 0.8, 2),
                "spend_upper_bound": round(base_spend * 1.2, 2),
                "impressions_lower_bound": int(base_impressions * 0.85),
                "impressions_upper_bound": int(base_impressions * 1.15)
            }
            
            # Insert into database
            cursor.execute("""
                INSERT INTO public.daily_metrics 
                (id, date, competitor_id, campaign_id, ad_id, daily_spend,
                 daily_impressions, daily_clicks, daily_ctr, spend_lower_bound,
                 spend_upper_bound, impressions_lower_bound, impressions_upper_bound)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (date, ad_id) DO UPDATE SET
                daily_spend = EXCLUDED.daily_spend,
                daily_impressions = EXCLUDED.daily_impressions,
                updated_at = NOW()
            """, (
                daily_metric['id'], daily_metric['date'], daily_metric['competitor_id'],
                daily_metric['campaign_id'], daily_metric['ad_id'], daily_metric['daily_spend'],
                daily_metric['daily_impressions'], daily_metric['daily_clicks'],
                daily_metric['daily_ctr'], daily_metric['spend_lower_bound'],
                daily_metric['spend_upper_bound'], daily_metric['impressions_lower_bound'],
                daily_metric['impressions_upper_bound']
            ))
            
            daily_metrics_data.append(daily_metric)
    
    conn.commit()
    cursor.close()
    print(f"✅ Inserted {len(daily_metrics_data)} daily metrics")
    return daily_metrics_data

def generate_and_insert_summary_metrics(conn, competitors: List[Dict], advertisements: List[Dict]) -> Dict:
    """Generate AND INSERT summary metrics"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    summary_id = str(uuid.uuid4())
    
    # Calculate totals
    total_spend = sum(ad.get('estimated_daily_spend', 0) * 7 for ad in advertisements)
    total_impressions = sum(ad.get('impressions_data', {}).get('estimated_midpoint', 0) for ad in advertisements)
    avg_ctr = sum(ad.get('calculated_ctr', 0) for ad in advertisements) / len(advertisements) if advertisements else 0
    
    # Group by industry
    spend_by_industry = {}
    for comp in competitors:
        industry = comp['industry']
        if industry not in spend_by_industry:
            spend_by_industry[industry] = 0
        spend_by_industry[industry] += random.randint(10000, 50000)
    
    # Platform distribution
    platform_distribution = {"Facebook": 45, "Instagram": 35, "Messenger": 15, "Audience Network": 5}
    
    # Top performers
    top_performers = []
    for comp in competitors[:3]:
        top_performers.append({
            "competitor": comp['name'],
            "total_spend": random.randint(20000, 80000),
            "ctr": round(random.uniform(0.025, 0.045), 3),
            "grade": random.choice(["A", "A+", "B+"])
        })
    
    summary_data = {
        "id": summary_id,
        "period_start_date": start_date,
        "period_end_date": end_date,
        "total_competitor_spend": round(total_spend, 2),
        "active_campaigns_count": len(set(ad['campaign_id'] for ad in advertisements)),
        "total_impressions": total_impressions,
        "average_ctr": round(avg_ctr, 4),
        "platform_distribution": platform_distribution,
        "top_performers": top_performers,
        "spend_by_industry": spend_by_industry
    }
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO public.summary_metrics 
        (id, period_start_date, period_end_date, total_competitor_spend,
         active_campaigns_count, total_impressions, average_ctr,
         platform_distribution, top_performers, spend_by_industry)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (period_start_date, period_end_date) DO UPDATE SET
        total_competitor_spend = EXCLUDED.total_competitor_spend,
        active_campaigns_count = EXCLUDED.active_campaigns_count,
        updated_at = NOW()
    """, (
        summary_data['id'], summary_data['period_start_date'], summary_data['period_end_date'],
        summary_data['total_competitor_spend'], summary_data['active_campaigns_count'],
        summary_data['total_impressions'], summary_data['average_ctr'],
        json.dumps(summary_data['platform_distribution']),
        json.dumps(summary_data['top_performers']),
        json.dumps(summary_data['spend_by_industry'])
    ))
    
    conn.commit()
    cursor.close()
    print("✅ Inserted summary metrics")
    return summary_data

def generate_and_insert_data_source_log(conn, competitors_count: int, ads_count: int) -> Dict:
    """Generate AND INSERT data source log"""
    log_id = str(uuid.uuid4())
    run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    log_data = {
        "id": log_id,
        "script_run_id": run_id,
        "execution_timestamp": datetime.now(),
        "script_version": "2.0.0",
        "competitors_analyzed": competitors_count,
        "total_ads_processed": ads_count,
        "execution_duration_seconds": random.randint(30, 120),
        "status": "COMPLETED",
        "meta_api_fields": [
            "meta_ad_id", "page_name", "page_id", "ad_creative_body",
            "ad_creative_link_title", "ad_snapshot_url", "ad_delivery_start_time",
            "ad_delivery_stop_time", "spend.amount (range)", "impressions.lower_bound/upper_bound"
        ],
        "calculated_fields": [
            "estimated_daily_spend", "performance_metrics.spend.estimated_midpoint",
            "performance_metrics.impressions.estimated_midpoint", "calculated_ctr"
        ],
        "simulated_external_data": [
            "performance_metrics.clicks.count", "summary.metrics.average_ctr"
        ],
        "critical_limitations": [
            "Click data is simulated", "CTR based on industry benchmarks"
        ],
        "output_file_path": f"/data/output_{datetime.now().strftime('%Y%m%d')}.json"
    }
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO public.data_source_logs 
        (id, script_run_id, execution_timestamp, script_version,
         competitors_analyzed, total_ads_processed, execution_duration_seconds,
         status, meta_api_fields, calculated_fields, simulated_external_data,
         critical_limitations, output_file_path)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        log_data['id'], log_data['script_run_id'], log_data['execution_timestamp'],
        log_data['script_version'], log_data['competitors_analyzed'], log_data['total_ads_processed'],
        log_data['execution_duration_seconds'], log_data['status'],
        json.dumps(log_data['meta_api_fields']), json.dumps(log_data['calculated_fields']),
        json.dumps(log_data['simulated_external_data']), json.dumps(log_data['critical_limitations']),
        log_data['output_file_path']
    ))
    
    conn.commit()
    cursor.close()
    print("✅ Inserted data source log")
    return log_data

# ===========================
# Verification
# ===========================
def verify_data(conn) -> None:
    """Verify that data was inserted correctly"""
    cursor = conn.cursor()
    
    print("\n📊 DATA VERIFICATION")
    print("=" * 50)
    
    # Check table counts
    tables = ["competitors", "ad_campaigns", "advertisements", "daily_metrics", "summary_metrics", "data_source_logs"]
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM public.{table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count} records")
    
    # Check foreign key relationships
    cursor.execute("""
        SELECT 
            c.name as competitor,
            COUNT(DISTINCT ac.id) as campaigns,
            COUNT(DISTINCT a.id) as ads,
            COUNT(DISTINCT dm.id) as daily_metrics
        FROM public.competitors c
        LEFT JOIN public.ad_campaigns ac ON c.id = ac.competitor_id
        LEFT JOIN public.advertisements a ON ac.id = a.campaign_id
        LEFT JOIN public.daily_metrics dm ON a.id = dm.ad_id
        GROUP BY c.name
        ORDER BY c.name
    """)
    
    print("\n🔗 RELATIONSHIPS CHECK")
    print("=" * 50)
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} campaigns, {row[2]} ads, {row[3]} daily metrics")
    
    # Check for orphaned records
    cursor.execute("""
        SELECT 'Orphaned campaigns' as issue, COUNT(*) as count
        FROM public.ad_campaigns ac
        WHERE NOT EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = ac.competitor_id)
        UNION ALL
        SELECT 'Orphaned ads' as issue, COUNT(*) as count
        FROM public.advertisements a
        WHERE NOT EXISTS (SELECT 1 FROM public.ad_campaigns ac WHERE ac.id = a.campaign_id)
        UNION ALL
        SELECT 'Orphaned daily metrics' as issue, COUNT(*) as count
        FROM public.daily_metrics dm
        WHERE NOT EXISTS (SELECT 1 FROM public.advertisements a WHERE a.id = dm.ad_id)
    """)
    
    print("\n🔍 ORPHANED RECORDS CHECK")
    print("=" * 50)
    issues_found = False
    for row in cursor.fetchall():
        if row[1] > 0:
            print(f"  ⚠️  {row[0]}: {row[1]} found")
            issues_found = True
    
    if not issues_found:
        print("  ✅ No orphaned records found")
    
    cursor.close()

# ===========================
# Main Execution - FIXED ORDER
# ===========================
def main():
    print("🚀 INSERTING CONNECTED DUMMY DATA (FIXED VERSION)")
    print("=" * 60)
    
    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        print("✅ Connected to database")
        
        # Step 1: Generate AND INSERT competitors FIRST
        print("\n1️⃣ Inserting competitors...")
        competitors = generate_and_insert_competitors(conn)
        
        # Step 2: Generate AND INSERT campaigns (uses actual competitor IDs)
        print("\n2️⃣ Inserting campaigns...")
        campaigns = generate_and_insert_campaigns(conn, competitors)
        
        # Step 3: Generate AND INSERT ads (uses actual campaign IDs)
        print("\n3️⃣ Inserting advertisements...")
        advertisements = generate_and_insert_advertisements(conn, competitors, campaigns)
        
        # Step 4: Generate AND INSERT daily metrics (uses actual ad IDs)
        print("\n4️⃣ Inserting daily metrics...")
        daily_metrics = generate_and_insert_daily_metrics(conn, advertisements)
        
        # Step 5: Generate AND INSERT summary metrics
        print("\n5️⃣ Inserting summary metrics...")
        summary = generate_and_insert_summary_metrics(conn, competitors, advertisements)
        
        # Step 6: Generate AND INSERT data source log
        print("\n6️⃣ Inserting data source log...")
        data_log = generate_and_insert_data_source_log(conn, len(competitors), len(advertisements))
        
        # Step 7: Verify all data
        print("\n7️⃣ Verifying data...")
        verify_data(conn)
        
        print("\n" + "=" * 60)
        print("🎉 ALL DUMMY DATA INSERTED SUCCESSFULLY!")
        print("=" * 60)
        
        # Show sample dashboard query
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                c.name as competitor,
                c.industry,
                COUNT(DISTINCT ac.id) as total_campaigns,
                COUNT(DISTINCT a.id) as total_ads,
                SUM(a.estimated_daily_spend * 7) as estimated_weekly_spend
            FROM public.competitors c
            LEFT JOIN public.ad_campaigns ac ON c.id = ac.competitor_id
            LEFT JOIN public.advertisements a ON ac.id = a.campaign_id
            GROUP BY c.id, c.name, c.industry
            ORDER BY estimated_weekly_spend DESC NULLS LAST
        """)
        
        print("\n📈 SAMPLE DASHBOARD QUERY:")
        print("-" * 50)
        print(f"{'Competitor':<15} {'Industry':<12} {'Campaigns':<10} {'Ads':<8} {'Weekly Spend':<12}")
        print("-" * 50)
        for row in cursor.fetchall():
            print(f"{row[0]:<15} {row[1]:<12} {row[2]:<10} {row[3]:<8} ${row[4]:>10,.2f}")
        
        cursor.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        if conn:
            conn.close()
            print("\n🔗 Database connection closed")

# ===========================
# Run the script
# ===========================
if __name__ == "__main__":
    main()