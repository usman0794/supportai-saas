from supabase import create_client, Client

from app.core.config import settings


# Create one Supabase client for storage and other server-side operations.
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)