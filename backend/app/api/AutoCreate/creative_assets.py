# creative_assets.py - Fixed video generation function
import os
import base64
import uuid
import json
import time
import requests
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import logging
import mimetypes

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
creative_assets_bp = Blueprint('creative_assets', __name__)

# API Configuration
RUNWAY_API_KEY = os.environ.get('RUNWAY_API_KEY')
RUNWAY_BASE_URL = "https://api.dev.runwayml.com"
RUNWAY_VERSION = "2024-11-06"

# Headers for Runway API
RUNWAY_HEADERS = {
    "Authorization": f"Bearer {RUNWAY_API_KEY}",
    "X-Runway-Version": RUNWAY_VERSION,
    "Content-Type": "application/json",
}

# Valid ratios for Runway ML API (from error message)
VALID_RATIOS = [
    "1024:1024",  # Square
    "1080:1080",  # Square HD
    "1168:880",   # Desktop
    "1360:768",   # Widescreen
    "1440:1080",  # 4:3 HD
    "1080:1440",  # Portrait HD
    "1808:768",   # Ultra Wide
    "1920:1080",  # Full HD
    "1080:1920",  # Portrait Full HD
    "2112:912",   # Super Wide
    "1280:720",   # HD
    "720:1280",   # Portrait HD
    "720:720",    # Square Mobile
    "960:720",    # 4:3 Mobile
    "720:960",    # Portrait Mobile
    "1680:720"    # Cinematic
]

# In-memory storage for tasks (in production, use a database)
tasks_store = {}
generation_tasks = {}  # Separate storage for tracking individual tasks

# -----------------------------
# Helper Functions
# -----------------------------

def get_image_as_data_uri(image_path_or_data: str, filename: str = None) -> str:
    """
    Convert image to data URI format as per Runway documentation
    """
    try:
        # If it's already a data URI, return it
        if image_path_or_data.startswith('data:image/'):
            return image_path_or_data
        
        # If it's base64 data, create data URI
        elif ',' in image_path_or_data:
            # It's already a data URI without the prefix
            mime_type = 'image/jpeg'
            if filename:
                content_type = mimetypes.guess_type(filename)[0]
                if content_type and content_type.startswith('image/'):
                    mime_type = content_type
            
            return f"data:{mime_type};base64,{image_path_or_data}"
        
        else:
            # It's raw base64, add the prefix
            content_type = 'image/jpeg'
            if filename:
                file_ext = filename.lower().split('.')[-1]
                if file_ext in ['png', 'jpg', 'jpeg', 'webp', 'gif']:
                    content_type = f"image/{'jpeg' if file_ext in ['jpg', 'jpeg'] else file_ext}"
            
            return f"data:{content_type};base64,{image_path_or_data}"
            
    except Exception as e:
        logger.error(f"Error creating data URI: {e}")
        # Default to JPEG
        return f"data:image/jpeg;base64,{image_path_or_data}"

def save_image_locally(image_data: str, filename: str) -> str:
    """Save base64 image data to local file system"""
    try:
        # Create output directory if it doesn't exist
        output_dir = "uploaded_images"
        os.makedirs(output_dir, exist_ok=True)
        
        # Decode base64 data
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # Save file
        filepath = os.path.join(output_dir, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        logger.info(f"Image saved to: {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Error saving image: {e}")
        return None

def create_image_generation_task(image_data_uri: str, prompt_text: str, variation_number: int = 1):
    """
    Create image generation task using Runway ML with proper format as per documentation
    Uses @product to reference the uploaded image in the prompt
    """
    try:
        # Choose a valid ratio - using 1:1 square for product images
        ratio = "1024:1024"  # Square ratio for social media/product images
        
        # Prepare request payload according to Runway documentation
        # Use @product to reference the uploaded image in the prompt
        payload = {
            "model": "gen4_image",  # Using gen4_image model as per documentation
            "ratio": ratio,
            "promptText": f"@product {prompt_text}",
            "referenceImages": [
                {
                    "uri": image_data_uri,
                    "tag": "product"
                }
            ]
        }
        
        logger.info(f"Creating image generation task with ratio: {ratio}")
        logger.info(f"Prompt: {prompt_text[:100]}...")
        
        # Make API call
        response = requests.post(
            f"{RUNWAY_BASE_URL}/v1/text_to_image",
            headers=RUNWAY_HEADERS,
            json=payload,
            timeout=30
        )
        
        # Log the response for debugging
        logger.info(f"Runway API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Runway API Error: {response.text}")
            response.raise_for_status()
        
        task_data = response.json()
        task_id = task_data.get("id")
        
        if not task_id:
            logger.error(f"No task ID returned: {task_data}")
            raise Exception("No task ID returned from Runway API")
        
        logger.info(f"Image generation task created: {task_id}")
        return task_id
        
    except Exception as e:
        logger.error(f"Error creating image generation task: {e}")
        raise

def create_video_generation_task(image_data_uri: str, prompt_text: str, variation_number: int = 1):
    """
    Create video generation task using Runway ML
    Based on the working template from the user
    """
    try:
        # Prepare request payload for video generation according to Runway API
        # The API expects either a single promptImage (string) or an array of promptImages
        
        # Clean up the prompt - remove @product reference for videos
        clean_prompt = prompt_text.replace("@product", "").strip()
        
        payload = {
            "model": "veo3.1",
            "promptImage": image_data_uri,  # Single image as data URI
            "promptText": clean_prompt,
            "ratio": "1280:720",  # Valid ratio for video
            "duration": 4,  # Must be 4, 6, or 8 seconds
        }
        
        logger.info(f"Creating video generation task with prompt: {clean_prompt[:100]}...")
        logger.info(f"Using image data URI: {image_data_uri[:80]}...")
        
        # Make API call
        response = requests.post(
            f"{RUNWAY_BASE_URL}/v1/image_to_video",
            headers=RUNWAY_HEADERS,
            json=payload,
            timeout=30
        )
        
        logger.info(f"Runway Video API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Runway Video API Error: {response.text}")
            # Log more details for debugging
            try:
                error_details = response.json()
                logger.error(f"Error details: {error_details}")
            except:
                logger.error(f"Raw error response: {response.text}")
            response.raise_for_status()
        
        task_data = response.json()
        task_id = task_data.get("id")
        
        if not task_id:
            logger.error(f"No task ID returned for video: {task_data}")
            raise Exception("No task ID returned from Runway API for video")
        
        logger.info(f"Video generation task created: {task_id}")
        return task_id
        
    except Exception as e:
        logger.error(f"Error creating video generation task: {e}")
        raise

def poll_task_status(task_id: str):
    """Poll Runway ML task status with better logging"""
    max_attempts = 300  # 5 minutes with 1-second intervals (videos take longer)
    attempt = 0
    
    logger.info(f"Starting to poll task: {task_id}")
    
    while attempt < max_attempts:
        try:
            # Get task status
            response = requests.get(
                f"{RUNWAY_BASE_URL}/v1/tasks/{task_id}",
                headers=RUNWAY_HEADERS,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"Task status check failed: {response.status_code}")
                time.sleep(2)
                attempt += 1
                continue
            
            task = response.json()
            status = task.get("status")
            
            logger.info(f"Task {task_id} status: {status} (attempt {attempt + 1}/{max_attempts})")
            
            if status == "SUCCEEDED":
                output_url = task.get("output", [])[0] if task.get("output") else None
                if output_url:
                    logger.info(f"Task {task_id} succeeded! Output URL: {output_url[:50]}...")
                    return {
                        "success": True,
                        "status": status,
                        "output_url": output_url,
                        "task_id": task_id
                    }
                else:
                    logger.error(f"Task succeeded but no output URL: {task}")
            
            elif status == "FAILED":
                error_message = task.get("error", {}).get("message", "Unknown error")
                logger.error(f"Task {task_id} failed: {error_message}")
                return {
                    "success": False,
                    "status": status,
                    "error": error_message
                }
            elif status == "CANCELED":
                logger.error(f"Task {task_id} was canceled")
                return {
                    "success": False,
                    "status": status,
                    "error": "Task was canceled"
                }
            
            # Wait before next poll (longer for videos)
            time.sleep(2)
            attempt += 1
            
        except Exception as e:
            logger.error(f"Error polling task {task_id}: {e}")
            time.sleep(2)
            attempt += 1
    
    logger.error(f"Task {task_id} polling timeout after {max_attempts} seconds")
    return {
        "success": False,
        "status": "TIMEOUT",
        "error": f"Task polling timeout after {max_attempts} seconds"
    }

def download_and_store_asset(output_url: str, task_id: str, asset_type: str, campaign_id: str):
    """Download generated asset and store it"""
    try:
        logger.info(f"Downloading asset from: {output_url[:50]}...")
        
        # Download the asset
        response = requests.get(output_url, timeout=60)  # Longer timeout for videos
        response.raise_for_status()
        
        # Convert to base64
        asset_data = base64.b64encode(response.content).decode('utf-8')
        mime_type = 'video/mp4' if asset_type == 'video' else 'image/png'
        data_uri = f"data:{mime_type};base64,{asset_data}"
        
        # Generate filename
        timestamp = int(time.time())
        asset_filename = f"{campaign_id}_{task_id}_{timestamp}_{asset_type}.{'mp4' if asset_type == 'video' else 'png'}"
        
        # Save locally
        output_dir = "generated_videos" if asset_type == 'video' else "generated_images"
        os.makedirs(output_dir, exist_ok=True)
        filepath = os.path.join(output_dir, asset_filename)
        
        with open(filepath, "wb") as f:
            f.write(response.content)
        
        logger.info(f"Asset saved to: {filepath} (size: {len(response.content)} bytes)")
        
        return {
            "data_uri": data_uri,
            "local_path": filepath,
            "filename": asset_filename,
            "output_url": output_url,
            "file_size": len(response.content)
        }
        
    except Exception as e:
        logger.error(f"Error downloading/storing asset: {e}")
        raise

def generate_trend_aware_prompt(base_prompt: str, ad_type: str, campaign_goal: str) -> str:
    """
    Generate trend-aware prompts incorporating current trends
    """
    # Current trends for 2026
    current_trends = [
        "AI-generated unique aesthetics",
        "Fluid morphing animations",
        "Glassmorphism 2.0 with depth",
        "Holographic and iridescent effects",
        "Sustainable design patterns",
        "Adaptive responsive layouts",
        "Kinetic typography systems",
        "Neural network inspired patterns"
    ]
    
    # Select relevant trends
    import random
    selected_trends = random.sample(current_trends, min(3, len(current_trends)))
    
    # Build the final prompt
    prompt = f"@product {base_prompt}"
    prompt += f", incorporating trends: {', '.join(selected_trends)}"
    prompt += f", 2026 design aesthetics"
    prompt += f", professional {ad_type} advertisement"
    prompt += f", ultra-detailed, photorealistic, 8K resolution"
    prompt += f", professional lighting, perfect composition"
    
    return prompt

def generate_video_prompt(ad_type: str, campaign_goal: str, variation_number: int) -> str:
    """
    Generate specific video prompts based on variation number
    """
    video_prompts = [
        f"""Create a cinematic advertisement-style video.
Campaign goal: {campaign_goal}.
Product type: {ad_type}.
Preserve the product identity and enhance lighting, background, and motion.
Follow modern advertising trends with smooth animations.
Cinematic quality, professional lighting, slow motion effects.""",
        
        f"""Generate an engaging promotional video.
Campaign goal: {campaign_goal}.
Product type: {ad_type}.
Focus on product showcase with dynamic camera movements.
Include subtle motion effects and professional transitions.
Modern advertising style with attention-grabbing visuals."""
    ]
    
    # Return the appropriate prompt based on variation number
    index = (variation_number - 1) % len(video_prompts)
    return video_prompts[index]

# -----------------------------
# API Routes
# -----------------------------

@creative_assets_bp.route('/api/upload-image', methods=['POST', 'OPTIONS'])
def upload_image():
    """Upload product image and create campaign"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        required_fields = ['image_data', 'filename', 'ad_type']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        user_id = data.get('user_id', 'demo_user')
        image_data = data['image_data']
        filename = data['filename']
        ad_type = data['ad_type']
        campaign_id = data.get('campaign_id', f"campaign_{str(uuid.uuid4())[:8]}")
        
        # Convert to proper data URI format
        image_data_uri = get_image_as_data_uri(image_data, filename)
        
        logger.info(f"Uploading image for campaign: {campaign_id}, user: {user_id}")
        logger.info(f"Data URI format: {image_data_uri[:100]}...")
        
        # Save image locally
        filepath = save_image_locally(image_data, filename)
        
        if not filepath:
            return jsonify({"success": False, "error": "Failed to save image"}), 500
        
        # Store in tasks store
        tasks_store[campaign_id] = {
            "user_id": user_id,
            "filename": filename,
            "filepath": filepath,
            "image_data": image_data_uri,  # Store as data URI
            "ad_type": ad_type,
            "created_at": time.time(),
            "status": "uploaded",
            "generated_assets": []  # Store all generated assets here
        }
        
        # Initialize generation tasks for this campaign
        generation_tasks[campaign_id] = []
        
        logger.info(f"Image uploaded successfully for campaign: {campaign_id}")
        
        return jsonify({
            "success": True,
            "message": "Image uploaded successfully",
            "campaign_id": campaign_id,
            "user_id": user_id,
            "ad_type": ad_type,
            "image_format": "data_uri"
        }), 200
        
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@creative_assets_bp.route('/api/generate-assets', methods=['POST', 'OPTIONS'])
def generate_assets():
    """Generate multiple AI assets (images or videos)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        required_fields = ['campaign_id', 'asset_type']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        campaign_id = data['campaign_id']
        asset_type = data['asset_type']  # 'image' or 'video'
        user_id = data.get('user_id', 'demo_user')
        campaign_goal = data.get('campaign_goal', 'awareness')
        ad_type = data.get('ad_type', 'General Ads')
        
        # Check if campaign exists
        if campaign_id not in tasks_store:
            return jsonify({"success": False, "error": "Campaign not found. Please upload image first."}), 404
        
        campaign = tasks_store[campaign_id]
        image_data_uri = campaign['image_data']
        
        # Validate asset type
        if asset_type not in ['image', 'video']:
            return jsonify({"success": False, "error": "Invalid asset type. Must be 'image' or 'video'"}), 400
        
        logger.info(f"Starting {asset_type} generation for campaign: {campaign_id}, ad_type: {ad_type}")
        
        # Generate ONLY 2 variations (as requested)
        num_variations = 2
        
        # Check if assets already generated
        if 'generated_assets' in campaign:
            # Count existing assets of this type
            existing_count = len([a for a in campaign['generated_assets'] if a.get('type') == asset_type])
            if existing_count >= num_variations:
                return jsonify({
                    "success": True,
                    "message": f"Already generated {existing_count} {asset_type} assets",
                    "task_ids": [],
                    "campaign_id": campaign_id,
                    "asset_type": asset_type,
                    "variations": existing_count,
                    "note": "Use GET /api/get-generated-assets to retrieve existing assets"
                }), 200
        
        task_ids = []
        
        for i in range(num_variations):
            try:
                if asset_type == 'image':
                    # Generate trend-aware prompt for images
                    base_prompt = f"Create a professional advertisement background for {ad_type}. Campaign goal: {campaign_goal}. Use modern, clean design with the product placed naturally."
                    prompt_text = generate_trend_aware_prompt(
                        base_prompt,
                        ad_type,
                        campaign_goal
                    )
                    
                    task_id = create_image_generation_task(
                        image_data_uri,
                        prompt_text,
                        i + 1
                    )
                else:  # video
                    # Generate specific video prompt
                    prompt_text = generate_video_prompt(
                        ad_type,
                        campaign_goal,
                        i + 1
                    )
                    
                    task_id = create_video_generation_task(
                        image_data_uri,
                        prompt_text,
                        i + 1
                    )
                
                # Store task info
                task_info = {
                    "task_id": task_id,
                    "campaign_id": campaign_id,
                    "user_id": user_id,
                    "asset_type": asset_type,
                    "ad_type": ad_type,
                    "campaign_goal": campaign_goal,
                    "status": "processing",
                    "variation": i + 1,
                    "started_at": time.time(),
                    "prompt": prompt_text
                }
                
                # Store in generation tasks
                if campaign_id not in generation_tasks:
                    generation_tasks[campaign_id] = []
                generation_tasks[campaign_id].append(task_info)
                
                task_ids.append(task_id)
                logger.info(f"Created {asset_type} generation task {i+1}: {task_id}")
                
                # Add small delay between task creation
                if i < num_variations - 1:
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Failed to create variation {i+1}: {e}")
                # Continue with other variations even if one fails
        
        if not task_ids:
            return jsonify({"success": False, "error": "Failed to create any generation tasks"}), 500
        
        # Update campaign status
        campaign['status'] = f'generating_{asset_type}'
        tasks_store[campaign_id] = campaign
        
        logger.info(f"Started {len(task_ids)} {asset_type} generation tasks for campaign: {campaign_id}")
        
        return jsonify({
            "success": True,
            "message": f"Started {len(task_ids)} {asset_type} generation tasks",
            "task_ids": task_ids,
            "campaign_id": campaign_id,
            "asset_type": asset_type,
            "variations": len(task_ids),  # Actual number of tasks created
            "estimated_time": "2-5 minutes per video" if asset_type == 'video' else "1-3 minutes per image",
            "note": f"Generating {len(task_ids)} {asset_type}s only. They will appear one at a time as they're generated."
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating assets: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@creative_assets_bp.route('/api/check-status/<task_id>', methods=['GET', 'OPTIONS'])
def check_status(task_id: str):
    """Check status of a generation task and return asset if completed"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        logger.info(f"Checking status for task: {task_id}")
        
        # Find the task in generation_tasks
        task_info = None
        campaign_id = None
        
        for cid, tasks in generation_tasks.items():
            for task in tasks:
                if task.get("task_id") == task_id:
                    task_info = task
                    campaign_id = cid
                    break
            if task_info:
                break
        
        if not task_info or not campaign_id:
            logger.error(f"Task {task_id} not found in generation tasks")
            return jsonify({"success": False, "error": f"Task {task_id} not found"}), 404
        
        # Check if task is already completed in campaign
        campaign = tasks_store.get(campaign_id, {})
        generated_assets = campaign.get('generated_assets', [])
        
        for asset in generated_assets:
            if asset.get('task_id') == task_id:
                # Task already completed and stored
                logger.info(f"Task {task_id} already completed, returning stored asset")
                return jsonify({
                    "success": True,
                    "status": "completed",
                    "asset_type": task_info.get('asset_type'),
                    "task_id": task_id,
                    "asset": {
                        "id": asset.get('id'),
                        "data_uri": asset.get('data_uri'),
                        "filename": asset.get('filename'),
                        "type": asset.get('type'),
                        "file_size": asset.get('file_size')
                    },
                    "variation": task_info.get('variation'),
                    "message": f"{task_info.get('asset_type').capitalize()} generation completed"
                }), 200
        
        # Poll Runway for status
        logger.info(f"Polling Runway for task status: {task_id}")
        result = poll_task_status(task_id)
        
        if result['success']:
            # Task completed successfully
            asset_type = task_info.get('asset_type', 'image')
            
            try:
                # Download and store the asset
                asset_data = download_and_store_asset(
                    result['output_url'],
                    task_id,
                    asset_type,
                    campaign_id
                )
                
                # Create asset info
                asset_id = str(uuid.uuid4())
                asset_info = {
                    "id": asset_id,
                    "task_id": task_id,
                    "campaign_id": campaign_id,
                    "type": asset_type,
                    "data_uri": asset_data['data_uri'],
                    "filename": asset_data['filename'],
                    "local_path": asset_data['local_path'],
                    "output_url": asset_data['output_url'],
                    "file_size": asset_data.get('file_size'),
                    "title": f"AI Generated {asset_type.capitalize()} {task_info.get('variation', 1)}",
                    "prompt": task_info.get('prompt', ''),
                    "score": 80 + (task_info.get('variation', 1) * 5),  # Score based on variation
                    "created_at": time.time(),
                    "status": "completed"
                }
                
                # Update task info
                task_info['status'] = 'completed'
                task_info['completed_at'] = time.time()
                task_info['asset_info'] = asset_info
                
                # Store in campaign's generated assets
                if 'generated_assets' not in campaign:
                    campaign['generated_assets'] = []
                campaign['generated_assets'].append(asset_info)
                tasks_store[campaign_id] = campaign
                
                logger.info(f"Task {task_id} completed and stored successfully")
                
                return jsonify({
                    "success": True,
                    "status": "completed",
                    "asset_type": asset_type,
                    "task_id": task_id,
                    "asset": {
                        "id": asset_id,
                        "data_uri": asset_data['data_uri'],
                        "filename": asset_data['filename'],
                        "type": asset_type,
                        "file_size": asset_data.get('file_size')
                    },
                    "variation": task_info.get('variation'),
                    "message": f"{asset_type.capitalize()} generation completed successfully"
                }), 200
                
            except Exception as e:
                logger.error(f"Error processing completed task {task_id}: {e}")
                task_info['status'] = 'failed'
                task_info['error'] = str(e)
                
                return jsonify({
                    "success": False,
                    "status": "error",
                    "error": f"Failed to process generated asset: {str(e)}",
                    "task_id": task_id
                }), 500
        
        else:
            # Task failed or timed out
            task_info['status'] = 'failed'
            task_info['error'] = result.get('error', 'Unknown error')
            
            logger.error(f"Task {task_id} failed: {result.get('error')}")
            
            return jsonify({
                "success": False,
                "status": "failed",
                "error": result.get('error', 'Task failed'),
                "task_id": task_id
            }), 200
            
    except Exception as e:
        logger.error(f"Error checking status: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@creative_assets_bp.route('/api/get-generated-assets/<campaign_id>', methods=['GET', 'OPTIONS'])
def get_generated_assets(campaign_id: str):
    """Get all generated assets for a campaign"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        if campaign_id not in tasks_store:
            return jsonify({"success": False, "error": "Campaign not found"}), 404
        
        campaign = tasks_store[campaign_id]
        generated_assets = campaign.get('generated_assets', [])
        
        # Format assets for frontend
        formatted_assets = []
        for i, asset in enumerate(generated_assets):
            formatted_assets.append({
                "id": i + 1,  # Simple sequential ID for frontend
                "title": asset.get('title', f"AI Generated {asset.get('type', 'image').capitalize()}"),
                "image_url": asset.get('data_uri') if asset.get('type') == 'image' else None,
                "video_url": asset.get('data_uri') if asset.get('type') == 'video' else None,
                "data_uri": asset.get('data_uri'),
                "prompt": asset.get('prompt', ''),
                "score": asset.get('score', 85),
                "type": "ai_generated_image" if asset.get('type') == 'image' else "ai_generated_video",
                "asset_type": asset.get('type', 'image'),
                "task_id": asset.get('task_id'),
                "filename": asset.get('filename'),
                "file_size": asset.get('file_size'),
                "status": asset.get('status', 'completed')
            })
        
        logger.info(f"Returning {len(formatted_assets)} generated assets for campaign: {campaign_id}")
        
        return jsonify({
            "success": True,
            "campaign_id": campaign_id,
            "assets": formatted_assets,
            "count": len(formatted_assets),
            "total_generating": len(generation_tasks.get(campaign_id, []))
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting generated assets: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# Test endpoint to check video generation directly
@creative_assets_bp.route('/api/test-video-generation', methods=['POST', 'OPTIONS'])
def test_video_generation():
    """Test video generation with a simple image"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # Use a simple test image or provided image
        if data and data.get('image_data'):
            image_data_uri = get_image_as_data_uri(data['image_data'], 'test.jpg')
        else:
            # Create a simple test image
            import base64
            # Create a simple 1x1 red pixel
            test_image = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
            image_data_uri = f"data:image/png;base64,{base64.b64encode(test_image).decode('utf-8')}"
        
        # Test video generation
        prompt_text = "Create a simple test video with motion effects. Cinematic style."
        
        task_id = create_video_generation_task(
            image_data_uri,
            prompt_text,
            1
        )
        
        return jsonify({
            "success": True,
            "message": "Test video generation started",
            "task_id": task_id,
            "estimated_time": "2-5 minutes"
        }), 200
        
    except Exception as e:
        logger.error(f"Test video generation error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# Add test endpoint for valid ratios
@creative_assets_bp.route('/api/get-valid-ratios', methods=['GET', 'OPTIONS'])
def get_valid_ratios():
    """Get list of valid ratios for Runway ML API"""
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        "success": True,
        "valid_ratios": VALID_RATIOS,
        "recommended_for_images": "1024:1024 (square), 1920:1080 (widescreen), 1080:1920 (portrait)",
        "recommended_for_videos": "1280:720 (HD), 1920:1080 (Full HD)"
    }), 200

# Health check endpoint
@creative_assets_bp.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "creative-assets",
        "runway_configured": RUNWAY_API_KEY and RUNWAY_API_KEY != 'your_runway_api_key_here',
        "campaigns_count": len(tasks_store),
        "generation_tasks_count": sum(len(tasks) for tasks in generation_tasks.values()),
        "valid_ratios_count": len(VALID_RATIOS)
    })