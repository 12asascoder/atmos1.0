import os
import uuid
import base64
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
from diffusers import AutoPipelineForImage2Image
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize pipeline
pipeline = None

def init_pipeline():
    global pipeline
    try:
        if torch.cuda.is_available():
            device = torch.device("cuda")
            dtype = torch.float16
            logger.info("Using GPU")
        else:
            device = torch.device("cpu")
            dtype = torch.float32
            logger.info("Using CPU")
        
        pipeline = AutoPipelineForImage2Image.from_pretrained(
            "kandinsky-community/kandinsky-2-2-decoder",
            torch_dtype=dtype,
            use_safetensors=True
        ).to(device)
        
        if torch.cuda.is_available():
            pipeline.enable_model_cpu_offload()
        
        logger.info("Pipeline loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to load pipeline: {e}")
        return False

def image_to_base64(img):
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'gpu': torch.cuda.is_available(),
        'pipeline_ready': pipeline is not None
    })

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        if pipeline is None:
            if not init_pipeline():
                return jsonify({'error': 'Pipeline not available'}), 500
        
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Convert base64 to image
        image_data = base64.b64decode(data['image'].split(',')[1] if ',' in data['image'] else data['image'])
        init_image = Image.open(BytesIO(image_data)).convert('RGB')
        
        # Resize if too large
        if max(init_image.size) > 1024:
            ratio = 1024 / max(init_image.size)
            new_size = tuple(int(dim * ratio) for dim in init_image.size)
            init_image = init_image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Generate
        prompt = data.get('prompt', 'Professional product advertisement')
        result = pipeline(
            prompt=prompt,
            image=init_image,
            strength=0.7,
            guidance_scale=7.5,
            num_inference_steps=25  # Faster
        )
        
        generated = result.images[0]
        base64_img = image_to_base64(generated)
        
        return jsonify({
            'success': True,
            'image': base64_img
        })
        
    except Exception as e:
        logger.error(f"Generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No file'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Read and convert to base64
        img = Image.open(file.stream).convert('RGB')
        base64_img = image_to_base64(img)
        
        return jsonify({
            'success': True,
            'image': base64_img
        })
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize pipeline
    init_pipeline()
    
    # Run on port 5006
    port = 5006
    logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)