#!/usr/bin/env python3
"""
PART 3: Cron Job Scheduler
Runs the data pipeline every 6 hours automatically
"""

import os
import sys
import time
import schedule
import subprocess
import threading
from datetime import datetime
import logging
from pathlib import Path

# ===========================
# Configuration
# ===========================
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / 'cron_scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Script paths (adjust if needed)
FETCH_SCRIPT = "fetch_ads_data.py"
SAVE_SCRIPT = "save_to_database.py"

# ===========================
# Job Functions
# ===========================
def run_fetch_ads():
    """Run the fetch ads script"""
    logger.info("🔄 Starting fetch ads job...")
    start_time = datetime.now()
    
    try:
        # Run fetch script
        result = subprocess.run(
            [sys.executable, FETCH_SCRIPT],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        if result.returncode == 0:
            logger.info(f"✅ Fetch ads job completed successfully in {duration:.2f}s")
            
            # Extract filename from output
            for line in result.stdout.split('\n'):
                if 'Data saved to:' in line:
                    filename = line.split(':')[-1].strip()
                    logger.info(f"📁 Generated file: {filename}")
                    return filename
                    
        else:
            logger.error(f"❌ Fetch ads job failed with code {result.returncode}")
            logger.error(f"Stderr: {result.stderr[:500]}")
            
    except subprocess.TimeoutExpired:
        logger.error("⏰ Fetch ads job timed out after 5 minutes")
    except Exception as e:
        logger.error(f"❌ Unexpected error in fetch ads job: {e}")
    
    return None

def run_save_to_database(filename: str = None):
    """Run the save to database script"""
    logger.info("💾 Starting save to database job...")
    start_time = datetime.now()
    
    try:
        # Build command
        cmd = [sys.executable, SAVE_SCRIPT]
        if filename:
            cmd.append(filename)
        
        # Run save script
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180  # 3 minute timeout
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        if result.returncode == 0:
            logger.info(f"✅ Save to database job completed in {duration:.2f}s")
            # Check for success message
            if "Successfully saved" in result.stdout:
                for line in result.stdout.split('\n'):
                    if "Successfully saved" in line:
                        logger.info(line.strip())
        else:
            logger.error(f"❌ Save to database job failed with code {result.returncode}")
            logger.error(f"Stderr: {result.stderr[:500]}")
            
    except subprocess.TimeoutExpired:
        logger.error("⏰ Save to database job timed out after 3 minutes")
    except Exception as e:
        logger.error(f"❌ Unexpected error in save to database job: {e}")

def run_complete_pipeline():
    """Run the complete data pipeline"""
    logger.info("🚀 Starting complete data pipeline...")
    
    # Step 1: Fetch ads data
    filename = run_fetch_ads()
    
    # Step 2: Save to database (if fetch was successful)
    if filename:
        run_save_to_database(filename)
        
        # Clean up old JSON files (keep last 3)
        cleanup_old_files()
    else:
        logger.warning("⚠️ Skipping save to database due to fetch failure")
    
    logger.info("🏁 Data pipeline completed")

def cleanup_old_files():
    """Clean up old JSON files, keep only the last 3"""
    try:
        json_files = sorted(
            [f for f in os.listdir('.') if f.startswith('ads_data_') and f.endswith('.json')],
            key=os.path.getmtime,
            reverse=True
        )
        
        if len(json_files) > 3:
            for old_file in json_files[3:]:
                os.remove(old_file)
                logger.info(f"🧹 Cleaned up old file: {old_file}")
                
    except Exception as e:
        logger.warning(f"⚠️ Could not clean up old files: {e}")

# ===========================
# Scheduler Setup
# ===========================
def setup_scheduler():
    """Set up the scheduled jobs"""
    
    # Run every 6 hours
    schedule.every(6).hours.do(run_complete_pipeline)
    
    # Also run at specific times for testing (optional)
    # schedule.every().day.at("09:00").do(run_complete_pipeline)
    # schedule.every().day.at("15:00").do(run_complete_pipeline)
    # schedule.every().day.at("21:00").do(run_complete_pipeline)
    
    # Run immediately on startup (optional)
    logger.info("🏃 Running initial pipeline on startup...")
    initial_thread = threading.Thread(target=run_complete_pipeline)
    initial_thread.start()
    
    logger.info("⏰ Scheduler set up. Jobs will run every 6 hours.")
    logger.info("📅 Next run: " + str(schedule.next_run()))

def run_scheduler():
    """Run the scheduler continuously"""
    logger.info("🔄 Starting cron scheduler...")
    setup_scheduler()
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
            
    except KeyboardInterrupt:
        logger.info("🛑 Scheduler stopped by user")
    except Exception as e:
        logger.error(f"❌ Scheduler error: {e}")

# ===========================
# Command Line Interface
# ===========================
def main():
    """Main function with command line options"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Competitor Ads Data Pipeline Scheduler")
    parser.add_argument('--run-once', action='store_true', 
                       help='Run the pipeline once and exit')
    parser.add_argument('--fetch-only', action='store_true',
                       help='Run only the fetch ads script')
    parser.add_argument('--save-only', metavar='FILENAME',
                       help='Run only the save to database script')
    parser.add_argument('--cleanup', action='store_true',
                       help='Clean up old JSON files')
    
    args = parser.parse_args()
    
    if args.run_once:
        logger.info("🔂 Running pipeline once...")
        run_complete_pipeline()
        
    elif args.fetch_only:
        logger.info("🎣 Running fetch only...")
        run_fetch_ads()
        
    elif args.save_only:
        logger.info("💽 Running save only...")
        run_save_to_database(args.save_only)
        
    elif args.cleanup:
        logger.info("🧹 Cleaning up old files...")
        cleanup_old_files()
        
    else:
        # Run as continuous scheduler
        print("=" * 50)
        print("🚀 COMPETITOR ADS DATA PIPELINE SCHEDULER")
        print("=" * 50)
        print("Running every 6 hours")
        print("Press Ctrl+C to stop")
        print("=" * 50)
        
        run_scheduler()

# ===========================
# Script Execution
# ===========================
if __name__ == "__main__":
    # Check if required scripts exist
    for script in [FETCH_SCRIPT, SAVE_SCRIPT]:
        if not os.path.exists(script):
            print(f"❌ Error: {script} not found")
            print(f"💡 Make sure all 3 scripts are in the same directory:")
            print(f"   1. {FETCH_SCRIPT}")
            print(f"   2. {SAVE_SCRIPT}")
            print(f"   3. cron_scheduler.py")
            sys.exit(1)
    
    # Check for .env file
    if not os.path.exists('.env'):
        print("⚠️ Warning: .env file not found")
        print("💡 Create a .env file with:")
        print("   META_ADS_ACCESS_TOKEN=your_token")
        print("   DATABASE_URL=your_database_url")
    
    main()