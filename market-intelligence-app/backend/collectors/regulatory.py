import logging

import feedparser
import requests

from database import get_supabase

from .utils import parse_rss_date

logger = logging.getLogger(__name__)

BCB_URL = "https://www.bcb.gov.br/api/servico/sitebcb/noticias?quantidade=10"
CVM_RSS_URL = "https://www.gov.br/cvm/pt-br/assuntos/noticias/RSS"


def _already_collected(supabase, source: str, title: str) -> bool:
    result = (
        supabase.table("regulatory_items")
        .select("id")
        .eq("source", source)
        .eq("title", title)
        .limit(1)
        .execute()
    )
    return len(result.data) > 0


def _collect_bcb() -> None:
    supabase = get_supabase()
    try:
        response = requests.get(BCB_URL, timeout=10)
        response.raise_for_status()
        items = response.json().get("conteudo", [])
    except Exception:
        logger.exception("Falha ao buscar notícias do BCB")
        return

    saved = 0
    for item in items:
        title = item.get("Titulo") or item.get("titulo")
        if not title or _already_collected(supabase, "BCB", title):
            continue
        try:
            supabase.table("regulatory_items").insert(
                {
                    "title": title,
                    "body": item.get("Descricao") or item.get("descricao"),
                    "source": "BCB",
                    "published_at": item.get("DataPublicacao") or item.get("dataPublicacao"),
                }
            ).execute()
            saved += 1
        except Exception:
            logger.exception("Falha ao salvar comunicado BCB: %s", title)
    logger.info("BCB: %d comunicados novos", saved)


def _collect_cvm() -> None:
    supabase = get_supabase()
    try:
        feed = feedparser.parse(CVM_RSS_URL)
    except Exception:
        logger.exception("Falha ao ler RSS da CVM")
        return

    saved = 0
    for entry in feed.entries:
        title = entry.get("title", "")
        if not title or _already_collected(supabase, "CVM", title):
            continue
        try:
            supabase.table("regulatory_items").insert(
                {
                    "title": title,
                    "body": entry.get("summary"),
                    "source": "CVM",
                    "published_at": parse_rss_date(entry),
                }
            ).execute()
            saved += 1
        except Exception:
            logger.exception("Falha ao salvar comunicado CVM: %s", title)
    logger.info("CVM: %d comunicados novos", saved)


def collect_regulatory() -> None:
    try:
        _collect_bcb()
    except Exception:
        logger.exception("Erro inesperado ao coletar BCB")

    try:
        _collect_cvm()
    except Exception:
        logger.exception("Erro inesperado ao coletar CVM")
