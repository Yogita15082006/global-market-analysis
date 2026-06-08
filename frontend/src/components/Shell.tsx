import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Radio,
  Globe,
  TrendingUp,
  BarChart2,
  BotMessageSquare,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { CommandPalette } from "./CommandPalette";

const NAV_ITEMS = [
  { to: "/dashboard",          icon: LayoutDashboard, label: "Dashboard",        desc: "Operations center" },
  { to: "/crisis-feed",        icon: Radio,           label: "Intel Feed",       desc: "Live intelligence" },
  { to: "/market-intelligence",icon: TrendingUp,      label: "Asset Intel",      desc: "Market exposure" },
  { to: "/source-analytics",   icon: BarChart2,       label: "Analytics",        desc: "Source quality" },
  { to: "/assistant",          icon: BotMessageSquare,label: "AI Analyst",       desc: "Strategic analyst" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`shell ${collapsed ? "shell--collapsed" : ""}`}>
      {/* Left Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <Link to="/" className="sidebar-brand-link">
            <div className="sidebar-logo">
              <Activity size={14} strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="sidebar-brand-text"
              >
                <strong>GLOBAL INTEL</strong>
                <small>Geopolitical Surveillance</small>
              </motion.div>
            )}
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Live indicator */}
        <div className="sidebar-live">
          <span className="live-dot" />
          {!collapsed && <span className="live-label">LIVE FEEDS ACTIVE</span>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <span className={`sidebar-nav-icon ${isActive ? "active" : ""}`}>
                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        className="sidebar-nav-label"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                      >
                        <span className="sidebar-nav-name">{item.label}</span>
                        <span className="sidebar-nav-desc">{item.desc}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="sidebar-nav-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-footer-info">
              <Globe size={11} />
              <span>Monitoring 40+ sources</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="shell-content">
        {children}
      </div>

      <CommandPalette />
    </div>
  );
}
