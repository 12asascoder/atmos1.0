"""
AdSurveillance Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Server ports
    MAIN_PORT = int(os.getenv("MAIN_PORT", 5010))
    AUTH_PORT = int(os.getenv("AUTH_PORT", 5003))
    ANALYTICS_PORT = int(os.getenv("ANALYTICS_PORT", 5007))
    DAILY_METRICS_PORT = int(os.getenv("DAILY_METRICS_PORT", 5008))
    COMPETITORS_PORT = int(os.getenv("COMPETITORS_PORT", 5009))
    
    # JWT Configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret-key-change-in-production")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    
    # CORS Configuration
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

settings = Settings()