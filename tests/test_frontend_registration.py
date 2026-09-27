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
FRONTEND_PATH = INIT_PATH.with_name("frontend.py")
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
        tree = ast.parse(FRONTEND_PATH.read_text(encoding="utf-8"))

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
                len(call.value.args) == 1
                and ast.unparse(call.value.args[0]) == "(www / CARD_FILENAME).is_file"
                for call in executor_calls
            ),
            "Bundled card stat must be awaited via async_add_executor_job",
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

        self.assertEqual(hacs["homeassistant"], "2025.2.0")
        self.assertEqual(manifest["version"], "5.0.16")
        self.assertIn("v5.0.16", card_header)

    def test_card_does_not_install_cross_card_injectors(self) -> None:
        source = CARD_PATH.read_text(encoding="utf-8")

        self.assertIn("const _esc = (s) => _escBase(_asText(s));", source)
        self.assertIn('data-source="own-card"', source)
        self.assertIn("buymeacoffee.com/macsiem", source)
        self.assertIn("this.shadowRoot.innerHTML = html + support;", source)
        self.assertIn("this._hass?.user?.is_admin && this.config?.show_support !== false", source)
        for marker in ("SPLIT_TAGS", "deepFindAll", "injectAll", "__haToolsSplitDonateInjector", "window._haToolsEsc"):
            with self.subTest(marker=marker):
                self.assertNotIn(marker, source)


if __name__ == "__main__":
    unittest.main()
