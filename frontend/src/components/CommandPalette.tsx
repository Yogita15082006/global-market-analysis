import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Activity, MessageSquare, Briefcase, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackedAssets } from "@/lib/intelligence";

const COMMANDS = [
  { id: "dashboard", label: "Command Center", route: "/", icon: Activity },
  { id: "feed", label: "Intelligence Feed", route: "/crisis-feed", icon: Search },
  { id: "market", label: "Market Intelligence", route: "/market-intelligence", icon: Briefcase },
  { id: "analytics", label: "Source Analytics", route: "/source-analytics", icon: Activity },
  { id: "executive", label: "Executive Mode", route: "/executive", icon: Briefcase },
  { id: "copilot", label: "Intelligence Copilot", route: "/assistant", icon: MessageSquare },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  const q = query.toLowerCase();
  
  const filteredCommands = COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  
  const filteredAssets = trackedAssets.filter((a) => a.toLowerCase().includes(q));

  const handleSelect = (route: string) => {
    setOpen(false);
    setQuery("");
    navigate(route);
  };

  return (
    <AnimatePresence>
      <div className="cmd-overlay" onClick={() => setOpen(false)}>
        <motion.div 
          className="cmd-dialog"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cmd-header">
            <Search size={18} className="cmd-icon" />
            <input
              autoFocus
              className="cmd-input"
              placeholder="Search events, assets, countries, or commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="cmd-close" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="cmd-body">
            {query && (
              <div className="cmd-section">
                <div className="cmd-label">Global Search</div>
                <button className="cmd-item" onClick={() => handleSelect(`/crisis-feed?q=${encodeURIComponent(query)}`)}>
                  <Search size={14} />
                  <span>Search feed for "{query}"</span>
                </button>
              </div>
            )}
            
            {filteredAssets.length > 0 && (
              <div className="cmd-section">
                <div className="cmd-label">Assets</div>
                {filteredAssets.slice(0, 5).map((asset) => (
                  <button key={asset} className="cmd-item" onClick={() => handleSelect(`/market-intelligence?asset=${encodeURIComponent(asset)}`)}>
                    <Briefcase size={14} />
                    <span>{asset}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredCommands.length > 0 && (
              <div className="cmd-section">
                <div className="cmd-label">Pages</div>
                {filteredCommands.map((cmd) => (
                  <button key={cmd.id} className="cmd-item" onClick={() => handleSelect(cmd.route)}>
                    <cmd.icon size={14} />
                    <span>{cmd.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
