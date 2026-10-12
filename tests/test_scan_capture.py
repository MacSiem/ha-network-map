"""Synthetic scanner fixture uses existing module loader and never opens sockets."""
import asyncio
import unittest
from types import SimpleNamespace
from test_scanner_helpers import scanner

class Captures(unittest.IsolatedAsyncioTestCase):
    def make(self):
        sink=SimpleNamespace(saved=[])
        async def append(snapshot): sink.saved.append(snapshot); return "saved"
        sink.async_append=append
        network=scanner.NetworkScanner(SimpleNamespace(data={}),history=sink)
        def merge(): network._devices["fixture"]=scanner.Device(key="fixture",device_id="fixture",name="Fixture",ip="127.0.0.1")
        network._merge_registry_sources=merge
        network._merge_entity_sources=lambda:None
        network._merge_optional_discovery_sources=lambda:None
        return network,sink

    async def test_only_completed_scan_captures_busy_failed_cancelled_and_reads_do_not(self):
        network,sink=self.make(); entered=asyncio.Event(); release=asyncio.Event()
        async def probe(*args): entered.set(); await release.wait(); return "open"
        network._tcp_status=probe
        await network.list_devices();self.assertEqual(sink.saved,[])
        pending=asyncio.create_task(network.scan(ports=[80]));await entered.wait()
        busy=await network.scan(ports=[80]);self.assertTrue(busy["queued"]);self.assertEqual(sink.saved,[])
        release.set();await pending;self.assertEqual(len(sink.saved),1)
        async def broken(*args): raise RuntimeError("fixture failure")
        network._tcp_status=broken
        with self.assertRaises(RuntimeError): await network.scan(ports=[80])
        self.assertEqual(len(sink.saved),1)
        entered.clear();release.clear();network._tcp_status=probe
        pending=asyncio.create_task(network.scan(ports=[80]));await entered.wait();pending.cancel()
        with self.assertRaises(asyncio.CancelledError): await pending
        self.assertEqual(len(sink.saved),1)

    async def test_capture_is_frozen_measured_target_not_refreshed_registry(self):
        network,sink=self.make();entered=asyncio.Event();release=asyncio.Event()
        async def probe(*args):entered.set();await release.wait();return "refused"
        network._tcp_status=probe
        pending=asyncio.create_task(network.scan(ports=[80]));await entered.wait()
        network._merge_registry_sources=lambda:None
        await network.list_devices();release.set();await pending
        record=sink.saved[0]["records"][0]
        self.assertEqual(record["ip"],"127.0.0.1");self.assertTrue(record["reachable"])
        self.assertEqual(record["open_ports"],[]);self.assertEqual(network._devices,{})

    async def test_unload_during_scan_never_appends_late_snapshot(self):
        network,sink=self.make();entered=asyncio.Event();release=asyncio.Event()
        async def probe(*args):entered.set();await release.wait();return "down"
        network._tcp_status=probe
        pending=asyncio.create_task(network.scan(ports=[80]));await entered.wait()
        network.close();release.set();await pending
        self.assertEqual(sink.saved,[])

    async def test_target_cap_and_public_policy_are_recorded_without_claiming_full_coverage(self):
        network,sink=self.make();calls=[]
        def merge():
            for index in range(258):
                network._devices[str(index)]=scanner.Device(key=str(index),device_id=str(index),name="Synthetic",ip="127.0.0.1")
            network._devices["public"]=scanner.Device(key="public",device_id="public",name="Public fixture",ip="192.0.2.1")
        network._merge_registry_sources=merge
        async def probe(*args):calls.append(args);return "open"
        network._tcp_status=probe
        await network.scan(ports=[80])
        capture=sink.saved[0]
        self.assertEqual(len(calls),256)
        self.assertEqual(capture["skipped"],{"no_ip":0,"public_ip":1,"device_cap":2})
        self.assertEqual(capture["coverage"],"partial")
        self.assertEqual(capture["completed_count"],256)
        self.assertFalse(capture["scope"]["include_public_ips"])
