from supabase import Client, create_client

from config import SUPABASE_SERVICE_KEY, SUPABASE_URL

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar definidos no .env"
            )
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client
