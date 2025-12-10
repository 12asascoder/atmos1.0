from sqlalchemy import Column, String, JSON, TIMESTAMP, func, BigInteger
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)

    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=True)

    social_handles = Column(JSON, nullable=True)

    industry = Column(String(100), nullable=True)
    estimated_monthly_spend = Column(BigInteger, nullable=True, default=0)

    first_seen_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    #IMPORTANT: now matches your DB column "extra_metadata"
    extra_metadata = Column(JSON, nullable=True)
