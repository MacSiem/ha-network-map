/* HA Tools split — ha-network-map v5.0.21 (2026-10-08) — single-tool standalone repo */
(function() {
'use strict';

// BEGIN canonical W4 factory: shared/ha-tools-ui.js SHA256 029c06206e55abad9aa09dfcf65bb13027ec24ce6a0bfacc45a938891b27254e
// HA Tools v3: vendored inside each consumer's own closure, never a window API.
function createUiV3({ language = 'en' } = {}) {
  const pl = String(language).startsWith('pl');
  const states = {
    success: ['Success', 'Sukces', '✓'],
    partial: ['Partial', 'Częściowo', '½'],
    unconfirmed: ['Unconfirmed', 'Niepotwierdzony', '?'],
    error: ['Error', 'Błąd', '✕'],
    not_checked: ['Not checked', 'Nie sprawdzono', '–'],
    no_data: ['No data', 'Brak danych', '∅'],
  };
  const status = (value) => {
    const code = typeof value === 'string' && Object.hasOwn(states, value) ? value : 'not_checked';
    const row = states[code];
    return { code, label: row[pl ? 1 : 0], icon: row[2], countsAsSuccess: code === 'success' };
  };
  const statusHtml = (value) => {
    const result = status(value);
    return `<span class="ht-result-state ht-result-state--${result.code}" data-result-state="${result.code}"><span aria-hidden="true">${result.icon}</span> ${result.label}</span>`;
  };
  const css = `
.ht-result-state { display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border:1px solid currentColor;border-radius:6px;font-size:12px;line-height:1.4;white-space:normal; }
.ht-result-state--success { color:#237b3d;background:rgba(35,123,61,.10); }
.ht-result-state--partial { color:#966400;background:rgba(150,100,0,.10); }
.ht-result-state--unconfirmed { color:#ad5200;background:rgba(173,82,0,.10); }
.ht-result-state--error { color:#c32b2b;background:rgba(195,43,43,.10); }
.ht-result-state--not_checked,.ht-result-state--no_data { color:var(--secondary-text-color,#666);background:transparent; }
.ht-result-state--no_data { border-style:dashed; }
:host(.bento-dark) .ht-result-state--success { color:#81cf99; }
:host(.bento-dark) .ht-result-state--partial { color:#efd080; }
:host(.bento-dark) .ht-result-state--unconfirmed { color:#ffb97b; }
:host(.bento-dark) .ht-result-state--error { color:#ff9999; }
`;
  return { status, statusHtml, css };
}
// END canonical W4 factory


// XSS protection helper
const _asText = (s) => String(s ?? '');
const _escBase = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const _esc = (s) => _escBase(_asText(s));
const SUPPORT_DISMISSED_KEY = 'ha-network-map-support-dismissed';
const supportDismissed = () => { try { return localStorage.getItem(SUPPORT_DISMISSED_KEY) === '1'; } catch (_) { return false; } };
const ownDonateFooter = () => `<section class="donate-section" data-source="own-card" style="margin:8px 0 0;padding:4px 0;background:none;border:0;box-shadow:none;min-height:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;flex-direction:row;justify-content:flex-start;text-align:left"><a href="https://buymeacoffee.com/macsiem" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:var(--secondary-text-color,#64748b);font-weight:400;text-decoration:underline">Optional support for HA Tools</a><button type="button" class="support-dismiss" aria-label="Dismiss support link" style="margin-left:auto;padding:2px 6px;min-height:0;line-height:1;border:0;background:none;color:var(--secondary-text-color,#64748b);cursor:pointer">×</button></section>`;

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

const FAMILY_NAV='.tabs',FAMILY_ATTR='data-tab',FAMILY_ACTIVE='active';

// Adapted from Config/YAML family15: options come only from current native buttons.
// Observe the actual navigation parent's content box, not the global viewport.
function _rememberFamilyFocus(card) {
  const active = card.shadowRoot?.activeElement;
  const nav = card.shadowRoot?.querySelector(FAMILY_NAV);
  if (active?.id === 'ha-tools-tab-picker') return { picker:true };
  if (nav?.contains(active)) return { tab:active.getAttribute(FAMILY_ATTR) };
  return null;
}
function _disconnectFamilyNavigation(card) {
  card._familyNavObserver?.disconnect();card._familyNavObserver=null;card._familyNavTarget=null;
}
function _bindFamilyNavigation(card, restoreFocus=null) {
  const root=card.shadowRoot, nav=root?.querySelector(FAMILY_NAV);
  if (!nav) { _disconnectFamilyNavigation(card);return; }
  let label=root.querySelector('.ht-tab-picker');
  if (!label) {
    label=card.ownerDocument.createElement('div');label.className='ht-tab-picker';
    const text=card.ownerDocument.createElement('label');text.htmlFor='ha-tools-tab-picker';label.append(text);
    const select=card.ownerDocument.createElement('select');select.id='ha-tools-tab-picker';label.append(select);nav.before(label);
    select.addEventListener('change',()=>{
      const button=Array.from(root.querySelectorAll(FAMILY_NAV+' button['+FAMILY_ATTR+']')).find(item=>item.getAttribute(FAMILY_ATTR)===select.value&&!item.disabled&&!item.hidden);
      if(button)button.click(); // The original handler owns navigation, history and guards.
      _bindFamilyNavigation(card);
    });
  }
  label.firstElementChild.textContent=card._lang==='pl'?'Zakładka':'Tab';
  const select=label.querySelector('select');
  const buttons=Array.from(nav.querySelectorAll('button['+FAMILY_ATTR+']')).filter(button=>!button.hidden&&!button.disabled);
  const options=Array.from(select.options);
  if(options.length!==buttons.length||buttons.some((button,index)=>options[index]?.value!==button.getAttribute(FAMILY_ATTR))) {
    select.replaceChildren(...buttons.map(button=>{const option=card.ownerDocument.createElement('option');option.value=button.getAttribute(FAMILY_ATTR);return option;}));
  }
  buttons.forEach((button,index)=>{select.options[index].textContent=button.getAttribute('aria-label')||button.textContent.trim();});
  const selected=buttons.find(button=>button.classList.contains(FAMILY_ACTIVE));select.value=selected?.getAttribute(FAMILY_ATTR)||'';
  const target=nav.parentElement;
  const applyWidth=width=>{
    const currentNav=root.querySelector(FAMILY_NAV),currentLabel=root.querySelector('.ht-tab-picker');if(!currentNav||!currentLabel)return;
    const input=currentLabel.querySelector('select'),active=root.activeElement;
    const style=getComputedStyle(currentNav);
    const available=width-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0)-(parseFloat(style.borderLeftWidth)||0)-(parseFloat(style.borderRightWidth)||0);
    const narrow=available>0&&available<280,fromTab=currentNav.contains(active),fromPicker=active===input;
    currentNav.hidden=narrow;currentLabel.hidden=!narrow;
    if(narrow&&fromTab)input.focus({preventScroll:true});
    else if(!narrow&&fromPicker)currentNav.querySelector('button.'+FAMILY_ACTIVE)?.focus({preventScroll:true});
  };
  if(card._familyNavTarget!==target) {
    _disconnectFamilyNavigation(card);
    const style=getComputedStyle(target);
    const measured=target.getBoundingClientRect().width-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0)-(parseFloat(style.borderLeftWidth)||0)-(parseFloat(style.borderRightWidth)||0);
    if(measured>0)card._familyNavWidth=measured;
    if(typeof ResizeObserver==='function'&&card.isConnected) {
      card._familyNavTarget=target;
      const observer=new ResizeObserver(entries=>{
        if(!card.isConnected||card._familyNavObserver!==observer||card._familyNavTarget!==target)return;
        const entry=entries.find(item=>item.target===target);if(!entry)return;
        card._familyNavWidth=entry.contentRect.width;applyWidth(card._familyNavWidth);
      });
      card._familyNavObserver=observer;
      observer.observe(target);
    }
  }
  // Without ResizeObserver neither control is hidden, so do not transfer its focus.
  if(typeof ResizeObserver!=='function') { nav.hidden=false;label.hidden=false; }
  else applyWidth(card._familyNavWidth||900);
  if(restoreFocus) {
    const button=buttons.find(item=>item.getAttribute(FAMILY_ATTR)===restoreFocus.tab)||selected;
    if(nav.hidden||(restoreFocus.picker&&!label.hidden))select.focus({preventScroll:true});else button?.focus({preventScroll:true});
  }
}

// W3: Data Exporter's container-local name/state and labelled record-fields pattern.
// Unlike a CSS-only switch, move the original cells/actions so focus and handlers
// survive a breakpoint. Neither observer nor disclosure reads or rebuilds data.
function _rememberFamilyRecords(card) {
  const root = card.shadowRoot, active = root?.activeElement;
  card._familyRecordOpen ||= new Set();
  root?.querySelectorAll('.ht-device-records > details').forEach(detail => {
    if (detail.open) card._familyRecordOpen.add(detail.dataset.recordKey);
    else card._familyRecordOpen.delete(detail.dataset.recordKey);
  });
  if (active?.dataset.recordSort) return { sort: active.dataset.recordSort };
  const record = active?.closest('[data-record-key]');
  return record ? { key: record.dataset.recordKey, id: active.id || null } : null;
}
function _disconnectFamilyRecords(card) {
  card._familyRecordObserver?.disconnect();
  card._familyRecordObserver = null;
}
function _focusFamilyRecord(card, key, id = null) {
  const mount = card._familyRecordMount;
  const item = mount?.items.find(item => item.key === key);
  if (!item) return false;
  const action = id && card.shadowRoot.getElementById(id);
  if (mount.narrow) {
    if (action && item.detail.contains(action)) {
      item.detail.open = true; card._familyRecordOpen.add(key);
      action.focus({ preventScroll: true });
    } else item.summary.focus({ preventScroll: true });
  } else {
    const target = action || item.row.querySelector('button,a[href],input,select');
    if (target) target.focus({ preventScroll: true });
    else { item.row.tabIndex = -1; item.row.focus({ preventScroll: true }); }
  }
  return true;
}
function _bindFamilyRecords(card, restoreFocus = null) {
  const root = card.shadowRoot, table = root?.querySelector('table[data-device-records]');
  if (!table) { _disconnectFamilyRecords(card); card._familyRecordMount = null; return; }
  let mount = card._familyRecordMount;
  if (mount?.table !== table) {
    _disconnectFamilyRecords(card);
    card._familyRecordOpen ||= new Set();
    const doc = card.ownerDocument, wide = table.parentElement;
    const layout = doc.createElement('div'); layout.className = 'ht-device-layout';
    const sorts = doc.createElement('div'); sorts.className = 'ht-record-sorts'; sorts.hidden = true;
    sorts.setAttribute('role', 'group'); sorts.setAttribute('aria-label', card._lang === 'pl' ? 'Sortowanie urządzeń' : 'Device order');
    const list = doc.createElement('div'); list.className = 'ht-device-records'; list.hidden = true;
    wide.before(layout); layout.append(wide, sorts, list);
    const headers = Array.from(table.tHead.rows[0].cells);
    const sortItems = headers.flatMap((header, index) => Array.from(header.querySelectorAll('button'), button => {
      button.dataset.recordSort = String(index);
      // Sorting is still owned by the existing header handler in both tools.
      button.addEventListener('click', () => { if (!header.contains(button)) header.click(); });
      return { header, button, label: button.getAttribute('aria-label') };
    }));
    const items = Array.from(table.tBodies[0].rows, row => {
      const key = row.dataset.recordKey;
      const detail = doc.createElement('details'); detail.dataset.recordKey = key;
      const summary = doc.createElement('summary');
      const name = doc.createElement('strong'); name.textContent = row.dataset.recordName;
      const state = doc.createElement('span'); state.textContent = row.dataset.recordState;
      summary.append(name, state); detail.append(summary);
      const fields = doc.createElement('dl'); fields.className = 'record-fields'; detail.append(fields);
      const cells = Array.from(row.cells, (cell, index) => {
        const label = doc.createElement('dt'); label.textContent = headers[index].textContent.trim();
        const value = doc.createElement('dd'); fields.append(label, value);
        return { cell, value, nodes: Array.from(cell.childNodes) };
      });
      // Network's existing row selection handler remains the sole action owner.
      row.querySelectorAll('.device-detail-button').forEach(button => {
        button.addEventListener('click', () => { if (!row.contains(button)) row.click(); });
      });
      detail.open = card._familyRecordOpen.has(key);
      detail.addEventListener('toggle', () => {
        if (!detail.isConnected) return;
        if (detail.open) card._familyRecordOpen.add(key); else card._familyRecordOpen.delete(key);
      });
      list.append(detail);
      return { key, row, detail, summary, cells };
    });
    mount = { table, layout, wide, sorts, list, sortItems, items, narrow: false };
    card._familyRecordMount = mount;
  }
  const applyWidth = width => {
    if (!Number.isFinite(width) || width <= 0) return;
    const narrow = width < 500;
    if (mount.narrow === narrow) return;
    const active = root.activeElement;
    const focusedItem = mount.items.find(item => item.row.contains(active) || item.detail.contains(active));
    const wasSummary = focusedItem?.summary === active || focusedItem?.row === active;
    // Reveal the destination before moving any focused node into it.
    if (narrow) { mount.list.hidden = false; mount.sorts.hidden = false; }
    else mount.wide.hidden = false;
    mount.sortItems.forEach(({ header, button, label }) => {
      (narrow ? mount.sorts : header).append(button);
      const order = header.getAttribute('aria-sort');
      if (narrow && ['ascending', 'descending'].includes(order)) {
        const spokenOrder = card._lang === 'pl' ? (order === 'ascending' ? 'rosnąco' : 'malejąco') : order;
        button.setAttribute('aria-label', (label || button.textContent.trim()) + ': ' + spokenOrder);
      } else if (label === null) button.removeAttribute('aria-label');
      else button.setAttribute('aria-label', label);
    });
    mount.items.forEach(item => item.cells.forEach(({ cell, value, nodes }) => (narrow ? value : cell).append(...nodes)));
    mount.narrow = narrow;
    if (focusedItem) {
      if (wasSummary) _focusFamilyRecord(card, focusedItem.key);
      else if (active) {
        if (narrow) { focusedItem.detail.open = true; card._familyRecordOpen.add(focusedItem.key); }
        active.focus({ preventScroll: true });
      }
    } else if (mount.sortItems.some(item => item.button === active)) active.focus({ preventScroll: true });
    mount.wide.hidden = narrow; mount.list.hidden = !narrow; mount.sorts.hidden = !narrow;
  };
  if (!card._familyRecordObserver && typeof ResizeObserver === 'function' && card.isConnected) {
    const style = getComputedStyle(mount.layout);
    const measured = mount.layout.getBoundingClientRect().width - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0) - (parseFloat(style.borderLeftWidth) || 0) - (parseFloat(style.borderRightWidth) || 0);
    if (measured > 0) card._familyRecordWidth = measured;
    const observer = new ResizeObserver(entries => {
      if (!card.isConnected || card._familyRecordObserver !== observer || card._familyRecordMount !== mount) return;
      const entry = entries.find(item => item.target === mount.layout);
      if (!entry) return;
      card._familyRecordWidth = entry.contentRect.width;
      applyWidth(card._familyRecordWidth);
    });
    card._familyRecordObserver = observer; observer.observe(mount.layout);
  }
  applyWidth(typeof ResizeObserver === 'function' ? card._familyRecordWidth || 900 : 900);
  if (restoreFocus?.sort) mount.sortItems.find(item => item.button.dataset.recordSort === restoreFocus.sort)?.button.focus({ preventScroll: true });
  else if (restoreFocus?.key && !_focusFamilyRecord(card, restoreFocus.key, restoreFocus.id)) {
    root.querySelector('#sI,.search-box')?.focus({ preventScroll: true });
  }
}

const _FAMILY_RECORD_CSS = `
/* Container content width controls only presentation. Wide table cells stay intact. */
.ht-device-layout {min-width:0;max-width:100%;}
.ht-device-layout [hidden] {display:none !important;}
.ht-record-sorts {display:flex;flex-wrap:wrap;gap:8px;margin-block:8px;}
.ht-record-sorts button {white-space:normal;overflow-wrap:anywhere;padding:8px !important;}
.ht-device-records > details {min-width:0;padding:8px 0;border-bottom:1px solid var(--bento-border);}
.ht-device-records summary {cursor:pointer;min-height:44px;padding:8px;overflow-wrap:anywhere;white-space:normal;}
.ht-device-records summary strong,.ht-device-records summary > span {display:block;min-width:0;overflow-wrap:anywhere;}
.ht-device-records summary > span {margin-top:4px;}
.ht-device-records .record-fields {display:grid;grid-template-columns:minmax(0,1fr);gap:4px;margin:8px;}
.ht-device-records dt {font-size:12px;color:var(--bento-text-secondary);margin-top:8px;}
.ht-device-records dd {margin:0;min-width:0;white-space:normal;overflow-wrap:anywhere;}
.ht-device-records .device-detail-button {white-space:normal;text-align:start;max-width:100%;}
.ht-device-records .dn {white-space:normal;overflow-wrap:anywhere;}
`;

const _FAMILY_CONTROL_CSS = `
/* Family15: native touch targets; checkbox indicators remain small inside labels. */
:host button,:host summary,:host a[href],:host [role=button],
:host input:not([type=checkbox]):not([type=radio]),:host select,:host textarea {
  box-sizing:border-box;min-height:44px !important;min-width:44px !important;max-width:100%;flex-shrink:0;
}
:host button,:host summary,:host a[href] { white-space:normal !important;overflow-wrap:anywhere; }
:host a[href] { display:inline-flex;align-items:center; }
:host label:has(input[type=checkbox]) { min-height:44px !important;min-width:44px;display:flex;align-items:center;gap:8px;cursor:pointer; }
:host input[type=checkbox] { width:18px !important;height:18px !important;min-width:18px !important;min-height:18px !important;flex:none; }
:host button:focus-visible,:host summary:focus-visible,:host a:focus-visible,:host input:focus-visible,:host select:focus-visible,:host textarea:focus-visible,:host [role=button]:focus-visible {
  outline:3px solid var(--primary-color,#1769aa) !important;outline-offset:2px;
}
.intro-banner { padding-right:64px !important; }
.ht-tab-picker { min-width:0;display:flex;flex-direction:column;gap:6px;padding:8px;margin:0 0 8px; }
.ht-tab-picker select { width:100%;font:inherit;color:var(--primary-text-color,inherit);background:var(--card-background-color,transparent);padding:8px;border:1px solid var(--divider-color,#aaa);border-radius:8px; }
.ht-tab-picker[hidden],.tabs[hidden],.det-tabs[hidden] { display:none !important; }
.tabs,.det-tabs { display:flex;box-sizing:border-box;flex-wrap:wrap !important;overflow:visible !important;min-width:0;max-width:100%; }
:host .tabs button,:host .det-tabs button { min-height:44px !important;min-width:44px !important;white-space:normal !important;overflow-wrap:anywhere;flex:1 1 auto; }
`;

// Values remain owned by the existing input/config handlers; retain only focus/caret.
function _rememberFamilyEditorFocus(editor) {
  const field=editor.shadowRoot.activeElement;
  return field?.id ? {id:field.id,start:field.selectionStart,end:field.selectionEnd,direction:field.selectionDirection} : null;
}
function _restoreFamilyEditorFocus(editor, saved) {
  const field=saved&&editor.shadowRoot.getElementById(saved.id);if(!field||field.disabled)return;
  field.focus({preventScroll:true});
  if(typeof saved.start==='number'&&typeof field.setSelectionRange==='function')field.setSelectionRange(saved.start,saved.end,saved.direction||'none');
}

class HaNetworkMap extends HTMLElement {
  constructor() {
    super();
    this._toolId = this.tagName.toLowerCase().replace('ha-', '');
    this._lang = (navigator.language || '').startsWith('pl') ? 'pl' : 'en';
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._comparisonEpoch = 0;
    this._comparisonHistoryContext = null;
    this._comparisonRequest = null;
    this._comparisonWire = null;
    this._comparisonConnection = null;
    this._comparisonListenersBound = false;
    this._comparisonConnectionReady = false;
    this._comparisonBrowserOnline = navigator.onLine !== false;
    this._comparisonReady = () => { this._comparisonConnectionReady=this._hass?.connection?.connected === true;this._comparisonBoundary('context_changed'); };
    this._comparisonDisconnected = () => { this._comparisonConnectionReady=false;this._comparisonBoundary('connection'); };
    this._comparison = { history: [], historyLoaded: false, data: null, state: 'not_checked', error: '', before: '', after: '', page: 1, detail: null };
    this._comparisonConnectivity = event => {
      this._comparisonBrowserOnline = event.type === 'online';
      this._comparisonBoundary(this._comparisonBrowserOnline ? 'context_changed' : 'offline');
    };
    this.activeTab = 'devices';
    this._title = 'Network Map';
    this._routerIp = '';
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
    this._listError = false;
    this._scanError = null;
    this._scanAction = { state: 'not_checked', reason: null };
    this._deviceRegistry = [];
    this._includeNonNetwork = false;
    this._devicePrefs = {};
    this._readEpoch = 0;
    this._readRequest = null;
    this._lastReadAt = null;
    this._refreshTimer = null;
    this._readDirty = false;
    this._dataSession = null;
    this._registryEpoch = 0;
    this._registryUnsubs = [];
    this._disconnected = false;

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
        comparisonTab: 'Scan comparison', comparisonAdmin: 'An administrator can view private saved scan history.', comparisonRead: 'Read saved scans', comparisonLoading: 'Reading saved scans…', comparisonBefore: 'Earlier scan', comparisonAfter: 'Current saved scan', comparisonSource: 'Source', comparisonMethod: 'Method', comparisonScope: 'Configured scope', comparisonCoverage: 'Coverage', comparisonCounts: 'Targets / completed / discovered / eligible', comparisonSkipped: 'Skipped', comparisonUnknown: 'Identity unknown', comparisonNoData: 'Two completed saved scans are needed. Opening this view does not start a scan.', comparisonAbsence: 'Not in this scan does not mean offline. TCP no-response can mean timeout or filtering.', comparisonReasons: 'Limitations', comparisonNew: 'New in scan', comparisonMissing: 'Not in this scan', comparisonIp: 'IP changed', comparisonSame: 'Same IP', comparisonUnknownRow: 'Unknown', comparisonFull: 'Full', comparisonPartial: 'Partial', comparisonOldIp: 'Earlier IP', comparisonNewIp: 'Current IP', comparisonTCP: 'TCP response / open ports', comparisonIdentity: 'Stable identity', comparisonDetails: 'Scan record details', comparisonStatus: 'History status', devicesTab: 'Devices', topologyTab: 'Topology', subnetsTab: 'Subnets', bindingsTab: 'Bindings',
        // Devices tab
        searchPlaceholder: 'Search devices...', allCategories: 'All', filterCategory: 'Filter:',
        deviceName: 'Device Name', ipAddress: 'IP Address', macAddress: 'MAC', manufacturer: 'Manufacturer',
        reachable: 'Reachable', haEntity: 'HA Entity', totalDevices: 'Total', reachableCount: 'Reachable',
        unreachableCount: 'Unreachable', boundCount: 'Bound to HA',
        noDevicesFound: 'No matching devices in Home Assistant. Check the filters or add a device with a MAC/IP address.',
        scanningNetwork: 'Scanning network...', scanProgress: 'Progress',
        scanAdminRequired: 'Only an administrator can start a network scan.',
        // Topology tab
        networkTopology: 'Network Topology', router: 'Router', gateway: 'Gateway',
        // Subnets tab
        currentSubnets: 'Current Subnets', addSubnetLabel: 'Add subnet (e.g., 192.168.1)', rescanAll: 'Scan All',
        rescan: 'Rescan', remove: 'Remove', defaultSubnet: 'Default (auto-detected)',
        // Bindings tab
        deviceBindings: 'Device Bindings', suggestedBindings: 'Suggested Bindings', accept: 'Accept',
        reject: 'Reject', manualBind: 'Manual Bind', selectEntity: '— Select entity —',
        bindingHelp: 'A binding is an optional link between a device already on this map and a device_tracker entity. Automatic discovery (for example eero) does not require it. The link adds a tracker reference in this card; it does not change the device name, IP address, tracker state or TCP scan. Choose a tracker, then enter the mapped device’s exact IP or displayed name. The name identifies an existing row, not a custom label or DNS host. Links are saved only in this browser.',
        bindingTargetPrompt: 'IP or exact displayed name of a device already on this map (not a new label):',
        noBoundDevices: 'No manual tracker links yet. Device discovery works without them.',
        bind: 'Bind',
        // Status
        reachableStatus: 'Reachable', unreachableStatus: 'Unreachable',
        // Detail
        details: 'Details', bind: 'Bind', unbind: 'Unbind', close: 'Close',
        category: 'Category', status: 'Status', lastSeen: 'Last Seen',
        showOtherDevices: 'Show devices without MAC/IP', hideDevice: 'Hide device', showDevice: 'Show device', showHidden: 'Show hidden',
        openDevice: 'Open HA device', openEntity: 'Open HA entity',
        entity: 'Entity', scanned: 'Last scan:', previous: 'Previous', next: 'Next', unknownStatus: 'Not measured',
        listFailed: 'Could not load devices. Try again.', retry: 'Retry',
        categoryPhone: 'Phone', categoryTablet: 'Tablet', categoryComputer: 'Computer', categoryRouter: 'Router', categoryCamera: 'Camera', categorySmartHome: 'Smart Home', categoryMedia: 'Media', categoryOther: 'Other',
      },
      pl: {
        // Tabs
        comparisonTab: 'Porównanie skanów', comparisonAdmin: 'Administrator może odczytać prywatną historię zapisanych skanów.', comparisonRead: 'Odczytaj zapisane skany', comparisonLoading: 'Odczytywanie zapisanych skanów…', comparisonBefore: 'Wcześniejszy skan', comparisonAfter: 'Bieżący zapisany skan', comparisonSource: 'Źródło', comparisonMethod: 'Metoda', comparisonScope: 'Skonfigurowany zakres', comparisonCoverage: 'Pokrycie', comparisonCounts: 'Cele / ukończone / odkryte / kwalifikujące się', comparisonSkipped: 'Pominięte', comparisonUnknown: 'Niepewna tożsamość', comparisonNoData: 'Potrzebne są dwa ukończone zapisane skany. Otwarcie widoku nie uruchamia skanowania.', comparisonAbsence: 'Brak w tym skanie nie oznacza offline. Brak odpowiedzi TCP może oznaczać timeout lub filtrowanie.', comparisonReasons: 'Ograniczenia', comparisonNew: 'Nowe w skanie', comparisonMissing: 'Brak w tym skanie', comparisonIp: 'Zmiana IP', comparisonSame: 'Ten sam IP', comparisonUnknownRow: 'Nieznane', comparisonFull: 'Pełne', comparisonPartial: 'Częściowe', comparisonOldIp: 'Wcześniejszy IP', comparisonNewIp: 'Bieżący IP', comparisonTCP: 'Odpowiedź TCP / otwarte porty', comparisonIdentity: 'Stały identyfikator', comparisonDetails: 'Szczegóły pomiaru', comparisonStatus: 'Stan historii', devicesTab: 'Urządzenia', topologyTab: 'Topologia', subnetsTab: 'Sieci', bindingsTab: 'Powiązania',
        // Devices tab
        searchPlaceholder: 'Szukaj urządzeń...', allCategories: 'Wszystkie', filterCategory: 'Filtr:',
        deviceName: 'Nazwa urządzenia', ipAddress: 'Adres IP', macAddress: 'MAC', manufacturer: 'Producent',
        reachable: 'Dostępne', haEntity: 'Encja HA', totalDevices: 'Razem', reachableCount: 'Dostępne',
        unreachableCount: 'Niedostępne', boundCount: 'Powiązane z HA',
        noDevicesFound: 'Brak pasujących urządzeń w Home Assistant. Sprawdź filtry lub dodaj urządzenie z adresem MAC/IP.',
        scanningNetwork: 'Skanowanie sieci...', scanProgress: 'Postęp',
        scanAdminRequired: 'Tylko administrator może uruchomić skanowanie sieci.',
        // Topology tab
        networkTopology: 'Topologia sieci', router: 'Router', gateway: 'Brama',
        // Subnets tab
        currentSubnets: 'Bieżące sieci', addSubnetLabel: 'Dodaj sieć (np. 192.168.1)', rescanAll: 'Skanuj wszystko',
        rescan: 'Skanuj', remove: 'Usuń', defaultSubnet: 'Domyślna (auto-wykryta)',
        // Bindings tab
        deviceBindings: 'Powiązania urządzeń', suggestedBindings: 'Sugerowane powiązania', accept: 'Zaakceptuj',
        reject: 'Odrzuć', manualBind: 'Powiąż ręcznie', selectEntity: '— Wybierz encję —',
        bindingHelp: 'Powiązanie to opcjonalny odnośnik między urządzeniem już widocznym na mapie a encją device_tracker. Automatyczne wykrywanie (np. eero) go nie wymaga. Powiązanie dodaje odniesienie do trackera w tej karcie; nie zmienia nazwy urządzenia, IP, stanu trackera ani skanu TCP. Wybierz tracker, a następnie wpisz dokładne IP lub nazwę urządzenia widoczną na mapie. Nazwa wskazuje istniejący wiersz, nie jest nową etykietą ani hostem DNS. Powiązania są zapisane tylko w tej przeglądarce.',
        bindingTargetPrompt: 'IP lub dokładna nazwa urządzenia już widocznego na mapie (nie nowa etykieta):',
        noBoundDevices: 'Brak ręcznych powiązań z trackerami. Wykrywanie urządzeń działa bez nich.',
        bind: 'Powiąż',
        // Status
        reachableStatus: 'Dostępne', unreachableStatus: 'Niedostępne',
        // Detail
        details: 'Szczegóły', bind: 'Powiąż', unbind: 'Rozpowiąż', close: 'Zamknij',
        category: 'Kategoria', status: 'Stan', lastSeen: 'Ostatnio widoczne',
        showOtherDevices: 'Pokaż urządzenia bez MAC/IP', hideDevice: 'Ukryj urządzenie', showDevice: 'Pokaż urządzenie', showHidden: 'Pokaż ukryte',
        openDevice: 'Otwórz urządzenie HA', openEntity: 'Otwórz encję HA',
        entity: 'Encja', scanned: 'Ostatni skan:', previous: 'Poprzednia', next: 'Następna', unknownStatus: 'Nie zmierzono',
        listFailed: 'Nie udało się pobrać urządzeń. Spróbuj ponownie.', retry: 'Spróbuj ponownie',
        categoryPhone: 'Telefon', categoryTablet: 'Tablet', categoryComputer: 'Komputer', categoryRouter: 'Router', categoryCamera: 'Kamera', categorySmartHome: 'Inteligentny dom', categoryMedia: 'Multimedia', categoryOther: 'Inne',
      }
    };
  }

  _t(key) {
    const lang = this._hass?.language || this._lang || 'en';
    const T = HaNetworkMap._translations;
    return (T[String(lang).startsWith('pl') ? 'pl' : 'en'] || T['en'])[key] || T['en'][key] || key;
  }

  setConfig(config) {
    this.config = config;
    this._title = config.title || 'Network Map';
    this._routerIp = typeof config.router_ip === 'string' ? config.router_ip.trim() : '';
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
    const previousComparisonContext = this._comparisonLastContext || this._comparisonContext();
    const previousStates = this._hass?.states;
    const session = this._readSession(hass);
    const sessionChanged = this._dataSession && !this._sameReadSession(this._dataSession, session);
    this._hass = hass;
    this._bindComparisonConnection();
    this._comparisonLastContext = this._comparisonContext();
    if (!this._sameComparisonContext(previousComparisonContext, this._comparisonContext())) {
      this._invalidateComparison();
      this._scanEpoch = (this._scanEpoch || 0) + 1;
      this._scanInProgress = false;
      this._scanAction = { state: 'not_checked', reason: null };
      if (this.activeTab === 'comparison') this._doRender();
    }
    this._dataSession = session;
    if (sessionChanged) {
      this._readEpoch++;
      this._readRequest = null;
      this._stopRegistryUpdates();
      this._integrationDevices = [];
      this._deviceRegistry = [];
      this._scanResults = {};
      this._lastScanTime = null;
      this._listError = false;
      this._scanError = null;
      this.selectedDevice = null;
      this._buildDeviceList();
      this._doRender();
    }
    this._subscribeRegistryUpdates();

    if (!this._firstHassRender) {
      this._firstHassRender = true;
      // v5: no client-side subnet config / cached scan results. The
      // bundled Python integration owns the canonical device list and
      // reachability data; subsequent HA events schedule bounded fresh reads.
      this._loadBindings();
      this._loadDevicePrefs();
      this._loadDeviceRegistry().then(() => this._reloadFromApi()).then(() => {
        this._doRender();
      });
      return;
    }

    if (sessionChanged || previousStates !== hass.states) this._queueDeviceRefresh();

    // Locale and scan permissions must not wait for editing or the data-render
    // throttle. Compare rendered scalars because HA may reuse a mutable user.
    if (this._renderedLang !== this._lang || this._renderedCanScan !== this._canScan()) {
      this._doRender();
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
    const session = this._readSession();
    const epoch = this._registryEpoch;
    const current = () => !this._disconnected && epoch === this._registryEpoch && this._sameReadSession(session, this._readSession());
    try {
      const rows = await this._hass.callWS({ type: 'config/device_registry/list' });
      if (current()) this._deviceRegistry = Array.isArray(rows) ? rows : [];
    } catch (e) {
      if (current()) this._deviceRegistry = [];
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
      const bindings = stored ? JSON.parse(stored) : {};
      this._bindings = bindings && typeof bindings === 'object' && !Array.isArray(bindings) ? bindings : {};
    } catch (e) {
      this._bindings = {};
    }
  }

  _saveBindings() {
    try {
      localStorage.setItem('ha-tools-net-bindings', JSON.stringify(this._bindings));
    } catch (e) { console.debug('[ha-network-map] caught:', e); }
  }

  _bindingAliases(device) {
    return [...new Set([this._preferenceId(device), device.mac, device.key, device.ip, device.name].filter(Boolean))];
  }

  _bindingDevice(key) {
    const matches = (this._integrationDevices || []).filter(d => d && this._bindingAliases(d).includes(key));
    const ids = new Set(matches.map(d => this._preferenceId(d)));
    return ids.size === 1 ? matches[0] : null;
  }

  _migrateBindings() {
    let changed = false;
    for (const device of this._integrationDevices || []) {
      if (!device) continue;
      const id = this._preferenceId(device);
      const aliases = this._bindingAliases(device).filter(key => key !== id && this._bindingDevice(key) && this._preferenceId(this._bindingDevice(key)) === id);
      // A persisted null records explicit unbind, including ambiguous aliases
      // which may only become uniquely identifiable after another row disappears.
      const explicit = Object.hasOwn(this._bindings, id);
      const entity = explicit ? this._bindings[id] : aliases.map(key => this._bindings[key]).find(Boolean);
      if (!entity && !explicit) continue;
      if (!explicit) { this._bindings[id] = entity; changed = true; }
      for (const key of aliases) if (Object.hasOwn(this._bindings, key)) { delete this._bindings[key]; changed = true; }
    }
    if (changed) this._saveBindings();
  }

  _setBinding(key, entity) {
    const device = this._bindingDevice(key);
    if (device) {
      const id = this._preferenceId(device);
      for (const alias of this._bindingAliases(device)) {
        const owner = this._bindingDevice(alias);
        if (owner && this._preferenceId(owner) === id) delete this._bindings[alias];
      }
      this._bindings[id] = entity || null;
    } else {
      if (entity) this._bindings[key] = entity;
      else delete this._bindings[key];
    }
    this._saveBindings();
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

  _canScan() {
    return this._hass?.user?.is_admin === true && this._hass.user.is_active !== false;
  }

  _scanMessage(code) {
    const pl = this._lang === 'pl';
    const messages = {
      unauthorized: ['Administrator permission is required. Try again after checking permissions.', 'Wymagane są uprawnienia administratora. Sprawdź uprawnienia i spróbuj ponownie.'],
      scan_failed: ['Scan completion could not be confirmed. Check the connection before scanning again.', 'Nie potwierdzono zakończenia skanu. Sprawdź połączenie przed ponownym skanowaniem.'],
      unconfirmed: ['Scan completion could not be confirmed. Check the connection before scanning again.', 'Nie potwierdzono zakończenia skanu. Sprawdź połączenie przed ponownym skanowaniem.'],
      queued: ['Another scan is active. This request did not confirm a new completed scan. No retry was sent.', 'Inny skan trwa. To żądanie nie potwierdziło nowego zakończonego skanu. Nie wysłano ponownej próby.'],
      partial: ['The scan completed, but the device list could not be read. Retry the device read.', 'Skan zakończono, ale nie udało się odczytać listy urządzeń. Ponów odczyt urządzeń.'],
      success: ['Scan completed. Device availability remains a separate measurement.', 'Skan zakończono. Dostępność urządzeń pozostaje osobnym pomiarem.'],
      no_data: ['Scan completed with no devices in the discovered scope.', 'Skan zakończono bez urządzeń w wykrytym zakresie.'],
    };
    if (code === 'unknown_command') return this._integrationMissingHint();
    if (code === 'list_failed' || code === 'invalid_response') return this._t('listFailed');
    return (messages[code] || messages.unconfirmed)[pl ? 1 : 0];
  }

  _scanFailureCode(error) {
    return ['unknown_command', 'unauthorized', 'scan_failed', 'list_failed'].includes(error?.code)
      ? error.code : 'unconfirmed';
  }

  _completedScan(status) {
    // scan() returns queued:false only after finishing; the lock response can
    // carry an older finished timestamp and must never prove this request.
    return !!status && typeof status === 'object' && !Array.isArray(status)
      && status.queued === false
      && Number.isFinite(status.last_scan_started_at) && status.last_scan_started_at > 0
      && Number.isFinite(status.last_scan_finished_at) && status.last_scan_finished_at >= status.last_scan_started_at
      && ['device_count', 'with_ip', 'reachable'].every(key => Number.isInteger(status[key]) && status[key] >= 0)
      && status.with_ip <= status.device_count && status.reachable <= status.with_ip;
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
    if (this._scanInProgress || this._scanTransportPending || !this._canScan()) return;
    if (navigator.onLine === false || this._hass?.connection?.connected === false || this._disconnected) return;
    if (!this._hass) {
      this._scanError = 'unknown_command';
      this._doRender();
      return;
    }
    const scanHass = this._hass;
    const scanContext = this._comparisonContext();
    const scanEpoch = this._scanEpoch = (this._scanEpoch || 0) + 1;
    const currentScan = () => !this._disconnected && scanEpoch === this._scanEpoch && this._sameComparisonContext(scanContext, this._comparisonContext());
    this._scanTransportPending = true;
    this._scanInProgress = true;
    this._listError = false;
    this._scanError = null;
    this._scanProgress = { current: 0, total: 0 };
    this._scanAction = { state: 'not_checked', reason: null };
    this._doRender();

    try {
      const status = await scanHass.callWS({ type: 'ha_network_map/scan' });
      if (!currentScan()) return;
      this._invalidateComparison();
      this._comparison.error = 'context_changed';
      const completed = this._completedScan(status);
      const scanAction = completed
        ? { state: status.device_count === 0 ? 'no_data' : 'success', reason: status.device_count === 0 ? 'no_data' : 'success' }
        : { state: 'unconfirmed', reason: status?.queued === true ? 'queued' : 'unconfirmed' };
      this._scanAction = completed ? { state: 'not_checked', reason: null } : scanAction;
      if (completed) this._lastScanTime = Math.floor(status.last_scan_finished_at * 1000);
      const refreshed = await this._reloadFromApi();
      if (!currentScan()) return;
      this._scanAction = completed && (!refreshed || this._listError)
        ? { state: 'partial', reason: 'partial' } : scanAction;
    } catch (e) {
      if (!currentScan()) return;
      const code = this._scanFailureCode(e);
      this._scanAction = { state: ['unauthorized', 'unknown_command'].includes(code) ? 'error' : 'unconfirmed', reason: code };
    } finally {
      this._scanTransportPending = false;
      if (!currentScan()) return;
      this._scanInProgress = false;
      this._scanProgress = { current: 0, total: 0 };
      this._doRender();
    }
  }

  connectedCallback() {
    this._disconnected = false;
    _bindFamilyNavigation(this);
    _bindFamilyRecords(this);
    this._bindComparisonConnection();
    window.addEventListener('offline', this._comparisonConnectivity);
    window.addEventListener('online', this._comparisonConnectivity);
    if (this._hass && this._firstHassRender) {
      this._subscribeRegistryUpdates();
      this._queueDeviceRefresh();
    }
  }

  disconnectedCallback() {
    _disconnectFamilyNavigation(this);
    _disconnectFamilyRecords(this);
    this._familyRecordWidth = null;
    this._familyNavWidth = null;
    this._disconnected = true;
    this._unbindComparisonConnection();
    window.removeEventListener('offline', this._comparisonConnectivity);
    window.removeEventListener('online', this._comparisonConnectivity);
    this._invalidateComparison();
    this._scanEpoch = (this._scanEpoch || 0) + 1;
    this._scanInProgress = false;
    this._readEpoch++;
    this._readRequest = null;
    this._readDirty = false;
    clearTimeout(this._refreshTimer);
    clearTimeout(this._renderTimer);
    this._refreshTimer = null;
    this._renderTimer = null;
    this._renderScheduled = false;
    this._stopRegistryUpdates();
  }

  _readSession(hass = this._hass) {
    return { connection: hass?.connection, userId: hass?.user?.id, admin: hass?.user?.is_admin,
      instanceId: hass?.config?.instance_id };
  }

  _sameReadSession(a, b) {
    return a.connection === b.connection && a.userId === b.userId && a.admin === b.admin && a.instanceId === b.instanceId;
  }

  _stopRegistryUpdates() {
    this._registryEpoch++;
    this._registryConnection = null;
    for (const unsubscribe of this._registryUnsubs) unsubscribe();
    this._registryUnsubs = [];
  }

  _subscribeRegistryUpdates() {
    const connection = this._hass?.connection;
    if (!this.isConnected || this._disconnected || !connection?.subscribeEvents || this._registryConnection === connection) return;
    this._registryConnection = connection;
    const epoch = this._registryEpoch;
    for (const type of ['device_registry_updated', 'entity_registry_updated']) {
      Promise.resolve(connection.subscribeEvents(() => {
        if (epoch === this._registryEpoch) this._queueDeviceRefresh();
      }, type)).then(unsubscribe => {
        if (epoch !== this._registryEpoch || this._disconnected) unsubscribe();
        else this._registryUnsubs.push(unsubscribe);
      }).catch(e => console.debug('[ha-network-map] Registry subscription unavailable', e));
    }
  }

  _queueDeviceRefresh() {
    if (!this.isConnected || this._disconnected || !this._hass?.callWS) return;
    this._readDirty = true;
    if (this._refreshTimer !== null || this._readRequest) return;
    const elapsed = Date.now() - (this._lastReadAt ?? Date.now());
    this._refreshTimer = setTimeout(async () => {
      this._refreshTimer = null;
      if (this._disconnected) return;
      if (await this._reloadFromApi()) this._doRender();
    }, Math.max(0, 5000 - elapsed));
  }

  _reloadFromApi() {
    // Read-only canonical discovery. A burst or slow response gets at most one
    // pending read per context; superseded sessions/filters never apply replies.
    if (!this._hass?.callWS || this._disconnected) return Promise.resolve(false);
    const hass = this._hass;
    const session = this._readSession(hass);
    const includeNonNetwork = this._includeNonNetwork;
    const previous = this._readRequest;
    if (previous && previous.epoch === this._readEpoch && previous.includeNonNetwork === includeNonNetwork && this._sameReadSession(previous.session, session)) return previous.promise;
    const request = { epoch: ++this._readEpoch, session, includeNonNetwork };
    this._readRequest = request;
    this._lastReadAt = Date.now();
    this._readDirty = false;
    clearTimeout(this._refreshTimer);
    this._refreshTimer = null;
    const current = () => !this._disconnected && request.epoch === this._readEpoch && includeNonNetwork === this._includeNonNetwork && this._sameReadSession(session, this._readSession());
    request.promise = (async () => {
      try {
        const res = await hass.callWS({ type: 'ha_network_map/list_devices', include_non_network: includeNonNetwork });
        if (!current()) return false;
        if (!Array.isArray(res?.devices) || res.devices.some(d => !d || typeof d !== 'object' || Array.isArray(d))) throw { code: 'invalid_response' };
        const list = res.devices;
        this._integrationDevices = list;
        const reachMap = {};
        for (const d of list) if (d?.ip) reachMap[d.ip] = d.reachable === true;
        this._scanResults = reachMap;
        this._buildDeviceList();
        this._listError = false;
        this._scanError = null;
        return true;
      } catch (e) {
        if (!current()) return false;
        this._listError = true;
        this._scanError = ['unknown_command', 'unauthorized'].includes(e?.code) ? e.code : 'list_failed';
        return true;
      } finally {
        if (this._readRequest === request) {
          this._readRequest = null;
          if (this._readDirty) this._queueDeviceRefresh();
        }
      }
    })();
    return request.promise;
  }

  _comparisonBoundary(reason) {
    this._invalidateComparison();this._comparison.error=reason;
    if (this._scanInProgress) this._scanAction = { state: 'unconfirmed', reason: 'unconfirmed' };
    this._scanEpoch=(this._scanEpoch||0)+1;this._scanInProgress=false;
    if (!this._disconnected) this._doRender();
  }

  _unbindComparisonConnection() {
    this._comparisonConnection?.removeEventListener?.('ready',this._comparisonReady);
    this._comparisonConnection?.removeEventListener?.('disconnected',this._comparisonDisconnected);
    this._comparisonConnection=null;this._comparisonListenersBound=false;this._comparisonConnectionReady=false;
  }

  _bindComparisonConnection() {
    const connection=this._hass?.connection;
    if (connection!==this._comparisonConnection) {
      const hadConnection=Boolean(this._comparisonConnection);
      this._unbindComparisonConnection();this._comparisonConnection=connection;
      this._comparisonConnectionReady=connection?.connected === true;
      if(hadConnection)this._invalidateComparison();
    }
    if(this.isConnected && connection?.addEventListener && !this._comparisonListenersBound){
      connection.addEventListener('ready',this._comparisonReady);
      connection.addEventListener('disconnected',this._comparisonDisconnected);
      this._comparisonListenersBound=true;
    }
  }

  _comparisonContext() {
    const hass = this._hass;
    return { connection: hass?.connection, connected: hass?.connection?.connected === true && this._comparisonConnectionReady === true,
      callWS: hass?.callWS, user: hass?.user?.id, admin: hass?.user?.is_admin === true && hass.user.is_active !== false,
      active: hass?.user?.is_active, owner: hass?.user?.is_owner === true, groups: JSON.stringify(hass?.user?.group_ids || []),
      language: hass?.language || this._lang, source: location.origin, instanceId: hass?.config?.instance_id,
      online: this._comparisonBrowserOnline && navigator.onLine !== false };
  }

  _sameComparisonContext(a, b) {
    return Object.keys(a).every(key => a[key] === b[key]);
  }

  _invalidateComparison() {
    this._comparisonEpoch++;
    this._comparisonHistoryContext = null;
    this._comparisonRequest?.cancel();
    this._comparisonRequest = null;
    this._comparison = { history: [], historyLoaded: false, data: null, state: 'not_checked', error: '', before: '', after: '', page: 1, detail: null };
  }

  _validComparisonProof(data) {
    if (!data || typeof data.comparable !== 'boolean' || !Array.isArray(data.changes)) return false;
    const keys=['new','not_in_scan','ip_changed','unchanged','unknown'];
    if (!data.counts || Object.keys(data.counts).length!==keys.length || keys.some(key=>!Object.hasOwn(data.counts,key))) return false;
    const validMetadata=snapshot=>{
      if (!snapshot || typeof snapshot.id!=='string' || !snapshot.id || snapshot.source!=='ha_server_tcp' || snapshot.mode!=='tcp' || !['full','partial'].includes(snapshot.coverage)) return false;
      const start=Date.parse(snapshot.started_at),end=Date.parse(snapshot.finished_at);
      if (typeof snapshot.started_at!=='string' || !snapshot.started_at.endsWith('Z') || typeof snapshot.finished_at!=='string' || !snapshot.finished_at.endsWith('Z') || !Number.isFinite(start) || !Number.isFinite(end) || end<start) return false;
      const m=snapshot.method,scope=snapshot.scope,caps=snapshot.caps;
      return m?.protocol==='tcp_connect_v1' && Array.isArray(m.ports) && m.ports.length>0 && m.ports.every(port=>Number.isInteger(port)&&port>0&&port<=65535)
        && Number.isFinite(m.timeout)&&m.timeout>0&&Number.isInteger(m.max_concurrent)&&m.max_concurrent>0
        && scope?.discovery==='ha_known_devices_v1'&&typeof scope.include_public_ips==='boolean'
        && Number.isInteger(caps?.devices)&&caps.devices>0&&Number.isInteger(caps.optional_cache)&&caps.optional_cache>0;
    };
    if ([data.before,data.after].some(snapshot=>snapshot!==null && snapshot!==undefined && !validMetadata(snapshot))) return false;
    if (!data.comparable) return ['unconfirmed','no_data'].includes(data.state) && data.changes.length===0 && keys.every(key=>data.counts[key]===null);
    if (!['success','partial'].includes(data.state) || !validMetadata(data.before) || !validMetadata(data.after)) return false;
    const signature=snapshot=>JSON.stringify([snapshot.source,snapshot.method.protocol,snapshot.method.ports,snapshot.method.timeout,snapshot.method.max_concurrent,snapshot.scope.discovery,snapshot.scope.include_public_ips,snapshot.mode,snapshot.caps.devices,snapshot.caps.optional_cache]);
    if (signature(data.before)!==signature(data.after)) return false;
    const complete=data.before.coverage==='full' && data.after.coverage==='full';
    if (data.state!==(complete ? 'success' : 'partial')) return false;
    return keys.every(key=>Number.isInteger(data.counts[key])&&data.counts[key]>=0&&data.counts[key]<=1024)
      && keys.reduce((sum,key)=>sum+data.counts[key],0)===data.changes.length;
  }

  _loadComparison() {
    // Read-only commands only; no automatic retry on failure or context change.
    this._bindComparisonConnection();
    const context = this._comparisonContext();
    if (this._disconnected || !context.admin || !context.callWS || !context.online || !context.connected) {
      this._invalidateComparison();
      this._comparison.state = 'not_checked';
      this._comparison.error = !context.admin ? 'role' : !context.online ? 'offline' : 'connection';
      this._doRender();
      return Promise.resolve(false);
    }
    if (this._comparisonHistoryContext && !this._sameComparisonContext(this._comparisonHistoryContext,context)) this._invalidateComparison();
    if (this._comparisonWire) {
      const wire=this._comparisonWire;
      if (wire.before!==this._comparison.before || wire.after!==this._comparison.after || !this._sameComparisonContext(wire.context,context)) {
        this._comparisonRequest?.cancel();this._comparisonRequest=null;
        this._comparison.state='not_checked';this._comparison.error='context_changed';this._doRender();
      }
      return wire.promise;
    }

    const before = this._comparison.before, after = this._comparison.after;
    const previous = this._comparisonRequest;
    if (previous && previous.before === before && previous.after === after && this._sameComparisonContext(context,previous.context)) return previous.promise;
    previous?.cancel();
    const request = { epoch: ++this._comparisonEpoch, context, before, after };
    const current = () => !this._disconnected && this._comparisonRequest === request && request.epoch === this._comparisonEpoch && request.before === this._comparison.before && request.after === this._comparison.after && this._sameComparisonContext(context,this._comparisonContext());
    const hass = this._hass;
    let timeoutId;
    const expired = new Promise((_, reject) => {
      request.cancel = () => { clearTimeout(timeoutId); reject({ code: 'cancelled' }); };
      timeoutId = setTimeout(() => reject({code:'deadline'}),10000);
    });
    this._comparisonRequest = request;
    this._comparison.state = 'loading';
    this._comparison.data = null;
    this._comparison.detail = null;
    this._comparison.error = '';
    const work = async () => {
      if (!this._comparison.historyLoaded) {
        const history = await hass.callWS({ type: 'ha_network_map/scan_history' });
        if (!current()) return false;
        if (!history || !Array.isArray(history.snapshots) || history.snapshots.length > 30 || history.snapshots.some(s => !s || typeof s.id !== 'string' || typeof s.finished_at !== 'string')) throw {code:'invalid_response'};
        this._comparison.history = history.snapshots;
        this._comparison.historyStatus = history.status;
        this._comparison.historyLoaded = true;
        this._comparisonHistoryContext = {...context};
      }
      if (!current()) return false;
      if (this._comparison.history.length < 2) {
        this._comparison.state = ['unavailable','save_failed','unloaded'].includes(this._comparison.historyStatus) ? 'error' : 'no_data';
        this._comparison.error = this._comparison.state === 'error' ? 'history_unavailable' : '';
        return true;
      }
      const command = {type:'ha_network_map/compare_scans'};
      if (before) command.before_id = before;
      if (after) command.after_id = after;
      const data = await hass.callWS(command);
      if (!current()) return false;
      if (!this._validComparisonProof(data) || !Array.isArray(data.changes) || data.changes.length > 1024 || !Array.isArray(data.reasons) || data.reasons.some(r => typeof r !== 'string') || !data.counts || Object.values(data.counts).some(n => (data.comparable === false && n === null) ? false : !Number.isInteger(n) || n < 0) || data.changes.some(row => !row || !['new','not_in_scan','ip_changed','unchanged','unknown'].includes(row.kind) || [row.before,row.after].some(r => r && (!Array.isArray(r.open_ports) || typeof r.reachable !== 'boolean'))) || !['success','partial','unconfirmed','no_data'].includes(data.state)) throw {code:'invalid_response'};
      // Show the actual server-selected pair, including default latest/previous.
      for (const key of ['before','after']) {
        const actualId=data[key]?.id;
        if (typeof actualId==='string' && this._comparison.history.some(snapshot=>snapshot.id===actualId)) this._comparison[key]=actualId;
      }
      request.before=this._comparison.before;request.after=this._comparison.after;
      wire.before=request.before;wire.after=request.after;
      this._comparison.data = data;
      this._comparison.state = data.state;
      this._comparison.page = 1;
      return true;
    };
    const wire={before,after,context,promise:null};this._comparisonWire=wire;
    const transport=work();
    const releaseWire=()=>{if(this._comparisonWire===wire){this._comparisonWire=null;if(!this._disconnected)this._doRender();}};
    transport.then(releaseWire,releaseWire);
    request.promise = Promise.race([transport,expired]).catch(error => {
      if (!current()) return false;
      this._comparison.state = error.code === 'cancelled' ? 'not_checked' : 'error';
      this._comparison.error = ['deadline','unauthorized','unknown_command','history_unavailable','invalid_response'].includes(error?.code) ? error.code : 'read_failed';
      return true;
    }).finally(() => {
      clearTimeout(timeoutId);
      // Closing the local request rejects any late transport reply; HA WS
      // promises have no cancellation API, and are never retried here.
      if (this._comparisonRequest === request) {
        this._comparisonRequest = null;
        this._doRender();
      }
    });
    wire.promise=request.promise;
    this._doRender();
    return request.promise;
  }

  _comparisonReason(reason) {
    const text = {
      no_ip:['No IP; target skipped','Brak IP; cel pominięty'], public_ip:['Public IP skipped by policy','Publiczny IP pominięty zgodnie z ustawieniem'], device_cap:['Device limit reached','Osiągnięto limit urządzeń'], zeroconf_cap:['Zeroconf cache limit','Limit cache Zeroconf'], dhcp_cap:['DHCP cache limit','Limit cache DHCP'], zeroconf_unreadable:['Zeroconf cache unreadable','Nie udało się odczytać cache Zeroconf'], dhcp_unreadable:['DHCP cache unreadable','Nie udało się odczytać cache DHCP'], unknown_identity:['Missing or ambiguous identity','Brakująca lub niejednoznaczna tożsamość'], missing_pair:['Two saved scans needed','Potrzebne dwa zapisane skany'], method_mismatch:['Different scan methods','Różne metody skanowania'], scope_mismatch:['Different configured scopes','Różne skonfigurowane zakresy'], mode_mismatch:['Different modes','Różne tryby'], caps_mismatch:['Different limits','Różne limity'], invalid_order:['Select an earlier baseline','Wybierz wcześniejszy skan'], selection_expired:['Selected scan expired','Wybrany skan wygasł'], offline:['Browser offline. Read again when connected.','Przeglądarka offline. Odczytaj ponownie po połączeniu.'], connection:['HA connection unavailable','Brak połączenia z HA'], deadline:['Read deadline reached; no retry was sent','Przekroczono czas odczytu; nie wysłano kolejnej próby'], unauthorized:['History requires administrator permission','Historia wymaga uprawnień administratora'], role:['History requires administrator permission','Historia wymaga uprawnień administratora'], unknown_command:['Update the Network Map integration to read history','Zaktualizuj integrację Network Map, aby odczytać historię'], history_unavailable:['Saved history unavailable','Zapisana historia niedostępna'], invalid_response:['Invalid history response','Nieprawidłowa odpowiedź historii'], context_changed:['Context changed. Read again.','Kontekst się zmienił. Odczytaj ponownie.'], read_failed:['Could not read saved scans','Nie udało się odczytać zapisanych skanów']
    };
    return text[reason]?.[this._lang === 'pl' ? 1 : 0] || reason;
  }

  _comparisonMeta(snapshot, title) {
    if (!snapshot) return '';
    const pl = this._lang === 'pl';
    const source = snapshot.source === 'ha_server_tcp' ? (pl ? 'Pomiar TCP z hosta HA' : 'TCP measurement from HA host') : snapshot.source;
    const scope = (pl ? 'Urządzenia znane HA; publiczne IP: ' : 'HA-known devices; public IPs: ') + (snapshot.scope?.include_public_ips ? (pl ? 'włączone' : 'included') : (pl ? 'pomijane' : 'excluded'));
    const pairs = [[this._t('comparisonSource'),source], [this._t('comparisonMethod'), 'TCP connect v1; ' + (snapshot.method?.ports || []).join(', ') + '; ' + snapshot.method?.timeout + ' s; ' + snapshot.method?.max_concurrent], [this._t('comparisonScope'),scope], [pl ? 'Tryb / limity' : 'Mode / limits', (snapshot.mode || '') + ' / ' + snapshot.caps?.devices + ' / ' + snapshot.caps?.optional_cache], [this._t('comparisonCoverage'),this._t(snapshot.coverage === 'full' ? 'comparisonFull' : 'comparisonPartial')], [this._t('comparisonCounts'),[snapshot.target_count,snapshot.completed_count,snapshot.discovered_count,snapshot.eligible_count].join(' / ')], [this._t('comparisonSkipped'),Object.entries(snapshot.skipped || {}).map(([key,value]) => this._comparisonReason(key) + ': ' + value).join('; ') || '0'], [this._t('comparisonUnknown'),snapshot.unknown_identity_count], [this._t('comparisonReasons'),(snapshot.reasons || []).map(r => this._comparisonReason(r)).join('; ') || '—']];
    return `<section class="comparison-meta"><h3>${_esc(title)}</h3><p><time>${_esc(snapshot.started_at)}</time> → <time>${_esc(snapshot.finished_at)}</time> UTC</p><dl>${pairs.map(([key,value]) => `<div><dt>${_esc(key)}</dt><dd>${_esc(value)}</dd></div>`).join('')}</dl></section>`;
  }

  _renderComparisonTab() {
    if (!this._canScan()) return `<section id="comparison"><p>${_esc(this._t('comparisonAdmin'))}</p></section>`;
    const c = this._comparison, data = c.data;
    const ui = createUiV3({language:this._lang});
    const labels = {new:'comparisonNew',not_in_scan:'comparisonMissing',ip_changed:'comparisonIp',unchanged:'comparisonSame',unknown:'comparisonUnknownRow'};
    const option = s => `<option value="${_esc(s.id)}">${_esc(s.finished_at)} UTC · ${_esc(this._t(s.coverage === 'full' ? 'comparisonFull' : 'comparisonPartial'))}</option>`;
    const select = (id,title,value) => `<label for="${id}">${_esc(title)}<select id="${id}"><option value="">${_esc(title)}</option>${c.history.map(option).join('')}</select></label>`;
    let h = `<section id="comparison" aria-labelledby="comparison-title"><h2 id="comparison-title">${_esc(this._t('comparisonTab'))}</h2><div class="comparison-controls"><button id="comparison-read" ${c.state === 'loading' || this._comparisonWire ? 'disabled' : ''}>${_esc(this._t(c.state === 'loading' ? 'comparisonLoading' : 'comparisonRead'))}</button>${c.history.length ? select('comparison-before',this._t('comparisonBefore'),c.before) + select('comparison-after',this._t('comparisonAfter'),c.after) : ''}</div><div aria-live="polite">${ui.statusHtml(c.state === 'loading' ? 'not_checked' : c.state)}${c.error ? '<p>' + _esc(this._comparisonReason(c.error)) + '</p>' : ''}</div><p>${_esc(this._t('comparisonAbsence'))}</p>`;
    if (c.historyStatus) h += `<p>${_esc(this._t('comparisonStatus'))}: ${_esc({ready:this._lang === 'pl' ? 'Gotowa' : 'Ready',empty:this._lang === 'pl' ? 'Pusta' : 'Empty',migrated:this._lang === 'pl' ? 'Odczyt po migracji w pamięci' : 'Read after in-memory migration',unavailable:this._comparisonReason('history_unavailable'),save_failed:this._lang === 'pl' ? 'Ostatni zapis nieudany' : 'Last save failed'}[c.historyStatus] || c.historyStatus)}</p>`;
    if (!data) return h + `<p>${_esc(this._t('comparisonNoData'))}</p></section>`;
    h += `<div class="comparison-metadata">${this._comparisonMeta(data.before,this._t('comparisonBefore'))}${this._comparisonMeta(data.after,this._t('comparisonAfter'))}</div><p>${_esc(this._t('comparisonReasons'))}: ${_esc(data.reasons.map(r => this._comparisonReason(r)).join('; ') || '—')}</p>`;
    h += `<div class="comparison-counts">${Object.entries(data.counts).map(([key,count]) => `<span>${_esc(this._t(labels[key] || key))}: ${_esc(data.comparable === true ? count : '—')}</span>`).join('')}</div>`;
    const pageCount = Math.max(1,Math.ceil(data.changes.length/20));
    c.page = Math.max(1,Math.min(c.page,pageCount));
    const rows = data.changes.slice((c.page-1)*20,c.page*20);
    h += `<ul class="comparison-records">${rows.map((row,index) => `<li><button id="comparison-row-${(c.page-1)*20+index}" data-comparison-detail="${(c.page-1)*20+index}"><strong>${_esc(row.after?.name || row.before?.name || '—')}</strong><span>${_esc(this._t(labels[row.kind] || 'comparisonUnknownRow'))}</span><span class="mn">${_esc(row.before?.ip || '—')} → ${_esc(row.after?.ip || '—')}</span></button></li>`).join('')}</ul><nav class="comparison-controls" aria-label="${_esc(this._t('comparisonTab'))}"><button id="comparison-prev" ${c.page <= 1 ? 'disabled' : ''}>${_esc(this._t('previous'))}</button><span>${c.page} / ${pageCount} · ${data.changes.length}</span><button id="comparison-next" ${c.page >= pageCount ? 'disabled' : ''}>${_esc(this._t('next'))}</button></nav>`;
    if (c.detail !== null && data.changes[c.detail]) {
      const row = data.changes[c.detail];
      h += `<section id="comparison-detail" aria-labelledby="comparison-detail-title"><h3 id="comparison-detail-title">${_esc(this._t('comparisonDetails'))}</h3><p>${_esc(this._t('comparisonIdentity'))}: ${_esc(row.stable_id || this._t('comparisonUnknownRow'))}</p><p>${_esc(this._t('comparisonOldIp'))}: ${_esc(row.before?.ip || '—')} → ${_esc(this._t('comparisonNewIp'))}: ${_esc(row.after?.ip || '—')}</p><p>${_esc(this._t('comparisonTCP'))}: ${_esc(row.before ? String(row.before.reachable) + ' / ' + row.before.open_ports.join(', ') : '—')} → ${_esc(row.after ? String(row.after.reachable) + ' / ' + row.after.open_ports.join(', ') : '—')}</p><button id="comparison-close">${_esc(this._t('close'))}</button></section>`;
    }
    return h + '</section>';
  }

  _bindComparisonEvents() {
    const c = this._comparison;
    this.shadowRoot.querySelector('#comparison-read')?.addEventListener('click', () => {
      this._invalidateComparison(); this._loadComparison();
    });
    for (const key of ['before','after']) {
      const select = this.shadowRoot.querySelector('#comparison-' + key);
      if (!select) continue;
      select.value = c[key];
      select.addEventListener('change', () => { c[key] = select.value; c.detail = null; this._loadComparison(); });
    }
    for (const [id,delta] of [['comparison-prev',-1],['comparison-next',1]]) {
      this.shadowRoot.querySelector('#'+id)?.addEventListener('click', () => {c.page += delta;c.detail = null;this._doRender();});
    }
    this.shadowRoot.querySelectorAll('[data-comparison-detail]').forEach(button => button.addEventListener('click', () => {c.detail=Number(button.dataset.comparisonDetail);this._doRender();}));
    this.shadowRoot.querySelector('#comparison-close')?.addEventListener('click', () => {const index=c.detail;c.detail=null;this._doRender();this.shadowRoot.querySelector('#comparison-row-'+index)?.focus();});
  }

  _categoryLabel(category) {
    const keys = { Phone: 'categoryPhone', Tablet: 'categoryTablet', Computer: 'categoryComputer', Router: 'categoryRouter', Camera: 'categoryCamera', 'Smart Home': 'categorySmartHome', Media: 'categoryMedia', Other: 'categoryOther' };
    return keys[category] ? this._t(keys[category]) : category;
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

  _icon(name, attr, category = this._cat(name, attr)) {
    const c = category;
    return ({
      Phone: '📱', Tablet: '📲', Computer: '💻', Router: '📡',
      Camera: '📷', 'Smart Home': '🏠', Media: '📺', Other: '📡'
    })[c] || '📡';
  }

  _buildDeviceList() {
    const selectedId = this.selectedDevice?.preferenceId;
    this._migrateBindings();
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
        const category = ['Phone', 'Tablet', 'Computer', 'Router', 'Camera', 'Smart Home', 'Media', 'Other'].includes(preference.category) ? preference.category : this._cat(name, { manufacturer: d.manufacturer, model: d.model });
        this.devices.push({
          key: d.key, device_id: d.device_id || null, kind: d.kind || 'network', preferenceId,
          ip: d.ip || null,
          mac: d.mac || null,
          manufacturer: d.manufacturer || null,
          model: d.model || null,
          name,
          category,
          icon: this._icon(name, { manufacturer: d.manufacturer, model: d.model }, category),
          reachable: (d.reachable === true) ? true : (d.reachable === false ? false : null),
          entity_id: (d.entity_ids && d.entity_ids[0]) || null,
          entity_ids: d.entity_ids || [],
          state: null,
          source_type: null,
          sources: d.sources || [],
          open_ports: d.open_ports || [],
          lastSeen: null,
          binding: this._bindings[preferenceId] || null
        });
      }
    }

    if (selectedId) this.selectedDevice = this.devices.find(d => d.preferenceId === selectedId) || null;
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
    const familyFocus = _rememberFamilyFocus(this);
    const recordFocus = _rememberFamilyRecords(this);
    const css = this._css();
    let content = '';

    if (this._scanInProgress) {
      content = this._renderScanOverlay();
    } else {
      switch (this.activeTab) {
        case 'devices': content = this._renderDevicesTab(); break;
        case 'topology': content = this._renderTopologyTab(); break;
        case 'bindings': content = this._renderBindingsTab(); break;
        case 'comparison': content = this._renderComparisonTab(); break;
      }
    }

    const html = css + '<div class="card">' +
      '<div class="card-header-wrapper">' +
      '<div class="card-header">📡 ' + _esc(this._title) + '</div>' +
      '<div class="header-footer">' +
      (this._lastScanTime ? '<span style="font-size:11px;color:var(--bento-text-secondary);">' + this._t('scanned') + ' ' + new Date(this._lastScanTime).toLocaleTimeString() + '</span>' : '') +
      '<button class="rb" id="rescanBtn"' + (!this._canScan() || this._scanInProgress ? ' disabled' : '') + '>🔄 ' + (this._lang === 'pl' ? 'Skanuj' : 'Rescan') + '</button>' +
      '</div>' +
      '</div>' +
      '<div class="tabs">' +
      '<button class="tab-btn ' + (this.activeTab === 'devices' ? 'active' : '') + '" id="tab-devices" data-tab="devices">' + this._t('devicesTab') + '</button>' +
      '<button class="tab-btn ' + (this.activeTab === 'topology' ? 'active' : '') + '" id="tab-topology" data-tab="topology">' + this._t('topologyTab') + '</button>' +
      '<button class="tab-btn ' + (this.activeTab === 'comparison' ? 'active' : '') + '" id="tab-comparison" data-tab="comparison">' + this._t('comparisonTab') + '</button>' +
      '<button class="tab-btn ' + (this.activeTab === 'bindings' ? 'active' : '') + '" id="tab-bindings" data-tab="bindings">' + this._t('bindingsTab') + '</button>' +
      '</div>' +
      (!this._canScan() ? '<div role="status" style="margin:8px 12px;padding:10px 14px;font-size:13px;">' + _esc(this._t('scanAdminRequired')) + '</div>' : '') +
      (this._scanError ? '<div style="margin:8px 12px;padding:10px 14px;background:var(--bento-error-light);color:var(--bento-error);border:1px solid var(--bento-error-border);border-radius:var(--bento-radius-sm);font-size:13px;">⚠️ ' + createUiV3({language:this._lang}).statusHtml('error') + ' ' + _esc(this._scanMessage(this._scanError)) + (this._listError ? ' <button type="button" class="rb" id="retryDevices">' + this._t('retry') + '</button>' : '') + '</div>' : '') +
      '<div id="scanActionResult" role="status" style="margin:8px 12px;">' + createUiV3({language:this._lang}).statusHtml(this._scanAction?.state || 'not_checked') + (this._scanAction?.reason ? ' ' + _esc(this._scanMessage(this._scanAction.reason)) : '') + '</div>' +
      content +
      '</div>';

    const support = this._hass?.user?.is_admin && this.config?.show_support !== false && !supportDismissed() ? ownDonateFooter() : '';
    this._renderedLang = this._lang;
    this._renderedCanScan = this._canScan();
    if (this._lastHtml === html + support) { _bindFamilyNavigation(this); _bindFamilyRecords(this); return; }
    // Preserve focus + caret across the full innerHTML rebuild so typing in an
    // input (search / subnet / config) survives data-driven re-renders instead
    // of dropping a character per refresh.
    const _ae = this.shadowRoot.activeElement;
    const _fid = _ae && _ae.id;
    let _ss = null, _se = null, _sd = null;
    try { if (_ae) { _ss = _ae.selectionStart; _se = _ae.selectionEnd; _sd = _ae.selectionDirection; } } catch (e) {}
    this._lastHtml = html + support;
    this.shadowRoot.innerHTML = html + support;
    this._bindEvents();
    if (_fid) {
      const _el = this.shadowRoot.getElementById(_fid) || ((_fid.startsWith('device-detail-') || _fid.startsWith('topology-device-')) ? this.shadowRoot.getElementById('sI') || this.shadowRoot.getElementById('tab-' + this.activeTab) : null);
      if (_el) { try { _el.focus({ preventScroll: true }); if (_ss != null && _el.setSelectionRange) _el.setSelectionRange(_ss, _se, _sd || 'none'); } catch (e) {} }
    }
    _bindFamilyNavigation(this, familyFocus);
    _bindFamilyRecords(this, recordFocus);
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

    const catOpts = cats.map(c => '<option value="' + _esc(c) + '"' + (this._catFilter === c ? ' selected' : '') + '>' + _esc(this._categoryLabel(c)) + '</option>').join('');
    h += '<div class="toolbar"><input type="text" class="si" id="sI" aria-label="' + _esc(this._t('searchPlaceholder')) + '" placeholder="' + this._t('searchPlaceholder') + '" value="' + _esc(this.searchQuery || '') + '">' +
      '<select class="fs" id="cF" aria-label="' + _esc(this._t('category')) + '"><option value="all">' + this._t('allCategories') + '</option>' + catOpts + '</select>' +
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
      rows += '<tr data-record-key="' + _esc(d.preferenceId) + '" data-record-name="' + _esc(d.name) + '" data-record-state="' + _esc(d.reachable == null ? this._t('unknownStatus') : d.reachable ? this._t('reachableStatus') : this._t('unreachableStatus')) + '" data-i="' + i + '"><td><button type="button" class="device-detail-button" id="device-detail-' + _esc(d.preferenceId) + '"><span class="di" aria-hidden="true">' + _esc(d.icon) + '</span><span class="dn">' + _esc(d.name) + '</span></button></td>' +
        '<td>' + _esc(this._categoryLabel(d.category)) + '</td>' +
        '<td class="mn">' + _esc(d.ip || '—') + '</td>' +
        '<td class="mn">' + _esc(d.mac || '—') + '</td>' +
        '<td>' + _esc(d.manufacturer || '—') + '</td>' +
        '<td style="text-align:center">' + dot + '</td>' +
        '<td><small>' + _esc(d.binding ? d.binding : '—') + '</small></td>' +
        '</tr>';
    });

    h += '<div class="tw"><table data-device-records><thead><tr>' +
      '<th data-s="name" aria-sort="' + (this.sortBy === 'name' ? (this.sortDesc ? 'descending' : 'ascending') : 'none') + '"><button type="button" id="sort-name" style="font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit">' + this._t('deviceName') + sa('name') + '</button></th>' +
      '<th data-s="category" aria-sort="' + (this.sortBy === 'category' ? (this.sortDesc ? 'descending' : 'ascending') : 'none') + '"><button type="button" id="sort-category" style="font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit">' + this._t('category') + sa('category') + '</button></th>' +
      '<th data-s="ip" aria-sort="' + (this.sortBy === 'ip' ? (this.sortDesc ? 'descending' : 'ascending') : 'none') + '"><button type="button" id="sort-ip" style="font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit">' + this._t('ipAddress') + sa('ip') + '</button></th>' +
      '<th data-s="mac" aria-sort="' + (this.sortBy === 'mac' ? (this.sortDesc ? 'descending' : 'ascending') : 'none') + '"><button type="button" id="sort-mac" style="font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit">' + this._t('macAddress') + sa('mac') + '</button></th>' +
      '<th data-s="manufacturer" aria-sort="' + (this.sortBy === 'manufacturer' ? (this.sortDesc ? 'descending' : 'ascending') : 'none') + '"><button type="button" id="sort-manufacturer" style="font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit">' + this._t('manufacturer') + sa('manufacturer') + '</button></th>' +
      '<th data-s="reachable" aria-sort="' + (this.sortBy === 'reachable' ? (this.sortDesc ? 'descending' : 'ascending') : 'none') + '"><button type="button" id="sort-reachable" style="font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit">' + this._t('reachable') + sa('reachable') + '</button></th>' +
      '<th>' + this._t('haEntity') + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    if (tp > 1) {
      h += '<div class="pg"><button class="pb" id="page-previous" data-p="' + (pg - 1) + '"' + (pg <= 1 ? ' disabled' : '') + '>‹ ' + this._t('previous') + '</button>' +
        '<span class="pi2">' + pg + ' / ' + tp + ' (' + this.filteredDevices.length + ')</span>' +
        '<button class="pb" id="page-next" data-p="' + (pg + 1) + '"' + (pg >= tp ? ' disabled' : '') + '>' + this._t('next') + ' ›</button></div>';
    }

    return h;
  }

  _renderDeviceDetail(d) {
    let rows = [
      [this._t('deviceName'), _esc(d.icon) + ' ' + _esc(d.name)],
      [this._t('category'), _esc(this._categoryLabel(d.category))],
      [this._t('status'), d.reachable == null ? this._t('unknownStatus') : d.reachable ? this._t('reachableStatus') : this._t('unreachableStatus')],
      [this._t('ipAddress'), _esc(d.ip || '—')],
      [this._t('macAddress'), _esc(d.mac || '—')]
    ];
    if (d.manufacturer) rows.push([this._t('manufacturer'), _esc(d.manufacturer + (d.model ? ' ' + d.model : ''))]);
    if (d.entity_id) rows.push([this._t('entity'), _esc(d.entity_id)]);

    const rh = rows.map(r => '<div class="dr"><span class="dl">' + r[0] + '</span><span class="dv">' + r[1] + '</span></div>').join('');
    const bindHtml = d.reachable ? '<button class="rb" id="bindBtn" data-ip="' + _esc(d.ip || d.name) + '">🔗 ' + this._t('bind') + '</button>' : '';
    const categories = ['Phone', 'Tablet', 'Computer', 'Router', 'Camera', 'Smart Home', 'Media', 'Other'];
    const categorySelect = '<label>' + this._t('category') + ' <select id="deviceCategory">' + categories.map(c => '<option value="' + _esc(c) + '"' + (d.category === c ? ' selected' : '') + '>' + _esc(this._categoryLabel(c)) + '</option>').join('') + '</select></label>';
    const links = (d.device_id ? '<a href="/config/devices/device/' + encodeURIComponent(d.device_id) + '">' + this._t('openDevice') + '</a> ' : '') +
      (d.entity_id ? '<button type="button" class="rb" id="openEntity" data-entity="' + _esc(d.entity_id) + '">' + this._t('openEntity') + '</button>' : '');
    const hidden = !!this._devicePrefs[d.preferenceId]?.hidden;

    return '<div class="dd" id="dD"><button class="dc" id="cD">✕ ' + this._t('close') + '</button><div style="clear:both"></div>' +
      rh + '<div style="margin-top:12px">' + categorySelect + ' <button class="rb" id="hideDevice">' + (hidden ? this._t('showDevice') : this._t('hideDevice')) + '</button> ' + links + ' ' + bindHtml + '</div></div>';
  }

  _renderTopologyTab() {
    // ── Empty state ──────────────────────────────────────────────────────────
    if (!this.devices.length) {
      return '<div class="es" style="padding:60px 20px;">' +
        '<div style="font-size:40px;margin-bottom:12px;">🔍</div>' +
        '<div style="font-weight:600;font-size:15px;margin-bottom:6px;color:var(--bento-text);">' +
        (this._lang === 'pl' ? 'Brak urządzeń w topologii' : 'No registry devices in the map') +
        '</div>' +
        '<div style="font-size:12px;color:var(--bento-text-secondary);">' +
        (this._lang === 'pl' ? 'Sprawdź integrację i filtry urządzeń.' : 'Check the integration and device filters.') +
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

    // ── Clutter handling: cap at 24 visible device nodes ────────────────────
    const MAX_NODES = 24;
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
    // Inner ring (r=155): individual device nodes.
    // Outer ring (r=210): category summary nodes when >40 devices.
    const VW = 800, VH = 520;
    const cx = VW / 2, cy = VH / 2;
    const INNER_R   = 155;
    const OUTER_R   = 210;
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
      ' role="group" aria-label="Network topology graph">';

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

      svg += '<g id="topology-device-' + _esc(d.preferenceId) + '" tabindex="0" role="img" aria-label="' + _esc(d.name || d.ip || '') + '"><title>' + _esc(d.name || d.ip || '') + '</title>';
      svg += '<circle cx="' + d._x + '" cy="' + d._y + '" r="' + NODE_R + '"' +
        ' fill="' + fill + '" fill-opacity="' + fillOp + '"' +
        ' stroke="' + stroke + '" stroke-width="' + (isReach ? '2' : '1.5') + '"' +
        (isUnreach ? ' stroke-dasharray="3 2"' : '') + '/>';

      // Emoji icon centred in node
      svg += '<text x="' + d._x + '" y="' + d._y + '"' +
        ' text-anchor="middle" dominant-baseline="central"' +
        ' font-size="13" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">' +
        _esc(d.icon || '📡') + '</text>';

      // Dense maps use full hover/focus names instead of overlapping labels.
      if (total <= 12) {
      // Name label below node (max 12 chars)
      const label = String(d.name || d.ip || '').substring(0, 12);
      svg += '<text x="' + d._x + '" y="' + (d._y + NODE_R + 11) + '"' +
        ' text-anchor="middle" font-size="9.5"' +
        ' font-family="Inter,SF Pro,system-ui,sans-serif"' +
        ' fill="var(--bento-text-secondary)" font-weight="500">' +
        _esc(label) + '</text>';
      }

      // Reachability dot (top-right quadrant of node)
      if (d.reachable === true || d.reachable === false) {
        const dotColor = d.reachable ? 'var(--bento-success)' : 'var(--bento-error)';
        svg += '<circle cx="' + (d._x + NODE_R * 0.7) + '" cy="' + (d._y - NODE_R * 0.7) + '"' +
          ' r="4.5" fill="' + dotColor + '" stroke="var(--bento-card)" stroke-width="1.5"/>';
      }
      svg += '</g>';
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
        ' fill="var(--bento-text-secondary)">' + _esc(this._categoryLabel(g.category)) + '</text>';
    });

    // Hub node (router / HA gateway)
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + HUB_R + '"' +
      ' fill="var(--bento-primary)" fill-opacity="0.18"' +
      ' stroke="var(--bento-primary)" stroke-width="2.5"/>';
    svg += '<text x="' + cx + '" y="' + cy + '"' +
      ' text-anchor="middle" dominant-baseline="central"' +
      ' font-size="18" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">📡</text>';
    const routerLabel = this._routerIp || (this._lang === 'pl' ? 'Mapa urządzeń' : 'Device map');
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
        (this._lang === 'pl' ? 'Pokazano ' + MAX_NODES + ' z ' + this.devices.length : 'Showing ' + MAX_NODES + ' of ' + this.devices.length + ' devices') +
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
        (catIcons[cat] || '📡') + ' ' + _esc(this._categoryLabel(cat)) + '</span>';
    });
    catKey += '</div>';

    const focusedName = '<div class="topology-node-name" role="status" aria-live="polite"' +
      ' style="min-height:1.4em;margin-top:8px;font-size:13px;overflow-wrap:anywhere;color:var(--bento-text-secondary)">' +
      (this._lang === 'pl' ? 'Przejdź klawiszem Tab do urządzenia, aby zobaczyć pełną nazwę.' : 'Use Tab to show a device’s full name.') + '</div>';
    return svg + focusedName + legend + catKey;
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
          '<button class="rb" style="float:right;font-size:11px" aria-label="' + (this._lang === 'pl' ? 'Usuń podsieć' : 'Remove subnet') + '" data-remove-subnet="' + subnet + '">✕</button>' +
          '</div>';
      });
    }

    h += '</div></div>';

    h += '<div style="margin-top:16px"><div style="display:flex;gap:8px">' +
      '<input type="text" class="si" id="subnetInput" aria-label="' + _esc(this._t('addSubnetLabel')) + '" placeholder="' + this._t('addSubnetLabel') + '" style="flex:1">' +
      '<button class="rb" id="addSubnetBtn">' + (this._lang === 'pl' ? 'Dodaj' : 'Add') + '</button>' +
      '<button class="rb" id="rescanSubnetBtn"' + (!this._canScan() || this._scanInProgress ? ' disabled' : '') + '>🔄 ' + this._t('rescanAll') + '</button>' +
      '</div></div>';

    return h + '</div>';
  }

  _renderBindingsTab() {
    let h = '<div><p class="bindings-help" style="line-height:1.6;overflow-wrap:anywhere">' + _esc(this._t('bindingHelp')) + '</p>';

    // Suggested bindings
    if (this._suggestedBindings.length > 0) {
      h += '<div class="tree-group" style="margin-bottom:16px"><div class="tree-group-header">' +
        '<span class="tree-toggle">▼</span>' +
        '<span class="tree-status-label">' + this._t('suggestedBindings') + ' (' + this._suggestedBindings.length + ')</span>' +
        '</div><div class="tree-group-items">';

      this._suggestedBindings.forEach(sug => {
        h += '<div class="tree-item" style="gap:4px">' +
          '<span class="tree-item-name">' + _esc(sug.deviceName) + ' → ' + _esc(sug.entityName) + '</span>' +
          '<button class="rb" style="font-size:11px" aria-label="' + (this._lang === 'pl' ? 'Akceptuj sugestię powiązania' : 'Accept binding suggestion') + '" data-accept-suggestion="' + _esc(sug.key) + '">✓</button>' +
          '<button class="rb" style="font-size:11px" aria-label="' + (this._lang === 'pl' ? 'Odrzuć sugestię powiązania' : 'Reject binding suggestion') + '" data-reject-suggestion="' + _esc(sug.key) + '">✕</button>' +
          '</div>';
      });

      h += '</div></div>';
    }

    // Current bindings
    const currentBindings = Object.entries(this._bindings).filter(([, entityId]) => entityId);
    if (currentBindings.length > 0) {
      h += '<div class="tree-group"><div class="tree-group-header">' +
        '<span class="tree-toggle">▼</span>' +
        '<span class="tree-status-label">' + this._t('deviceBindings') + ' (' + currentBindings.length + ')</span>' +
        '</div><div class="tree-group-items">';

      currentBindings.forEach(([key, entityId]) => {
        const device = this.devices.find(d => d.preferenceId === key || d.mac === key || d.key === key || d.ip === key || d.name === key);
        const devName = device ? device.name : key;
        h += '<div class="tree-item">' +
          '<span class="tree-item-name">' + _esc(devName) + '</span>' +
          '<span style="color:var(--bento-text-secondary);flex:1">' + _esc(entityId) + '</span>' +
          '<button class="rb" style="font-size:11px" id="unbind-' + _esc(key) + '" aria-label="' + (this._lang === 'pl' ? 'Usuń powiązanie' : 'Remove binding') + '" data-unbind="' + _esc(key) + '">✕</button>' +
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
        '<select class="fs" id="deviceSelect" aria-label="' + _esc(this._t('haEntity')) + '" style="width:100%;margin-bottom:8px">' +
        '<option value="">— ' + this._t('selectEntity') + '</option>';

      Object.keys(this._hass.states).filter(e => e.startsWith('device_tracker.')).forEach(e => {
        h += '<option value="' + _esc(e) + '">' + _esc(this._hass.states[e].attributes?.friendly_name || e) + '</option>';
      });

      h += '</select><button class="rb" id="manualBindBtn" style="width:100%">' + this._t('bind') + '</button>' +
        '</div>';
    }

    return h + '</div>';
  }

  _bindEvents() {
    this._bindComparisonEvents();
    this.shadowRoot.querySelectorAll('svg g[tabindex="0"]').forEach(node => {
      const showName = () => {
        const label = this.shadowRoot.querySelector('.topology-node-name');
        if (label) label.textContent = node.getAttribute('aria-label') || '';
      };
      node.addEventListener('focus', showName);
      node.addEventListener('mouseover', showName);
    });
    this.shadowRoot.querySelector('.support-dismiss')?.addEventListener('click', () => {
      try { localStorage.setItem(SUPPORT_DISMISSED_KEY, '1'); } catch (_) {}
      this._doRender();
    });
    // Tab switching
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        if (this.activeTab === 'comparison' && tabId !== 'comparison') { this._comparisonEpoch++; this._comparisonRequest?.cancel(); this._comparisonRequest = null; if (this._comparison.state === 'loading') this._comparison.state = 'not_checked'; }
        this.activeTab = tabId;
        if (tabId === 'comparison' && !this._comparison.data && this._comparison.state === 'not_checked') this._loadComparison();
        history.replaceState(null, '', location.pathname + '#' + this._toolId + '/' + tabId);
        this._doRender();
      });
    });

    const openEntity = this.shadowRoot.querySelector('#openEntity');
    if (openEntity) {
      openEntity.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          detail: { entityId: openEntity.dataset.entity }, bubbles: true, composed: true
        }));
      });
    }

    const retryDevices = this.shadowRoot.querySelector('#retryDevices');
    if (retryDevices) retryDevices.addEventListener('click', async () => {
      await this._reloadFromApi();
      this._doRender();
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
        this.shadowRoot.querySelector('#cD')?.focus();
      });
    });

    const cD = this.shadowRoot.querySelector('#cD');
    if (cD) {
      cD.addEventListener('click', () => {
        const preferenceId = this.selectedDevice?.preferenceId;
        this.selectedDevice = null;
        this._doRender();
        const index = this.filteredDevices.findIndex(d => d.preferenceId === preferenceId);
        const pageStart = (this._currentPage - 1) * this._pageSize;
        if (index >= pageStart && index < pageStart + this._pageSize) {
          _focusFamilyRecord(this, preferenceId, 'device-detail-' + preferenceId);
        } else {
          this.shadowRoot.querySelector('#sI')?.focus();
        }
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
            this._setBinding(this.selectedDevice?.preferenceId || ip, choice);
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
          this._setBinding(sug.deviceKey, sug.entityId);
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
        this._setBinding(key, null);
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
          const ip = prompt(this._t('bindingTargetPrompt'));
          if (ip) {
            this._setBinding(ip, entityId);
            deviceSelect.value = '';
            this._buildDeviceList();
            this._doRender();
          }
        }
      });
    }
  }

  setActiveTab(tabId) {
    if (this.activeTab === 'comparison' && tabId !== 'comparison') { this._comparisonEpoch++; this._comparisonRequest?.cancel(); this._comparisonRequest = null; if (this._comparison.state === 'loading') this._comparison.state = 'not_checked'; }
    this.activeTab = tabId;
    if (tabId === 'comparison' && !this._comparison.data && this._comparison.state === 'not_checked') this._loadComparison();
    this._doRender();
  }

  _css() {
    return '<style>' + HA_NETWORK_MAP_BENTO_CSS + '\n' + createUiV3({language:this._lang}).css + `
#comparison { min-width:0;overflow-wrap:anywhere; }
#comparison h2 {font-size:18px;}
.comparison-controls {display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0;}
#comparison button,#comparison select {min-height:44px;min-width:44px;padding:8px 12px;border:1px solid var(--bento-border);border-radius:8px;background:var(--bento-card);color:var(--bento-text);font:inherit;max-width:100%;}
#comparison button {cursor:pointer;}
#comparison button:disabled {opacity:.6;cursor:default;}
#comparison :focus-visible {outline:2px solid var(--bento-primary);outline-offset:2px;}
#comparison label {flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:4px;}
#comparison select {width:100%;}
.comparison-metadata {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px;}
.comparison-meta,#comparison-detail {border:1px solid var(--bento-border);border-radius:10px;padding:12px;background:var(--bento-bg);min-width:0;}
.comparison-meta h3 {font-size:14px;}
.comparison-meta dl {margin:0;}
.comparison-meta dl>div {display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid var(--bento-border);padding:6px 0;}
.comparison-meta dt {flex:1 1 120px;color:var(--bento-text-secondary);}
.comparison-meta dd {flex:2 1 160px;margin:0;}
.comparison-counts {display:flex;gap:12px;flex-wrap:wrap;margin:12px 0;}
.comparison-records {list-style:none;margin:0;padding:0;}
.comparison-records li {margin:4px 0;}
.comparison-records button {width:100%;display:flex;flex-wrap:wrap;gap:8px;text-align:left;align-items:center;}
.comparison-records strong {flex:1 1 180px;min-width:0;}
.comparison-records .mn {flex:1 1 220px;min-width:0;overflow-wrap:anywhere;}
@media(max-width:500px) {#comparison .comparison-controls>* {flex:1 1 100%;}#comparison .comparison-records button>* {flex-basis:100%;}}
` +
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
    '.device-detail-button { padding: 4px 2px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }' +
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
    _FAMILY_CONTROL_CSS + _FAMILY_RECORD_CSS + '</style>';
  }

  getCardSize() { return 8; }

  getGridOptions() { return { columns: 12, min_rows: 3, min_columns: 6 }; }
  static getConfigElement() { return document.createElement('ha-network-map-editor'); }
  static getStubConfig() {
    return { type: 'custom:ha-network-map', title: 'Network Map' };
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
    const languageChanged = this._hass?.language !== hass?.language;
    this._hass = hass;
    if (languageChanged || !this.shadowRoot.firstElementChild) this._render();
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
    const familyFocus = _rememberFamilyEditorFocus(this);
    this.shadowRoot.innerHTML = `
      <style>${_FAMILY_CONTROL_CSS}
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
        <label for="cf_title">${this._hass?.language?.startsWith('pl') ? 'Tytuł' : 'Title'}</label>
        <input type="text" id="cf_title" value="${_esc(this._config?.title || 'Network Map')}">
      </div>
      <div>
        <label for="cf_router_ip">${this._hass?.language?.startsWith('pl') ? 'IP routera' : 'Router IP'}</label>
        <input type="text" id="cf_router_ip" value="${_esc(this._config?.router_ip || '')}">
      
        </div>
    `;

    _restoreFamilyEditorFocus(this, familyFocus);
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
