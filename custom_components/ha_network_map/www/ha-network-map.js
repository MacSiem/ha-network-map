/* HA Tools split — ha-network-map v5.0.16 (2026-08-28) — single-tool standalone repo */
(function() {
'use strict';

// XSS protection helper
const _asText = (s) => String(s ?? '');
const _escBase = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const _esc = (s) => _escBase(_asText(s));
const SUPPORT_DISMISSED_KEY = 'ha-network-map-support-dismissed';
const supportDismissed = () => { try { return localStorage.getItem(SUPPORT_DISMISSED_KEY) === '1'; } catch (_) { return false; } };
const ownDonateFooter = () => `<section class="donate-section" data-source="own-card" style="margin:8px 12px;padding:8px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px"><span>❤️ Support HA Tools:</span><a href="https://buymeacoffee.com/macsiem" target="_blank" rel="noopener noreferrer">Buy Me a Coffee</a><button type="button" class="support-dismiss" aria-label="Dismiss support link" style="margin-left:auto">×</button></section>`;

/* ===== HA Tools split — inline shared infrastructure ===== */
// Bento Design System CSS (inline copy — keeps tool standalone)
const HA_NETWORK_MAP_BENTO_CSS = `
/* ═══════════════════════════════════════════════
   HA Tools — Bento Design System v2.0 (Premium)
   ═══════════════════════════════════════════════ */


/* keyboard a11y */
:focus-visible { outline: 2px solid var(--bento-primary, #6366f1); outline-offset: 2px; border-radius: 3px; }
:host {
  /* Brand palette — diamond top, gradient-friendly */
  --bento-primary: #6366f1;
  --bento-primary-2: #8b5cf6;
  --bento-primary-3: #ec4899;
  --bento-primary-hover: #4f46e5;
  --bento-primary-light: rgba(99, 102, 241, 0.08);
  --bento-primary-glow: rgba(99, 102, 241, 0.35);
  --bento-success: #10B981;
  --bento-success-light: rgba(16, 185, 129, 0.10);
  --bento-success-border: rgba(16, 185, 129, 0.25);
  --bento-error: #EF4444;
  --bento-error-light: rgba(239, 68, 68, 0.10);
  --bento-error-border: rgba(239, 68, 68, 0.25);
  --bento-warning: #F59E0B;
  --bento-warning-light: rgba(245, 158, 11, 0.10);
  --bento-warning-border: rgba(245, 158, 11, 0.25);
  --bento-info: #06b6d4;
  --bento-info-light: rgba(6, 182, 212, 0.10);
  --bento-info-border: rgba(6, 182, 212, 0.25);

  /* Theme */
  --bento-bg:     var(--primary-background-color, #fafaf9);
  --bento-bg-2:   var(--card-background-color, #f5f5f4);
  --bento-card:   var(--card-background-color, #ffffff);
  --bento-glass:  rgba(255, 255, 255, 0.7);
  --bento-border: var(--divider-color, #e7e5e4);
  --bento-border-strong: rgba(0, 0, 0, 0.08);
  --bento-text:           var(--primary-text-color,   #0c0a09);
  --bento-text-secondary: var(--secondary-text-color, #57534e);
  --bento-text-muted:     var(--disabled-text-color,  #a8a29e);

  /* Radii */
  --bento-radius-xs: 8px;
  --bento-radius-sm: 12px;
  --bento-radius-md: 18px;
  --bento-radius-lg: 24px;
  --bento-radius-pill: 999px;

  /* Shadows — modern, layered */
  --bento-shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02);
  --bento-shadow-md: 0 4px 12px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.03);
  --bento-shadow-lg: 0 24px 48px -12px rgba(0,0,0,0.10), 0 12px 24px -8px rgba(0,0,0,0.05);
  --bento-shadow-glow: 0 0 0 1px rgba(99,102,241,0.15), 0 8px 32px -8px rgba(99,102,241,0.25);

  /* Gradients */
  --bento-grad-primary: linear-gradient(135deg, #6366f1, #8b5cf6);
  --bento-grad-rainbow: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  --bento-grad-success: linear-gradient(135deg, #10b981, #34d399);
  --bento-grad-error:   linear-gradient(135deg, #ef4444, #f87171);
  --bento-grad-warning: linear-gradient(135deg, #f59e0b, #fbbf24);

  /* Motion */
  --bento-trans-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --bento-trans:      0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --bento-trans-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* Typography */
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif;
  font-feature-settings: "cv11" 1, "ss01" 1;
  letter-spacing: -0.01em;
  display: block;
  color: var(--bento-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Dark mode ───────────────────────────────── */
:host(.bento-dark) {
    --bento-bg:     var(--primary-background-color, #0a0a0f);
    --bento-bg-2:   var(--card-background-color,    #111119);
    --bento-card:   var(--card-background-color,    #16161f);
    --bento-glass:  rgba(22, 22, 31, 0.7);
    --bento-border: var(--divider-color,            #27272f);
    --bento-border-strong: rgba(255, 255, 255, 0.08);
    --bento-text:           var(--primary-text-color,   #fafaf9);
    --bento-text-secondary: var(--secondary-text-color, #d6d3d1);
    --bento-text-muted:     var(--disabled-text-color,  #78716c);
    --bento-primary:        #818cf8;
    --bento-primary-2:      #a78bfa;
    --bento-primary-3:      #f472b6;
    --bento-primary-light:  rgba(129, 140, 248, 0.12);
    --bento-primary-glow:   rgba(129, 140, 248, 0.45);
    --bento-success: #34d399;
    --bento-success-light:  rgba(52, 211, 153, 0.12);
    --bento-success-border: rgba(52, 211, 153, 0.30);
    --bento-error:   #f87171;
    --bento-error-light:    rgba(248, 113, 113, 0.12);
    --bento-error-border:   rgba(248, 113, 113, 0.30);
    --bento-warning: #fbbf24;
    --bento-warning-light:  rgba(251, 191, 36, 0.12);
    --bento-warning-border: rgba(251, 191, 36, 0.30);
    --bento-info:    #22d3ee;
    --bento-info-light:     rgba(34, 211, 238, 0.12);
    --bento-info-border:    rgba(34, 211, 238, 0.30);
    --bento-shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
    --bento-shadow-md: 0 4px 12px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2);
    --bento-shadow-lg: 0 24px 48px -12px rgba(0,0,0,0.6), 0 12px 24px -8px rgba(0,0,0,0.3);
    --bento-shadow-glow: 0 0 0 1px rgba(129,140,248,0.2), 0 8px 32px -8px rgba(129,140,248,0.5);
    --bento-grad-primary: linear-gradient(135deg, #818cf8, #a78bfa);
    --bento-grad-rainbow: linear-gradient(135deg, #818cf8, #a78bfa 50%, #f472b6);
    color-scheme: dark !important;
  }
:host(.bento-dark) .card, :host(.bento-dark) .card-container, :host(.bento-dark) .main-card, :host(.bento-dark) .panel-card {
    background: var(--bento-card) !important; color: var(--bento-text) !important; border-color: var(--bento-border) !important;
  }
:host(.bento-dark) input, :host(.bento-dark) select, :host(.bento-dark) textarea { background: var(--bento-bg-2); color: var(--bento-text); border-color: var(--bento-border); }
:host(.bento-dark) table th { background: var(--bento-bg-2); color: var(--bento-text-secondary); border-color: var(--bento-border); }
:host(.bento-dark) table td { color: var(--bento-text); border-color: var(--bento-border); }
:host(.bento-dark) pre, :host(.bento-dark) code { background: #1e1e2e !important; color: #e2e8f0 !important; }

/* ── Reset & motion preferences ──────────────── */
* { box-sizing: border-box; }
@media (prefers-reduced-motion: reduce) { * { animation-duration: 0s !important; transition-duration: 0s !important; } }

/* ── Main Card Wrapper ───────────────────────── */
.card {
  background: var(--bento-card);
  border: 1px solid var(--bento-border);
  border-radius: var(--bento-radius-md);
  box-shadow: var(--bento-shadow-md);
  color: var(--bento-text);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  transition: box-shadow var(--bento-trans), border-color var(--bento-trans);
}

/* ── Header ──────────────────────────────────── */
.header {
  padding: 20px 24px 0;
  display: flex; align-items: center; gap: 12px;
}
.header-icon { font-size: 24px; }
.header-title {
  font-size: 18px; font-weight: 700; letter-spacing: -0.02em;
  color: var(--bento-text);
}
.header-badge {
  margin-left: auto;
  background: var(--bento-grad-primary); color: #fff;
  font-size: 11px; padding: 4px 10px; border-radius: var(--bento-radius-pill);
  font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  box-shadow: 0 4px 14px -2px var(--bento-primary-glow);
}
.content { padding: 20px 24px 24px; }

/* ── Tabs (modern pill style) ────────────────── */
.tabs, .tab-bar, .tab-nav, .tab-header {
  display: flex !important; gap: 4px !important;
  padding: 4px !important;
  background: var(--bento-bg-2) !important;
  border-radius: var(--bento-radius-pill) !important;
  margin-bottom: 20px !important;
  overflow: visible !important;
  -webkit-overflow-scrolling: touch !important;
  flex-wrap: wrap !important; border-bottom: 0 !important;
  width: 100%; max-width: 100%; box-sizing: border-box;
}
.tab, .tab-btn, .tab-button, .dtab {
  padding: 8px 16px !important;
  border: none !important; background: transparent !important; cursor: pointer !important;
  font-size: 13px !important; font-weight: 600 !important;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif !important;
  color: var(--bento-text-secondary) !important;
  border-radius: var(--bento-radius-pill) !important;
  margin-bottom: 0 !important;
  transition: all var(--bento-trans) !important;
  white-space: nowrap !important; flex: 1 1 auto !important; text-align: center !important; min-height: 40px !important;
  letter-spacing: -0.005em !important;
}
.tab:hover, .tab-btn:hover, .tab-button:hover, .dtab:hover {
  color: var(--bento-text) !important;
  background: var(--bento-card) !important;
}
.tab.active, .tab-btn.active, .tab-button.active, .dtab.active {
  background: var(--bento-card) !important;
  color: var(--bento-primary) !important;
  box-shadow: var(--bento-shadow-sm) !important;
  font-weight: 700 !important;
}
.tab-content { display: block; }
.tab-content.active { animation: bentoFadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes bentoFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Stat / KPI cards (premium) ──────────────── */
.stat-card, .stat-item, .metric-card, .kpi-card {
  background: var(--bento-bg-2) !important;
  border: 1px solid var(--bento-border) !important;
  border-radius: var(--bento-radius-sm) !important;
  padding: 18px !important;
  text-align: left !important;
  transition: transform var(--bento-trans), box-shadow var(--bento-trans), border-color var(--bento-trans);
  position: relative; overflow: hidden;
}
.stat-card::before, .metric-card::before, .kpi-card::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--bento-grad-primary);
  opacity: 0; transition: opacity var(--bento-trans);
}
.stat-card:hover, .stat-item:hover, .metric-card:hover, .kpi-card:hover {
  transform: translateY(-2px); box-shadow: var(--bento-shadow-lg); border-color: var(--bento-primary-light);
}
.stat-card:hover::before, .metric-card:hover::before, .kpi-card:hover::before { opacity: 1; }
.stat-icon { font-size: 22px; margin-bottom: 6px; opacity: 0.85; }
.stat-value, .stat-val, .metric-value, .kpi-val {
  font-size: 26px; font-weight: 800; line-height: 1.1;
  letter-spacing: -0.02em; color: var(--bento-text);
  font-feature-settings: "tnum" 1;
}
.stat-label, .stat-lbl, .metric-label, .kpi-lbl {
  font-size: 11px; color: var(--bento-text-secondary);
  margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
}
.stat-num {
  font-size: 24px; font-weight: 800; color: var(--bento-primary);
  font-feature-settings: "tnum" 1; letter-spacing: -0.02em;
}
.stat-sub { font-size: 12px; color: var(--bento-text-muted); font-weight: 500; }

/* ── Overview grid ───────────────────────────── */
.overview-grid, .stats-grid, .summary-grid, .stat-cards, .kpi-grid, .metrics-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px; margin-bottom: 20px;
}

/* ── Section headers ─────────────────────────── */
.section-header, .section-title {
  display: flex; align-items: center; justify-content: space-between;
  position: relative; padding-left: 12px;
  font-size: 12px; font-weight: 700; color: var(--bento-text-secondary);
  text-transform: uppercase; letter-spacing: 0.08em;
  margin: 16px 0 10px;
}
.section-header::before, .section-title::before {
  content: ""; width: 4px; height: 4px; border-radius: 50%; background: var(--bento-primary);
  position: absolute; left: 0; top: 50%; transform: translateY(-50%); flex-shrink: 0;
}

/* ── Loading / Empty / Info ──────────────────── */
.loading-bar {
  height: 3px; border-radius: var(--bento-radius-pill);
  background: linear-gradient(90deg, var(--bento-primary), var(--bento-primary-2), transparent);
  background-size: 200% 100%;
  animation: bentoLoad 1.5s linear infinite; margin-bottom: 12px;
}
@keyframes bentoLoad { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.empty-state, .no-data, .no-results {
  text-align: center; color: var(--bento-text-secondary);
  padding: 40px 20px; font-size: 14px;
  background: var(--bento-bg-2); border-radius: var(--bento-radius-md);
  border: 1px dashed var(--bento-border);
}
.info-note, .tip-box {
  font-size: 13px; color: var(--bento-text-secondary);
  background: var(--bento-primary-light);
  border-radius: var(--bento-radius-sm); padding: 12px 14px;
  border-left: 3px solid var(--bento-primary); margin-top: 12px;
  line-height: 1.55;
}
.last-updated {
  font-size: 11px; color: var(--bento-text-muted);
  text-align: right; margin-top: 12px; font-feature-settings: "tnum" 1;
}

/* ── Buttons (premium) ───────────────────────── */
.refresh-btn {
  background: var(--bento-bg-2); border: 1px solid var(--bento-border);
  border-radius: var(--bento-radius-pill); padding: 6px 14px;
  font-size: 12px; color: var(--bento-text-secondary);
  cursor: pointer; font-weight: 600; transition: all var(--bento-trans);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif;
}
.refresh-btn:hover {
  background: var(--bento-card); color: var(--bento-primary);
  border-color: var(--bento-primary); transform: translateY(-1px);
  box-shadow: var(--bento-shadow-sm);
}
.toggle-btn, .action-btn {
  background: var(--bento-grad-primary); border: none;
  border-radius: var(--bento-radius-xs); padding: 8px 16px;
  font-size: 13px; color: #fff; cursor: pointer; font-weight: 600;
  transition: all var(--bento-trans); font-family: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif;
  letter-spacing: -0.005em;
  box-shadow: 0 4px 12px -2px var(--bento-primary-glow);
}
.toggle-btn:hover, .action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px -4px var(--bento-primary-glow);
}
.send-btn, .btn-primary {
  width: 100%;
  background: var(--bento-grad-primary); color: #fff;
  border: none; border-radius: var(--bento-radius-sm);
  padding: 12px 20px; font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif;
  letter-spacing: -0.01em;
  transition: all var(--bento-trans);
  box-shadow: 0 4px 14px -2px var(--bento-primary-glow);
}
.send-btn:hover, .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -6px var(--bento-primary-glow);
}
.send-btn:active, .btn-primary:active { transform: translateY(0); }
.send-btn:disabled, .btn-primary:disabled {
  opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none;
}

/* ── Badges / Status (modern pill) ───────────── */
.badge, .status-badge, .tag, .chip {
  padding: 4px 12px; border-radius: var(--bento-radius-pill);
  font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;
  letter-spacing: 0.04em; text-transform: uppercase;
  border: 1px solid;
}
.badge-ok, .badge-success { background: var(--bento-success-light); color: var(--bento-success); border-color: var(--bento-success-border); }
.badge-er, .badge-error   { background: var(--bento-error-light);   color: var(--bento-error);   border-color: var(--bento-error-border); }
.badge-warn, .badge-warning { background: var(--bento-warning-light); color: var(--bento-warning); border-color: var(--bento-warning-border); }
.badge-info { background: var(--bento-info-light); color: var(--bento-info); border-color: var(--bento-info-border); }

.count-badge {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: var(--bento-radius-pill); display: inline-flex; align-items: center;
  font-feature-settings: "tnum" 1;
}
.error-badge { background: var(--bento-error-light); color: var(--bento-error); border: 1px solid var(--bento-error-border); }
.warn-badge  { background: var(--bento-warning-light); color: var(--bento-warning); border: 1px solid var(--bento-warning-border); }
.info-badge  { background: var(--bento-primary-light); color: var(--bento-primary); border: 1px solid var(--bento-border); }
.ok-badge    { background: var(--bento-success-light); color: var(--bento-success); border: 1px solid var(--bento-success-border); }

/* ── Tables (modern) ─────────────────────────── */
table { width: 100%; border-collapse: separate; border-spacing: 0; }
th {
  background: var(--bento-bg-2); color: var(--bento-text-secondary);
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  padding: 12px 16px; text-align: left;
  border-bottom: 1px solid var(--bento-border);
}
th:first-child { border-top-left-radius: var(--bento-radius-sm); }
th:last-child  { border-top-right-radius: var(--bento-radius-sm); }
td {
  padding: 14px 16px; border-bottom: 1px solid var(--bento-border);
  color: var(--bento-text); font-size: 13px;
}
tr { transition: background var(--bento-trans-fast); }
tr:hover td { background: var(--bento-primary-light); }
tr:last-child td { border-bottom: 0; }

/* ── Forms / Inputs ──────────────────────────── */
input, select, textarea {
  padding: 10px 14px; border: 1.5px solid var(--bento-border);
  border-radius: var(--bento-radius-xs);
  background: var(--bento-card); color: var(--bento-text);
  font-size: 14px; font-family: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif;
  transition: all var(--bento-trans); outline: none;
  letter-spacing: -0.005em;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--bento-primary);
  box-shadow: 0 0 0 4px var(--bento-primary-light);
}
input::placeholder, textarea::placeholder { color: var(--bento-text-muted); }

/* ── Code blocks ─────────────────────────────── */
code {
  background: var(--bento-bg-2); padding: 2px 6px;
  border-radius: 4px; font-size: 12px;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  border: 1px solid var(--bento-border);
}
pre {
  background: #1e1e2e; color: #e2e8f0;
  padding: 16px; border-radius: var(--bento-radius-sm);
  font-size: 12.5px; overflow-x: auto; line-height: 1.65;
  white-space: pre-wrap; word-break: break-word;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  box-shadow: var(--bento-shadow-md);
}

/* ── Grid layouts ────────────────────────────── */
.schedule-grid, .send-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.schedule-card, .send-card, .info-card {
  background: var(--bento-bg-2); border: 1px solid var(--bento-border);
  border-radius: var(--bento-radius-sm); padding: 16px;
  transition: all var(--bento-trans);
}
.schedule-card:hover, .send-card:hover, .info-card:hover {
  border-color: var(--bento-primary-light); transform: translateY(-1px);
  box-shadow: var(--bento-shadow-md);
}

/* ── Log entries ─────────────────────────────── */
.log-entry {
  display: flex; flex-wrap: wrap; align-items: flex-start;
  gap: 4px 8px; padding: 10px 12px;
  border-radius: var(--bento-radius-sm); margin-bottom: 6px;
  font-size: 12.5px; min-width: 0; overflow: hidden;
  border: 1px solid transparent; transition: all var(--bento-trans-fast);
}
.error-entry { background: var(--bento-error-light); border-color: var(--bento-error-border); }
.warn-entry  { background: var(--bento-warning-light); border-color: var(--bento-warning-border); }
.log-time { color: var(--bento-text-muted); font-feature-settings: "tnum" 1; flex-shrink: 0; font-family: "JetBrains Mono", monospace; }
.log-domain {
  font-weight: 700; flex-shrink: 1; min-width: 0; max-width: 100%;
  overflow: hidden; text-overflow: ellipsis; word-break: break-all;
}
.error-domain { color: var(--bento-error); }
.warn-domain  { color: var(--bento-warning); }
.log-msg {
  color: var(--bento-text-secondary); flex-basis: 100%;
  word-break: break-word; overflow-wrap: anywhere;
  white-space: pre-wrap; min-width: 0; line-height: 1.55;
}

/* ── Send status ─────────────────────────────── */
.send-status {
  padding: 12px 16px; border-radius: var(--bento-radius-sm);
  margin-top: 14px; font-size: 13px; font-weight: 600;
  text-align: center; letter-spacing: -0.005em;
  border: 1px solid;
}
.send-status.sending { background: var(--bento-primary-light); color: var(--bento-primary); border-color: var(--bento-border); }
.send-status.success { background: var(--bento-success-light); color: var(--bento-success); border-color: var(--bento-success-border); }
.send-status.error   { background: var(--bento-error-light);   color: var(--bento-error);   border-color: var(--bento-error-border); }

/* ── Scrollbar ───────────────────────────────── */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bento-border); border-radius: var(--bento-radius-pill); border: 2px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-thumb:hover { background: var(--bento-text-muted); background-clip: content-box; }

/* ── Animations ──────────────────────────────── */
@keyframes bentoSpin  { to { transform: rotate(360deg); } }
@keyframes bentoPulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
@keyframes bentoSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bentoStaggerIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

/* Apply stagger to grids of stat-cards */
.stats-grid > *, .overview-grid > *, .summary-grid > * {
  animation: bentoStaggerIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.stats-grid > *:nth-child(1)  { animation-delay: 0.02s; }
.stats-grid > *:nth-child(2)  { animation-delay: 0.06s; }
.stats-grid > *:nth-child(3)  { animation-delay: 0.10s; }
.stats-grid > *:nth-child(4)  { animation-delay: 0.14s; }
.stats-grid > *:nth-child(5)  { animation-delay: 0.18s; }
.stats-grid > *:nth-child(6)  { animation-delay: 0.22s; }

/* ── Mobile — 768 px ─────────────────────────── */
@media (max-width: 768px) {
  .content { padding: 16px; }
  .header { padding: 16px 16px 0; }
  .tabs { gap: 2px !important; padding: 3px !important; }
  .tab, .tab-button, .tab-btn { padding: 6px 12px !important; font-size: 12px !important; }
  .overview-grid, .stats-grid, .summary-grid, .stat-cards, .kpi-grid, .metrics-grid {
    grid-template-columns: repeat(2, 1fr); gap: 10px;
  }
  .stat-value, .stat-val, .kpi-val, .metric-val { font-size: 22px; }
  .stat-label, .stat-lbl, .kpi-lbl, .metric-lbl { font-size: 10px; }
  .send-grid, .schedule-grid { grid-template-columns: 1fr; }
  .log-entry { flex-wrap: wrap; gap: 2px 6px; padding: 8px 10px; }
  .log-domain { max-width: 60%; font-size: 11.5px; }
  .log-msg { flex-basis: 100%; max-width: 100%; font-size: 11.5px; }
  pre { padding: 12px; font-size: 11.5px; }
  h2 { font-size: 18px; }
  h3 { font-size: 15px; }
  table { font-size: 12.5px; }
  th, td { padding: 10px 12px; }
}
@media (max-width: 480px) {
  .tabs { gap: 1px !important; padding: 2px !important; }
  .tab, .tab-button, .tab-btn { padding: 5px 10px !important; font-size: 11px !important; }
  .overview-grid, .stats-grid, .summary-grid { grid-template-columns: 1fr 1fr; }
  .stat-value, .stat-val, .kpi-val { font-size: 18px; }
}
`;
/* ============================================================ */

class HaNetworkMap extends HTMLElement {
  constructor() {
    super();
    this._toolId = this.tagName.toLowerCase().replace('ha-', '');
    this._lang = (navigator.language || '').startsWith('pl') ? 'pl' : 'en';
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this.activeTab = 'devices';
    this._title = 'Network Map';
    this._routerIp = '192.168.1.1';
    this.config = {};

    // Data
    this.devices = [];
    this.filteredDevices = [];
    this._bindings = {}; // ip/name → entity_id
    this._subnets = []; // list of subnet prefixes to scan
    this._scanResults = {}; // ip → true/false (reachable)
    this._scanInProgress = false;
    this._scanProgress = { current: 0, total: 0 };
    this._lastScanTime = null;
    this._deviceRegistry = [];
    this._includeNonNetwork = false;
    this._devicePrefs = {};

    // UI State
    this.searchQuery = '';
    this._catFilter = null;
    this.sortBy = 'name';
    this.sortDesc = false;
    this._pageSize = 20;
    this._currentPage = 1;
    this.selectedDevice = null;
    this._suggestedBindings = [];

    // Rendering
    this._lastHtml = '';
    this._lastRenderTime = 0;
    this._renderScheduled = false;
    this._firstHassRender = false;
  }

  static get _translations() {
    return {
      en: {
        // Tabs
        devicesTab: 'Devices', topologyTab: 'Topology', subnetsTab: 'Subnets', bindingsTab: 'Bindings',
        // Devices tab
        searchPlaceholder: 'Search devices...', allCategories: 'All', filterCategory: 'Filter:',
        deviceName: 'Device Name', ipAddress: 'IP Address', macAddress: 'MAC', manufacturer: 'Manufacturer',
        reachable: 'Reachable', haEntity: 'HA Entity', totalDevices: 'Total', reachableCount: 'Reachable',
        unreachableCount: 'Unreachable', boundCount: 'Bound to HA',
        noDevicesFound: 'No devices found. Start a network scan.',
        scanningNetwork: 'Scanning network...', scanProgress: 'Progress',
        // Topology tab
        networkTopology: 'Network Topology', router: 'Router', gateway: 'Gateway',
        // Subnets tab
        currentSubnets: 'Current Subnets', addSubnetLabel: 'Add subnet (e.g., 192.168.1)', rescanAll: 'Scan All',
        rescan: 'Rescan', remove: 'Remove', defaultSubnet: 'Default (auto-detected)',
        // Bindings tab
        deviceBindings: 'Device Bindings', suggestedBindings: 'Suggested Bindings', accept: 'Accept',
        reject: 'Reject', manualBind: 'Manual Bind', selectEntity: '— Select entity —',
        noBoundDevices: 'No bindings yet. Suggest bindings or bind manually.',
        bind: 'Bind',
        // Status
        reachableStatus: 'Reachable', unreachableStatus: 'Unreachable',
        // Detail
        details: 'Details', bind: 'Bind', unbind: 'Unbind', close: 'Close',
        category: 'Category', status: 'Status', lastSeen: 'Last Seen',
        showOtherDevices: 'Show devices without MAC/IP', hideDevice: 'Hide device', showHidden: 'Show hidden',
        openDevice: 'Open HA device', openEntity: 'Open HA entity',
      },
      pl: {
        // Tabs
        devicesTab: 'Urządzenia', topologyTab: 'Topologia', subnetsTab: 'Sieci', bindingsTab: 'Powiązania',
        // Devices tab
        searchPlaceholder: 'Szukaj urządzeń...', allCategories: 'Wszystkie', filterCategory: 'Filtr:',
        deviceName: 'Nazwa urządzenia', ipAddress: 'Adres IP', macAddress: 'MAC', manufacturer: 'Producent',
        reachable: 'Dostępne', haEntity: 'Encja HA', totalDevices: 'Razem', reachableCount: 'Dostępne',
        unreachableCount: 'Niedostępne', boundCount: 'Powiązane z HA',
        noDevicesFound: 'Brak urządzeń. Uruchom skanowanie sieci.',
        scanningNetwork: 'Skanowanie sieci...', scanProgress: 'Postęp',
        // Topology tab
        networkTopology: 'Topologia sieci', router: 'Router', gateway: 'Brama',
        // Subnets tab
        currentSubnets: 'Bieżące sieci', addSubnetLabel: 'Dodaj sieć (np. 192.168.1)', rescanAll: 'Skanuj wszystko',
        rescan: 'Skanuj', remove: 'Usuń', defaultSubnet: 'Domyślna (auto-wykryta)',
        // Bindings tab
        deviceBindings: 'Powiązania urządzeń', suggestedBindings: 'Sugerowane powiązania', accept: 'Zaakceptuj',
        reject: 'Odrzuć', manualBind: 'Powiąż ręcznie', selectEntity: '— Wybierz encję —',
        noBoundDevices: 'Brak powiązań. Zasugeruj powiązania lub powiąż ręcznie.',
        bind: 'Powiąż',
        // Status
        reachableStatus: 'Dostępne', unreachableStatus: 'Niedostępne',
        // Detail
        details: 'Szczegóły', bind: 'Powiąż', unbind: 'Rozpowiąż', close: 'Zamknij',
        category: 'Kategoria', status: 'Stan', lastSeen: 'Ostatnio widoczne',
        showOtherDevices: 'Pokaż urządzenia bez MAC/IP', hideDevice: 'Ukryj urządzenie', showHidden: 'Pokaż ukryte',
        openDevice: 'Otwórz urządzenie HA', openEntity: 'Otwórz encję HA',
      }
    };
  }

  _t(key) {
    const lang = this._hass?.language || this._lang || 'en';
    const T = HaNetworkMap._translations;
    return (T[lang] || T['en'])[key] || T['en'][key] || key;
  }

  setConfig(config) {
    this.config = config;
    this._title = config.title || 'Network Map';
    this._routerIp = config.router_ip || '192.168.1.1';
    this._lastHtml = '';
  }

  set hass(hass) {
    try {
      var _bg = (getComputedStyle(this).getPropertyValue('--card-background-color') || getComputedStyle(this).getPropertyValue('--primary-background-color') || '').trim();
      var _d = false;
      if (_bg) {
        var _h, _r, _g, _b, _m;
        if (_bg.charAt(0) === '#') { _h = _bg.slice(1); if (_h.length === 3) _h = _h.replace(/(.)/g, '$1$1'); _r = parseInt(_h.slice(0,2),16); _g = parseInt(_h.slice(2,4),16); _b = parseInt(_h.slice(4,6),16); }
        else { _m = _bg.match(/[\d.]+/g); if (_m) { _r = +_m[0]; _g = +_m[1]; _b = +_m[2]; } }
        if (_r != null) _d = (0.2126*_r + 0.7152*_g + 0.0722*_b) / 255 < 0.5;
      } else if (hass && hass.themes) { _d = !!hass.themes.darkMode; }
      this.classList.toggle('bento-dark', _d);
    } catch (e) {}
    if (!hass) return;
    if (hass?.language) this._lang = hass.language.startsWith('pl') ? 'pl' : 'en';
    this._hass = hass;

    if (!this._firstHassRender) {
      this._firstHassRender = true;
      // v5: no client-side subnet config / cached scan results. The
      // bundled Python integration owns the canonical device list and
      // reachability data; we just pull it once on first hass connect.
      this._loadBindings();
      this._loadDevicePrefs();
      this._loadDeviceRegistry().then(() => this._reloadFromApi()).then(() => {
        this._doRender();
      });
      return;
    }

    // Skip DOM rebuilds while the user is typing in a field. A full re-render
    // on every hass update drops focus + wipes unbound inputs (the "one char at
    // a time" report on networks with many devices). Resume after blur.
    if (this._isEditing()) return;

    const now = Date.now();
    if (now - (this._lastRenderTime || 0) < 5000) {
      if (!this._renderScheduled) {
        this._renderScheduled = true;
        this._renderTimer = setTimeout(() => {
          this._renderTimer = null;
          this._renderScheduled = false;
          if (this._isEditing()) return;
          this._buildDeviceList();
          this._doRender();
          this._lastRenderTime = Date.now();
        }, 5000 - (now - (this._lastRenderTime || 0)));
      }
      return;
    }
    this._buildDeviceList();
    this._doRender();
    this._lastRenderTime = now;
  }

  async _loadDeviceRegistry() {
    if (!this._hass) return;
    try {
      this._deviceRegistry = await this._hass.callWS({ type: 'config/device_registry/list' });
    } catch (e) {
      console.warn('[ha-network-map] device registry load failed:', e);
      this._deviceRegistry = [];
    }
  }

  _getRegistryInfo() {
    const lookup = {};
    (this._deviceRegistry || []).forEach(d => {
      const mac = d.connections?.find(c => c[0] === 'mac')?.[1] || null;
      const ipMatch = d.configuration_url ? d.configuration_url.match(/(\d+\.\d+\.\d+\.\d+)/) : null;
      const ip = ipMatch ? ipMatch[1] : null;
      if (mac || ip) {
        const name = (d.name_by_user || d.name || '').toLowerCase();
        lookup[name] = { mac, ip, manufacturer: d.manufacturer || null, model: d.model || null };
      }
    });
    return lookup;
  }

  _loadSubnets() {
    try {
      const stored = localStorage.getItem('ha-tools-net-subnets');
      if (stored) {
        this._subnets = JSON.parse(stored);
      } else {
        this._subnets = [this._detectDefaultSubnet()];
        this._saveSubnets();
      }
    } catch (e) {
      this._subnets = [this._detectDefaultSubnet()];
    }
  }

  _saveSubnets() {
    try {
      localStorage.setItem('ha-tools-net-subnets', JSON.stringify(this._subnets));
    } catch (e) { console.debug('[ha-network-map] caught:', e); }
  }

  _loadBindings() {
    try {
      const stored = localStorage.getItem('ha-tools-net-bindings');
      this._bindings = stored ? JSON.parse(stored) : {};
    } catch (e) {
      this._bindings = {};
    }
  }

  _saveBindings() {
    try {
      localStorage.setItem('ha-tools-net-bindings', JSON.stringify(this._bindings));
    } catch (e) { console.debug('[ha-network-map] caught:', e); }
  }

  _loadDevicePrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem('ha-network-map-device-prefs') || '{}');
      this._devicePrefs = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch (e) { this._devicePrefs = {}; }
  }

  _saveDevicePrefs() {
    try { localStorage.setItem('ha-network-map-device-prefs', JSON.stringify(this._devicePrefs)); }
    catch (e) { console.warn('[ha-network-map] Device preferences could not be saved', e); }
  }

  _preferenceId(device) { return device.device_id ? `device:${device.device_id}` : device.mac ? `mac:${device.mac.toLowerCase()}` : `key:${device.key}`; }

  _detectDefaultSubnet() {
    // Try to detect subnet from router IP config
    if (this._routerIp && /^\d+\.\d+\.\d+\.\d+$/.test(this._routerIp)) {
      const parts = this._routerIp.split('.');
      return parts.slice(0, 3).join('.');
    }
    // Try to detect from current browser URL (HA instance IP)
    try {
      const host = window.location.hostname;
      if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        return host.split('.').slice(0, 3).join('.');
      }
    } catch (e) { console.debug('[ha-network-map] caught:', e); }
    return '192.168.1';
  }

  _initSubnetsOnly() {
    if (this._subnets.length === 0) {
      this._subnets = [this._detectDefaultSubnet()];
      this._saveSubnets();
    }
  }

  async _startAutoScan() {
    // Retained for backward compat; now only used when explicitly invoked.
    this._initSubnetsOnly();
    await this._scanAllSubnets();
  }

  async _scanAllSubnets() {
    // v5: delegate to the bundled Python integration's server-side scan.
    // The previous browser-side path (per-IP fetch() HEAD probes against
    // [80, 443, 8080, 8123]) was rejected by the HACS reviewer for three
    // reasons: 1) it claimed "no external network calls" in the README
    // while in fact firing real outbound HTTP requests; 2) it probed
    // whatever LAN the user's browser happened to be on, not the home
    // LAN (Nabu Casa Cloud, mobile data, coffee-shop WiFi); 3) the port
    // list was HTTP-only and missed ESPHome / MQTT / RTSP / SSH / IPP.
    //
    // The Python integration handles all three: probes run from the HA
    // host (always the home LAN), use a smart-home port set, and skip
    // public IPs by default.
    if (this._scanInProgress) return;
    if (!this._hass) {
      this._scanError = this._integrationMissingHint();
      this._doRender();
      return;
    }
    this._scanInProgress = true;
    this._scanError = null;
    this._scanProgress = { current: 0, total: 0 };
    this._doRender();

    try {
      const status = await this._hass.callWS({ type: 'ha_network_map/scan' });
      this._lastScanStatus = status || {};
      this._lastScanTime = (status && status.last_scan_finished_at)
        ? Math.floor(status.last_scan_finished_at * 1000)
        : Date.now();
      await this._reloadFromApi();
    } catch (e) {
      console.warn('[ha-network-map] scan failed:', e);
      this._scanError = (e && e.message) ? e.message : this._integrationMissingHint();
    } finally {
      this._scanInProgress = false;
      this._scanProgress = { current: 0, total: 0 };
      this._doRender();
    }
  }

  async _reloadFromApi() {
    // Pull the canonical device list from the integration. Translates
    // the integration's shape ({devices: [{ip, reachable, open_ports,
    // ...}]}) into the legacy `_scanResults[ip] = bool` map so the
    // existing renderer stays untouched, and stores the full row under
    // `_integrationDevices` for the richer info the renderer can use.
    if (!this._hass) return;
    try {
      const res = await this._hass.callWS({ type: 'ha_network_map/list_devices', include_non_network: this._includeNonNetwork });
      const list = (res && res.devices) || [];
      this._integrationDevices = list;
      const reachMap = {};
      for (const d of list) {
        if (d && d.ip) reachMap[d.ip] = d.reachable === true;
      }
      this._scanResults = reachMap;
      this._buildDeviceList();
    } catch (e) {
      console.warn('[ha-network-map] list_devices failed:', e);
      this._scanError = this._integrationMissingHint();
    }
  }

  _integrationMissingHint() {
    return (this._lang === 'pl')
      ? 'Brak integracji ha_network_map. Zainstaluj ją z HACS i dodaj w Ustawieniach → Urządzenia i usługi.'
      : 'The ha_network_map integration is missing. Install it from HACS and add it under Settings → Devices & services.';
  }

  // v5: the v4 browser-side _scanSubnet/_pingIp/_persistScanResults path
  // is gone — see comment on _scanAllSubnets above. These stubs only
  // exist so any caller that wasn't migrated never blows up.
  async _scanSubnet() { return; }
  async _pingIp() { return false; }
  _persistScanResults() { /* no-op in v5 */ }
  _loadCachedScanResults() { /* no-op in v5 */ }

  _cat(name, attr) {
    const a = (name + ' ' + ((attr && attr.model) || '') + ' ' + ((attr && attr.manufacturer) || '')).toLowerCase();
    if (/phone|iphone|android|mobile|pixel|galaxy/.test(a)) return 'Phone';
    if (/tablet|ipad/.test(a)) return 'Tablet';
    if (/computer|laptop|pc|mac|desktop/.test(a)) return 'Computer';
    if (/router|gateway|access.?point|ap |mesh|wifi/.test(a)) return 'Router';
    if (/camera|doorbell|ring/.test(a)) return 'Camera';
    if (/light|bulb|lamp/.test(a)) return 'Smart Home';
    if (/sensor|motion|temperature/.test(a)) return 'Smart Home';
    if (/tv|media|kodi|plex/.test(a)) return 'Media';
    if (/voice|echo|alexa/.test(a)) return 'Smart Home';
    return 'Other';
  }

  _icon(name, attr) {
    const c = this._cat(name, attr);
    return ({
      Phone: '📱', Tablet: '📲', Computer: '💻', Router: '📡',
      Camera: '📷', 'Smart Home': '🏠', Media: '📺', Other: '📡'
    })[c] || '📡';
  }

  _buildDeviceList() {
    this.devices = [];
    const seen = new Set();
    // The integration is the only discovery source. Mixing its rows with
    // browser-side trackers duplicated devices and admitted addressless rows.
    if (Array.isArray(this._integrationDevices)) {
      for (const d of this._integrationDevices) {
        if (!d) continue;
        const dedupeKey = d.mac || d.ip || d.key;
        if (!dedupeKey || seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        if (d.ip) seen.add(d.ip);
        const name = d.name || d.ip || d.mac || 'Unknown';
        const preferenceId = this._preferenceId(d);
        const preference = this._devicePrefs[preferenceId] || {};
        if (preference.hidden && !this._showHidden) continue;
        this.devices.push({
          key: d.key, device_id: d.device_id || null, kind: d.kind || 'network', preferenceId,
          ip: d.ip || null,
          mac: d.mac || null,
          manufacturer: d.manufacturer || null,
          model: d.model || null,
          name,
          category: preference.category || this._cat(name, { manufacturer: d.manufacturer, model: d.model }),
          icon: this._icon(name, { manufacturer: d.manufacturer, model: d.model }),
          reachable: (d.reachable === true) ? true : (d.reachable === false ? false : null),
          entity_id: (d.entity_ids && d.entity_ids[0]) || null,
          entity_ids: d.entity_ids || [],
          state: null,
          source_type: null,
          sources: d.sources || [],
          open_ports: d.open_ports || [],
          lastSeen: null,
          binding: this._bindings[dedupeKey] || null
        });
      }
    }

    this._filterSort();
  }

  _filterSort() {
    let f = this.devices;
    if (this._catFilter && this._catFilter !== 'all') {
      f = f.filter(d => d.category === this._catFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      f = f.filter(d =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.ip && d.ip.includes(q)) ||
        (d.mac && d.mac.toLowerCase().includes(q)) ||
        (d.manufacturer && d.manufacturer.toLowerCase().includes(q))
      );
    }

    f.sort((a, b) => {
      let av, bv;
      if (this.sortBy === 'reachable') {
        av = a.reachable ? 0 : 1;
        bv = b.reachable ? 0 : 1;
      } else if (this.sortBy === 'category') {
        av = a.category;
        bv = b.category;
      } else if (this.sortBy === 'ip') {
        av = a.ip ? a.ip.split('.').map(n => parseInt(n)).join('.') : 'zzz';
        bv = b.ip ? b.ip.split('.').map(n => parseInt(n)).join('.') : 'zzz';
      } else {
        av = a.name;
        bv = b.name;
      }
      const r = av < bv ? -1 : av > bv ? 1 : 0;
      return this.sortDesc ? -r : r;
    });

    this.filteredDevices = f;
    // Do NOT reset the page here. _filterSort() runs on every hass-driven
    // rebuild, so resetting would snap the table back to page 1 ~every second
    // on busy networks. Page reset lives in the search/filter/sort handlers.
    const _tp = Math.max(1, Math.ceil(f.length / this._pageSize));
    if (this._currentPage > _tp) this._currentPage = _tp;
  }

  _isEditing() {
    const ae = this.shadowRoot && this.shadowRoot.activeElement;
    if (!ae) return false;
    const t = (ae.tagName || '').toUpperCase();
    return t === 'INPUT' || t === 'TEXTAREA';
  }

  _doRender() {
    if (!this._hass) return;
    const css = this._css();
    let content = '';

    if (this._scanInProgress) {
      content = this._renderScanOverlay();
    } else {
      switch (this.activeTab) {
        case 'devices': content = this._renderDevicesTab(); break;
        case 'topology': content = this._renderTopologyTab(); break;
        case 'bindings': content = this._renderBindingsTab(); break;
      }
    }

    const html = css + '<div class="card">' +
      '<div class="card-header-wrapper">' +
      '<div class="card-header">📡 ' + this._title + '</div>' +
      '<div class="header-footer">' +
      (this._lastScanTime ? '<span style="font-size:11px;color:var(--bento-text-secondary);">Scanned: ' + new Date(this._lastScanTime).toLocaleTimeString() + '</span>' : '') +
      '<button class="rb" id="rescanBtn">🔄 ' + (this._lang === 'pl' ? 'Skanuj' : 'Rescan') + '</button>' +
      '</div>' +
      '</div>' +
      '<div class="tabs">' +
      '<button class="tab-btn ' + (this.activeTab === 'devices' ? 'active' : '') + '" data-tab="devices">' + this._t('devicesTab') + '</button>' +
      '<button class="tab-btn ' + (this.activeTab === 'topology' ? 'active' : '') + '" data-tab="topology">' + this._t('topologyTab') + '</button>' +
      '<button class="tab-btn ' + (this.activeTab === 'bindings' ? 'active' : '') + '" data-tab="bindings">' + this._t('bindingsTab') + '</button>' +
      '</div>' +
      (this._scanError ? '<div style="margin:8px 12px;padding:10px 14px;background:var(--bento-error-light);color:var(--bento-error);border:1px solid var(--bento-error-border);border-radius:var(--bento-radius-sm);font-size:13px;">⚠️ ' + this._scanError + '</div>' : '') +
      content +
      '</div>';

    const support = this._hass?.user?.is_admin && this.config?.show_support !== false && !supportDismissed() ? ownDonateFooter() : '';
    if (this._lastHtml === html + support) return;
    // Preserve focus + caret across the full innerHTML rebuild so typing in an
    // input (search / subnet / config) survives data-driven re-renders instead
    // of dropping a character per refresh.
    const _ae = this.shadowRoot.activeElement;
    const _fid = _ae && _ae.id;
    let _ss = null, _se = null;
    try { if (_ae) { _ss = _ae.selectionStart; _se = _ae.selectionEnd; } } catch (e) {}
    this._lastHtml = html + support;
    this.shadowRoot.innerHTML = html + support;
    this._bindEvents();
    if (_fid) {
      const _el = this.shadowRoot.getElementById(_fid);
      if (_el) { try { _el.focus(); if (_ss != null && _el.setSelectionRange) _el.setSelectionRange(_ss, _se); } catch (e) {} }
    }
  }

  _renderScanOverlay() {
    const prog = Math.round((this._scanProgress.current / (this._scanProgress.total || 1)) * 100);
    return '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:1000;border-radius:var(--bento-radius-md)">' +
      '<div style="background:var(--bento-card);padding:32px;border-radius:var(--bento-radius-md);text-align:center">' +
      '<div style="font-size:32px;margin-bottom:16px">⏳</div>' +
      '<div style="font-size:16px;font-weight:500;margin-bottom:16px;color:var(--bento-text)">' + this._t('scanningNetwork') + '</div>' +
      '<div style="width:200px;height:4px;background:var(--bento-border);border-radius:2px;margin-bottom:8px;overflow:hidden">' +
      '<div style="width:' + prog + '%;height:100%;background:var(--bento-primary);transition:width .3s"></div>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--bento-text-secondary)">' + this._scanProgress.current + '/' + this._scanProgress.total + '</div>' +
      '</div>' +
      '</div>';
  }

  _renderDevicesTab() {
    const total = this.devices.length;
    const reachable = this.devices.filter(d => d.reachable === true).length;
    const unreachable = this.devices.filter(d => d.reachable === false).length;
    const unknown = total - reachable - unreachable;
    const bound = this.devices.filter(d => d.binding).length;
    const cats = [...new Set(this.devices.map(d => d.category))].sort();

    let h = '<div class="stats-bar">' +
      '<div class="stat-mini"><div class="sv">' + total + '</div><div class="sl">' + this._t('totalDevices') + '</div></div>' +
      '<div class="stat-mini so"><div class="sv">' + reachable + '</div><div class="sl">' + this._t('reachableCount') + '</div></div>' +
      '<div class="stat-mini sa"><div class="sv">' + unreachable + '</div><div class="sl">' + this._t('unreachableCount') + '</div></div>' +
      '<div class="stat-mini sz"><div class="sv">' + bound + '</div><div class="sl">' + this._t('boundCount') + '</div></div>' +
      '</div>';

    if (!this.devices.length) {
      return h + '<div class="toolbar"><label><input id="showOther" type="checkbox"' + (this._includeNonNetwork ? ' checked' : '') + '> ' + this._t('showOtherDevices') + '</label><label><input id="showHidden" type="checkbox"' + (this._showHidden ? ' checked' : '') + '> ' + this._t('showHidden') + '</label></div><div class="es">' + this._t('noDevicesFound') + '</div>';
    }

    if (this.selectedDevice) {
      h += this._renderDeviceDetail(this.selectedDevice);
    }

    const catOpts = cats.map(c => '<option value="' + c + '"' + (this._catFilter === c ? ' selected' : '') + '>' + c + '</option>').join('');
    h += '<div class="toolbar"><input type="text" class="si" id="sI" placeholder="' + this._t('searchPlaceholder') + '" value="' + _esc(this.searchQuery || '') + '">' +
      '<select class="fs" id="cF"><option value="all">' + this._t('allCategories') + '</option>' + catOpts + '</select>' +
      '<label><input id="showOther" type="checkbox"' + (this._includeNonNetwork ? ' checked' : '') + '> ' + this._t('showOtherDevices') + '</label>' +
      '<label><input id="showHidden" type="checkbox"' + (this._showHidden ? ' checked' : '') + '> ' + this._t('showHidden') + '</label></div>';

    const ps = this._pageSize;
    const tp = Math.max(1, Math.ceil(this.filteredDevices.length / ps));
    const pg = Math.min(this._currentPage, tp);
    this._currentPage = pg;
    const items = this.filteredDevices.slice((pg - 1) * ps, pg * ps);

    const sa = (c) => this.sortBy === c ? (this.sortDesc ? ' ▼' : ' ▲') : '';
    let rows = '';
    items.forEach((d, i) => {
      const dot = d.reachable === true ? '<span style="color:#10B981">\u25CF</span>' : d.reachable === false ? '<span style="color:#EF4444">\u25CF</span>' : '<span style="color:#94A3B8">\u2014</span>';
      rows += '<tr data-i="' + i + '"><td><span class="di">' + _esc(d.icon) + '</span><span class="dn">' + _esc(d.name) + '</span></td>' +
        '<td>' + _esc(d.category) + '</td>' +
        '<td class="mn">' + _esc(d.ip || '—') + '</td>' +
        '<td class="mn">' + _esc(d.mac || '—') + '</td>' +
        '<td>' + _esc(d.manufacturer || '—') + '</td>' +
        '<td style="text-align:center">' + dot + '</td>' +
        '<td><small>' + _esc(d.binding ? d.binding : '—') + '</small></td>' +
        '</tr>';
    });

    h += '<div class="tw"><table><thead><tr>' +
      '<th data-s="name">' + this._t('deviceName') + sa('name') + '</th>' +
      '<th data-s="category">' + this._t('category') + sa('category') + '</th>' +
      '<th data-s="ip">' + this._t('ipAddress') + sa('ip') + '</th>' +
      '<th data-s="mac">' + this._t('macAddress') + '</th>' +
      '<th data-s="manufacturer">' + this._t('manufacturer') + '</th>' +
      '<th data-s="reachable">' + this._t('reachable') + sa('reachable') + '</th>' +
      '<th>' + this._t('haEntity') + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    if (tp > 1) {
      h += '<div class="pg"><button class="pb" data-p="' + (pg - 1) + '"' + (pg <= 1 ? ' disabled' : '') + '>‹ Prev</button>' +
        '<span class="pi2">' + pg + ' / ' + tp + ' (' + this.filteredDevices.length + ')</span>' +
        '<button class="pb" data-p="' + (pg + 1) + '"' + (pg >= tp ? ' disabled' : '') + '>Next ›</button></div>';
    }

    return h;
  }

  _renderDeviceDetail(d) {
    let rows = [
      [this._t('deviceName'), _esc(d.icon) + ' ' + _esc(d.name)],
      [this._t('category'), _esc(d.category)],
      [this._t('status'), d.reachable === null ? 'N/A' : d.reachable ? this._t('reachableStatus') : this._t('unreachableStatus')],
      [this._t('ipAddress'), _esc(d.ip || '—')],
      [this._t('macAddress'), _esc(d.mac || '—')]
    ];
    if (d.manufacturer) rows.push([this._t('manufacturer'), _esc(d.manufacturer + (d.model ? ' ' + d.model : ''))]);
    if (d.entity_id) rows.push(['Entity', _esc(d.entity_id)]);

    const rh = rows.map(r => '<div class="dr"><span class="dl">' + r[0] + '</span><span class="dv">' + r[1] + '</span></div>').join('');
    const bindHtml = d.reachable ? '<button class="rb" id="bindBtn" data-ip="' + _esc(d.ip || d.name) + '">🔗 ' + this._t('bind') + '</button>' : '';
    const categories = ['Phone', 'Tablet', 'Computer', 'Router', 'Camera', 'Smart Home', 'Media', 'Other'];
    const categorySelect = '<label>' + this._t('category') + ' <select id="deviceCategory">' + categories.map(c => '<option value="' + c + '"' + (d.category === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></label>';
    const links = (d.device_id ? '<a href="/config/devices/device/' + encodeURIComponent(d.device_id) + '">' + this._t('openDevice') + '</a> ' : '') +
      (d.entity_id ? '<a href="/config/entities/entity/' + encodeURIComponent(d.entity_id) + '">' + this._t('openEntity') + '</a>' : '');
    const hidden = !!this._devicePrefs[d.preferenceId]?.hidden;

    return '<div class="dd" id="dD"><button class="dc" id="cD">✕ ' + this._t('close') + '</button><div style="clear:both"></div>' +
      rh + '<div style="margin-top:12px">' + categorySelect + ' <button class="rb" id="hideDevice">' + (hidden ? this._t('showHidden') : this._t('hideDevice')) + '</button> ' + links + ' ' + bindHtml + '</div></div>';
  }

  _renderTopologyTab() {
    // ── Empty state ──────────────────────────────────────────────────────────
    if (!this.devices.length) {
      return '<div class="es" style="padding:60px 20px;">' +
        '<div style="font-size:40px;margin-bottom:12px;">🔍</div>' +
        '<div style="font-weight:600;font-size:15px;margin-bottom:6px;color:var(--bento-text);">' +
        (this._lang === 'pl' ? 'Brak urządzeń w topologii' : 'Run a scan to see the topology') +
        '</div>' +
        '<div style="font-size:12px;color:var(--bento-text-secondary);">' +
        (this._lang === 'pl' ? 'Kliknij Skanuj, aby wykryć urządzenia w sieci.' : 'Click Rescan to discover devices on your network.') +
        '</div></div>';
    }

    // ── Category colour palette (Bento tokens) ───────────────────────────────
    const CAT_COLOR = {
      'Router':     { fill: 'var(--bento-primary)',        stroke: 'var(--bento-primary)' },
      'Computer':   { fill: 'var(--bento-info)',           stroke: 'var(--bento-info)' },
      'Phone':      { fill: 'var(--bento-success)',        stroke: 'var(--bento-success)' },
      'Tablet':     { fill: 'var(--bento-success)',        stroke: 'var(--bento-success)' },
      'Camera':     { fill: 'var(--bento-warning)',        stroke: 'var(--bento-warning)' },
      'Smart Home': { fill: 'var(--bento-primary-2)',      stroke: 'var(--bento-primary-2)' },
      'Media':      { fill: 'var(--bento-primary-3)',      stroke: 'var(--bento-primary-3)' },
      'Other':      { fill: 'var(--bento-text-secondary)', stroke: 'var(--bento-text-secondary)' }
    };
    const COLOR_UNREACHABLE_FILL   = 'var(--bento-text-muted)';
    const COLOR_UNREACHABLE_STROKE = 'var(--bento-border)';

    // ── Clutter handling: cap at 40 visible device nodes ────────────────────
    const MAX_NODES = 40;
    let deviceNodes = this.devices.slice();
    let groupNodes  = [];

    if (deviceNodes.length > MAX_NODES) {
      deviceNodes.sort((a, b) => {
        const ar = a.reachable === true ? 0 : a.reachable === false ? 1 : 2;
        const br = b.reachable === true ? 0 : b.reachable === false ? 1 : 2;
        return ar - br;
      });
      const shown  = deviceNodes.slice(0, MAX_NODES);
      const hidden = deviceNodes.slice(MAX_NODES);
      deviceNodes  = shown;
      const byCat  = {};
      hidden.forEach(d => {
        const c = d.category || 'Other';
        byCat[c] = (byCat[c] || 0) + 1;
      });
      Object.keys(byCat).forEach(cat => {
        groupNodes.push({ isSummary: true, category: cat, count: byCat[cat] });
      });
    }

    // ── SVG canvas geometry ──────────────────────────────────────────────────
    // viewBox 800×520 — scales to card width via CSS width:100%.
    // Inner ring (r=180): individual device nodes.
    // Outer ring (r=290): category summary nodes when >40 devices.
    const VW = 800, VH = 520;
    const cx = VW / 2, cy = VH / 2;
    const INNER_R   = 180;
    const OUTER_R   = 290;
    const NODE_R    = 18;
    const HUB_R     = 28;
    const SUMMARY_R = 22;

    // Assign polar angles starting at 12 o'clock (−π/2)
    const total = deviceNodes.length;
    deviceNodes.forEach((d, i) => {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      d._x = cx + Math.cos(angle) * INNER_R;
      d._y = cy + Math.sin(angle) * INNER_R;
    });
    const gTotal = groupNodes.length;
    groupNodes.forEach((g, i) => {
      const angle = (i / (gTotal || 1)) * Math.PI * 2 - Math.PI / 2;
      g._x = cx + Math.cos(angle) * OUTER_R;
      g._y = cy + Math.sin(angle) * OUTER_R;
    });

    // ── SVG build ────────────────────────────────────────────────────────────
    let svg = '<svg viewBox="0 0 ' + VW + ' ' + VH + '" xmlns="http://www.w3.org/2000/svg"' +
      ' style="width:100%;display:block;background:var(--bento-bg);' +
      'border:1px solid var(--bento-border);border-radius:var(--bento-radius-sm);"' +
      ' role="img" aria-label="Network topology graph">';

    // Defs: hub glow gradient
    svg += '<defs>' +
      '<radialGradient id="nmHubGlow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%"   stop-color="var(--bento-primary)" stop-opacity="0.25"/>' +
      '<stop offset="100%" stop-color="var(--bento-primary)" stop-opacity="0"/>' +
      '</radialGradient>' +
      '</defs>';

    // Hub glow halo
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="52" fill="url(#nmHubGlow)"/>';

    // Connector lines: devices → hub
    deviceNodes.forEach(d => {
      const isReach  = d.reachable === true;
      const isUnknwn = d.reachable === null || d.reachable === undefined;
      const opacity  = isUnknwn ? '0.25' : isReach ? '0.45' : '0.2';
      const dash     = isReach ? '' : ' stroke-dasharray="4 3"';
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + d._x + '" y2="' + d._y + '"' +
        ' stroke="var(--bento-border)" stroke-width="1.5" opacity="' + opacity + '"' + dash + '/>';
    });

    // Connector lines: group summaries → hub
    groupNodes.forEach(g => {
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + g._x + '" y2="' + g._y + '"' +
        ' stroke="var(--bento-border)" stroke-width="1" opacity="0.25" stroke-dasharray="5 4"/>';
    });

    // Device nodes
    deviceNodes.forEach(d => {
      const cat      = d.category || 'Other';
      const catColor = CAT_COLOR[cat] || CAT_COLOR['Other'];
      const isReach  = d.reachable === true;
      const isUnreach = d.reachable === false;
      const fill     = isUnreach ? COLOR_UNREACHABLE_FILL   : catColor.fill;
      const stroke   = isUnreach ? COLOR_UNREACHABLE_STROKE : catColor.stroke;
      const fillOp   = isUnreach ? '0.08' : '0.18';

      svg += '<circle cx="' + d._x + '" cy="' + d._y + '" r="' + NODE_R + '"' +
        ' fill="' + fill + '" fill-opacity="' + fillOp + '"' +
        ' stroke="' + stroke + '" stroke-width="' + (isReach ? '2' : '1.5') + '"' +
        (isUnreach ? ' stroke-dasharray="3 2"' : '') + '/>';

      // Emoji icon centred in node
      svg += '<text x="' + d._x + '" y="' + d._y + '"' +
        ' text-anchor="middle" dominant-baseline="central"' +
        ' font-size="13" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">' +
        _esc(d.icon || '📡') + '</text>';

      // Name label below node (max 12 chars)
      const label = String(d.name || d.ip || '').substring(0, 12);
      svg += '<text x="' + d._x + '" y="' + (d._y + NODE_R + 11) + '"' +
        ' text-anchor="middle" font-size="9.5"' +
        ' font-family="Inter,SF Pro,system-ui,sans-serif"' +
        ' fill="var(--bento-text-secondary)" font-weight="500">' +
        _esc(label) + '</text>';

      // Reachability dot (top-right quadrant of node)
      if (d.reachable === true || d.reachable === false) {
        const dotColor = d.reachable ? 'var(--bento-success)' : 'var(--bento-error)';
        svg += '<circle cx="' + (d._x + NODE_R * 0.7) + '" cy="' + (d._y - NODE_R * 0.7) + '"' +
          ' r="4.5" fill="' + dotColor + '" stroke="var(--bento-card)" stroke-width="1.5"/>';
      }
    });

    // Summary group nodes (outer ring)
    groupNodes.forEach(g => {
      const catColor = CAT_COLOR[g.category] || CAT_COLOR['Other'];
      svg += '<circle cx="' + g._x + '" cy="' + g._y + '" r="' + SUMMARY_R + '"' +
        ' fill="' + catColor.fill + '" fill-opacity="0.12"' +
        ' stroke="' + catColor.stroke + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      svg += '<text x="' + g._x + '" y="' + g._y + '"' +
        ' text-anchor="middle" dominant-baseline="central"' +
        ' font-size="11" font-weight="700" font-family="Inter,system-ui,sans-serif"' +
        ' fill="' + catColor.fill + '">+' + g.count + '</text>';
      svg += '<text x="' + g._x + '" y="' + (g._y + SUMMARY_R + 11) + '"' +
        ' text-anchor="middle" font-size="9" font-family="Inter,system-ui,sans-serif"' +
        ' fill="var(--bento-text-secondary)">' + _esc(g.category) + '</text>';
    });

    // Hub node (router / HA gateway)
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + HUB_R + '"' +
      ' fill="var(--bento-primary)" fill-opacity="0.18"' +
      ' stroke="var(--bento-primary)" stroke-width="2.5"/>';
    svg += '<text x="' + cx + '" y="' + cy + '"' +
      ' text-anchor="middle" dominant-baseline="central"' +
      ' font-size="18" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">📡</text>';
    const routerLabel = this._routerIp || 'Router';
    svg += '<text x="' + cx + '" y="' + (cy + HUB_R + 12) + '"' +
      ' text-anchor="middle" font-size="9.5" font-weight="600"' +
      ' font-family="SF Mono,Fira Code,monospace" fill="var(--bento-primary)">' +
      _esc(routerLabel) + '</text>';

    svg += '</svg>';

    // ── Legend ────────────────────────────────────────────────────────────────
    const reachable   = this.devices.filter(d => d.reachable === true).length;
    const unreachable = this.devices.filter(d => d.reachable === false).length;
    const unknown     = this.devices.length - reachable - unreachable;
    const clipped     = this.devices.length > MAX_NODES ? this.devices.length - MAX_NODES : 0;

    let legend = '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;' +
      'font-size:11px;color:var(--bento-text-secondary);align-items:center;">';
    legend += '<span style="display:flex;align-items:center;gap:4px;">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:var(--bento-success);display:inline-block;"></span>' +
      reachable + ' ' + (this._lang === 'pl' ? 'dostępnych' : 'reachable') + '</span>';
    legend += '<span style="display:flex;align-items:center;gap:4px;">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:var(--bento-error);display:inline-block;"></span>' +
      unreachable + ' ' + (this._lang === 'pl' ? 'niedostępnych' : 'unreachable') + '</span>';
    if (unknown > 0) {
      legend += '<span style="display:flex;align-items:center;gap:4px;">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:var(--bento-text-muted);display:inline-block;"></span>' +
        unknown + ' ' + (this._lang === 'pl' ? 'nieznanych' : 'unknown') + '</span>';
    }
    if (clipped > 0) {
      legend += '<span style="margin-left:auto;font-style:italic;">' +
        (this._lang === 'pl' ? 'Pokazano 40 z ' + this.devices.length : 'Showing 40 of ' + this.devices.length + ' devices') +
        '</span>';
    }
    legend += '</div>';

    // ── Category key ──────────────────────────────────────────────────────────
    const usedCats = [...new Set(this.devices.map(d => d.category || 'Other'))].sort();
    const catIcons = {
      'Router': '📡', 'Computer': '💻', 'Phone': '📱', 'Tablet': '📲',
      'Camera': '📷', 'Smart Home': '🏠', 'Media': '📺', 'Other': '📡'
    };
    let catKey = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">';
    usedCats.forEach(cat => {
      catKey += '<span style="display:flex;align-items:center;gap:4px;font-size:10px;' +
        'color:var(--bento-text-secondary);background:var(--bento-bg);' +
        'border:1px solid var(--bento-border);border-radius:var(--bento-radius-pill);padding:2px 8px;">' +
        (catIcons[cat] || '📡') + ' ' + _esc(cat) + '</span>';
    });
    catKey += '</div>';

    return svg + legend + catKey;
  }
  _renderSubnetsTab() {
    let h = '<div class="tree-view">';

    h += '<div class="tree-group"><div class="tree-group-header">' +
      '<span class="tree-toggle">▼</span>' +
      '<span class="tree-status-label">' + this._t('currentSubnets') + '</span>' +
      '</div><div class="tree-group-items">';

    if (this._subnets.length === 0) {
      h += '<div class="tree-item"><span style="color:var(--bento-text-secondary)">— ' + this._t('noDevicesFound') + '</span></div>';
    } else {
      this._subnets.forEach(subnet => {
        const isDefault = subnet === this._detectDefaultSubnet();
        h += '<div class="tree-item"><span class="tree-item-name">' + subnet + '.0/24</span>' +
          (isDefault ? '<span style="font-size:10px;color:var(--bento-text-muted)">(' + this._t('defaultSubnet') + ')</span>' : '') +
          '<button class="rb" style="float:right;font-size:11px" data-remove-subnet="' + subnet + '">✕</button>' +
          '</div>';
      });
    }

    h += '</div></div>';

    h += '<div style="margin-top:16px"><div style="display:flex;gap:8px">' +
      '<input type="text" class="si" id="subnetInput" placeholder="' + this._t('addSubnetLabel') + '" style="flex:1">' +
      '<button class="rb" id="addSubnetBtn">' + (this._lang === 'pl' ? 'Dodaj' : 'Add') + '</button>' +
      '<button class="rb" id="rescanSubnetBtn">🔄 ' + this._t('rescanAll') + '</button>' +
      '</div></div>';

    return h + '</div>';
  }

  _renderBindingsTab() {
    let h = '<div>';

    // Suggested bindings
    if (this._suggestedBindings.length > 0) {
      h += '<div class="tree-group" style="margin-bottom:16px"><div class="tree-group-header">' +
        '<span class="tree-toggle">▼</span>' +
        '<span class="tree-status-label">' + this._t('suggestedBindings') + ' (' + this._suggestedBindings.length + ')</span>' +
        '</div><div class="tree-group-items">';

      this._suggestedBindings.forEach(sug => {
        h += '<div class="tree-item" style="gap:4px">' +
          '<span class="tree-item-name">' + sug.deviceName + ' → ' + sug.entityName + '</span>' +
          '<button class="rb" style="font-size:11px" data-accept-suggestion="' + sug.key + '">✓</button>' +
          '<button class="rb" style="font-size:11px" data-reject-suggestion="' + sug.key + '">✕</button>' +
          '</div>';
      });

      h += '</div></div>';
    }

    // Current bindings
    const currentBindings = Object.entries(this._bindings);
    if (currentBindings.length > 0) {
      h += '<div class="tree-group"><div class="tree-group-header">' +
        '<span class="tree-toggle">▼</span>' +
        '<span class="tree-status-label">' + this._t('deviceBindings') + ' (' + currentBindings.length + ')</span>' +
        '</div><div class="tree-group-items">';

      currentBindings.forEach(([key, entityId]) => {
        const device = this.devices.find(d => d.ip === key || d.name === key);
        const devName = device ? device.name : key;
        h += '<div class="tree-item">' +
          '<span class="tree-item-name">' + _esc(devName) + '</span>' +
          '<span style="color:var(--bento-text-secondary);flex:1">' + _esc(entityId) + '</span>' +
          '<button class="rb" style="font-size:11px" data-unbind="' + _esc(key) + '">✕</button>' +
          '</div>';
      });

      h += '</div></div>';
    } else {
      h += '<div class="es">' + this._t('noBoundDevices') + '</div>';
    }

    // Manual bind
    if (Object.keys(this._hass?.states || {}).some(e => e.startsWith('device_tracker.'))) {
      h += '<div style="margin-top:16px;padding:16px;background:var(--bento-bg);border-radius:var(--bento-radius-sm)">' +
        '<div style="font-weight:500;margin-bottom:8px">' + this._t('manualBind') + '</div>' +
        '<select class="fs" id="deviceSelect" style="width:100%;margin-bottom:8px">' +
        '<option value="">— ' + this._t('selectEntity') + '</option>';

      Object.keys(this._hass.states).filter(e => e.startsWith('device_tracker.')).forEach(e => {
        h += '<option value="' + e + '">' + (this._hass.states[e].attributes.friendly_name || e) + '</option>';
      });

      h += '</select><button class="rb" id="manualBindBtn" style="width:100%">' + this._t('bind') + '</button>' +
        '</div>';
    }

    return h + '</div>';
  }

  _bindEvents() {
    this.shadowRoot.querySelector('.support-dismiss')?.addEventListener('click', () => {
      try { localStorage.setItem(SUPPORT_DISMISSED_KEY, '1'); } catch (_) {}
      this._doRender();
    });
    // Tab switching
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.activeTab = tabId;
        history.replaceState(null, '', location.pathname + '#' + this._toolId + '/' + tabId);
        this._doRender();
      });
    });

    // Rescan button
    const rescanBtn = this.shadowRoot.querySelector('#rescanBtn');
    if (rescanBtn) {
      rescanBtn.addEventListener('click', () => this._scanAllSubnets());
    }

    // Devices tab events
    const sI = this.shadowRoot.querySelector('#sI');
    if (sI) {
      sI.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this._currentPage = 1;
        this._filterSort();
        this._doRender();
      });
    }

    const cF = this.shadowRoot.querySelector('#cF');
    if (cF) {
      cF.addEventListener('change', (e) => {
        this._catFilter = e.target.value === 'all' ? null : e.target.value;
        this._currentPage = 1;
        this._filterSort();
        this._doRender();
      });
    }

    const showOther = this.shadowRoot.querySelector('#showOther');
    if (showOther) showOther.addEventListener('change', async e => {
      this._includeNonNetwork = e.target.checked;
      this._currentPage = 1;
      await this._reloadFromApi();
      this._doRender();
    });
    const showHidden = this.shadowRoot.querySelector('#showHidden');
    if (showHidden) showHidden.addEventListener('change', e => {
      this._showHidden = e.target.checked;
      this._buildDeviceList();
      this._doRender();
    });
    const deviceCategory = this.shadowRoot.querySelector('#deviceCategory');
    if (deviceCategory && this.selectedDevice) deviceCategory.addEventListener('change', e => {
      const id = this.selectedDevice.preferenceId;
      this._devicePrefs[id] = { ...this._devicePrefs[id], category: e.target.value };
      this._saveDevicePrefs();
      this._buildDeviceList();
      this.selectedDevice = this.devices.find(d => d.preferenceId === id) || null;
      this._doRender();
    });
    const hideDevice = this.shadowRoot.querySelector('#hideDevice');
    if (hideDevice && this.selectedDevice) hideDevice.addEventListener('click', () => {
      const id = this.selectedDevice.preferenceId;
      this._devicePrefs[id] = { ...this._devicePrefs[id], hidden: !this._devicePrefs[id]?.hidden };
      this._saveDevicePrefs();
      this.selectedDevice = null;
      this._buildDeviceList();
      this._doRender();
    });

    this.shadowRoot.querySelectorAll('th[data-s]').forEach(th => {
      th.addEventListener('click', () => {
        const s = th.dataset.s;
        if (this.sortBy === s) this.sortDesc = !this.sortDesc;
        else { this.sortBy = s; this.sortDesc = false; }
        this._currentPage = 1;
        this._filterSort();
        this._doRender();
      });
    });

    this.shadowRoot.querySelectorAll('tbody tr[data-i]').forEach(tr => {
      tr.addEventListener('click', () => {
        const idx = parseInt(tr.dataset.i);
        const ps = (this._currentPage - 1) * this._pageSize;
        this.selectedDevice = this.filteredDevices[ps + idx];
        this._doRender();
      });
    });

    const cD = this.shadowRoot.querySelector('#cD');
    if (cD) {
      cD.addEventListener('click', () => {
        this.selectedDevice = null;
        this._doRender();
      });
    }

    this.shadowRoot.querySelectorAll('.pb:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.p);
        if (p > 0) {
          this._currentPage = p;
          this._doRender();
        }
      });
    });

    const bindBtn = this.shadowRoot.querySelector('#bindBtn');
    if (bindBtn) {
      bindBtn.addEventListener('click', () => {
        const ip = bindBtn.dataset.ip;
        const trackerEntities = Object.keys(this._hass?.states || {}).filter(e => e.startsWith('device_tracker.'));
        if (trackerEntities.length > 0) {
          const choice = prompt((this._lang === 'pl' ? 'Wybierz ID encji:' : 'Select entity ID:') + '\n\n' + trackerEntities.join('\n'));
          if (choice && trackerEntities.includes(choice)) {
            this._bindings[ip] = choice;
            this._saveBindings();
            this._buildDeviceList();
            this._doRender();
          }
        }
      });
    }

    // Subnets tab events
    const addSubnetBtn = this.shadowRoot.querySelector('#addSubnetBtn');
    if (addSubnetBtn) {
      addSubnetBtn.addEventListener('click', () => {
        const input = this.shadowRoot.querySelector('#subnetInput');
        if (input && input.value) {
          if (!this._subnets.includes(input.value)) {
            this._subnets.push(input.value);
            this._saveSubnets();
            input.value = '';
            this._doRender();
          }
        }
      });
    }

    this.shadowRoot.querySelectorAll('[data-remove-subnet]').forEach(btn => {
      btn.addEventListener('click', () => {
        const subnet = btn.dataset.removeSubnet;
        this._subnets = this._subnets.filter(s => s !== subnet);
        this._saveSubnets();
        this._doRender();
      });
    });

    const rescanSubnetBtn = this.shadowRoot.querySelector('#rescanSubnetBtn');
    if (rescanSubnetBtn) {
      rescanSubnetBtn.addEventListener('click', () => this._scanAllSubnets());
    }

    // Bindings tab events
    this.shadowRoot.querySelectorAll('[data-accept-suggestion]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.acceptSuggestion;
        const sug = this._suggestedBindings.find(s => s.key === key);
        if (sug) {
          this._bindings[sug.deviceKey] = sug.entityId;
          this._saveBindings();
          this._suggestedBindings = this._suggestedBindings.filter(s => s.key !== key);
          this._buildDeviceList();
          this._doRender();
        }
      });
    });

    this.shadowRoot.querySelectorAll('[data-reject-suggestion]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.rejectSuggestion;
        this._suggestedBindings = this._suggestedBindings.filter(s => s.key !== key);
        this._doRender();
      });
    });

    this.shadowRoot.querySelectorAll('[data-unbind]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.unbind;
        delete this._bindings[key];
        this._saveBindings();
        this._buildDeviceList();
        this._doRender();
      });
    });

    const manualBindBtn = this.shadowRoot.querySelector('#manualBindBtn');
    if (manualBindBtn) {
      manualBindBtn.addEventListener('click', () => {
        const deviceSelect = this.shadowRoot.querySelector('#deviceSelect');
        if (deviceSelect && deviceSelect.value) {
          const entityId = deviceSelect.value;
          const ip = prompt(this._lang === 'pl' ? 'Wprowadź IP lub nazwę urządzenia:' : 'Enter device IP or name:');
          if (ip) {
            this._bindings[ip] = entityId;
            this._saveBindings();
            deviceSelect.value = '';
            this._buildDeviceList();
            this._doRender();
          }
        }
      });
    }
  }

  setActiveTab(tabId) {
    this.activeTab = tabId;
    this._doRender();
  }

  _css() {
    return '<style>' + HA_NETWORK_MAP_BENTO_CSS + '\n' +
    '* { box-sizing: border-box; }' +
    ':host { --bp: var(--bento-primary); --bs: var(--bento-success); --be: var(--bento-error); ' +
    '--bbg: var(--bento-bg); --bcard: var(--bento-card); --btxt: var(--bento-text); ' +
    '--btxt2: var(--bento-text-secondary); --brmd: var(--bento-radius-md); ' +
    'font-family: Inter, -apple-system, sans-serif; }' +
    '.card { background: var(--bento-card); border: 1px solid var(--bento-border); ' +

    ':host(.bento-dark) { --bento-bg: var(--primary-background-color, #1a1a2e); --bento-card: var(--card-background-color, #16213e); --bento-text: var(--primary-text-color, #e2e8f0); --bento-text-secondary: var(--secondary-text-color, #94a3b8); --bento-border: var(--divider-color, #334155); --bento-shadow-sm: 0 1px 3px rgba(0,0,0,0.3); }' +    'border-radius: var(--bento-radius-md); box-shadow: var(--bento-shadow-sm); ' +
    'padding: 20px; color: var(--bento-text); position: relative; }' +
    '.card-header-wrapper { border-bottom: 1px solid var(--bento-border); ' +
    'padding-bottom: 12px; margin-bottom: 16px; }' +
    '.card-header { font-size: 20px; font-weight: 600; color: var(--bento-text); ' +
    'margin-bottom: 12px; }' +
    '.header-footer { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }' +
    '.tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--bento-border); ' +
    'margin-bottom: 20px; overflow-x: auto; }' +
    '.tab-btn { padding: 10px 18px; border: none; background: transparent; cursor: pointer; ' +
    'font-size: 13px; font-weight: 500; color: var(--bento-text-secondary); ' +
    'border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap; }' +
    '.tab-btn:hover { color: var(--bento-primary); background: rgba(59,130,246,.08); }' +
    '.tab-btn.active { color: var(--bento-primary); border-bottom-color: var(--bento-primary); ' +
    'font-weight: 600; }' +
    '.stats-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); ' +
    'gap: 10px; margin-bottom: 16px; }' +
    '.stat-mini { background: var(--bento-bg); border: 1px solid var(--bento-border); ' +
    'border-radius: var(--bento-radius-sm); padding: 12px; text-align: center; }' +
    '.stat-mini .sv { font-size: 24px; font-weight: 700; color: var(--bento-text); }' +
    '.stat-mini .sl { font-size: 11px; color: var(--bento-text-secondary); ' +
    'text-transform: uppercase; margin-top: 2px; }' +
    '.stat-mini.so .sv { color: var(--bento-success); }' +
    '.stat-mini.sa .sv { color: var(--bento-warning); }' +
    '.stat-mini.sz .sv { color: var(--bento-primary); }' +
    '.toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }' +
    '.si, .fs { padding: 8px 12px; border: 1.5px solid var(--bento-border); ' +
    'border-radius: var(--bento-radius-xs); font-size: 13px; background: var(--bento-card); ' +
    'color: var(--bento-text); outline: none; }' +
    '.si { flex: 1; min-width: 150px; }' +
    '.si:focus { border-color: var(--bento-primary); box-shadow: 0 0 0 3px rgba(59,130,246,.1); }' +
    '.tw { overflow-x: auto; margin: 0 -4px; padding: 0 4px; }' +
    'table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 600px; }' +
    'th { background: var(--bento-bg); color: var(--bento-text-secondary); font-size: 11px; ' +
    'font-weight: 600; text-transform: uppercase; padding: 10px 12px; text-align: left; ' +
    'border-bottom: 2px solid var(--bento-border); cursor: pointer; }' +
    'th:hover { color: var(--bento-primary); }' +
    'td { padding: 10px 12px; border-bottom: 1px solid var(--bento-border); ' +
    'color: var(--bento-text); font-size: 13px; }' +
    'tr:hover td { background: rgba(59,130,246,.04); }' +
    'tr { cursor: pointer; }' +
    '.di { font-size: 16px; margin-right: 4px; vertical-align: middle; }' +
    '.dn { font-weight: 500; }' +
    '.ds { font-size: 11px; color: var(--bento-text-muted); }' +
    '.mn { font-family: "SF Mono", monospace; font-size: 12px; color: var(--bento-text-secondary); }' +
    '.dd { background: var(--bento-bg); border: 1px solid var(--bento-border); padding: 16px; ' +
    'border-radius: var(--bento-radius-sm); margin-top: 12px; animation: bf .2s ease-out; }' +
    '@keyframes bf { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; } }' +
    '.dr { display: flex; justify-content: space-between; padding: 6px 0; ' +
    'border-bottom: 1px solid var(--bento-border); }' +
    '.dr:last-child { border-bottom: none; }' +
    '.dl { color: var(--bento-text-secondary); font-size: 12px; font-weight: 500; }' +
    '.dv { color: var(--bento-text); font-size: 12px; text-align: right; }' +
    '.dc { float: right; background: none; border: 1px solid var(--bento-border); ' +
    'border-radius: var(--bento-radius-xs); padding: 4px 10px; cursor: pointer; ' +
    'color: var(--bento-text-secondary); font-size: 12px; }' +
    '.dc:hover { background: var(--bento-error-light); color: var(--bento-error); }' +
    '.pg { display: flex; justify-content: center; align-items: center; gap: 8px; ' +
    'margin-top: 16px; padding: 12px 0; border-top: 1px solid var(--bento-border); }' +
    '.pb { padding: 6px 12px; border: 1.5px solid var(--bento-border); ' +
    'background: var(--bento-card); color: var(--bento-text); border-radius: var(--bento-radius-xs); ' +
    'cursor: pointer; font-size: 12px; font-weight: 500; }' +
    '.pb:hover:not(:disabled) { background: var(--bento-primary); color: #fff; ' +
    'border-color: var(--bento-primary); }' +
    '.pb:disabled { opacity: .4; cursor: not-allowed; }' +
    '.pi2 { font-size: 12px; color: var(--bento-text-secondary); }' +
    '.tree-view { margin: 0; }' +
    '.tree-group { margin-bottom: 8px; border: 1px solid var(--bento-border); ' +
    'border-radius: var(--bento-radius-sm); overflow: hidden; }' +
    '.tree-group-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; ' +
    'background: var(--bento-bg); cursor: pointer; user-select: none; }' +
    '.tree-group-header:hover { background: rgba(59,130,246,.04); }' +
    '.tree-toggle { display: inline-block; width: 16px; font-size: 12px; ' +
    'color: var(--bento-text-secondary); }' +
    '.tree-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }' +
    '.tree-status-label { font-weight: 500; color: var(--bento-text); flex: 1; font-size: 13px; }' +
    '.tree-group-items { display: flex; flex-direction: column; border-top: 1px solid var(--bento-border); }' +
    '.tree-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; ' +
    'border-bottom: 1px solid var(--bento-border); cursor: pointer; font-size: 12px; }' +
    '.tree-item:last-child { border-bottom: none; }' +
    '.tree-item:hover { background: rgba(59,130,246,.05); }' +
    '.tree-item-name { font-weight: 500; color: var(--bento-text); flex: 1; }' +
    '.es { text-align: center; padding: 40px 16px; color: var(--bento-text-secondary); }' +
    '.rb { padding: 6px 14px; border: 1.5px solid var(--bento-border); ' +
    'border-radius: var(--bento-radius-xs); background: var(--bento-card); ' +
    'color: var(--bento-text-secondary); font-size: 12px; font-weight: 500; cursor: pointer; }' +
    '.rb:hover { background: var(--bento-primary); color: #fff; border-color: var(--bento-primary); }' +
    '::-webkit-scrollbar { width: 6px; }' +
    '::-webkit-scrollbar-thumb { background: var(--bento-border); border-radius: 3px; }' +
    '@media (max-width: 600px) {' +
    '  .stats-bar { grid-template-columns: repeat(2, 1fr); }' +
    '  .stat-mini .sv { font-size: 18px; }' +
    '  table { min-width: 400px; }' +
    '  th:nth-child(4), td:nth-child(4),' +
    '  th:nth-child(5), td:nth-child(5),' +
    '  th:nth-child(7), td:nth-child(7) { display: none; }' +
    '  .tab-btn { padding: 8px 12px; font-size: 12px; }' +
    '  .card-header { font-size: 16px; }' +
    '  .toolbar { flex-direction: column; }' +
    '  .si { min-width: 0; }' +
    '}' +
    '</style>';
  }

  getCardSize() { return 8; }

  getGridOptions() { return { columns: 12, min_rows: 3, min_columns: 6 }; }
  static getConfigElement() { return document.createElement('ha-network-map-editor'); }
  static getStubConfig() {
    return { type: 'custom:ha-network-map', title: 'Network Map', router_ip: '192.168.1.1' };
  }
}

if (!customElements.get('ha-network-map')) {
  customElements.define('ha-network-map', HaNetworkMap);
}

class HaNetworkMapEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _dispatch() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }

  _render() {
    if (!this._hass) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 16px; }
        h3 { margin: 0 0 16px; font-size: 15px; font-weight: 600; }
        input { outline: none; transition: border-color .2s; width: 100%; padding: 8px 12px;
                border: 1px solid var(--divider-color); border-radius: 8px; font-size: 14px; }
        input:focus { border-color: var(--primary-color); }
        div { margin-bottom: 12px; }
        label { display: block; font-weight: 500; margin-bottom: 4px; font-size: 13px; }
      </style>
      <h3>Network Map</h3>
      <div>
        <label>Title</label>
        <input type="text" id="cf_title" value="${_esc(this._config?.title || 'Network Map')}">
      </div>
      <div>
        <label>Router IP</label>
        <input type="text" id="cf_router_ip" value="${_esc(this._config?.router_ip || '192.168.1.1')}">
      
        </div>
    `;

    const f_title = this.shadowRoot.querySelector('#cf_title');
    if (f_title) {
      f_title.addEventListener('input', (e) => {
        this._config = { ...this._config, title: e.target.value };
        this._dispatch();
      });
    }

    const f_router_ip = this.shadowRoot.querySelector('#cf_router_ip');
    if (f_router_ip) {
      f_router_ip.addEventListener('input', (e) => {
        this._config = { ...this._config, router_ip: e.target.value };
        this._dispatch();
      });
    }
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    if (this._renderTimer) { clearTimeout(this._renderTimer); this._renderTimer = null; }
    this._renderScheduled = false;
  }
}

if (!customElements.get('ha-network-map-editor')) {
  customElements.define('ha-network-map-editor', HaNetworkMapEditor);
}

})();

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ha-network-map',
  name: 'Network Map',
  description: 'Network device reachability map and topology'
});
