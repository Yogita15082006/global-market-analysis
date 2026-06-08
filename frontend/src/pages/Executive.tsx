import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { briefingsApi } from "@/api";
import { formatRelativeTime } from "@/utils/formatters";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/Status";
import { Badge } from "@/components/Badge";
import { exportElementToPdf } from "@/utils/exportPdf";

export function Executive() {
  const [exporting, setExporting] = useState<string | null>(null);
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["briefings"],
    queryFn: () => briefingsApi.list(),
  });

  const briefings = data?.briefings ?? [];

  const handleExport = async (id: string, type: string) => {
    setExporting(id);
    await exportElementToPdf(`briefing-${id}`, `${type.toUpperCase()}_BRIEFING_${new Date().toISOString().slice(0, 10)}`);
    setExporting(null);
  };

  return (
    <main className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Executive Mode</h1>
          <p>Institutional daily and weekly intelligence briefings.</p>
        </div>
      </div>

      {isLoading && <LoadingBlock label="Loading briefings..." />}
      {isError && <ErrorBlock message="Could not load briefings." />}

      {!isLoading && !isError && briefings.length === 0 && (
        <EmptyBlock message="No daily briefings available. Check back tomorrow." />
      )}

      <div className="briefing-grid" style={{ display: "grid", gap: "20px" }}>
        {briefings.map((briefing: any) => {
          const content = briefing.content;
          return (
            <div key={briefing.id} id={`briefing-${briefing.id}`} className="panel" style={{ position: "relative" }}>
              <div className="panel-header" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ fontSize: "1rem", color: "var(--text)" }}>
                    {briefing.brief_type.toUpperCase()} BRIEFING
                  </h2>
                  <Badge tone="info">{new Date(briefing.created_at).toLocaleDateString()}</Badge>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="panel-meta">{formatRelativeTime(briefing.created_at)}</span>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleExport(briefing.id, briefing.brief_type)}
                    disabled={exporting === briefing.id}
                  >
                    {exporting === briefing.id ? <span className="spinner" /> : <Download size={14} />}
                    EXPORT PDF
                  </button>
                </div>
              </div>
              
              <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {content.executive_summary && (
                  <div>
                    <h3 style={{ color: "var(--accent)", fontSize: "0.85rem", marginBottom: "4px" }}>EXECUTIVE SUMMARY</h3>
                    <p style={{ color: "var(--text-2)", lineHeight: "1.6" }}>{content.executive_summary}</p>
                  </div>
                )}
                
                {content.market_outlook && (
                  <div>
                    <h3 style={{ color: "var(--accent)", fontSize: "0.85rem", marginBottom: "4px" }}>MARKET OUTLOOK</h3>
                    <p style={{ color: "var(--text-2)", lineHeight: "1.6" }}>{content.market_outlook}</p>
                  </div>
                )}
                
                {content.india_impact && (
                  <div>
                    <h3 style={{ color: "var(--accent)", fontSize: "0.85rem", marginBottom: "4px" }}>INDIA IMPACT</h3>
                    <p style={{ color: "var(--text-2)", lineHeight: "1.6" }}>{content.india_impact}</p>
                  </div>
                )}

                {content.top_risks && content.top_risks.length > 0 && (
                  <div>
                    <h3 style={{ color: "var(--critical)", fontSize: "0.85rem", marginBottom: "8px" }}>TOP RISKS</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {content.top_risks.map((risk: any, i: number) => (
                        <div key={i} style={{ padding: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line-2)", borderRadius: "4px" }}>
                          <strong style={{ display: "block", marginBottom: "4px", color: "var(--text)" }}>{risk.title}</strong>
                          <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {content.emerging_threats && content.emerging_threats.length > 0 && (
                  <div>
                    <h3 style={{ color: "var(--warning)", fontSize: "0.85rem", marginBottom: "4px" }}>EMERGING THREATS</h3>
                    <ul style={{ color: "var(--text-2)", fontSize: "0.8rem", paddingLeft: "20px" }}>
                      {content.emerging_threats.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
