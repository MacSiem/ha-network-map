const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');

function fixture(isAdmin, language = 'en') {
  const dom = new JSDOM('', { runScripts: 'dangerously', url: 'http://localhost/' });
  dom.window.eval(readFileSync(join(__dirname, '..', 'custom_components/ha_network_map/www/ha-network-map.js'), 'utf8'));
  const card = dom.window.document.createElement('ha-network-map');
  card.setConfig({ title: 'Network QA' });
  card._hass = { states: {}, language, user: { is_admin: isAdmin } };
  card._lang = language;
  card.activeTab = 'devices';
  card._integrationDevices = [{ key: 'qa', name: 'QA device', ip: '192.0.2.1', entity_ids: [] }];
  card._buildDeviceList();
  return { dom, card };
}

for (const [language, message] of [
  ['en', 'Only an administrator can start a network scan.'],
  ['pl', 'Tylko administrator może uruchomić skanowanie sieci.'],
]) {
  test(`normal user sees existing devices and disabled scan with guidance in ${language}`, () => {
    const { dom, card } = fixture(false, language);
    try {
      card._doRender();
      assert.equal(card.shadowRoot.querySelector('#rescanBtn').disabled, true);
      assert.ok(card.shadowRoot.textContent.includes(message));
      assert.ok(card.shadowRoot.textContent.includes('QA device'));
    } finally { dom.window.close(); }
  });
}

test('direct scan invocation by a normal user makes no server request', async () => {
  const { dom, card } = fixture(false);
  try {
    let calls = 0;
    card._hass.callWS = async () => { calls++; return {}; };
    card._reloadFromApi = async () => {};
    await card._scanAllSubnets();
    assert.equal(calls, 0);
    assert.equal(card._scanInProgress, false);
  } finally { dom.window.close(); }
});

test('administrator retains enabled scan and exactly one server scan request', async () => {
  const { dom, card } = fixture(true);
  try {
    const commands = [];
    card._hass.callWS = async request => { commands.push(request.type); return {}; };
    card._reloadFromApi = async () => {};
    card._doRender();
    assert.equal(card.shadowRoot.querySelector('#rescanBtn').disabled, false);
    await card._scanAllSubnets();
    assert.deepEqual(commands, ['ha_network_map/scan']);
  } finally { dom.window.close(); }
});

test('scan stays disabled before user permissions are known', () => {
  const { dom, card } = fixture(undefined);
  try {
    delete card._hass.user;
    card._doRender();
    assert.equal(card.shadowRoot.querySelector('#rescanBtn').disabled, true);
  } finally { dom.window.close(); }
});
