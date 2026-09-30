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


test('entity details open HA more-info for state-only entities without a registry entry', () => {
  const dom = new JSDOM('', { runScripts: 'dangerously', url: 'http://localhost/' });
  try {
    dom.window.eval(readFileSync(join(__dirname, '..', 'custom_components/ha_network_map/www/ha-network-map.js'), 'utf8'));
    const card = dom.window.document.createElement('ha-network-map');
    dom.window.document.body.appendChild(card);
    card._hass = { states: { 'device_tracker.state_only': { state: 'home' } }, user: { is_admin: false } };
    card.activeTab = 'devices';
    card._integrationDevices = [{ key: 'state-only', name: 'State only tracker', mac: '02:00:00:00:00:01', entity_ids: ['device_tracker.state_only'] }];
    card._buildDeviceList();
    card.selectedDevice = card.devices[0];
    card._doRender();
    let event = null;
    dom.window.document.body.addEventListener('hass-more-info', e => { event = e; });
    const button = card.shadowRoot.querySelector('#openEntity');
    assert.ok(button, 'State-only entities must use HA more-info, not a non-existent configuration editor');
    button.click();
    assert.equal(event?.detail.entityId, 'device_tracker.state_only');
    assert.equal(event.composed, true);
    assert.equal(event.bubbles, true);
  } finally { dom.window.close(); }
});
