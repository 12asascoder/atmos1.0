import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import base64

load_dotenv()

app = Flask(__name__)

# Configure CORS properly
CORS(app)

# Qubrid API configuration
QUBRID_URL = "https://platform.qubrid.com/api/v1/qubridai/image/generation"
QUBRID_API_KEY = os.environ.get("QUBRID_API_KEY")

@app.route('/image_gen', methods=['POST', 'OPTIONS'])
def image_gen():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get the request data
        data = request.get_json(force=True)
        print(f"Received data: {data}")
        
        # Extract prompt
        prompt = data.get("message") or data.get("prompt")
        print(f"Extracted prompt: {prompt}")
        
        if not prompt:
            error_response = {
                "error": "No prompt provided",
                "received_data": data,
                "expected_field": "message or prompt"
            }
            print(f"Error: {error_response}")
            return jsonify(error_response), 400
        
        # Check if API key is configured
        if not QUBRID_API_KEY:
            return jsonify({
                "error": "API key not configured",
                "message": "Please set QUBRID_API_KEY in your .env file"
            }), 500
        
        # Prepare headers for Qubrid API
        headers = {
            "Authorization": f"Bearer {QUBRID_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Prepare data for Qubrid API - note: uses positive_prompt, not prompt
        payload = {
            "model": "stabilityai/stable-diffusion-3.5-large",
            "positive_prompt": prompt,
            "width": 1024,
            "height": 1024,
            "steps": 9,
            "cfg": 0,
            "seed": 42
        }
        
        print(f"Sending request to Qubrid API...")
        print(f"Payload: {payload}")
        
        # Make request to Qubrid API
        response = requests.post(QUBRID_URL, headers=headers, json=payload, timeout=60)
        
        print(f"Qubrid API response status: {response.status_code}")
        print(f"Response content type: {response.headers.get('content-type')}")
        
        # Check if request was successful
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            return jsonify({
                "error": "Failed to generate image from Qubrid API",
                "status_code": response.status_code,
                "details": response.text
            }), response.status_code
        
        # The response is binary image data (PNG), convert to base64
        image_binary = response.content
        image_base64 = base64.b64encode(image_binary).decode('utf-8')
        
        print(f"Successfully generated image (size: {len(image_binary)} bytes)")
        print(f"Base64 length: {len(image_base64)} characters")
        
        # Return the image as base64
        return jsonify({
            "success": True,
            "image": image_base64,
            "format": "png",
            "size": len(image_binary)
        }), 200
        
    except requests.exceptions.Timeout:
        print("Error: Request to Qubrid API timed out")
        return jsonify({
            "error": "Request timed out",
            "message": "The image generation took too long. Please try again."
        }), 504
        
    except requests.exceptions.RequestException as e:
        print(f"Error: Request exception - {str(e)}")
        return jsonify({
            "error": "Failed to connect to image generation service",
            "details": str(e)
        }), 503
        
    except Exception as e:
        print(f"Error in image_gen: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "qubrid_api_configured": bool(QUBRID_API_KEY)
    }), 200

if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"QUBRID_API_KEY configured: {bool(QUBRID_API_KEY)}")
    app.run(debug=True, port=5002)