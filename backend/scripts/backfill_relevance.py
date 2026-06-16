import asyncio
import os
import sys
from pathlib import Path

# Add backend dir to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database.supabase_client import get_supabase, EVENTS_TABLE
from app.services.relevance_filter import is_relevant_event

async def backfill():
    db = get_supabase()
    
    print("Fetching events with NULL relevance_score...")
    
    # We paginate to get all
    offset = 0
    limit = 1000
    events_to_update = []
    
    while True:
        response = db.table(EVENTS_TABLE).select("id, title, description, is_analyzed, source_count").is_("relevance_score", "null").range(offset, offset + limit - 1).execute()
        events = response.data
        if not events:
            break
            
        print(f"Loaded batch of {len(events)} events (offset {offset})...")
        for event in events:
            events_to_update.append(event)
        offset += limit

    print(f"Total events to backfill relevance: {len(events_to_update)}")

    # Update concurrently
    async def update_event(event):
        try:
            # Let's also do the event_source count here
            count_resp = db.table("event_sources").select("id", count="exact").eq("event_id", event["id"]).execute()
            actual_count = count_resp.count

            relevant, reason, score, priority = is_relevant_event(event.get("title") or "", event.get("description"))
            
            update_data = {
                "relevance_score": score,
                "intelligence_priority": priority
            }
            if actual_count is not None and actual_count != event.get("source_count"):
                update_data["source_count"] = actual_count
                
            db.table(EVENTS_TABLE).update(update_data).eq("id", event["id"]).execute()
            return True
        except Exception as e:
            print(f"Error updating {event['id']}: {e}")
            return False

    # limit concurrency
    sem = asyncio.Semaphore(50)
    async def sem_update(event):
        async with sem:
            # We run the synchronous supabase client inside a thread since it's blocking
            return await asyncio.to_thread(update_event_sync, event)
            
    def update_event_sync(event):
        try:
            count_resp = db.table("event_sources").select("id", count="exact").eq("event_id", event["id"]).execute()
            actual_count = count_resp.count

            relevant, reason, score, priority = is_relevant_event(event.get("title") or "", event.get("description"))
            
            update_data = {
                "relevance_score": score,
                "intelligence_priority": priority
            }
            if actual_count is not None and actual_count != event.get("source_count"):
                update_data["source_count"] = actual_count
                
            db.table(EVENTS_TABLE).update(update_data).eq("id", event["id"]).execute()
            return True
        except Exception as e:
            print(f"Error updating {event['id']}: {e}")
            return False

    tasks = [sem_update(e) for e in events_to_update]
    print("Starting updates...")
    results = await asyncio.gather(*tasks)
    
    print(f"Successfully updated {sum(results)} events.")

if __name__ == "__main__":
    asyncio.run(backfill())
