const assert = require('node:assert/strict');
const {test} = require('node:test');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {JSDOM} = require('jsdom');

function fixture() {
  const dom = new JSDOM('', {runScripts:'dangerously',url:'http://localhost/'});
  dom.window.eval(readFileSync(join(__dirname,'../custom_components/ha_network_map/www/ha-network-map.js'),'utf8'));
  const card = dom.window.document.createElement('ha-network-map');
  card.setConfig({title:'QA'});
  card._hass = {language:'en',user:{is_admin:false},states:{}};
  card.activeTab = 'topology';
  card.devices = Array.from({length:60},(_,i)=>({name:i===0?'QA full device name <safe> beyond twelve characters':'QA device '+i,category:'Other',reachable:null,icon:'📡'}));
  card._doRender();
  dom.window.document.body.append(card);
  return {dom,card};
}

test('keyboard focus exposes the complete device name outside the dense diagram',()=>{
  const {dom,card}=fixture();
  try {
    const node = card.shadowRoot.querySelector('svg g[tabindex="0"]');
    node.dispatchEvent(new dom.window.FocusEvent('focus'));
    const outside = Array.from(card.shadowRoot.querySelectorAll('[role="status"]')).filter(x=>!x.closest('svg'));
    assert.ok(outside.some(x=>x.textContent==='QA full device name <safe> beyond twelve characters'),'Focused device full name must be visible and announced');
    assert.equal(outside.find(x=>x.textContent.includes('QA full device'))?.querySelector('safe'),null,'A device name remains text');
  } finally {dom.window.close();}
});

test('individual topology nodes are not hidden by an atomic image ancestor',()=>{
  const {dom,card}=fixture();
  try {
    const node = card.shadowRoot.querySelector('svg g[tabindex="0"]');
    assert.equal(node.parentElement.closest('[role="img"]'),null,'Atomic parent image hides the named focusable nodes');
    assert.equal(node.getAttribute('aria-label'),'QA full device name <safe> beyond twelve characters');
  } finally {dom.window.close();}
});
