const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');
// These deliveries specify ResizeObserver behavior, not pixel geometry.
// No getBoundingClientRect/CSS geometry mocks. Native layout/44px/zoom stays OPEN.
const network = true;
const entry = "custom_components/ha_network_map/www/ha-network-map.js";
const tabs = ["devices", "topology", "comparison", "bindings"];
async function setup(language = 'en', observerAvailable = true) {
  const dom = new JSDOM('', { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
  const observers = [], requests = [];
  if (observerAvailable) dom.window.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    deliver(width) { this.callback([{ target: this.target, contentRect: { width } }]); }
  };
  dom.window.eval(readFileSync(join(__dirname, '..', entry), 'utf8'));
  const card = dom.window.document.createElement(network ? 'ha-network-map' : 'ha-device-health');
  card.setConfig({ show_support: false }); dom.window.document.body.append(card);
  const names = ['Alpha router with a long readable name <safe>', 'Beta unavailable', 'Gamma unknown'];
  const registry = names.map((name, i) => ({ id: 'device-' + i, name, model: 'Model ' + i }));
  const entities = [{ entity_id: 'binary_sensor.alpha_connection', device_id: 'device-0' }, { entity_id: 'sensor.beta', device_id: 'device-1' }];
  const states = {
    'binary_sensor.alpha_connection': { entity_id: 'binary_sensor.alpha_connection', state: 'on', last_changed: '2026-10-01T12:00:00Z', attributes: { device_class: 'connectivity' } },
    'sensor.beta': { entity_id: 'sensor.beta', state: 'unavailable', last_changed: '2026-10-02T12:00:00Z', attributes: {} },
    'device_tracker.alpha': { entity_id: 'device_tracker.alpha', state: 'home', attributes: { source_type: 'router' } }
  };
  const hass = { language, user: { id: 'w3-viewer', is_admin: false }, connection: { connected: true }, states,
    callWS: async message => { requests.push(message); return message.type === 'config/device_registry/list' ? registry : message.type === 'config/entity_registry/list' ? entities : []; } };
  if (network) {
    card._hass = hass; card._lang = language;
    card._integrationDevices = names.map((name, i) => ({ key: 'device-' + i, device_id: 'device-' + i, name, ip: i === 2 ? null : '192.0.2.' + (i + 1), mac: '02:00:00:00:00:0' + i, manufacturer: 'Maker ' + i, model: 'Model ' + i, reachable: i === 0 ? true : i === 1 ? false : null, entity_ids: i === 0 ? ['device_tracker.alpha'] : [] }));
    card._bindings = { 'device:device-0': 'device_tracker.alpha' }; card._buildDeviceList(); card._doRender();
  } else { card.hass = hass; await card._registryLoading; card._render(); }
  const root = card.shadowRoot;
  const render = () => { if (network) { card._lastHtml = ''; card._doRender(); } else card._render(); };
  const observer = () => observers.findLast(item => !item.disconnected && item.target === root.querySelector('.ht-device-layout'));
  const resize = width => { assert.ok(observer(), 'Inventory observes its own available container'); observer().deliver(width); };
  const records = () => Array.from(root.querySelectorAll('.ht-device-records > details'));
  const table = () => root.querySelector('table[data-device-records]');
  const search = () => root.querySelector(network ? '#sI' : '.search-box');
  return { dom, card, root, hass, requests, names, observers, observer, resize, render, records, table, search };
}


// Source-review supplement, written AFTER runtime. Not part of the tests-first claim.
test('resize moves original sort controls and restores an action/summary from either direction without hidden focus', async () => {
  const f = await setup();
  try {
    const buttons = Array.from(f.table().tHead.querySelectorAll('button'));
    const before = f.requests.length;
    buttons.at(-1).focus(); f.resize(390);
    assert.deepEqual(Array.from(f.root.querySelectorAll('.ht-record-sorts button')), buttons);
    assert.equal(f.root.activeElement, buttons.at(-1));
    f.resize(900); assert.equal(f.root.activeElement, buttons.at(-1));
    assert.deepEqual(Array.from(f.table().tHead.querySelectorAll('button')), buttons);
    if (network) {
      const action = f.table().tBodies[0].rows[0].querySelector('button'); action.focus();
      f.resize(390); assert.equal(f.root.activeElement, action); assert.equal(f.records()[0].open, true);
      f.resize(900); assert.equal(f.root.activeElement, action); assert.equal(action.closest('[hidden]'), null);
    } else {
      f.resize(390); f.records()[0].querySelector('summary').focus(); f.resize(900); f.resize(390);
      assert.equal(f.root.activeElement, f.records()[0].querySelector('summary'));
    }
    assert.equal(f.requests.length, before);
  } finally { f.dom.window.close(); }
});

test('search caret and opened record survive committed input and repaint in narrow mode', async () => {
  const f = await setup();
  try {
    f.resize(390); f.records()[0].open = true;
    let field = f.search(); field.focus(); field.value = 'Alpha'; field.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
    field = f.search(); field.focus(); field.setSelectionRange(1, 4, 'backward');
    f.render(); f.resize(900); f.resize(390);
    assert.equal(f.search().value, 'Alpha'); assert.equal(f.root.activeElement, f.search());
    assert.deepEqual([f.search().selectionStart, f.search().selectionEnd, f.search().selectionDirection], [1, 4, 'backward']);
    assert.equal(f.records()[0].open, true);
    assert.equal(f.records().length, 1);
  } finally { f.dom.window.close(); }
});

test('narrow original actions really update the same stable category, binding and hidden preference', async () => {
  const f = await setup();
  try {
    f.resize(390); f.records()[0].open = true; f.records()[0].querySelector('.device-detail-button').click();
    const before = f.requests.length;
    const category = f.root.querySelector('#deviceCategory'); category.value = 'Computer';
    category.dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
    assert.equal(f.card._devicePrefs['device:device-0'].category, 'Computer');
    assert.equal(f.card.selectedDevice.preferenceId, 'device:device-0');
    f.hass.states['device_tracker.rebound'] = { entity_id: 'device_tracker.rebound', state: 'home', attributes: {} };
    f.dom.window.prompt = () => 'device_tracker.rebound'; f.root.querySelector('#bindBtn').click();
    assert.equal(f.card._bindings['device:device-0'], 'device_tracker.rebound');
    assert.match(f.records()[0].textContent, /device_tracker.rebound/);
    f.root.querySelector('#hideDevice').click();
    assert.equal(f.card._devicePrefs['device:device-0'].hidden, true);
    assert.equal(f.records().length, 2); assert.equal(f.card.selectedDevice, null);
    f.root.querySelector('#showHidden').labels[0].click();
    assert.equal(f.records().length, 3); assert.equal(f.requests.length, before);
    assert.equal(f.root.querySelector('#rescanBtn').disabled, true);
    f.hass.connection.connected = false; f.render();
    assert.equal(f.root.querySelector('#rescanBtn').disabled, true);
  } finally { f.dom.window.close(); }
});
