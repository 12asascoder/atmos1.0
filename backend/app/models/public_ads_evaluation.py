# app/models/public_ads_evaluation.py

from __future__ import annotations

import uuid

from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    JSON,
    TIMESTAMP,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class PublicAdsEvaluation(Base):
    __tablename__ = "public_ads_evaluation"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    competitor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("competitors.id", ondelete="CASCADE"),
        nullable=False,
    )

    analyzed_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # basic volume + presence
    total_active_ads = Column(Integer, nullable=True)
    platforms_active = Column(Integer, nullable=True)
    countries_count = Column(Integer, nullable=True)

    # creative diversity
    unique_creatives = Column(Integer, nullable=True)
    unique_messages = Column(Integer, nullable=True)
    # 0–100 score
    creative_diversity_score = Column(Numeric(5, 2), nullable=True)

    # time signals (in days)
    days_since_first_seen = Column(Integer, nullable=True)
    days_since_last_seen = Column(Integer, nullable=True)

    # intensity score (0–100) based on volume + recency + platforms
    intensity_score = Column(Numeric(5, 2), nullable=True)

    # A/B-ish behavior
    variant_groups = Column(Integer, nullable=True)
    avg_variants_per_group = Column(Numeric(5, 2), nullable=True)

    # full detail / breakdowns (per-platform stats, etc.)
    raw_metrics = Column(JSON, nullable=False, default=dict)

