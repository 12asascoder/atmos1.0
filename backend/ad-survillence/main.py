"""
AdSurveillance Main Orchestrator - Updated to include Ads Fetching Service
"""

import subprocess
import sys
import os
import time
from datetime import datetime

def run_service(name, path, env_vars=None):
    """Start a service in a subprocess"""
    print(f"\n{'='*60}")
    print(f"🚀 Starting {name}")
    print(f"{'='*60}")
    
    env = os.environ.copy()
    if env_vars:
        env.update(env_vars)
    
    cmd = [sys.executable, path]
    process = subprocess.Popen(
        cmd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE, 
        text=True,
        env=env
    )
    
    # Print output in real-time
    import threading
    
    def read_output(stream, prefix):
        for line in iter(stream.readline, ''):
            if line.strip():
                timestamp = datetime.now().strftime("%H:%M:%S")
                print(f"[{timestamp}][{prefix}] {line.strip()}")
    
    threading.Thread(target=read_output, args=(process.stdout, name), daemon=True).start()
    threading.Thread(target=read_output, args=(process.stderr, f"{name}_ERROR"), daemon=True).start()
    
    return process

def main():
    """Main orchestrator function"""
    processes = []
    
    try:
        print("\n" + "="*60)
        print("🎯 AdSurveillance System Startup")
        print("="*60)
        
        # Get base directory
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Service configurations
        services = [
            {
                "name": "Auth Service",
                "path": os.path.join(base_dir, "api", "auth.py"),
                "port": 5003
            },
            {
                "name": "Ads Fetching Service",  # NEW SERVICE
                "path": os.path.join(base_dir, "api", "ads_fetching.py"),
                "port": 5004
            },
            {
                "name": "User Analytics Service",
                "path": os.path.join(base_dir, "api", "user_analytics.py"),
                "port": 5007
            },
            {
                "name": "Daily Metrics Service",
                "path": os.path.join(base_dir, "api", "daily_metrics.py"),
                "port": 5008
            },
            {
                "name": "Competitors Service",
                "path": os.path.join(base_dir, "api", "competitors.py"),
                "port": 5009
            },
            {
                "name": "Targeting Intel Service",
                "path": os.path.join(base_dir, "api", "targeting_intel.py"),
                "port": 5011
            }
        ]
        
        # Start all services
        for service in services:
            env_vars = {
                "FLASK_ENV": "development",
                "FLASK_DEBUG": "1"
            }
            process = run_service(service["name"], service["path"], env_vars)
            processes.append((service["name"], process, service["port"]))
            time.sleep(2)  # Stagger startup
        
        # Display dashboard
        print("\n" + "="*60)
        print("✅ All Services Started Successfully!")
        print("="*60)
        print("\n📊 Service Dashboard:")
        print("-" * 60)
        
        for name, _, port in processes:
            status = "✅ RUNNING"
            print(f"{name:<25} | Port: {port:<6} | Status: {status}")
        
        print("-" * 60)
        print("\n🔗 Quick Access Links:")
        print(f"• Main Dashboard:    http://localhost:{os.getenv('MAIN_PORT_1', 5010)}")
        print(f"• Auth Service:      http://localhost:5003")
        print(f"• Ads Fetching:      http://localhost:5004")  # NEW
        print(f"• Analytics:         http://localhost:5007")
        print(f"• Competitors:       http://localhost:5009")
        print(f"• Targeting Intel:   http://localhost:5011")
        print("\n🔄 Ads Refresh Endpoint: POST http://localhost:5004/api/refresh-ads")
        print("📊 Check Status: GET http://localhost:5004/api/refresh-status/<job_id>")
        print("\n" + "="*60)
        print("Press Ctrl+C to stop all services...")
        print("="*60)
        
        # Keep main process alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("🛑 Stopping all services...")
        print("="*60)
        
        for name, process, _ in processes:
            print(f"Stopping {name}...")
            process.terminate()
            process.wait(timeout=5)
        
        print("\n✅ All services stopped successfully")
        print("="*60)

if __name__ == "__main__":
    main()