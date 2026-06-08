import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, Target, Globe, Activity, MapPin, Database, Clock, Zap, Info, ChevronLeft, ShieldAlert } from "lucide-react";
import { Badge, toneForOutlook, toneForRisk } from "@/components/Badge";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/Status";
import { useEvent, useGenerateAnalysis } from "@/hooks/useEvents";
import { formatDate, percent } from "@/utils/formatters";
import { exportElementToPdf } from "@/utils/exportPdf";

export function EventDetails() {
  const { eventId = "" } = useParams();
  const eventQuery = useEvent(eventId);
  const generateMutation = useGenerateAnalysis();
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const event = eventQuery.data;
  const analysis = event?.analysis;

  if (eventQuery.isLoading) return <LoadingBlock label="Loading intelligence brief..." />;
  if (eventQuery.isError || !event) return <ErrorBlock message="Failed to load intelligence brief." />;

  const handleGenerate = async () => {
    setGenerateError(null);
    try {
      await generateMutation.mutateAsync(eventId);
      await eventQuery.refetch();
    } catch (e: any) {
      setGenerateError(e.message || "Failed to generate analysis.");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    await exportElementToPdf("briefing-export-wrapper", `EVENT_BRIEF_${eventId}`);
    setExporting(false);
  };

  const hasAnalysis = !!analysis;

  return (
    <main className="briefing-page">
      <div className="briefing-subheader">
        <Link to="/crisis-feed" className="back-link">
          <ChevronLeft size={14} /> Back to Intel Feed
        </Link>
        <div className="briefing-subheader-actions">
          {hasAnalysis && (
            <button
              className="btn btn-ghost btn-sm"
              disabled={exporting}
              onClick={handleExport}
            >
              {exporting ? <span className="spinner" /> : <ShieldAlert size={14} />}
              EXPORT PDF
            </button>
          )}
          {!hasAnalysis && (
            <button
              className="btn btn-primary"
              disabled={generateMutation.isPending}
              onClick={handleGenerate}
            >
              {generateMutation.isPending ? <><span className="spinner" /> GENERATING...</> : "GENERATE INTELLIGENCE BRIEF"}
            </button>
          )}
        </div>
      </div>

      <div className="page" style={{ paddingTop: "20px" }}>
        {generateError && (
          <div style={{ marginBottom: "16px" }}>
            <ErrorBlock message={generateError} />
          </div>
        )}

        {generateMutation.isPending && (
          <div className="generating-banner">
            <span className="spinner spinner-lg" />
            <div>
              <strong>Compiling Strategic Briefing...</strong>
              <p>Analyzing global sources, extracting entities, evaluating market impacts, and forming consensus.</p>
            </div>
          </div>
        )}

        <div className="briefing-layout" id="briefing-export-wrapper">
          {/* HERO */}
          <div className="briefing-hero">
            <div className="briefing-hero-meta">
              <span className={`threat-tag ${event.intelligence_priority?.toLowerCase() ?? "medium"}`}>
                {event.intelligence_priority ?? "MED"} PRIORITY
              </span>
              <div className="briefing-score">
                REL: <strong>{event.relevance_score ?? 0}</strong>
              </div>
              {hasAnalysis && (
                <div className="briefing-confidence">
                  CONF: <strong>{percent(analysis.confidence_score)}</strong>
                </div>
              )}
            </div>
            
            <h1 className="briefing-title">{event.title}</h1>
            
            <div className="briefing-hero-footer">
              <span className="briefing-source">
                PRIMARY: {event.source?.toUpperCase() ?? "UNKNOWN"}
              </span>
              <span className="briefing-source">
                DETECTED: {formatDate(event.published_at ?? event.created_at)}
              </span>
            </div>
          </div>

          {!hasAnalysis && !generateMutation.isPending && (
            <EmptyBlock message="No analysis generated for this event yet. Click 'Generate Intelligence Brief' to begin." />
          )}

          {hasAnalysis && (
            <div className="briefing-grid">
              {/* LEFT SIDEBAR - Re-ordered logically as requested (but presented as Right Sidebar natively in our CSS setup, let's keep it aside) */}
              {/* The prompt specifically requested LEFT SIDEBAR, but in a 1fr 280px grid it renders on the right. 
                  Let's change the layout order in CSS if needed, or just put the aside element first.
                  Wait, CSS is: .briefing-grid { grid-template-columns: 280px minmax(0, 1fr); }
                  I'll adjust the CSS locally or inline. Let's adjust the style directly here to ensure Left Sidebar. */}
              <aside className="briefing-aside" style={{ gridRow: 1 }}>
                
                {/* Risk & Confidence */}
                <div className="aside-panel">
                  <div className="panel-header">
                    <h2>Assessment</h2>
                  </div>
                  <div className="panel-body risk-metrics">
                    <div className="risk-metric-row">
                      <span>Risk Level</span>
                      <Badge tone={toneForRisk(analysis.risk_level)}>{analysis.risk_level?.toUpperCase() ?? "N/A"}</Badge>
                    </div>
                    <div className="risk-metric-row">
                      <span>Confidence</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--text)", fontWeight: 700 }}>
                        {percent(analysis.confidence_score)}
                      </span>
                    </div>
                    <div className="risk-metric-row">
                      <span>Importance</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--text)", fontWeight: 700 }}>
                        {analysis.importance_score ?? 0}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Countries */}
                {analysis.countries_impacted && analysis.countries_impacted.length > 0 && (
                  <div className="aside-panel">
                    <div className="panel-header">
                      <h2>Countries</h2>
                    </div>
                    <div className="panel-body">
                      <div className="tag-row">
                        {analysis.countries_impacted.map(c => (
                          <Badge key={c} tone="info">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assets */}
                {analysis.market_impacts && analysis.market_impacts.length > 0 && (
                  <div className="aside-panel">
                    <div className="panel-header">
                      <h2>Assets</h2>
                    </div>
                    <div className="panel-body">
                      <div className="tag-row">
                        {analysis.market_impacts.map(m => (
                          <Badge key={m.asset} tone="warning">{m.asset}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sectors */}
                {analysis.affected_sectors && analysis.affected_sectors.length > 0 && (
                  <div className="aside-panel">
                    <div className="panel-header">
                      <h2>Sectors</h2>
                    </div>
                    <div className="panel-body">
                      <div className="tag-row">
                        {analysis.affected_sectors.map(s => (
                          <Badge key={s} tone="neutral">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Source Breakdown */}
                <div className="aside-panel">
                  <div className="panel-header">
                    <h2>Source Breakdown</h2>
                  </div>
                  <div className="panel-body">
                    <div className="source-breakdown-row">
                      <span>Primary Source</span>
                      <span style={{ color: "var(--text)" }}>{event.source ?? "Multiple"}</span>
                    </div>
                  </div>
                </div>

              </aside>

              {/* MAIN CONTENT */}
              <div className="briefing-main">
                
                {/* Executive Summary */}
                <section className="brief-section">
                  <div className="brief-section-header">
                    <AlertTriangle className="brief-icon" style={{ color: "var(--high)" }} />
                    <h2>Executive Summary</h2>
                  </div>
                  <div className="brief-section-body">
                    <p>{analysis.summary ?? event.description}</p>
                  </div>
                </section>

                <div className="brief-split">
                  {/* Strategic Significance */}
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <Target className="brief-icon" style={{ color: "var(--accent)" }} />
                      <h2>Strategic Significance</h2>
                    </div>
                    <div className="brief-section-body">
                      <p>{analysis.strategic_significance ?? "No strategic significance provided."}</p>
                    </div>
                  </section>

                  {/* Future Scenarios */}
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <Globe className="brief-icon" style={{ color: "var(--info)" }} />
                      <h2>Future Scenarios</h2>
                    </div>
                    <div className="brief-section-body">
                      <p>{analysis.future_scenarios ?? "No future scenarios provided."}</p>
                    </div>
                  </section>
                </div>

                <div className="brief-split">
                  {/* India Impact */}
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <MapPin className="brief-icon" style={{ color: "var(--accent-2)" }} />
                      <h2>India Impact</h2>
                    </div>
                    <div className="brief-section-body">
                      <p>{(analysis as any).india_impact ?? "No specific impact on India recorded."}</p>
                    </div>
                  </section>

                  {/* Historical Comparison */}
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <Clock className="brief-icon" style={{ color: "var(--muted)" }} />
                      <h2>Historical Comparison</h2>
                    </div>
                    <div className="brief-section-body">
                      <p>{analysis.historical_comparisons ?? "No historical parallels identified."}</p>
                    </div>
                  </section>
                </div>

                {/* Asset Impact (Bull / Bear) */}
                {analysis.market_impacts && analysis.market_impacts.length > 0 && (
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <Activity className="brief-icon" style={{ color: "var(--warning)" }} />
                      <h2>Asset Impact</h2>
                    </div>
                    <div className="brief-section-body" style={{ padding: 0 }}>
                      <div className="asset-impact-list" style={{ padding: "12px 14px" }}>
                        {analysis.market_impacts.map((impact, i) => (
                          <div key={i} className="asset-impact-row">
                            <div className="asset-impact-header">
                              <strong>{impact.asset}</strong>
                              <Badge tone={toneForOutlook(impact.outlook)}>
                                {impact.outlook.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="asset-impact-reason">{impact.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                <div className="brief-split">
                  {/* Key Actors */}
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <ShieldAlert className="brief-icon" style={{ color: "var(--high)" }} />
                      <h2>Key Actors</h2>
                    </div>
                    <div className="brief-section-body">
                      <p>{analysis.key_actors ?? "Key actors not explicitly identified."}</p>
                    </div>
                  </section>
                  
                  {/* Timeline */}
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <Clock className="brief-icon" style={{ color: "var(--muted)" }} />
                      <h2>Timeline</h2>
                    </div>
                    <div className="brief-section-body">
                      <p>{analysis.timeline ?? "Event timeline pending."}</p>
                    </div>
                  </section>
                </div>

                <div className="brief-split">
                  {/* Supporting Evidence */}
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <Info className="brief-icon" style={{ color: "var(--good)" }} />
                      <h2>Supporting Evidence</h2>
                    </div>
                    <div className="brief-section-body">
                      <p>{analysis.supporting_sources ?? "No supporting evidence provided."}</p>
                    </div>
                  </section>

                  {/* Contradicting Evidence */}
                  <section className="brief-section">
                    <div className="brief-section-header">
                      <AlertTriangle className="brief-icon" style={{ color: "var(--critical)" }} />
                      <h2>Contradicting Evidence</h2>
                    </div>
                    <div className="brief-section-body">
                      <p>{analysis.contradicting_sources ?? "No contradicting evidence found."}</p>
                    </div>
                  </section>
                </div>

                {/* AI Reasoning & Consensus */}
                <section className="brief-section">
                  <div className="brief-section-header">
                    <Zap className="brief-icon" style={{ color: "var(--accent)" }} />
                    <h2>AI Reasoning & Consensus</h2>
                  </div>
                  <div className="brief-section-body">
                    <p style={{ marginBottom: "10px" }}>
                      <strong>Consensus View:</strong> {analysis.consensus_view ?? "Pending consensus analysis."}
                    </p>
                    <p>
                      <strong>Reasoning:</strong> {analysis.ai_reasoning ?? "Reasoning unavailable."}
                    </p>
                  </div>
                </section>

                {/* Raw Sources Used */}
                <section className="brief-section" style={{ marginTop: "8px" }}>
                  <div className="brief-section-header">
                    <Database className="brief-icon" style={{ color: "var(--muted)" }} />
                    <h2>Raw Source Articles</h2>
                  </div>
                  <div className="brief-section-body" style={{ padding: 0 }}>
                    <div style={{ padding: "14px" }}>
                      <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>No additional source articles available. Aggregated from primary source: {event.source}</p>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
