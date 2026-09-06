import logging

import yfinance as yf

from database import get_supabase

logger = logging.getLogger(__name__)

SYMBOLS = [
    ("^BVSP", "Ibovespa"),
    ("^GSPC", "S&P 500"),
    ("^IXIC", "Nasdaq"),
    ("USDBRL=X", "Dólar"),
]


def _clean_symbol(ticker: str) -> str:
    return ticker.replace("^", "").replace("=X", "")


def collect_market() -> None:
    supabase = get_supabase()
    for ticker, name in SYMBOLS:
        try:
            history = yf.Ticker(ticker).history(period="2d", interval="15m")
            if history.empty:
                logger.warning("Sem dados retornados para %s", ticker)
                continue

            last = history.iloc[-1]
            first = history.iloc[0]
            price = float(last["Close"])
            prev_close = float(first["Close"]) if len(history) > 1 else price
            change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0.0
            volume = float(last["Volume"]) if last.get("Volume") == last.get("Volume") else None

            supabase.table("market_snapshots").insert(
                {
                    "symbol": _clean_symbol(ticker),
                    "name": name,
                    "price": price,
                    "change_pct": round(change_pct, 2),
                    "volume": volume,
                }
            ).execute()
            logger.info("Mercado coletado: %s (%s)", name, ticker)
        except Exception:
            logger.exception("Falha ao coletar dados de mercado para %s", ticker)
