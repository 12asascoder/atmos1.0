"""
Main AdSurveillance server - runs all services
"""
import subprocess
import sys
import os
import signal
import time
from typing import List
from flask import Flask, jsonify
from flask_cors import CORS

# Get the absolute path of this script's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Add the parent directory to Python path for imports
sys.path.append(BASE_DIR)

from config import settings

# Create main Flask app for status dashboard
app = Flask(__name__)
CORS(app)

# List of all services to run - UPDATED PATHS
SERVICES = [
    {
        "name": "🔐 Authentication Service",
        "script": "api/auth.py",
        "port": settings.AUTH_PORT,
        "health_check": f"http://localhost:{settings.AUTH_PORT}/health",  # Add this
        "description": "Handles user login, registration, and JWT tokens",
        "endpoints": [
            "POST /login",
            "POST /sign-up",
            "POST  /complete-onboarding"
        ]
    },
  
    {
        "name": "📊 User Analytics Service",
        "script": "api/user_analytics.py",
        "port": settings.ANALYTICS_PORT,
        "health_check": f"http://localhost:{settings.AUTH_PORT}/health",  # Add th
        "description": "Provides user-specific analytics and charts",
        "endpoints": [
            "GET /api/analytics/summary",
            "GET /api/analytics/competitor-spend"
        ]
    },
    {
        "name": "📈 Daily Metrics Service", 
        "script": "api/daily_metrics.py",
        "port": settings.DAILY_METRICS_PORT,
        "health_check": f"http://localhost:{settings.AUTH_PORT}/health",  # Add th
        "description": "Handles daily metrics and summary data",
        "endpoints": [
            "POST /api/daily-metrics",
            "GET /api/summary-metrics"
        ]
    },
    {
        "name": "🏢 Competitors Service",
        "script": "api/competitors.py",
        "port": settings.COMPETITORS_PORT,
        "health_check": f"http://localhost:{settings.AUTH_PORT}/health",  # Add th
        "description": "Manages user competitors and tracking",
        "endpoints": [
            "GET /api/competitors",
            "POST /api/competitors",
            "DELETE /api/competitors/<id>"
        ]
    }
]

# Store running processes
processes = []

def start_service(service_config: dict):
    """Start a single service"""
    script_path = os.path.join(BASE_DIR, service_config["script"])
    
    print(f"🔍 Looking for script at: {script_path}")
    
    if not os.path.exists(script_path):
        print(f"❌ Script not found: {script_path}")
        print(f"   Current working directory: {os.getcwd()}")
        print(f"   Files in api directory: {os.listdir(os.path.join(BASE_DIR, 'api')) if os.path.exists(os.path.join(BASE_DIR, 'api')) else 'No api directory'}")
        return None
    
    # Build command
    cmd = [sys.executable, script_path]
    
    print(f"🚀 Starting {service_config['name']} on port {service_config['port']}...")
    
    # Start process
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    
    # Add process info
    process.service_name = service_config["name"]
    process.service_port = service_config["port"]
    
    # Start thread to read output
    import threading
    
    def read_output(proc, name):
        for line in iter(proc.stdout.readline, ''):
            if line:
                print(f"[{name}] {line.strip()}")
        # Read stderr as well
        for line in iter(proc.stderr.readline, ''):
            if line:
                print(f"[{name}-ERROR] {line.strip()}")
    
    threading.Thread(
        target=read_output,
        args=(process, service_config["name"][:10]),
        daemon=True
    ).start()
    
    # Wait longer to see if it starts successfully
    time.sleep(3)
    
    if process.poll() is None:
        print(f"✅ {service_config['name']} started successfully (PID: {process.pid})")
        return process
    else:
        print(f"❌ Failed to start {service_config['name']}")
        # Try to read error output
        try:
            stdout, stderr = process.communicate(timeout=1)
            if stderr:
                print(f"   Error output: {stderr[:200]}")
        except:
            pass
        return None

def start_all_services():
    """Start all AdSurveillance services"""
    global processes
    
    print("=" * 60)
    print("🚀 Starting AdSurveillance Backend Services")
    print("=" * 60)
    
    print(f"📁 Base directory: {BASE_DIR}")
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Check environment
    print("\n📋 Environment Check:")
    print(f"   Supabase URL: {'✅ Configured' if settings.SUPABASE_URL else '❌ Not configured'}")
    print(f"   Supabase Key: {'✅ Configured' if settings.SUPABASE_KEY else '❌ Not configured'}")
    print(f"   Secret Key: {'✅ Configured' if settings.SECRET_KEY else '❌ Not configured'}")
    
    # Check if api directory exists
    api_dir = os.path.join(BASE_DIR, 'api')
    if not os.path.exists(api_dir):
        print(f"\n❌ API directory not found at: {api_dir}")
        print("💡 Creating api directory and service files...")
        create_service_files()
    
    # Start each service
    print("\n🔧 Starting Services:")
    
    for service in SERVICES:
        process = start_service(service)
        if process:
            processes.append(process)
        else:
            print(f"   ⚠️  Could not start {service['name']}")
        time.sleep(1)  # Small delay between starts
    
    print("\n" + "=" * 60)
    print(f"📊 Started {len(processes)}/{len(SERVICES)} services")
    print(f"🌐 Dashboard: http://localhost:{settings.MAIN_PORT}")
    print("=" * 60)

def create_service_files():
    """Create the missing service files"""
    api_dir = os.path.join(BASE_DIR, 'api')
    os.makedirs(api_dir, exist_ok=True)
    
    # Create __init__.py
    with open(os.path.join(api_dir, '__init__.py'), 'w') as f:
        f.write('# API services package\n')
    
    print(f"✅ Created api directory at: {api_dir}")
    
    # You'll need to create the actual service files here
    # (I'll provide those files next)

def stop_all_services():
    """Stop all running services"""
    global processes
    
    print("\n🛑 Stopping all services...")
    
    for process in processes:
        if process and process.poll() is None:
            print(f"   Stopping {getattr(process, 'service_name', 'Unknown')}...")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
    
    processes.clear()
    print("✅ All services stopped")

# ... [rest of your Flask routes remain the same] ...

def signal_handler(signum, frame):
    """Handle Ctrl+C"""
    print("\n🛑 Received shutdown signal...")
    stop_all_services()
    sys.exit(0)

if __name__ == "__main__":
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start all services
        start_all_services()
        
        # Start the main Flask dashboard
        print(f"\n🌐 Starting main dashboard on port {settings.MAIN_PORT}...")
        app.run(
            debug=False,
            port=settings.MAIN_PORT,
            host='0.0.0.0',
            use_reloader=False
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        stop_all_services()