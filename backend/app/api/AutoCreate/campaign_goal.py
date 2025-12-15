import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
import jwt

load_dotenv()
app = Flask(__name__)

CORS(app)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
SECRET_KEY = os.environ.get("SECRET_KEY")  # Remove type hint

# Debug: Check SECRET_KEY
if SECRET_KEY:
    print(f"SECRET_KEY loaded: {type(SECRET_KEY)} - Length: {len(SECRET_KEY)}")
    # Ensure SECRET_KEY is a string
    SECRET_KEY = str(SECRET_KEY).strip()
else:
    print("WARNING: SECRET_KEY not found in environment variables!")
    raise ValueError("SECRET_KEY must be set in environment variables")

supabase: Client = create_client(url, key)

@app.route('/api/campaign-goal', methods=['POST'])
def campaign_goal():
    try:
        data = request.get_json()
        goal = data.get('goal')
        token = data.get('user_id')  # This is actually the JWT token from localStorage
        
        if not goal:
            return jsonify({'error': 'Goal is required'}), 400
        
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 400
        
        # Ensure token is a string
        if not isinstance(token, str):
            print(f"Token type issue: received {type(token)}, value: {token}")
            return jsonify({'error': 'Token must be a string'}), 400
        
        # Strip any whitespace
        token = token.strip()
        print(f"Token length: {len(token)}")
        print(f"Token starts with: {token[:10]}...")
        
        # Decode the JWT token to extract the real user_id
        try:
            # Ensure SECRET_KEY is a string (defensive coding)
            secret_to_use = str(SECRET_KEY) if SECRET_KEY else None
            if not secret_to_use:
                return jsonify({'error': 'Server configuration error - SECRET_KEY missing'}), 500
            
            print(f"SECRET_KEY type: {type(secret_to_use)}, length: {len(secret_to_use)}")
            
            payload = jwt.decode(token, secret_to_use, algorithms=["HS256"])
            user_id = payload.get('user_id')
            
            if not user_id:
                return jsonify({'error': 'Invalid token payload - user_id not found'}), 401
            
            # Ensure user_id is a string (UUID format)
            user_id = str(user_id)
            print(f"Successfully decoded token. User ID: {user_id}")
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired. Please login again.'}), 401
        except jwt.InvalidTokenError as e:
            print(f"JWT decode error: {str(e)}")
            print(f"Error type: {type(e)}")
            print(f"Token received (first 30 chars): {token[:30]}...")
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        except TypeError as e:
            print(f"TypeError during JWT decode: {str(e)}")
            print(f"SECRET_KEY type: {type(SECRET_KEY)}")
            print(f"Token type: {type(token)}")
            return jsonify({'error': f'Type error during token validation: {str(e)}'}), 500
        except Exception as e:
            print(f"Token processing error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            print(f"Token type: {type(token)}")
            print(f"SECRET_KEY type: {type(SECRET_KEY)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Failed to process token: {str(e)}'}), 401
        
        # Validate goal
        valid_goals = ['awareness', 'consideration', 'conversions', 'retention']
        if goal not in valid_goals:
            return jsonify({'error': f'Invalid goal. Must be one of: {", ".join(valid_goals)}'}), 400
        
        # Insert goal into auto_create table
        response = (
            supabase.table("auto_create")
            .insert({
                "user_id": user_id,  # Use the decoded UUID from token
                "campaign_goal": goal,
                "campaign_status": "draft",
                "budget_amount": 0.00,  # Numeric value
                "campaign_duration": 1  # Integer value
            })
            .execute()
        )
        
        return jsonify({
            'success': True,
            'message': 'Goal saved successfully',
            'data': response.data[0],
            'campaign_id': response.data[0]['id']
        }), 201
        
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