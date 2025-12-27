# budget_testing_backend.py
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import os
from dotenv import load_dotenv
import jwt
# Add this import at the top
from unified_db import decode_jwt_token, handle_campaign_save, get_active_campaign

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
CORS(app, origins=["*"], supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

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
                    'budget_type': 'daily',
                    'budget_amount': 500.00,
                    'campaign_duration': 14,
                    'selected_tests': ['creative', 'audience']
                }]})
            elif self.operation == 'update':
                return type('obj', (object,), {'data': [{'id': 'mock-campaign-id'}]})
    
    supabase = MockSupabase()
    app.config['SUPABASE'] = supabase

# Create blueprint for budget testing routes
budget_testing_bp = Blueprint('budget_testing', __name__)

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

# In budget_testing_backend.py, update the save_budget_testing() function:
@budget_testing_bp.route('/api/budget-testing/save', methods=['POST','OPTIONS'])
def save_budget_testing():
    """Save budget and testing data to Supabase"""

    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['budget_type', 'budget_amount', 'campaign_duration', 'selected_tests', 'user_id']
        
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
        
        # Validate inputs (keep all your existing validation logic)
        budget_type = data['budget_type']
        if budget_type not in ['daily', 'lifetime']:
            return jsonify({'error': 'budget_type must be either "daily" or "lifetime"'}), 400
        
        try:
            budget_amount = float(data['budget_amount'])
            if budget_amount < 0:
                return jsonify({'error': 'budget_amount must be greater than or equal to 0'}), 400
        except ValueError:
            return jsonify({'error': 'budget_amount must be a valid number'}), 400
        
        try:
            campaign_duration = int(data['campaign_duration'])
            if campaign_duration < 1:
                return jsonify({'error': 'campaign_duration must be at least 1 day'}), 400
        except ValueError:
            return jsonify({'error': 'campaign_duration must be a valid integer'}), 400
        
        selected_tests = data['selected_tests']
        if not isinstance(selected_tests, list):
            return jsonify({'error': 'selected_tests must be a list'}), 400
        
        # Prepare data
        budget_data = {
            'budget_type': budget_type,
            'budget_amount': budget_amount,
            'campaign_duration': campaign_duration,
            'selected_tests': selected_tests
        }
        
        # Add optional fields
        optional_fields = ['messaging_tone']
        for field in optional_fields:
            if field in data:
                budget_data[field] = data[field]
        
        # Get campaign_id if provided
        campaign_id = data.get('campaign_id')
        
        # Use unified handler
        save_result = handle_campaign_save(supabase, current_user, budget_data, campaign_id)
        
        if not save_result['success']:
            return jsonify({'error': save_result.get('error', 'Failed to save budget data')}), 500
        
        # Get the saved campaign for projections
        campaign_result = get_active_campaign(supabase, current_user, save_result['campaign_id'])
        
        if not campaign_result['success'] or not campaign_result['campaign']:
            return jsonify({'error': 'Failed to retrieve saved campaign for projections'}), 500
        
        campaign = campaign_result['campaign']
        
        # Calculate projections (keep all your existing projection logic)
        projections = calculate_projections(
            budget_type,
            budget_amount,
            campaign_duration,
            selected_tests,
            campaign.get('campaign_goal')
        )
        
        return jsonify({
            'success': True,
            'message': 'Budget and testing saved successfully',
            'campaign_id': save_result['campaign_id'],
            'projections': projections,
            'campaign_summary': {
                'total_budget': calculate_total_budget(budget_type, budget_amount, campaign_duration),
                'duration': campaign_duration,
                'active_tests': len(selected_tests),
                'expected_roas': projections.get('expected_roas', '3.2x - 4.8x')
            }
        }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@budget_testing_bp.route('/api/budget-testing/<campaign_id>', methods=['GET','OPTIONS'])
def get_budget_testing(campaign_id):
    """Get budget and testing data for a specific campaign"""

    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
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
            'budget_type, budget_amount, campaign_duration, selected_tests, campaign_goal, messaging_tone'
        ).eq('id', campaign_id).eq('user_id', current_user).execute()
        
        if not response.data:
            return jsonify({'error': 'Campaign not found or access denied'}), 404
        
        campaign = response.data[0]
        
        # Format the response
        formatted_response = {
            'budget_type': campaign['budget_type'] or 'daily',
            'budget_amount': float(campaign['budget_amount']) if campaign['budget_amount'] else 500.00,
            'campaign_duration': campaign['campaign_duration'] or 14,
            'selected_tests': campaign['selected_tests'] or [],
            'campaign_goal': campaign.get('campaign_goal'),
            'messaging_tone': campaign.get('messaging_tone')
        }
        
        # Calculate projections
        projections = calculate_projections(
            formatted_response['budget_type'],
            formatted_response['budget_amount'],
            formatted_response['campaign_duration'],
            formatted_response['selected_tests'],
            formatted_response['campaign_goal']
        )
        
        return jsonify({
            **formatted_response,
            'projections': projections,
            'campaign_summary': {
                'total_budget': calculate_total_budget(
                    formatted_response['budget_type'],
                    formatted_response['budget_amount'],
                    formatted_response['campaign_duration']
                ),
                'duration': formatted_response['campaign_duration'],
                'active_tests': len(formatted_response['selected_tests']),
                'expected_roas': projections.get('expected_roas', '3.2x - 4.8x')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@budget_testing_bp.route('/api/budget-testing/projections', methods=['POST','OPTIONS'])
def get_projections():
    """Get performance projections based on budget and testing configuration"""

    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        
        # Extract data
        budget_type = data.get('budget_type', 'daily')
        budget_amount = float(data.get('budget_amount', 500))
        campaign_duration = int(data.get('campaign_duration', 14))
        selected_tests = data.get('selected_tests', [])
        campaign_goal = data.get('campaign_goal')
        
        # Calculate projections
        projections = calculate_projections(
            budget_type,
            budget_amount,
            campaign_duration,
            selected_tests,
            campaign_goal
        )
        
        return jsonify({
            'success': True,
            'projections': projections,
            'campaign_summary': {
                'total_budget': calculate_total_budget(budget_type, budget_amount, campaign_duration),
                'duration': campaign_duration,
                'active_tests': len(selected_tests),
                'expected_roas': projections.get('expected_roas', '3.2x - 4.8x')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_total_budget(budget_type, budget_amount, campaign_duration):
    """Calculate total budget based on budget type"""
    if budget_type == 'daily':
        return budget_amount * campaign_duration
    return budget_amount

def calculate_projections(budget_type, budget_amount, campaign_duration, selected_tests, campaign_goal=None):
    """Calculate performance projections"""
    
    # Base multipliers based on campaign goal
    goal_multipliers = {
        'awareness': {'impressions': 1.2, 'clicks': 0.8, 'conversions': 0.7, 'cpa': 1.3},
        'consideration': {'impressions': 1.0, 'clicks': 1.2, 'conversions': 0.9, 'cpa': 1.1},
        'conversions': {'impressions': 0.9, 'clicks': 1.0, 'conversions': 1.3, 'cpa': 0.8},
        'retention': {'impressions': 0.8, 'clicks': 1.1, 'conversions': 1.1, 'cpa': 0.9}
    }
    
    # Default to consideration if no goal specified
    goal = campaign_goal if campaign_goal in goal_multipliers else 'consideration'
    multipliers = goal_multipliers[goal]
    
    # Base daily metrics per $100
    base_impressions_per_100 = 9000  # 9,000 impressions per $100
    base_clicks_per_100 = 240       # 240 clicks per $100
    base_conversions_per_100 = 17   # 17 conversions per $100
    base_cpa = 5.88                # $5.88 CPA
    
    # Apply goal multipliers
    impressions_per_100 = base_impressions_per_100 * multipliers['impressions']
    clicks_per_100 = base_clicks_per_100 * multipliers['clicks']
    conversions_per_100 = base_conversions_per_100 * multipliers['conversions']
    cpa = base_cpa * multipliers['cpa']
    
    # Testing strategy multiplier
    testing_multiplier = 1.0
    if len(selected_tests) > 0:
        # More tests = better optimization
        testing_multiplier = 0.9 + (len(selected_tests) * 0.05)
    
    # Calculate daily metrics
    daily_budget = budget_amount if budget_type == 'daily' else (budget_amount / campaign_duration)
    
    daily_impressions_min = int((daily_budget / 100) * impressions_per_100 * testing_multiplier * 0.9)
    daily_impressions_max = int((daily_budget / 100) * impressions_per_100 * testing_multiplier * 1.1)
    
    daily_clicks_min = int((daily_budget / 100) * clicks_per_100 * testing_multiplier * 0.9)
    daily_clicks_max = int((daily_budget / 100) * clicks_per_100 * testing_multiplier * 1.1)
    
    daily_conversions_min = int((daily_budget / 100) * conversions_per_100 * testing_multiplier * 0.9)
    daily_conversions_max = int((daily_budget / 100) * conversions_per_100 * testing_multiplier * 1.1)
    
    cpa_min = round(cpa * testing_multiplier * 0.9, 2)
    cpa_max = round(cpa * testing_multiplier * 1.1, 2)
    
    # Calculate lifetime metrics
    if budget_type == 'daily':
        lifetime_impressions_min = daily_impressions_min * campaign_duration
        lifetime_impressions_max = daily_impressions_max * campaign_duration
        lifetime_clicks_min = daily_clicks_min * campaign_duration
        lifetime_clicks_max = daily_clicks_max * campaign_duration
        lifetime_conversions_min = daily_conversions_min * campaign_duration
        lifetime_conversions_max = daily_conversions_max * campaign_duration
        total_spend = budget_amount * campaign_duration
    else:
        lifetime_impressions_min = daily_impressions_min * campaign_duration
        lifetime_impressions_max = daily_impressions_max * campaign_duration
        lifetime_clicks_min = daily_clicks_min * campaign_duration
        lifetime_clicks_max = daily_clicks_max * campaign_duration
        lifetime_conversions_min = daily_conversions_min * campaign_duration
        lifetime_conversions_max = daily_conversions_max * campaign_duration
        total_spend = budget_amount
    
    # Calculate expected ROAS (Return on Ad Spend)
    # Assumes average conversion value of $25
    avg_conversion_value = 25
    min_revenue = lifetime_conversions_min * avg_conversion_value
    max_revenue = lifetime_conversions_max * avg_conversion_value
    
    min_roas = round(min_revenue / total_spend, 1) if total_spend > 0 else 0
    max_roas = round(max_revenue / total_spend, 1) if total_spend > 0 else 0
    
    # Format numbers with commas
    def format_number(num):
        if num >= 1000000:
            return f"{num/1000000:.1f}M"
        elif num >= 1000:
            return f"{num/1000:.1f}K"
        return str(num)
    
    return {
        'daily': {
            'impressions': f"{format_number(daily_impressions_min)} - {format_number(daily_impressions_max)}",
            'clicks': f"{format_number(daily_clicks_min)} - {format_number(daily_clicks_max)}",
            'conversions': f"{daily_conversions_min} - {daily_conversions_max}",
            'cpa': f"${cpa_min} - ${cpa_max}"
        },
        'lifetime': {
            'impressions': f"{format_number(lifetime_impressions_min)} - {format_number(lifetime_impressions_max)}",
            'clicks': f"{format_number(lifetime_clicks_min)} - {format_number(lifetime_clicks_max)}",
            'conversions': f"{lifetime_conversions_min} - {lifetime_conversions_max}",
            'total_spend': f"${total_spend:,.0f}"
        },
        'expected_roas': f"{min_roas}x - {max_roas}x",
        'total_budget': total_spend,
        'testing_impact': {
            'variants_count': len(selected_tests) * 3,  # Average 3 variants per test
            'optimization_boost': f"{int((testing_multiplier - 1) * 100)}%",
            'recommended_tests': ['creative', 'audience'] if len(selected_tests) < 2 else selected_tests
        }
    }

@budget_testing_bp.route('/api/budget-testing/testing-options', methods=['GET'])
def get_testing_options():
    """Get available A/B testing options"""
    testing_options = [
        {
            'id': 'creative',
            'title': 'Creative Testing',
            'description': 'Test multiple ad variations (images/videos)',
            'variants': 3,
            'recommended_for': ['awareness', 'consideration'],
            'optimization_impact': '25-40%'
        },
        {
            'id': 'audience',
            'title': 'Audience Testing',
            'description': 'Compare different audience segments',
            'variants': 2,
            'recommended_for': ['consideration', 'conversions'],
            'optimization_impact': '30-45%'
        },
        {
            'id': 'messaging',
            'title': 'Message Testing',
            'description': 'Test different copy and headline variations',
            'variants': 4,
            'recommended_for': ['conversions', 'retention'],
            'optimization_impact': '20-35%'
        }
    ]
    
    return jsonify({'testing_options': testing_options}), 200

@budget_testing_bp.route('/api/budget-testing/budget-recommendations', methods=['GET','OPTIONS'])
def get_budget_recommendations():
    """Get budget recommendations based on campaign goal"""


    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    
    goal = request.args.get('goal', 'consideration')
    
    recommendations = {
        'awareness': [
            {'value': 100, 'label': '$100', 'desc': 'Minimum reach'},
            {'value': 500, 'label': '$500', 'desc': 'Recommended'},
            {'value': 2000, 'label': '$2,000', 'desc': 'Max visibility'}
        ],
        'consideration': [
            {'value': 250, 'label': '$250', 'desc': 'Starter'},
            {'value': 1000, 'label': '$1,000', 'desc': 'Recommended'},
            {'value': 5000, 'label': '$5,000', 'desc': 'Aggressive'}
        ],
        'conversions': [
            {'value': 500, 'label': '$500', 'desc': 'Testing budget'},
            {'value': 2000, 'label': '$2,000', 'desc': 'Optimization'},
            {'value': 10000, 'label': '$10,000', 'desc': 'Scale'}
        ],
        'retention': [
            {'value': 100, 'label': '$100', 'desc': 'Maintenance'},
            {'value': 500, 'label': '$500', 'desc': 'Recommended'},
            {'value': 2000, 'label': '$2,000', 'desc': 'Re-engagement'}
        ]
    }
    
    return jsonify({
        'recommendations': recommendations.get(goal, recommendations['consideration']),
        'duration_recommendations': {
            'awareness': '7-14 days',
            'consideration': '14-30 days',
            'conversions': '30-60 days',
            'retention': '7-30 days'
        }
    }), 200

# Register blueprint
app.register_blueprint(budget_testing_bp)

@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy', 
        'service': 'budget-testing-api',
        'endpoints': [
            '/api/budget-testing/save (POST)',
            '/api/budget-testing/<campaign_id> (GET)',
            '/api/budget-testing/projections (POST)',
            '/api/budget-testing/testing-options (GET)',
            '/api/budget-testing/budget-recommendations (GET)'
        ]
    }), 200

if __name__ == '__main__':
    print("🚀 Budget & Testing API starting...")
    print(f"📡 Running on port 5007")
    print("📋 Available endpoints:")
    print("   POST /api/budget-testing/save - Save budget and testing data")
    print("   GET  /api/budget-testing/<campaign_id> - Get budget and testing data")
    print("   POST /api/budget-testing/projections - Get performance projections")
    print("   GET  /api/budget-testing/testing-options - Get testing options")
    print("   GET  /api/budget-testing/budget-recommendations - Get budget recommendations")
    app.run(debug=True, port=5012)