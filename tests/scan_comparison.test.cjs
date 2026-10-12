const assert = require('node:assert/strict');
const {test} = require('node:test');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {JSDOM} = require('jsdom');
const flush = async () => { for (let n=0;n<25;n++) await Promise.resolve(); };
function fixture() {
 const dom=new JSDOM('',{runScripts:'dangerously',url:'http://localhost/'});
 dom.window.eval(readFileSync(join(__dirname,'../custom_components/ha_network_map/www/ha-network-map.js'),'utf8'));
 const card=dom.window.document.createElement('ha-network-map');dom.window.document.body.append(card);card.setConfig({show_support:false});
 const calls=[];let resolve;
 const metadata=id=>({id,finished_at:'2026-10-12T12:00:00Z',started_at:'2026-10-12T11:59:59Z',source:'ha_server_tcp',method:{protocol:'tcp_connect_v1',ports:[80],timeout:.7,max_concurrent:16},scope:{discovery:'ha_known_devices_v1',include_public_ips:false},mode:'tcp',caps:{devices:256,optional_cache:200},target_count:1,completed_count:1,discovered_count:1,eligible_count:1,skipped:{},coverage:'full',reasons:[],unknown_identity_count:0});
 const result={state:'success',comparable:true,reasons:[],before:metadata('old'),after:metadata('new'),counts:{new:0,not_in_scan:0,ip_changed:1,unchanged:0,unknown:0},changes:[{kind:'ip_changed',stable_id:'device:fixture',before:{name:'Fixture',ip:'192.0.2.1',stable_id:'device:fixture',reachable:true,open_ports:[80]},after:{name:'Fixture',ip:'192.0.2.2',stable_id:'device:fixture',reachable:true,open_ports:[80]}}]};
 const hass={states:{},language:'en',user:{id:'fixture',is_admin:true},connection:{connected:true},callWS:async command=>{calls.push(command);if(command.type==='config/device_registry/list')return [];if(command.type==='ha_network_map/list_devices')return {devices:[]};if(command.type==='ha_network_map/scan_history')return {status:'ready',snapshots:[metadata('new'),metadata('old')]};if(command.type==='ha_network_map/compare_scans')return result;throw Error('Unexpected '+command.type);}};
 return {dom,card,hass,calls,result,close(){card.remove();dom.window.close();}};
}
test('opening comparison makes coalesced authorized reads, no scan, details old/new and focus',async()=>{
 const f=fixture();try{f.card.hass=f.hass;await flush();f.card.shadowRoot.querySelector('#tab-comparison').click();const duplicate=f.card._loadComparison();await duplicate;await flush();
 assert.equal(f.calls.filter(c=>c.type==='ha_network_map/scan_history').length,1);assert.equal(f.calls.filter(c=>c.type==='ha_network_map/compare_scans').length,1);assert.ok(f.calls.every(c=>!c.type.endsWith('/scan')));
 assert.match(f.card.shadowRoot.querySelector('#comparison').textContent,/192\.0\.2\.1.*192\.0\.2\.2/s);
 const detail=f.card.shadowRoot.querySelector('[data-comparison-detail]');detail.focus();detail.click();assert.match(f.card.shadowRoot.querySelector('#comparison-detail').textContent,/device:fixture/);
 assert.equal(f.card.shadowRoot.activeElement.id,detail.id);
 }finally{f.close();}
});
test('readonly role makes no history requests and revocation erases private data immediately',async()=>{
 const f=fixture();try{f.card.hass={...f.hass,user:{id:'ordinary',is_admin:false}};await flush();f.card.setActiveTab('comparison');await f.card._loadComparison();assert.equal(f.calls.filter(c=>/scan_history|compare_scans/.test(c.type)).length,0);
 f.card.hass=f.hass;await f.card._loadComparison();assert.ok(f.card._comparison.data);
 f.card.hass={...f.hass,user:{id:'ordinary',is_admin:false}};assert.equal(f.card._comparison.data,null);assert.equal(f.card._comparison.history.length,0);assert.doesNotMatch(f.card.shadowRoot.textContent,/192\.0\.2/);
 }finally{f.close();}
});
test('source epoch, selection and disconnect reject stale outcome without retry',async()=>{
 const f=fixture();try{f.card.hass=f.hass;await flush();f.card.setActiveTab('comparison');await flush();
 let late;f.card._invalidateComparison();f.card._hass={...f.hass,callWS:c=>{f.calls.push(c);return new Promise(r=>late=r);}};
 const old=f.card._loadComparison();const count=f.calls.length;f.card.remove();late({status:'ready',snapshots:[]});await old;await flush();assert.equal(f.card._comparison.data,null);assert.equal(f.calls.length,count);
 }finally{f.close();}
});
test('selection only reads compare, language invalidation and 20-row pagination escape detail content',async()=>{
 const f=fixture();try{f.card.hass=f.hass;await flush();f.card.setActiveTab('comparison');await f.card._loadComparison();
 const historyReads=f.calls.filter(c=>c.type.endsWith('/scan_history')).length;
 f.card._comparison.before='old';await f.card._loadComparison();assert.equal(f.calls.filter(c=>c.type.endsWith('/scan_history')).length,historyReads);
 f.result.changes=Array.from({length:45},(_,i)=>({...f.result.changes[0],stable_id:'device:'+i,after:{...f.result.changes[0].after,name:'<img src=x onerror=alert(1)>'}}));f.card._comparison.data=f.result;f.card._doRender();
 assert.equal(f.card.shadowRoot.querySelectorAll('[data-comparison-detail]').length,20);assert.equal(f.card.shadowRoot.querySelector('#comparison img'),null);
 f.card.shadowRoot.querySelector('#comparison-next').click();assert.equal(f.card.shadowRoot.querySelectorAll('[data-comparison-detail]').length,20);
 f.card.hass={...f.hass,language:'pl'};assert.match(f.card.shadowRoot.querySelector('#comparison').textContent,/Porównanie|Odczytaj/);
 }finally{f.close();}
});

test('deadline closes request and late history cannot trigger compare or overwrite error',async()=>{
 const f=fixture();try{f.card.hass=f.hass;await flush();f.card._invalidateComparison();
 const timers=new Map();let next=0,late;
 f.dom.window.setTimeout=(callback,delay)=>{timers.set(++next,{callback,delay});return next;};f.dom.window.clearTimeout=id=>timers.delete(id);
 f.card._hass={...f.hass,callWS:command=>{f.calls.push(command);return new Promise(resolve=>late=resolve);}};
 const read=f.card._loadComparison();const count=f.calls.length;
 [...timers.values()].find(t=>t.delay===10000).callback();await read;
 assert.equal(f.card._comparison.error,'deadline');assert.equal(f.card._comparisonRequest,null);
 late({status:'ready',snapshots:[{id:'a',finished_at:'2026-10-12T12:00:00Z'},{id:'b',finished_at:'2026-10-12T11:00:00Z'}]});await flush();
 assert.equal(f.calls.length,count);assert.equal(f.card._comparison.data,null);assert.equal(f.card._comparison.error,'deadline');
 }finally{f.close();}
});
test('browser offline and mutable role revocation clear history without read or retry',async()=>{
 const f=fixture();try{f.card.hass=f.hass;await flush();f.card.setActiveTab('comparison');await f.card._loadComparison();
 assert.ok(f.card._comparison.data);f.hass.user.is_admin=false;f.card.hass=f.hass;
 assert.equal(f.card._comparison.data,null);assert.equal(f.card._comparison.history.length,0);
 const count=f.calls.length;Object.defineProperty(f.dom.window.navigator,'onLine',{value:false,configurable:true});
 f.card._hass={...f.hass,user:{id:'fixture',is_admin:true}};await f.card._loadComparison();assert.equal(f.calls.length,count);assert.equal(f.card._comparison.error,'offline');
 f.dom.window.dispatchEvent(new f.dom.window.Event('online'));await flush();assert.equal(f.calls.length,count);
 }finally{f.close();}
});

test('unknown typed connection flags never authorize comparison reads',async()=>{
 for(const flag of [undefined,'true',1,false]){
  const f=fixture();try{f.card.hass=f.hass;await flush();f.calls.length=0;f.hass.connection.connected=flag;
   await f.card._loadComparison();assert.equal(f.calls.filter(c=>/scan_history|compare_scans/.test(c.type)).length,0,String(flag));
  }finally{f.close();}
 }
});
test('connection events are authoritative even when hass was assigned before mounting',async()=>{
 const f=fixture();try{
  f.card.remove();const connection=new f.dom.window.EventTarget();connection.connected=true;
  f.hass.connection=connection;f.card.hass=f.hass;f.dom.window.document.body.append(f.card);await flush();f.calls.length=0;
  connection.dispatchEvent(new f.dom.window.Event('disconnected'));await f.card._loadComparison();
  assert.equal(f.calls.filter(c=>/scan_history|compare_scans/.test(c.type)).length,0);
  connection.dispatchEvent(new f.dom.window.Event('ready'));assert.equal(f.calls.filter(c=>/scan_history|compare_scans/.test(c.type)).length,0);
  await f.card._loadComparison();assert.equal(f.calls.filter(c=>c.type.endsWith('/scan_history')).length,1);
 }finally{f.close();}
});
test('browser offline event blocks reads despite stale navigator online true',async()=>{
 const f=fixture();try{f.card.hass=f.hass;await flush();f.calls.length=0;
  f.dom.window.dispatchEvent(new f.dom.window.Event('offline'));assert.equal(f.dom.window.navigator.onLine,true);
  await f.card._loadComparison();assert.equal(f.calls.filter(c=>/scan_history|compare_scans/.test(c.type)).length,0);
  assert.equal(f.card._comparison.error,'offline');f.dom.window.dispatchEvent(new f.dom.window.Event('online'));await flush();
  assert.equal(f.calls.filter(c=>/scan_history|compare_scans/.test(c.type)).length,0);
 }finally{f.close();}
});
test('group and active-role changes erase private comparison immediately',async()=>{
 for(const change of ['group','inactive']){
  const f=fixture();try{f.card.hass=f.hass;await flush();f.card.setActiveTab('comparison');await f.card._loadComparison();
   assert.ok(f.card._comparison.data);if(change==='group')f.hass.user.group_ids=['changed'];else f.hass.user.is_active=false;
   f.card.hass=f.hass;assert.equal(f.card._comparison.data,null,change);assert.doesNotMatch(f.card.shadowRoot.querySelector('#comparison').textContent,/192\.0\.2/);
   if(change==='inactive'){const count=f.calls.length;await f.card._loadComparison();assert.equal(f.calls.length,count);}
  }finally{f.close();}
 }
});
test('incomparable pair does not show zero measured delta counts',async()=>{
 const f=fixture();try{f.result.comparable=false;f.result.state='unconfirmed';f.result.reasons=['method_mismatch'];f.result.changes=[];f.result.counts=Object.fromEntries(Object.keys(f.result.counts).map(k=>[k,null]));
  f.card.hass=f.hass;await flush();f.card.setActiveTab('comparison');await f.card._loadComparison();
  assert.doesNotMatch(f.card.shadowRoot.querySelector('.comparison-counts')?.textContent||'',/New in scan: 0|Not in this scan: 0|IP changed: 0/);
 }finally{f.close();}
});
test('deadline keeps one unresolved history wire and forbids another read until settlement',async()=>{
 const f=fixture();try{f.card.hass=f.hass;await flush();f.card._invalidateComparison();
  const timers=new Map();let next=0,late;
  f.dom.window.setTimeout=(callback,delay)=>{timers.set(++next,{callback,delay});return next;};f.dom.window.clearTimeout=id=>timers.delete(id);
  f.card._hass={...f.hass,callWS:command=>{f.calls.push(command);return new Promise(resolve=>late=resolve);}};
  const read=f.card._loadComparison();const count=f.calls.length;[...timers.values()].find(t=>t.delay===10000).callback();await read;
  const repeated=f.card._loadComparison();await flush();assert.equal(f.calls.length,count);assert.equal(f.card._comparison.error,'deadline');
  late({status:'ready',snapshots:[]});await repeated;await flush();assert.equal(f.card._comparison.data,null);
 }finally{f.close();}
});

test('default selectors name the actual server-selected saved scans',async()=>{
 const f=fixture();try{f.card.hass=f.hass;await flush();f.card.setActiveTab('comparison');await f.card._loadComparison();
  assert.equal(f.card.shadowRoot.querySelector('#comparison-before').value,f.result.before.id);
  assert.equal(f.card.shadowRoot.querySelector('#comparison-after').value,f.result.after.id);
 }finally{f.close();}
});

test('contradictory comparability or unmeasured delta counts cannot become green success',async()=>{
 for(const kind of ['missing_boolean','false_success','count_mismatch','missing_count']){
  const f=fixture();try{
   if(kind==='missing_boolean')delete f.result.comparable;
   if(kind==='false_success'){f.result.comparable=false;f.result.counts=Object.fromEntries(Object.keys(f.result.counts).map(k=>[k,null]));}
   if(kind==='count_mismatch')f.result.counts.ip_changed=999;
   if(kind==='missing_count')delete f.result.counts.unknown;
   f.card.hass=f.hass;await flush();f.card.setActiveTab('comparison');await f.card._loadComparison();
   assert.equal(f.card._comparison.state,'error',kind);assert.equal(f.card._comparison.error,'invalid_response',kind);
   assert.equal(f.card._comparison.data,null,kind);
  }finally{f.close();}
 }
});

test('successful comparison requires valid matching source method scope and dates',async()=>{
 for(const kind of ['missing_metadata','scope_mismatch','method_mismatch','source_mismatch','invalid_date','partial_success']){
  const f=fixture();try{
   if(kind==='missing_metadata')f.result.before=null;
   if(kind==='scope_mismatch')f.result.after.scope.include_public_ips=true;
   if(kind==='method_mismatch')f.result.after.method.timeout=2;
   if(kind==='source_mismatch')f.result.after.source='unknown_source';
   if(kind==='invalid_date')f.result.after.finished_at='bad';
   if(kind==='partial_success')f.result.after.coverage='partial';
   f.card.hass=f.hass;await flush();f.card.setActiveTab('comparison');await f.card._loadComparison();
   assert.equal(f.card._comparison.state,'error',kind);assert.equal(f.card._comparison.error,'invalid_response',kind);
   assert.equal(f.card._comparison.data,null,kind);
  }finally{f.close();}
 }
});
