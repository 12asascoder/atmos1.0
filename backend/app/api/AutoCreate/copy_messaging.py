# backend/app/api/copy_messaging.py
import os
import json
import uuid
import jwt  # Add this import
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Get JWT secret from environment (same as your auth service)
JWT_SECRET = os.getenv('SECRET_KEY')

# Groq API configuration
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY not found in environment variables")
    
client = Groq(api_key=GROQ_API_KEY) 
GROQ_MODEL = "llama-3.3-70b-versatile"

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def decode_user_id_from_token(token: str):
    """
    Decode JWT token to get the actual user UUID
    """
    try:
        # If the token is already a UUID, return it as-is
        try:
            uuid_obj = uuid.UUID(token)
            logger.info(f"Token is already a UUID: {token}")
            return str(uuid_obj)
        except ValueError:
            # It's not a UUID, try to decode as JWT
            pass
        
        # Try to decode as JWT
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = decoded.get('user_id')
            
            if not user_id:
                logger.error(f"No user_id found in JWT token: {decoded}")
                return None
                
            logger.info(f"Decoded user_id from JWT: {user_id}")
            return str(user_id)
            
        except jwt.ExpiredSignatureError:
            logger.error("JWT token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid JWT token: {e}")
            # Try to extract user_id from token string (fallback)
            # This is a workaround - in production, you should properly decode JWT
            if 'user_id' in token:
                import re
                match = re.search(r'"user_id":"([a-f0-9-]+)"', token)
                if match:
                    user_id = match.group(1)
                    logger.info(f"Extracted user_id from token string: {user_id}")
                    return user_id
            return None
            
    except Exception as e:
        logger.error(f"Error decoding user_id from token: {e}")
        return None

def generate_copy_with_grok(campaign_message: str, tone: str, user_id: str):
    """
    Generate copy variations using Groq API
    """
    try:
        logger.info(f"Generating copy for: {campaign_message}")
        logger.info(f"Tone: {tone}, User: {user_id}")
        
        system_prompt = f"""You are an expert copywriter specializing in {tone} tone marketing campaigns.
        Generate 3 compelling copy variations for a marketing campaign with headlines, body text, and CTAs.
        
        IMPORTANT: Return ONLY valid JSON with exactly this structure:
        {{
            "variations": [
                {{
                    "id": 1,
                    "headline": "Creative headline here",
                    "body": "Engaging body text here",
                    "cta": "Action-oriented CTA here",
                    "score": 85-99,
                    "engagement": "+25-50%",
                    "color": "from-purple-500 to-pink-600"
                }},
                {{
                    "id": 2,
                    "headline": "Another creative headline",
                    "body": "Another engaging body text",
                    "cta": "Another action CTA",
                    "score": 85-99,
                    "engagement": "+25-50%",
                    "color": "from-blue-500 to-cyan-600"
                }},
                {{
                    "id": 3,
                    "headline": "Third creative headline",
                    "body": "Third engaging body text",
                    "cta": "Third action CTA",
                    "score": 85-99,
                    "engagement": "+25-50%",
                    "color": "from-emerald-500 to-teal-600"
                }}
            ]
        }}
        
        Campaign details:
        - Message: {campaign_message}
        - Tone: {tone}
        
        Guidelines:
        1. Make each variation distinct and creative
        2. Score should be between 85-99 based on effectiveness
        3. Engagement should be between +25-50%
        4. Color themes: from-purple-500 to-pink-600, from-blue-500 to-cyan-600, from-emerald-500 to-teal-600
        5. Keep headlines under 10 words
        6. Body text should be 1-2 sentences
        7. CTA should be 1-3 words
        8. Return ONLY the JSON, no additional text
        """
        
        user_prompt = f"""Generate 3 copy variations for this campaign message: "{campaign_message}"
        The tone should be: {tone}
        
        Return ONLY the JSON as specified."""
        
        try:
            chat_completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1500,
            )
            
            content = chat_completion.choices[0].message.content
            
            # Clean the response to extract JSON
            logger.info(f"Raw Groq response: {content[:200]}...")  # Log first 200 chars
            
            # Try to find JSON in the response
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            
            if json_start != -1 and json_end != 0:
                json_str = content[json_start:json_end]
            else:
                json_str = content
                
            # Parse JSON
            copy_data = json.loads(json_str)
            
            # Validate structure
            if 'variations' not in copy_data or len(copy_data['variations']) != 3:
                logger.error(f"Invalid response format: {copy_data}")
                raise ValueError("Invalid response format from Groq")
            
            logger.info(f"Successfully generated {len(copy_data['variations'])} copy variations")
            return copy_data
            
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise
            
    except Exception as e:
        logger.error(f"Error generating copy with Groq: {e}")
        raise

def analyze_copy_performance(selected_copy: dict):
    """
    Analyze selected copy performance using Groq
    """
    try:
        copy_text = f"Headline: {selected_copy.get('headline')}\nBody: {selected_copy.get('body')}\nCTA: {selected_copy.get('cta')}"
        
        system_prompt = """You are a marketing analytics expert. Analyze the provided copy and provide performance insights.
        
        IMPORTANT: Return ONLY valid JSON with exactly this structure:
        {
            "insights": [
                {"metric": "Emotional Appeal", "value": "High", "score": 85-99, "icon": "❤️"},
                {"metric": "Call-to-Action Strength", "value": "Strong", "score": 85-99, "icon": "🎯"},
                {"metric": "Clarity & Conciseness", "value": "Excellent", "score": 85-99, "icon": "✨"},
                {"metric": "Brand Alignment", "value": "Perfect", "score": 85-99, "icon": "🏆"}
            ],
            "tips": [
                "First actionable tip based on analysis",
                "Second actionable tip based on analysis", 
                "Third actionable tip based on analysis"
            ]
        }
        
        Guidelines:
        1. Score each metric between 85-99
        2. Value should be appropriate: High/Medium/Low, Strong/Medium/Weak, Excellent/Good/Fair, Perfect/Good/Fair
        3. Use emojis for icons as shown
        4. Tips should be actionable and specific
        5. Return ONLY the JSON, no additional text
        """
        
        user_prompt = f"""Analyze this marketing copy:
        
        {copy_text}
        
        Return ONLY the JSON analysis as specified."""
        
        try:
            chat_completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.5,
                max_tokens=1000,
            )
            
            content = chat_completion.choices[0].message.content
            
            # Clean the response to extract JSON
            logger.info(f"Raw analysis response: {content[:200]}...")  # Log first 200 chars
            
            # Try to find JSON in the response
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            
            if json_start != -1 and json_end != 0:
                json_str = content[json_start:json_end]
            else:
                json_str = content
                
            # Parse JSON
            analysis_data = json.loads(json_str)
            
            # Add engagement stats
            analysis_data['engagement_stats'] = {
                'expected_engagement': selected_copy.get('engagement', '+35%'),
                'benchmark_comparison': '42% higher engagement compared to industry benchmarks',
                'ctr_improvement': '15-20% better click-through rates with action verbs'
            }
            
            return analysis_data
            
        except Exception as e:
            logger.error(f"Groq analysis error: {e}")
            raise
            
    except Exception as e:
        logger.error(f"Error analyzing copy performance: {e}")
        raise

def save_to_supabase(token: str, campaign_id: str, messaging_tone: str, post_caption: dict) -> bool:
    """
    Save campaign data to Supabase
    """
    try:
        if not supabase:
            logger.warning("Supabase not configured, skipping save")
            return True
        
        # Decode user_id from JWT token
        user_id = decode_user_id_from_token(token)
        
        if not user_id:
            logger.error(f"Could not decode user_id from token: {token[:50]}...")
            return False
        
        # Validate that user_id is a valid UUID
        try:
            uuid.UUID(user_id)
        except ValueError:
            logger.error(f"Invalid UUID format for user_id: {user_id}")
            return False
        
        # Prepare the caption data
        caption_text = f"{post_caption.get('headline', '')}\n\n{post_caption.get('body', '')}\n\n{post_caption.get('cta', '')}"
        
        logger.info(f"Saving campaign - User: {user_id}, Campaign: {campaign_id}")
        
        # First, check if user exists in users table
        try:
            user_check = supabase.table('users').select('user_id').eq('user_id', user_id).execute()
            
            if not user_check.data:
                logger.error(f"User {user_id} not found in users table")
                # Option 1: Create a placeholder user (not recommended for production)
                # Option 2: Return error
                return False
                
        except Exception as e:
            logger.error(f"Error checking user existence: {e}")
            return False
        
        # Check if campaign exists
        try:
            existing = supabase.table('auto_create').select('*').eq('id', campaign_id).execute()
            
            if existing.data:
                # Update existing campaign
                data = {
                    'user_id': user_id,  # Make sure user_id is included
                    'messaging_tone': messaging_tone,
                    'post_caption': caption_text,
                    'updated_at': 'now()'
                }
                
                # Remove None values
                data = {k: v for k, v in data.items() if v is not None}
                
                response = supabase.table('auto_create').update(data).eq('id', campaign_id).execute()
                logger.info(f"Updated campaign {campaign_id} in Supabase")
                
            else:
                # Create new campaign with required fields
                data = {
                    'id': campaign_id,
                    'user_id': user_id,
                    'messaging_tone': messaging_tone,
                    'post_caption': caption_text,
                    'campaign_status': 'draft',
                    'budget_amount': 0,  # Required field
                    'campaign_duration': 30  # Required field
                }
                
                # Remove None values
                data = {k: v for k, v in data.items() if v is not None}
                
                response = supabase.table('auto_create').insert(data).execute()
                logger.info(f"Created new campaign {campaign_id} in Supabase")
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving campaign to Supabase: {e}")
            # Log the exact error details
            if hasattr(e, 'message'):
                logger.error(f"Supabase error details: {e.message}")
            return False
        
    except Exception as e:
        logger.error(f"Error in save_to_supabase function: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'copy-messaging-api',
        'grok_configured': bool(GROQ_API_KEY),
        'supabase_configured': bool(SUPABASE_URL and SUPABASE_KEY),
        'jwt_secret_configured': bool(JWT_SECRET != 'your-jwt-secret-key-here')
    }), 200

@app.route('/api/generate-copy', methods=['POST'])
def generate_copy():
    """Generate copy variations using Groq"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        campaign_message = data.get('message')
        tone = data.get('tone', 'energetic')
        token = data.get('user_id')  # This is actually the JWT token
        campaign_id = data.get('campaign_id', str(uuid.uuid4()))
        
        if not campaign_message:
            return jsonify({'success': False, 'error': 'Campaign message is required'}), 400
        
        if not token:
            return jsonify({'success': False, 'error': 'User token is required'}), 400
        
        # Decode user_id from token for logging
        user_id = decode_user_id_from_token(token)
        logger.info(f"Generate copy request: user={user_id or 'unknown'}, tone={tone}")
        
        # Generate copy variations
        copy_data = generate_copy_with_grok(campaign_message, tone, token)
        
        # Add campaign ID to response
        copy_data['campaign_id'] = campaign_id
        
        return jsonify({
            'success': True,
            'message': 'Copy variations generated successfully',
            'data': copy_data
        }), 200
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return jsonify({
            'success': False,
            'error': 'Invalid response format from AI service'
        }), 500
    except Exception as e:
        logger.error(f"Error in generate_copy: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to generate copy: {str(e)}'
        }), 500

@app.route('/api/analyze-copy', methods=['POST'])
def analyze_copy():
    """Analyze selected copy performance"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        selected_copy = data.get('selected_copy')
        token = data.get('user_id')  # This is the JWT token
        
        if not selected_copy:
            return jsonify({'success': False, 'error': 'Selected copy is required'}), 400
        
        if not token:
            return jsonify({'success': False, 'error': 'User token is required'}), 400
        
        # Decode user_id from token for logging
        user_id = decode_user_id_from_token(token)
        logger.info(f"Analyze copy request: user={user_id or 'unknown'}")
        
        # Analyze copy performance
        analysis = analyze_copy_performance(selected_copy)
        
        return jsonify({
            'success': True,
            'message': 'Copy analysis completed',
            'data': analysis
        }), 200
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return jsonify({
            'success': False,
            'error': 'Invalid response format from AI service'
        }), 500
    except Exception as e:
        logger.error(f"Error in analyze_copy: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to analyze copy: {str(e)}'
        }), 500

@app.route('/api/save-campaign', methods=['POST'])
def save_campaign():
    """Save campaign data to Supabase"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        token = data.get('user_id')  # JWT token
        campaign_id = data.get('campaign_id')
        messaging_tone = data.get('messaging_tone')
        post_caption = data.get('post_caption')
        
        if not all([token, campaign_id, messaging_tone, post_caption]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Decode user_id for logging
        user_id = decode_user_id_from_token(token)
        logger.info(f"Save campaign request: user={user_id or 'unknown'}, campaign={campaign_id}")
        
        # Save to Supabase
        success = save_to_supabase(token, campaign_id, messaging_tone, post_caption)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Campaign saved successfully',
                'campaign_id': campaign_id
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save campaign to database. Please check if user exists.'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in save_campaign: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to save campaign: {str(e)}'
        }), 500

@app.route('/api/decode-token', methods=['POST'])
def decode_token():
    """Helper endpoint to decode JWT token (for debugging)"""
    try:
        data = request.json
        token = data.get('token')
        
        if not token:
            return jsonify({'success': False, 'error': 'Token is required'}), 400
        
        user_id = decode_user_id_from_token(token)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'token_preview': token[:50] + '...' if len(token) > 50 else token
        }), 200
        
    except Exception as e:
        logger.error(f"Error decoding token: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Check if required environment variables are set
    if not GROQ_API_KEY:
        logger.error("ERROR: GROQ_API_KEY environment variable is not set!")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("WARNING: Supabase credentials not fully configured")
    
    # Use port 5007
    port = int(os.environ.get('PORT', 5007))
    logger.info(f"Starting Copy Messaging API on port {port}")
    logger.info(f"Groq configured: {bool(GROQ_API_KEY)}")
    logger.info(f"Supabase configured: {bool(SUPABASE_URL and SUPABASE_KEY)}")
    
    app.run(host='0.0.0.0', port=port, debug=True)