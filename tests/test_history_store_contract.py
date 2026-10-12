"""Exact Store subclass against published old/new HA write signatures, synthetic files only.
Primary: core/2025.2.0 and core/2026.10.1 homeassistant/helpers/storage.py.
Full real HA integration qualification remains in tests_ha.
"""
import ast,asyncio,json,os,stat,tempfile,unittest
from pathlib import Path
from datetime import datetime,timezone
from types import SimpleNamespace
from test_scan_history import history

PATH=Path(__file__).parents[1]/'custom_components/ha_network_map/scan_history_store.py'
CoreState=SimpleNamespace(stopping=object())
class OldStore:
 def __init__(self,hass,*args,**kwargs):
  self.hass=hass;self.key='ha_network_map.scan_history';self.path=hass.file;self.parent_loads=0;self.writes=[];self.fail=False
 async def async_load(self):
  self.parent_loads+=1
  return json.loads(Path(self.path).read_text())['data']
 async def async_save(self,data):
  try:await self._async_write_data(self.path,data)
  except OSError:pass # HA catches write failures; caller must not report saved.
 async def _async_write_data(self,path,data):
  if self.fail:raise OSError('synthetic failure')
  self.writes.append((path,data))
class NewStore(OldStore):
 async def async_save(self,data):
  try:await self._async_write_data(data)
  except OSError:pass
 async def _async_write_data(self,data):
  if self.fail:raise OSError('synthetic failure')
  self.writes.append((self.path,data))
def actual_store(parent,hass):
 tree=ast.parse(PATH.read_text());nodes=[n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Store']
 namespace={'HAStore':parent,'CoreState':CoreState,'MAX_BYTES':history.MAX_BYTES,'decode_history':history.decode_history,'datetime':datetime,'timezone':timezone,'Path':Path,'json':json,'os':os,'stat':stat}
 exec(compile(ast.Module(body=nodes,type_ignores=[]),str(PATH),'exec'),namespace)
 return namespace['Store'](hass,1,'ha_network_map.scan_history')
class StoreContracts(unittest.IsolatedAsyncioTestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.file=Path(self.temp.name)/'synthetic-history';self.hass=SimpleNamespace(file=str(self.file),state=object())
  async def execute(fn,*args):return fn(*args)
  self.hass.async_add_executor_job=execute
 def tearDown(self):self.temp.cleanup()
 def write(self,raw=None):
  payload={'schema':2,'snapshots':[]};raw=raw if raw is not None else json.dumps({'version':1,'minor_version':1,'key':'ha_network_map.scan_history','data':payload})
  self.file.write_text(raw);return payload
 async def test_old_and_current_write_hooks_confirm_actual_completion(self):
  for parent in (OldStore,NewStore):
   with self.subTest(api=parent.__name__):
    store=actual_store(parent,self.hass);await store.async_save({'schema':2,'snapshots':[]})
    self.assertEqual(len(store.writes),1);self.assertEqual(store.writes[0][0],str(self.file))
 async def test_swallowed_io_failure_never_reports_saved_in_either_supported_api(self):
  for parent in (OldStore,NewStore):
   with self.subTest(api=parent.__name__):
    store=actual_store(parent,self.hass);store.fail=True
    with self.assertRaises(OSError):await store.async_save({})
    self.assertEqual(store.writes,[])
 async def test_single_validated_read_never_enters_parent_migration_or_corrupt_rename(self):
  payload=self.write();store=actual_store(NewStore,self.hass)
  self.assertEqual(await store.async_load(),payload);self.assertEqual(store.parent_loads,0);self.assertEqual(store.writes,[])
 async def test_missing_file_stays_missing_without_parent_read_or_create(self):
  store=actual_store(NewStore,self.hass);self.assertIsNone(await store.async_load());self.assertFalse(self.file.exists());self.assertEqual(store.parent_loads,0)
 async def test_corrupt_future_and_duplicate_envelope_are_rejected_and_preserved(self):
  raws=['{corrupt','{"version":99,"minor_version":1,"key":"ha_network_map.scan_history","data":{}}','{"version":99,"version":1,"minor_version":1,"key":"ha_network_map.scan_history","data":{"schema":2,"snapshots":[]}}']
  for raw in raws:
   with self.subTest(raw_kind=raw[:15]):
    self.write(raw);store=actual_store(NewStore,self.hass)
    with self.assertRaises((ValueError,TypeError)):await store.async_load()
    self.assertEqual(self.file.read_text(),raw);self.assertEqual(store.parent_loads,0)
 async def test_symlink_does_not_read_a_target_or_allow_parent_load(self):
  target=self.file.with_name('synthetic-target');self.write();self.file.rename(target);self.file.symlink_to(target)
  store=actual_store(NewStore,self.hass)
  with self.assertRaises((ValueError,OSError)):await store.async_load()
  self.assertTrue(self.file.is_symlink());self.assertTrue(target.exists());self.assertEqual(store.parent_loads,0)
 async def test_shutdown_never_starts_write(self):
  store=actual_store(NewStore,self.hass);self.hass.state=CoreState.stopping
  with self.assertRaises(OSError):await store.async_save({})
  self.assertEqual(store.writes,[])
