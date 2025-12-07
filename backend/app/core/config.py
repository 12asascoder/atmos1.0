# app/core/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Snitch Competitor Surveillance"
    API_V1_STR: str = "/api/v1"

    # Supabase Postgres URL
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set in .env")

settings = Settings()
