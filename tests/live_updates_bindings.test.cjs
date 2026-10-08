const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');

const row = (name = 'QA router', ip = '192.0.2.1') => ({ key: 'qa', device_id: 'qa', name, ip, reachable: true, entity_ids: ['device_tracker.a'] });
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function fixture() {
  const dom = new JSDOM('', { runScripts: 'dangerously', url: 'http://localhost/' });
  let now = 10000, serial = 0;
  const timers = new Map(), callbacks = new Map(), calls = [];
  dom.window.Date.now = () => now;
  dom.window.setTimeout = (callback, delay = 0) => { timers.set(++serial, { callback, due: now + delay }); return serial; };
  dom.window.clearTimeout = id => timers.delete(id);
  dom.window.eval(readFileSync(join(__dirname, '..', 'custom_components/ha_network_map/www/ha-network-map.js'), 'utf8'));
  const card = dom.window.document.createElement('ha-network-map');
  dom.window.document.body.append(card);
  card.setConfig({ show_support: false });
  let payload = [row()];
  const connection = { subscribeEvents: async (callback, type) => { callbacks.set(type, callback); return () => callbacks.delete(type); } };
  const hass = { language: 'en', user: { id: 'qa-user', is_admin: false }, connection, states: {}, callWS: async command => {
    calls.push(command);
    if (command.type === 'config/device_registry/list') return [];
    assert.equal(command.type, 'ha_network_map/list_devices');
    return { devices: payload };
  } };
  const advance = async (ms = 5000) => {
    now += ms;
    for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback(); }
    await flush();
  };
  return { dom, card, hass, calls, callbacks, advance, setPayload: value => { payload = value; }, close: () => { card.remove(); dom.window.close(); } };
}

test('ordinary HA state updates read fresh canonical rows without reload or filter change', async () => {
  const f = fixture();
  try {
    f.card.hass = f.hass; await flush();
    assert.match(f.card.shadowRoot.querySelector('.card').textContent, /QA router/);
    f.setPayload([row('Renamed router', '192.0.2.2')]);
    f.card.hass = { ...f.hass, states: { 'device_tracker.a': { state: 'home', attributes: { ip: '192.0.2.2' } } } };
    await f.advance();
    assert.match(f.card.shadowRoot.querySelector('.card').textContent, /Renamed router/);
    assert.match(f.card.shadowRoot.querySelector('.card').textContent, /192\.0\.2\.2/);
    assert.equal(f.calls.filter(c => c.type.endsWith('/list_devices')).length, 2);
    assert.ok(f.calls.every(c => !c.type.endsWith('/scan')));
  } finally { f.close(); }
});

test('registry events refresh rows; state bursts are throttled and preserve search, page and focus', async () => {
  const f = fixture();
  try {
    f.setPayload(Array.from({ length: 65 }, (_, i) => ({ ...row(`QA router ${String(i).padStart(2, '0')}`), key: `qa${i}`, device_id: `qa${i}`, ip: `192.0.2.${i + 1}` })));
    f.card.hass = f.hass; await flush();
    f.card.searchQuery = 'QA'; f.card._currentPage = 3; f.card._filterSort(); f.card._doRender();
    const search = f.card.shadowRoot.querySelector('#sI'); search.focus(); search.setSelectionRange(0, 1, 'backward');
    const changed = f.card._integrationDevices.map(d => ({ ...d, name: d.name + ' fresh' }));
    f.setPayload(changed);
    for (let i = 0; i < 15; i++) f.card.hass = { ...f.hass, states: { [`sensor.qa${i}`]: { state: i } } };
    assert.equal(f.calls.filter(c => c.type.endsWith('/list_devices')).length, 1);
    await f.advance();
    assert.equal(f.calls.filter(c => c.type.endsWith('/list_devices')).length, 2);
    assert.equal(f.card._currentPage, 3); assert.equal(f.card.searchQuery, 'QA');
    assert.match(f.card.shadowRoot.querySelector('.card').textContent, /fresh/);
    assert.equal(f.card.shadowRoot.activeElement.id, 'sI');
    assert.equal(f.card.shadowRoot.activeElement.selectionDirection, 'backward');
    assert.ok(f.callbacks.has('device_registry_updated'));
    assert.ok(f.callbacks.has('entity_registry_updated'));
    f.setPayload(changed.map(d => ({ ...d, name: d.name + ' registry' })));
    f.callbacks.get('device_registry_updated')({ data: { action: 'update' } }); await f.advance();
    assert.match(f.card.shadowRoot.querySelector('.card').textContent, /registry/);
    f.card.remove(); await flush();
    assert.equal(f.callbacks.size, 0);
    const count = f.calls.length; await f.advance(); assert.equal(f.calls.length, count);
  } finally { f.close(); }
});

test('in-flight reads deduplicate and late replies cannot overwrite a new session or filter', async () => {
  const f = fixture();
  try {
    f.card.hass = f.hass; await flush();
    const pending = [];
    const callWS = command => new Promise((resolve, reject) => pending.push({ command, resolve, reject }));
    f.card._hass = { ...f.hass, callWS };
    const first = f.card._reloadFromApi(), duplicate = f.card._reloadFromApi();
    assert.equal(pending.length, 1);
    f.card._includeNonNetwork = true;
    const filtered = f.card._reloadFromApi(); assert.equal(pending.length, 2);
    pending[1].resolve({ devices: [row('New filter')] }); await filtered;
    pending[0].resolve({ devices: [row('Stale filter')] }); await first; await duplicate;
    assert.equal(f.card.devices[0].name, 'New filter');
    const oldSession = f.card._reloadFromApi();
    f.card.hass = { ...f.hass, user: { id: 'qa-other', is_admin: true }, states: {}, callWS };
    await f.advance();
    const latest = pending.at(-1); assert.notEqual(latest, pending[2]);
    latest.resolve({ devices: [row('New session')] }); await flush();
    pending[2].reject({ message: 'Old session error' }); await oldSession; await flush();
    assert.equal(f.card.devices[0].name, 'New session'); assert.equal(f.card._listError, false);
  } finally { f.close(); }
});

test('legacy aliases migrate once; rebind and unbind cannot resurrect the old entity', () => {
  const f = fixture();
  try {
    const foreign = { ...row('Foreign', '192.0.2.20'), key: 'foreign', device_id: 'foreign' };
    f.card._hass = { ...f.hass, states: { 'device_tracker.a': {}, 'device_tracker.b': {} } };
    f.card._bindings = { '192.0.2.1': 'device_tracker.a', 'QA router': 'device_tracker.a', '192.0.2.20': 'device_tracker.foreign', unknown: 'device_tracker.unknown' };
    f.card._devicePrefs = { 'device:qa': { category: 'Camera', hidden: true } };
    f.card._integrationDevices = [row(), foreign]; f.card._showHidden = true; f.card._buildDeviceList();
    f.card.selectedDevice = f.card.devices.find(d => d.device_id === 'qa'); f.card._doRender();
    f.dom.window.prompt = () => 'device_tracker.b'; f.card.shadowRoot.querySelector('#bindBtn').click();
    assert.equal(f.card.devices.find(d => d.device_id === 'qa').binding, 'device_tracker.b');
    f.card.selectedDevice = null; f.card.activeTab = 'bindings'; f.card._doRender();
    f.card.shadowRoot.querySelector('[data-unbind="device:qa"]').click();
    assert.equal(f.card.devices.find(d => d.device_id === 'qa').binding, null);
    const saved = JSON.parse(f.dom.window.localStorage.getItem('ha-tools-net-bindings'));
    assert.equal(saved['192.0.2.1'], undefined); assert.equal(saved['QA router'], undefined);
    assert.equal(saved['device:foreign'] || saved['192.0.2.20'], 'device_tracker.foreign'); assert.equal(saved.unknown, 'device_tracker.unknown');
    const reloaded = f.dom.window.document.createElement('ha-network-map'); reloaded._loadBindings();
    reloaded._integrationDevices = [{ ...row(), ip: '192.0.2.2' }, foreign]; reloaded._buildDeviceList();
    assert.equal(reloaded.devices.find(d => d.device_id === 'qa').binding, null);
    assert.deepEqual(JSON.parse(JSON.stringify(f.card._devicePrefs)), { 'device:qa': { category: 'Camera', hidden: true } });
  } finally { f.close(); }
});

test('aliases-only migration persists across IP changes and ambiguous names stay untouched', () => {
  const f = fixture();
  try {
    f.card._integrationDevices = [row()]; f.card._bindings = { '192.0.2.1': 'device_tracker.a' }; f.card._buildDeviceList();
    assert.equal(f.card._bindings['device:qa'], 'device_tracker.a'); assert.equal(f.card._bindings['192.0.2.1'], undefined);
    const reloaded = f.dom.window.document.createElement('ha-network-map'); reloaded._loadBindings(); reloaded._integrationDevices = [row('Renamed', '192.0.2.2')]; reloaded._buildDeviceList();
    assert.equal(reloaded.devices[0].binding, 'device_tracker.a');
    f.card._integrationDevices = [row('Shared'), { ...row('Shared', '192.0.2.20'), key: 'foreign', device_id: 'foreign' }];
    f.card._bindings = { Shared: 'device_tracker.ambiguous' }; f.card._buildDeviceList();
    assert.equal(f.card._bindings.Shared, 'device_tracker.ambiguous');
    assert.equal(f.card._bindings['device:qa'], undefined); assert.equal(f.card._bindings['device:foreign'], undefined);
  } finally { f.close(); }
});
