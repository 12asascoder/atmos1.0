#!/usr/bin/env python3
"""
PART 2: Database Storage Service
Reads JSON file and saves data to database tables
"""

import json
import os
import psycopg2
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from urllib.parse import urlparse

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
# Data Storage Functions
# ===========================
class DataStorage:
    """Handles storage of JSON data into database tables"""
    
    def __init__(self, conn):
        self.conn = conn
        self.cursor = conn.cursor()
        self.processed_ids = {
            "competitors": set(),
            "campaigns": set(),
            "ads": set()
        }
    
    def close(self):
        """Close database connection"""
        self.cursor.close()
        self.conn.close()
    
    def find_or_create_competitor(self, advertiser_domain: str, page_name: str) -> str:
        """Find existing competitor or create new one"""
        try:
            # Try to find by domain first
            self.cursor.execute(
                "SELECT id FROM public.competitors WHERE domain = %s",
                (advertiser_domain,)
            )
            result = self.cursor.fetchone()
            
            if result:
                competitor_id = result[0]
                self.processed_ids["competitors"].add(competitor_id)
                return competitor_id
            
            # If not found, create new competitor
            competitor_id = str(uuid.uuid4())
            industry = self.infer_industry_from_domain(advertiser_domain)
            
            self.cursor.execute("""
                INSERT INTO public.competitors 
                (id, name, domain, industry, is_active)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (domain) DO UPDATE SET
                name = EXCLUDED.name,
                updated_at = NOW()
                RETURNING id
            """, (
                competitor_id,
                page_name if page_name else advertiser_domain.split('.')[0].title(),
                advertiser_domain,
                industry,
                True
            ))
            
            result = self.cursor.fetchone()
            actual_id = result[0] if result else competitor_id
            self.processed_ids["competitors"].add(actual_id)
            
            return actual_id
            
        except Exception as e:
            print(f"❌ Error finding/creating competitor: {e}")
            return None
    
    def infer_industry_from_domain(self, domain: str) -> str:
        """Infer industry from domain name"""
        domain_lower = domain.lower()
        
        if any(brand in domain_lower for brand in ['nike', 'adidas', 'puma', 'reebok']):
            return "Apparel"
        elif any(brand in domain_lower for brand in ['apple', 'microsoft', 'google', 'samsung']):
            return "Technology"
        elif any(brand in domain_lower for brand in ['coca', 'pepsi', 'starbucks']):
            return "Beverages"
        else:
            return "Other"
    
    def find_or_create_campaign(self, inferred_campaign_id: str, competitor_id: str, 
                               campaign_data: Dict) -> str:
        """Find existing campaign or create new one"""
        try:
            # Try to find by inferred_campaign_id
            self.cursor.execute(
                "SELECT id FROM public.ad_campaigns WHERE inferred_campaign_id = %s",
                (inferred_campaign_id,)
            )
            result = self.cursor.fetchone()
            
            if result:
                campaign_id = result[0]
                self.processed_ids["campaigns"].add(campaign_id)
                
                # Update campaign data
                self.cursor.execute("""
                    UPDATE public.ad_campaigns SET
                    campaign_name = COALESCE(%s, campaign_name),
                    status = COALESCE(%s, status),
                    creative_variants_count = GREATEST(creative_variants_count, %s),
                    ab_tests_active = GREATEST(ab_tests_active, %s),
                    total_estimated_spend = total_estimated_spend + %s,
                    total_estimated_impressions = total_estimated_impressions + %s,
                    last_seen_at = NOW(),
                    updated_at = NOW()
                    WHERE id = %s
                """, (
                    campaign_data.get('campaign_name'),
                    'ACTIVE',  # Default status
                    campaign_data.get('inferred_creative_variants', 1),
                    campaign_data.get('inferred_ab_tests_active', 0),
                    campaign_data.get('total_estimated_spend', 0),
                    campaign_data.get('total_estimated_impressions', 0),
                    campaign_id
                ))
                
                return campaign_id
            
            # Create new campaign
            campaign_db_id = str(uuid.uuid4())
            
            self.cursor.execute("""
                INSERT INTO public.ad_campaigns 
                (id, inferred_campaign_id, competitor_id, campaign_name,
                 status, creative_variants_count, ab_tests_active,
                 total_estimated_spend, total_estimated_impressions,
                 first_seen_at, last_seen_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id
            """, (
                campaign_db_id,
                inferred_campaign_id,
                competitor_id,
                campaign_data.get('campaign_name', f'Campaign {inferred_campaign_id}'),
                'ACTIVE',
                campaign_data.get('inferred_creative_variants', 1),
                campaign_data.get('inferred_ab_tests_active', 0),
                campaign_data.get('total_estimated_spend', 0),
                campaign_data.get('total_estimated_impressions', 0)
            ))
            
            result = self.cursor.fetchone()
            actual_id = result[0] if result else campaign_db_id
            self.processed_ids["campaigns"].add(actual_id)
            
            return actual_id
            
        except Exception as e:
            print(f"❌ Error finding/creating campaign: {e}")
            return None
    
    def save_advertisement(self, ad_data: Dict, competitor_id: str, campaign_id: str) -> str:
        """Save advertisement to database"""
        try:
            ad_db_id = str(uuid.uuid4())
            
            # Parse delivery times
            start_time = ad_data['delivery_timing']['ad_delivery_start_time']
            stop_time = ad_data['delivery_timing']['ad_delivery_stop_time']
            
            # Determine platform status
            platform_status = ad_data['platform_details']['platform_status']
            if not platform_status:
                platform_status = 'ACTIVE' if not stop_time else 'PAUSED'
            
            # Insert advertisement
            self.cursor.execute("""
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
                ad_db_id,
                ad_data['unique_ad_identifier'],
                ad_data['meta_ad_id'],
                campaign_id,
                competitor_id,
                ad_data['platform_details']['publisher_platforms'],
                platform_status,
                ad_data['platform_details']['discovery_status'],
                ad_data['advertiser_info']['page_name'],
                ad_data['advertiser_info']['page_id'],
                ad_data['creative_content']['ad_creative_body'][:10000],  # Limit length
                ad_data['creative_content']['ad_creative_link_title'],
                ad_data['creative_content']['ad_snapshot_url'],
                start_time,
                stop_time,
                ad_data['delivery_timing']['estimated_daily_spend'],
                json.dumps(ad_data['performance_metrics']['spend']),
                json.dumps(ad_data['performance_metrics']['impressions']),
                json.dumps(ad_data['performance_metrics']['clicks']),
                ad_data['performance_metrics']['calculated_ctr'],
                json.dumps(ad_data['targeting_and_reach']['targeting_criteria']),
                json.dumps(ad_data['targeting_and_reach']['demographic_distribution']),
                datetime.now() - timedelta(days=1),  # first_seen_at (yesterday)
                datetime.now()  # last_seen_at (now)
            ))
            
            result = self.cursor.fetchone()
            actual_id = result[0] if result else ad_db_id
            self.processed_ids["ads"].add(actual_id)
            
            # Create daily metrics for this ad
            self.create_daily_metrics(actual_id, competitor_id, campaign_id, ad_data)
            
            return actual_id
            
        except Exception as e:
            print(f"❌ Error saving advertisement: {e}")
            return None
    
    def create_daily_metrics(self, ad_id: str, competitor_id: str, campaign_id: str, ad_data: Dict):
        """Create daily metrics for the advertisement"""
        try:
            today = datetime.now().date()
            
            # Create metrics for last 7 days
            for day_offset in range(7):
                date = today - timedelta(days=day_offset)
                metric_id = str(uuid.uuid4())
                
                # Calculate daily values (simplified - divide by 7)
                daily_spend = ad_data['delivery_timing']['estimated_daily_spend']
                daily_impressions = ad_data['performance_metrics']['impressions']['estimated_midpoint'] / 7
                daily_clicks = ad_data['performance_metrics']['clicks']['count'] / 7
                
                self.cursor.execute("""
                    INSERT INTO public.daily_metrics 
                    (id, date, competitor_id, campaign_id, ad_id, daily_spend,
                     daily_impressions, daily_clicks, daily_ctr,
                     spend_lower_bound, spend_upper_bound,
                     impressions_lower_bound, impressions_upper_bound)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (date, ad_id) DO UPDATE SET
                    daily_spend = EXCLUDED.daily_spend,
                    daily_impressions = EXCLUDED.daily_impressions,
                    updated_at = NOW()
                """, (
                    metric_id,
                    date,
                    competitor_id,
                    campaign_id,
                    ad_id,
                    round(daily_spend, 2),
                    int(daily_impressions),
                    int(daily_clicks),
                    ad_data['performance_metrics']['calculated_ctr'],
                    round(daily_spend * 0.8, 2),
                    round(daily_spend * 1.2, 2),
                    int(daily_impressions * 0.85),
                    int(daily_impressions * 1.15)
                ))
                
        except Exception as e:
            print(f"⚠️ Warning creating daily metrics: {e}")
    
    def save_summary_metrics(self, summary_data: Dict, total_ads: int):
        """Save summary metrics to database"""
        try:
            summary_id = str(uuid.uuid4())
            
            # Parse dates
            start_date = datetime.fromisoformat(
                summary_data['aggregation_period']['start_date'].replace('Z', '+00:00')
            )
            end_date = datetime.fromisoformat(
                summary_data['aggregation_period']['end_date'].replace('Z', '+00:00')
            )
            
            # Calculate platform distribution (simplified)
            platform_distribution = {"Facebook": 60, "Instagram": 30, "Messenger": 10}
            
            # Get top performers
            self.cursor.execute("""
                SELECT 
                    c.name as competitor,
                    SUM(a.estimated_daily_spend * 7) as total_spend,
                    AVG(a.calculated_ctr) as avg_ctr
                FROM public.advertisements a
                JOIN public.competitors c ON a.competitor_id = c.id
                WHERE a.last_seen_at >= NOW() - INTERVAL '7 days'
                GROUP BY c.id, c.name
                ORDER BY total_spend DESC
                LIMIT 3
            """)
            
            top_performers = []
            for row in self.cursor.fetchall():
                grade = "A" if row[2] > 0.03 else "B" if row[2] > 0.02 else "C"
                top_performers.append({
                    "competitor": row[0],
                    "total_spend": float(row[1]) if row[1] else 0,
                    "ctr": float(row[2]) if row[2] else 0,
                    "grade": grade
                })
            
            # Get spend by industry
            self.cursor.execute("""
                SELECT 
                    c.industry,
                    SUM(a.estimated_daily_spend * 7) as total_spend
                FROM public.advertisements a
                JOIN public.competitors c ON a.competitor_id = c.id
                WHERE a.last_seen_at >= NOW() - INTERVAL '7 days'
                GROUP BY c.industry
            """)
            
            spend_by_industry = {}
            for row in self.cursor.fetchall():
                spend_by_industry[row[0]] = float(row[1]) if row[1] else 0
            
            # Insert summary metrics
            self.cursor.execute("""
                INSERT INTO public.summary_metrics 
                (id, period_start_date, period_end_date, total_competitor_spend,
                 active_campaigns_count, total_impressions, average_ctr,
                 platform_distribution, top_performers, spend_by_industry)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (period_start_date, period_end_date) DO UPDATE SET
                total_competitor_spend = EXCLUDED.total_competitor_spend,
                active_campaigns_count = EXCLUDED.active_campaigns_count,
                total_impressions = EXCLUDED.total_impressions,
                average_ctr = EXCLUDED.average_ctr,
                updated_at = NOW()
            """, (
                summary_id,
                start_date,
                end_date,
                summary_data['metrics']['total_competitor_spend']['estimated_total'],
                summary_data['metrics']['active_campaigns_count']['count'],
                summary_data['metrics']['total_impressions']['estimated_total'],
                summary_data['metrics']['average_ctr']['rate'],
                json.dumps(platform_distribution),
                json.dumps(top_performers),
                json.dumps(spend_by_industry)
            ))
            
            print(f"✅ Saved summary metrics")
            
        except Exception as e:
            print(f"❌ Error saving summary metrics: {e}")
    
    def save_data_source_log(self, generation_info: Dict, data_source_notes: Dict, 
                           filename: str, total_ads: int):
        """Save data source log to database"""
        try:
            log_id = str(uuid.uuid4())
            run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            self.cursor.execute("""
                INSERT INTO public.data_source_logs 
                (id, script_run_id, execution_timestamp, script_version,
                 competitors_analyzed, total_ads_processed, execution_duration_seconds,
                 status, meta_api_fields, calculated_fields, simulated_external_data,
                 critical_limitations, output_file_path)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                log_id,
                run_id,
                datetime.now(),
                generation_info.get('script_version', '1.0.0'),
                generation_info.get('competitors_analyzed', 0),
                total_ads,
                120,  # Estimated execution time
                'COMPLETED',
                json.dumps(data_source_notes.get('meta_api_fields', [])),
                json.dumps(data_source_notes.get('calculated_fields', [])),
                json.dumps(data_source_notes.get('simulated_external_data', [])),
                json.dumps(data_source_notes.get('critical_limitations', [])),
                filename
            ))
            
            print(f"✅ Saved data source log")
            
        except Exception as e:
            print(f"❌ Error saving data source log: {e}")
    
    def process_json_file(self, filename: str):
        """Process JSON file and save all data to database"""
        print(f"📂 Processing file: {filename}")
        
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"📊 Loaded data: {len(data['advertisements'])} ads")
            
            total_ads_saved = 0
            
            # Process each advertisement
            for ad in data['advertisements']:
                # Find or create competitor
                advertiser_domain = ad['advertiser_info']['advertiser_domain']
                page_name = ad['advertiser_info']['page_name']
                
                competitor_id = self.find_or_create_competitor(advertiser_domain, page_name)
                if not competitor_id:
                    print(f"⚠️ Skipping ad, could not find/create competitor")
                    continue
                
                # Find or create campaign
                inferred_campaign_id = ad['campaign_structure']['inferred_campaign_id']
                campaign_data = ad['campaign_structure']
                
                # Add estimated totals to campaign data
                campaign_data['total_estimated_spend'] = ad['performance_metrics']['spend']['estimated_midpoint']
                campaign_data['total_estimated_impressions'] = ad['performance_metrics']['impressions']['estimated_midpoint']
                
                campaign_id = self.find_or_create_campaign(
                    inferred_campaign_id, competitor_id, campaign_data
                )
                if not campaign_id:
                    print(f"⚠️ Skipping ad, could not find/create campaign")
                    continue
                
                # Save advertisement
                ad_id = self.save_advertisement(ad, competitor_id, campaign_id)
                if ad_id:
                    total_ads_saved += 1
            
            # Save summary metrics
            if 'summary' in data:
                self.save_summary_metrics(data['summary'], total_ads_saved)
            
            # Save data source log
            if 'generation_info' in data and 'data_source_notes' in data:
                self.save_data_source_log(
                    data['generation_info'],
                    data['data_source_notes'],
                    filename,
                    total_ads_saved
                )
            
            # Commit all changes
            self.conn.commit()
            
            print(f"\n✅ Successfully processed {total_ads_saved} ads")
            print(f"   Competitors: {len(self.processed_ids['competitors'])}")
            print(f"   Campaigns: {len(self.processed_ids['campaigns'])}")
            print(f"   Ads: {total_ads_saved}")
            
            return total_ads_saved
            
        except FileNotFoundError:
            print(f"❌ File not found: {filename}")
            return 0
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON file: {filename}")
            return 0
        except Exception as e:
            print(f"❌ Error processing file: {e}")
            self.conn.rollback()
            return 0

# ===========================
# Main Function
# ===========================
def save_json_to_database(filename: str = None) -> int:
    """Main function to save JSON data to database"""
    
    print("🚀 PART 2: Saving Data to Database")
    print("=" * 50)
    
    # If no filename provided, find latest JSON file
    if not filename:
        json_files = [f for f in os.listdir('.') if f.startswith('ads_data_') and f.endswith('.json')]
        if not json_files:
            print("❌ No JSON files found")
            return 0
        filename = sorted(json_files)[-1]  # Get latest file
        print(f"📁 Using latest file: {filename}")
    
    conn = None
    try:
        conn = get_db_connection()
        print("✅ Connected to database")
        
        storage = DataStorage(conn)
        ads_saved = storage.process_json_file(filename)
        
        storage.close()
        
        if ads_saved > 0:
            print(f"\n🎉 Successfully saved {ads_saved} ads to database")
        else:
            print(f"\n⚠️ No ads were saved to database")
        
        return ads_saved
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0
    finally:
        if conn:
            conn.close()

# ===========================
# Script Execution
# ===========================
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        filename = sys.argv[1]
        save_json_to_database(filename)
    else:
        save_json_to_database()