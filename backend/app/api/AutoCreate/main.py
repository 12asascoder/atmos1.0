"""
AutoCreate Campaign Module Main Server
"""
import subprocess
import sys
import os
import signal
import time
import socket
from flask import Flask, jsonify
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from config import settings

app = Flask(__name__)
CORS(app, origins=["*"])  # For development only

# AutoCreate Services
SERVICES = [
    {
        "name": "🎯 Audience Service",
        "script": "api/audience_step.py",
        "port": settings.AUDIENCE_PORT,
        "health_check": f"http://localhost:{settings.AUDIENCE_PORT}/",
        "description": "Handles audience targeting and insights",
        "endpoints": [
            "POST /api/audience/targeting",
            "GET /api/audience/targeting/<campaign_id>",
            "POST /api/audience/insights"
        ]
    },
    {
        "name": "💰 Budget Testing Service",
        "script": "api/budget_testing.py",
        "port": settings.BUDGET_TESTING_PORT,
        "health_check": f"http://localhost:{settings.BUDGET_TESTING_PORT}/",
        "description": "Handles budget configuration and testing",
        "endpoints": [
            "POST /api/budget-testing/save",
            "GET /api/budget-testing/<campaign_id>",
            "POST /api/budget-testing/projections"
        ]
    },
    {
        "name": "🎯 Campaign Goal Service",
        "script": "api/campaign_goal.py",
        "port": settings.CAMPAIGN_GOAL_PORT,
        "health_check": f"http://localhost:{settings.CAMPAIGN_GOAL_PORT}/",
        "description": "Handles campaign goal selection",
        "endpoints": [
            "POST /api/campaign-goal",
            "PUT /api/campaign-goal/<campaign_id>"
        ]
    },
    {
        "name": "✍️ Copy Messaging Service",
        "script": "api/copy_messaging.py",
        "port": settings.COPY_MESSAGING_PORT,
        "health_check": f"http://localhost:{settings.COPY_MESSAGING_PORT}/api/health",
        "description": "Generates and analyzes marketing copy using AI",
        "endpoints": [
            "POST /api/generate-copy",
            "POST /api/analyze-copy",
            "POST /api/save-campaign"
        ]
    }
]

processes = []

def is_port_available(port: int) -> bool:
    """Check if a port is available"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return True
        except socket.error:
            return False

def find_available_port(start_port: int) -> int:
    """Find an available port starting from start_port"""
    port = start_port
    while not is_port_available(port):
        port += 1
    return port

def start_service(service_config: dict):
    """Start a single service"""
    script_path = os.path.join(BASE_DIR, service_config["script"])
    
    print(f"🔍 Looking for script at: {script_path}")
    
    if not os.path.exists(script_path):
        print(f"❌ Script not found: {script_path}")
        print(f"   Current working directory: {os.getcwd()}")
        api_dir = os.path.join(BASE_DIR, 'api')
        if os.path.exists(api_dir):
            print(f"   Files in api directory: {os.listdir(api_dir)}")
        else:
            print("   No api directory found")
        
        # Create stub file if missing
        create_stub_file(service_config["script"], service_config["port"])
        script_path = os.path.join(BASE_DIR, service_config["script"])
    
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
    """Start all AutoCreate services"""
    global processes
    
    print("=" * 60)
    print("🚀 Starting AutoCreate Campaign Services")
    print("=" * 60)
    
    print(f"📁 Base directory: {BASE_DIR}")
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Check environment
    print("\n📋 Environment Check:")
    print(f"   Supabase URL: {'✅ Configured' if settings.SUPABASE_URL else '❌ Not configured'}")
    print(f"   Supabase Key: {'✅ Configured' if settings.SUPABASE_KEY else '❌ Not configured'}")
    print(f"   Secret Key: {'✅ Configured' if settings.SECRET_KEY else '❌ Not configured'}")
    print(f"   Groq API Key: {'✅ Configured' if settings.GROQ_API_KEY else '❌ Not configured'}")
    
    # Check if api directory exists
    api_dir = os.path.join(BASE_DIR, 'api')
    if not os.path.exists(api_dir):
        print(f"\n❌ API directory not found at: {api_dir}")
        print("💡 Creating api directory...")
        os.makedirs(api_dir, exist_ok=True)
        with open(os.path.join(api_dir, '__init__.py'), 'w') as f:
            f.write('# API services package\n')
        print(f"✅ Created api directory at: {api_dir}")
    
    # Check for required files
    print("\n📁 Checking service files:")
    for service in SERVICES:
        script_path = os.path.join(BASE_DIR, service["script"])
        if os.path.exists(script_path):
            # Check if it's a stub or actual code
            with open(script_path, 'r') as f:
                content = f.read()
                if 'stub service' in content:
                    print(f"   ⚠️  {service['name']}: {service['script']} (STUB)")
                else:
                    print(f"   ✅ {service['name']}: {service['script']} (ACTUAL CODE)")
        else:
            print(f"   ❌ {service['name']}: {service['script']} (NOT FOUND)")
            print(f"      Creating stub file...")
            create_stub_file(service["script"], service["port"])
    
    # Start each service
    print("\n🔧 Starting Services:")
    
    for service in SERVICES:
        process = start_service(service)
        if process:
            processes.append(process)
        else:
            print(f"   ⚠️  Could not start {service['name']}")
        time.sleep(2)  # Small delay between starts
    
    # Find available port for main dashboard
    main_port = settings.MAIN_PORT_2
    if not is_port_available(main_port):
        print(f"⚠️  Port {main_port} is in use, finding alternative...")
        main_port = find_available_port(main_port)
        print(f"✅ Using port {main_port} for main dashboard")
    
    print("\n" + "=" * 60)
    print(f"📊 Started {len(processes)}/{len(SERVICES)} services")
    print(f"🌐 Main dashboard: http://localhost:{main_port}")
    print("=" * 60)
    
    return main_port

def create_stub_file(script_path, port):
    """Create a stub service file if missing"""
    full_path = os.path.join(BASE_DIR, script_path)
    dir_name = os.path.dirname(full_path)
    
    # Create directory if needed
    os.makedirs(dir_name, exist_ok=True)
    
    # Create a simple Flask stub
    stub_content = f'''"""
Stub service for {os.path.basename(script_path)}
"""
from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def health_check():
    return jsonify({{
        'status': 'stub',
        'service': '{os.path.basename(script_path).replace(".py", "")}',
        'message': 'This is a stub service. Replace with actual implementation.',
        'port': {port}
    }}), 200

@app.route('/api/health')
def api_health():
    return jsonify({{
        'status': 'healthy',
        'service': '{os.path.basename(script_path).replace(".py", "")}'
    }}), 200

if __name__ == '__main__':
    print(f"🚀 Stub service for {os.path.basename(script_path)} starting...")
    print(f"📡 Running on port {port}")
    app.run(debug=True, port={port})
'''
    
    with open(full_path, 'w') as f:
        f.write(stub_content)
    
    print(f"      Created stub file at: {full_path}")

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

# Flask routes for main dashboard
@app.route('/')
def dashboard():
    """Main dashboard showing all services"""
    service_status = []
    
    for service in SERVICES:
        service_status.append({
            'name': service['name'],
            'port': service['port'],
            'description': service['description'],
            'health_url': service['health_check'],
            'endpoints': service['endpoints'],
            'script': service['script']
        })
    
    return jsonify({
        'name': 'AutoCreate Campaign Module',
        'version': '1.0.0',
        'status': 'running',
        'main_port': settings.MAIN_PORT_2,
        'services': service_status,
        'environment': {
            'supabase_configured': bool(settings.SUPABASE_URL),
            'groq_configured': bool(settings.GROQ_API_KEY),
            'total_services': len(SERVICES),
            'running_services': len(processes)
        }
    })

@app.route('/health')
def health():
    """Health check endpoint for main server"""
    return jsonify({
        'status': 'healthy',
        'server': 'autocreate-main',
        'port': settings.MAIN_PORT_2,
        'running_services': len(processes)
    })

@app.route('/services/status')
def services_status():
    """Get detailed status of all services"""
    status_list = []
    
    for process in processes:
        if process.poll() is None:
            status = 'running'
        else:
            status = 'stopped'
        
        status_list.append({
            'name': getattr(process, 'service_name', 'Unknown'),
            'pid': process.pid,
            'status': status,
            'port': getattr(process, 'service_port', 'Unknown')
        })
    
    return jsonify({
        'total_services': len(SERVICES),
        'running_services': len([p for p in processes if p.poll() is None]),
        'services': status_list
    })

@app.route('/services/restart', methods=['POST'])
def restart_services():
    """Restart all services"""
    stop_all_services()
    actual_main_port = start_all_services()
    
    return jsonify({
        'success': True,
        'message': 'Services restarted',
        'running_services': len(processes),
        'main_port': actual_main_port
    })

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
        actual_main_port = start_all_services()
        
        # Start the main Flask dashboard
        print(f"\n🌐 Starting main dashboard on port {actual_main_port}...")
        app.run(
            debug=False,
            port=actual_main_port,
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