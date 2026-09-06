from fastapi import APIRouter

from database import get_supabase

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/snapshot")
def get_market_snapshot():
    supabase = get_supabase()
    result = (
        supabase.table("market_snapshots")
        .select("*")
        .order("collected_at", desc=True)
        .limit(100)
        .execute()
    )
    latest_by_symbol = {}
    for row in result.data:
        latest_by_symbol.setdefault(row["symbol"], row)
    return list(latest_by_symbol.values())
