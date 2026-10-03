const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');
function fixture() {
  const dom = new JSDOM('', {runScripts:'dangerously',url:'http://localhost/'});
  dom.window.eval(readFileSync(join(__dirname,'../custom_components/ha_network_map/www/ha-network-map.js'),'utf8'));
  const card = dom.window.document.createElement('ha-network-map');
  card.devices = Array.from({length:60}, (_,i)=>({name:'QA long device '+i,category:i%2?'Other':'Phone',reachable:null,icon:'📡'}));
  const root = dom.window.document.createElement('div');
  root.innerHTML = card._renderTopologyTab();
  return {dom,card,root};
}
test('dense topology summary circles remain within the SVG viewbox',()=>{
  const {dom,root}=fixture();
  try {
    const [, , width,height]=root.querySelector('svg').getAttribute('viewBox').split(' ').map(Number);
    for(const c of root.querySelectorAll('svg circle')) {
      const x=Number(c.getAttribute('cx')), y=Number(c.getAttribute('cy')), r=Number(c.getAttribute('r'));
      assert.ok(x-r>=0&&x+r<=width&&y-r>=0&&y+r<=height,'Node clipped outside topology viewbox');
    }
  } finally {dom.window.close();}
});
test('dense topology limits individual nodes and offers full names on hover',()=>{
  const {dom,root}=fixture();
  try {
    assert.equal(root.querySelectorAll('svg text[font-size="13"]').length,24);
    assert.match(root.textContent,/Showing 24 of 60 devices/);
    assert.match(root.querySelector('svg').textContent,/QA long device 0/);
  } finally {dom.window.close();}
});
test('topology does not invent a router IP when no gateway was configured',()=>{
  const {dom,card}=fixture();
  try {
    assert.doesNotMatch(card._renderTopologyTab(),/192\.168\.1\.1/);
    card._routerIp='192.0.2.1';
    assert.match(card._renderTopologyTab(),/192\.0\.2\.1/);
  } finally {dom.window.close();}
});
