# app/api/v1/competitors.py
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.competitor import CompetitorCreate, CompetitorResponse
from app.services import competitor_service

router = APIRouter(prefix="/competitors", tags=["competitors"])


# For now, we fake user_id as None or a fixed ID.
# Later you can plug Supabase auth here.
def get_current_user_id() -> Optional[UUID]:
    return None  # TODO: replace with real auth


@router.post(
    "",
    response_model=CompetitorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_competitor(
    payload: CompetitorCreate,
    db: Session = Depends(get_db),
    user_id: Optional[UUID] = Depends(get_current_user_id),
):
    competitor = competitor_service.create_competitor(db, user_id, payload)
    return competitor


@router.get(
    "",
    response_model=List[CompetitorResponse],
)
def list_all_competitors(
    db: Session = Depends(get_db),
    user_id: Optional[UUID] = Depends(get_current_user_id),
):
    competitors = competitor_service.list_competitors(db, user_id)
    return competitors


@router.delete(
    "/{competitor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_competitor(
    competitor_id: UUID,
    db: Session = Depends(get_db),
    user_id: Optional[UUID] = Depends(get_current_user_id),
):
    ok = competitor_service.delete_competitor(db, competitor_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return
