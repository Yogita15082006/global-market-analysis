import logging
from typing import Any
from app.database.supabase_client import EVENTS_TABLE, get_supabase

logger = logging.getLogger(__name__)

class DashboardService:
    def __init__(self):
        self.db = get_supabase()

    def get_dashboard_summary(self) -> dict[str, Any]:
        # Top Risks (Dashboard should only surface HIGH and CRITICAL)
        top_risks = self.db.table(EVENTS_TABLE).select("*, analysis!inner(*)").in_("analysis.risk_level", ["High", "Critical"]).order("relevance_score", desc=True).limit(5).execute()
        
        # High Relevance Events (Ribbon should only show score >= 70)
        high_rel = self.db.table(EVENTS_TABLE).select("*, analysis(*)").gte("relevance_score", 70).order("relevance_score", desc=True).limit(10).execute()
        
        # Market Impact Summary & Global Risk Score calculation
        # We fetch recent analyses to compute an aggregate
        recent_analyses = self.db.table("analysis").select("*, events!inner(relevance_score, published_at)").order("generated_at", desc=True).limit(50).execute()
        
        market_summary = []
        asset_counts = {}
        country_counts = {}
        total_risk = 0
        risk_count = 0
        
        for row in recent_analyses.data:
            # Aggregate Risk
            risk = row.get("risk_level", "Low")
            weight = 3 if risk == "High" else (2 if risk == "Medium" else 1)
            total_risk += weight
            risk_count += 1
            
            # Aggregate Assets
            impacts = row.get("market_impacts") or []
            for impact in impacts:
                asset = impact.get("asset")
                if asset:
                    asset_counts[asset] = asset_counts.get(asset, 0) + 1
                    market_summary.append({
                        "asset": asset,
                        "outlook": impact.get("outlook"),
                        "event_id": row.get("event_id")
                    })
                    
            # Aggregate Countries
            countries = row.get("countries_impacted") or []
            for c in countries:
                country_counts[c] = country_counts.get(c, 0) + 1

        top_assets = sorted(asset_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_countries = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        global_risk_score = min(100, int((total_risk / (risk_count * 3)) * 100)) if risk_count > 0 else 0

        return {
            "top_risks": top_risks.data,
            "high_relevance_events": high_rel.data,
            "market_impact_summary": market_summary[:10],
            "global_risk_score": global_risk_score,
            "top_affected_assets": [{"asset": k, "count": v} for k, v in top_assets],
            "top_affected_countries": [{"country": k, "count": v} for k, v in top_countries],
        }
