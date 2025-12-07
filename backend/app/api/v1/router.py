# app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1 import competitors

api_router = APIRouter()
api_router.include_router(competitors.router)
