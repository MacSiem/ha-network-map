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

for (const language of ['en', 'pl']) {
  const completed = { queued: false, last_scan_started_at: 100, last_scan_finished_at: 101, device_count: 1, with_ip: 1, reachable: 0 };
  for (const [name, response, expected] of [
    ['completed with unreachable device', completed, 'success'],
    ['empty discovered scope', { ...completed, device_count: 0, with_ip: 0 }, 'no_data'],
    ['queued with old timestamp', { ...completed, queued: true }, 'unconfirmed'],
    ['missing', null, 'unconfirmed'],
    ['malformed', {}, 'unconfirmed'],
    ['unfinished', { ...completed, last_scan_finished_at: 99 }, 'unconfirmed'],
    ['missing counts', { queued: false, last_scan_started_at: 100, last_scan_finished_at: 101 }, 'unconfirmed'],
  ]) {
    test(`scan result ${name} in ${language}`, async () => {
      const { dom, card } = fixture(true, language);
      try {
        const calls = [];
        card._hass.callWS = async request => { calls.push(request.type); return request.type.endsWith('/scan') ? response : { devices: card._integrationDevices }; };
        await card._scanAllSubnets();
        assert.equal(card.shadowRoot.querySelector('#scanActionResult [data-result-state]').dataset.resultState, expected);
        assert.ok(card.shadowRoot.querySelector('#scanActionResult').textContent.includes(({ success: ['Success', 'Sukces'], no_data: ['No data', 'Brak danych'], unconfirmed: ['Unconfirmed', 'Niepotwierdzony'] })[expected][language === 'pl' ? 1 : 0]));
        assert.deepEqual(calls, ['ha_network_map/scan', 'ha_network_map/list_devices']);
        if (expected === 'unconfirmed') assert.equal(card._lastScanTime, null);
      } finally { dom.window.close(); }
    });
  }
  for (const code of ['unknown_command', 'unauthorized', 'scan_failed', 'unknown', undefined]) {
    test(`scan rejection ${code} hides technical messages in ${language}`, async () => {
      const { dom, card } = fixture(true, language);
      try {
        let calls = 0;
        card._hass.callWS = async () => { calls++; throw { code, message: 'RAW_SCAN_SECRET', body: { message: 'RAW_SCAN_SECRET' } }; };
        await card._scanAllSubnets();
        assert.equal(card.shadowRoot.textContent.includes('RAW_SCAN_SECRET'), false);
        assert.equal(card.shadowRoot.querySelector('#scanActionResult [data-result-state]').dataset.resultState, ['unknown_command', 'unauthorized'].includes(code) ? 'error' : 'unconfirmed');
        assert.equal(calls, 1);
      } finally { dom.window.close(); }
    });
  }
  test(`completed scan with rejected device read is partial in ${language}`, async () => {
    const { dom, card } = fixture(true, language);
    try {
      card._hass.callWS = async request => {
        if (request.type.endsWith('/scan')) return completed;
        throw { code: 'list_failed', message: 'RAW_LIST_SECRET' };
      };
      await card._scanAllSubnets();
      assert.equal(card.shadowRoot.querySelector('#scanActionResult [data-result-state]').dataset.resultState, 'partial');
      assert.ok(card.shadowRoot.querySelector('#scanActionResult').textContent.includes(language === 'pl' ? 'Częściowo' : 'Partial'));
      assert.ok(card.shadowRoot.querySelector('#retryDevices'));
      assert.equal(card.shadowRoot.textContent.includes('RAW_LIST_SECRET'), false);
    } finally { dom.window.close(); }
  });
}

test('a pending device read does not present the scan as success', async () => {
  const { dom, card } = fixture(true);
  try {
    let finishRead;
    card._hass.callWS = async request => request.type.endsWith('/scan')
      ? { queued: false, last_scan_started_at: 100, last_scan_finished_at: 101, device_count: 1, with_ip: 1, reachable: 0 }
      : new Promise(resolve => { finishRead = resolve; });
    const pending = card._scanAllSubnets();
    await Promise.resolve(); await Promise.resolve();
    card._doRender();
    assert.equal(card.shadowRoot.querySelector('#scanActionResult [data-result-state]').dataset.resultState, 'not_checked');
    finishRead({ devices: card._integrationDevices }); await pending;
    assert.equal(card._scanAction.state, 'success');
  } finally { dom.window.close(); }
});

test('late scan response after a context boundary cannot read devices or apply success', async () => {
  const { dom, card } = fixture(true);
  try {
    let finishScan;
    const calls = [];
    card._hass.callWS = request => { calls.push(request.type); return new Promise(resolve => { finishScan = resolve; }); };
    const pending = card._scanAllSubnets();
    card._comparisonBoundary('connection');
    finishScan({ queued: false, last_scan_started_at: 100, last_scan_finished_at: 101, device_count: 1, with_ip: 1, reachable: 0 });
    await pending;
    assert.deepEqual(calls, ['ha_network_map/scan']);
    assert.equal(card._scanAction.state, 'unconfirmed');
    assert.equal(card._lastScanTime, null);
  } finally { dom.window.close(); }
});
