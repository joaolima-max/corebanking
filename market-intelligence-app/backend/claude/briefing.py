import logging
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from anthropic import Anthropic

from config import ANTHROPIC_API_KEY, CLAUDE_MODEL, TIMEZONE
from database import get_supabase
from delivery.email import send_briefing_email

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Você é um analista sênior de mercado financeiro brasileiro.
Produza um briefing executivo diário em português para um executivo do setor financeiro.
Seja direto, preciso e objetivo.
Evite linguagem genérica.
Destaque apenas o que é realmente relevante.
Não invente dados — use apenas o que foi fornecido."""

BRIEFING_TEMPLATE = """MARKET INTELLIGENCE BRIEFING
[Data por extenso] — [Dia da semana]

━━━ RESUMO EXECUTIVO ━━━
[3-5 linhas com os movimentos mais relevantes do dia]

━━━ MERCADOS ━━━
IBOVESPA:  [valor]  [variação%]
S&P 500:   [valor]  [variação%]
Nasdaq:    [valor]  [variação%]
Dólar:     [valor]  [variação%]
Bitcoin:   [valor]  [variação%]

━━━ DESTAQUES DO DIA ━━━
• [Notícia com implicação prática — 1-2 linhas]
• [Notícia com implicação prática — 1-2 linhas]
• [Notícia com implicação prática — 1-2 linhas]

━━━ REGULATÓRIO BR ━━━
• [Novidade BCB/CVM se houver]
[Se não houver: "Sem novidades regulatórias relevantes hoje."]

━━━ FINTECH & STARTUPS ━━━
• [Movimento relevante do ecossistema se houver]

━━━ PARA FICAR DE OLHO ━━━
[1-2 temas que merecem atenção nos próximos dias]"""

MESES_PT = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]
DIAS_SEMANA_PT = [
    "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
    "sexta-feira", "sábado", "domingo",
]


def _data_por_extenso(d: date) -> str:
    return f"{d.day} de {MESES_PT[d.month - 1]} de {d.year}"


def _dia_semana_pt(d: date) -> str:
    return DIAS_SEMANA_PT[d.weekday()]


def _latest_market_snapshots(supabase) -> list:
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    result = (
        supabase.table("market_snapshots")
        .select("*")
        .gte("collected_at", since)
        .order("collected_at", desc=True)
        .execute()
    )
    latest_by_symbol = {}
    for row in result.data:
        latest_by_symbol.setdefault(row["symbol"], row)
    return list(latest_by_symbol.values())


def _recent_news(supabase, limit: int = 30) -> list:
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    result = (
        supabase.table("news_items")
        .select("*")
        .gte("collected_at", since)
        .order("published_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


def _todays_regulatory(supabase) -> list:
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    result = (
        supabase.table("regulatory_items")
        .select("*")
        .gte("collected_at", since)
        .order("collected_at", desc=True)
        .execute()
    )
    return result.data


def _build_payload(market: list, news: list, regulatory: list) -> dict:
    return {
        "mercados": [
            {
                "simbolo": item["symbol"],
                "nome": item["name"],
                "preco": item["price"],
                "variacao_pct": item["change_pct"],
            }
            for item in market
        ],
        "noticias": [
            {
                "titulo": item["title"],
                "resumo": item.get("summary"),
                "fonte": item["source"],
                "categoria": item["category"],
                "url": item.get("url"),
            }
            for item in news
        ],
        "regulatorio": [
            {
                "titulo": item["title"],
                "fonte": item["source"],
                "resumo": item.get("body"),
            }
            for item in regulatory
        ],
    }


def generate_briefing() -> str:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY não configurada")

    supabase = get_supabase()
    today = datetime.now(ZoneInfo(TIMEZONE)).date()

    market = _latest_market_snapshots(supabase)
    news = _recent_news(supabase)
    regulatory = _todays_regulatory(supabase)
    payload = _build_payload(market, news, regulatory)

    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    user_message = (
        f"Data: {_data_por_extenso(today)} ({_dia_semana_pt(today)})\n\n"
        f"Dados coletados nas últimas 24h (JSON):\n{payload}\n\n"
        f"Gere o briefing seguindo exatamente esta estrutura:\n\n{BRIEFING_TEMPLATE}"
    )

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )
    content = response.content[0].text

    supabase.table("briefings").upsert(
        {"date": today.isoformat(), "content": content, "model_used": CLAUDE_MODEL},
        on_conflict="date",
    ).execute()

    return content


def generate_and_send_briefing() -> None:
    try:
        content = generate_briefing()
    except Exception:
        logger.exception("Falha ao gerar briefing diário")
        return

    try:
        send_briefing_email(content)
    except Exception:
        logger.exception("Falha ao enviar briefing por email")
