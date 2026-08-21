"""Regression tests for frontend registration event-loop safety."""

from __future__ import annotations

import ast
import json
import unittest
from pathlib import Path


INIT_PATH = (
    Path(__file__).resolve().parents[1]
    / "custom_components"
    / "ha_network_map"
    / "__init__.py"
)
ROOT = Path(__file__).resolve().parents[1]
HACS_PATH = ROOT / "hacs.json"
MANIFEST_PATH = ROOT / "custom_components" / "ha_network_map" / "manifest.json"
CARD_PATH = (
    ROOT
    / "custom_components"
    / "ha_network_map"
    / "www"
    / "ha-network-map.js"
)


class FrontendRegistrationTests(unittest.TestCase):
    """Keep filesystem access out of Home Assistant's event loop."""

    def test_card_existence_check_runs_in_executor(self) -> None:
        tree = ast.parse(INIT_PATH.read_text(encoding="utf-8"))

        executor_calls = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Await)
            and isinstance(node.value, ast.Call)
            and isinstance(node.value.func, ast.Attribute)
            and node.value.func.attr == "async_add_executor_job"
        ]

        self.assertTrue(
            any(
                len(call.value.args) == 2
                and ast.unparse(call.value.args[0]) == "os.path.isfile"
                and ast.unparse(call.value.args[1]) == "card_path"
                for call in executor_calls
            ),
            "os.path.isfile(card_path) must be awaited via async_add_executor_job",
        )

    def test_network_scan_service_is_admin_only(self) -> None:
        source = INIT_PATH.read_text(encoding="utf-8")

        self.assertIn(
            "from homeassistant.helpers.service import async_register_admin_service",
            source,
        )
        self.assertIn(
            'async_register_admin_service(hass, DOMAIN, "scan", _handle_scan)',
            source,
        )
        self.assertNotIn(
            'hass.services.async_register(DOMAIN, "scan", _handle_scan)',
            source,
        )

    def test_static_path_floor_and_release_version_are_current(self) -> None:
        hacs = json.loads(HACS_PATH.read_text(encoding="utf-8"))
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        card_header = CARD_PATH.read_text(encoding="utf-8").splitlines()[0]

        self.assertEqual(hacs["homeassistant"], "2024.7.0")
        self.assertEqual(manifest["version"], "5.0.15")
        self.assertIn("v5.0.15", card_header)


if __name__ == "__main__":
    unittest.main()
