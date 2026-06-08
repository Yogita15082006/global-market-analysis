import { useState, type FormEvent, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { chatApi } from "@/api";
import { Badge, toneForOutlook } from "@/components/Badge";
import { EmptyBlock, ErrorBlock } from "@/components/Status";
import { buildConsensusRows, suggestedPrompts } from "@/lib/intelligence";
import type { ChatAskResponse } from "@/types";
import { percent } from "@/utils/formatters";
import "./Assistant.css";

export function Assistant() {
  const [question, setQuestion] = useState("");
  const [result, setResult]     = useState<ChatAskResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const consensusRows = result ? buildConsensusRows(result.consensus) : [];

  const chatMutation = useMutation({
    mutationFn: (value: string) => chatApi.ask(value),
    onSuccess: setResult,
  });

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    chatMutation.mutate(trimmed);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Parse answer sections
  const answerSections = result
    ? result.answer
        .split(/\n(?=#{1,3}\s)/)
        .map(block => {
          const match = block.match(/^#{1,3}\s+(.+)\n([\s\S]*)/);
          if (match) return { title: match[1].trim(), content: match[2].trim() };
          return { title: "Analysis", content: block.trim() };
        })
        .filter(s => s.content)
    : [];

  const totalEvents = consensusRows.reduce(
    (acc, r) => acc + r.supporting_events.length + r.conflicting_events.length, 0,
  );

  return (
    <main className="page">
      {/* Header */}
      <div className="analyst-header">
        <div className="page-title">
          <h1>Intelligence Copilot</h1>
          <p>AI-powered strategic assessment · Grounded in live geospatial and market intelligence</p>
        </div>
        {result && (
          <div className="analyst-meta-strip">
            <span className="analyst-meta-item">
              <span className="analyst-meta-label">Sources</span>
              <strong>{result.sources.length}</strong>
            </span>
            <span className="analyst-meta-item">
              <span className="analyst-meta-label">Events</span>
              <strong>{result.events_used}</strong>
            </span>
            <span className="analyst-meta-item">
              <span className="analyst-meta-label">Assets</span>
              <strong>{result.detected_assets?.length ?? 0}</strong>
            </span>
            <span className="analyst-meta-item">
              <span className="analyst-meta-label">Mode</span>
              <strong>{result.inference_mode ? "INFERENCE" : "DIRECT"}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Query Box */}
      <div className="analyst-query-panel">
        {/* Prompt chips */}
        <div className="prompt-chips">
          {suggestedPrompts.map(prompt => (
            <button
              key={prompt}
              className="prompt-chip"
              type="button"
              onClick={() => ask(prompt)}
              disabled={chatMutation.isPending}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className="analyst-form" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            className="analyst-input"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a strategic intelligence question: geopolitics, markets, risks, sanctions..."
            disabled={chatMutation.isPending}
          />
          <button
            className="btn btn-primary"
            disabled={chatMutation.isPending || !question.trim()}
            type="submit"
          >
            {chatMutation.isPending
              ? <><span className="spinner" /> ANALYZING...</>
              : "SUBMIT QUERY →"}
          </button>
        </form>
      </div>

      {chatMutation.isError && (
        <ErrorBlock message="The intelligence analyst could not process this query." />
      )}

      {chatMutation.isPending && (
        <div className="analyst-loading">
          <span className="spinner spinner-lg" />
          <div>
            <strong>Analyzing intelligence...</strong>
            <p>Cross-referencing sources, generating strategic assessment</p>
          </div>
        </div>
      )}

      {result && !chatMutation.isPending && (
        <div className="analyst-results">
          {/* Quick action buttons */}
          <div className="analyst-actions">
            <Link to="/crisis-feed" className="btn btn-ghost btn-sm">
              View Intelligence Brief →
            </Link>
            <Link to="/market-intelligence" className="btn btn-ghost btn-sm">
              Asset Impact Analysis →
            </Link>
            <Link to="/crisis-feed?q=india" className="btn btn-ghost btn-sm">
              India Impact →
            </Link>
            <Link to="/crisis-feed" className="btn btn-ghost btn-sm">
              Historical Comparison →
            </Link>
          </div>

          <div className="analyst-body">
            {/* Main answer */}
            <div className="analyst-main">
              {/* Answer sections */}
              <div className="analyst-report panel">
                <div className="panel-header">
                  <h2>📋 Intelligence Assessment</h2>
                  <span className="panel-meta">
                    {result.direct_evidence ? "DIRECT EVIDENCE" : "INFERENCE"} · {result.events_used} events
                  </span>
                </div>
                <div className="panel-body">
                  {answerSections.map((section, i) => (
                    <div key={i} className="report-section">
                      {section.title !== "Analysis" && (
                        <h3 className="report-section-title">{section.title}</h3>
                      )}
                      <p className="report-section-body">{section.content}</p>
                    </div>
                  ))}
                  {answerSections.length === 0 && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-2)", lineHeight: 1.7 }}>
                      {result.answer}
                    </p>
                  )}
                </div>
              </div>

              {/* Sources */}
              <div className="panel">
                <div className="panel-header">
                  <h2>📡 Sources Used</h2>
                  <span className="panel-meta">{result.sources.length} sources · {totalEvents} events referenced</span>
                </div>
                <div className="panel-body">
                  {result.sources.length > 0 ? (
                    <div className="source-list">
                      {result.sources.slice(0, 8).map(source => (
                        <a
                          key={source.event_id}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="source-list-item"
                        >
                          <span>
                            <strong>{source.title ?? "Untitled source"}</strong>
                            {source.summary && <p>{source.summary}</p>}
                          </span>
                          <Badge tone="info">{source.category ?? "General"}</Badge>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <EmptyBlock message="No external sources provided for this query." />
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar — consensus + detected assets */}
            <div className="analyst-sidebar">
              {/* Asset Consensus */}
              {consensusRows.length > 0 && (
                <div className="panel">
                  <div className="panel-header">
                    <h2>📈 Asset Consensus</h2>
                  </div>
                  <div className="panel-body consensus-list">
                    {consensusRows.map(item => (
                      <div key={item.asset} className="consensus-card">
                        <div className="consensus-card-header">
                          <strong>{item.asset}</strong>
                          <Badge tone={toneForOutlook(item.overall_outlook)}>
                            {item.overall_outlook.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="conf-bar" style={{ margin: "6px 0" }}>
                          <div
                            className="conf-bar-fill"
                            style={{ width: `${Math.max(4, Math.min(100, item.weighted_confidence))}%` }}
                          />
                        </div>
                        <div className="consensus-stats">
                          <span>Conf: <strong>{percent(item.weighted_confidence)}</strong></span>
                          <span>Support: <strong style={{ color: "var(--good)" }}>{item.supporting_events.length}</strong></span>
                          <span>Against: <strong style={{ color: "var(--critical)" }}>{item.conflicting_events.length}</strong></span>
                        </div>
                        <p className="consensus-reasoning">{item.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected assets */}
              {(result.detected_assets?.length ?? 0) > 0 && (
                <div className="panel">
                  <div className="panel-header">
                    <h2>🎯 Assets & Regions</h2>
                  </div>
                  <div className="panel-body">
                    <div className="tag-row" style={{ marginBottom: "8px" }}>
                      {result.detected_assets.map(asset => (
                        <Badge key={asset} tone="warning">{asset}</Badge>
                      ))}
                    </div>
                    {/* We approximate impacted countries if available in the result, or just show a label */}
                    <div className="tag-row">
                      <Badge tone="info">GLOBAL IMPACT</Badge>
                      <Badge tone="info">KEY REGIONS</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Assessment Metrics */}
              <div className="panel">
                <div className="panel-header">
                  <h2>⚖️ Threat Assessment</h2>
                </div>
                <div className="panel-body">
                  <div className="query-meta-list">
                    <div className="query-meta-row">
                      <span>Overall Risk</span>
                      <Badge tone={result.inference_mode ? "warning" : "danger"}>
                        {result.inference_mode ? "ELEVATED" : "HIGH"}
                      </Badge>
                    </div>
                    <div className="query-meta-row">
                      <span>Analyst Confidence</span>
                      <strong style={{ color: "var(--accent)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82rem" }}>
                        {percent(consensusRows.length ? Math.max(...consensusRows.map(r => r.weighted_confidence)) : 75)}
                      </strong>
                    </div>
                    <div className="query-meta-row">
                      <span>Market Consensus</span>
                      <strong style={{ color: "var(--text)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82rem" }}>
                        {totalEvents > 3 ? "STRONG" : totalEvents > 0 ? "WEAK" : "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Query metadata */}
              <div className="panel">
                <div className="panel-header">
                  <h2>📊 Query Metadata</h2>
                </div>
                <div className="panel-body">
                  <div className="query-meta-list">
                    <div className="query-meta-row">
                      <span>Query Type</span>
                      <Badge tone="info">{result.query_type ?? "GENERAL"}</Badge>
                    </div>
                    <div className="query-meta-row">
                      <span>Evidence Mode</span>
                      <Badge tone={result.direct_evidence ? "good" : "neutral"}>
                        {result.direct_evidence ? "DIRECT" : "INFERENCE"}
                      </Badge>
                    </div>
                    <div className="query-meta-row">
                      <span>Events Used</span>
                      <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82rem" }}>
                        {result.events_used}
                      </strong>
                    </div>
                    <div className="query-meta-row">
                      <span>Sources</span>
                      <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.82rem" }}>
                        {result.sources.length}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !chatMutation.isPending && !chatMutation.isError && (
        <div className="analyst-empty">
          <div className="analyst-empty-inner">
            <span className="analyst-empty-icon">🔍</span>
            <h2>Intelligence Copilot</h2>
            <p>
              Submit a query to receive an AI-powered intelligence assessment grounded in real-time
              geopolitical data, market analysis, and multi-source intelligence.
            </p>
            <div className="analyst-empty-capabilities">
              <span>• Geopolitical risk analysis</span>
              <span>• Market impact assessment</span>
              <span>• Country exposure analysis</span>
              <span>• Asset outlook synthesis</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
