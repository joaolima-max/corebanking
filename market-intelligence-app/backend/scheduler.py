import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from claude.briefing import generate_and_send_briefing
from collectors.crypto import collect_crypto
from collectors.market import collect_market
from collectors.news import collect_news
from collectors.regulatory import collect_regulatory
from config import BRIEFING_TIME, TIMEZONE

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone=TIMEZONE)


def start_scheduler() -> None:
    briefing_hour, briefing_minute = (int(part) for part in BRIEFING_TIME.split(":"))

    scheduler.add_job(collect_market, "interval", minutes=15, id="collect_market")
    scheduler.add_job(collect_crypto, "interval", minutes=15, id="collect_crypto")
    scheduler.add_job(collect_news, "interval", minutes=30, id="collect_news")
    scheduler.add_job(
        collect_regulatory, CronTrigger(hour=6, minute=0), id="collect_regulatory"
    )
    scheduler.add_job(
        generate_and_send_briefing,
        CronTrigger(hour=briefing_hour, minute=briefing_minute),
        id="generate_briefing",
    )

    scheduler.start()
    logger.info("Scheduler iniciado (timezone=%s)", TIMEZONE)


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
