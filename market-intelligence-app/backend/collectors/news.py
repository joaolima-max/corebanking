import logging

import feedparser
import requests

from config import NEWS_API_KEY
from database import get_supabase

from .utils import parse_rss_date

logger = logging.getLogger(__name__)

NEWSAPI_URL = "https://newsapi.org/v2/everything"

RSS_FEEDS = [
    ("Finsiders", "https://finsiders.com.br/feed/", "fintech"),
    ("Startups", "https://startups.com.br/feed/", "startup"),
    ("Google News Economia", "https://news.google.com/rss/search?q=economia+brasil&hl=pt-BR", "market"),
]

FINTECH_KEYWORDS = ["fintech", "banco digital", "open finance", "pagamento", "pix"]
STARTUP_KEYWORDS = ["startup", "investimento anjo", "venture capital", "rodada", "captação"]
MARKET_KEYWORDS = ["bolsa", "ibovespa", "dólar", "juros", "selic", "mercado", "ação", "ações"]


def _categorize(text: str) -> str:
    text = text.lower()
    if any(keyword in text for keyword in FINTECH_KEYWORDS):
        return "fintech"
    if any(keyword in text for keyword in STARTUP_KEYWORDS):
        return "startup"
    if any(keyword in text for keyword in MARKET_KEYWORDS):
        return "market"
    return "global"


def _already_collected(supabase, url: str) -> bool:
    if not url:
        return False
    result = supabase.table("news_items").select("id").eq("url", url).limit(1).execute()
    return len(result.data) > 0


def _save_item(supabase, title, summary, source, category, url, published_at) -> bool:
    if not title:
        return False
    try:
        if _already_collected(supabase, url):
            return False
        supabase.table("news_items").insert(
            {
                "title": title,
                "summary": summary,
                "source": source,
                "category": category,
                "url": url,
                "published_at": published_at,
            }
        ).execute()
        return True
    except Exception:
        logger.exception("Falha ao salvar notícia: %s", title)
        return False


def _collect_newsapi() -> None:
    supabase = get_supabase()
    if not NEWS_API_KEY:
        logger.warning("NEWS_API_KEY não configurada, pulando NewsAPI")
        return

    try:
        params = {
            "q": "mercado financeiro OR fintech OR economia Brasil",
            "language": "pt",
            "sortBy": "publishedAt",
            "pageSize": 20,
            "apiKey": NEWS_API_KEY,
        }
        response = requests.get(NEWSAPI_URL, params=params, timeout=10)
        response.raise_for_status()
        articles = response.json().get("articles", [])
    except Exception:
        logger.exception("Falha ao buscar notícias na NewsAPI")
        return

    saved = 0
    for article in articles:
        title = article.get("title")
        description = article.get("description")
        category = _categorize(f"{title or ''} {description or ''}")
        if _save_item(
            supabase,
            title=title,
            summary=description,
            source=(article.get("source") or {}).get("name", "NewsAPI"),
            category=category,
            url=article.get("url"),
            published_at=article.get("publishedAt"),
        ):
            saved += 1
    logger.info("NewsAPI: %d notícias novas", saved)


def _collect_rss() -> None:
    supabase = get_supabase()
    for source_name, feed_url, default_category in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
        except Exception:
            logger.exception("Falha ao ler RSS de %s", source_name)
            continue

        saved = 0
        for entry in feed.entries:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            category = (
                _categorize(f"{title} {summary}")
                if default_category == "market"
                else default_category
            )
            if _save_item(
                supabase,
                title=title,
                summary=summary,
                source=source_name,
                category=category,
                url=entry.get("link"),
                published_at=parse_rss_date(entry),
            ):
                saved += 1
        logger.info("%s: %d notícias novas", source_name, saved)


def collect_news() -> None:
    try:
        _collect_newsapi()
    except Exception:
        logger.exception("Erro inesperado ao coletar NewsAPI")

    try:
        _collect_rss()
    except Exception:
        logger.exception("Erro inesperado ao coletar RSS")
