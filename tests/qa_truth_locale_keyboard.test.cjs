const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');
function fixture(language = 'en') {
  const dom = new JSDOM('', { runScripts: 'dangerously', url: 'http://localhost/' });
  dom.window.eval(readFileSync(join(__dirname, '..', 'custom_components/ha_network_map/www/ha-network-map.js'), 'utf8'));
  const card = dom.window.document.createElement('ha-network-map');
  dom.window.document.body.append(card);
  card.setConfig({ title: 'Network QA', show_support: false });
  card._hass = { states: {}, language, user: { is_admin: true } }; card._lang = language;
  card._integrationDevices = Array.from({ length: 21 }, (_, i) => ({ key: 'qa' + i, name: 'QA ' + i, mac: '02:00:00:00:00:' + i.toString(16).padStart(2, '0'), category: 'Other', entity_ids: [] }));
  card._buildDeviceList();
  return { dom, card };
}
test('temporary list failure reports its cause and preserves existing rows; successful retry clears it', async () => {
  const { dom, card } = fixture();
  try {
    const rows = card.devices;
    card._hass.callWS = async () => { throw { code: 'list_failed', message: 'QA connection lost' }; };
    await card._reloadFromApi(); card._doRender();
    assert.ok(card.shadowRoot.textContent.includes('QA connection lost'));
    assert.equal(card.shadowRoot.textContent.includes('integration is missing'), false);
    assert.equal(card.devices, rows);
    card._hass.callWS = async () => ({ devices: card._integrationDevices });
    await card._reloadFromApi(); card._doRender();
    assert.equal(card.shadowRoot.textContent.includes('QA connection lost'), false);
    assert.equal(card._scanError, null);
  } finally { dom.window.close(); }
});
test('missing WebSocket command retains installation guidance', async () => {
  const { dom, card } = fixture();
  try {
    card._hass.callWS = async () => { throw { code: 'unknown_command' }; };
    await card._reloadFromApi(); card._doRender();
    assert.ok(card.shadowRoot.textContent.includes('integration is missing'));
  } finally { dom.window.close(); }
});
test('queued scan without a completed measurement never fabricates a completion timestamp', async () => {
  const { dom, card } = fixture();
  try {
    card._hass.callWS = async () => ({ queued: true, last_scan_finished_at: null });
    card._reloadFromApi = async () => {};
    await card._scanAllSubnets();
    assert.equal(card._lastScanTime, null);
    assert.equal(card.shadowRoot.textContent.includes('Scanned:'), false);
  } finally { dom.window.close(); }
});
test('sortable headers expose keyboard buttons, sorting state and keep focus through sorting', () => {
  const { dom, card } = fixture();
  try {
    card._doRender();
    const button = card.shadowRoot.querySelector('th[data-s="ip"] button');
    assert.ok(button, 'IP sorting must be reachable by keyboard');
    button.focus(); button.click();
    assert.equal(card.sortBy, 'ip');
    assert.equal(card.shadowRoot.querySelector('th[data-s="ip"]').getAttribute('aria-sort'), 'ascending');
    assert.equal(card.shadowRoot.activeElement.id, button.id);
    card.shadowRoot.activeElement.click();
    assert.equal(card.shadowRoot.querySelector('th[data-s="ip"]').getAttribute('aria-sort'), 'descending');
  } finally { dom.window.close(); }
});
test('Polish categories, pagination, detail entity and scan time labels translate without changing stored category values', () => {
  const { dom, card } = fixture('pl');
  try {
    card.selectedDevice = { ...card.devices[0], entity_id: 'sensor.qa' };
    card._lastScanTime = 1000; card._doRender();
    const text = card.shadowRoot.textContent;
    assert.ok(text.includes('Inne')); assert.ok(text.includes('Poprzednia')); assert.ok(text.includes('Następna')); assert.ok(text.includes('Encja')); assert.ok(text.includes('Ostatni skan:'));
    assert.equal(text.includes('Other'), false); assert.equal(text.includes('Scanned:'), false);
    assert.equal(card.shadowRoot.querySelector('#deviceCategory').value, 'Other');
  } finally { dom.window.close(); }
});

test('failed reads offer a retry that only reloads the device list', async () => {
  const { dom, card } = fixture();
  try {
    card._hass.callWS = async () => { throw { code: 'list_failed', message: 'QA offline' }; };
    await card._reloadFromApi(); card._doRender();
    const retry = card.shadowRoot.querySelector('#retryDevices');
    assert.ok(retry, 'Household users need a read-only retry without triggering a scan');
    const calls = [];
    card._hass.callWS = async command => { calls.push(command.type); return { devices: card._integrationDevices }; };
    retry.click(); await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    assert.deepEqual(calls, ['ha_network_map/list_devices']);
    assert.equal(card.shadowRoot.querySelector('#retryDevices'), null);
  } finally { dom.window.close(); }
});
test('category override updates the device icon as well as its label', () => {
  const { dom, card } = fixture();
  try {
    const id = card.devices[0].preferenceId;
    card._devicePrefs[id] = { category: 'Camera' }; card._buildDeviceList();
    assert.equal(card.devices[0].category, 'Camera'); assert.equal(card.devices[0].icon, '📷');
    card.activeTab = 'topology'; card._doRender();
    assert.ok(card.shadowRoot.querySelector('[aria-label="QA 0"]').textContent.includes('📷'));
  } finally { dom.window.close(); }
});
