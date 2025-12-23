# creative_assets.py
import os
import uuid
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import base64
from io import BytesIO
from PIL import Image
from unified_db import decode_jwt_token, handle_campaign_save

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
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

BUCKET_NAME = 'creative-assets'

def get_content_type(filename):
    """Determine content type based on file extension"""
    ext = filename.lower().split('.')[-1]
    content_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    }
    return content_types.get(ext, 'application/octet-stream')

def upload_image_to_supabase(user_id, image_data, filename, campaign_id=None):
    """
    Upload image to Supabase Storage
    Returns: (success, url_or_error_message)
    """
    try:
        if not supabase:
            return False, "Supabase client not initialized"
        
        # Generate unique file path
        if campaign_id:
            file_path = f"campaigns/{campaign_id}/{user_id}/{uuid.uuid4()}_{filename}"
        else:
            file_path = f"users/{user_id}/{uuid.uuid4()}_{filename}"
        
        # Get content type
        content_type = get_content_type(filename)
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(BUCKET_NAME).upload(
            file_path,
            image_data,
            {
                'content-type': content_type,
                'upsert': True
            }
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        
        logger.info(f"Image uploaded successfully: {public_url}")
        return True, public_url
        
    except Exception as e:
        logger.error(f"Error uploading to Supabase storage: {str(e)}")
        return False, str(e)

# Add to creative_assets.py

def save_asset_to_table(supabase, user_id, campaign_id, asset_data):
    """Save asset to campaign_assets table"""
    try:
        asset_record = {
            'campaign_id': campaign_id,
            'user_id': user_id,
            'image_url': asset_data.get('image_url'),
            'title': asset_data.get('title', ''),
            'asset_type': asset_data.get('type', 'user_uploaded'),
            'score': asset_data.get('score', 0),
            'prompt': asset_data.get('prompt', ''),
            'metadata': json.dumps({
                'filename': asset_data.get('filename'),
                'uploaded_at': datetime.now().isoformat()
            }),
            'is_selected': asset_data.get('is_selected', False)
        }
        
        response = supabase.table('campaign_assets').insert(asset_record).execute()
        
        if response.data:
            return {
                'success': True,
                'asset_id': response.data[0]['id']
            }
        else:
            return {
                'success': False,
                'error': 'Failed to save asset'
            }
        
    except Exception as e:
        logger.error(f"Error saving asset to table: {str(e)}")
        return {'success': False, 'error': str(e)}

def get_campaign_assets(supabase, user_id, campaign_id):
    """Get all assets for a campaign"""
    try:
        response = supabase.table('campaign_assets').select('*').eq('campaign_id', campaign_id).eq('user_id', user_id).execute()
        
        return {
            'success': True,
            'assets': response.data if response.data else []
        }
        
    except Exception as e:
        logger.error(f"Error getting campaign assets: {str(e)}")
        return {'success': False, 'error': str(e)}
    
def save_asset_to_database(user_id, image_url, asset_data, campaign_id=None):
    """Save asset metadata to auto_create table"""
    try:
        # Prepare asset data
        asset_info = {
            'image_url': image_url,
            'filename': asset_data.get('filename'),
            'title': asset_data.get('title', 'Generated Asset'),
            'type': asset_data.get('type', 'user_uploaded'),
            'score': asset_data.get('score', 0),
            'prompt': asset_data.get('prompt', ''),
            'uploaded_at': datetime.now().isoformat()
        }
        
        # Prepare data for unified handler
        campaign_data = {
            'assets': [asset_info]  # Store as JSON array in 'assets' column
        }
        
        # Use unified handler
        save_result = handle_campaign_save(supabase, user_id, campaign_data, campaign_id)
        
        return save_result
        
    except Exception as e:
        logger.error(f"Error saving asset to database: {str(e)}")
        return {'success': False, 'error': str(e)}

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Upload image to Supabase Storage and save metadata"""
    try:
        # Get data from request
        data = request.json
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        token = data.get('user_id')
        image_data = data.get('image_data')  # Base64 encoded image
        filename = data.get('filename')
        campaign_id = data.get('campaign_id')
        asset_data = data.get('asset_data', {})
        
        if not all([token, image_data, filename]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Decode JWT token
        try:
            current_user = decode_jwt_token(token)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        # Decode base64 image data
        try:
            # Remove data URL prefix if present
            if 'base64,' in image_data:
                image_data = image_data.split('base64,')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Validate image
            try:
                img = Image.open(BytesIO(image_bytes))
                img.verify()  # Verify it's a valid image
            except:
                return jsonify({'success': False, 'error': 'Invalid image data'}), 400
            
        except Exception as e:
            return jsonify({'success': False, 'error': f'Failed to decode image: {str(e)}'}), 400
        
        # Upload to Supabase Storage
        upload_success, upload_result = upload_image_to_supabase(
            current_user, 
            image_bytes, 
            filename, 
            campaign_id
        )
        
        if not upload_success:
            return jsonify({'success': False, 'error': upload_result}), 500
        
        # Save asset metadata to database
        asset_data['filename'] = filename
        save_result = save_asset_to_database(
            current_user, 
            upload_result, 
            asset_data, 
            campaign_id
        )
        
        if not save_result['success']:
            return jsonify({
                'success': False, 
                'error': save_result.get('error', 'Failed to save asset metadata')
            }), 500
        
        # IMPORTANT: Always return campaign_id
        returned_campaign_id = save_result.get('campaign_id') or campaign_id
        
        return jsonify({
            'success': True,
            'message': 'Image uploaded successfully',
            'image_url': upload_result,
            'campaign_id': returned_campaign_id  # Always include this
        }), 200
        
    except Exception as e:
        logger.error(f"Error in upload_image: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to upload image: {str(e)}'
        }), 500

@app.route('/api/generate-assets', methods=['POST'])
def generate_assets():
    """Generate AI assets based on uploaded image"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        token = data.get('user_id')
        image_url = data.get('image_url')
        campaign_goal = data.get('campaign_goal')
        campaign_id = data.get('campaign_id')
        
        if not token:
            return jsonify({'success': False, 'error': 'User token is required'}), 400
        
        # Decode JWT token
        try:
            current_user = decode_jwt_token(token)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        
        # For demo purposes, generate dummy assets
        # In production, you would call an AI image generation API here
        
        dummy_assets = [
            {
                'id': 1,
                'title': 'Professional Product Showcase',
                'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop',
                'prompt': f'Professional product advertisement for {campaign_goal}, studio lighting, product showcase',
                'score': 94,
                'type': 'AI Generated'
            },
            {
                'id': 2,
                'title': 'Lifestyle Setting',
                'image_url': 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=1000&fit=crop',
                'prompt': f'Lifestyle setting for {campaign_goal}, natural environment, authentic',
                'score': 91,
                'type': 'AI Generated'
            },
            {
                'id': 3,
                'title': 'Creative Concept',
                'image_url': 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=1000&fit=crop',
                'prompt': f'Creative concept for {campaign_goal}, artistic composition, visually appealing',
                'score': 88,
                'type': 'AI Generated'
            }
        ]
        
        # Save generated assets to database if campaign_id is provided
        if campaign_id:
            for asset in dummy_assets:
                save_result = save_asset_to_database(
                    current_user,
                    asset['image_url'],
                    asset,
                    campaign_id
                )
        
        return jsonify({
            'success': True,
            'message': 'Assets generated successfully',
            'assets': dummy_assets,
            'campaign_id': campaign_id
        }), 200
        
    except Exception as e:
        logger.error(f"Error in generate_assets: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to generate assets: {str(e)}'
        }), 500

@app.route('/api/save-selected-assets', methods=['POST'])
def save_selected_assets():
    """Save selected assets to campaign"""
    try:
        data = request.json
        logger.info(f"Received save request: {json.dumps(data, indent=2)[:500]}...")
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        token = data.get('user_id')
        selected_assets = data.get('selected_assets', [])
        campaign_id = data.get('campaign_id')
        
        logger.info(f"Token: {token[:20] if token else 'None'}...")
        logger.info(f"Selected assets count: {len(selected_assets)}")
        logger.info(f"Campaign ID: {campaign_id}")
        
        if not token:
            return jsonify({'success': False, 'error': 'User token is required'}), 400
        
        if not campaign_id:
            return jsonify({'success': False, 'error': 'Campaign ID is required'}), 400
        
        # Decode JWT token
        try:
            current_user = decode_jwt_token(token)
            logger.info(f"Decoded user ID: {current_user}")
        except ValueError as e:
            logger.error(f"Token decode error: {str(e)}")
            return jsonify({'error': str(e)}), 401
        
        # Convert campaign_id to integer
        try:
            campaign_id = int(campaign_id)
            logger.info(f"Campaign ID as integer: {campaign_id}")
        except ValueError:
            logger.error(f"Invalid campaign ID format: {campaign_id}")
            return jsonify({'success': False, 'error': 'Invalid campaign ID format'}), 400
        
        # Check if campaign exists
        try:
            campaign_check = supabase.table('auto_create').select('id').eq('id', campaign_id).eq('user_id', current_user).execute()
            logger.info(f"Campaign check result: {len(campaign_check.data) if campaign_check.data else 0} campaigns found")
            
            if not campaign_check.data:
                return jsonify({
                    'success': False,
                    'error': f'Campaign {campaign_id} not found or access denied'
                }), 404
        except Exception as e:
            logger.error(f"Error checking campaign: {str(e)}")
            return jsonify({'success': False, 'error': f'Error checking campaign: {str(e)}'}), 500
        
        # Save selected assets to database
        try:
            # Convert selected assets to JSON string
            assets_json = json.dumps(selected_assets)
            
            # Update the campaign with assets
            response = supabase.table('auto_create').update({
                'selected_assets': assets_json,
                'updated_at': datetime.now().isoformat()
            }).eq('id', campaign_id).eq('user_id', current_user).execute()
            
            logger.info(f"Update response: {response}")
            
            if response.data:
                return jsonify({
                    'success': True,
                    'message': f'{len(selected_assets)} assets saved successfully',
                    'campaign_id': campaign_id
                }), 200
            else:
                logger.error(f"No data returned from update: {response}")
                return jsonify({
                    'success': False,
                    'error': 'Failed to update campaign'
                }), 500
                
        except Exception as e:
            logger.error(f"Error saving assets: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Failed to save assets: {str(e)}'
            }), 500
        
    except Exception as e:
        logger.error(f"Unexpected error in save_selected_assets: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }), 500
    
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'creative-assets-api',
        'bucket_name': BUCKET_NAME,
        'supabase_configured': bool(SUPABASE_URL and SUPABASE_KEY)
    }), 200

if __name__ == '__main__':
    # Check if required environment variables are set
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("ERROR: Supabase credentials not configured!")
    
    # Use port 5009
    port = int(os.environ.get('PORT', 5009))
    logger.info(f"Starting Creative Assets API on port {port}")
    logger.info(f"Supabase configured: {bool(SUPABASE_URL and SUPABASE_KEY)}")
    
    app.run(host='0.0.0.0', port=port, debug=True)