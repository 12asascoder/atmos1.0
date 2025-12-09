# app/core/config.py
import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pydantic_settings import BaseSettings


load_dotenv()

class Settings:
    PROJECT_NAME: str = "Snitch Competitor Surveillance"
    API_V1_STR: str = "/api/v1"

    # Supabase Postgres URL
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set in .env")
    
    META_AD_LIBRARY_ACCESS_TOKEN: str | None = None
    META_GRAPH_API_VERSION: str = "v19.0"
    META_GRAPH_API_BASE_URL: str = "https://graph.facebook.com"
    META_DEFAULT_COUNTRIES: str = "IN"

    # Google Ads / YouTube transparency
    GOOGLE_TRANSPARENCY_API_KEY: str | None = None
    GOOGLE_TRANSPARENCY_DEFAULT_REGIONS: str = "IN"
    GOOGLE_TRANSPARENCY_DEFAULT_LANG: str = "en"

    # TikTok Commercial Content Library
    TIKTOK_COMMERCIAL_API_KEY: str | None = None
    TIKTOK_DEFAULT_REGIONS: str = "IN"

    # feature flags
    ENABLE_META_PUBLIC_ADS: bool = True
    ENABLE_GOOGLE_PUBLIC_ADS: bool = True
    ENABLE_TIKTOK_PUBLIC_ADS: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
