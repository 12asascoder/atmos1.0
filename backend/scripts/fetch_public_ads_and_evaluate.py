# scripts/fetch_public_ads_and_evaluate.py

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.competitor import Competitor
from app.models.public_ads_raw import PublicAdRaw
from app.models.public_ads_evaluation import PublicAdsEvaluation


# ============================================================
# 1) PER‑PLATFORM PUBLIC TRANSPARENCY FETCHERS (STUBS)
#    You will fill these with real HTTP calls later.
# ============================================================


def fetch_meta_public_ads(competitor: Competitor) -> List[Dict[str, Any]]:
    """
    Fetch public ads for this competitor from Meta's Ad / Content Library.

    Uses:
      - settings.META_AD_LIBRARY_ACCESS_TOKEN
      - settings.META_GRAPH_API_VERSION
      - settings.META_DEFAULT_COUNTRIES

    IMPORTANT:
      - This is just a stub. You must implement actual HTTP calls to Meta's
        transparency endpoints, respecting their terms and rate limits.
      - Return ads in the unified structure below.
    """
    if not settings.ENABLE_META_PUBLIC_ADS or not settings.META_AD_LIBRARY_ACCESS_TOKEN:
        return []

    # TODO: implement real Meta transparency fetch here.
    # For now we just return an empty list.
    return []


# def fetch_google_public_ads(competitor: Competitor) -> List[Dict[str, Any]]:
#     """
#     Fetch public ads for this competitor from Google / YouTube Ads Transparency.

#     Uses:
#       - settings.GOOGLE_TRANSPARENCY_API_KEY
#       - settings.GOOGLE_TRANSPARENCY_DEFAULT_REGIONS
#       - settings.GOOGLE_TRANSPARENCY_DEFAULT_LANG

#     IMPORTANT:
#       - This is just a stub. Implement real HTTP calls to Google's public
#         transparency endpoints if/when you get access.
#     """
#     if not settings.ENABLE_GOOGLE_PUBLIC_ADS or not settings.GOOGLE_TRANSPARENCY_API_KEY:
#         return []

#     # TODO: implement real Google transparency fetch here.
#     return []


# def fetch_tiktok_public_ads(competitor: Competitor) -> List[Dict[str, Any]]:
#     """
#     Fetch public ads for this competitor from TikTok Commercial Content Library.

#     Uses:
#       - settings.TIKTOK_COMMERCIAL_API_KEY
#       - settings.TIKTOK_DEFAULT_REGIONS

#     IMPORTANT:
#       - Stub only; requires official TikTok commercial library access.
#     """
#     if not settings.ENABLE_TIKTOK_PUBLIC_ADS or not settings.TIKTOK_COMMERCIAL_API_KEY:
#         return []

#     # TODO: implement real TikTok commercial library fetch here.
#     return []


def fetch_public_ads_for_competitor(competitor: Competitor) -> List[Dict[str, Any]]:
    """
    Orchestrator: call all enabled transparency sources and merge into
    a unified list of ads.

    Each returned ad MUST follow this structure:

    {
      "platform": "meta" | "google" | "tiktok" | ...,
      "transparency_ad_id": "string",          # ID from transparency API
      "first_seen_at": "2025-12-01T10:00:00Z", # ISO8601 or None
      "last_seen_at": "2025-12-09T10:00:00Z",  # ISO8601 or None
      "countries": ["IN", "US"],
      "page_name": "SNITCH",
      "headline": "50% Off New Drop",
      "primary_text": "Streetwear for everyday.",
      "landing_page_url": "https://snitch.co.in/collections/new",
      "media_type": "image" | "video" | "carousel",
      "media_urls": ["https://..."],
      "raw": {...}  # original API payload
    }
    """
    ads: List[Dict[str, Any]] = []

    ads += fetch_meta_public_ads(competitor)
    # ads += fetch_google_public_ads(competitor)
    # ads += fetch_tiktok_public_ads(competitor)

    return ads


# ============================================================
# 2) METRIC COMPUTATION FROM PUBLIC ADS
# ============================================================


def compute_public_metrics(ads: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compute company‑level metrics from a list of unified ad dicts.
    All metrics are derived only from public info (no spend/impressions).
    """
    now = datetime.now(timezone.utc)

    total_active_ads = len(ads)

    # platforms in use
    platforms = {ad.get("platform") for ad in ads if ad.get("platform")}
    platforms_active = len(platforms)

    # distinct countries
    countries = set()
    for ad in ads:
        for c in ad.get("countries") or []:
            countries.add(c)
    countries_count = len(countries)

    # time range
    first_seen_at: datetime | None = None
    last_seen_at: datetime | None = None

    for ad in ads:
        fs = ad.get("first_seen_at")
        ls = ad.get("last_seen_at") or fs
        if not fs:
            continue

        try:
            fs_dt = datetime.fromisoformat(fs.replace("Z", "+00:00"))
            ls_dt = datetime.fromisoformat(ls.replace("Z", "+00:00"))
        except Exception:
            continue

        if first_seen_at is None or fs_dt < first_seen_at:
            first_seen_at = fs_dt
        if last_seen_at is None or ls_dt > last_seen_at:
            last_seen_at = ls_dt

    days_since_first_seen = None
    days_since_last_seen = None
    if first_seen_at:
        days_since_first_seen = (now - first_seen_at).days
    if last_seen_at:
        days_since_last_seen = (now - last_seen_at).days

    # creative diversity
    creative_keys = set()
    message_keys = set()

    for ad in ads:
        head = (ad.get("headline") or "").strip()
        text = (ad.get("primary_text") or "").strip()
        lp = (ad.get("landing_page_url") or "").strip()
        media_type = ad.get("media_type") or ""
        media_urls = tuple(sorted(ad.get("media_urls") or []))

        key_creative = (media_type, media_urls, lp)
        key_message = (head, text)

        creative_keys.add(key_creative)
        message_keys.add(key_message)

    unique_creatives = len(creative_keys)
    unique_messages = len(message_keys)

    creative_diversity_score = 0.0
    if total_active_ads > 0:
        diversity_factor = (unique_creatives + unique_messages) / (2 * total_active_ads)
        diversity_factor = max(0.0, min(1.0, diversity_factor))
        creative_diversity_score = round(diversity_factor * 100, 2)

    # A/B‑ish behavior: group by landing page + first 80 chars of text
    from collections import defaultdict

    groups = defaultdict(list)
    for ad in ads:
        lp = (ad.get("landing_page_url") or "").strip()
        text = (ad.get("primary_text") or "").strip()
        key = (lp, text[:80])
        groups[key].append(ad)

    variant_groups = 0
    variant_counts: List[int] = []
    for g_ads in groups.values():
        if len(g_ads) > 1:
            variant_groups += 1
            variant_counts.append(len(g_ads))

    avg_variants_per_group = None
    if variant_counts:
        avg_variants_per_group = sum(variant_counts) / len(variant_counts)

    # intensity score – heuristic based on volume + platforms + recency
    intensity_score = 0.0
    if total_active_ads > 0:
        volume_factor = min(total_active_ads / 50.0, 1.0)      # 50+ ads = max
        platform_factor = min(platforms_active / 3.0, 1.0)     # 3+ platforms = max
        recency_factor = 1.0

        if days_since_last_seen is not None:
            if days_since_last_seen > 30:
                recency_factor = 0.2
            elif days_since_last_seen > 14:
                recency_factor = 0.5
            elif days_since_last_seen > 7:
                recency_factor = 0.7

        raw_score = (0.5 * volume_factor) + (0.2 * platform_factor) + (0.3 * recency_factor)
        intensity_score = round(raw_score * 100, 2)

    return {
        "total_active_ads": total_active_ads,
        "platforms_active": platforms_active,
        "countries_count": countries_count,
        "days_since_first_seen": days_since_first_seen,
        "days_since_last_seen": days_since_last_seen,
        "unique_creatives": unique_creatives,
        "unique_messages": unique_messages,
        "creative_diversity_score": creative_diversity_score,
        "variant_groups": variant_groups,
        "avg_variants_per_group": avg_variants_per_group,
        "intensity_score": intensity_score,
    }


# ============================================================
# 3) MAIN EVALUATION PIPELINE
# ============================================================


def run_public_ads_evaluation() -> None:
    """
    Main entry point:
      - For each competitor:
          * fetch public ads (Meta / Google / TikTok) using transparency APIs
          * upsert into public_ads_raw
          * compute metrics
          * insert a snapshot row into public_ads_evaluation
    """
    db: Session = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        competitors = db.query(Competitor).order_by(Competitor.name.asc()).all()
        print(f"[INFO] Found {len(competitors)} competitors")

        for competitor in competitors:
            print(f"\n[INFO] Fetching public ads for: {competitor.name} ({competitor.id})")

            ads = fetch_public_ads_for_competitor(competitor)

            # ---- 1) Upsert raw ads into public_ads_raw ----
            for ad in ads:
                platform = ad["platform"]
                transparency_ad_id = ad["transparency_ad_id"]

                existing = (
                    db.query(PublicAdRaw)
                    .filter(
                        PublicAdRaw.platform == platform,
                        PublicAdRaw.transparency_ad_id == transparency_ad_id,
                        PublicAdRaw.competitor_id == competitor.id,
                    )
                    .first()
                )

                first_seen_at = ad.get("first_seen_at")
                last_seen_at = ad.get("last_seen_at") or first_seen_at

                if existing:
                    # Update last_seen_at, fetched_at, and raw payload
                    existing.last_seen_at = last_seen_at or existing.last_seen_at
                    existing.fetched_at = now
                    existing.ad_data = ad.get("raw") or ad
                else:
                    new_row = PublicAdRaw(
                        competitor_id=competitor.id,
                        platform=platform,
                        transparency_ad_id=transparency_ad_id,
                        first_seen_at=first_seen_at,
                        last_seen_at=last_seen_at,
                        fetched_at=now,
                        ad_data=ad.get("raw") or ad,
                    )
                    db.add(new_row)

            db.flush()  # make sure raw rows are staged

            # ---- 2) Compute company‑level metrics from these ads ----
            metrics = compute_public_metrics(ads)

            evaluation = PublicAdsEvaluation(
                competitor_id=competitor.id,
                analyzed_at=now,
                total_active_ads=metrics["total_active_ads"],
                platforms_active=metrics["platforms_active"],
                countries_count=metrics["countries_count"],
                days_since_first_seen=metrics["days_since_first_seen"],
                days_since_last_seen=metrics["days_since_last_seen"],
                unique_creatives=metrics["unique_creatives"],
                unique_messages=metrics["unique_messages"],
                creative_diversity_score=metrics["creative_diversity_score"],
                variant_groups=metrics["variant_groups"],
                avg_variants_per_group=metrics["avg_variants_per_group"],
                intensity_score=metrics["intensity_score"],
                raw_metrics=metrics,
            )

            db.add(evaluation)

        db.commit()
        print("\n[INFO] Public ads evaluation completed.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Public ads evaluation failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_public_ads_evaluation()
