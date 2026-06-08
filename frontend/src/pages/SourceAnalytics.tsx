import { useMemo } from "react";
import { Badge } from "@/components/Badge";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/Status";
import { useSourceAnalytics } from "@/hooks/useEvents";
import "./SourceAnalytics.css";

export function SourceAnalytics() {
  const analyticsQuery = useSourceAnalytics();
  const data = analyticsQuery.data;

  const sourceDistribution = useMemo(() => {
    if (!data?.source_distribution) return [];
    return Object.entries(data.source_distribution as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [data]);

  const maxSource = sourceDistribution[0]?.[1] ?? 1;

  const confidenceDist = useMemo(() => {
    if (!data?.confidence_distribution) return [];
    return Object.entries(data.confidence_distribution as Record<string, number>);
  }, [data]);

  const maxConf = Math.max(...confidenceDist.map(([, v]) => v), 1);

  const qualityDist = useMemo(() => {
    if (!data?.cluster_quality_distribution) return [];
    return Object.entries(data.cluster_quality_distribution as Record<string, number>);
  }, [data]);

  const totalQuality = qualityDist.reduce((s, [, v]) => s + v, 0) || 1;

  const QUALITY_COLORS: Record<string, string> = {
    "High Confidence": "var(--good)",
    "Strong":          "var(--accent)",
    "Moderate":        "var(--medium)",
    "Poor":            "var(--critical)",
  };

  return (
    <main className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Source Analytics</h1>
          <p>Intelligence pipeline quality metrics, source distribution, and confidence analysis</p>
        </div>
      </div>

      {analyticsQuery.isLoading && <LoadingBlock label="Loading analytics..." />}
      {analyticsQuery.isError   && <ErrorBlock  message="Could not load source analytics." />}

      {data && (
        <>
          {/* Overview metrics */}
          <div className="analytics-overview">
            <div className="analytics-metric">
              <span className="analytics-metric-label">Total Articles</span>
              <strong className="analytics-metric-value accent">{(data.total_articles ?? 0).toLocaleString()}</strong>
            </div>
            <div className="analytics-metric">
              <span className="analytics-metric-label">Event Clusters</span>
              <strong className="analytics-metric-value accent">{(data.total_clusters ?? 0).toLocaleString()}</strong>
            </div>
            <div className="analytics-metric">
              <span className="analytics-metric-label">Avg Sources / Cluster</span>
              <strong className="analytics-metric-value">{(data.avg_sources_per_cluster ?? 0).toFixed(1)}</strong>
            </div>
            <div className="analytics-metric">
              <span className="analytics-metric-label">High-Confidence Clusters</span>
              <strong className="analytics-metric-value good">{data.high_confidence_clusters ?? 0}</strong>
            </div>
          </div>

          <div className="analytics-grid">
            {/* Source Distribution */}
            <div className="panel">
              <div className="panel-header">
                <h2>Source Distribution</h2>
                <span className="panel-meta">{sourceDistribution.length} sources</span>
              </div>
              <div className="panel-body analytics-chart">
                {sourceDistribution.length > 0 ? (
                  sourceDistribution.map(([source, count]) => (
                    <div key={source} className="chart-bar-row">
                      <span className="chart-label" title={source}>{source}</span>
                      <div className="chart-bar-track">
                        <div
                          className="chart-bar-fill"
                          style={{ width: `${(count / maxSource) * 100}%` }}
                        />
                      </div>
                      <span className="chart-value">{count}</span>
                    </div>
                  ))
                ) : (
                  <EmptyBlock message="No source data available." />
                )}
              </div>
            </div>

            {/* Confidence Distribution */}
            <div className="panel">
              <div className="panel-header">
                <h2>Confidence Distribution</h2>
                <span className="panel-meta">AI analysis confidence scores</span>
              </div>
              <div className="panel-body">
                {confidenceDist.length > 0 ? (
                  <div className="conf-dist-chart">
                    {confidenceDist.map(([label, count]) => (
                      <div key={label} className="conf-dist-bar">
                        <div
                          className="conf-dist-fill"
                          style={{ height: `${(count / maxConf) * 160}px` }}
                        />
                        <span className="conf-dist-label">{label}</span>
                        <span className="conf-dist-value">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock message="No confidence data available." />
                )}
              </div>
            </div>

            {/* Cluster Quality */}
            <div className="panel">
              <div className="panel-header">
                <h2>Cluster Quality</h2>
                <span className="panel-meta">Multi-source intelligence quality</span>
              </div>
              <div className="panel-body">
                {qualityDist.length > 0 ? (
                  <div className="quality-list">
                    {qualityDist.map(([label, count]) => (
                      <div key={label} className="quality-row">
                        <div className="quality-left">
                          <span
                            className="quality-dot"
                            style={{ background: QUALITY_COLORS[label] ?? "var(--muted)" }}
                          />
                          <span className="quality-label">{label}</span>
                        </div>
                        <div className="quality-bar-wrap">
                          <div
                            className="quality-bar"
                            style={{
                              width: `${(count / totalQuality) * 100}%`,
                              background: QUALITY_COLORS[label] ?? "var(--muted)",
                            }}
                          />
                        </div>
                        <div className="quality-right">
                          <span className="quality-count">{count}</span>
                          <Badge tone="neutral">{Math.round((count / totalQuality) * 100)}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock message="No quality data available." />
                )}
              </div>
            </div>

            {/* Pipeline Summary */}
            <div className="panel">
              <div className="panel-header">
                <h2>Pipeline Summary</h2>
                <span className="panel-meta">Intelligence pipeline health</span>
              </div>
              <div className="panel-body">
                <div className="pipeline-list">
                  <div className="pipeline-row">
                    <span>Total Raw Articles Ingested</span>
                    <strong>{(data.total_articles ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="pipeline-row">
                    <span>Unique Events Clustered</span>
                    <strong>{(data.total_clusters ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="pipeline-row">
                    <span>Cluster Density</span>
                    <strong style={{ color: "var(--accent)" }}>{data.avg_sources_per_cluster?.toFixed(2) ?? "0"} avg sources</strong>
                  </div>
                  <div className="pipeline-row">
                    <span>High-Confidence Coverage</span>
                    <strong style={{ color: "var(--good)" }}>
                      {data.total_clusters
                        ? `${Math.round(((data.high_confidence_clusters ?? 0) / data.total_clusters) * 100)}%`
                        : "0%"}
                    </strong>
                  </div>
                  <div className="pipeline-row">
                    <span>Compression Ratio</span>
                    <strong>
                      {data.total_articles && data.total_clusters
                        ? `${(data.total_articles / data.total_clusters).toFixed(1)}:1`
                        : "—"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!analyticsQuery.isLoading && !data && (
        <EmptyBlock message="No analytics data available." />
      )}
    </main>
  );
}
