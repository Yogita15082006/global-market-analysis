import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_KEY", "")

supabase: Client = create_client(url, key)

try:
    res = supabase.table("event_sources").select("*").limit(1).execute()
    print("event_sources:", res)
except Exception as e:
    print("Error querying event_sources:", e)

try:
    res = supabase.rpc("search_events_deep", {"query_text": "test"}).execute()
    print("search_events_deep:", res)
except Exception as e:
    print("Error querying search_events_deep:", e)

