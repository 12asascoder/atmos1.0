from flask import Blueprint, request, jsonify, send_file
from flask_cors import CORS
import requests
import os
import time
import uuid
from dotenv import load_dotenv
import base64
import traceback

load_dotenv()

# Create blueprint instead of Flask app
generate_ad_bp = Blueprint('generate_ad', __name__)

# Enable CORS for blueprint
CORS(generate_ad_bp, 
     resources={r"/*": {
         "origins": ["http://localhost:5173"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin"],
         "expose_headers": ["Content-Type"],
         "supports_credentials": True,
         "max_age": 3600
     }},
     supports_credentials=True)

API_KEY = os.getenv("RUNWAY_API_KEY")
BASE_URL = "https://api.dev.runwayml.com"
VERSION = "2024-11-06"

# Get absolute path for OUTPUT_DIR
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "generated_images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"✅ Output directory: {OUTPUT_DIR}")
print(f"✅ Directory exists: {os.path.exists(OUTPUT_DIR)}")
print(f"✅ Directory writable: {os.access(OUTPUT_DIR, os.W_OK)}")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "X-Runway-Version": VERSION,
    "Content-Type": "application/json"
}

# Valid ratios for Runway ML API
VALID_RATIOS = [
    "1344:768",    # Landscape
    "768:1344",    # Portrait
    "1024:1024",   # Square
    "1184:864",    # Desktop
    "864:1184",    # Portrait Desktop
    "1536:672",    # Ultra Wide
    "832:1248",    # Portrait Mobile
    "1248:832",    # Landscape Mobile
    "896:1152",    # Portrait Tall
    "1152:896"     # Landscape Wide
]

# Mapping from frontend aspect ratios to valid Runway ratios
ASPECT_RATIO_MAPPING = {
    "1:1": "1024:1024",        # Square
    "16:9": "1344:768",        # Landscape (closest to 16:9)
    "9:16": "768:1344",        # Portrait (closest to 9:16)
    "4:5": "832:1248",         # Portrait (closest to 4:5)
    "1344:768": "1344:768",    # Direct match
}

def map_to_valid_ratio(frontend_ratio):
    """Map frontend aspect ratio to valid Runway ratio"""
    # If already a valid ratio, use it directly
    if frontend_ratio in VALID_RATIOS:
        return frontend_ratio
    
    # Check if we have a mapping
    if frontend_ratio in ASPECT_RATIO_MAPPING:
        return ASPECT_RATIO_MAPPING[frontend_ratio]
    
    # Try to parse and find closest match
    if ":" in frontend_ratio:
        try:
            width, height = map(int, frontend_ratio.split(":"))
            target_ratio = width / height
            
            # Find closest valid ratio
            closest_ratio = None
            min_diff = float('inf')
            
            for valid_ratio in VALID_RATIOS:
                v_width, v_height = map(int, valid_ratio.split(":"))
                v_ratio = v_width / v_height
                diff = abs(target_ratio - v_ratio)
                
                if diff < min_diff:
                    min_diff = diff
                    closest_ratio = valid_ratio
            
            print(f"🔀 Mapped {frontend_ratio} to {closest_ratio} (diff: {min_diff:.3f})")
            return closest_ratio
        except:
            pass
    
    # Default to square ratio
    return "1024:1024"

@generate_ad_bp.route('/image_gen', methods=['POST', 'OPTIONS'])
def generate_image():
    """Generate image from text prompt"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
            
        prompt = data.get('message', '').strip()
        
        if not prompt:
            return jsonify({"error": "Prompt is required", "success": False}), 400
        
        print(f"🎨 Generating image for prompt: {prompt}")
        
        # Get aspect ratio from frontend and map to valid Runway ratio
        frontend_ratio = data.get('aspect_ratio', '1344:768')
        valid_ratio = map_to_valid_ratio(frontend_ratio)
        print(f"📐 Frontend ratio: {frontend_ratio} -> Valid Runway ratio: {valid_ratio}")
        
        # Get style if provided
        style = data.get('style', 'photorealistic')
        
        # Get negative prompt if provided
        negative_prompt = data.get('negative_prompt', '')
        
        # Create enhanced prompt (removed the extra ", style" suffix since frontend already adds it)
        enhanced_prompt = f"{prompt}"
        
        # Add negative prompt if provided
        payload = {
            "model": "gemini_2.5_flash",
            "promptText": enhanced_prompt,
            "ratio": valid_ratio,
        }
        
        if negative_prompt:
            payload["negativePromptText"] = negative_prompt
        
        print(f"✨ Enhanced prompt: {enhanced_prompt}")
        print(f"📦 Payload: {payload}")
        
        # Create task
        create_resp = requests.post(
            f"{BASE_URL}/v1/text_to_image",
            headers=HEADERS,
            json=payload,
            timeout=30
        )
        
        # Check for errors
        if create_resp.status_code != 200:
            print(f"❌ Runway API Error: Status {create_resp.status_code}")
            print(f"❌ Response: {create_resp.text}")
            
            try:
                error_detail = create_resp.json()
                error_msg = error_detail.get("error", {}).get("message", create_resp.text)
            except:
                error_msg = create_resp.text
            
            return jsonify({
                "error": f"Runway API Error: {error_msg}",
                "success": False,
                "status_code": create_resp.status_code
            }), 500
        
        create_resp.raise_for_status()
        task_data = create_resp.json()
        task_id = task_data["id"]
        print(f"✅ Task created: {task_id}")

        # Poll task with timeout
        max_attempts = 30  # 60 seconds max
        for attempt in range(max_attempts):
            print(f"⏳ Polling task status (attempt {attempt + 1}/{max_attempts})")
            
            task_resp = requests.get(
                f"{BASE_URL}/v1/tasks/{task_id}",
                headers=HEADERS,
                timeout=10
            )
            
            if task_resp.status_code != 200:
                print(f"❌ Task status check failed: {task_resp.status_code}")
                time.sleep(2)
                continue
                
            task_resp.raise_for_status()
            task_data = task_resp.json()

            status = task_data.get("status")
            print(f"📊 Task status: {status}")

            if status == "SUCCEEDED":
                if task_data.get("output") and len(task_data["output"]) > 0:
                    image_url = task_data["output"][0]
                    print(f"✅ Image generated: {image_url[:50]}...")

                    # Generate filename with task_id for easy lookup
                    task_id = task_data["id"]  # Use the actual task ID
                    filename = f"{task_id}.png"
        
                    # Save image immediately (synchronous)
                    print(f"📥 Downloading image to: {filename}")
                    filepath = download_and_store_asset(image_url, filename)


                    if filepath:
                        file_size = os.path.getsize(filepath)
            
                        # Convert to base64 for immediate display
                        with open(filepath, "rb") as f:
                            image_data = base64.b64encode(f.read()).decode('utf-8')
            
                        response_data = {
                        "success": True,
                        "image_url": f"http://localhost:5002/get_image/{filename}",
                        "cloudfront_url": image_url,
                        "data_uri": f"data:image/png;base64,{image_data}",
                        "filename": filename,
                        "prompt": prompt,
                        "task_id": task_id,
                        "local_path": filepath,
                        "aspect_ratio_used": valid_ratio,
                        "style_used": style,
                        "file_size": file_size
                        }
            
                        print(f"✅ Image saved and ready! Size: {file_size} bytes")
                        return jsonify(response_data), 200
            
            elif status == "FAILED":
                error_msg = task_data.get("error", {}).get("message", "Generation failed")
                print(f"❌ Task failed: {error_msg}")
                return jsonify({"error": f"Generation failed: {error_msg}", "success": False}), 500
            
            # Wait before next poll
            time.sleep(2)
        
        print(f"⏰ Task polling timeout")
        return jsonify({"error": "Generation timeout", "success": False}), 504
        
    except requests.exceptions.Timeout:
        print(f"⏰ Request timeout")
        return jsonify({"error": "Request timeout. Please try again.", "success": False}), 504
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"API request failed: {str(e)}", "success": False}), 500
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}", "success": False}), 500

def download_and_store_asset(output_url: str, filename: str):
    """Download generated asset and store it - using provided filename"""
    try:
        print(f"📥 Downloading asset to: {filename}")
        
        # Download with timeout
        response = requests.get(output_url, timeout=60, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code != 200:
            print(f"❌ Download failed with status: {response.status_code}")
            return None
            
        response.raise_for_status()
        
        image_bytes = response.content
        print(f"✅ Downloaded {len(image_bytes)} bytes")
        
        # Save to file using provided filename
        path = os.path.join(OUTPUT_DIR, filename)
        print(f"💾 Saving image to: {path}")
        
        with open(path, "wb") as f:
            f.write(image_bytes)
        
        # Verify file was saved
        if os.path.exists(path):
            file_size = os.path.getsize(path)
            print(f"✅ File saved successfully! Size: {file_size} bytes")
            return path
        else:
            print(f"❌ File not created at {path}")
            return None
            
    except Exception as e:
        print(f"❌ Error downloading/saving image: {str(e)}")
        traceback.print_exc()
        return None

@generate_ad_bp.route('/check_local_image/<task_id>', methods=['GET', 'OPTIONS'])
def check_local_image(task_id: str):
    """Check if image has been downloaded locally and return local URL"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Look for file with this task_id as filename
        filename = f"{task_id}.png"
        path = os.path.join(OUTPUT_DIR, filename)
        
        if os.path.exists(path):
            local_url = f"http://localhost:5002/get_image/{filename}"
            
            return jsonify({
                "success": True,
                "status": "available_locally",
                "local_url": local_url,
                "filename": filename,
                "file_size": os.path.getsize(path)
            }), 200
        else:
            return jsonify({
                "success": False,
                "status": "not_downloaded_yet",
                "message": "Image not downloaded yet"
            }), 404
            
    except Exception as e:
        print(f"❌ Error checking local image: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    
@generate_ad_bp.route('/get_image/<filename>', methods=['GET', 'OPTIONS'])
def get_image(filename):
    """Serve generated images"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        # Sanitize filename
        filename = os.path.basename(filename)
        path = os.path.join(OUTPUT_DIR, filename)
        
        print(f"🖼️ Attempting to serve image: {filename}")
        print(f"📁 Path: {path}")
        
        if not os.path.exists(path):
            print(f"❌ Image not found: {path}")
            # List available files for debugging
            if os.path.exists(OUTPUT_DIR):
                files = os.listdir(OUTPUT_DIR)
                print(f"📂 Available files in {OUTPUT_DIR}: {files}")
                
                # Try to find file with different extension
                filename_no_ext = os.path.splitext(filename)[0]
                matching_files = [f for f in files if f.startswith(filename_no_ext)]
                if matching_files:
                    print(f"🔍 Found matching files: {matching_files}")
                    # Use the first matching file
                    path = os.path.join(OUTPUT_DIR, matching_files[0])
                    print(f"🔍 Using alternative file: {path}")
            
            if not os.path.exists(path):
                return jsonify({"error": f"Image '{filename}' not found", "available_files": os.listdir(OUTPUT_DIR) if os.path.exists(OUTPUT_DIR) else []}), 404
        
        file_size = os.path.getsize(path)
        print(f"✅ Serving image: {filename}, Size: {file_size} bytes")
        
        return send_file(path, mimetype='image/png')
        
    except Exception as e:
        print(f"❌ Error serving image: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@generate_ad_bp.route('/list_images', methods=['GET', 'OPTIONS'])
def list_images():
    """List all generated images"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        if not os.path.exists(OUTPUT_DIR):
            return jsonify({"images": [], "count": 0, "directory": OUTPUT_DIR, "exists": False}), 200
        
        files = []
        for filename in os.listdir(OUTPUT_DIR):
            path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(path) and filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                size = os.path.getsize(path)
                files.append({
                    "filename": filename,
                    "size": size,
                    "url": f"http://localhost:5002/get_image/{filename}",
                    "created": time.ctime(os.path.getctime(path))
                })
        
        print(f"📋 Listing {len(files)} images")
        return jsonify({
            "images": files,
            "count": len(files),
            "directory": OUTPUT_DIR,
            "exists": True
        }), 200
        
    except Exception as e:
        print(f"❌ Error listing images: {str(e)}")
        return jsonify({"error": str(e)}), 500

@generate_ad_bp.route('/valid_ratios', methods=['GET', 'OPTIONS'])
def get_valid_ratios():
    """Get list of valid aspect ratios"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    return jsonify({
        "success": True,
        "valid_ratios": VALID_RATIOS,
        "frontend_mapping": ASPECT_RATIO_MAPPING,
        "note": "These are the valid ratios accepted by Runway ML API"
    }), 200

@generate_ad_bp.route('/debug', methods=['GET', 'OPTIONS'])
def debug():
    """Debug endpoint to check server status"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    return jsonify({
        "status": "running",
        "port": 5002,
        "output_dir": OUTPUT_DIR,
        "dir_exists": os.path.exists(OUTPUT_DIR),
        "dir_writable": os.access(OUTPUT_DIR, os.W_OK),
        "runway_api_key_set": bool(API_KEY and API_KEY != "your_runway_api_key_here"),
        "valid_ratios": VALID_RATIOS,
        "current_time": time.ctime(),
        "files_in_output_dir": os.listdir(OUTPUT_DIR) if os.path.exists(OUTPUT_DIR) else []
    }), 200

@generate_ad_bp.route('/test_save', methods=['GET', 'OPTIONS'])
def test_save():
    """Test if we can save files to the output directory"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        test_filename = f"test_{int(time.time())}.png"
        test_path = os.path.join(OUTPUT_DIR, test_filename)
        
        # Create a simple test PNG image
        test_image = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
        
        with open(test_path, "wb") as f:
            f.write(test_image)
        
        exists = os.path.exists(test_path)
        if exists:
            file_size = os.path.getsize(test_path)
            return jsonify({
                "success": True,
                "message": f"Can write to {OUTPUT_DIR}",
                "test_file": test_filename,
                "file_size": file_size,
                "path": test_path
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to write to {OUTPUT_DIR}"
            }), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@generate_ad_bp.route('/clear_images', methods=['POST', 'OPTIONS'])
def clear_images():
    """Clear all generated images (for testing)"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        if not os.path.exists(OUTPUT_DIR):
            return jsonify({"message": "Output directory does not exist", "cleared": 0}), 200
        
        count = 0
        for filename in os.listdir(OUTPUT_DIR):
            path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(path):
                os.remove(path)
                count += 1
        
        print(f"🧹 Cleared {count} images")
        return jsonify({"message": f"Cleared {count} images", "cleared": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500