const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');

test('stable device ID keeps category and hidden choice when IP changes', () => {
  const dom = new JSDOM('', { runScripts: 'dangerously', url: 'http://localhost/' });
  try {
    dom.window.eval(readFileSync(join(__dirname, '..', 'custom_components/ha_network_map/www/ha-network-map.js'), 'utf8'));
    const card = dom.window.document.createElement('ha-network-map');
    const device = { key: 'old-ip', device_id: 'stable-id', name: 'Router', ip: '192.0.2.1', entity_ids: ['device_tracker.router'] };
    card._integrationDevices = [device];
    card._devicePrefs = { 'device:stable-id': { category: 'Computer', hidden: true } };
    card._buildDeviceList();
    assert.equal(card.devices.length, 0);
    card._showHidden = true;
    device.ip = '192.0.2.2';
    card._buildDeviceList();
    assert.equal(card.devices.length, 1);
    assert.equal(card.devices[0].category, 'Computer');
    assert.equal(card.devices[0].preferenceId, 'device:stable-id');
    assert.match(card._renderDeviceDetail(card.devices[0]), /config\/devices\/device\/stable-id/);
    assert.match(card._renderDeviceDetail(card.devices[0]), /config\/entities\/entity\/device_tracker.router/);
  } finally { dom.window.close(); }
});


test('device details have a native keyboard button and return focus on close', () => {
  const dom = new JSDOM('', { runScripts: 'dangerously', url: 'http://localhost/' });
  try {
    dom.window.eval(readFileSync(join(__dirname, '..', 'custom_components/ha_network_map/www/ha-network-map.js'), 'utf8'));
    const card = dom.window.document.createElement('ha-network-map');
    dom.window.document.body.appendChild(card);
    card._hass = { states: {}, user: { is_admin: false } };
    card.activeTab = 'devices';
    card._integrationDevices = [{ key: 'keyboard', device_id: 'keyboard', name: 'Keyboard router', ip: '192.0.2.1', entity_ids: [] }];
    card._buildDeviceList();
    card._doRender();
    const button = card.shadowRoot.querySelector('tbody button');
    assert.ok(button, 'Each device needs a native button reachable by Tab and activated by Enter/Space');
    assert.equal(button.disabled, false);
    assert.equal(button.tabIndex, 0);
    assert.match(button.textContent, /Keyboard router/);
    button.focus();
    button.click();
    assert.equal(card.selectedDevice.device_id, 'keyboard');
    assert.equal(card.shadowRoot.activeElement.id, 'cD');
    card.shadowRoot.querySelector('#cD').click();
    assert.equal(card.selectedDevice, null);
    assert.match(card.shadowRoot.activeElement.textContent, /Keyboard router/);
  } finally { dom.window.close(); }
});
