"""Server-side network device discovery and reachability probe.

The discovery half pulls everything Home Assistant already knows about
the user's devices from the canonical registries (device registry +
entity registry + ``device_tracker.*`` states + optional DHCP /
Zeroconf integration data). No browser-side enumeration, no port
probes that target the user's *current* network when the frontend is
opened remotely.

The probe half issues TCP connect attempts from the Home Assistant
host itself — so probes always originate from the home LAN — and only
against addresses that fall inside RFC1918 / link-local / loopback /
ULA ranges. Public IPs are refused by default. Concurrency and timeout
are capped, so a "scan" never balloons into thousands of in-flight
sockets.
"""

from __future__ import annotations

import asyncio
import ipaddress
import logging
import re
import time
from dataclasses import dataclass, field
from typing import Any, Iterable

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er

from .const import (
    DEFAULT_MAX_CONCURRENT_PROBES,
    DEFAULT_MAX_DEVICES_PER_SCAN,
    DEFAULT_PORTS,
    DEFAULT_PROBE_TIMEOUT_SECONDS,
)

_LOGGER = logging.getLogger(__name__)

_IPV4_RE = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b")


@dataclass
class Device:
    """One row in the device map."""

    key: str                # stable id, prefer mac, fallback to ip, fallback to entity_id
    name: str
    ip: str | None = None
    mac: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    sources: list[str] = field(default_factory=list)   # ["device_registry", "device_tracker", "zeroconf", ...]
    entity_ids: list[str] = field(default_factory=list)
    reachable: bool | None = None
    open_ports: list[int] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "name": self.name,
            "ip": self.ip,
            "mac": self.mac,
            "manufacturer": self.manufacturer,
            "model": self.model,
            "sources": sorted(set(self.sources)),
            "entity_ids": sorted(set(self.entity_ids)),
            "reachable": self.reachable,
            "open_ports": sorted(set(self.open_ports)),
        }


def _is_private_ip(ip_str: str) -> bool:
    """Allow probing only RFC1918 / loopback / link-local / ULA addresses."""
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False
    return ip.is_private or ip.is_loopback or ip.is_link_local


def _normalize_mac(value: str | None) -> str | None:
    if not value or not isinstance(value, str):
        return None
    cleaned = value.lower().replace("-", ":").strip()
    parts = cleaned.split(":")
    if len(parts) == 6 and all(len(p) == 2 for p in parts):
        return cleaned
    # Some integrations store MACs without separators (e.g. "aabbccddeeff").
    digits = "".join(c for c in cleaned if c in "0123456789abcdef")
    if len(digits) == 12:
        return ":".join(digits[i : i + 2] for i in range(0, 12, 2))
    return None


def _ip_from_url(value: str | None) -> str | None:
    if not value:
        return None
    match = _IPV4_RE.search(value)
    return match.group(1) if match else None


class NetworkScanner:
    """Read HA's view of the network; optionally probe TCP reachability."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._devices: dict[str, Device] = {}
        self._last_scan_started_at: float | None = None
        self._last_scan_finished_at: float | None = None
        self._scan_lock = asyncio.Lock()

    # ---------------------------------------------------------- public API

    async def list_devices(self) -> list[dict[str, Any]]:
        """Return the current device map.

        Reads every HA-known source (registry, entities, optional
        zeroconf / dhcp) without touching the network. Returns whatever
        reachability info is cached from the most recent ``scan``.
        """
        self._merge_registry_sources()
        self._merge_entity_sources()
        self._merge_optional_discovery_sources()
        return sorted(
            (d.to_dict() for d in self._devices.values()),
            key=lambda r: (r.get("ip") or "zzz", r.get("name") or ""),
        )

    async def scan(
        self,
        ports: Iterable[int] | None = None,
        timeout: float = DEFAULT_PROBE_TIMEOUT_SECONDS,
        max_concurrent: int = DEFAULT_MAX_CONCURRENT_PROBES,
        include_public_ips: bool = False,
    ) -> dict[str, Any]:
        """Probe TCP reachability for every device with an IP, from this host.

        Only RFC1918 / loopback / link-local addresses are probed unless
        ``include_public_ips`` is set. ``ports`` defaults to a sensible
        smart-home set (HTTP, HTTPS, HA, ESPHome, MQTT, RTSP, SSH, IPP).
        Concurrent socket connects are capped at ``max_concurrent``.
        """
        if self._scan_lock.locked():
            return self.get_status() | {"queued": True}

        async with self._scan_lock:
            self._last_scan_started_at = time.time()
            # Refresh the device list before probing — registry may have
            # changed since the previous scan.
            await self.list_devices()

            ports_tuple = tuple(int(p) for p in (ports or DEFAULT_PORTS) if 0 < int(p) < 65536)
            if not ports_tuple:
                ports_tuple = DEFAULT_PORTS

            targets: list[tuple[str, str]] = []  # (device_key, ip)
            for key, dev in self._devices.items():
                if not dev.ip:
                    continue
                if not include_public_ips and not _is_private_ip(dev.ip):
                    dev.reachable = None
                    dev.open_ports = []
                    continue
                targets.append((key, dev.ip))
                if len(targets) >= DEFAULT_MAX_DEVICES_PER_SCAN:
                    break

            sem = asyncio.Semaphore(max(1, int(max_concurrent)))

            async def _probe(key: str, ip: str) -> None:
                open_ports: list[int] = []
                host_up = False
                for port in ports_tuple:
                    async with sem:
                        status = await self._tcp_status(ip, port, timeout)
                    if status == "open":
                        open_ports.append(port)
                        host_up = True
                    elif status == "refused":
                        host_up = True
                # Reachable if the host answered on ANY port — "open" OR
                # "refused". Online devices that expose none of the scanned
                # ports (most IoT, Modbus, printers, etc.) actively refuse the
                # connection, which still proves the host is up. Only a total
                # no-response (timeout/unreachable on every port) counts as
                # unreachable, so we no longer flag live devices red just for
                # lacking a scannable open port.
                self._devices[key].reachable = host_up
                self._devices[key].open_ports = open_ports

            await asyncio.gather(*(_probe(k, ip) for k, ip in targets))

            self._last_scan_finished_at = time.time()
            return self.get_status()

    def get_status(self) -> dict[str, Any]:
        reachable = sum(1 for d in self._devices.values() if d.reachable is True)
        with_ip = sum(1 for d in self._devices.values() if d.ip)
        return {
            "device_count": len(self._devices),
            "with_ip": with_ip,
            "reachable": reachable,
            "last_scan_started_at": self._last_scan_started_at,
            "last_scan_finished_at": self._last_scan_finished_at,
            "queued": self._scan_lock.locked(),
        }

    # ---------------------------------------------------------- discovery

    def _ensure(self, key: str, *, name: str, source: str) -> Device:
        dev = self._devices.get(key)
        if dev is None:
            dev = Device(key=key, name=name)
            self._devices[key] = dev
        elif not dev.name:
            dev.name = name
        dev.sources.append(source)
        return dev

    def _merge_registry_sources(self) -> None:
        reg = dr.async_get(self.hass)
        ent_reg = er.async_get(self.hass)
        # Build a quick (device_id -> [entity_id]) lookup.
        ent_by_device: dict[str, list[str]] = {}
        for entry in ent_reg.entities.values():
            if entry.device_id:
                ent_by_device.setdefault(entry.device_id, []).append(entry.entity_id)

        for d in reg.devices.values():
            mac = next(
                (
                    _normalize_mac(c[1])
                    for c in d.connections
                    if isinstance(c, (list, tuple)) and len(c) == 2 and c[0] == dr.CONNECTION_NETWORK_MAC
                ),
                None,
            )
            ip = _ip_from_url(d.configuration_url)
            key = mac or ip or f"device:{d.id}"
            name = d.name_by_user or d.name or "Unknown"
            dev = self._ensure(key, name=name, source="device_registry")
            if mac and not dev.mac:
                dev.mac = mac
            if ip and not dev.ip:
                dev.ip = ip
            if d.manufacturer and not dev.manufacturer:
                dev.manufacturer = d.manufacturer
            if d.model and not dev.model:
                dev.model = d.model
            for entity_id in ent_by_device.get(d.id, []):
                dev.entity_ids.append(entity_id)

    def _merge_entity_sources(self) -> None:
        # Pick up `device_tracker.*` entities that aren't already covered
        # by the device registry.
        for state in self.hass.states.async_all("device_tracker"):
            attrs = state.attributes or {}
            ip = (
                attrs.get("ip_address")
                or attrs.get("ip")
                or attrs.get("local_ip")
                or attrs.get("host_ip")
            )
            mac = _normalize_mac(
                attrs.get("mac_address") or attrs.get("mac") or attrs.get("host_mac")
            )
            if not (ip or mac):
                continue
            key = mac or ip
            name = attrs.get("friendly_name") or state.entity_id.split(".")[1]
            dev = self._ensure(key, name=name, source="device_tracker")
            if ip and not dev.ip:
                dev.ip = ip
            if mac and not dev.mac:
                dev.mac = mac
            dev.entity_ids.append(state.entity_id)

    def _merge_optional_discovery_sources(self) -> None:
        # Zeroconf / DHCP discovery data, if those integrations are loaded.
        # These caches are intentionally read defensively — Home Assistant
        # does not guarantee a stable internal shape for them.
        zc = self.hass.data.get("zeroconf")
        if zc and hasattr(zc, "_cache"):
            try:
                for info in list(getattr(zc, "_cache", {}).values())[:200]:
                    addresses = getattr(info, "addresses_by_version", None) or {}
                    flat: list[str] = []
                    for vlist in addresses.values():
                        flat.extend(vlist or [])
                    ip = next((a for a in flat if "." in a), None)
                    name = getattr(info, "name", None) or "zeroconf"
                    if ip:
                        dev = self._ensure(ip, name=name, source="zeroconf")
                        if not dev.ip:
                            dev.ip = ip
            except Exception:  # pragma: no cover - defensive
                _LOGGER.debug("Zeroconf merge skipped", exc_info=True)

        dhcp_state = self.hass.data.get("dhcp")
        if dhcp_state and hasattr(dhcp_state, "address_data"):
            try:
                for ip, info in list(getattr(dhcp_state, "address_data", {}).items())[:200]:
                    mac = _normalize_mac(info.get("macaddress") if isinstance(info, dict) else None)
                    hostname = info.get("hostname") if isinstance(info, dict) else None
                    key = mac or ip
                    dev = self._ensure(key, name=hostname or ip, source="dhcp")
                    if not dev.ip:
                        dev.ip = ip
                    if mac and not dev.mac:
                        dev.mac = mac
            except Exception:  # pragma: no cover - defensive
                _LOGGER.debug("DHCP merge skipped", exc_info=True)

    # ---------------------------------------------------------- probe

    @staticmethod
    async def _tcp_check(ip: str, port: int, timeout: float) -> bool:
        try:
            fut = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(fut, timeout=timeout)
        except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
            return False
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:  # pragma: no cover - defensive
            pass
        return True

    @staticmethod
    async def _tcp_status(ip: str, port: int, timeout: float) -> str:
        """Probe one TCP port, distinguishing host-up from host-down.

        Returns ``"open"`` (port accepts connections), ``"refused"`` (the host
        actively refused — it is up but the port is closed) or ``"down"`` (no
        response within the timeout, i.e. host unreachable/filtered). The
        refused vs down distinction is what lets the scanner mark live devices
        with no scannable open port as reachable instead of unreachable.
        """
        try:
            fut = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(fut, timeout=timeout)
        except ConnectionRefusedError:
            return "refused"
        except (asyncio.TimeoutError, OSError):
            return "down"
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:  # pragma: no cover - defensive
            pass
        return "open"
