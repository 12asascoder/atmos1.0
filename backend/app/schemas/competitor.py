# app/schemas/competitor.py
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, HttpUrl, Field


class CompetitorBase(BaseModel):
    name: str = Field(..., example="Zara")
    domain: Optional[str] = Field(None, example="zara.com")
    social_handles: Optional[Dict[str, str]] = Field(
        default=None,
        example={"instagram": "@zara", "tiktok": "@zara"}
    )
    industry: Optional[str] = Field(None, example="Fashion")


class CompetitorCreate(CompetitorBase):
    """Fields expected when creating a competitor."""
    pass


class CompetitorInDBBase(CompetitorBase):
    id: UUID

    class Config:
        from_attributes = True  # for SQLAlchemy models (Pydantic v2) / orm_mode=True in v1


class CompetitorResponse(CompetitorInDBBase):
    """What we return to the client."""
    first_seen_at: datetime
    last_updated_at: datetime
