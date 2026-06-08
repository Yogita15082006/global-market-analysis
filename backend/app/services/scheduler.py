import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config.settings import get_settings
from app.services.news_service import NewsService

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def _scheduled_news_fetch() -> None:
    settings = get_settings()
    if not settings.news_fetch_enabled:
        logger.info("Scheduled news fetch skipped (NEWS_FETCH_ENABLED=false)")
        return

    try:
        stats = await NewsService().collect_all()
        logger.info(
            "Scheduled news fetch finished",
            extra={
                "inserted": stats.inserted,
                "skipped": stats.skipped_duplicates,
                "errors": stats.errors,
            },
        )
    except Exception as exc:
        logger.exception("Scheduled news fetch failed: %s", exc)


def start_scheduler() -> None:
    settings = get_settings()
    if not settings.news_fetch_enabled:
        logger.info("News scheduler disabled (NEWS_FETCH_ENABLED=false)")
        return

    interval = settings.news_fetch_interval_minutes
    scheduler.add_job(
        _scheduled_news_fetch,
        "interval",
        minutes=interval,
        id="news_collection",
        replace_existing=True,
    )
    
    # Add Phase 9 automation jobs
    from app.services.momentum_service import MomentumService
    from app.services.briefing_service import BriefingService
    
    async def run_momentum():
        await MomentumService().snapshot_all_active_events()
        
    async def run_morning_brief():
        await BriefingService().generate_daily_briefing("morning")
        
    async def run_evening_brief():
        await BriefingService().generate_daily_briefing("evening")

    async def run_weekly_brief():
        await BriefingService().generate_daily_briefing("weekly")

    # Momentum every 12 hours
    scheduler.add_job(run_momentum, "interval", hours=12, id="momentum_snapshots", replace_existing=True)
    
    # Morning brief at 7:00 AM UTC
    scheduler.add_job(run_morning_brief, "cron", hour=7, minute=0, id="morning_brief", replace_existing=True)
    
    # Evening brief at 19:00 PM UTC
    scheduler.add_job(run_evening_brief, "cron", hour=19, minute=0, id="evening_brief", replace_existing=True)
    
    # Weekly brief on Sunday 20:00 UTC
    scheduler.add_job(run_weekly_brief, "cron", day_of_week="sun", hour=20, minute=0, id="weekly_brief", replace_existing=True)

    scheduler.start()
    logger.info("News scheduler started", extra={"interval_minutes": interval})


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("News scheduler stopped")
