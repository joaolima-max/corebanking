import logging

import requests

from config import COINGECKO_API_KEY
from database import get_supabase

logger = logging.getLogger(__name__)

COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets"
PRIORITY_COIN_IDS = {"bitcoin", "ethereum"}


def _fetch_coins() -> list:
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 10,
        "page": 1,
        "sparkline": "false",
    }
    headers = {"x-cg-demo-api-key": COINGECKO_API_KEY} if COINGECKO_API_KEY else {}
    response = requests.get(COINGECKO_URL, params=params, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()


def collect_crypto() -> None:
    supabase = get_supabase()

    try:
        coins = _fetch_coins()
    except Exception:
        logger.exception("Falha ao buscar dados da CoinGecko")
        return

    priority = [c for c in coins if c.get("id") in PRIORITY_COIN_IDS]
    others = [c for c in coins if c.get("id") not in PRIORITY_COIN_IDS][:5]
    selected = priority + others

    saved = 0
    for coin in selected:
        try:
            supabase.table("market_snapshots").insert(
                {
                    "symbol": coin["symbol"].upper(),
                    "name": coin["name"],
                    "price": coin["current_price"],
                    "change_pct": round(coin.get("price_change_percentage_24h") or 0.0, 2),
                    "volume": coin.get("total_volume"),
                }
            ).execute()
            saved += 1
        except Exception:
            logger.exception("Falha ao salvar cripto %s", coin.get("id"))

    logger.info("Cripto coletada: %d ativos", saved)
