"""
Ads Fetching Service - Python wrapper for Node.js ads fetching module
Port: 5004
"""

import os
import sys
import json
import uuid
import subprocess
import threading
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["*"], supports_credentials=True)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
JWT_SECRET = os.getenv('SECRET_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Store active jobs in memory (in production, use Redis)
active_jobs = {}

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

def verify_jwt(token):
    """Verify JWT token and extract user ID"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_auth_token():
    """Extract token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None

def run_ads_fetch(user_id):
    """Run Node.js ads fetching module as subprocess"""
    try:
        # Get path to Node.js module
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        node_module_dir = os.path.join(base_dir, 'src')
        
        # Create job record
        job_id = str(uuid.uuid4())
        
        job_data = {
            'id': job_id,
            'user_id': user_id,
            'status': 'processing',
            'started_at': datetime.now().isoformat(),
            'platform': 'all'
        }
        
        supabase.table('ads_fetch_jobs').insert(job_data).execute()
        
        # Store job in memory
        active_jobs[job_id] = {
            'user_id': user_id,
            'status': 'processing',
            'started_at': datetime.now(),
            'process': None
        }
        
        # Change to Node.js module directory
        original_dir = os.getcwd()
        os.chdir(node_module_dir)
        
        # Install dependencies if needed
        if not os.path.exists('node_modules'):
            print("Installing Node.js dependencies...")
            subprocess.run(['npm', 'install'], capture_output=True, text=True)
        
        # Build TypeScript if needed
        if not os.path.exists('dist'):
            print("Building TypeScript...")
            subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
        
        # Run ads fetching
        print(f"Starting ads fetch for user {user_id}...")
        
        # Run the fetch command
        env = os.environ.copy()
        env['USER_ID'] = user_id
        
        process = subprocess.Popen(
            ['node', 'dist/index.js', f'--user-id={user_id}'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env
        )
        
        # Store process reference
        active_jobs[job_id]['process'] = process
        
        # Read output in background thread
        def read_output():
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[Node.js] {line.strip()}")
            process.stdout.close()
        
        thread = threading.Thread(target=read_output, daemon=True)
        thread.start()
        
        # Wait for process completion in background
        def wait_for_completion():
            return_code = process.wait()
            
            # Update job status
            if return_code == 0:
                status = 'completed'
                error_msg = None
            else:
                status = 'failed'
                error_output = process.stderr.read()
                error_msg = error_output[:500]  # Limit error message length
            
            update_data = {
                'status': status,
                'completed_at': datetime.now().isoformat(),
                'error_message': error_msg
            }
            
            supabase.table('ads_fetch_jobs').update(update_data).eq('id', job_id).execute()
            
            # Update job in memory
            active_jobs[job_id]['status'] = status
            active_jobs[job_id]['completed_at'] = datetime.now()
            
            print(f"Ads fetch job {job_id} completed with status: {status}")
        
        completion_thread = threading.Thread(target=wait_for_completion, daemon=True)
        completion_thread.start()
        
        # Return to original directory
        os.chdir(original_dir)
        
        return job_id
        
    except Exception as e:
        print(f"Error running ads fetch: {str(e)}")
        return None

@app.route('/api/refresh-ads', methods=['POST'])
def refresh_ads():
    """Start ads refresh for the authenticated user"""
    # Verify authentication
    token = get_auth_token()
    if not token:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = verify_jwt(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Check if user already has an active job
    for job_id, job_info in active_jobs.items():
        if job_info['user_id'] == user_id and job_info['status'] == 'processing':
            return jsonify({
                'message': 'Ads refresh is already in progress',
                'job_id': job_id,
                'status': 'processing'
            }), 200
    
    # Start new ads fetch
    job_id = run_ads_fetch(user_id)
    
    if job_id:
        return jsonify({
            'message': 'Ads refresh started successfully',
            'job_id': job_id,
            'status': 'processing'
        }), 202
    else:
        return jsonify({'error': 'Failed to start ads refresh'}), 500

@app.route('/api/refresh-status/<job_id>', methods=['GET'])
def refresh_status(job_id):
    """Get status of a refresh job"""
    # Verify authentication
    token = get_auth_token()
    if not token:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = verify_jwt(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Check in-memory jobs first
    if job_id in active_jobs:
        job_info = active_jobs[job_id]
        return jsonify({
            'job_id': job_id,
            'status': job_info['status'],
            'started_at': job_info['started_at'].isoformat() if job_info['started_at'] else None,
            'completed_at': job_info.get('completed_at').isoformat() if job_info.get('completed_at') else None
        })
    
    # Check database
    try:
        response = supabase.table('ads_fetch_jobs').select('*').eq('id', job_id).eq('user_id', user_id).execute()
        
        if response.data:
            job = response.data[0]
            return jsonify({
                'job_id': job['id'],
                'status': job['status'],
                'started_at': job['started_at'],
                'completed_at': job['completed_at'],
                'competitors_count': job['competitors_count'],
                'ads_fetched': job['ads_fetched'],
                'error_message': job['error_message']
            })
        else:
            return jsonify({'error': 'Job not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user-jobs', methods=['GET'])
def user_jobs():
    """Get all refresh jobs for the authenticated user"""
    # Verify authentication
    token = get_auth_token()
    if not token:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = verify_jwt(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    try:
        response = supabase.table('ads_fetch_jobs') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('created_at', desc=True) \
            .limit(10) \
            .execute()
        
        return jsonify({'jobs': response.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ads_fetching',
        'timestamp': datetime.now().isoformat(),
        'active_jobs': len([j for j in active_jobs.values() if j['status'] == 'processing'])
    })

@app.route('/api/cancel-job/<job_id>', methods=['POST'])
def cancel_job(job_id):
    """Cancel a running job"""
    # Verify authentication
    token = get_auth_token()
    if not token:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = verify_jwt(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Check if job exists and belongs to user
    if job_id in active_jobs:
        job_info = active_jobs[job_id]
        
        if job_info['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Terminate process if running
        if job_info['process']:
            job_info['process'].terminate()
        
        # Update status
        job_info['status'] = 'cancelled'
        job_info['completed_at'] = datetime.now()
        
        # Update database
        supabase.table('ads_fetch_jobs').update({
            'status': 'cancelled',
            'completed_at': datetime.now().isoformat()
        }).eq('id', job_id).execute()
        
        return jsonify({'message': 'Job cancelled successfully'})
    
    return jsonify({'error': 'Job not found'}), 404

if __name__ == '__main__':
    port = int(os.getenv('ADS_FETCHING_PORT', 5004))
    print(f"🚀 Ads Fetching Service starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)