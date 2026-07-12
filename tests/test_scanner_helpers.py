"""Pure-python tests for scanner.py helper functions.

``scanner.py`` imports ``homeassistant.core`` and ``homeassistant.helpers``
at module scope (only for type hints / registry access used inside
methods we never call here). Real ``homeassistant`` is never installed in
this test environment, so minimal stub modules are inserted into
``sys.modules`` before the target module is exec'd. Only the pure helper
functions (``_is_private_ip``, ``_normalize_mac``, ``_ip_from_url``) and
the ``Device`` dataclass's ``to_dict`` are exercised — nothing that
touches ``hass``.
"""

from __future__ import annotations

import importlib.util
import sys
import types
import unittest
from pathlib import Path


def _stub_homeassistant() -> None:
    """Insert minimal fake ``homeassistant`` modules so scanner.py imports."""
    if "homeassistant.helpers.device_registry" in sys.modules:
        return

    ha = types.ModuleType("homeassistant")
    ha_core = types.ModuleType("homeassistant.core")
    ha_core.HomeAssistant = type("HomeAssistant", (), {})

    ha_helpers = types.ModuleType("homeassistant.helpers")
    ha_dr = types.ModuleType("homeassistant.helpers.device_registry")
    ha_dr.CONNECTION_NETWORK_MAC = "mac"
    ha_dr.async_get = lambda hass: None
    ha_er = types.ModuleType("homeassistant.helpers.entity_registry")
    ha_er.async_get = lambda hass: None

    ha_helpers.device_registry = ha_dr
    ha_helpers.entity_registry = ha_er
    ha.core = ha_core
    ha.helpers = ha_helpers

    sys.modules["homeassistant"] = ha
    sys.modules["homeassistant.core"] = ha_core
    sys.modules["homeassistant.helpers"] = ha_helpers
    sys.modules["homeassistant.helpers.device_registry"] = ha_dr
    sys.modules["homeassistant.helpers.entity_registry"] = ha_er


_stub_homeassistant()

COMPONENT_DIR = (
    Path(__file__).resolve().parents[1] / "custom_components" / "ha_network_map"
)
SCANNER_PATH = COMPONENT_DIR / "scanner.py"

# scanner.py does ``from .const import (...)`` — a relative import that
# requires a real parent package. Register a lightweight fake package in
# sys.modules and preload const.py under it so the relative import
# resolves without needing custom_components on sys.path.
_PKG = "_ha_network_map_test_pkg"
if _PKG not in sys.modules:
    pkg_module = types.ModuleType(_PKG)
    pkg_module.__path__ = [str(COMPONENT_DIR)]
    sys.modules[_PKG] = pkg_module

    const_spec = importlib.util.spec_from_file_location(
        f"{_PKG}.const", COMPONENT_DIR / "const.py"
    )
    assert const_spec and const_spec.loader
    const_module = importlib.util.module_from_spec(const_spec)
    sys.modules[f"{_PKG}.const"] = const_module
    const_spec.loader.exec_module(const_module)

spec = importlib.util.spec_from_file_location(f"{_PKG}.scanner", SCANNER_PATH)
assert spec and spec.loader
scanner = importlib.util.module_from_spec(spec)
scanner.__package__ = _PKG
sys.modules[f"{_PKG}.scanner"] = scanner
spec.loader.exec_module(scanner)

Device = scanner.Device
_is_private_ip = scanner._is_private_ip
_normalize_mac = scanner._normalize_mac
_ip_from_url = scanner._ip_from_url


class PrivateIpClassificationTests(unittest.TestCase):
    """RFC1918 / loopback / link-local / ULA vs public classification."""

    def test_rfc1918_10_range_is_private(self) -> None:
        self.assertTrue(_is_private_ip("10.0.0.5"))

    def test_rfc1918_192_168_range_is_private(self) -> None:
        self.assertTrue(_is_private_ip("192.168.1.124"))

    def test_rfc1918_172_16_range_is_private(self) -> None:
        self.assertTrue(_is_private_ip("172.20.5.3"))

    def test_loopback_is_private(self) -> None:
        self.assertTrue(_is_private_ip("127.0.0.1"))

    def test_link_local_is_private(self) -> None:
        self.assertTrue(_is_private_ip("169.254.1.1"))

    def test_ipv6_ula_is_private(self) -> None:
        self.assertTrue(_is_private_ip("fd00::1"))

    def test_public_ip_is_not_private(self) -> None:
        self.assertFalse(_is_private_ip("8.8.8.8"))

    def test_another_public_ip_is_not_private(self) -> None:
        self.assertFalse(_is_private_ip("1.1.1.1"))

    def test_invalid_ip_string_is_not_private(self) -> None:
        self.assertFalse(_is_private_ip("not-an-ip"))

    def test_empty_string_is_not_private(self) -> None:
        self.assertFalse(_is_private_ip(""))


class NormalizeMacTests(unittest.TestCase):
    """MAC address normalization from various registry-supplied shapes."""

    def test_colon_separated_mac_is_lowercased(self) -> None:
        self.assertEqual(_normalize_mac("AA:BB:CC:DD:EE:FF"), "aa:bb:cc:dd:ee:ff")

    def test_dash_separated_mac_is_normalized_to_colons(self) -> None:
        self.assertEqual(_normalize_mac("aa-bb-cc-dd-ee-ff"), "aa:bb:cc:dd:ee:ff")

    def test_bare_hex_digits_mac_gets_colons_inserted(self) -> None:
        self.assertEqual(_normalize_mac("aabbccddeeff"), "aa:bb:cc:dd:ee:ff")

    def test_none_returns_none(self) -> None:
        self.assertIsNone(_normalize_mac(None))

    def test_wrong_length_returns_none(self) -> None:
        self.assertIsNone(_normalize_mac("aa:bb:cc"))

    def test_non_string_returns_none(self) -> None:
        self.assertIsNone(_normalize_mac(12345))  # type: ignore[arg-type]


class IpFromUrlTests(unittest.TestCase):
    """Extracting an IPv4 literal out of a device's configuration_url."""

    def test_extracts_ip_from_http_url_with_port(self) -> None:
        self.assertEqual(_ip_from_url("http://192.168.1.124:8123"), "192.168.1.124")

    def test_extracts_ip_from_https_url_without_port(self) -> None:
        self.assertEqual(_ip_from_url("https://10.0.0.50/status"), "10.0.0.50")

    def test_none_input_returns_none(self) -> None:
        self.assertIsNone(_ip_from_url(None))

    def test_url_without_ip_returns_none(self) -> None:
        self.assertIsNone(_ip_from_url("https://homeassistant.local:8123"))


class DeviceToDictTests(unittest.TestCase):
    """Device dataclass serialization dedupes and sorts list fields."""

    def test_to_dict_dedupes_and_sorts_sources_entities_and_ports(self) -> None:
        device = Device(
            key="aa:bb:cc:dd:ee:ff",
            name="Roborock",
            ip="192.168.1.50",
            mac="aa:bb:cc:dd:ee:ff",
            sources=["zeroconf", "device_registry", "zeroconf"],
            entity_ids=["vacuum.roborock", "sensor.roborock_battery", "vacuum.roborock"],
            reachable=True,
            open_ports=[8123, 22, 8123, 80],
        )

        result = device.to_dict()

        self.assertEqual(result["sources"], ["device_registry", "zeroconf"])
        self.assertEqual(
            result["entity_ids"], ["sensor.roborock_battery", "vacuum.roborock"]
        )
        self.assertEqual(result["open_ports"], [22, 80, 8123])
        self.assertEqual(result["ip"], "192.168.1.50")
        self.assertTrue(result["reachable"])

    def test_to_dict_handles_unset_optional_fields(self) -> None:
        device = Device(key="device:1", name="Unknown")

        result = device.to_dict()

        self.assertIsNone(result["ip"])
        self.assertIsNone(result["mac"])
        self.assertIsNone(result["manufacturer"])
        self.assertIsNone(result["model"])
        self.assertIsNone(result["reachable"])
        self.assertEqual(result["sources"], [])
        self.assertEqual(result["open_ports"], [])


if __name__ == "__main__":
    unittest.main()
