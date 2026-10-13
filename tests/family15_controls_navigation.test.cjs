const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');
// ResizeObserver delivery is simulated only to specify threshold/lifecycle behavior.
// No layout API is mocked: real hitboxes, wrapping, zoom and native select geometry
// remain a separate Chrome acceptance check.
const tabs = ['devices', 'topology', 'comparison', 'bindings'];
async function setup(language = 'en', observerAvailable = true) {
  const dom = new JSDOM('', { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
  const observers = [], requests = [];
  if (observerAvailable) dom.window.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    deliver(width) { this.callback([{ target: this.target, contentRect: { width } }]); }
  };
  dom.window.eval(readFileSync(join(__dirname, '..', 'custom_components/ha_network_map/www/ha-network-map.js'), 'utf8'));
  const card = dom.window.document.createElement('ha-network-map');
  card.setConfig({ show_support: false });
  dom.window.document.body.append(card);
  const hass = { language, user: { id: 'family-viewer', is_admin: false }, connection: { connected: true }, states: { 'device_tracker.family': { state: 'home', attributes: { friendly_name: 'Family tracker' } } },
    callWS: async message => { requests.push(message); return []; } };
  card._hass = hass; card._lang = language; card._integrationDevices = [{ key: 'family-device', device_id: 'family-device', name: 'Family router', ip: '192.0.2.1', entity_ids: ['device_tracker.family'], reachable: true }]; card._buildDeviceList(); card._doRender();
  const root = card.shadowRoot;
  const render = () => { card._lastHtml = ''; card._doRender(); };
  const activeTab = () => card.activeTab;
  const picker = () => root.querySelector('#ha-tools-tab-picker');
  const observer = () => observers.findLast(item => !item.disconnected && item.target === root.querySelector('.tabs').parentElement);
  const resize = width => {
    const style = dom.window.getComputedStyle(root.querySelector('.tabs'));
    // Delivery width is the observed parent's content box; threshold uses nav content.
    observer().deliver(width + (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0));
  };
  return { dom, card, hass, root, requests, observers, render, activeTab, picker, observer, resize };
}

for (const language of ['en', 'pl']) test(`all existing tabs share their original handlers in ${language}`, async () => {
  const f = await setup(language);
  try {
    assert.ok(f.picker(), 'A complete native select must exist for narrow cards');
    assert.equal(f.picker().labels[0].textContent, language === 'pl' ? 'Zakładka' : 'Tab');
    const options = () => Array.from(f.picker().options, option => option.value);
    assert.deepEqual(options(), tabs);
    f.resize(240);
    const before = f.requests.length;
    for (const tab of tabs) {
      f.picker().focus(); f.picker().value = tab;
      f.picker().dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
      assert.equal(f.activeTab(), tab);
      assert.equal(f.dom.window.location.hash, '#' + f.card._toolId + '/' + tab, 'Original navigation URL handler is retained');
      assert.equal(f.picker().value, tab);
      assert.deepEqual(options(), tabs, 'No arbitrary removal of less-used views');
      assert.equal(f.root.activeElement, f.picker());
      assert.equal(f.root.querySelector('.tabs').hidden, true);
      assert.equal(f.root.querySelector('.tabs button.active').dataset.tab, tab);
    }
    assert.equal(f.requests.length, before, 'Viewer navigation adds no scan, history read or write');
  } finally { f.dom.window.close(); }
});

test('container threshold transfers navigation focus without replacing content or changing selection', async () => {
  const f = await setup();
  try {
    const nav = f.root.querySelector('.tabs');
    const active = nav.querySelector('button.active'); active.focus();
    const before = f.requests.length, selection = f.activeTab();
    f.resize(280); assert.equal(nav.hidden, false); assert.equal(f.picker().parentElement.hidden, true);
    f.resize(279); assert.equal(nav.hidden, true); assert.equal(f.root.activeElement, f.picker());
    f.resize(900); assert.equal(nav.hidden, false); assert.equal(f.root.activeElement, active);
    assert.equal(f.activeTab(), selection); assert.equal(f.requests.length, before);
  } finally { f.dom.window.close(); }
});

test('ordinary render keeps narrow selection/focus and ignores obsolete observer delivery', async () => {
  const f = await setup();
  try {
    f.resize(240); f.picker().focus();
    const obsolete = f.observer(), selected = f.activeTab();
    f.render();
    assert.equal(obsolete.disconnected, true);
    assert.equal(f.picker().value, selected); assert.equal(f.root.activeElement, f.picker());
    assert.equal(f.root.querySelector('.tabs').hidden, true);
    obsolete.deliver(1200);
    assert.equal(f.root.querySelector('.tabs').hidden, true, 'Detached observed container cannot affect its replacement');
  } finally { f.dom.window.close(); }
});

test('effective disconnectedCallback cleans the observer and stale callbacks cannot affect a reattached card', async () => {
  const f = await setup();
  try {
    f.resize(240); const obsolete = f.observer();
    f.card.remove(); assert.equal(obsolete.disconnected, true);
    obsolete.deliver(900);
    assert.equal(f.root.querySelector('.tabs').hidden, true);
    f.dom.window.document.body.append(f.card);
    f.render(); f.resize(240);
    const current = f.observer(); assert.notEqual(current, obsolete);
    obsolete.deliver(900); assert.equal(f.root.querySelector('.tabs').hidden, true);
    f.resize(900); assert.equal(f.root.querySelector('.tabs').hidden, false);
  } finally { f.dom.window.close(); }
});

test('without ResizeObserver all native navigation options remain available', async () => {
  const f = await setup('en', false);
  try {
    assert.equal(f.root.querySelector('.tabs').hidden, false);
    assert.equal(f.picker().parentElement.hidden, false);
    assert.deepEqual(Array.from(f.picker().options, item => item.value), tabs);
    f.picker().focus(); f.picker().value = tabs[1];
    f.picker().dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
    assert.equal(f.root.activeElement, f.picker(), 'Visible fallback picker retains focus after navigation');
  } finally { f.dom.window.close(); }
});

function nativeName(field) {
  return field.getAttribute('aria-label') || field.getAttribute('aria-labelledby') ||
    Array.from(field.labels || [], label => label.textContent.trim()).join(' ');
}

test('all currently served view controls have native names and checkboxes use real labels', async () => {
  const f = await setup();
  try {
    for (const tab of tabs) {
      f.root.querySelector(`.tabs button[data-tab="${tab}"]`).click();

      for (const field of f.root.querySelectorAll('input,select,textarea')) {
        assert.ok(nativeName(field), `Named control in ${tab}: ${field.outerHTML}`);
        if (field.type === 'checkbox') assert.ok(field.labels.length, 'Native label must forward pointer activation');
      }
    }
  } finally { f.dom.window.close(); }
});

test('actual search draft and caret survive an ordinary repaint and container change', async () => {
  const f = await setup();
  try {
    let field = f.root.getElementById('sI'); field.focus(); field.value = 'Family';
    field.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
    field = f.root.getElementById('sI'); field.focus(); field.setSelectionRange(1, 4, 'backward');
    f.resize(240); f.render(); field = f.root.getElementById('sI');
    assert.equal(field.value, 'Family'); assert.equal(f.root.activeElement, field);
    assert.deepEqual([field.selectionStart, field.selectionEnd, field.selectionDirection], [1, 4, 'backward']);
    const showHidden = f.root.getElementById('showHidden');
    showHidden.labels[0].click();
    assert.equal(f.card._showHidden, true, 'Clicking the native checkbox label uses its original change handler');
  } finally { f.dom.window.close(); }
});

test('network editor associates its visible labels with real inputs', async () => {
  const f = await setup('pl');
  try {
    const editor = f.dom.window.document.createElement('ha-network-map-editor');
    editor.setConfig({ title: 'Family', router_ip: '192.0.2.1' }); editor.hass = f.hass;
    f.dom.window.document.body.append(editor);
    for (const input of editor.shadowRoot.querySelectorAll('input')) assert.ok(input.labels.length);
  } finally { f.dom.window.close(); }
});


test('optional support dismiss stays named and removes only its own footer', async () => {
  const f = await setup();
  try {
    f.card._hass = { ...f.hass, user: { id: 'family-admin', is_admin: true } };
    f.card.setConfig({ show_support: true }); f.render();
    const dismiss = f.root.querySelector('.support-dismiss'); assert.ok(dismiss);
    assert.ok(dismiss.getAttribute('aria-label'));
    assert.ok(f.root.querySelector('.donate-section[data-source="own-card"] a[href]'));
    dismiss.click();
    assert.equal(f.root.querySelector('.donate-section[data-source="own-card"]'), null);
    assert.deepEqual(Array.from(f.picker().options, option => option.value), tabs);
    f.card._hass = f.hass; f.render();
    assert.equal(f.root.querySelector('.donate-section[data-source="own-card"]'), null);
  } finally { f.dom.window.close(); }
});


test('editor repaint retains committed input draft and caret without emitting another configuration change', async () => {
  const f = await setup();
  try {
    const editor = f.dom.window.document.createElement('ha-network-map-editor');
    editor.hass = f.hass; editor.setConfig({ title: 'Family' }); f.dom.window.document.body.append(editor);
    let changes = 0; editor.addEventListener('config-changed', () => changes++);
    let input = editor.shadowRoot.getElementById('cf_title'); input.focus(); input.value = 'Family draft';
    input.dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
    input.setSelectionRange(2, 6, 'backward'); editor._render();
    input = editor.shadowRoot.getElementById('cf_title');
    assert.equal(input.value, 'Family draft'); assert.equal(editor.shadowRoot.activeElement, input);
    assert.deepEqual([input.selectionStart, input.selectionEnd, input.selectionDirection], [2, 6, 'backward']);
    assert.equal(changes, 1);
  } finally { f.dom.window.close(); }
});


test('editor mounted before hass renders when hass arrives and ordinary locale assignments retain caret', async () => {
  const f = await setup();
  try {
    const editor = f.dom.window.document.createElement('ha-network-map-editor');
    editor.setConfig({ title: 'Family' }); f.dom.window.document.body.append(editor);
    editor.hass = f.hass;
    let field = editor.shadowRoot.getElementById('cf_title'); assert.ok(field, 'A late hass assignment must render the configured editor');
    let changes = 0; editor.addEventListener('config-changed', () => changes++);
    field.focus(); field.value = 'Family draft'; field.dispatchEvent(new f.dom.window.Event('input', { bubbles: true })); field.setSelectionRange(2, 6, 'backward');
    editor.hass = { ...f.hass, language: 'pl' }; field = editor.shadowRoot.getElementById('cf_title');
    assert.equal(field.labels[0].textContent, 'Tytuł'); assert.equal(field.value, 'Family draft'); assert.equal(editor.shadowRoot.activeElement, field);
    assert.deepEqual([field.selectionStart,field.selectionEnd,field.selectionDirection],[2,6,'backward']); assert.equal(changes,1);
  } finally { f.dom.window.close(); }
});
