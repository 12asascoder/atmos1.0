# app/services/competitor_service.py

from typing import List
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.competitor import Competitor
from app.schemas.competitor import CompetitorCreate


def create_competitor(db: Session, user_id: UUID | None, data: CompetitorCreate) -> Competitor:
    competitor = Competitor(
        user_id=user_id,
        name=data.name,
        domain=data.domain,
        social_handles=data.social_handles,
        industry=data.industry,
    )
    db.add(competitor)
    db.commit()
    db.refresh(competitor)
    return competitor


def list_competitors(db: Session, user_id: UUID | None = None) -> list[Competitor]:
    query = db.query(Competitor)
    if user_id:
        query = query.filter(Competitor.user_id == user_id)
    return query.order_by(Competitor.name.asc()).all()


def delete_competitor(db: Session, competitor_id: UUID) -> bool:
    competitor = db.query(Competitor).filter(Competitor.id == competitor_id).first()
    if not competitor:
        return False
    db.delete(competitor)
    db.commit()
    return True
