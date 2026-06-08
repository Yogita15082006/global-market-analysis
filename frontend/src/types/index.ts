export interface Event {
  id: string;
  title: string;
  description?: string;
  url?: string;
  source?: string;
  published_at?: string;
  created_at?: string;
  is_analyzed?: boolean;
  relevance_score?: number;
  intelligence_priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  source_count?: number;
}

export interface Analysis {
  id: string;
  event_id: string;
  summary?: string;
  sentiment?: string;
  importance_score?: number;
  key_points?: string[];
  category?: string;
  impact_on_india?: string;
  impact_type?: "positive" | "negative" | "neutral" | string;
  affected_sectors?: string[];
  risk_level?: "low" | "medium" | "high" | "critical" | string;
  confidence_score?: number;
  market_impacts?: MarketImpact[];
  events?: Event;
  created_at?: string;
  generated_at?: string;
  why_this_matters?: string;
  strategic_significance?: string;
  bull_case?: string;
  bear_case?: string;
  consensus_view?: string;
  historical_comparisons?: string;
  future_scenarios?: string;
  countries_impacted?: string[];
  supporting_sources?: string;
  contradicting_sources?: string;
  ai_reasoning?: string;
  timeline?: string;
  key_actors?: string;
}

export interface EventWithAnalysis extends Event {
  analysis?: Analysis;
}

export interface MarketImpact {
  asset: string;
  outlook: string;
  confidence?: number;
  reason?: string;
}

export interface EventsListResponse {
  events: Event[];
  total: number;
  limit: number;
  offset: number;
}

export interface AnalysisListResponse {
  analysis: Analysis[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: string;
  message: string;
  created_at?: string;
}

export interface ChatSource {
  event_id: string;
  title?: string;
  url?: string;
  category?: string;
  summary?: string;
}

export interface EventOutlookSummary {
  title?: string;
  outlook: string;
  confidence?: number;
  reason?: string;
}

export interface AssetConsensusSummary {
  asset: string;
  overall_outlook: string;
  weighted_confidence: number;
  reasoning: string;
  supporting_events: EventOutlookSummary[];
  conflicting_events: EventOutlookSummary[];
}

export interface ChatAskResponse {
  answer: string;
  sources: ChatSource[];
  direct_evidence: boolean;
  inference_mode: boolean;
  detected_assets: string[];
  query_type: string;
  events_used: number;
  consensus: AssetConsensusSummary[];
}
