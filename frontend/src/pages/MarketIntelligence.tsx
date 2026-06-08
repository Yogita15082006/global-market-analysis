import { useQuery } from "@tanstack/react-query";
import { ErrorBlock, LoadingBlock } from "@/components/Status";
import { useAnalysis, useEvents } from "@/hooks/useEvents";
import { marketApi } from "@/api";
import "./MarketIntelligence.css";

export function MarketIntelligence() {
  const eventsQuery = useEvents({ limit: 1 }); // Just to get total count
  const analysisQuery = useAnalysis({ limit: 1000 }); // To count analyses
  const marketQuery = useQuery({
    queryKey: ["marketLive"],
    queryFn: () => marketApi.live(),
    refetchInterval: 60000,
  });

  const totalEvents = eventsQuery.data?.total ?? 0;
  const analyses = analysisQuery.data?.analysis ?? [];
  const marketDataList = (marketQuery.data?.data || []) as any[];

  const bullishCount = marketDataList.filter((m: any) => m.trend === "bullish").length;
  const bearishCount = marketDataList.filter((m: any) => m.trend === "bearish").length;

  const indices = marketDataList.filter((m: any) => !["Bitcoin", "Ethereum", "BNB", "Solana"].includes(m.asset) && !["Gold", "Silver", "Copper", "Crude Oil", "Brent Oil", "Natural Gas", "USD", "EUR", "GBP", "INR", "JPY", "CNY"].includes(m.asset));
  const crypto = marketDataList.filter((m: any) => ["Bitcoin", "Ethereum", "BNB", "Solana"].includes(m.asset));
  const commodities = marketDataList.filter((m: any) => ["Gold", "Silver", "Copper", "Crude Oil", "Brent Oil", "Natural Gas"].includes(m.asset));

  if (marketQuery.isLoading) return <LoadingBlock label="Loading live market dashboard..." />;
  if (marketQuery.isError) return <ErrorBlock message="Could not load market data." />;

  return (
    <main className="market-dashboard">
      <div className="market-header">
        <h1>Market Dashboard</h1>
        <p>Live indices, commodities, and digital assets</p>
      </div>

      <div className="market-top-metrics">
        <MetricCard label="Live News" value={totalEvents} />
        <MetricCard label="AI Analyses" value={analyses.length} />
        <MetricCard label="Bullish Signals" value={bullishCount} color="var(--good)" />
        <MetricCard label="Bearish Signals" value={bearishCount} color="var(--critical)" />
      </div>

      <div className="market-overview-section">
        <h2>Market Overview</h2>
        
        <div className="market-grid">
          {indices.map((m: any) => <AssetCard key={m.asset} item={m} type="INDICES" prefix="" />)}
          {crypto.map((m: any) => <AssetCard key={m.asset} item={m} type="CRYPTO" prefix="$" />)}
          {commodities.map((m: any) => <AssetCard key={m.asset} item={m} type="COMMODITIES" prefix="$" />)}
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="market-metric-card">
      <div className="market-metric-value" style={{ color: color || "var(--text)" }}>{value}</div>
      <div className="market-metric-label">{label}</div>
    </div>
  );
}

function AssetCard({ item, type, prefix }: { item: any; type: string; prefix: string }) {
  const isPositive = (item.daily_change ?? 0) >= 0;
  const changeColor = isPositive ? "var(--good)" : "var(--critical)";
  const sign = isPositive ? "+" : "";

  return (
    <div className="market-asset-card">
      <div className="market-asset-type">{type}</div>
      <div className="market-asset-name">{item.asset}</div>
      <div className="market-asset-price-row">
        <span className="market-asset-price">
          {prefix}{item.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "---"}
        </span>
      </div>
      <div className="market-asset-change-row">
        <span className="market-asset-change-text">
          ({sign}{prefix}{item.daily_change ? item.daily_change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} today)
        </span>
        <span className="market-asset-badge" style={{ color: changeColor, borderColor: isPositive ? "rgba(40,167,69,0.2)" : "rgba(220,53,69,0.2)" }}>
          ~ {sign}{item.daily_percent ? item.daily_percent.toFixed(2) : "0.00"}%
        </span>
      </div>
    </div>
  );
}
