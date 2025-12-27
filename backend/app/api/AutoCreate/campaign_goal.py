"""
Campaign Goal Service
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
import jwt

load_dotenv()

app = Flask(__name__)

# Enable CORS for all routes and origins during development
CORS(app, origins=["*"], supports_credentials=True)

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
SECRET_KEY = os.environ.get("SECRET_KEY")

# Debug: Check SECRET_KEY
if SECRET_KEY:
    print(f"SECRET_KEY loaded: {type(SECRET_KEY)} - Length: {len(SECRET_KEY)}")
    # Ensure SECRET_KEY is a string
    SECRET_KEY = str(SECRET_KEY).strip()
else:
    print("WARNING: SECRET_KEY not found in environment variables!")
    print(f"Current working directory: {os.getcwd()}")
    print("\nPlease add SECRET_KEY to your .env file or set it as environment variable")
    SECRET_KEY = "fallback-secret-key-for-development-only"

supabase: Client = create_client(url, key) if url and key else None

def decode_jwt_token(token):
    """Decode JWT token to get user_id"""
    try:
        # Ensure token is a string
        if not isinstance(token, str):
            token = str(token) if token else ''
        
        token = token.strip()
        
        if not token:
            raise ValueError("Empty token")
        
        # Decode the token manually
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        
        if not user_id:
            raise ValueError("No user_id in token payload")
        
        return str(user_id)
        
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired. Please login again.")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")
    except Exception as e:
        raise ValueError(f"Failed to decode token: {str(e)}")

def handle_campaign_save(supabase_client, user_id, data, campaign_id=None):
    """
    Unified function to save campaign data
    Returns: {'success': bool, 'campaign_id': str, 'error': str}
    """
    if not supabase_client:
        return {'success': False, 'error': 'Supabase client not initialized'}
    
    try:
        if campaign_id:
            # Update existing campaign
            data['user_id'] = user_id
            
            response = supabase_client.table('auto_create').update(data).eq('id', campaign_id).eq('user_id', user_id).execute()
            
            if not response.data:
                return {'success': False, 'error': 'Campaign not found or access denied'}
            
            return {'success': True, 'campaign_id': campaign_id}
        else:
            # Create new campaign
            import uuid
            new_campaign_id = str(uuid.uuid4())
            
            campaign_data = {
                'id': new_campaign_id,
                'user_id': user_id,
                'campaign_status': 'draft',
                **data
            }
            
            # Add default values if missing
            if 'budget_amount' not in campaign_data:
                campaign_data['budget_amount'] = 0
            if 'campaign_duration' not in campaign_data:
                campaign_data['campaign_duration'] = 30
            
            response = supabase_client.table('auto_create').insert(campaign_data).execute()
            
            if not response.data:
                return {'success': False, 'error': 'Failed to create campaign'}
            
            return {'success': True, 'campaign_id': new_campaign_id}
            
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_active_campaign(supabase_client, user_id, campaign_id):
    """
    Get campaign data by ID
    Returns: {'success': bool, 'campaign': dict, 'error': str}
    """
    if not supabase_client:
        return {'success': False, 'error': 'Supabase client not initialized'}
    
    try:
        response = supabase_client.table('auto_create').select('*').eq('id', campaign_id).eq('user_id', user_id).execute()
        
        if not response.data:
            return {'success': False, 'error': 'Campaign not found'}
        
        return {'success': True, 'campaign': response.data[0]}
    except Exception as e:
        return {'success': False, 'error': str(e)}

@app.route('/api/campaign-goal', methods=['POST', 'OPTIONS'])
def campaign_goal():
    """Handle campaign goal creation/update"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        goal = data.get('goal')
        token = data.get('user_id')  # This should be the JWT token
        
        if not goal:
            return jsonify({'error': 'Goal is required'}), 400
        
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 401
        
        # Decode JWT token
        try:
            current_user = decode_jwt_token(token)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        # Validate goal
        valid_goals = ['awareness', 'consideration', 'conversions', 'retention']
        if goal not in valid_goals:
            return jsonify({'error': f'Invalid goal. Must be one of: {", ".join(valid_goals)}'}), 400
        
        # Get campaign_id if provided
        campaign_id = data.get('campaign_id')
        
        # Use handler to save
        save_result = handle_campaign_save(supabase, current_user, {'campaign_goal': goal}, campaign_id)
        
        if not save_result['success']:
            return jsonify({'error': save_result.get('error', 'Failed to save goal')}), 500
        
        # Get the saved campaign data
        campaign_result = get_active_campaign(supabase, current_user, save_result['campaign_id'])
        
        if not campaign_result['success'] or not campaign_result['campaign']:
            return jsonify({'error': 'Failed to retrieve saved campaign'}), 500
        
        campaign = campaign_result['campaign']
        
        return jsonify({
            'success': True,
            'message': 'Goal saved successfully',
            'data': {
                'campaign_goal': campaign.get('campaign_goal'),
                'campaign_status': campaign.get('campaign_status', 'draft')
            },
            'campaign_id': save_result['campaign_id']
        }), 200
        
    except Exception as e:
        print(f"Error saving goal: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/campaign-goal/<campaign_id>', methods=['PUT', 'OPTIONS'])
def update_campaign_goal(campaign_id):
    """Update campaign goal"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'PUT,OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        goal = data.get('goal')
        token = data.get('user_id')  # JWT token
        
        if not goal:
            return jsonify({'error': 'Goal is required'}), 400
        
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 401
        
        # Decode JWT token
        try:
            current_user = decode_jwt_token(token)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        # Validate goal
        valid_goals = ['awareness', 'consideration', 'conversions', 'retention']
        if goal not in valid_goals:
            return jsonify({'error': f'Invalid goal. Must be one of: {", ".join(valid_goals)}'}), 400
        
        # Update campaign
        response = supabase.table("auto_create").update({"campaign_goal": goal}).eq("id", campaign_id).eq("user_id", current_user).execute()
        
        if not response.data:
            return jsonify({
                'success': False,
                'error': 'Campaign not found or you do not have permission to update it'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Goal updated successfully',
            'data': response.data[0]
        }), 200
        
    except Exception as e:
        print(f"Error updating goal: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'campaign-goal',
        'port': 5005,
        'supabase_configured': bool(supabase)
    }), 200

@app.route('/', methods=['GET'])
def home():
    """Service home page"""
    return jsonify({
        'service': 'campaign-goal-api',
        'version': '1.0.0',
        'endpoints': [
            'POST /api/campaign-goal',
            'PUT /api/campaign-goal/<campaign_id>',
            'GET /health'
        ]
    }), 200

if __name__ == '__main__':
    print("🚀 Campaign Goal Service starting...")
    print(f"📡 Running on port 5005")
    print(f"🔑 SECRET_KEY configured: {bool(SECRET_KEY)}")
    print(f"🌐 Supabase configured: {bool(supabase)}")
    print("📋 Available endpoints:")
    print("   POST /api/campaign-goal - Set campaign goal")
    print("   PUT  /api/campaign-goal/<campaign_id> - Update campaign goal")
    print("   GET  /health - Health check")
    app.run(debug=True, port=5005, host='0.0.0.0')