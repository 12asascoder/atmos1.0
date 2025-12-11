import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
from google import genai
from io import BytesIO

load_dotenv()

app = Flask(__name__)

# Configure CORS properly
CORS(app)

# Gemini API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

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
        if not GEMINI_API_KEY:
            return jsonify({
                "error": "API key not configured",
                "message": "Please set GEMINI_API_KEY in your .env file"
            }), 500
        
        print(f"Sending request to Gemini API...")
        
        # Initialize Gemini client with API key
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Generate image using Gemini
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[prompt],
        )
        
        print(f"Gemini API response received")
        
        # Extract image from response
        image_found = False
        for part in response.parts:
            if part.inline_data is not None:
                # Convert the image to bytes
                image = part.as_image()
                
                # Save image to BytesIO buffer
                buffer = BytesIO()
                image.save(buffer, format='PNG')
                image_binary = buffer.getvalue()
                
                # Convert to base64
                image_base64 = base64.b64encode(image_binary).decode('utf-8')
                
                print(f"Successfully generated image (size: {len(image_binary)} bytes)")
                print(f"Base64 length: {len(image_base64)} characters")
                
                image_found = True
                
                # Return the image as base64
                return jsonify({
                    "success": True,
                    "image": image_base64,
                    "format": "png",
                    "size": len(image_binary)
                }), 200
        
        # If no image was found in response
        if not image_found:
            # Check if there's text instead
            text_response = ""
            for part in response.parts:
                if part.text is not None:
                    text_response += part.text
            
            return jsonify({
                "error": "No image generated",
                "message": "Gemini did not return an image",
                "text_response": text_response
            }), 500
        
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
        "gemini_api_configured": bool(GEMINI_API_KEY)
    }), 200

if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"GEMINI_API_KEY configured: {bool(GEMINI_API_KEY)}")
    app.run(debug=True, port=5002)