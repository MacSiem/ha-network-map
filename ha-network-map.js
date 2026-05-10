/* HA Tools split — ha-network-map v4.0.0 (2026-05-10) — single-tool standalone repo */
(function() {
'use strict';

// XSS protection helper
const _esc = window._haToolsEsc || ((s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'));

/* ===== HA Tools split — inline shared infrastructure ===== */
// Bento Design System CSS (inline copy — keeps tool standalone)
if (typeof window !== 'undefined' && !window.HAToolsBentoCSS) {
  window.HAToolsBentoCSS = `
/* ═══════════════════════════════════════════════
   HA Tools — Bento Design System v1.0
   ═══════════════════════════════════════════════ */

/* ── CSS Custom Properties ───────────────────── */
:host {
  /* Primary palette */
  --bento-primary: #3B82F6;
  --bento-primary-hover: #2563EB;
  --bento-primary-light: rgba(59, 130, 246, 0.08);
  --bento-success: #10B981;
  --bento-success-light: rgba(16, 185, 129, 0.08);
  --bento-error: #EF4444;
  --bento-error-light: rgba(239, 68, 68, 0.08);
  --bento-warning: #F59E0B;
  --bento-warning-light: rgba(245, 158, 11, 0.08);

  /* Theme — maps to HA theme vars with light fallbacks */
  --bento-bg: var(--primary-background-color, #F8FAFC);
  --bento-card: var(--card-background-color, #FFFFFF);
  --bento-border: var(--divider-color, #E2E8F0);
  --bento-text: var(--primary-text-color, #1E293B);
  --bento-text-secondary: var(--secondary-text-color, #64748B);
  --bento-text-muted: var(--disabled-text-color, #94A3B8);

  /* Radii */
  --bento-radius-xs: 6px;
  --bento-radius-sm: 10px;
  --bento-radius-md: 16px;

  /* Shadows */
  --bento-shadow-sm: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
  --bento-shadow-md: 0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
  --bento-shadow-lg: 0 8px 25px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.04);

  /* Transition */
  --bento-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Typography */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: block;
  color: var(--bento-text);
}

/* ── Dark mode ───────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :host {
    --bento-bg: var(--primary-background-color, #1a1a2e);
    --bento-card: var(--card-background-color, #16213e);
    --bento-border: var(--divider-color, #2a2a4a);
    --bento-text: var(--primary-text-color, #e0e0e0);
    --bento-text-secondary: var(--secondary-text-color, #a0a0b0);
    --bento-text-muted: var(--disabled-text-color, #6a6a7a);
    --bento-shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
    --bento-shadow-md: 0 4px 12px rgba(0,0,0,0.4);
    --bento-primary-light: rgba(59,130,246,0.15);
    --bento-success-light: rgba(16,185,129,0.15);
    --bento-error-light: rgba(239,68,68,0.15);
    --bento-warning-light: rgba(245,158,11,0.15);
    color-scheme: dark !important;
  }
  .card, .card-container, .main-card, .exporter-card, .security-card, .reports-card, .storage-card, .chore-card, .cry-card, .backup-card, .network-card, .sentence-card, .energy-card, .panel-card {
    background: var(--bento-card) !important; color: var(--bento-text) !important; border-color: var(--bento-border) !important;
  }
  input, select, textarea { background: var(--bento-bg); color: var(--bento-text); border-color: var(--bento-border); }
  .stat, .stat-card, .summary-card, .metric-card, .kpi-card, .health-card { background: var(--bento-bg); border-color: var(--bento-border); }
  .tab-content, .section { color: var(--bento-text); }
  table th { background: var(--bento-bg); color: var(--bento-text-secondary); border-color: var(--bento-border); }
  table td { color: var(--bento-text); border-color: var(--bento-border); }
  tr:hover td { background: rgba(59,130,246,0.08); }
  .empty-state, .no-data { color: var(--bento-text-secondary); }
  .schedule-section, .settings-section, .detail-panel, .details, .device-detail { background: var(--bento-bg); border-color: var(--bento-border); }
  .addon-list, .content-item { background: rgba(255,255,255,0.05); }
  .chart-container { background: var(--bento-bg); border-color: var(--bento-border); }
  pre, code { background: #1e293b !important; color: #e2e8f0 !important; }
}

/* ── Reset ───────────────────────────────────── */
* { box-sizing: border-box; }

/* ── Main Card Wrapper ───────────────────────── */
.card {
  background: var(--bento-card);
  border: 1px solid var(--bento-border);
  border-radius: var(--bento-radius-md);
  box-shadow: var(--bento-shadow-sm);
  color: var(--bento-text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── Header ──────────────────────────────────── */
.header {
  padding: 16px 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon { font-size: 22px; }
.header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--bento-text);
}
.header-badge {
  margin-left: auto;
  background: var(--bento-border);
  color: var(--bento-text-secondary);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: 500;
}
.content { padding: 16px 20px 20px; }

/* ── Tabs (Bento unified) ────────────────────── */
.tabs, .tab-bar, .tab-nav, .tab-header {
  display: flex !important;
  gap: 4px !important;
  border-bottom: 2px solid var(--bento-border, var(--divider-color, #334155)) !important;
  padding: 0 4px !important;
  margin-bottom: 20px !important;
  overflow-x: auto !important; overflow-y: hidden !important; -webkit-overflow-scrolling: touch !important;
  flex-wrap: nowrap !important;
}
.tab, .tab-btn, .tab-button, .dtab {
  padding: 10px 18px !important;
  border: none !important;
  background: transparent !important;
  cursor: pointer !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  font-family: 'Inter', sans-serif !important;
  color: var(--bento-text-secondary, var(--secondary-text-color, #94A3B8)) !important;
  border-bottom: 2px solid transparent !important;
  margin-bottom: -2px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  white-space: nowrap !important;
  border-radius: 0 !important;
  flex: none !important;
}
.tab:hover, .tab-btn:hover, .tab-button:hover, .dtab:hover {
  color: var(--bento-primary, #3B82F6) !important;
  background: rgba(59, 130, 246, 0.08) !important;
}
.tab.active, .tab-btn.active, .tab-button.active, .dtab.active {
  color: var(--bento-primary, #3B82F6) !important;
  border-bottom-color: var(--bento-primary, #3B82F6) !important;
  background: rgba(59, 130, 246, 0.04) !important;
  font-weight: 600 !important;
}

/* ── Tab content animation ───────────────────── */
.tab-content {
  display: block;
}
.tab-content.active {
  animation: bentoFadeIn 0.3s ease-out;
}
@keyframes bentoFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Stat / KPI cards ────────────────────────── */
.stat-card, .stat-item, .metric-card, .kpi-card {
  background: var(--bento-card, var(--card-background-color, #1E293B)) !important;
  border: 1px solid var(--bento-border, var(--divider-color, #334155)) !important;
  border-radius: var(--bento-radius-sm, 10px) !important;
  padding: 16px !important;
  text-align: center !important;
  transition: var(--bento-transition);
}
.stat-card:hover, .stat-item:hover, .metric-card:hover, .kpi-card:hover {
  box-shadow: var(--bento-shadow-md);
}
.stat-icon { font-size: 20px; margin-bottom: 4px; }
.stat-value, .stat-val, .metric-value, .kpi-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--bento-text);
}
.stat-label, .stat-lbl, .metric-label, .kpi-lbl {
  font-size: 11px;
  color: var(--bento-text-secondary);
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* ── Overview grid (2×2 stat layout) ─────────── */
.overview-grid, .stats-grid, .summary-grid, .stat-cards, .kpi-grid, .metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

/* ── Section headers ─────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--bento-text-secondary);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin: 12px 0 8px;
}

/* ── Loading / Empty / Info ──────────────────── */
.loading-bar {
  height: 3px;
  background: linear-gradient(90deg, var(--bento-primary), transparent);
  border-radius: 2px;
  animation: bentoLoad 1s infinite;
  margin-bottom: 8px;
}
@keyframes bentoLoad { 0% { background-position: 0; } 100% { background-position: 200px; } }

.empty-state, .no-data, .no-results {
  text-align: center;
  color: var(--bento-text-secondary);
  padding: 32px 16px;
  font-size: 13px;
  background: var(--bento-bg);
  border-radius: var(--bento-radius-sm);
}
.info-note, .tip-box {
  font-size: 12px;
  color: var(--bento-text-secondary);
  background: var(--bento-bg);
  border-radius: var(--bento-radius-sm);
  padding: 8px 10px;
  border-left: 3px solid var(--bento-primary);
  margin-top: 8px;
}
.last-updated {
  font-size: 11px;
  color: var(--bento-text-muted);
  text-align: right;
  margin-top: 8px;
}

/* ── Buttons ─────────────────────────────────── */
.refresh-btn {
  background: var(--bento-border);
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  color: var(--bento-text-secondary);
  cursor: pointer;
  font-weight: 500;
  transition: var(--bento-transition);
}
.refresh-btn:hover { background: var(--bento-primary); color: white; }

.toggle-btn, .action-btn {
  background: var(--bento-primary);
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: var(--bento-transition);
}
.toggle-btn:hover, .action-btn:hover { opacity: .85; }

.send-btn, .btn-primary {
  width: 100%;
  background: var(--bento-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--bento-transition);
}
.send-btn:hover, .btn-primary:hover {
  background: var(--bento-primary-hover);
  transform: translateY(-1px);
}
.send-btn:active, .btn-primary:active { transform: translateY(0); }
.send-btn:disabled, .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ── Badges / Status ─────────────────────────── */
.badge, .status-badge, .tag, .chip {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}
.badge-ok, .badge-success { background: var(--bento-success-light); color: var(--bento-success); }
.badge-er, .badge-error   { background: var(--bento-error-light);   color: var(--bento-error); }
.badge-warn, .badge-warning { background: var(--bento-warning-light); color: var(--bento-warning); }
.badge-info { background: var(--bento-primary-light); color: var(--bento-primary); }

/* ── Count badges (inline) ───────────────────── */
.count-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}
.error-badge { background: rgba(239,68,68,0.13); color: var(--bento-error); }
.warn-badge  { background: rgba(245,158,11,0.13); color: var(--bento-warning); }
.info-badge  { background: rgba(59,130,246,0.13); color: var(--bento-primary); }
.ok-badge    { background: rgba(16,185,129,0.13); color: var(--bento-success); }

/* ── Tables ───────────────────────────────────── */
table { width: 100%; border-collapse: separate; border-spacing: 0; }
th {
  background: var(--bento-bg);
  color: var(--bento-text-secondary);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 2px solid var(--bento-border);
}
td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--bento-border);
  color: var(--bento-text);
  font-size: 13px;
}
tr:hover td { background: var(--bento-primary-light); }

/* ── Forms / Inputs ──────────────────────────── */
input, select, textarea {
  padding: 8px 12px;
  border: 1.5px solid var(--bento-border);
  border-radius: var(--bento-radius-xs);
  background: var(--bento-card);
  color: var(--bento-text);
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  transition: var(--bento-transition);
  outline: none;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--bento-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ── Code blocks ─────────────────────────────── */
code {
  background: var(--bento-border);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}
pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  overflow-x: auto;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── Grid layouts ────────────────────────────── */
.schedule-grid, .send-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.schedule-card, .send-card, .info-card {
  background: var(--bento-bg);
  border: 1px solid var(--bento-border);
  border-radius: var(--bento-radius-sm);
  padding: 14px;
}

/* ── Log entries ─────────────────────────────── */
.log-entry {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 4px 6px;
  padding: 8px;
  border-radius: var(--bento-radius-sm);
  margin-bottom: 4px;
  font-size: 12px;
  min-width: 0;
  overflow: hidden;
}
.error-entry { background: var(--bento-error-light); border: 1px solid rgba(239,68,68,0.13); }
.warn-entry  { background: var(--bento-warning-light); border: 1px solid rgba(245,158,11,0.13); }
.log-time { color: var(--bento-text-muted); flex-shrink: 0; }
.log-domain {
  font-weight: 600;
  flex-shrink: 1;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}
.error-domain { color: var(--bento-error); }
.warn-domain  { color: var(--bento-warning); }
.log-msg {
  color: var(--bento-text-secondary);
  flex-basis: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  min-width: 0;
}

/* ── Send status ─────────────────────────────── */
.send-status {
  padding: 10px 14px;
  border-radius: var(--bento-radius-sm);
  margin-top: 12px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}
.send-status.sending { background: var(--bento-primary-light); color: var(--bento-primary); }
.send-status.success { background: var(--bento-success-light); color: var(--bento-success); }
.send-status.error   { background: var(--bento-error-light);   color: var(--bento-error); }

/* ── Scrollbar ───────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bento-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--bento-text-muted); }

/* ── Animations ──────────────────────────────── */
@keyframes bentoSpin { to { transform: rotate(360deg); } }
@keyframes bentoPulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

/* ── Mobile — 768 px ─────────────────────────── */
@media (max-width: 768px) {
  .content { padding: 12px; }
  .tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; gap: 2px !important; }
  .tab, .tab-button, .tab-btn { padding: 6px 10px !important; font-size: 12px !important; white-space: nowrap !important; }
  .overview-grid, .stats-grid, .summary-grid, .stat-cards, .kpi-grid, .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .stat-value, .stat-val, .kpi-val, .metric-val { font-size: 18px !important; }
  .stat-label, .stat-lbl, .kpi-lbl, .metric-lbl { font-size: 10px !important; }
  .send-grid, .schedule-grid { grid-template-columns: 1fr; }
  .log-entry { flex-wrap: wrap; gap: 2px 6px; }
  .log-domain { max-width: 60%; font-size: 11px; }
  .log-msg { flex-basis: 100%; max-width: 100%; overflow-wrap: anywhere; font-size: 11px; }
  pre { white-space: pre-wrap; word-break: break-all; max-width: calc(100vw - 80px); overflow-x: auto; }
  .panels, .board { flex-direction: column; }
  .column { min-width: unset; }
  h2 { font-size: 18px; }
  h3 { font-size: 15px; }
}

/* ── Mobile — 480 px ─────────────────────────── */
@media (max-width: 480px) {
  .tabs { gap: 1px !important; }
  .tab, .tab-button, .tab-btn { padding: 5px 8px !important; font-size: 11px !important; }
  .overview-grid, .stats-grid, .summary-grid { grid-template-columns: 1fr 1fr; }
  .stat-value, .stat-val, .kpi-val { font-size: 16px !important; }
}
`;
}
// XSS escape singleton (idempotent)
if (typeof window !== 'undefined') {
  window._haToolsEsc = window._haToolsEsc || (function(){
    var MAP = {};
    MAP[String.fromCharCode(38)] = '&amp;';
    MAP[String.fromCharCode(60)] = '&lt;';
    MAP[String.fromCharCode(62)] = '&gt;';
    MAP[String.fromCharCode(34)] = '&quot;';
    MAP[String.fromCharCode(39)] = '&#39;';
    return function(s){ return typeof s === 'string' ? s.replace(/[&<>"']/g, function(c){ return MAP[c]; }) : (s == null ? '' : s); };
  })();
}
// Universal donate footer injector — guarantees the support box appears
// on every split-tool card regardless of internal render state.
if (typeof window !== 'undefined' && !window.__haToolsSplitDonateInjector) {
  window.__haToolsSplitDonateInjector = true;
  var SPLIT_TAGS = ['ha-purge-cache','ha-yaml-checker','ha-data-exporter','ha-baby-tracker','ha-chore-tracker','ha-energy-optimizer','ha-energy-insights','ha-energy-email','ha-log-email','ha-smart-reports','ha-network-map','ha-trace-viewer','ha-automation-analyzer','ha-storage-monitor','ha-backup-manager','ha-security-check','ha-device-health','ha-sentence-manager','ha-encoding-fixer','ha-entity-renamer','ha-frigate-privacy','ha-vacuum-water-monitor'];
  var DONATE_HTML = ''
    + '<div class="donate-section" data-source="ha-tools-split-injector">'
    + '  <div class="donate-text">'
    + '    <h3>❤️ Support HA Tools Development</h3>'
    + '    <p>If this tool makes your Home Assistant life easier, consider supporting the project. Every coffee motivates further development!</p>'
    + '  </div>'
    + '  <div class="donate-buttons">'
    + '    <a class="donate-btn coffee" href="https://buymeacoffee.com/macsiem" target="_blank" rel="noopener noreferrer">☕ Buy Me a Coffee</a>'
    + '    <a class="donate-btn paypal" href="https://www.paypal.com/donate/?hosted_button_id=Y967H4PLRBN8W" target="_blank" rel="noopener noreferrer">💳 PayPal</a>'
    + '  </div>'
    + '</div>';
  function deepFindAll(tag, root) {
    var out = [];
    (function walk(node){
      if (!node || !node.querySelectorAll) return;
      var children = node.querySelectorAll('*');
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c.tagName && c.tagName.toLowerCase() === tag) out.push(c);
        if (c.shadowRoot) walk(c.shadowRoot);
      }
    })(root || document);
    return out;
  }
  // Per-tool prerequisite check + inline install banner
  var PREREQS = {
    'ha-energy-email': { service: 'ha_tools_email', repo: 'ha-tools-email-integration', label: 'HA Tools Email integration', kind: 'integration' },
    'ha-log-email':    { service: 'ha_tools_email', repo: 'ha-tools-email-integration', label: 'HA Tools Email integration', kind: 'integration' },
    'ha-encoding-fixer': { shellCommand: 'fix_encoding', label: 'shell_command.fix_encoding (optional advanced feature)', kind: 'shell_command_optional' }
  };
  var PREREQ_HTML_CACHE = {};
  function buildPrereqBanner(tag, prereq, hass) {
    if (PREREQ_HTML_CACHE[tag]) return PREREQ_HTML_CACHE[tag];
    var html = '';
    if (prereq.kind === 'integration') {
      html = '<div class="prereq-banner prereq-error" data-prereq="' + tag + '">' +
        '<div class="prereq-icon">⚠️</div>' +
        '<div class="prereq-text">' +
          '<strong>This tool requires the ' + prereq.label + '</strong><br>' +
          'Install it from HACS: <code>https://github.com/MacSiem/' + prereq.repo + '</code> ' +
          '(Category: <strong>Integration</strong>) — then add <code>' + prereq.service + ':</code> to your <code>configuration.yaml</code> and restart HA.' +
        '</div>' +
        '<a class="prereq-cta" href="https://github.com/MacSiem/' + prereq.repo + '" target="_blank" rel="noopener noreferrer">Open install guide ↗</a>' +
      '</div>';
    } else if (prereq.kind === 'shell_command_optional') {
      html = '<div class="prereq-banner prereq-info" data-prereq="' + tag + '">' +
        '<div class="prereq-icon">💡</div>' +
        '<div class="prereq-text">' +
          '<strong>Optional advanced feature: deep file scan</strong><br>' +
          'To enable scanning of <code>configuration.yaml</code> files, install the bundled <code>encoding_scanner.py</code> + add <code>shell_command:</code> entries. See README.' +
        '</div>' +
      '</div>';
    }
    PREREQ_HTML_CACHE[tag] = html;
    return html;
  }
  function injectAll() {
    SPLIT_TAGS.forEach(function(tag){
      deepFindAll(tag).forEach(function(el){
        // panel_custom auto-init: HA assigns hass/panel/narrow but does not always call setConfig.
        if (typeof el.setConfig === 'function' && !el.config && !el._config) {
          try { el.setConfig({ type: 'custom:' + tag, title: tag }); } catch(e) {}
        }
        if (!el.shadowRoot) return;
        // 1) Prereq banner — checked every poll so it disappears when prereq becomes available
        var prereq = PREREQS[tag];
        if (prereq && el._hass) {
          var hassReady = !!el._hass;
          var present = true;
          if (prereq.service) present = !!(el._hass.services && el._hass.services[prereq.service]);
          if (prereq.shellCommand) present = !!(el._hass.services && el._hass.services.shell_command && el._hass.services.shell_command[prereq.shellCommand]);
          var existing = el.shadowRoot.querySelector('.prereq-banner[data-prereq="' + tag + '"]');
          if (!present && hassReady) {
            if (!existing) {
              var top = el.shadowRoot.querySelector('.card, .card-container, .main-card, [class$="-card"]') || el.shadowRoot.firstElementChild || el.shadowRoot;
              try { top.insertAdjacentHTML('afterbegin', buildPrereqBanner(tag, prereq, el._hass)); } catch(e) {}
            }
          } else if (present && existing) {
            existing.remove();
          }
        }
        // 2) Donate footer
        if (el.shadowRoot.querySelector('.donate-section')) return;
        var target = el.shadowRoot.querySelector('.card, .card-container, .main-card, [class$="-card"]') || el.shadowRoot.firstElementChild || el.shadowRoot;
        try { target.insertAdjacentHTML('beforeend', DONATE_HTML); } catch(e) {}
      });
    });
  }
  // Run immediately, then aggressive MutationObserver for late mounts + view switches.
  injectAll();
  setTimeout(injectAll, 250);
  setTimeout(injectAll, 1000);
  setTimeout(injectAll, 3000);
  // MutationObserver catches every new node anywhere in the DOM, including shadow root attachments
  // that are deferred until the user navigates to a view.
  try {
    var obs = new MutationObserver(function(muts){
      // Debounce: schedule a microtask injection
      if (window.__haToolsDonateScheduled) return;
      window.__haToolsDonateScheduled = true;
      setTimeout(function(){ window.__haToolsDonateScheduled = false; injectAll(); }, 100);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch(e) {}
  // Also re-inject on hash/path change (Lovelace view switches)
  window.addEventListener('hashchange', function(){ setTimeout(injectAll, 200); });
  window.addEventListener('popstate', function(){ setTimeout(injectAll, 200); });
  // Backup interval (every 3s for first 5min — handles cases where MutationObserver missed events)
  var pollCount = 0;
  var pollInterval = setInterval(function(){
    injectAll();
    if (++pollCount >= 100) clearInterval(pollInterval);
  }, 3000);
}
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
  }

  set hass(hass) {
    if (!hass) return;
    if (hass?.language) this._lang = hass.language.startsWith('pl') ? 'pl' : 'en';
    this._hass = hass;

    if (!this._firstHassRender) {
      this._firstHassRender = true;
      this._loadSubnets();
      this._loadBindings();
      this._loadCachedScanResults();
      this._loadDeviceRegistry().then(() => {
        // Privacy: auto-scan disabled — initialize subnets only.
        // Network scan (1016+ port requests) requires explicit user action via "Scan All" button.
        this._initSubnetsOnly();
        this._doRender();
      });
      return;
    }

    const now = Date.now();
    if (now - (this._lastRenderTime || 0) < 5000) {
      if (!this._renderScheduled) {
        this._renderScheduled = true;
        setTimeout(() => {
          this._renderScheduled = false;
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
    if (this._scanInProgress) return;
    this._scanInProgress = true;
    this._scanResults = {};

    try {
      for (const subnet of this._subnets) {
        await this._scanSubnet(subnet);
      }
    } catch (e) {
      console.warn('[ha-network-map] scan error:', e);
    }

    this._lastScanTime = Date.now();
    this._persistScanResults();
    this._buildDeviceList();
    this._scanInProgress = false;
    this._scanProgress = { current: 0, total: 0 };
    this._doRender();
  }

  async _scanSubnet(subnet) {
    const ips = [];
    for (let i = 1; i <= 254; i++) {
      ips.push(subnet + '.' + i);
    }

    // Batch scan with timeout
    const batchSize = 40;
    const timeout = 2000;
    const ports = [80, 443, 8080, 8123];

    for (let b = 0; b < ips.length; b += batchSize) {
      const batch = ips.slice(b, b + batchSize);
      const promises = batch.map(ip =>
        Promise.race([
          this._pingIp(ip, ports),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeout))
        ]).catch(() => false)
      );

      const results = await Promise.all(promises);
      results.forEach((reachable, idx) => {
        this._scanResults[batch[idx]] = reachable;
        this._scanProgress.current++;
        this._scanProgress.total = ips.length;
        this._doRender();
      });
    }
  }

  async _pingIp(ip, ports) {
    // Try to fetch from multiple ports to detect reachability
    for (const port of ports) {
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 500);
        const res = await fetch('http://' + ip + ':' + port + '/', {
          method: 'HEAD',
          signal: ctrl.signal,
          mode: 'no-cors'
        });
        clearTimeout(timeoutId);
        return true;
      } catch (e) { console.debug('[ha-network-map] caught:', e); }
    }
    return false;
  }

  _persistScanResults() {
    try {
      const data = { results: this._scanResults, time: this._lastScanTime };
      localStorage.setItem('ha-tools-net-scan', JSON.stringify(data));
    } catch (e) { console.debug('[ha-network-map] caught:', e); }
  }
  _loadCachedScanResults() {
    try {
      const stored = localStorage.getItem('ha-tools-net-scan');
      if (!stored) return;
      const data = JSON.parse(stored);
      if (data && Array.isArray(data.results)) {
        this._scanResults = data.results;
        this._lastScanTime = data.time || 0;
      }
    } catch (e) { console.debug('[ha-network-map] caught:', e); }
  }

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

    // Get device registry info for enrichment
    const regInfo = this._getRegistryInfo();

    // Get all device_tracker entities from HA
    if (this._hass?.states) {
      Object.values(this._hass.states).forEach(entity => {
        if (!entity.entity_id || !entity.entity_id.startsWith('device_tracker.')) return;
        const a = entity.attributes || {};
        const name = a.friendly_name || entity.entity_id.split('.')[1];
        const nameLow = name.toLowerCase();
        const reg = regInfo[nameLow] || {};
        const ip = a.ip_address || a.ip || a.local_ip || a.host_ip || reg.ip || null;
        const mac = a.mac_address || a.mac || a.host_mac || reg.mac || null;
        const manufacturer = a.manufacturer || reg.manufacturer || null;
        const model = a.model || reg.model || null;

        // Deduplicate by IP (if has one) or entity_id
        const dedupeKey = ip || entity.entity_id;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        if (ip) seen.add(ip); // also mark IP as seen for scan merge

        const bindKey = ip || entity.entity_id;
        const isReachable = ip ? (this._scanResults[ip] === true) : null;

        this.devices.push({
          ip, mac, manufacturer, model, name,
          category: this._cat(name, { manufacturer, model }),
          icon: this._icon(name, { manufacturer, model }),
          reachable: isReachable,
          entity_id: entity.entity_id,
          state: entity.state,
          source_type: a.source_type || null,
          lastSeen: a.last_seen || new Date().toISOString(),
          binding: this._bindings[bindKey] || null
        });
      });
    }

    // Add discovered devices from scan not in HA
    Object.entries(this._scanResults).forEach(([ip, reachable]) => {
      if (reachable && !seen.has(ip)) {
        seen.add(ip);
        this.devices.push({
          ip, mac: null, manufacturer: null, model: null, name: ip,
          category: this._lang === 'pl' ? 'Odkryte' : 'Discovered',
          icon: '📡', reachable: true, entity_id: null,
          lastSeen: new Date().toISOString(),
          binding: this._bindings[ip] || null
        });
      }
    });

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
    this._currentPage = 1;
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
        case 'subnets': content = this._renderSubnetsTab(); break;
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
      '<button class="tab-btn ' + (this.activeTab === 'subnets' ? 'active' : '') + '" data-tab="subnets">' + this._t('subnetsTab') + '</button>' +
      '<button class="tab-btn ' + (this.activeTab === 'bindings' ? 'active' : '') + '" data-tab="bindings">' + this._t('bindingsTab') + '</button>' +
      '</div>' +
      content +
      '</div>';

    if (this._lastHtml === html) return;
    this._lastHtml = html;
    this.shadowRoot.innerHTML = html;
    this._bindEvents();
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
      return h + '<div class="es">' + this._t('noDevicesFound') + '</div>';
    }

    if (this.selectedDevice) {
      h += this._renderDeviceDetail(this.selectedDevice);
    }

    const catOpts = cats.map(c => '<option value="' + c + '"' + (this._catFilter === c ? ' selected' : '') + '>' + c + '</option>').join('');
    h += '<div class="toolbar"><input type="text" class="si" id="sI" placeholder="' + this._t('searchPlaceholder') + '" value="' + (this.searchQuery || '') + '">' +
      '<select class="fs" id="cF"><option value="all">' + this._t('allCategories') + '</option>' + catOpts + '</select></div>';

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
      [this._t('status'), d.reachable ? this._t('reachableStatus') : this._t('unreachableStatus')],
      [this._t('ipAddress'), _esc(d.ip || '—')],
      [this._t('macAddress'), _esc(d.mac || '—')]
    ];
    if (d.manufacturer) rows.push([this._t('manufacturer'), _esc(d.manufacturer + (d.model ? ' ' + d.model : ''))]);
    if (d.entity_id) rows.push(['Entity', _esc(d.entity_id)]);

    const rh = rows.map(r => '<div class="dr"><span class="dl">' + r[0] + '</span><span class="dv">' + r[1] + '</span></div>').join('');
    const bindHtml = d.reachable ? '<button class="rb" id="bindBtn" data-ip="' + _esc(d.ip || d.name) + '">🔗 ' + this._t('bind') + '</button>' : '';

    return '<div class="dd" id="dD"><button class="dc" id="cD">✕ ' + this._t('close') + '</button><div style="clear:both"></div>' +
      rh + '<div style="margin-top:12px">' + bindHtml + '</div></div>';
  }

  _renderTopologyTab() {
    if (!this.devices.length) {
      return '<div class="es">' + this._t('noDevicesFound') + '</div>';
    }

    // Simple SVG topology
    const w = 800, h = 400;
    const centerX = w / 2, centerY = h / 2;
    const radius = 120;

    // Router at center
    const nodes = [{ ip: this._routerIp, name: this._t('router'), reachable: true, isRouter: true, x: centerX, y: centerY }];

    // Arrange devices in circle
    this.devices.forEach((d, i) => {
      const angle = (i / this.devices.length) * Math.PI * 2;
      nodes.push({
        ip: d.ip,
        name: d.name,
        reachable: d.reachable,
        isRouter: false,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    });

    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:400px;border:1px solid var(--bento-border);border-radius:var(--bento-radius-sm)">';

    // Lines from router to devices
    nodes.slice(1).forEach(n => {
      svg += '<line x1="' + nodes[0].x + '" y1="' + nodes[0].y + '" x2="' + n.x + '" y2="' + n.y + '" stroke="var(--bento-border)" stroke-width="2"/>';
    });

    // Nodes
    nodes.forEach(n => {
      const color = n.reachable ? '#10B981' : '#94A3B8';
      svg += '<circle cx="' + n.x + '" cy="' + n.y + '" r="24" fill="' + color + '" opacity="0.2" stroke="' + color + '" stroke-width="2"/>' +
        '<text x="' + n.x + '" y="' + (n.y + 28) + '" text-anchor="middle" font-size="11" fill="var(--bento-text)" font-family="Inter,sans-serif">' +
        _esc(String(n.name || '').substring(0, 10)) + '</text>';
    });

    svg += '</svg>';
    return svg;
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
        this._filterSort();
        this._doRender();
      });
    }

    const cF = this.shadowRoot.querySelector('#cF');
    if (cF) {
      cF.addEventListener('change', (e) => {
        this._catFilter = e.target.value === 'all' ? null : e.target.value;
        this._filterSort();
        this._doRender();
      });
    }

    this.shadowRoot.querySelectorAll('th[data-s]').forEach(th => {
      th.addEventListener('click', () => {
        const s = th.dataset.s;
        if (this.sortBy === s) this.sortDesc = !this.sortDesc;
        else { this.sortBy = s; this.sortDesc = false; }
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
    return '<style>' + (window.HAToolsBentoCSS || '') + '\n' +
    '* { box-sizing: border-box; }' +
    ':host { --bp: var(--bento-primary); --bs: var(--bento-success); --be: var(--bento-error); ' +
    '--bbg: var(--bento-bg); --bcard: var(--bento-card); --btxt: var(--bento-text); ' +
    '--btxt2: var(--bento-text-secondary); --brmd: var(--bento-radius-md); ' +
    'font-family: Inter, -apple-system, sans-serif; }' +
    '.card { background: var(--bento-card); border: 1px solid var(--bento-border); ' +

    '@media (prefers-color-scheme: dark) { :host { --bento-bg: var(--primary-background-color, #1a1a2e); --bento-card: var(--card-background-color, #16213e); --bento-text: var(--primary-text-color, #e2e8f0); --bento-text-secondary: var(--secondary-text-color, #94a3b8); --bento-border: var(--divider-color, #334155); --bento-shadow-sm: 0 1px 3px rgba(0,0,0,0.3); } }' +    'border-radius: var(--bento-radius-md); box-shadow: var(--bento-shadow-sm); ' +
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
      
        <!-- Support / Donation -->
        <div class="donate-section" data-source="ha-tools-split">
          <div class="donate-text">
            <h3>❤️ ${this._lang === 'pl' ? 'Wesprzyj rozwój HA Tools' : 'Support HA Tools Development'}</h3>
            <p>${this._lang === 'pl' ? 'Jeśli to narzędzie ułatwia Ci życie z Home Assistant, rozważ wsparcie projektu. Każda kawa motywuje do dalszego rozwoju!' : 'If this tool makes your Home Assistant life easier, consider supporting the project. Every coffee motivates further development!'}</p>
          </div>
          <div class="donate-buttons">
            <a class="donate-btn coffee" href="https://buymeacoffee.com/macsiem" target="_blank" rel="noopener noreferrer">☕ Buy Me a Coffee</a>
            <a class="donate-btn paypal" href="https://www.paypal.com/donate/?hosted_button_id=Y967H4PLRBN8W" target="_blank" rel="noopener noreferrer">💳 PayPal</a>
          </div>
        </div>
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
