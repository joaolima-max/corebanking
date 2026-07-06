from fastapi import APIRouter

from database import get_supabase

router = APIRouter(prefix="/api/regulatory", tags=["regulatory"])


@router.get("/latest")
def get_latest_regulatory():
    supabase = get_supabase()
    result = (
        supabase.table("regulatory_items")
        .select("*")
        .order("published_at", desc=True)
        .limit(20)
        .execute()
    )
    return result.data
