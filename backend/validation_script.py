import asyncio
import sys

sys.path.append("c:/global/backend")
from app.database.supabase_client import get_supabase

def run_validations():
    db = get_supabase()
    
    print("=== 3. Marketaux Validation ===")
    res = db.table("events").select("source", count="exact").execute()
    sources = {}
    for row in res.data:
        s = row.get("source", "Unknown")
        # Extract base source
        if "Marketaux" in s:
            s = "Marketaux"
        elif "Reuters" in s:
            s = "Reuters"
        elif "AP News" in s:
            s = "AP News"
        elif "GNews" in s:
            s = "GNews"
        elif "BBC" in s:
            s = "BBC News"
        elif "CNBC" in s:
            s = "CNBC"
        sources[s] = sources.get(s, 0) + 1
        
    for source, count in sources.items():
        print(f"{source}: {count} events")
        
    print("\n=== 4. Event Clustering Validation ===")
    res_clustered = db.table("events").select("id, title, source_count").gte("source_count", 2).limit(5).execute()
    print(f"Found {len(res_clustered.data)} events with source_count > 1")
    for row in res_clustered.data:
        print(f"Event: {row['title'][:60]}... | Sources: {row['source_count']}")
        
    res_sources = db.table("event_sources").select("title, source, url").limit(5).execute()
    print(f"\nSample clustered URLs from event_sources table:")
    for row in res_sources.data:
        print(f"- {row['source']}: {row['title'][:40]}... ({row['url']})")

if __name__ == "__main__":
    run_validations()
