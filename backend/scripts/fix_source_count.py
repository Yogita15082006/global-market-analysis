import asyncio
import os
import sys
from pathlib import Path

# Add backend dir to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database.supabase_client import get_supabase, EVENTS_TABLE

async def update_source_counts():
    db = get_supabase()
    
    print("Fetching ALL events to fix source_count...")
    
    offset = 0
    limit = 1000
    events_to_update = []
    
    while True:
        response = db.table(EVENTS_TABLE).select("id, source_count").range(offset, offset + limit - 1).execute()
        events = response.data
        if not events:
            break
            
        print(f"Loaded batch of {len(events)} events (offset {offset})...")
        for event in events:
            events_to_update.append(event)
        offset += limit

    print(f"Total events to check: {len(events_to_update)}")

    sem = asyncio.Semaphore(5)
    async def sem_update(event):
        async with sem:
            for attempt in range(3):
                try:
                    return await asyncio.to_thread(update_event_sync, event)
                except Exception as e:
                    if attempt == 2:
                        return False
                    await asyncio.sleep(1)
            
    def update_event_sync(event):
        try:
            count_resp = db.table("event_sources").select("id", count="exact").eq("event_id", event["id"]).execute()
            actual_count = count_resp.count

            if actual_count is not None and actual_count != event.get("source_count"):
                db.table(EVENTS_TABLE).update({"source_count": actual_count}).eq("id", event["id"]).execute()
                return True
            return False
        except Exception as e:
            print(f"Error updating {event['id']}: {e}")
            return False

    tasks = [sem_update(e) for e in events_to_update]
    print("Starting updates...")
    results = await asyncio.gather(*tasks)
    
    print(f"Successfully updated source_count for {sum(results)} events.")

if __name__ == "__main__":
    asyncio.run(update_source_counts())
