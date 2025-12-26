# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.router import api_router

# Create DB tables (for dev). In production you might use migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS (allow frontend to talk to backend during dev)
origins = [
    "http://localhost:3000",  # Next.js dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {"message": "Snitch Competitor Surveillance API is running"}

import subprocess
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

scripts = [
    # Authentication
    ["python", os.path.join(BASE_DIR, "app/api/Authentication/auth.py")],

    # AutoCreate
    ["python", os.path.join(BASE_DIR, "app/api/AutoCreate/campaign_goal.py")],
    ["python", os.path.join(BASE_DIR, "app/api/AutoCreate/copy_messaging.py")],
    ["python", os.path.join(BASE_DIR, "app/api/AutoCreate/audience_step.py")],
    ["python", os.path.join(BASE_DIR, "app/api/AutoCreate/budget_testing.py")],


    # CommandCenter
    ["python", os.path.join(BASE_DIR, "app/api/commandCenter/api_call.py")],
    #["python", os.path.join(BASE_DIR, "app/api/commandCenter/generate_ad.py")]
]

processes = []

def run_scripts():
    for script in scripts:
        print(f"🚀 Starting: {' '.join(script)}")
        process = subprocess.Popen(script)
        processes.append(process)

    for process in processes:
        process.wait()

if __name__ == "__main__":
    try:
        run_scripts()
    except KeyboardInterrupt:
        print("\n🛑 Stopping all services...")
        for process in processes:
            process.terminate()
        sys.exit(0)

