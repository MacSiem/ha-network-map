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

for (const language of ['en', 'pl']) test(`records retain every wide cell and expose actual name/state first (${language})`, async () => {
  const f = await setup(language);
  try {
    const expected = Array.from(f.table().tBodies[0].rows, row => Array.from(row.cells, cell => cell.textContent));
    const headers = Array.from(f.table().tHead.rows[0].cells, cell => cell.textContent.trim());
    const before = f.requests.length;
    f.resize(499.5);
    assert.equal(f.table().parentElement.hidden, true);
    assert.equal(f.root.querySelector('.ht-device-records').hidden, false);
    assert.equal(f.records().length, 3);
    f.records().forEach((record, i) => {
      const summary = record.querySelector('summary');
      assert.equal(summary.firstElementChild.textContent, f.names[i]);
      assert.ok(summary.lastElementChild.textContent.trim());
      assert.deepEqual(Array.from(record.querySelectorAll('dt'), node => node.textContent), headers);
      assert.deepEqual(Array.from(record.querySelectorAll('dd'), node => node.textContent), expected[i]);
      assert.equal(record.open, false); record.open = true;
      assert.equal(record.querySelectorAll('dd').length, network ? 7 : 5);
    });
    assert.equal(f.records()[2].querySelector('summary').lastElementChild.textContent,
      network ? f.card._t('unknownStatus') : f.card._t('unknown').toUpperCase());
    assert.equal(f.records()[1].querySelector('summary').lastElementChild.textContent,
      network ? f.card._t('unreachableStatus') : f.card._t('unavailable').toUpperCase());
    assert.equal(f.requests.length, before);
    f.resize(500);
    assert.equal(f.table().parentElement.hidden, false);
    assert.equal(f.root.querySelector('.ht-device-records').hidden, true);
    assert.deepEqual(Array.from(f.table().tBodies[0].rows, row => Array.from(row.cells, cell => cell.textContent)), expected);
    assert.equal(f.root.querySelector('safe'), null, 'Names remain text, never markup');
  } finally { f.dom.window.close(); }
});

test('resize preserves real nodes, expanded details, focused controls, source selection and search caret without reads/rebuilds', async () => {
  const f = await setup();
  try {
    const before = f.requests.length, table = f.table(), search = f.search();
    const state = network ? f.card.devices : f.card._deviceRegistry;
    f.resize(390); const record = f.records()[0]; record.open = true; record.querySelector('summary').focus();
    f.resize(900); assert.equal(f.table(), table); assert.ok(f.root.activeElement);
    assert.equal(f.root.activeElement.closest('[hidden]'), null, 'Focus is transferred before its representation is hidden');
    f.resize(320); assert.equal(f.records()[0], record); assert.equal(record.open, true);
    search.focus(); search.value = 'uncommitted draft'; search.setSelectionRange(2, 7, 'backward');
    f.resize(500); f.resize(499);
    assert.equal(f.search(), search); assert.equal(f.root.activeElement, search);
    assert.deepEqual([search.value, search.selectionStart, search.selectionEnd, search.selectionDirection], ['uncommitted draft', 2, 7, 'backward']);
    assert.equal(network ? f.card.devices : f.card._deviceRegistry, state);
    assert.equal(f.requests.length, before);
  } finally { f.dom.window.close(); }
});

test('native details and focus survive an ordinary render; obsolete observer cannot change replacements', async () => {
  const f = await setup();
  try {
    f.resize(390); const record = f.records()[1]; record.open = true; record.querySelector('summary').focus();
    const oldObserver = f.observer(); f.render();
    assert.equal(oldObserver.disconnected, true);
    assert.equal(f.records()[1].open, true); assert.equal(f.root.activeElement, f.records()[1].querySelector('summary'));
    oldObserver.deliver(900); assert.equal(f.table().parentElement.hidden, true);
    f.resize(900); assert.equal(f.table().parentElement.hidden, false);
  } finally { f.dom.window.close(); }
});

test('original sorting, filtering and pagination stay usable from narrow records', async () => {
  const f = await setup();
  try {
    f.resize(390); const before = f.requests.length;
    const sort = f.root.querySelector('.ht-record-sorts button'); sort.focus(); sort.click();
    assert.equal(f.records()[0].querySelector('summary').firstElementChild.textContent, f.names[2]);
    assert.equal(f.root.activeElement.closest('.ht-record-sorts') !== null, true);
    let search = f.search(); search.value = 'Alpha'; search.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
    assert.equal(f.records().length, 1); assert.equal(f.records()[0].querySelector('summary').firstElementChild.textContent, f.names[0]);
    search = f.search(); search.value = ''; search.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
    f.card._pageSize = 1; f.render();
    f.root.querySelector(network ? '#page-next' : '.pagination-next').click();
    assert.equal(f.records().length, 1); assert.equal(f.records()[0].querySelector('summary').firstElementChild.textContent, f.names[1]);
    assert.equal(f.requests.length, before);
  } finally { f.dom.window.close(); }
});

test('all four navigation options remain and records observer detaches on navigation/removal', async () => {
  const f = await setup();
  try {
    f.resize(390); const old = f.observer(), before = f.requests.length;
    const picker = f.root.querySelector('#ha-tools-tab-picker');
    assert.deepEqual(Array.from(picker.options, node => node.value), tabs);
    f.root.querySelector('.tabs button[data-tab="' + tabs[1] + '"]').click();
    assert.equal(old.disconnected, true); old.deliver(200);
    f.root.querySelector('.tabs button[data-tab="devices"]').click(); f.resize(390);
    const current = f.observer(); f.card.remove(); assert.equal(current.disconnected, true);
    current.deliver(900); assert.equal(f.table().parentElement.hidden, true);
    f.dom.window.document.body.append(f.card); f.render(); f.resize(500);
    assert.notEqual(f.observer(), current); assert.equal(f.table().parentElement.hidden, false);
    // Device's reconnect registry lifecycle is independently allowed; resize/navigation before detach are read-free.
    assert.ok(f.requests.length >= before);
  } finally { f.dom.window.close(); }
});

test('missing ResizeObserver retains complete original wide controls and data', async () => {
  const f = await setup('en', false);
  try {
    assert.equal(f.table().parentElement.hidden, false);
    assert.equal(f.table().tBodies[0].rows.length, 3);
    assert.equal(f.table().tBodies[0].rows[0].cells.length, network ? 7 : 5);
    assert.ok(f.table().tHead.querySelector('button'));
  } finally { f.dom.window.close(); }
});

test('record action uses original details, more-info, category/hide/bind handlers and returns focus to the visible record', async () => {
  const f = await setup();
  try {
    f.resize(390); let record = f.records()[0]; record.open = true;
    const action = record.querySelector('.device-detail-button'); assert.ok(action); action.focus(); action.click();
    assert.equal(f.card.selectedDevice.device_id, 'device-0'); assert.equal(f.root.activeElement.id, 'cD');
    assert.equal(f.root.querySelector('#rescanBtn').disabled, true, 'Viewer scan guard remains in force');
    assert.ok(f.root.querySelector('#deviceCategory')); assert.ok(f.root.querySelector('#hideDevice')); assert.ok(f.root.querySelector('#bindBtn'));
    assert.equal(f.root.querySelector('#dD a').getAttribute('href'), '/config/devices/device/device-0');
    let entity = null; f.card.addEventListener('hass-more-info', event => { entity = event.detail.entityId; });
    f.root.querySelector('#openEntity').click(); assert.equal(entity, 'device_tracker.alpha');
    const selection = f.card.selectedDevice, before = f.requests.length, detail = f.root.querySelector('#dD');
    f.resize(900); f.resize(390); assert.equal(f.card.selectedDevice, selection); assert.equal(f.root.querySelector('#dD'), detail); assert.equal(f.requests.length, before);
    f.root.querySelector('#cD').click();
    assert.equal(f.card.selectedDevice, null); assert.equal(f.root.activeElement.closest('[hidden]'), null);
    assert.equal(f.root.activeElement.closest('details'), f.records()[0]); assert.equal(f.records()[0].open, true);
    f.records()[2].open = true; f.records()[2].querySelector('.device-detail-button').click();
    assert.equal(f.root.querySelector('#bindBtn'), null, 'Unmeasured device cannot gain the reachable-only bind action');
    assert.match(f.root.querySelector('#dD').textContent, /Not measured/);
  } finally { f.dom.window.close(); }
});
