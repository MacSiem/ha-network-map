const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { JSDOM } = require('jsdom');
const source = readFileSync('custom_components/ha_network_map/www/ha-network-map.js', 'utf8');
function fixture() {
  const dom = new JSDOM('', { runScripts: 'dangerously', url: 'http://localhost/' });
  dom.window.eval(source);
  const card = dom.window.document.createElement('ha-network-map');
  dom.window.document.body.append(card);
  card._hass = { language: 'en', user: { is_admin: false }, states: {} };
  return { dom, card };
}
test('tracker names remain literal text in the actual bindings DOM', () => {
  const { dom, card } = fixture();
  try {
    const name = '</option></select><img data-injected="tracker"><select><option>';
    card._hass.states['device_tracker.qa'] = { attributes: { friendly_name: name } };
    card.activeTab = 'bindings'; card._doRender();
    assert.equal(card.shadowRoot.querySelector('[data-injected]'), null);
    const option = card.shadowRoot.querySelector('#deviceSelect option[value="device_tracker.qa"]');
    assert.equal(option.textContent, name);
  } finally { dom.window.close(); }
});
test('dashboard title stays literal in the actual card header', () => {
  const { dom, card } = fixture();
  try {
    const title = '<img data-injected="title"> & "Network"';
    card.setConfig({ title }); card._doRender();
    assert.equal(card.shadowRoot.querySelector('[data-injected]'), null);
    assert.equal(card.shadowRoot.querySelector('.card-header').textContent, '📡 ' + title);
  } finally { dom.window.close(); }
});
test('untrusted stored category cannot create DOM elements or break category controls', () => {
  const { dom, card } = fixture();
  try {
    dom.window.localStorage.setItem('ha-network-map-device-prefs', JSON.stringify({ 'device:qa': { category: '"></option></select><img data-injected="category">', hidden: false } }));
    card._loadDevicePrefs();
    card._integrationDevices = [{ key: 'qa', device_id: 'qa', name: 'Camera', ip: '192.0.2.1' }];
    card._buildDeviceList(); card._doRender();
    assert.equal(card.shadowRoot.querySelector('[data-injected]'), null);
    assert.equal(card.devices[0].category, 'Camera');
    assert.ok(card.shadowRoot.querySelector('#cF'));
  } finally { dom.window.close(); }
});
test('malformed stored bindings cannot become a non-object map', () => {
  const { dom, card } = fixture();
  try {
    for (const value of [null, [], 'invalid', 42]) {
      dom.window.localStorage.setItem('ha-tools-net-bindings', JSON.stringify(value));
      card._loadBindings(); card.activeTab = 'bindings';
      assert.doesNotThrow(() => card._doRender());
      assert.equal(Object.keys(card._bindings).length, 0);
    }
  } finally { dom.window.close(); }
});
