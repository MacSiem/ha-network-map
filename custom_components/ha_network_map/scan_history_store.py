"""Local HA storage; setup/capture write boundary, comparison reads memory only."""
from __future__ import annotations

import asyncio
from copy import deepcopy
from datetime import datetime, timezone, timedelta
import json
import os
import stat
from pathlib import Path
from homeassistant.helpers.storage import Store as HAStore
from homeassistant.core import CoreState
from homeassistant.exceptions import HomeAssistantError

from .scan_history import SCHEMA, MAX_BYTES, MAX_AGE, decode_history, retain, metadata, compare_snapshots, validate_snapshot, _utc


class Store(HAStore):
    """Confirm writes; prevent HA's corrupt-file reset or envelope auto-migration.

    HA's helper swallows WriteError and defers save during shutdown. Its
    protected _async_write_data hook is isolated here and needs native QA
    against the supported HA release. Comparison never calls these methods.
    """
    def _check_envelope(self):
        # A single bounded descriptor read: never ask HA to reload/migrate or
        # rename a corrupt file after this validation. Special files cannot block.
        try:
            descriptor = os.open(self.path, os.O_RDONLY | os.O_NONBLOCK | os.O_NOFOLLOW)
        except FileNotFoundError:
            return None
        with os.fdopen(descriptor, 'rb') as file:
            info = os.fstat(file.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_BYTES:
                raise ValueError('History must be a bounded regular file')
            raw = file.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError('History file too large')
        def unique_pairs(pairs):
            value = {}
            for key, item in pairs:
                if key in value:
                    raise ValueError('Duplicate history key')
                value[key] = item
            return value
        envelope = json.loads(raw.decode('utf-8'), object_pairs_hook=unique_pairs)
        if not isinstance(envelope, dict) or set(envelope) - {'version','minor_version','key','data'} or type(envelope.get('version')) is not int or envelope['version'] != 1 or type(envelope.get('minor_version',1)) is not int or envelope.get('minor_version',1) != 1 or envelope.get('key') != self.key or 'data' not in envelope:
            raise ValueError('Unsupported history envelope')
        decode_history(envelope['data'], datetime.now(timezone.utc))
        return envelope['data']

    async def async_load(self):
        return await self.hass.async_add_executor_job(self._check_envelope)

    async def _async_write_data(self, *arguments):
        # Core2025.2 passes (path,data), current Core passes (data).
        # Forward the exact supported call and confirm only actual completion.
        await super()._async_write_data(*arguments)
        self._write_confirmed = True

    async def async_save(self,data):
        if self.hass.state is CoreState.stopping:
            raise OSError("History capture skipped during shutdown")
        self._write_confirmed = False
        await super().async_save(data)
        if not self._write_confirmed:
            raise OSError("History write was not confirmed")

class ScanHistory:
    def __init__(self, hass):
        self._hass = hass
        self._retention_timer = None
        self._store = Store(hass, 1, "ha_network_map.scan_history", private=True, atomic_writes=True)
        self._snapshots = []
        self._status = "unavailable"
        self._writable = False
        self._closed = False
        self._lock = asyncio.Lock()

    async def async_load(self):
        """Setup only. Known wrapper migration stays in memory until capture."""
        payload = None
        try:
            payload = await self._store.async_load()
            self._snapshots,self._status = decode_history(payload,datetime.now(timezone.utc))
        except (ValueError,TypeError,KeyError,OverflowError,OSError,UnicodeError,RecursionError,HomeAssistantError,NotImplementedError):
            self._snapshots,self._status = [],"unavailable"
        self._writable = self._status != "unavailable"
        if self._writable and payload is not None:
            original = payload["scans" if payload["schema"] == 1 else "snapshots"]
            if len(original) != len(self._snapshots):
                # Startup retention cleanup, never initiated by history read.
                try:
                    await self._store.async_save({"schema":SCHEMA,"snapshots":self._snapshots})
                except (OSError,ValueError,TypeError,HomeAssistantError):
                    self._status = "save_failed"
        self._schedule_expiry()

    async def async_append(self, snapshot):
        async with self._lock:
            if self._closed:
                return "unloaded"
            if not self._writable:
                return "unavailable"
            snapshot = validate_snapshot(snapshot)
            rows = retain([snapshot,*self._snapshots],datetime.now(timezone.utc))
            payload = {"schema":SCHEMA,"snapshots":rows}
            if len(json.dumps(payload,allow_nan=False).encode()) > MAX_BYTES:
                self._status = "save_failed"
                return self._status
            try:
                await self._store.async_save(payload)
            except (OSError,ValueError,TypeError,HomeAssistantError):
                self._status = "save_failed"
                return self._status
            self._snapshots = rows
            self._status = "ready"
            self._schedule_expiry()
            return "saved"

    async def async_close(self):
        self._closed = True
        if self._retention_timer is not None:
            self._retention_timer.cancel()
            self._retention_timer = None
        async with self._lock:
            self._snapshots = []
            self._status = "unloaded"

    def _schedule_expiry(self):
        if self._retention_timer is not None:
            self._retention_timer.cancel()
            self._retention_timer = None
        if self._closed or not self._writable or not self._snapshots:
            return
        oldest = min(datetime.fromisoformat(s["finished_at"].replace("Z","+00:00")) for s in self._snapshots)
        seconds = max(.01,(oldest + MAX_AGE - datetime.now(timezone.utc)).total_seconds() + .01)
        self._retention_timer = self._hass.loop.call_later(seconds,self._expire_due)

    def _expire_due(self):
        self._retention_timer = None
        if not self._closed:
            self._hass.async_create_task(self._async_expire())

    async def _async_expire(self):
        async with self._lock:
            if self._closed or not self._writable:
                return
            rows = retain(self._snapshots,datetime.now(timezone.utc))
            if rows != self._snapshots:
                try:
                    await self._store.async_save({"schema":SCHEMA,"snapshots":rows})
                except (OSError,ValueError,TypeError,HomeAssistantError):
                    self._status = "save_failed"
                    return
                self._snapshots = rows
            self._schedule_expiry()

    def _retained(self):
        return [] if self._closed else retain(self._snapshots,datetime.now(timezone.utc))

    def history(self):
        """No Store call, no migration and no discovery. Caller enforces admin."""
        return {"status":self._status,"snapshots":[metadata(s) for s in self._retained()]}

    def comparison(self,before_id=None,after_id=None):
        rows = self._retained()
        after = next((s for s in rows if s["id"] == after_id),None) if after_id else (rows[0] if rows else None)
        before = next((s for s in rows if s["id"] == before_id),None) if before_id else next((s for s in rows if after and s["id"] != after["id"] and _utc(s["finished_at"]) <= _utc(after["finished_at"])),None)
        result = compare_snapshots(before,after)
        result["history_status"] = self._status
        if (before_id and before is None) or (after_id and after is None):
            result.update(state="unconfirmed",comparable=False,reasons=["selection_expired"])
        return deepcopy(result)
