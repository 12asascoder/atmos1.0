import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
import jwt
# Add this import at the top
from unified_db import decode_jwt_token, handle_campaign_save, get_active_campaign

load_dotenv()

# Try to find .env file in parent directories
from pathlib import Path
env_path = Path(__file__).resolve().parent.parent.parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"Loaded .env from: {env_path}")
else:
    print(f"No .env found at: {env_path}")

app = Flask(__name__)

CORS(app)

url: str = os.environ.get("SUPABASE_URL")
# Use SERVICE_ROLE_KEY to bypass RLS for custom auth
key: str =  os.environ.get("SUPABASE_KEY")
SECRET_KEY = os.environ.get("SECRET_KEY")

# Debug: Check SECRET_KEY
if SECRET_KEY:
    print(f"SECRET_KEY loaded: {type(SECRET_KEY)} - Length: {len(SECRET_KEY)}")
    # Ensure SECRET_KEY is a string
    SECRET_KEY = str(SECRET_KEY).strip()
else:
    print("WARNING: SECRET_KEY not found in environment variables!")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Script location: {Path(__file__).resolve()}")
    print("\nPlease add SECRET_KEY to your .env file or set it as environment variable")
    print("The SECRET_KEY should match the one used in your auth.py file")
    raise ValueError("SECRET_KEY must be set in environment variables")

supabase: Client = create_client(url, key)

# In campaign_goal.py, update the campaign_goal() function:
# In campaign_goal.py, update the campaign_goal function:
@app.route('/api/campaign-goal', methods=['POST'])
def campaign_goal():
    try:
        data = request.get_json()
        goal = data.get('goal')
        token = data.get('user_id')
        
        if not goal:
            return jsonify({'error': 'Goal is required'}), 400
        
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 400
        
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
        
        # Use unified handler
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
                'campaign_goal': campaign['campaign_goal'],
                'campaign_status': campaign['campaign_status']
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

@app.route('/api/campaign-goal/<campaign_id>', methods=['PUT'])
def update_campaign_goal(campaign_id):
    try:
        data = request.get_json()
        goal = data.get('goal')
        token = data.get('user_id')  # JWT token
        
        if not goal:
            return jsonify({'error': 'Goal is required'}), 400
        
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 400
        
        # Ensure token is a string
        if not isinstance(token, str):
            return jsonify({'error': 'Token must be a string'}), 400
        
        token = token.strip()
        
        # Decode the JWT token to extract the real user_id
        try:
            secret_to_use = str(SECRET_KEY) if SECRET_KEY else None
            if not secret_to_use:
                return jsonify({'error': 'Server configuration error'}), 500
                
            payload = jwt.decode(token, secret_to_use, algorithms=["HS256"])
            user_id = payload.get('user_id')
            
            if not user_id:
                return jsonify({'error': 'Invalid token payload'}), 401
            
            # Ensure user_id is a string
            user_id = str(user_id)
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired. Please login again.'}), 401
        except jwt.InvalidTokenError as e:
            print(f"JWT decode error: {str(e)}")
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        except Exception as e:
            print(f"Token processing error: {str(e)}")
            return jsonify({'error': 'Failed to process token'}), 401
        
        # Validate goal
        valid_goals = ['awareness', 'consideration', 'conversions', 'retention']
        if goal not in valid_goals:
            return jsonify({'error': f'Invalid goal. Must be one of: {", ".join(valid_goals)}'}), 400
        
        # Update campaign - only if it belongs to the user (security)
        response = (
            supabase.table("auto_create")
            .update({"campaign_goal": goal})
            .eq("id", campaign_id)
            .eq("user_id", user_id)  # Security: only update user's own campaigns
            .execute()
        )
        
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

if __name__ == '__main__':
    app.run(debug=True, port=5005)