"""
Purge sports and entertainment records from the database.
Run: python purge_sports.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.supabase_client import get_supabase
from app.services.relevance_filter import IGNORE_PATTERNS
import re

SPORTS_TERMS = [
    "football", "soccer", "cricket", "basketball", "tennis", "baseball",
    "hockey", "rugby", "wrestling", "golf", "boxing", "mma",
    "nfl", "nba", "nhl", "mlb", "ipl",
    "premier league", "bundesliga", "serie a", "la liga",
    "champions league", "world cup", "olympics", "olympic",
    "super bowl", "grand prix", "formula one", "formula 1", "f1 race",
    "eriksen", "messi", "ronaldo", "neymar", "lebron", "curry",
    "match result", "final score", "league table", "transfer fee",
    "celebrity", "entertainment", "bollywood", "hollywood",
    "actor", "actress", "singer", "pop star", "movie", "film premiere",
    "box office", "reality show", "tv show",
]

def build_pattern(term: str) -> str:
    return rf"\b{re.escape(term)}\b"


def is_sports(title: str, description: str = "") -> bool:
    text = f"{title} {description}".lower()
    for term in SPORTS_TERMS:
        if re.search(build_pattern(term), text, re.IGNORECASE):
            return True
    return False


def main():
    db = get_supabase()
    print("Fetching events for audit...")

    all_events = []
    offset = 0
    while True:
        res = db.table("events").select("id, title, description, relevance_score").range(offset, offset + 199).execute()
        batch = res.data or []
        all_events.extend(batch)
        if len(batch) < 200:
            break
        offset += 200

    print(f"Total events: {len(all_events)}")

    to_delete = [
        e["id"]
        for e in all_events
        if is_sports(e.get("title", ""), e.get("description", ""))
        or (e.get("relevance_score") or 0) < 50
    ]

    print(f"Sports/irrelevant events to purge: {len(to_delete)}")

    if not to_delete:
        print("Nothing to delete.")
        return

    # Show sample of what will be deleted
    samples = [e for e in all_events if e["id"] in set(to_delete[:5])]
    for s in samples:
        print(f"  DELETE: {s['title'][:80]} (score={s.get('relevance_score')})")

    confirm = input(f"\nDelete {len(to_delete)} records? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("Aborted.")
        return

    # Delete in batches
    BATCH = 50
    deleted = 0
    for i in range(0, len(to_delete), BATCH):
        batch = to_delete[i:i+BATCH]
        db.table("event_sources").delete().in_("event_id", batch).execute()
        db.table("analysis").delete().in_("event_id", batch).execute()
        db.table("events").delete().in_("id", batch).execute()
        deleted += len(batch)
        print(f"  Deleted {deleted}/{len(to_delete)} events")

    print(f"\nDone. Purged {deleted} sports/irrelevant records.")


if __name__ == "__main__":
    main()
