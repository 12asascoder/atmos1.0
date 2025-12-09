from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import datetime
import jwt
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load secret key from environment or generate one
SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_urlsafe(32)

# Initialize Supabase client
supabase: Client = create_client(
    os.environ.get('SUPABASE_URL'),
    os.environ.get('SUPABASE_KEY')
)

@app.route('/sign-up', methods=['POST'])
def signup():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': "No data provided"
            }), 400
        
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        confirm_password = data.get("confirmPassword")  # Changed from "confirm-password"

        # Validate all fields are present
        if not name or not email or not password or not confirm_password:
            return jsonify({
                'success': False,
                'error': 'Fill all the details before proceeding'
            }), 400
        
        # Validate password match
        if password != confirm_password:
            return jsonify({
                'success': False,
                'error': 'Passwords do not match'
            }), 400
        
        # Validate password length
        if len(password) < 8:
            return jsonify({
                'success': False,
                'error': 'Password must be at least 8 characters long'
            }), 400
        
        # Convert email to lowercase for consistency
        email = email.lower().strip()
        
        # Check if user already exists
        existing_user = (
            supabase.table('users')
            .select('*')
            .eq("email", email)
            .execute()
        )

        if existing_user.data:
            return jsonify({
                'success': False,
                'error': 'Email already exists'
            }), 409  # 409 Conflict status code
        
        # Hash the password
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        # Insert new user into database
        # Note: Column name is password_hash not password
        response = (
            supabase.table("users")
            .insert({
                "name": name,
                "email": email,
                "password_hash": hashed_password  # Changed from "password" to "password_hash"
            })
            .execute()
        )

        if response.data:
            user_data = response.data[0]

            # Create JWT token with user_id (not id)
            token = jwt.encode(
                {
                    'user_id': user_data['user_id'],  # Changed from 'id' to 'user_id'
                    'email': user_data['email'],
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
                },
                SECRET_KEY,
                algorithm="HS256"
            )
            
            return jsonify({
                'success': True,
                'message': "Account Created Successfully",
                'token': token,
                'user': {
                    'user_id': user_data['user_id'],  # Changed from 'id'
                    'name': user_data['name'],
                    'email': user_data['email']
                }
            }), 201
        else:
            raise Exception("Failed to create user")

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': "Invalid Data Format"
        }), 400

    except KeyError as e:
        return jsonify({
            'success': False,
            'error': f'Missing key: {str(e)}'
        }), 400
        
    except Exception as e:
        print(f"Error in signup: {str(e)}")  # Log for debugging
        import traceback
        traceback.print_exc()  # Print full traceback for debugging
        return jsonify({
            'success': False,
            'error': 'An internal server error occurred'
        }), 500


@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': "No data provided"
            }), 400
        
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Convert email to lowercase
        email = email.lower().strip()
        
        # Find user by email
        user_response = (
            supabase.table('users')
            .select('*')
            .eq("email", email)
            .execute()
        )

        if not user_response.data:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        user_data = user_response.data[0]
        
        # Check if account is active
        if not user_data.get('is_active', True):
            return jsonify({
                'success': False,
                'error': 'Account has been deactivated'
            }), 403
        
        # Verify password
        if not check_password_hash(user_data['password_hash'], password):
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Update last_login timestamp
        supabase.table('users').update({
            'last_login': datetime.datetime.utcnow().isoformat()
        }).eq('user_id', user_data['user_id']).execute()
        
        # Create JWT token
        token = jwt.encode(
            {
                'user_id': user_data['user_id'],
                'email': user_data['email'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            },
            SECRET_KEY,
            algorithm="HS256"
        )
        
        return jsonify({
            'success': True,
            'message': "Login successful",
            'token': token,
            'user': {
                'user_id': user_data['user_id'],
                'name': user_data['name'],
                'email': user_data['email']
            }
        }), 200

    except Exception as e:
        print(f"Error in login: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'An internal server error occurred'
        }), 500


if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"Supabase URL configured: {bool(os.environ.get('SUPABASE_URL'))}")
    print(f"Supabase Key configured: {bool(os.environ.get('SUPABASE_KEY'))}")
    app.run(debug=True, port=5003, host='0.0.0.0')