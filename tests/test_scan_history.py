"""Pure synthetic fixtures; no HA, storage, sockets or private runtime data."""
import importlib.util
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from copy import deepcopy
import unittest

_spec = importlib.util.spec_from_file_location("network_history", Path(__file__).parents[1] / "custom_components/ha_network_map/scan_history.py")
history = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = history
_spec.loader.exec_module(history)
NOW = datetime(2026, 10, 12, 12, tzinfo=timezone.utc)

def scan(rows=None, *, at=NOW, public=False, reasons=None, ports=(80,), skipped=0):
    rows = rows if rows is not None else [{"device_id": "fixture-device", "name": "Fixture", "mac": None, "ip": "192.0.2.1", "reachable": True, "open_ports": [80]}]
    return history.build_snapshot(rows, started=at.timestamp()-1, finished=at.timestamp(), ports=ports, timeout=.7, max_concurrent=16, include_public_ips=public, discovered=len(rows)+skipped, eligible=len(rows)+skipped, skipped={"device_cap": skipped}, reasons=reasons or [])

class ComparisonTests(unittest.TestCase):
    def test_registry_identity_survives_address_change_and_absence_is_not_offline(self):
        old = scan()
        new = scan([{"device_id":"fixture-device","name":"Fixture","ip":"192.0.2.2","mac":None,"reachable":False,"open_ports":[]}], at=NOW+timedelta(seconds=1))
        result = history.compare_snapshots(old,new)
        self.assertEqual(result["counts"]["ip_changed"],1)
        row = result["changes"][0]
        self.assertEqual((row["before"]["ip"],row["after"]["ip"]),("192.0.2.1","192.0.2.2"))
        missing = history.compare_snapshots(old,scan([],at=NOW+timedelta(seconds=2)))
        self.assertEqual(missing["changes"][0]["kind"],"not_in_scan")
        self.assertNotIn("offline",missing["changes"][0])
        self.assertEqual(missing["counts"]["not_in_scan"],1)

    def test_dynamic_membership_not_scope_but_method_and_public_policy_are_scope(self):
        old=scan()
        new=scan([{"device_id":"other","name":"Added","ip":"192.0.2.3","mac":None,"reachable":True,"open_ports":[80]}],at=NOW+timedelta(seconds=1))
        self.assertTrue(history.compare_snapshots(old,new)["comparable"])
        self.assertEqual(history.compare_snapshots(old,new)["counts"]["new"],1)
        self.assertFalse(history.compare_snapshots(old,scan(public=True))["comparable"])
        self.assertFalse(history.compare_snapshots(old,scan(ports=(443,)))["comparable"])

    def test_missing_duplicate_identity_and_caps_never_prove_absence_or_new(self):
        old=scan()
        for new in [scan([{ "device_id":None,"name":"Address only","mac":None,"ip":"192.0.2.2","reachable":True,"open_ports":[80]}]),scan([],skipped=1),scan([],reasons=["dhcp_cap"]),scan([{"device_id":"dup","name":"A","ip":"192.0.2.2","mac":None,"reachable":True,"open_ports":[80]},{"device_id":"dup","name":"B","ip":"192.0.2.3","mac":None,"reachable":True,"open_ports":[80]}])]:
            result=history.compare_snapshots(old,new)
            self.assertEqual(result["counts"]["not_in_scan"],0)
            self.assertEqual(result["counts"]["new"],0)
            self.assertEqual(result["state"],"partial")
        mac=scan([{ "device_id":None,"name":"MAC","mac":"AA-BB-CC-DD-EE-FF","ip":"192.0.2.4","reachable":True,"open_ports":[80]}])
        self.assertEqual(mac["records"][0]["stable_id"],"mac:aa:bb:cc:dd:ee:ff")

    def test_strict_validation_rejects_tampered_or_unmeasured_snapshots(self):
        good=scan()
        for key,value in [("completed",False),("finished_at","not utc"),("schema",999),("method",{}),("records",[{}]),("target_count",True),("completed_count",99),("coverage","complete")]:
            bad=deepcopy(good);bad[key]=value
            with self.subTest(key=key):
                with self.assertRaises(ValueError): history.validate_snapshot(bad)
        self.assertEqual(history.compare_snapshots(None,good)["state"],"no_data")

    def test_retention_expiry_future_schema_and_wrapper_migration(self):
        rows=[scan(at=NOW-timedelta(days=i)) for i in range(35)]
        loaded,state=history.decode_history({"schema":2,"snapshots":rows[:30]},NOW)
        self.assertEqual(len(loaded),30);self.assertEqual(state,"ready")
        migrated,state=history.decode_history({"schema":1,"scans":rows[:2]},NOW)
        self.assertEqual(len(migrated),2);self.assertEqual(state,"migrated")
        expired,state=history.decode_history({"schema":2,"snapshots":[scan(at=NOW-timedelta(days=31))]},NOW)
        self.assertEqual(expired,[])
        for payload in [{"schema":99,"snapshots":[]},{"schema":2,"snapshots":[{}]},{"schema":2,"snapshots":rows}]:
            with self.assertRaises(ValueError): history.decode_history(payload,NOW)
        self.assertEqual(history.decode_history(None,NOW),([],"empty"))
