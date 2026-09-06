from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class Briefing(BaseModel):
    id: str
    date: date
    content: str
    generated_at: datetime
    model_used: Optional[str] = None


class NewsItem(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    source: str
    category: str
    url: Optional[str] = None
    published_at: Optional[datetime] = None
    collected_at: datetime


class MarketSnapshot(BaseModel):
    id: str
    symbol: str
    name: str
    price: float
    change_pct: float
    volume: Optional[float] = None
    collected_at: datetime


class RegulatoryItem(BaseModel):
    id: str
    title: str
    body: Optional[str] = None
    source: str
    published_at: Optional[datetime] = None
    collected_at: datetime
