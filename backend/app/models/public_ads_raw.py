# app/models/public_ads_raw.py

from __future__ import annotations

import uuid

from sqlalchemy import (
    Column,
    Text,
    String,
    JSON,
    TIMESTAMP,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class PublicAdRaw(Base):
    __tablename__ = "public_ads_raw"
    __table_args__ = (
        UniqueConstraint(
            "platform",
            "transparency_ad_id",
            name="public_ads_raw_unique",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    competitor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("competitors.id", ondelete="CASCADE"),
        nullable=False,
    )

    # 'meta', 'google', 'tiktok', 'snapchat', etc.
    platform = Column(String(50), nullable=False)

    # ID from transparency API (Meta Ad Library, Google Transparency, etc.)
    transparency_ad_id = Column(Text, nullable=False)

    first_seen_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_seen_at = Column(TIMESTAMP(timezone=True), nullable=True)

    fetched_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Full raw JSON payload from transparency API
    ad_data = Column(JSON, nullable=False)
