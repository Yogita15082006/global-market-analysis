import logging
from datetime import UTC, datetime
from typing import Any

from groq import AsyncGroq
from app.config.settings import get_settings
from app.database.supabase_client import get_supabase, EVENTS_TABLE

logger = logging.getLogger(__name__)

class BriefingService:
    def __init__(self):
        self.db = get_supabase()
        self.settings = get_settings()
        self.client = AsyncGroq(api_key=self.settings.groq_api_key)

    async def generate_daily_briefing(self, brief_type: str) -> dict[str, Any]:
        """Generates a comprehensive daily/weekly briefing using Groq AI."""
        logger.info(f"Generating {brief_type} briefing...")
        try:
            # Fetch top critical events
            response = (
                self.db.table(EVENTS_TABLE)
                .select("title, description, analysis(*)")
                .eq("is_analyzed", True)
                .order("intelligence_priority", desc=True)
                .limit(25)
                .execute()
            )
            events = response.data
            if not events:
                logger.warning("No events available for briefing.")
                return {}

            # Construct prompt for AI
            prompt = f"Generate a {brief_type} executive intelligence briefing based on the following top recent events:\n\n"
            for e in events:
                prompt += f"- {e['title']}: {e.get('description', '')[:200]}... [Risk: {e['analysis'].get('risk_level', 'low')}]\n"

            prompt += """
            
            Structure the output as JSON matching exactly this schema:
            {
                "executive_summary": "High level summary",
                "top_risks": [{"title": "Event Name", "description": "Why it matters", "countries": [], "assets": []}],
                "market_outlook": "General market direction based on these events",
                "india_impact": "Specific impact on India",
                "emerging_threats": ["Threat 1", "Threat 2"]
            }
            """

            completion = await self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-70b-versatile",
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            import json
            content = json.loads(completion.choices[0].message.content)
            
            # Store in DB
            self.db.table("daily_briefings").insert({
                "brief_type": brief_type,
                "content": content
            }).execute()
            
            logger.info(f"{brief_type} briefing generated successfully.")
            return content
        except Exception as e:
            logger.error(f"Error generating briefing: {e}")
            return {}
