#!/usr/bin/env python3
"""
Test script to diagnose video generation issues
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def check_environment():
    """Check if all required environment variables are set"""
    print("🔍 Checking Environment Variables...")
    print("-" * 50)
    
    runway_key = os.environ.get('RUNWAY_API_KEY')
    if runway_key:
        print(f"✅ RUNWAY_API_KEY is set: {runway_key[:20]}...{runway_key[-10:]}")
    else:
        print("❌ RUNWAY_API_KEY is NOT set!")
        print("   Please set it with: export RUNWAY_API_KEY='your_key_here'")
        return False
    
    print("\n🔍 Checking API Configuration...")
    print("-" * 50)
    
    try:
        from app.api.AutoCreate.creative_assets import RUNWAY_API_KEY, RUNWAY_BASE_URL, RUNWAY_HEADERS
        print(f"✅ Runway Base URL: {RUNWAY_BASE_URL}")
        print(f"✅ Runway API Key loaded: {RUNWAY_API_KEY[:20]}...{RUNWAY_API_KEY[-10:]}")
        print(f"✅ Headers configured: {list(RUNWAY_HEADERS.keys())}")
    except Exception as e:
        print(f"❌ Failed to import API config: {e}")
        return False
    
    print("\n🔍 Testing Runway API Connection...")
    print("-" * 50)
    
    try:
        import requests
        response = requests.get(
            f"{RUNWAY_BASE_URL}/v1/tasks",  # List tasks endpoint
            headers=RUNWAY_HEADERS,
            timeout=10
        )
        print(f"✅ API Connection successful: Status {response.status_code}")
        if response.status_code == 200:
            print(f"✅ API is accessible and authentication works")
        elif response.status_code == 401:
            print(f"❌ Authentication failed - check your API key")
            return False
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"❌ API Connection failed: {e}")
        return False
    
    return True

def test_video_generation():
    """Test video generation with a simple payload"""
    print("\n🎬 Testing Video Generation...")
    print("-" * 50)
    
    try:
        from app.api.AutoCreate.creative_assets import create_video_generation_task
        
        # Create a simple test image data URI (1x1 transparent PNG)
        test_image_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        test_prompt = "A beautiful water bottle on a clean background"
        
        print(f"📝 Test prompt: {test_prompt}")
        print(f"🖼️ Test image: {test_image_uri[:50]}...")
        
        task_id = create_video_generation_task(test_image_uri, test_prompt, 1)
        print(f"✅ Video generation task created: {task_id}")
        return True
        
    except Exception as e:
        print(f"❌ Video generation failed: {e}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("🔬 ADOS Video Generation Diagnostic Tool")
    print("=" * 50)
    print()
    
    # Check environment
    if not check_environment():
        print("\n❌ Environment check failed!")
        print("   Please fix the issues above and try again.")
        sys.exit(1)
    
    # Test video generation
    if not test_video_generation():
        print("\n❌ Video generation test failed!")
        print("   Check the error messages above for details.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ All checks passed! Video generation should work.")
    print("=" * 50)
