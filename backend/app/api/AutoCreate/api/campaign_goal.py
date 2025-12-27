"""
Stub service for campaign_goal.py
"""
from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def health_check():
    return jsonify({
        'status': 'stub',
        'service': 'campaign_goal',
        'message': 'This is a stub service. Replace with actual implementation.',
        'port': 5005
    }), 200

@app.route('/api/health')
def api_health():
    return jsonify({
        'status': 'healthy',
        'service': 'campaign_goal'
    }), 200

if __name__ == '__main__':
    print(f"🚀 Stub service for campaign_goal.py starting...")
    print(f"📡 Running on port 5005")
    app.run(debug=True, port=5005)
