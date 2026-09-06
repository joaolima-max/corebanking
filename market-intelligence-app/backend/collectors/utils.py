import calendar
from datetime import datetime, timezone
from typing import Optional


def parse_rss_date(entry) -> Optional[str]:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return None
    return datetime.fromtimestamp(calendar.timegm(parsed), tz=timezone.utc).isoformat()
