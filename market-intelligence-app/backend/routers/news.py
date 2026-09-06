from typing import Optional

from fastapi import APIRouter, Query

from database import get_supabase

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("")
def get_news(category: Optional[str] = Query(default=None)):
    supabase = get_supabase()
    query = supabase.table("news_items").select("*").order("published_at", desc=True).limit(50)
    if category:
        query = query.eq("category", category)
    result = query.execute()
    return result.data
