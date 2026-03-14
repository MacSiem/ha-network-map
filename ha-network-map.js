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

  setConfig(config) {
    this.config = config;
    this.title = config.title || 'Network Map';
    this.routerEntity = config.router_entity || 'device_tracker.router';
  }

  set hass(hass) {
    this.hass = hass;
    this.updateDevices();
    this.render();
  }

  updateDevices() {
    const states = this.hass.states;
    this.devices = [];

    Object.keys(states).forEach(entityId => {
      if (entityId.startsWith('device_tracker.')) {
        const state = states[entityId];
        const friendlyName = state.attributes.friendly_name || entityId.replace('device_tracker.', '');
        const isHome = state.state === 'home';
        const status = state.state === 'home' ? 'home' : state.state === 'away' ? 'away' : 'unknown';

        const device = {
          id: entityId,
          name: friendlyName,
          status: status,
          ip: state.attributes.ip_address || 'N/A',
          mac: state.attributes.mac || 'N/A',
          lastSeen: state.attributes.last_seen || state.last_updated || new Date().toISOString(),
          icon: this.getCategoryIcon(friendlyName),
          category: this.categorizeDevice(friendlyName),
          attributes: state.attributes
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
          const statusOrder = { home: 0, unknown: 1, away: 2 };
          aVal = statusOrder[a.status] || 3;
          bVal = statusOrder[b.status] || 3;
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
      </style>
    `;

    const content = this.getActiveTabContent();

    this.shadowRoot.innerHTML = styles + `
      <div class="card-container">
        <div class="card-header">${this.title}</div>
        <div class="tabs">
          <button class="tab-btn ${this.activeTab === 'list' ? 'active' : ''}" data-tab="list">List</button>
          <button class="tab-btn ${this.activeTab === 'map' ? 'active' : ''}" data-tab="map">Map</button>
          <button class="tab-btn ${this.activeTab === 'stats' ? 'active' : ''}" data-tab="stats">Stats</button>
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
      return '<div class="empty-state">No devices found. Add device_tracker entities to Home Assistant.</div>';
    }

    const rows = this.filteredDevices.map((device, idx) => `
      <tr data-device-id="${device.id}" data-index="${idx}">
        <td><span class="device-icon">${device.icon}</span>${device.name}</td>
        <td>${device.category}</td>
        <td><span class="status-badge status-${device.status}">${device.status.toUpperCase()}</span></td>
        <td>${device.ip}</td>
        <td>${device.mac}</td>
        <td>${new Date(device.lastSeen).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <div class="search-bar">
        <input type="text" class="search-input" id="searchInput" placeholder="Search devices...">
      </div>
      <table class="table">
        <thead>
          <tr>
            <th data-sort="name">Device Name <span class="sort-indicator" id="sort-name"></span></th>
            <th data-sort="category">Category <span class="sort-indicator" id="sort-category"></span></th>
            <th data-sort="status">Status <span class="sort-indicator" id="sort-status"></span></th>
            <th>IP Address</th>
            <th>MAC Address</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  renderMapTab() {
    return `
      <div class="canvas-container">
        <canvas id="networkCanvas" width="600" height="600"></canvas>
      </div>
      <div id="deviceDetail"></div>
    `;
  }

  renderStatsTab() {
    const totalDevices = this.devices.length;
    const onlineDevices = this.devices.filter(d => d.status === 'home').length;
    const offlineDevices = this.devices.filter(d => d.status === 'away').length;
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
          <div class="stat-label">Total Devices</div>
        </div>
        <div class="stat-card online">
          <div class="stat-value">${onlineDevices}</div>
          <div class="stat-label">Online</div>
        </div>
        <div class="stat-card offline">
          <div class="stat-value">${offlineDevices}</div>
          <div class="stat-label">Offline</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${todayNew}</div>
          <div class="stat-label">New Today</div>
        </div>
      </div>
      ${bandwidthContent}
    `;
  }

  getBandwidthContent() {
    const states = this.hass.states;
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

    return bandwidthHtml || '<div class="empty-state" style="padding: 16px;">No bandwidth sensors found.</div>';
  }

  drawNetworkMap(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    ctx.fillStyle = this.getComputedStyle(document.documentElement).getPropertyValue('--card-background-color') || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Router', centerX, centerY);

    const onlineDevices = this.devices.filter(d => d.status === 'home');
    const offlineDevices = this.devices.filter(d => d.status !== 'home');
    const allDisplayed = [...onlineDevices, ...offlineDevices].slice(0, 12);

    allDisplayed.forEach((device, index) => {
      const angle = (index / allDisplayed.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const color = device.status === 'home' ? '#4caf50' : device.status === 'away' ? '#f44336' : '#9e9e9e';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      device.canvasX = x;
      device.canvasY = y;
      device.canvasRadius = 10;
    });

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
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

    const onlineDevices = this.devices.filter(d => d.status === 'home');
    const offlineDevices = this.devices.filter(d => d.status !== 'home');
    const allDisplayed = [...onlineDevices, ...offlineDevices].slice(0, 12);

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

    detailDiv.innerHTML = `
      <div class="device-detail">
        <div class="detail-row">
          <span class="detail-label">Device:</span>
          <span class="detail-value">${device.icon} ${device.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category:</span>
          <span class="detail-value">${device.category}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">${device.status.toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">IP:</span>
          <span class="detail-value">${device.ip}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">MAC:</span>
          <span class="detail-value">${device.mac}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Last Seen:</span>
          <span class="detail-value">${lastSeenDate}</span>
        </div>
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
