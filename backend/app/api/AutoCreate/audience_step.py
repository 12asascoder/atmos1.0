# audience_step.py
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import os
from dotenv import load_dotenv
import jwt

# Try to import supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("Warning: supabase package not installed. Using mock data.")

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure CORS properly
CORS(
    app,
    origins=["http://localhost:5173/"],
    allow_headers=["Content-Type", "Authorization"]
)

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

# Get JWT secret for manual decoding
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

# Supabase Configuration
if SUPABASE_AVAILABLE and os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_KEY'):
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    app.config['SUPABASE'] = supabase
    print("✓ Supabase client initialized")
else:
    # Mock supabase for development
    class MockSupabase:
        def __init__(self):
            self.mock_campaigns = {}
            print("⚠ Using mock Supabase client (for development only)")
        
        def table(self, table_name):
            return MockTable(table_name, self.mock_campaigns)
    
    class MockTable:
        def __init__(self, name, mock_data):
            self.name = name
            self.mock_data = mock_data
        
        def select(self, *args):
            return MockQuery(self.mock_data, 'select')
        
        def insert(self, data):
            return MockQuery(self.mock_data, 'insert', data)
        
        def update(self, data):
            return MockQuery(self.mock_data, 'update', data)
        
        def eq(self, key, value):
            return self
    
    class MockQuery:
        def __init__(self, mock_data, operation, data=None):
            self.mock_data = mock_data
            self.operation = operation
            self.data = data
        
        def eq(self, key, value):
            return self
        
        def execute(self):
            if self.operation == 'select':
                return type('obj', (object,), {'data': [{
                    'demographics': ['male', 'female'],
                    'age_range_min': 25,
                    'age_range_max': 45,
                    'selected_interests': [{'id': 'fitness', 'label': 'Fitness'}],
                    'target_locations': [{'name': 'United States', 'code': 'US'}],
                    'campaign_status': 'draft'
                }]})
            elif self.operation == 'insert':
                import uuid
                campaign_id = str(uuid.uuid4())
                self.mock_data[campaign_id] = self.data
                return type('obj', (object,), {'data': [{'id': campaign_id}]})
            elif self.operation == 'update':
                return type('obj', (object,), {'data': [{'id': 'mock-campaign-id'}]})
    
    supabase = MockSupabase()
    app.config['SUPABASE'] = supabase

# Create blueprint for audience routes
audience_bp = Blueprint('audience', __name__)

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

# In audience_backend.py, update the save_audience_targeting() function:
@audience_bp.route('/api/audience/targeting', methods=['POST', 'OPTIONS'])
def save_audience_targeting():
    """Save audience targeting data to Supabase"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['demographics', 'age_range_min', 'age_range_max', 
                          'selected_interests', 'target_locations', 'user_id']
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Decode JWT token
        token = data['user_id']
        try:
            current_user = decode_jwt_token(token)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        # Validate age range
        age_min = data['age_range_min']
        age_max = data['age_range_max']
        
        if not (18 <= age_min <= 65):
            return jsonify({'error': 'age_range_min must be between 18 and 65'}), 400
        if not (18 <= age_max <= 65):
            return jsonify({'error': 'age_range_max must be between 18 and 65'}), 400
        if age_max < age_min:
            return jsonify({'error': 'age_range_max must be greater than or equal to age_range_min'}), 400
        
        # Validate lists
        demographics = data['demographics']
        if not isinstance(demographics, list):
            return jsonify({'error': 'demographics must be a list'}), 400
        
        selected_interests = data['selected_interests']
        if not isinstance(selected_interests, list):
            return jsonify({'error': 'selected_interests must be a list'}), 400
        
        target_locations = data['target_locations']
        if not isinstance(target_locations, list):
            return jsonify({'error': 'target_locations must be a list'}), 400
        
        # Prepare data
        audience_data = {
            'demographics': demographics,
            'age_range_min': age_min,
            'age_range_max': age_max,
            'selected_interests': selected_interests,
            'target_locations': target_locations
        }
        
        # Get campaign_id if provided
        campaign_id = data.get('campaign_id')
        
        # Use unified handler (you need to implement or import this)
        # For now, let's create a simple version
        try:
            if campaign_id:
                # Update existing
                response = supabase.table('auto_create').update(audience_data).eq('id', campaign_id).eq('user_id', current_user).execute()
                save_result = {'success': True, 'campaign_id': campaign_id}
            else:
                # Create new
                import uuid
                new_campaign_id = str(uuid.uuid4())
                campaign_data = {
                    'id': new_campaign_id,
                    'user_id': current_user,
                    'campaign_status': 'draft',
                    **audience_data
                }
                response = supabase.table('auto_create').insert(campaign_data).execute()
                save_result = {'success': True, 'campaign_id': new_campaign_id}
        except Exception as e:
            save_result = {'success': False, 'error': str(e)}
        
        if not save_result['success']:
            return jsonify({'error': save_result.get('error', 'Failed to save audience data')}), 500
        
        return jsonify({
            'success': True,
            'message': 'Audience targeting saved successfully',
            'campaign_id': save_result['campaign_id']
        }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add OPTIONS to all other routes as well...
@audience_bp.route('/api/audience/targeting/<campaign_id>', methods=['GET', 'OPTIONS'])
def get_audience_targeting(campaign_id):
    """Get audience targeting data for a specific campaign"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    
    try:
        token = request.args.get('token') or request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode JWT token to get actual user_id
        try:
            current_user = decode_jwt_token(token)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        supabase = app.config['SUPABASE']
        
        response = supabase.table('auto_create').select(
            'demographics, age_range_min, age_range_max, selected_interests, target_locations, campaign_status, campaign_goal'
        ).eq('id', campaign_id).eq('user_id', current_user).execute()
        
        if not response.data:
            return jsonify({'error': 'Campaign not found or access denied'}), 404
        
        campaign = response.data[0]
        
        # Format the response
        formatted_response = {
            'demographics': campaign['demographics'] or [],
            'age_range_min': campaign['age_range_min'],
            'age_range_max': campaign['age_range_max'],
            'selected_interests': campaign['selected_interests'] or [],
            'target_locations': campaign['target_locations'] or [],
            'campaign_status': campaign['campaign_status'],
            'campaign_goal': campaign.get('campaign_goal')
        }
        
        return jsonify(formatted_response), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audience_bp.route('/api/audience/insights', methods=['POST', 'OPTIONS'])
def get_audience_insights():
    """Get AI-powered audience insights based on targeting"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        
        # Extract targeting data
        demographics = data.get('demographics', [])
        age_min = data.get('age_range_min', 25)
        age_max = data.get('age_range_max', 45)
        selected_interests = data.get('selected_interests', [])
        target_locations = data.get('target_locations', [])
        
        # Calculate estimated audience size (simulated AI logic)
        base_audience = 1000000  # 1M base
        
        # Adjust based on demographics
        if 'all' in demographics:
            demographic_multiplier = 1.0
        elif len(demographics) == 1:
            demographic_multiplier = 0.45
        else:
            demographic_multiplier = len(demographics) * 0.3
        
        # Adjust based on age range
        age_range = age_max - age_min
        if age_range <= 10:
            age_multiplier = 0.6
        elif age_range <= 20:
            age_multiplier = 0.8
        else:
            age_multiplier = 1.0
        
        # Adjust based on interests
        interest_multiplier = 0.5 + (len(selected_interests) * 0.1)
        
        # Adjust based on locations
        location_multiplier = len(target_locations) * 0.2 if target_locations else 0.1
        
        # Calculate estimated audience
        estimated_audience = int(base_audience * demographic_multiplier * 
                                age_multiplier * interest_multiplier * location_multiplier)
        
        # Format number with commas
        formatted_audience = f"{estimated_audience:,}"
        
        # Calculate engagement multiplier (simulated AI)
        engagement_multiplier = 1.8
        interest_ids = [interest.get('id') for interest in selected_interests]
        
        if 'fitness' in interest_ids:
            engagement_multiplier = 2.3
        elif 'running' in interest_ids:
            engagement_multiplier = 2.1
        elif 'sports' in interest_ids:
            engagement_multiplier = 2.0
        
        # Determine peak activity times
        if age_min < 30:
            peak_activity = "8-11 PM"
            device_preference = "85% Mobile"
        elif age_min < 40:
            peak_activity = "7-9 PM"
            device_preference = "75% Mobile, 25% Desktop"
        else:
            peak_activity = "6-8 PM"
            device_preference = "60% Mobile, 40% Desktop"
        
        # Calculate average age
        avg_age = (age_min + age_max) // 2
        
        return jsonify({
            'success': True,
            'insights': {
                'estimated_audience': formatted_audience,
                'engagement_multiplier': engagement_multiplier,
                'average_age': avg_age,
                'peak_activity': peak_activity,
                'device_preference': device_preference,
                'audience_size': estimated_audience,
                'demographic_breakdown': {
                    'gender_distribution': '45% Male, 55% Female' if 'all' in demographics else 'Custom',
                    'age_distribution': f'{age_min}-{age_max} years'
                },
                'recommendations': [
                    'Consider adding 1-2 more interests for better targeting',
                    'Test different messaging tones for this age group',
                    'Optimize ad creative for mobile viewing'
                ]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audience_bp.route('/api/audience/preset-interests', methods=['GET', 'OPTIONS'])
def get_preset_interests():
    """Get preset interest categories"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    
    interests = [
        {
            'id': 'fitness',
            'label': 'Fitness & Wellness',
            'description': 'Health-conscious individuals interested in workouts, nutrition, and wellbeing',
            'audience_size': '45M',
            'growth_rate': '+18%'
        },
        {
            'id': 'sports',
            'label': 'Sports Enthusiasts',
            'description': 'Fans of various sports and athletic activities',
            'audience_size': '120M',
            'growth_rate': '+12%'
        },
        {
            'id': 'fashion',
            'label': 'Fashion & Lifestyle',
            'description': 'Trend-followers interested in clothing, accessories, and lifestyle brands',
            'audience_size': '85M',
            'growth_rate': '+15%'
        },
        {
            'id': 'running',
            'label': 'Running Community',
            'description': 'Dedicated runners and marathon participants',
            'audience_size': '25M',
            'growth_rate': '+22%'
        },
        {
            'id': 'outdoors',
            'label': 'Outdoor Activities',
            'description': 'People who enjoy hiking, camping, and outdoor adventures',
            'audience_size': '38M',
            'growth_rate': '+20%'
        },
        {
            'id': 'technology',
            'label': 'Tech Early Adopters',
            'description': 'Individuals who quickly adopt new technologies and gadgets',
            'audience_size': '65M',
            'growth_rate': '+25%'
        },
        {
            'id': 'travel',
            'label': 'Travel & Adventure',
            'description': 'People who frequently travel and seek new experiences',
            'audience_size': '52M',
            'growth_rate': '+16%'
        },
        {
            'id': 'food',
            'label': 'Food & Cooking',
            'description': 'Culinary enthusiasts and home cooks',
            'audience_size': '78M',
            'growth_rate': '+14%'
        }
    ]
    
    return jsonify({'interests': interests}), 200

@audience_bp.route('/api/audience/preset-locations', methods=['GET', 'OPTIONS'])
def get_preset_locations():
    """Get preset location options"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    
    locations = [
        {
            'name': 'India',
            'code': 'IN',
            'users': '110M',
            'growth': '+16%',
            'regions': ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata']
        },
        {
            'name': 'United States',
            'code': 'US',
            'users': '45M',
            'growth': '+12%',
            'regions': ['California', 'New York', 'Texas', 'Florida', 'Illinois']
        },
        {
            'name': 'United Kingdom',
            'code': 'GB',
            'users': '8M',
            'growth': '+8%',
            'regions': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool']
        },
        {
            'name': 'Canada',
            'code': 'CA',
            'users': '6M',
            'growth': '+15%',
            'regions': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba']
        },
        {
            'name': 'Australia',
            'code': 'AU',
            'users': '4M',
            'growth': '+10%',
            'regions': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia']
        },
        {
            'name': 'Germany',
            'code': 'DE',
            'users': '7M',
            'growth': '+9%',
            'regions': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt']
        },
        {
            'name': 'France',
            'code': 'FR',
            'users': '5M',
            'growth': '+7%',
            'regions': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice']
        },
        {
            'name': 'Japan',
            'code': 'JP',
            'users': '9M',
            'growth': '+11%',
            'regions': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya']
        }
    ]
    
    return jsonify({'locations': locations}), 200

# Register blueprint
app.register_blueprint(audience_bp)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'service': 'audience-targeting-api',
        'endpoints': [
            '/api/audience/targeting (POST)',
            '/api/audience/targeting/<campaign_id> (GET)',
            '/api/audience/insights (POST)',
            '/api/audience/preset-interests (GET)',
            '/api/audience/preset-locations (GET)'
        ]
    }), 200

if __name__ == '__main__':
    print("🚀 Audience Targeting API starting...")
    print(f"📡 Running on port 5006")
    print("📋 Available endpoints:")
    print("   POST /api/audience/targeting - Save audience targeting data")
    print("   GET  /api/audience/targeting/<campaign_id> - Get audience targeting data")
    print("   POST /api/audience/insights - Get AI insights")
    print("   GET  /api/audience/preset-interests - Get preset interests")
    print("   GET  /api/audience/preset-locations - Get preset locations")
    app.run(debug=True, port=5006, host='0.0.0.0')