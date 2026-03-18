class HaNetworkMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // --- Throttle fields ---
    this._lastRenderTime = 0;
    this._renderScheduled = false;
    this._firstHassRender = false;
    // --- Pagination ---
    this._currentPage = {};
    this._pageSize = 15;
    this.devices = [];
    this.filteredDevices = [];
    this.selectedDevice = null;
    this.activeTab = 'list';
    this.searchQuery = '';
    this.sortBy = 'name';
    this.sortDesc = false;
    // --- Chart.js instances ---
    this.chartInstances = {};
    this.chartJsLoaded = false;
  }

  static get _translations() {
    return {
      en: {
        listTab: 'List',
        mapTab: 'Map',
        statsTab: 'Stats',
        searchPlaceholder: 'Search devices...',
        deviceName: 'Device Name',
        category: 'Category',
        status: 'Status',
        ipAddress: 'IP Address',
        macAddress: 'MAC Address',
        lastSeen: 'Last Seen',
        noDevicesFound: 'No devices found. Add device_tracker entities to Home Assistant.',
        phone: 'Phone',
        tablet: 'Tablet',
        computer: 'Computer',
        media: 'Media',
        smartHome: 'Smart Home',
        wearable: 'Wearable',
        other: 'Other',
        home: 'HOME',
        away: 'AWAY',
        unknown: 'UNKNOWN',
        offline: 'OFFLINE',
        zone: 'ZONE',
        totalDevices: 'Total Devices',
        online: 'Online',
        offline: 'Offline',
        newToday: 'New Today',
        noBandwidthSensors: 'No bandwidth sensors found.',
        deviceDetail: 'Device:',
        categoryDetail: 'Category:',
        statusDetail: 'Status:',
        ipDetail: 'IP:',
        macDetail: 'MAC:',
        lastSeenDetail: 'Last Seen:',
        router: 'Router',
        devicesByStatus: 'Devices by Status',
        devicesByCategory: 'Devices by Category',
        bandwidthUsage: 'Bandwidth Usage',
      },
      pl: {
        listTab: 'Lista',
        mapTab: 'Mapa',
        statsTab: 'Statystyki',
        searchPlaceholder: 'Szukaj urządzeń...',
        deviceName: 'Nazwa urządzenia',
        category: 'Kategoria',
        status: 'Stan',
        ipAddress: 'Adres IP',
        macAddress: 'Adres MAC',
        lastSeen: 'Ostatnio widoczne',
        noDevicesFound: 'Nie znaleziono urządzeń. Dodaj encje device_tracker do Home Assistant.',
        phone: 'Telefon',
        tablet: 'Tablet',
        computer: 'Komputer',
        media: 'Media',
        smartHome: 'Inteligentny dom',
        wearable: 'Urządzenie do noszenia',
        other: 'Inne',
        home: 'W DOMU',
        away: 'POZA DOMEM',
        unknown: 'NIEZNANY',
        offline: 'NIEDOSTĘPNY',
        zone: 'STREFA',
        totalDevices: 'Razem urządzeń',
        online: 'Online',
        offline: 'Offline',
        newToday: 'Nowe dzisiaj',
        noBandwidthSensors: 'Nie znaleziono czujników przepustowości.',
        deviceDetail: 'Urządzenie:',
        categoryDetail: 'Kategoria:',
        statusDetail: 'Stan:',
        ipDetail: 'IP:',
        macDetail: 'MAC:',
        lastSeenDetail: 'Ostatnio widoczne:',
        router: 'Router',
        devicesByStatus: 'Urządzenia wg stanu',
        devicesByCategory: 'Urządzenia wg kategorii',
        bandwidthUsage: 'Użycie przepustowości',
      }
    };
  }

  _t(key) {
    const lang = this._hass?.language || 'en';
    const T = HaNetworkMap._translations;
    return (T[lang] || T['en'])[key] || T['en'][key] || key;
  }

  setConfig(config) {
    this.config = config;
    this.title = config.title || 'Network Map';
    this.routerEntity = config.router_entity || 'device_tracker.router';
  }

  set hass(hass) {
    this._hass = hass;
    if (!hass) return;
    const now = Date.now();
    if (!this._firstHassRender) {
      this._firstHassRender = true;
      this._loadChartJS().then(() => {
        this.updateDevices();
        this.render();
        this._lastRenderTime = now;
      });
      return;
    }
    if (now - (this._lastRenderTime || 0) < 5000) {
      if (!this._renderScheduled) {
        this._renderScheduled = true;
        setTimeout(() => {
          this._renderScheduled = false;
          this.updateDevices();
          this.render();
          this._lastRenderTime = Date.now();
        }, 5000 - (now - (this._lastRenderTime || 0)));
      }
      return;
    }
    this.updateDevices();
    this.render();
    this._lastRenderTime = now;
  }

  _loadChartJS() {
    return new Promise((resolve) => {
      if (window.Chart) {
        this.chartJsLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
      script.async = true;
      script.onload = () => {
        this.chartJsLoaded = true;
        resolve();
      };
      script.onerror = () => {
        console.warn('Failed to load Chart.js from CDN');
        this.chartJsLoaded = false;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  updateDevices() {
    const states = this._hass.states;
    this.devices = [];

    Object.keys(states).forEach(entityId => {
      if (entityId.startsWith('device_tracker.')) {
        const state = states[entityId];
        const attr = state.attributes || {};
        const friendlyName = attr.friendly_name || entityId.replace('device_tracker.', '');
        const rawState = (state.state || '').toLowerCase();

        // Map HA device_tracker states properly
        let status;
        if (rawState === 'home') status = 'home';
        else if (rawState === 'not_home' || rawState === 'away') status = 'away';
        else if (rawState === 'unavailable') status = 'offline';
        else if (rawState === 'unknown') status = 'unknown';
        else status = 'zone'; // Named zone (e.g., "work", "school", custom zone)

        // IP: try multiple attribute names (different integrations use different keys)
        const ip = attr.ip || attr.ip_address || attr.local_ip || attr.host_ip || null;
        // MAC: try multiple attribute names
        const mac = attr.mac || attr.mac_address || attr.host_mac || null;
        // Battery
        const battery = attr.battery_level || attr.battery || null;
        // GPS
        const hasGps = attr.latitude !== undefined && attr.longitude !== undefined;
        // WiFi / Network info
        const ssid = attr.essid || attr.ssid || attr.wifi_name || attr.ap || null;
        const rssi = attr.rssi || attr.signal_strength || attr.wifi_signal || null;
        const connectionType = attr.connection_type || attr.network_type || (attr.is_wired ? 'ethernet' : (ssid ? 'wifi' : null));
        const speed = attr.link_speed || attr.connection_speed || null;
        const uptime = attr.uptime || attr.connected_since || null;

        const device = {
          id: entityId,
          name: friendlyName,
          status: status,
          rawState: state.state, // Keep original for display (zone names etc.)
          ip: ip || (attr.source_type === 'router' ? 'DHCP' : ''),
          mac: mac || '',
          sourceType: attr.source_type || 'unknown',
          hostName: attr.host_name || friendlyName,
          lastSeen: state.last_changed || state.last_updated || new Date().toISOString(),
          icon: this.getCategoryIcon(friendlyName),
          category: this.categorizeDevice(friendlyName),
          battery: battery,
          hasGps: hasGps,
          gpsAccuracy: attr.gps_accuracy || null,
          ssid: ssid,
          rssi: rssi,
          connectionType: connectionType,
          speed: speed,
          uptime: uptime,
          attributes: attr
        };
        this.devices.push(device);
      }
    });

    this.filterAndSort();
  }

  categorizeDevice(name) {
    const lower = name.toLowerCase();
    if (/phone|iphone|android|mobile/.test(lower)) return 'Phone';
    if (/tablet|ipad/.test(lower)) return 'Tablet';
    if (/computer|laptop|pc|mac|desktop/.test(lower)) return 'Computer';
    if (/tv|media|kodi|plex/.test(lower)) return 'Media';
    if (/switch|light|sensor|camera|doorbell/.test(lower)) return 'Smart Home';
    if (/watch|wearable|band/.test(lower)) return 'Wearable';
    return 'Other';
  }

  getCategoryIcon(name) {
    const category = this.categorizeDevice(name);
    const icons = {
      'Phone': '📱',
      'Tablet': '📲',
      'Computer': '💻',
      'Media': '📺',
      'Smart Home': '🏠',
      'Wearable': '⌚',
      'Other': '📡'
    };
    return icons[category] || '📡';
  }

  filterAndSort() {
    this.filteredDevices = this.devices.filter(d =>
      d.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(this.searchQuery.toLowerCase())
    );

    this.filteredDevices.sort((a, b) => {
      let aVal, bVal;

      switch (this.sortBy) {
        case 'status':
          const statusOrder = { home: 0, zone: 1, away: 2, unknown: 3, offline: 4 };
          aVal = statusOrder[a.status] !== undefined ? statusOrder[a.status] : 5;
          bVal = statusOrder[b.status] !== undefined ? statusOrder[b.status] : 5;
          break;
        case 'category':
          aVal = a.category;
          bVal = b.category;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }

      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this.sortDesc ? -result : result;
    });
  }

  render() {
    const styles = `
      <style>
/* ===== BENTO LIGHT MODE DESIGN SYSTEM ===== */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:host {
  --bento-primary: #3B82F6;
  --bento-primary-hover: #2563EB;
  --bento-primary-light: rgba(59, 130, 246, 0.08);
  --bento-success: #10B981;
  --bento-success-light: rgba(16, 185, 129, 0.08);
  --bento-error: #EF4444;
  --bento-error-light: rgba(239, 68, 68, 0.08);
  --bento-warning: #F59E0B;
  --bento-warning-light: rgba(245, 158, 11, 0.08);
  --bento-bg: #F8FAFC;
  --bento-card: #FFFFFF;
  --bento-border: #E2E8F0;
  --bento-text: #1E293B;
  --bento-text-secondary: #64748B;
  --bento-text-muted: #94A3B8;
  --bento-radius-xs: 6px;
  --bento-radius-sm: 10px;
  --bento-radius-md: 16px;
  --bento-shadow-sm: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
  --bento-shadow-md: 0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
  --bento-shadow-lg: 0 8px 25px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.04);
  --bento-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Card */
.card, .ha-card, ha-card, .main-card, .exporter-card, .security-card, .reports-card, .storage-card, .chore-card, .cry-card, .backup-card, .network-card, .sentence-card, .energy-card, .panel-card {
  background: var(--bento-card) !important;
  border: 1px solid var(--bento-border) !important;
  border-radius: var(--bento-radius-md) !important;
  box-shadow: var(--bento-shadow-sm) !important;
  font-family: 'Inter', sans-serif !important;
  color: var(--bento-text) !important;
  overflow: hidden;
}

/* Headers */
.card-header, .header, .card-title, h1, h2, h3 {
  color: var(--bento-text) !important;
  font-family: 'Inter', sans-serif !important;
}
.card-header, .header {
  border-bottom: 1px solid var(--bento-border) !important;
  padding-bottom: 12px !important;
  margin-bottom: 16px !important;
}

/* Tabs */
.tabs, .tab-bar, .tab-nav, .tab-header {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--bento-border);
  padding: 0 4px;
  margin-bottom: 20px;
  overflow-x: auto;
}
.tab, .tab-btn, .tab-button {
  padding: 10px 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  color: var(--bento-text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: var(--bento-transition);
  white-space: nowrap;
  border-radius: 0;
}
.tab:hover, .tab-btn:hover, .tab-button:hover {
  color: var(--bento-primary);
  background: var(--bento-primary-light);
}
.tab.active, .tab-btn.active, .tab-button.active {
  color: var(--bento-primary);
  border-bottom-color: var(--bento-primary);
  background: rgba(59, 130, 246, 0.04);
  font-weight: 600;
}

/* Tab content */
.tab-content { display: none; }
.tab-content.active { display: block; animation: bentoFadeIn 0.3s ease-out; }
@keyframes bentoFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* Buttons */
button, .btn, .action-btn {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--bento-radius-xs);
  transition: var(--bento-transition);
  cursor: pointer;
}
button.active, .btn.active, .btn-primary, .action-btn.active {
  background: var(--bento-primary) !important;
  color: white !important;
  border-color: var(--bento-primary) !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

/* Status badges */
.badge, .status-badge, .tag, .chip {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge-success, .status-ok, .status-good { background: var(--bento-success-light); color: var(--bento-success); }
.badge-error, .status-error, .status-critical { background: var(--bento-error-light); color: var(--bento-error); }
.badge-warning, .status-warning { background: var(--bento-warning-light); color: var(--bento-warning); }
.badge-info, .status-info { background: var(--bento-primary-light); color: var(--bento-primary); }

/* Tables */
table { width: 100%; border-collapse: separate; border-spacing: 0; font-family: 'Inter', sans-serif; }
th { background: var(--bento-bg); color: var(--bento-text-secondary); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: left; border-bottom: 2px solid var(--bento-border); }
td { padding: 12px 14px; border-bottom: 1px solid var(--bento-border); color: var(--bento-text); font-size: 13px; }
tr:hover td { background: var(--bento-primary-light); }
tr:last-child td { border-bottom: none; }

/* Inputs & selects */
input, select, textarea {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  padding: 8px 12px;
  border: 1.5px solid var(--bento-border);
  border-radius: var(--bento-radius-xs);
  background: var(--bento-card);
  color: var(--bento-text);
  transition: var(--bento-transition);
  outline: none;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--bento-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Stat cards */
.stat-card, .stat, .metric-card, .stat-box, .overview-stat, .kpi-card {
  background: var(--bento-card);
  border: 1px solid var(--bento-border);
  border-radius: var(--bento-radius-sm);
  padding: 16px;
  transition: var(--bento-transition);
}
.stat-card:hover, .stat:hover, .metric-card:hover { box-shadow: var(--bento-shadow-md); transform: translateY(-1px); }
.stat-value, .metric-value, .stat-number { font-size: 28px; font-weight: 700; color: var(--bento-text); font-family: 'Inter', sans-serif; }
.stat-label, .metric-label, .stat-title { font-size: 12px; font-weight: 500; color: var(--bento-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

/* Canvas override (prevent Bento CSS from distorting charts) */
canvas {
  max-width: 100% !important;
  height: auto !important;
  width: auto !important;
  border: none !important;
}

/* Pagination */
.pagination, .pag {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 16px 0;
  border-top: 1px solid var(--bento-border);
}
.pagination-btn, .pag-btn {
  padding: 8px 14px;
  border: 1.5px solid var(--bento-border);
  background: var(--bento-card);
  color: var(--bento-text);
  border-radius: var(--bento-radius-xs);
  cursor: pointer;
  font-size: 13px;
  font-weight: 5;
  font-family: 'Inter', sans-serif;
  transition: var(--bento-transition);
}
.pagination-btn:hover:not(:disabled), .pag-btn:hover:not(:disabled) { background: var(--bento-primary); color: white; border-color: var(--bento-primary); }
.pagination-btn:disabled, .pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination-info, .pag-info { font-size: 13px; color: var(--bento-text-secondary); font-weight: 500; padding: 0 8px; }
.page-size-select { padding: 6px 10px; border: 1.5px solid var(--bento-border); border-radius: var(--bento-radius-xs); font-size: 12px; font-family: 'Inter', sans-serif; }

/* Empty state */
.empty-state, .no-data, .no-results {
  text-align: center;
  padding: 48px 24px;
  color: var(--bento-text-secondary);
  font-size: 14px;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bento-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--bento-text-muted); }

/* ===== END BENTO LIGHT MODE ===== */

        :host {
          --primary-color: var(--ha-color-primary, #03a9f4);
          --success-color: #4caf50;
          --warning-color: #ff9800;
          --danger-color: #f44336;
          --text-primary: var(--primary-text-color, #212121);
          --text-secondary: var(--secondary-text-color, #727272);
          --bg-primary: var(--card-background-color, #ffffff);
          --bg-secondary: var(--secondary-background-color, #f5f5f5);
          --border-color: var(--divider-color, #e0e0e0);
        }

        .card-container {
          background: var(--bg-primary);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 16px;
          font-family: var(--primary-font-family, Roboto, sans-serif);
          color: var(--text-primary);
        }

        .card-header {
          font-size: 24px;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid var(--border-color);
          margin-bottom: 16px;
          gap: 8px;
        }

        .tab-btn {
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        .search-bar {
          margin-bottom: 16px;
          display: flex;
          gap: 8px;
        }

        .search-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 14px;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .search-input::placeholder {
          color: var(--text-secondary);
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .table thead {
          background: var(--bg-secondary);
          border-bottom: 2px solid var(--border-color);
        }

        .table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }

        .table th:hover {
          background: var(--border-color);
        }

        .sort-indicator {
          display: inline-block;
          margin-left: 4px;
          font-size: 11px;
        }

        .table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .table tbody tr:hover {
          background: var(--bg-secondary);
          cursor: pointer;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-home {
          background: #c8e6c9;
          color: #1b5e20;
        }

        .status-away {
          background: #ffccbc;
          color: #bf360c;
        }

        .status-unknown {
          background: #eeeeee;
          color: #424242;
        }

        .status-offline {
          background: #ffcdd2;
          color: #b71c1c;
        }

        .status-zone {
          background: #bbdefb;
          color: #0d47a1;
        }

        .device-icon {
          font-size: 18px;
          margin-right: 6px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid var(--primary-color);
        }

        .stat-card.online {
          border-left-color: var(--success-color);
        }

        .stat-card.offline {
          border-left-color: var(--danger-color);
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .canvas-container {
          margin: 20px 0;
          text-align: center;
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 16px;
        }

        .canvas-container canvas {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }

        .chart-container {
          position: relative;
          margin: 20px 0;
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 16px;
          min-height: 300px;
        }

        .chart-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
          text-align: center;
        }

        .device-detail {
          background: var(--bg-secondary);
          padding: 12px;
          border-radius: 6px;
          margin-top: 12px;
          font-size: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .detail-value {
          color: var(--text-primary);
          word-break: break-all;
        }

        .bandwidth-bar {
          margin: 12px 0;
        }

        .bandwidth-label {
          font-size: 12px;
          margin-bottom: 4px;
          color: var(--text-secondary);
        }

        .bandwidth-bar-bg {
          height: 6px;
          background: var(--border-color);
          border-radius: 3px;
          overflow: hidden;
        }

        .bandwidth-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-color), var(--warning-color));
          border-radius: 3px;
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          color: var(--text-secondary);
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .device-list { grid-template-columns: 1fr !important; }
          .topology-container { min-height: 300px; }
          .detail-panel { width: 100% !important; position: relative !important; }
          .header { flex-direction: column; gap: 8px; }
          .filter-bar { flex-wrap: wrap; }
          .filter-bar select, .filter-bar input { font-size: 12px; min-width: 0; }
          table { font-size: 12px; }
          td, th { padding: 6px 8px; word-break: break-all; }
          .card { padding: 12px; }
          .chart-container { min-height: 250px; }
        }
        @media (max-width: 480px) {
          .device-list { gap: 8px; }
          .tab { font-size: 11px; padding: 5px 8px; }
          canvas { max-width: 100%; }
          .chart-container { min-height: 200px; }
        }
      </style>
    `;

    const content = this.getActiveTabContent();

    this.shadowRoot.innerHTML = styles + `
      <div class="card-container">
        <div class="card-header">${this.title}</div>
        <div class="tabs">
          <button class="tab-btn ${this.activeTab === 'list' ? 'active' : ''}\" data-tab=\"list\">${this._t('listTab')}</button>
          <button class="tab-btn ${this.activeTab === 'map' ? 'active' : ''}\" data-tab=\"map\">${this._t('mapTab')}</button>
          <button class="tab-btn ${this.activeTab === 'stats' ? 'active' : ''}\" data-tab=\"stats\">${this._t('statsTab')}</button>
        </div>
        ${content}
      </div>
    `;

    this.attachEventListeners();
  }

  getActiveTabContent() {
    switch (this.activeTab) {
      case 'list':
        return this.renderListTab();
      case 'map':
        return this.renderMapTab();
      case 'stats':
        return this.renderStatsTab();
      default:
        return '';
    }
  }

  renderListTab() {
    if (this.devices.length === 0) {
      return `<div class=\"empty-state\">${this._t('noDevicesFound')}</div>`;
    }

    const rows = this.filteredDevices.map((device, idx) => {
      const ipDisplay = device.ip || (device.hasGps ? '📍 GPS' : '—');
      const macDisplay = device.mac || (device.battery !== null ? `🔋 ${device.battery}%` : '—');
      const statusLabel = device.status === 'zone' ? device.rawState : this._t(device.status);
      return `
      <tr data-device-id=\"${device.id}\" data-index=\"${idx}\">
        <td><span class=\"device-icon\">${device.icon}</span>${device.name}</td>
        <td>${device.category}</td>
        <td><span class=\"status-badge status-${device.status}\">${statusLabel}</span></td>
        <td>${ipDisplay}</td>
        <td>${macDisplay}</td>
        <td>${new Date(device.lastSeen).toLocaleString()}</td>
      </tr>`;
    }).join('');

    return `
      <div class=\"search-bar\">
        <input type=\"text\" class=\"search-input\" id=\"searchInput\" placeholder=\"${this._t('searchPlaceholder')}\">
      </div>
      <table class=\"table\">
        <thead>
          <tr>
            <th data-sort=\"name\">${this._t('deviceName')} <span class=\"sort-indicator\" id=\"sort-name\"></span></th>
            <th data-sort=\"category\">${this._t('category')} <span class=\"sort-indicator\" id=\"sort-category\"></span></th>
            <th data-sort=\"status\">${this._t('status')} <span class=\"sort-indicator\" id=\"sort-status\"></span></th>
            <th>${this._t('ipAddress')}</th>
            <th>${this._t('macAddress')}</th>
            <th>${this._t('lastSeen')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  renderMapTab() {
    if (this.devices.length === 0) {
      return `<div class=\"empty-state\">${this._t('noDevicesFound')}</div>`;
    }

    return `
      <div class=\"canvas-container\">
        <canvas id=\"networkCanvas\" width=\"700\" height=\"700\"></canvas>
      </div>
      <div id=\"deviceDetail\"></div>
    `;
  }

  renderStatsTab() {
    const totalDevices = this.devices.length;
    const onlineDevices = this.devices.filter(d => d.status === 'home' || d.status === 'zone').length;
    const offlineDevices = this.devices.filter(d => d.status === 'away' || d.status === 'offline' || d.status === 'unknown').length;
    const todayNew = this.devices.filter(d => {
      const lastSeen = new Date(d.lastSeen);
      const today = new Date();
      return lastSeen.toDateString() === today.toDateString();
    }).length;

    const bandwidthContent = this.getBandwidthContent();
    const chartsContent = this.chartJsLoaded ? this.getChartsContent() : '';

    return `
      <div class=\"stats-grid\">
        <div class=\"stat-card\">
          <div class=\"stat-value\">${totalDevices}</div>
          <div class=\"stat-label\">${this._t('totalDevices')}</div>
        </div>
        <div class=\"stat-card online\">
          <div class=\"stat-value\">${onlineDevices}</div>
          <div class=\"stat-label\">${this._t('online')}</div>
        </div>
        <div class=\"stat-card offline\">
          <div class=\"stat-value\">${offlineDevices}</div>
          <div class=\"stat-label\">${this._t('offline')}</div>
        </div>
        <div class=\"stat-card\">
          <div class=\"stat-value\">${todayNew}</div>
          <div class=\"stat-label\">${this._t('newToday')}</div>
        </div>
      </div>
      ${chartsContent}
      ${bandwidthContent}
    `;
  }

  getChartsContent() {
    // Status distribution chart
    const statusCounts = {
      home: this.devices.filter(d => d.status === 'home').length,
      zone: this.devices.filter(d => d.status === 'zone').length,
      away: this.devices.filter(d => d.status === 'away').length,
      unknown: this.devices.filter(d => d.status === 'unknown').length,
      offline: this.devices.filter(d => d.status === 'offline').length
    };

    // Category distribution chart
    const categoryCounts = {};
    this.devices.forEach(d => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });

    return `
      <div class=\"chart-container\">
        <div class=\"chart-title\">${this._t('devicesByStatus')}</div>
        <canvas id=\"statusChart\" width=\"400\" height=\"200\"></canvas>
      </div>
      <div class=\"chart-container\">
        <div class=\"chart-title\">${this._t('devicesByCategory')}</div>
        <canvas id=\"categoryChart\" width=\"400\" height=\"200\"></canvas>
      </div>
    `;
  }

  getBandwidthContent() {
    const states = this._hass.states;
    let bandwidthHtml = '';

    Object.keys(states).forEach(entityId => {
      if (/_download|_upload/.test(entityId) && states[entityId].state !== 'unavailable') {
        const value = parseFloat(states[entityId].state) || 0;
        const unit = states[entityId].attributes.unit_of_measurement || 'Mbps';
        const name = states[entityId].attributes.friendly_name || entityId;
        const maxValue = unit.includes('Mb') ? 100 : unit.includes('KB') ? 10000 : 100;
        const percentage = Math.min((value / maxValue) * 100, 100);

        bandwidthHtml += `
          <div class=\"bandwidth-bar\">
            <div class=\"bandwidth-label\">${name}: ${value.toFixed(2)} ${unit}</div>
            <div class=\"bandwidth-bar-bg\">
              <div class=\"bandwidth-bar-fill\" style=\"width: ${percentage}%\"></div>
            </div>
          </div>
        `;
      }
    });

    return bandwidthHtml || `<div class=\"empty-state\" style=\"padding: 16px;\">${this._t('noBandwidthSensors')}</div>`;
  }

  _drawNetworkMap(canvas) {
    this._fixCanvasSize(canvas);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card-background-color') || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Router node - improved drawing
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Router label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._t('router'), centerX, centerY);

    // Group and sort: home first, then zone, away, unknown, offline
    const statusPriority = { home: 0, zone: 1, away: 2, unknown: 3, offline: 4 };
    const sorted = [...this.devices].sort((a, b) => (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5));
    const maxDevices = Math.min(sorted.length, 24);
    const allDisplayed = sorted.slice(0, maxDevices);

    // Adjust radius based on device count
    const dynamicRadius = maxDevices > 12 ? Math.min(canvas.width, canvas.height) * 0.38 : radius;

    const colorMap = { home: '#4caf50', zone: '#2196f3', away: '#ff9800', offline: '#f44336', unknown: '#9e9e9e' };

    allDisplayed.forEach((device, index) => {
      const angle = (index / allDisplayed.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * dynamicRadius;
      const y = centerY + Math.sin(angle) * dynamicRadius;

      // Connection line - improved
      const color = colorMap[device.status] || '#9e9e9e';
      ctx.strokeStyle = color + '55';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Device dot - improved
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();

      // Device dot border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Label (truncated)
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-text-color') || '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = device.name.length > 12 ? device.name.substring(0, 10) + '…' : device.name;
      ctx.fillText(label, x, y + 14);

      device.canvasX = x;
      device.canvasY = y;
      device.canvasRadius = 9;
    });

    // Orbit circle - improved
    ctx.strokeStyle = (getComputedStyle(document.documentElement).getPropertyValue('--divider-color') || '#ddd') + '88';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _initializeCharts() {
    if (!this.chartJsLoaded || !window.Chart) {
      return;
    }

    // Destroy existing charts
    Object.values(this.chartInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.chartInstances = {};

    const statusCounts = {
      home: this.devices.filter(d => d.status === 'home').length,
      zone: this.devices.filter(d => d.status === 'zone').length,
      away: this.devices.filter(d => d.status === 'away').length,
      unknown: this.devices.filter(d => d.status === 'unknown').length,
      offline: this.devices.filter(d => d.status === 'offline').length
    };

    const statusCanvas = this.shadowRoot.querySelector('#statusChart');
    if (statusCanvas) {
      this.chartInstances.status = new Chart(statusCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Home', 'Zone', 'Away', 'Unknown', 'Offline'],
          datasets: [{
            data: [
              statusCounts.home,
              statusCounts.zone,
              statusCounts.away,
              statusCounts.unknown,
              statusCounts.offline
            ],
            backgroundColor: [
              '#4caf50',
              '#2196f3',
              '#ff9800',
              '#9e9e9e',
              '#f44336'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: { size: 12 }
              }
            }
          }
        }
      });
    }

    // Category distribution
    const categoryCounts = {};
    this.devices.forEach(d => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });

    const categoryCanvas = this.shadowRoot.querySelector('#categoryChart');
    if (categoryCanvas) {
      const categoryColors = {
        'Phone': '#e91e63',
        'Tablet': '#9c27b0',
        'Computer': '#673ab7',
        'Media': '#3f51b5',
        'Smart Home': '#2196f3',
        'Wearable': '#00bcd4',
        'Other': '#009688'
      };

      this.chartInstances.category = new Chart(categoryCanvas, {
        type: 'bar',
        data: {
          labels: Object.keys(categoryCounts),
          datasets: [{
            label: 'Device Count',
            data: Object.values(categoryCounts),
            backgroundColor: Object.keys(categoryCounts).map(cat => categoryColors[cat] || '#757575'),
            borderColor: '#ffffff',
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
              grid: { color: 'rgba(0,0,0,0.05)' }
            }
          }
        }
      });
    }
  }

  attachEventListeners() {
    const tabs = this.shadowRoot.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeTab = e.target.dataset.tab;
        this.render();
        if (this.activeTab === 'map') {
          setTimeout(() => {
            const canvas = this.shadowRoot.querySelector('#networkCanvas');
            if (canvas) {
              this._drawNetworkMap(canvas);
              canvas.addEventListener('click', (evt) => this.handleCanvasClick(evt));
            }
          }, 0);
        } else if (this.activeTab === 'stats') {
          setTimeout(() => this._initializeCharts(), 100);
        }
      });
    });

    const searchInput = this.shadowRoot.querySelector('#searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.filterAndSort();
        this.render();
      });
    }

    const headers = this.shadowRoot.querySelectorAll('.table th[data-sort]');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const sortBy = header.dataset.sort;
        if (this.sortBy === sortBy) {
          this.sortDesc = !this.sortDesc;
        } else {
          this.sortBy = sortBy;
          this.sortDesc = false;
        }
        this.filterAndSort();
        this.render();
      });
    });

    const rows = this.shadowRoot.querySelectorAll('.table tbody tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.index);
        this.selectedDevice = this.filteredDevices[idx];
      });
    });

    if (this.activeTab === 'map') {
      setTimeout(() => {
        const canvas = this.shadowRoot.querySelector('#networkCanvas');
        if (canvas) {
          this._drawNetworkMap(canvas);
          canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        }
      }, 0);
    } else if (this.activeTab === 'stats') {
      setTimeout(() => this._initializeCharts(), 100);
    }
  }

  handleCanvasClick(e) {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const statusPriority = { home: 0, zone: 1, away: 2, unknown: 3, offline: 4 };
    const sorted = [...this.devices].sort((a, b) => (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5));
    const allDisplayed = sorted.slice(0, 24);

    allDisplayed.forEach(device => {
      if (device.canvasX && device.canvasY) {
        const dist = Math.sqrt(Math.pow(x - device.canvasX, 2) + Math.pow(y - device.canvasY, 2));
        if (dist <= device.canvasRadius + 5) {
          this.showDeviceDetail(device);
        }
      }
    });
  }

  showDeviceDetail(device) {
    const detailDiv = this.shadowRoot.querySelector('#deviceDetail');
    const lastSeenDate = new Date(device.lastSeen).toLocaleString();
    const ipDisplay = device.ip || (device.hasGps ? '📍 GPS tracker' : '—');
    const macDisplay = device.mac || '—';
    const statusLabel = device.status === 'zone' ? device.rawState : this._t(device.status);
    const extraRows = [];
    if (device.battery !== null) {
      extraRows.push(`<div class=\"detail-row\"><span class=\"detail-label\">🔋 Battery:</span><span class=\"detail-value\">${device.battery}%</span></div>`);
    }
    if (device.sourceType && device.sourceType !== 'unknown') {
      extraRows.push(`<div class=\"detail-row\"><span class=\"detail-label\">Source:</span><span class=\"detail-value\">${device.sourceType}</span></div>`);
    }
    if (device.ssid) {
      extraRows.push(`<div class=\"detail-row\"><span class=\"detail-label\">📶 WiFi:</span><span class=\"detail-value\">${device.ssid}</span></div>`);
    }
    if (device.rssi !== null && device.rssi !== undefined) {
      const signal = device.rssi > -50 ? 'Excellent' : device.rssi > -60 ? 'Good' : device.rssi > -70 ? 'Fair' : 'Weak';
      extraRows.push(`<div class=\"detail-row\"><span class=\"detail-label\">📡 Signal:</span><span class=\"detail-value\">${device.rssi} dBm (${signal})</span></div>`);
    }
    if (device.connectionType) {
      const connIcon = device.connectionType === 'ethernet' ? '🔌' : '📶';
      extraRows.push(`<div class=\"detail-row\"><span class=\"detail-label\">${connIcon} Connection:</span><span class=\"detail-value\">${device.connectionType}</span></div>`);
    }
    if (device.speed) {
      extraRows.push(`<div class=\"detail-row\"><span class=\"detail-label\">⚡ Speed:</span><span class=\"detail-value\">${device.speed} Mbps</span></div>`);
    }
    if (device.uptime) {
      extraRows.push(`<div class=\"detail-row\"><span class=\"detail-label\">⏱️ Uptime:</span><span class=\"detail-value\">${device.uptime}</span></div>`);
    }
    if (device.hasGps && device.gpsAccuracy) {
      extraRows.push(`<div class=\"detail-row\"><span class=\"detail-label\">GPS Accuracy:</span><span class=\"detail-value\">${device.gpsAccuracy}m</span></div>`);
    }

    detailDiv.innerHTML = `
      <div class=\"device-detail\">
        <div class=\"detail-row\">
          <span class=\"detail-label\">${this._t('deviceDetail')}</span>
          <span class=\"detail-value\">${device.icon} ${device.name}</span>
        </div>
        <div class=\"detail-row\">
          <span class=\"detail-label\">${this._t('categoryDetail')}</span>
          <span class=\"detail-value\">${device.category}</span>
        </div>
        <div class=\"detail-row\">
          <span class=\"detail-label\">${this._t('statusDetail')}</span>
          <span class=\"detail-value\">${statusLabel}</span>
        </div>
        <div class=\"detail-row\">
          <span class=\"detail-label\">${this._t('ipDetail')}</span>
          <span class=\"detail-value\">${ipDisplay}</span>
        </div>
        <div class=\"detail-row\">
          <span class=\"detail-label\">${this._t('macDetail')}</span>
          <span class=\"detail-value\">${macDisplay}</span>
        </div>
        <div class=\"detail-row\">
          <span class=\"detail-label\">${this._t('lastSeenDetail')}</span>
          <span class=\"detail-value\">${lastSeenDate}</span>
        </div>
        ${extraRows.join('')}
      </div>
    `;
  }

  static getConfigElement() {
    const element = document.createElement('ha-entity-picker');
    element.label = 'Router Entity';
    element.required = false;
    return element;
  }

  static getStubConfig() {
    return {
      type: 'custom:ha-network-map',
      title: 'Network Map',
      router_entity: 'device_tracker.router'
    };
  }

  // --- Canvas size fix for Bento CSS ---
  _fixCanvasSize(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }

  // --- Pagination helper ---
  _renderPagination(tabName, totalItems) {
    if (!this._currentPage[tabName]) this._currentPage[tabName] = 1;
    const pageSize = this._pageSize;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(this._currentPage[tabName], totalPages);
    this._currentPage[tabName] = page;
    return `
      <div class=\"pagination\">
        <button class=\"pagination-btn\" data-page-tab=\"${tabName}\" data-page=\"${page - 1}\" ${page <= 1 ? 'disabled' : ''}>&#8249; Prev</button>
        <span class=\"pagination-info\">${page} / ${totalPages} (${totalItems})</span>
        <button class=\"pagination-btn\" data-page-tab=\"${tabName}\" data-page=\"${page + 1}\" ${page >= totalPages ? 'disabled' : ''}>Next &#8250;</button>
        <select class=\"page-size-select\" data-page-tab=\"${tabName}\" data-action=\"page-size\">
          ${[10,15,25,50].map(s => `<option value=\"${s}\" ${s === pageSize ? 'selected' : ''}>${s}/page</option>`).join('')}
        </select>
      </div>`;
  }

  _paginateItems(items, tabName) {
    if (!this._currentPage[tabName]) this._currentPage[tabName] = 1;
    const start = (this._currentPage[tabName] - 1) * this._pageSize;
    return items.slice(start, start + this._pageSize);
  }

  _setupPaginationListeners() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.pageTab;
        const page = parseInt(e.target.dataset.page);
        if (tab && page > 0) {
          this._currentPage[tab] = page;
          this._render ? this._render() : (this.render ? this.render() : this.renderCard());
        }
      });
    });
    this.shadowRoot.querySelectorAll('.page-size-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        this._pageSize = parseInt(e.target.value);
        Object.keys(this._currentPage).forEach(k => this._currentPage[k] = 1);
        this._render ? this._render() : (this.render ? this.render() : this.renderCard());
      });
    });
  }

}

customElements.define('ha-network-map', HaNetworkMap);

// Register custom card for HACS
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ha-network-map',
  name: 'Network Map',
  description: 'Visualize your home network devices with list, map, and statistics views'
});

// Auto-load HA Tools Panel (if not already registered)
if (!customElements.get('ha-tools-panel')) {
  const _currentScript = document.currentScript?.src || '';
  const _baseUrl = _currentScript.substring(0, _currentScript.lastIndexOf('/') + 1);
  if (_baseUrl) {
    const _s = document.createElement('script');
    _s.src = _baseUrl + 'ha-tools-panel.js';
    document.head.appendChild(_s);
  }
}
