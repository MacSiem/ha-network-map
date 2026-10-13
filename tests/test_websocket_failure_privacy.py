"""Execute real WS handlers with a failing scanner; no network or HA required."""
import ast
import logging
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock


SOURCE = Path(__file__).parents[1] / 'custom_components/ha_network_map/websocket_api.py'
LOGGER = logging.getLogger('network_map_ws_privacy_test')


def handler(name, scanner):
    tree = ast.parse(SOURCE.read_text())
    node = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == name)
    node.decorator_list = []
    future = ast.ImportFrom(module='__future__', names=[ast.alias(name='annotations')], level=0)
    module = ast.fix_missing_locations(ast.Module(body=[future, node], type_ignores=[]))
    namespace = {'_scanner': lambda hass: scanner, '_LOGGER': LOGGER}
    exec(compile(module, str(SOURCE), 'exec'), namespace)
    return namespace[name]


class WebsocketFailurePrivacy(unittest.IsolatedAsyncioTestCase):
    async def test_errors_keep_codes_without_exposing_exception_or_traceback(self):
        for name, method, code, message in (
            ('_ws_list', 'list_devices', 'list_failed', {'id': 17, 'include_non_network': False}),
            ('_ws_scan', 'scan', 'scan_failed', {'id': 18, 'timeout': 1, 'max_concurrent': 2, 'include_public_ips': False}),
        ):
            with self.subTest(handler=name):
                scanner = SimpleNamespace(**{method: AsyncMock(side_effect=RuntimeError('SYNTHETIC_PRIVATE_DEVICE_DETAIL'))})
                connection = SimpleNamespace(send_error=Mock(), send_result=Mock())
                with self.assertLogs(LOGGER, level='WARNING') as logs:
                    await handler(name, scanner)(object(), connection, message)
                connection.send_result.assert_not_called()
                connection.send_error.assert_called_once()
                args = connection.send_error.call_args.args
                self.assertEqual(args[:2], (message['id'], code))
                self.assertNotIn('SYNTHETIC_PRIVATE_DEVICE_DETAIL', str(args) + str(logs.output))
                self.assertTrue(all(record.exc_info is None for record in logs.records))

    async def test_success_returns_scanner_result_without_a_warning(self):
        for name, method, result, expected, message in (
            ('_ws_list', 'list_devices', [], {'devices': []}, {'id': 17, 'include_non_network': False}),
            ('_ws_scan', 'scan', {'queued': True}, {'queued': True}, {'id': 18, 'timeout': 1, 'max_concurrent': 2, 'include_public_ips': False}),
        ):
            with self.subTest(handler=name):
                scanner = SimpleNamespace(**{method: AsyncMock(return_value=result)})
                connection = SimpleNamespace(send_error=Mock(), send_result=Mock())
                with self.assertNoLogs(LOGGER):
                    await handler(name, scanner)(object(), connection, message)
                connection.send_error.assert_not_called()
                connection.send_result.assert_called_once_with(message['id'], expected)
