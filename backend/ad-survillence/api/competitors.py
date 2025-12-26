"""
Competitors management endpoints for AdSurveillance
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

# Import middleware
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from middleware.auth import token_required

@app.route('/api/competitors', methods=['GET'])
@token_required
def get_user_competitors():
    """Get all competitors for the logged-in user"""
    try:
        user_id = request.user_id
        
        response = (
            supabase.table("competitors")
            .select("""
                id,
                name,
                domain,
                industry,
                estimated_monthly_spend,
                is_active,
                created_at,
                updated_at
            """)
            .eq("user_id", user_id)
            .order("name")
            .execute()
        )
        
        return jsonify({
            'success': True,
            'data': response.data,
            'count': len(response.data),
            'user_id': user_id
        }), 200
        
    except Exception as e:
        print(f"Error getting user competitors: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/competitors', methods=['POST'])
@token_required
def add_competitor():
    """Add a new competitor for the logged-in user"""
    try:
        user_id = request.user_id
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        name = data.get('name')
        domain = data.get('domain', '')
        industry = data.get('industry', '')
        estimated_monthly_spend = data.get('estimated_monthly_spend', 0)
        
        if not name:
            return jsonify({
                'success': False,
                'error': 'Competitor name is required'
            }), 400
        
        # Check if competitor already exists for this user
        existing_competitor = (
            supabase.table("competitors")
            .select("*")
            .eq("user_id", user_id)
            .eq("name", name)
            .execute()
        )
        
        if existing_competitor.data:
            return jsonify({
                'success': False,
                'error': f'Competitor "{name}" already exists for your account'
            }), 409
        
        # Add competitor
        response = (
            supabase.table("competitors")
            .insert({
                "user_id": user_id,
                "name": name,
                "domain": domain,
                "industry": industry,
                "estimated_monthly_spend": estimated_monthly_spend,
                "is_active": True
            })
            .execute()
        )
        
        if response.data:
            return jsonify({
                'success': True,
                'message': 'Competitor added successfully',
                'data': response.data[0]
            }), 201
        else:
            raise Exception("Failed to add competitor")
            
    except Exception as e:
        print(f"Error adding competitor: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/competitors/<competitor_id>', methods=['DELETE'])
@token_required
def delete_competitor(competitor_id):
    """Delete a competitor for the logged-in user"""
    try:
        user_id = request.user_id
        
        # Verify competitor belongs to user
        competitor_response = (
            supabase.table("competitors")
            .select("*")
            .eq("id", competitor_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        if not competitor_response.data:
            return jsonify({
                'success': False,
                'error': 'Competitor not found or you do not have permission to delete it'
            }), 404
        
        # Delete competitor
        response = (
            supabase.table("competitors")
            .delete()
            .eq("id", competitor_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        return jsonify({
            'success': True,
            'message': 'Competitor deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting competitor: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'daily-metrics',  # Change for each service
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    print("Starting Competitors server...")
    app.run(debug=True, port=5009, host='0.0.0.0')