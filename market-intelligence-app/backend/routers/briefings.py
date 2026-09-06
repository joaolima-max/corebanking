from datetime import date

from fastapi import APIRouter, HTTPException

from claude.briefing import generate_and_send_briefing
from database import get_supabase

router = APIRouter(prefix="/api/briefings", tags=["briefings"])


@router.get("/today")
def get_today_briefing():
    supabase = get_supabase()
    today = date.today().isoformat()
    result = supabase.table("briefings").select("*").eq("date", today).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Briefing de hoje ainda não foi gerado")
    return result.data[0]


@router.get("/{briefing_date}")
def get_briefing_by_date(briefing_date: str):
    supabase = get_supabase()
    result = (
        supabase.table("briefings").select("*").eq("date", briefing_date).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Briefing não encontrado para esta data")
    return result.data[0]


@router.post("/generate")
def trigger_briefing_generation():
    generate_and_send_briefing()
    return {"status": "ok", "message": "Briefing gerado com sucesso"}
