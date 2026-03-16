class HaNetworkMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.devices = [];
    this.filteredDevices = [];
    this.selectedDevice = null;
    this.activeTab = 'list';
    this.searchQuery = '';
    this.sortBy = 'name';
    this.sortDesc = false;
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
    this.updateDevices();
    this.render();
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
      'Phone': '??',
      'Tablet': '??',
      'Computer': '??',
      'Media': '??',
      'Smart Home': '??',
      'Wearable': '?',
      'Other': '??'
    };
    return icons[category] || '??';
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

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:host {
  --bento-bg: #F8FAFC;
  --bento-card: #FFFFFF;
  --bento-primary: #3B82F6;
  --bento-primary-hover: #2563EB;
  --bento-text: #1E293B;
  --bento-text-secondary: #64748B;
  --bento-border: #E2E8F0;
  --bento-success: #10B981;
  --bento-warning: #F59E0B;
  --bento-error: #EF4444;
  --bento-radius: 16px;
  --bento-radius-sm: 10px;
  --bento-radius-xs: 6px;
  --bento-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
  --bento-shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --bento-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: block;
  color-scheme: light !important;
}
* { box-sizing: border-box; }

.card, .card-container, .reports-card, .export-card {
  background: var(--bento-card); border-radius: var(--bento-radius); box-shadow: var(--bento-shadow);
  padding: 28px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--bento-text); border: 1px solid var(--bento-border); animation: fadeSlideIn 0.4s ease-out;
}
.card-header { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: var(--bento-text); letter-spacing: -0.01em; display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { font-size: 20px; font-weight: 700; color: var(--bento-text); margin: 0; letter-spacing: -0.01em; }
.card-title, .title, .header-title, .pan-title { font-size: 20px; font-weight: 700; color: var(--bento-text); letter-spacing: -0.01em; }
.header, .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--bento-border); margin-bottom: 24px; overflow-x: auto; padding-bottom: 0; }
.tab, .tab-btn, .tab-button { padding: 10px 20px; border: none; background: transparent; color: var(--bento-text-secondary); cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: var(--bento-transition); white-space: nowrap; margin-bottom: -2px; border-radius: 8px 8px 0 0; font-family: 'Inter', sans-serif; }
.tab.active, .tab-btn.active, .tab-button.active { color: var(--bento-primary); border-bottom-color: var(--bento-primary); background: rgba(59, 130, 246, 0.04); }
.tab:hover, .tab-btn:hover, .tab-button:hover { color: var(--bento-primary); background: rgba(59, 130, 246, 0.04); }
.tab-icon { margin-right: 6px; }
.tab-content { display: none; }
.tab-content.active { display: block; animation: fadeSlideIn 0.3s ease-out; }

button, .btn, .btn-s { padding: 9px 16px; border: 1.5px solid var(--bento-border); background: var(--bento-card); color: var(--bento-text); border-radius: var(--bento-radius-sm); cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; transition: var(--bento-transition); }
button:hover, .btn:hover, .btn-s:hover { background: var(--bento-bg); border-color: var(--bento-primary); color: var(--bento-primary); }
button.active, .btn.active, .btn-act { background: var(--bento-primary); color: white; border-color: var(--bento-primary); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25); }
.btn-primary { padding: 9px 16px; background: var(--bento-primary); color: white; border: 1.5px solid var(--bento-primary); border-radius: var(--bento-radius-sm); cursor: pointer; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; transition: var(--bento-transition); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25); }
.btn-primary:hover { background: var(--bento-primary-hover); border-color: var(--bento-primary-hover); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35); transform: translateY(-1px); }
.btn-secondary { padding: 9px 16px; background: var(--bento-card); color: var(--bento-text); border: 1.5px solid var(--bento-border); border-radius: var(--bento-radius-sm); cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; transition: var(--bento-transition); }
.btn-secondary:hover { border-color: var(--bento-primary); color: var(--bento-primary); background: rgba(59, 130, 246, 0.04); }
.btn-danger { padding: 9px 16px; background: var(--bento-card); color: var(--bento-error); border: 1.5px solid var(--bento-error); border-radius: var(--bento-radius-sm); cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; transition: var(--bento-transition); }
.btn-danger:hover { background: var(--bento-error); color: white; }
.btn-small { padding: 5px 12px; font-size: 12px; border: 1px solid var(--bento-border); background: var(--bento-card); color: var(--bento-text-secondary); border-radius: var(--bento-radius-xs); cursor: pointer; font-weight: 500; font-family: 'Inter', sans-serif; transition: var(--bento-transition); }
.btn-small:hover { border-color: var(--bento-primary); color: var(--bento-primary); background: rgba(59, 130, 246, 0.04); }

input[type="text"], input[type="number"], input[type="date"], input[type="time"], input[type="email"], input[type="search"], select, textarea, .search-input, .sinput, .sinput-sm, .alert-search-box, .period-select { padding: 9px 14px; border: 1.5px solid var(--bento-border); border-radius: var(--bento-radius-sm); font-size: 13px; background: var(--bento-card); color: var(--bento-text); font-family: 'Inter', sans-serif; transition: var(--bento-transition); outline: none; }
input[type="text"]:focus, input[type="number"]:focus, input[type="date"]:focus, input[type="time"]:focus, select:focus, textarea:focus, .search-input:focus, .sinput:focus, .sinput-sm:focus, .alert-search-box:focus, .period-select:focus { border-color: var(--bento-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
input::placeholder, .search-input::placeholder, .sinput::placeholder, .sinput-sm::placeholder { color: var(--bento-text-secondary); opacity: 0.7; }
.form-group { margin-bottom: 16px; }
.form-group.full { grid-column: 1 / -1; }
.form-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
label, .cg label, .clbl { display: block; font-size: 12px; font-weight: 600; color: var(--bento-text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
.add-form { background: var(--bento-bg); border: 1px solid var(--bento-border); border-radius: var(--bento-radius-sm); padding: 20px; margin-bottom: 20px; }
textarea { min-height: 80px; resize: vertical; }

.stats, .stats-grid, .stats-container, .summary-grid, .network-stats, .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
.stat, .stat-card, .summary-card, .network-stat, .metric-card, .kpi-card { background: var(--bento-bg); border-radius: var(--bento-radius-sm); padding: 16px; border: 1px solid var(--bento-border); transition: var(--bento-transition); text-align: center; }
.stat:hover, .stat-card:hover, .summary-card:hover, .network-stat:hover, .metric-card:hover { border-color: var(--bento-primary); box-shadow: var(--bento-shadow-md); transform: translateY(-1px); }
.stat-card.online { border-left: 3px solid var(--bento-success); }
.stat-card.offline { border-left: 3px solid var(--bento-error); }
.sv, .stat-value, .summary-value, .network-stat-value, .metric-value { font-size: 24px; font-weight: 700; color: var(--bento-primary); line-height: 1.2; }
.stat.ok .sv { color: var(--bento-success); }
.stat.err .sv { color: var(--bento-error); }
.sl, .stat-label, .summary-label, .network-stat-label, .metric-label { font-size: 12px; color: var(--bento-text-secondary); font-weight: 500; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
.stat-trend { font-size: 12px; font-weight: 600; margin-top: 4px; }
.stat-trend.positive, .trend-up { color: var(--bento-success); }
.stat-trend.negative, .trend-down { color: var(--bento-error); }

.device-table, .entity-table, .table, .alert-table, .data-table, .backup-table, .history-table, .log-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 16px; }
.device-table th, .entity-table th, .table th, .alert-table th, .data-table th, .backup-table th, table th { text-align: left; padding: 12px 16px; border-bottom: 2px solid var(--bento-border); font-weight: 600; color: var(--bento-text-secondary); background: var(--bento-bg); cursor: pointer; user-select: none; white-space: nowrap; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; transition: var(--bento-transition); font-family: 'Inter', sans-serif; }
.device-table th:first-child, .entity-table th:first-child, .table th:first-child, table th:first-child { border-radius: var(--bento-radius-xs) 0 0 0; }
.device-table th:last-child, .entity-table th:last-child, .table th:last-child, table th:last-child { border-radius: 0 var(--bento-radius-xs) 0 0; }
.device-table th:hover, .entity-table th:hover, .table th:hover, table th:hover { background: rgba(59, 130, 246, 0.06); color: var(--bento-primary); }
.device-table th.sorted, .entity-table th.sorted, .table th.sorted, table th.sorted { background: rgba(59, 130, 246, 0.08); color: var(--bento-primary); }
.device-table td, .entity-table td, .table td, .alert-table td, .data-table td, .backup-table td, table td { padding: 12px 16px; border-bottom: 1px solid var(--bento-border); color: var(--bento-text); font-size: 13px; font-family: 'Inter', sans-serif; }
.device-table tr:hover, .entity-table tr:hover, .table tbody tr:hover, .alert-table tr:hover, table tr:hover { background: rgba(59, 130, 246, 0.03); }
.table-container { overflow-x: auto; border-radius: var(--bento-radius-sm); border: 1px solid var(--bento-border); }
.sort-indicator { font-size: 10px; margin-left: 4px; color: var(--bento-primary); }

.status-badge, .severity-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; }
.status-online, .status-home, .status-active, .status-ok, .status-healthy, .status-running, .status-complete, .status-completed, .status-success, .badge-success { background: rgba(16, 185, 129, 0.1); color: #059669; }
.status-offline, .status-error, .status-failed, .status-critical, .severity-critical, .badge-error, .badge-danger { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.status-away, .status-warning, .severity-warning, .badge-warning { background: rgba(245, 158, 11, 0.1); color: #B45309; }
.status-unavailable, .status-unknown, .status-idle, .status-inactive, .status-stopped, .badge-neutral { background: rgba(100, 116, 139, 0.1); color: var(--bento-text-secondary); }
.status-zone, .severity-info, .badge-info { background: rgba(59, 130, 246, 0.1); color: var(--bento-primary); }

.alert-item { padding: 14px 18px; border-left: 4px solid var(--bento-border); border-radius: 0 var(--bento-radius-sm) var(--bento-radius-sm) 0; margin-bottom: 10px; background: var(--bento-bg); display: flex; justify-content: space-between; align-items: center; transition: var(--bento-transition); }
.alert-item:hover { box-shadow: var(--bento-shadow); }
.alert-critical { border-color: var(--bento-error); background: rgba(239, 68, 68, 0.04); }
.alert-warning { border-color: var(--bento-warning); background: rgba(245, 158, 11, 0.04); }
.alert-info { border-color: var(--bento-primary); background: rgba(59, 130, 246, 0.04); }
.alert-text { flex: 1; }
.alert-type { font-weight: 600; font-size: 13px; margin-bottom: 4px; color: var(--bento-text); }
.alert-time { font-size: 12px; color: var(--bento-text-secondary); }
.alert-actions { display: flex; gap: 8px; }
.alert-dismiss { padding: 6px 12px; font-size: 12px; background: var(--bento-card); color: var(--bento-text-secondary); border: 1px solid var(--bento-border); border-radius: var(--bento-radius-xs); cursor: pointer; font-weight: 500; transition: var(--bento-transition); }
.alert-dismiss:hover { background: var(--bento-error); color: white; border-color: var(--bento-error); }

.section { margin-bottom: 24px; }
.section h3, .section-title, .pan-head { font-size: 16px; font-weight: 600; color: var(--bento-text); margin-bottom: 12px; letter-spacing: -0.01em; }

.battery-grid, .grid, .items-grid, .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.battery-card, .item-card, .chore-card, .entry-card, .backup-card { background: var(--bento-bg); border-radius: var(--bento-radius-sm); padding: 16px; border: 1px solid var(--bento-border); transition: var(--bento-transition); }
.battery-card:hover, .item-card:hover, .chore-card:hover, .entry-card:hover, .backup-card:hover { box-shadow: var(--bento-shadow-md); border-color: var(--bento-primary); transform: translateY(-1px); }
.chore-card.priority-high { border-left: 3px solid var(--bento-error); }
.chore-card.priority-medium { border-left: 3px solid var(--bento-warning); }
.chore-card.priority-low { border-left: 3px solid var(--bento-success); }
.chore-title, .entry-title, .item-title { font-weight: 600; font-size: 14px; color: var(--bento-text); margin-bottom: 6px; }
.chore-meta, .entry-meta, .item-meta { font-size: 12px; color: var(--bento-text-secondary); }
.chore-assignee { font-size: 12px; color: var(--bento-primary); font-weight: 500; }
.chore-actions, .item-actions, .entry-actions { display: flex; gap: 6px; margin-top: 10px; }

.battery-bar, .progress-bar, .bandwidth-bar-bg { width: 100%; height: 8px; background: var(--bento-border); border-radius: 4px; overflow: hidden; margin-top: 8px; }
.battery-fill, .progress-fill, .bandwidth-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); background: var(--bento-success); }
.battery-fill.battery_critical { background: var(--bento-error) !important; }
.battery-fill.battery_warning { background: var(--bento-warning) !important; }
.battery-label, .bandwidth-label { font-size: 13px; color: var(--bento-text); font-weight: 500; display: flex; justify-content: space-between; align-items: center; }

.pagination, .pag { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; padding: 16px 0; border-top: 1px solid var(--bento-border); }
.pagination-btn, .pag-btn { padding: 8px 14px; border: 1.5px solid var(--bento-border); background: var(--bento-card); color: var(--bento-text); border-radius: var(--bento-radius-xs); cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; transition: var(--bento-transition); }
.pagination-btn:hover:not(:disabled), .pag-btn:hover:not(:disabled) { background: var(--bento-primary); color: white; border-color: var(--bento-primary); }
.pagination-btn:disabled, .pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination-info, .pag-info { font-size: 13px; color: var(--bento-text-secondary); font-weight: 500; padding: 0 8px; }
.page-size-selector, .pag-size { padding: 6px 10px; border: 1.5px solid var(--bento-border); border-radius: var(--bento-radius-xs); background: var(--bento-card); color: var(--bento-text); font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }

.col-main { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: var(--bento-text); }
.topbar-r { display: flex; gap: 8px; align-items: center; }
.panels { display: flex; gap: 12px; }
.pan-left, .pan-center, .pan-right { background: var(--bento-card); border-radius: var(--bento-radius-sm); border: 1px solid var(--bento-border); overflow: hidden; }
.cbar { display: flex; gap: 8px; align-items: center; padding: 12px; background: var(--bento-bg); border-bottom: 1px solid var(--bento-border); }
.cg { display: flex; gap: 8px; align-items: center; }
.cg-r { margin-left: auto; }

.dd { position: relative; }
.dd-menu { position: absolute; top: 100%; left: 0; background: var(--bento-card); border: 1px solid var(--bento-border); border-radius: var(--bento-radius-sm); box-shadow: var(--bento-shadow-md); min-width: 180px; z-index: 100; display: none; overflow: hidden; }
.dd.open .dd-menu { display: block; }
.dd-i { padding: 10px 16px; cursor: pointer; font-size: 13px; color: var(--bento-text); transition: var(--bento-transition); font-family: 'Inter', sans-serif; }
.dd-i:hover { background: rgba(59, 130, 246, 0.06); color: var(--bento-primary); }
.dd-div { border-top: 1px solid var(--bento-border); margin: 4px 0; }

.auto-item, .tr-item, .list-item, .automation-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--bento-border); display: flex; align-items: center; gap: 10px; transition: var(--bento-transition); font-family: 'Inter', sans-serif; }
.auto-item:hover, .tr-item:hover, .list-item:hover, .automation-item:hover { background: rgba(59, 130, 246, 0.04); }
.auto-item.sel, .tr-item.sel, .list-item.selected, .automation-item.selected { background: rgba(59, 130, 246, 0.08); border-left: 3px solid var(--bento-primary); }
.auto-item.error-item, .automation-item.error-item { border-left: 3px solid var(--bento-error); }
.auto-name { font-weight: 500; font-size: 13px; color: var(--bento-text); }
.auto-meta { font-size: 12px; color: var(--bento-text-secondary); }
.auto-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--bento-text-secondary); }
.auto-dot.s-running { background: var(--bento-success); }
.auto-dot.s-stopped { background: var(--bento-text-secondary); }
.auto-dot.s-error { background: var(--bento-error); }
.auto-count { font-size: 11px; color: var(--bento-text-secondary); margin-left: auto; }

.tgroup { border: 1px solid var(--bento-border); border-radius: var(--bento-radius-xs); margin-bottom: 8px; overflow: hidden; }
.tgroup-h { padding: 10px 14px; background: var(--bento-bg); display: flex; align-items: center; gap: 8px; cursor: pointer; transition: var(--bento-transition); font-family: 'Inter', sans-serif; }
.tgroup-h:hover { background: rgba(59, 130, 246, 0.06); }
.tg-tog { transition: transform 0.2s; font-size: 12px; color: var(--bento-text-secondary); }
.tgroup.collapsed .tg-tog { transform: rotate(-90deg); }
.tgroup.collapsed .tgroup-items { display: none; }
.tg-name { font-weight: 600; font-size: 13px; color: var(--bento-text); }
.tg-cnt { font-size: 11px; color: var(--bento-text-secondary); margin-left: auto; background: var(--bento-border); padding: 2px 8px; border-radius: 10px; }

.device-detail, .detail-panel, .details { background: var(--bento-bg); border-radius: var(--bento-radius-sm); padding: 16px; border: 1px solid var(--bento-border); }
.detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--bento-border); font-size: 13px; }
.detail-row:last-child { border-bottom: none; }
.detail-label { color: var(--bento-text-secondary); font-weight: 500; }
.detail-value { color: var(--bento-text); font-weight: 600; }

.board { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; }
.column { min-width: 260px; background: var(--bento-bg); border-radius: var(--bento-radius-sm); padding: 12px; border: 1px solid var(--bento-border); }
.column-header { font-weight: 600; font-size: 14px; color: var(--bento-text); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
.column-count { background: var(--bento-border); color: var(--bento-text-secondary); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }

.schedule, .calendar { margin-top: 16px; }
.week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 16px; }
.week-header { padding: 8px; text-align: center; font-size: 12px; font-weight: 600; color: var(--bento-text-secondary); text-transform: uppercase; letter-spacing: 0.03em; border-radius: var(--bento-radius-xs); }
.week-cell { padding: 8px; text-align: center; font-size: 12px; background: var(--bento-bg); border: 1px solid var(--bento-border); cursor: pointer; transition: var(--bento-transition); border-radius: var(--bento-radius-xs); }
.week-cell:hover { border-color: var(--bento-primary); background: rgba(59, 130, 246, 0.04); }
.chore-item { padding: 8px 12px; border-bottom: 1px solid var(--bento-border); font-size: 13px; }

.leaderboard { background: var(--bento-bg); border-radius: var(--bento-radius-sm); border: 1px solid var(--bento-border); overflow: hidden; }
.leaderboard-row { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--bento-border); gap: 12px; font-size: 13px; transition: var(--bento-transition); }
.leaderboard-row:last-child { border-bottom: none; }
.leaderboard-row:hover { background: rgba(59, 130, 246, 0.04); }
.rank { font-weight: 700; color: var(--bento-primary); font-size: 14px; min-width: 28px; }
.name { font-weight: 500; color: var(--bento-text); flex: 1; }
.streak { color: var(--bento-warning); font-weight: 600; }
.completion { color: var(--bento-success); font-weight: 600; }

.baby-selector { display: flex; gap: 8px; margin-bottom: 16px; }
.quick-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.quick-btn, .action-btn { padding: 10px 16px; border: 1.5px solid var(--bento-border); background: var(--bento-card); border-radius: var(--bento-radius-sm); cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; transition: var(--bento-transition); display: flex; align-items: center; gap: 6px; color: var(--bento-text); }
.quick-btn:hover, .action-btn:hover { border-color: var(--bento-primary); color: var(--bento-primary); background: rgba(59, 130, 246, 0.04); }
.quick-btn.active, .action-btn.active { background: var(--bento-primary); color: white; border-color: var(--bento-primary); }
.timeline { position: relative; padding-left: 24px; }
.timeline-item { padding: 12px 0; border-bottom: 1px solid var(--bento-border); position: relative; }
.timeline-time { font-size: 12px; color: var(--bento-text-secondary); font-weight: 500; }
.timeline-content { font-size: 13px; color: var(--bento-text); margin-top: 4px; }

canvas, .canvas-container canvas { width: 100%; height: 200px; border: 1px solid var(--bento-border); border-radius: var(--bento-radius-sm); margin-bottom: 16px; }
.canvas-container { position: relative; margin-bottom: 16px; }
.chart-container { background: var(--bento-bg); border-radius: var(--bento-radius-sm); padding: 16px; border: 1px solid var(--bento-border); margin-bottom: 16px; }

.empty, .empty-state { text-align: center; padding: 48px 24px; color: var(--bento-text-secondary); font-size: 14px; font-family: 'Inter', sans-serif; }
.empty-ico, .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--bento-border); border-top: 3px solid var(--bento-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 24px auto; }

.search-box, .search-bar, .controls, .ctrls, .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
.control-group { display: flex; gap: 8px; align-items: center; }

.domain-group-header { margin-top: 20px; padding: 10px 16px; background: var(--bento-bg); border-radius: var(--bento-radius-xs); font-weight: 600; font-size: 14px; color: var(--bento-text); border: 1px solid var(--bento-border); }
.domain-group-header:first-child { margin-top: 0; }
.domain-group-count { font-weight: 500; color: var(--bento-text-secondary); font-size: 12px; margin-left: 8px; }

.automation-list, .list, .item-list { border: 1px solid var(--bento-border); border-radius: var(--bento-radius-sm); overflow: hidden; }
.automation-name, .entity-name { font-weight: 500; font-size: 13px; color: var(--bento-text); }
.automation-id, .entity-id { font-size: 11px; color: var(--bento-text-secondary); }
.error-badge, .count-badge { background: var(--bento-error); color: white; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; margin-left: 6px; }
.tab .error-badge { background: var(--bento-error); color: white; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; margin-left: 6px; }

.health-score, .score { font-size: 48px; font-weight: 700; color: var(--bento-primary); text-align: center; margin: 16px 0; }
.emoji { font-size: 20px; line-height: 1; }
.device-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.08); border-radius: var(--bento-radius-xs); font-size: 16px; }

.recommendation-card, .tip-card, .suggestion-card { background: var(--bento-bg); border-radius: var(--bento-radius-sm); padding: 16px; border: 1px solid var(--bento-border); margin-bottom: 12px; transition: var(--bento-transition); }
.recommendation-card:hover, .tip-card:hover, .suggestion-card:hover { border-color: var(--bento-primary); box-shadow: var(--bento-shadow-md); }

.export-options, .options-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
.export-option, .option-card { background: var(--bento-bg); border: 1.5px solid var(--bento-border); border-radius: var(--bento-radius-sm); padding: 16px; cursor: pointer; transition: var(--bento-transition); text-align: center; }
.export-option:hover, .option-card:hover { border-color: var(--bento-primary); background: rgba(59, 130, 246, 0.04); }
.export-option.selected, .option-card.selected { border-color: var(--bento-primary); background: rgba(59, 130, 246, 0.08); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

.storage-bar, .usage-bar { width: 100%; height: 24px; background: var(--bento-border); border-radius: var(--bento-radius-xs); overflow: hidden; margin-bottom: 12px; }
.storage-fill, .usage-fill { height: 100%; border-radius: var(--bento-radius-xs); transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); background: var(--bento-primary); }

.check-item, .security-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--bento-border); transition: var(--bento-transition); }
.check-item:hover, .security-item:hover { background: rgba(59, 130, 246, 0.03); }
.check-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 16px; }
.check-icon.pass { background: rgba(16, 185, 129, 0.1); }
.check-icon.fail { background: rgba(239, 68, 68, 0.1); }
.check-icon.warn { background: rgba(245, 158, 11, 0.1); }
.check-text, .security-text { flex: 1; }
.check-title { font-weight: 600; font-size: 13px; color: var(--bento-text); }
.check-desc { font-size: 12px; color: var(--bento-text-secondary); margin-top: 2px; }

.waveform { background: var(--bento-bg); border: 1px solid var(--bento-border); border-radius: var(--bento-radius-sm); padding: 16px; margin-bottom: 16px; }
.analysis-result, .result-card { background: var(--bento-bg); border: 1px solid var(--bento-border); border-radius: var(--bento-radius-sm); padding: 20px; text-align: center; margin-bottom: 16px; }
.confidence-bar { height: 8px; background: var(--bento-border); border-radius: 4px; overflow: hidden; margin-top: 8px; }
.confidence-fill { height: 100%; border-radius: 4px; background: var(--bento-primary); transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

.sentence-item, .intent-item { padding: 12px 16px; border-bottom: 1px solid var(--bento-border); display: flex; justify-content: space-between; align-items: center; transition: var(--bento-transition); }
.sentence-item:hover, .intent-item:hover { background: rgba(59, 130, 246, 0.03); }
.sentence-text { font-size: 13px; color: var(--bento-text); font-family: 'Inter', sans-serif; }
.intent-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: rgba(59, 130, 246, 0.1); color: var(--bento-primary); }

.backup-item, .backup-entry { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--bento-border); transition: var(--bento-transition); }
.backup-item:hover, .backup-entry:hover { background: rgba(59, 130, 246, 0.03); }
.backup-name { font-weight: 500; font-size: 14px; color: var(--bento-text); }
.backup-date, .backup-size { font-size: 12px; color: var(--bento-text-secondary); }

.report-section { background: var(--bento-bg); border-radius: var(--bento-radius-sm); padding: 20px; border: 1px solid var(--bento-border); margin-bottom: 16px; }
.insight-card { padding: 14px; border-left: 3px solid var(--bento-primary); background: rgba(59, 130, 246, 0.04); border-radius: 0 var(--bento-radius-xs) var(--bento-radius-xs) 0; margin-bottom: 10px; }

@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bento-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--bento-text-secondary); }

@media (max-width: 768px) {
  .card, .card-container, .reports-card, .export-card { padding: 16px; }
  .stats, .stats-grid, .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .panels { flex-direction: column; }
  .board { flex-direction: column; }
  .column { min-width: unset; }
}

</style>
    `;

    const content = this.getActiveTabContent();

    this.shadowRoot.innerHTML = styles + `
      <div class="card-container">
        <div class="card-header">${this.title}</div>
        <div class="tabs">
          <button class="tab-btn ${this.activeTab === 'list' ? 'active' : ''}" data-tab="list">${this._t('listTab')}</button>
          <button class="tab-btn ${this.activeTab === 'map' ? 'active' : ''}" data-tab="map">${this._t('mapTab')}</button>
          <button class="tab-btn ${this.activeTab === 'stats' ? 'active' : ''}" data-tab="stats">${this._t('statsTab')}</button>
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
      return `<div class="empty-state">${this._t('noDevicesFound')}</div>`;
    }

    const rows = this.filteredDevices.map((device, idx) => {
      const ipDisplay = device.ip || (device.hasGps ? '?? GPS' : '—');
      const macDisplay = device.mac || (device.battery !== null ? `?? ${device.battery}%` : '—');
      const statusLabel = device.status === 'zone' ? device.rawState : this._t(device.status);
      return `
      <tr data-device-id="${device.id}" data-index="${idx}">
        <td><span class="device-icon">${device.icon}</span>${device.name}</td>
        <td>${device.category}</td>
        <td><span class="status-badge status-${device.status}">${statusLabel}</span></td>
        <td>${ipDisplay}</td>
        <td>${macDisplay}</td>
        <td>${new Date(device.lastSeen).toLocaleString()}</td>
      </tr>`;
    }).join('');

    return `
      <div class="search-bar">
        <input type="text" class="search-input" id="searchInput" placeholder="${this._t('searchPlaceholder')}">
      </div>
      <table class="table">
        <thead>
          <tr>
            <th data-sort="name">${this._t('deviceName')} <span class="sort-indicator" id="sort-name"></span></th>
            <th data-sort="category">${this._t('category')} <span class="sort-indicator" id="sort-category"></span></th>
            <th data-sort="status">${this._t('status')} <span class="sort-indicator" id="sort-status"></span></th>
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
      return `<div class="empty-state">${this._t('noDevicesFound')}</div>`;
    }

    return `
      <div class="canvas-container">
        <canvas id="networkCanvas" width="700" height="700"></canvas>
      </div>
      <div id="deviceDetail"></div>
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

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalDevices}</div>
          <div class="stat-label">${this._t('totalDevices')}</div>
        </div>
        <div class="stat-card online">
          <div class="stat-value">${onlineDevices}</div>
          <div class="stat-label">${this._t('online')}</div>
        </div>
        <div class="stat-card offline">
          <div class="stat-value">${offlineDevices}</div>
          <div class="stat-label">${this._t('offline')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${todayNew}</div>
          <div class="stat-label">${this._t('newToday')}</div>
        </div>
      </div>
      ${bandwidthContent}
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
          <div class="bandwidth-bar">
            <div class="bandwidth-label">${name}: ${value.toFixed(2)} ${unit}</div>
            <div class="bandwidth-bar-bg">
              <div class="bandwidth-bar-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }
    });

    return bandwidthHtml || `<div class="empty-state" style="padding: 16px;">${this._t('noBandwidthSensors')}</div>`;
  }

  drawNetworkMap(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card-background-color') || 'var(--card-background-color, #1e1e1e)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px sans-serif';
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

    const colorMap = { home: '#4caf50', zone: 'var(--primary-color, #03a9f4)', away: '#ff9800', offline: '#f44336', unknown: '#9e9e9e' };

    allDisplayed.forEach((device, index) => {
      const angle = (index / allDisplayed.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * dynamicRadius;
      const y = centerY + Math.sin(angle) * dynamicRadius;

      // Connection line
      const color = colorMap[device.status] || '#9e9e9e';
      ctx.strokeStyle = color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Device dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Label (truncated)
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-text-color') || '#333';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = device.name.length > 12 ? device.name.substring(0, 10) + '…' : device.name;
      ctx.fillText(label, x, y + 12);

      device.canvasX = x;
      device.canvasY = y;
      device.canvasRadius = 8;
    });

    // Orbit circle
    ctx.strokeStyle = (getComputedStyle(document.documentElement).getPropertyValue('--divider-color') || '#ddd') + '66';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  attachEventListeners() {
    const tabs = this.shadowRoot.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeTab = e.target.dataset.tab;
        this.render();
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
          this.drawNetworkMap(canvas);
          canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        }
      }, 0);
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
    const ipDisplay = device.ip || (device.hasGps ? '?? GPS tracker' : '—');
    const macDisplay = device.mac || '—';
    const statusLabel = device.status === 'zone' ? device.rawState : this._t(device.status);
    const extraRows = [];
    if (device.battery !== null) {
      extraRows.push(`<div class="detail-row"><span class="detail-label">?? Battery:</span><span class="detail-value">${device.battery}%</span></div>`);
    }
    if (device.sourceType && device.sourceType !== 'unknown') {
      extraRows.push(`<div class="detail-row"><span class="detail-label">Source:</span><span class="detail-value">${device.sourceType}</span></div>`);
    }
    if (device.hasGps && device.gpsAccuracy) {
      extraRows.push(`<div class="detail-row"><span class="detail-label">GPS Accuracy:</span><span class="detail-value">${device.gpsAccuracy}m</span></div>`);
    }

    detailDiv.innerHTML = `
      <div class="device-detail">
        <div class="detail-row">
          <span class="detail-label">${this._t('deviceDetail')}</span>
          <span class="detail-value">${device.icon} ${device.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${this._t('categoryDetail')}</span>
          <span class="detail-value">${device.category}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${this._t('statusDetail')}</span>
          <span class="detail-value">${statusLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${this._t('ipDetail')}</span>
          <span class="detail-value">${ipDisplay}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${this._t('macDetail')}</span>
          <span class="detail-value">${macDisplay}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${this._t('lastSeenDetail')}</span>
          <span class="detail-value">${lastSeenDate}</span>
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
