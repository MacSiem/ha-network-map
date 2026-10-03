const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');

function fixture() {
  const dom = new JSDOM('', { runScripts: 'dangerously', url: 'http://localhost/' });
  dom.window.eval(readFileSync(join(__dirname, '..', 'custom_components/ha_network_map/www/ha-network-map.js'), 'utf8'));
  const card = dom.window.document.createElement('ha-network-map');
  dom.window.document.body.append(card);
  card.setConfig({ title: 'Network QA', show_support: false });
  const commands = [];
  const hass = { states: {}, language: 'en', user: { id: 'qa-admin', is_admin: true },
    callWS: async command => { commands.push(command); throw Error('Unexpected request'); } };
  card._hass = hass;
  card._lang = 'en';
  card._firstHassRender = true;
  card._integrationDevices = [{ key: 'qa', name: 'QA device', ip: '192.0.2.1', entity_ids: [] }];
  card._buildDeviceList();
  card._doRender();
  card._lastRenderTime = Date.now();
  return { dom, card, hass, commands };
}

function draft(card, id, value) {
  const input = card.shadowRoot.getElementById(id);
  input.focus();
  input.value = value;
  input.dispatchEvent(new input.ownerDocument.defaultView.Event('input', { bubbles: true }));
  const current = card.shadowRoot.getElementById(id);
  current.setSelectionRange(1, 7, 'backward');
  return current;
}

function checkDraft(card, id, value) {
  const input = card.shadowRoot.getElementById(id);
  assert.equal(input.value, value);
  assert.equal(card.shadowRoot.activeElement, input);
  assert.deepEqual([input.selectionStart, input.selectionEnd, input.selectionDirection], [1, 7, 'backward']);
}

test('ordinary locale update during search editing translates immediately and retains the full selection', () => {
  const { dom, card, hass, commands } = fixture();
  try {
    draft(card, 'sI', 'QA locale');
    const rows = card.filteredDevices;
    card.sortBy = 'ip'; card.sortDesc = true;
    card.hass = { ...hass, language: 'pl' };
    assert.equal(card.shadowRoot.getElementById('sI').placeholder, card._t('searchPlaceholder'));
    checkDraft(card, 'sI', 'QA locale');
    assert.equal(card.filteredDevices, rows);
    assert.equal(card.sortBy, 'ip'); assert.equal(card.sortDesc, true);
    card.hass = hass;
    assert.equal(card.shadowRoot.getElementById('sI').placeholder, card._t('searchPlaceholder'));
    checkDraft(card, 'sI', 'QA locale');
    assert.equal(commands.length, 0);
  } finally { dom.window.close(); }
});

test('ordinary locale update is immediate during render throttle without API reads', () => {
  const { dom, card, hass, commands } = fixture();
  try {
    card.hass = { ...hass, language: 'pl' };
    assert.equal(card.shadowRoot.getElementById('rescanBtn').textContent.trim(), '🔄 Skanuj');
    assert.equal(commands.length, 0);
  } finally { dom.window.close(); }
});

test('role loss while editing disables scan immediately, retaining the draft, with no scan request', async () => {
  const { dom, card, hass, commands } = fixture();
  try {
    draft(card, 'sI', 'QA locale');
    hass.user.is_admin = false;
    card.hass = hass;
    assert.equal(card.shadowRoot.getElementById('rescanBtn').disabled, true);
    assert.ok(card.shadowRoot.textContent.includes(card._t('scanAdminRequired')));
    checkDraft(card, 'sI', 'QA locale');
    await card._scanAllSubnets();
    assert.equal(commands.length, 0);
  } finally { dom.window.close(); }
});

test('role changes during throttle synchronize the scan button while retaining the topology tab', () => {
  const { dom, card, hass, commands } = fixture();
  try {
    card.activeTab = 'topology'; card._doRender();
    for (const user of [undefined, { id: 'qa-household', is_admin: false }, hass.user]) {
      card.hass = { ...hass, user };
      for (const id of ['rescanBtn']) {
        assert.equal(card.shadowRoot.getElementById(id).disabled, user?.is_admin !== true);
      }
      assert.equal(card.activeTab, 'topology');
    }
    assert.equal(commands.length, 0);
  } finally { dom.window.close(); }
});

test('ordinary data updates still defer DOM replacement while search is being edited', () => {
  const { dom, card, hass, commands } = fixture();
  try {
    const input = draft(card, 'sI', 'QA locale');
    card._integrationDevices = [{ key: 'new', name: 'QA locale new device', ip: '192.0.2.2', entity_ids: [] }];
    card._lastRenderTime = 0;
    card.hass = { ...hass, states: { 'sensor.qa': { state: '2' } } };
    assert.equal(card.shadowRoot.getElementById('sI'), input);
    checkDraft(card, 'sI', 'QA locale');
    assert.equal(card.shadowRoot.textContent.includes('QA locale new device'), false);
    assert.equal(commands.length, 0);
  } finally { dom.window.close(); }
});

test('ordinary locale changes remain independent across two cards', () => {
  const first = fixture(); const second = fixture();
  try {
    draft(first.card, 'sI', 'QA locale');
    second.card.hass = { ...second.hass, language: 'pl', user: { id: 'qa-household', is_admin: false } };
    assert.equal(second.card.shadowRoot.getElementById('rescanBtn').textContent.trim(), '🔄 Skanuj');
    assert.equal(second.card.shadowRoot.getElementById('rescanBtn').disabled, true);
    assert.equal(first.card.shadowRoot.getElementById('sI').placeholder, 'Search devices...');
    checkDraft(first.card, 'sI', 'QA locale');
    assert.equal(first.commands.length + second.commands.length, 0);
  } finally { first.dom.window.close(); second.dom.window.close(); }
});
