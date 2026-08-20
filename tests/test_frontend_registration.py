"""Regression tests for frontend registration event-loop safety."""

from __future__ import annotations

import ast
import unittest
from pathlib import Path


INIT_PATH = (
    Path(__file__).resolve().parents[1]
    / "custom_components"
    / "ha_network_map"
    / "__init__.py"
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


if __name__ == "__main__":
    unittest.main()
