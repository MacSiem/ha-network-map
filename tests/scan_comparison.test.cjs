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
