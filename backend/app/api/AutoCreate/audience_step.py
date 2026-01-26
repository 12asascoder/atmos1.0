# audience_step.py
from flask import Blueprint, request, jsonify
import os
import jwt
import traceback
from dotenv import load_dotenv

# Try to import supabase
try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠ Supabase not installed. Using mock client.")

load_dotenv()

# --------------------------------------------------
# Blueprint
# --------------------------------------------------

audience_bp = Blueprint("audience", __name__)

# --------------------------------------------------
# JWT Config
# --------------------------------------------------

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")

# --------------------------------------------------
# Supabase setup
# --------------------------------------------------

if SUPABASE_AVAILABLE and os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"):
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
else:
    # Mock Supabase (dev fallback)
    class MockSupabase:
        def table(self, _):
            return self

        def select(self, *_): return self
        def insert(self, *_): return self
        def update(self, *_): return self
        def eq(self, *_): return self

        def execute(self):
            return type("obj", (), {
                "data": [{
                    "id": 1,
                    "demographics": ["male", "female"],
                    "age_range_min": 25,
                    "age_range_max": 45,
                    "selected_interests": [{"id": "fitness"}],
                    "target_locations": [{"name": "India"}],
                    "campaign_status": "draft"
                }]
            })

    supabase = MockSupabase()

# --------------------------------------------------
# Helpers
# --------------------------------------------------

def decode_jwt_token(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user_id = payload.get("user_id")
    if not user_id:
        raise ValueError("user_id missing in token")
    return str(user_id)

# --------------------------------------------------
# Rich Data for Frontend
# --------------------------------------------------

PRESET_INTERESTS = [
    {
        "id": "fitness",
        "label": "Fitness & Wellness",
        "description": "Health-conscious users interested in exercise, nutrition, and wellness",
        "audience_size": "2.3M users",
        "growth_rate": "+18%"
    },
    {
        "id": "sports",
        "label": "Sports & Athletics",
        "description": "Active sports enthusiasts, athletes, and sports fans",
        "audience_size": "3.1M users",
        "growth_rate": "+22%"
    },
    {
        "id": "fashion",
        "label": "Fashion & Style",
        "description": "Fashion-forward individuals interested in trends and apparel",
        "audience_size": "4.5M users",
        "growth_rate": "+15%"
    },
    {
        "id": "technology",
        "label": "Technology & Gadgets",
        "description": "Tech enthusiasts and early adopters of new technology",
        "audience_size": "3.8M users",
        "growth_rate": "+25%"
    },
    {
        "id": "travel",
        "label": "Travel & Adventure",
        "description": "Travel enthusiasts and adventure seekers",
        "audience_size": "2.9M users",
        "growth_rate": "+20%"
    },
    {
        "id": "food",
        "label": "Food & Dining",
        "description": "Foodies, cooking enthusiasts, and restaurant goers",
        "audience_size": "3.6M users",
        "growth_rate": "+16%"
    },
    {
        "id": "gaming",
        "label": "Gaming & Esports",
        "description": "Video game players and esports enthusiasts",
        "audience_size": "4.2M users",
        "growth_rate": "+30%"
    },
    {
        "id": "music",
        "label": "Music & Entertainment",
        "description": "Music lovers, concert goers, and entertainment seekers",
        "audience_size": "5.1M users",
        "growth_rate": "+12%"
    },
    {
        "id": "business",
        "label": "Business & Entrepreneurship",
        "description": "Business professionals and entrepreneurs",
        "audience_size": "2.1M users",
        "growth_rate": "+19%"
    },
    {
        "id": "education",
        "label": "Education & Learning",
        "description": "Students, educators, and lifelong learners",
        "audience_size": "3.3M users",
        "growth_rate": "+21%"
    }
]

PRESET_LOCATIONS = [
    {
        "code": "IN",
        "name": "India",
        "users": "580M",
        "growth": "+24%",
        "regions": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata"]
    },
    {
        "code": "US",
        "name": "United States",
        "users": "330M",
        "growth": "+8%",
        "regions": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia"]
    },
    {
        "code": "UK",
        "name": "United Kingdom",
        "users": "68M",
        "growth": "+5%",
        "regions": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool"]
    },
    {
        "code": "BR",
        "name": "Brazil",
        "users": "150M",
        "growth": "+20%",
        "regions": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte"]
    },
    {
        "code": "ID",
        "name": "Indonesia",
        "users": "175M",
        "growth": "+26%",
        "regions": ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar"]
    },
    {
        "code": "DE",
        "name": "Germany",
        "users": "78M",
        "growth": "+6%",
        "regions": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart"]
    },
    {
        "code": "FR",
        "name": "France",
        "users": "58M",
        "growth": "+7%",
        "regions": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes"]
    },
    {
        "code": "AU",
        "name": "Australia",
        "users": "22M",
        "growth": "+10%",
        "regions": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"]
    },
    {
        "code": "CA",
        "name": "Canada",
        "users": "35M",
        "growth": "+9%",
        "regions": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa"]
    },
    {
        "code": "MX",
        "name": "Mexico",
        "users": "95M",
        "growth": "+22%",
        "regions": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León"]
    },
    {
        "code": "JP",
        "name": "Japan",
        "users": "105M",
        "growth": "+4%",
        "regions": ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Fukuoka"]
    },
    {
        "code": "KR",
        "name": "South Korea",
        "users": "48M",
        "growth": "+11%",
        "regions": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju"]
    }
]

# --------------------------------------------------
# Routes
# --------------------------------------------------

@audience_bp.route("/api/audience/targeting", methods=["POST"])
def save_audience_targeting():
    try:
        data = request.get_json()

        token = data.get("user_id")
        if not token:
            return jsonify({"error": "Missing auth token"}), 401

        user_id = decode_jwt_token(token)

        audience_data = {
            "demographics": data["demographics"],
            "age_range_min": data["age_range_min"],
            "age_range_max": data["age_range_max"],
            "selected_interests": data["selected_interests"],
            "target_locations": data["target_locations"]
        }

        campaign_id = data.get("campaign_id")

        if campaign_id:
            response = supabase.table("auto_create") \
                .update(audience_data) \
                .eq("id", int(campaign_id)) \
                .eq("user_id", user_id) \
                .execute()
        else:
            response = supabase.table("auto_create") \
                .insert({
                    "user_id": user_id,
                    "campaign_status": "draft",
                    **audience_data
                }) \
                .execute()

        if not response.data:
            return jsonify({"error": "Database operation failed"}), 500

        return jsonify({
            "success": True,
            "campaign_id": response.data[0]["id"]
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@audience_bp.route("/api/audience/targeting/<campaign_id>", methods=["GET"])
def get_audience_targeting(campaign_id):
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        user_id = decode_jwt_token(token)

        response = supabase.table("auto_create") \
            .select("*") \
            .eq("id", int(campaign_id)) \
            .eq("user_id", user_id) \
            .execute()

        if not response.data:
            return jsonify({"error": "Campaign not found"}), 404

        return jsonify(response.data[0]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@audience_bp.route("/api/audience/insights", methods=["POST"])
def get_audience_insights():
    data = request.get_json()

    age_min = data.get("age_range_min", 25)
    age_max = data.get("age_range_max", 45)
    interests = data.get("selected_interests", [])
    locations = data.get("target_locations", [])

    # Calculate estimated audience based on selections
    base_audience = 500_000
    interest_multiplier = 1 + (len(interests) * 0.3)
    location_multiplier = 1 + (len(locations) * 0.2)
    
    estimated_audience = int(base_audience * interest_multiplier * location_multiplier)

    # Calculate engagement multiplier
    engagement_multiplier = round(1.2 + (len(interests) * 0.15), 1)

    # Determine peak activity based on age range
    avg_age = (age_min + age_max) // 2
    if avg_age < 30:
        peak_activity = "8 PM - 11 PM"
        device_preference = "Mobile (92%)"
    elif avg_age < 45:
        peak_activity = "7 PM - 10 PM"
        device_preference = "Mobile (85%)"
    else:
        peak_activity = "6 PM - 9 PM"
        device_preference = "Desktop (55%)"

    return jsonify({
        "success": True,
        "insights": {
            "estimated_audience": f"{estimated_audience:,}",
            "average_age": avg_age,
            "engagement_multiplier": engagement_multiplier,
            "peak_activity": peak_activity,
            "device_preference": device_preference,
            "recommendations": [
                "Test multiple creatives to identify top performers",
                "Optimize for mobile viewing based on audience demographics",
                "Consider A/B testing different messaging tones",
                f"Schedule posts during peak activity: {peak_activity}"
            ]
        }
    }), 200


@audience_bp.route("/api/audience/preset-interests", methods=["GET"])
def preset_interests():
    """Return rich interest data for the frontend"""
    return jsonify({
        "interests": PRESET_INTERESTS
    }), 200


@audience_bp.route("/api/audience/preset-locations", methods=["GET"])
def preset_locations():
    """Return rich location data for the frontend"""
    return jsonify({
        "locations": PRESET_LOCATIONS
    }), 200


@audience_bp.route("/api/audience/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "audience-targeting",
        "supabase": bool(supabase),
        "interests_count": len(PRESET_INTERESTS),
        "locations_count": len(PRESET_LOCATIONS)
    }), 200