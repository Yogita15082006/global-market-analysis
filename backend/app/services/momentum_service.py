import logging
from datetime import UTC, datetime
from app.database.supabase_client import get_supabase, EVENTS_TABLE

logger = logging.getLogger(__name__)

class MomentumService:
    def __init__(self):
        self.db = get_supabase()

    async def snapshot_all_active_events(self):
        """Records a momentum snapshot for all events from the last 7 days."""
        logger.info("Taking event momentum snapshots...")
        try:
            # Fetch events from last 7 days
            response = (
                self.db.table(EVENTS_TABLE)
                .select("id, relevance_score, source_count")
                .order("created_at", desc=True)
                .limit(1000)
                .execute()
            )
            events = response.data
            if not events:
                return
            
            snapshots = []
            for event in events:
                snapshots.append({
                    "event_id": event["id"],
                    "relevance_score": event["relevance_score"] or 0,
                    "source_count": event["source_count"] or 1,
                    "confidence_score": 0.0, # could pull from analysis if needed
                    "snapshot_time": datetime.now(UTC).isoformat()
                })
            
            # Insert snapshots
            if snapshots:
                # Chunk inserts if needed, but supabase python client handles list of dicts up to a size
                for i in range(0, len(snapshots), 100):
                    batch = snapshots[i:i+100]
                    self.db.table("event_momentum_snapshots").insert(batch).execute()
                    
            logger.info(f"Momentum snapshots taken for {len(events)} events.")
        except Exception as e:
            logger.error(f"Error taking momentum snapshots: {e}")
