"""Owner runs with native HA core. Store I/O mocked: synthetic payload only."""
from copy import deepcopy
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
import pytest
from custom_components.ha_network_map.scan_history import build_snapshot
from custom_components.ha_network_map.scan_history_store import ScanHistory
from custom_components.ha_network_map import websocket_api as ws

NOW=datetime.now(timezone.utc).timestamp()
def snapshot():
    return build_snapshot([],started=NOW-1,finished=NOW,ports=(80,),timeout=.7,max_concurrent=16,include_public_ips=False,discovered=0,eligible=0,skipped={},reasons=[])

async def test_restart_reads_are_no_write_and_corrupt_future_payload_fail_closed(hass):
    for raw,expected in [(None,"empty"),({"schema":2,"snapshots":[snapshot()]},"ready"),({"schema":1,"scans":[snapshot()]},"migrated"),({"schema":999,"snapshots":[]},"unavailable"),({"schema":2,"snapshots":[{}]},"unavailable")]:
        store=AsyncMock();store.async_load.return_value=deepcopy(raw)
        with patch("custom_components.ha_network_map.scan_history_store.Store",return_value=store): history=ScanHistory(hass)
        await history.async_load();self_result=history.history()
        assert self_result["status"]==expected
        history.history();history.comparison(None,None)
        assert store.async_load.await_count==1;store.async_save.assert_not_awaited()
        if expected=="unavailable":
            assert await history.async_append(snapshot())=="unavailable"
            store.async_save.assert_not_awaited()

async def test_save_failure_keeps_old_readback_and_unload_blocks_new_save(hass):
    store=AsyncMock();store.async_load.return_value=None
    with patch("custom_components.ha_network_map.scan_history_store.Store",return_value=store): history=ScanHistory(hass)
    await history.async_load();store.async_save.side_effect=OSError("synthetic")
    assert await history.async_append(snapshot())=="save_failed"
    assert history.history()["snapshots"]==[]
    await history.async_close();store.async_save.reset_mock()
    assert await history.async_append(snapshot())=="unloaded";store.async_save.assert_not_awaited()

async def test_private_history_requires_admin_and_unloaded_read_errors(hass,hass_ws_client):
    from custom_components.ha_network_map.const import DOMAIN
    admin=await hass_ws_client(hass)
    ws.async_register_commands(hass)
    await admin.send_json({"id":1,"type":"ha_network_map/scan_history"})
    reply=await admin.receive_json();assert reply["success"] is False
    assert reply["error"]["code"]=="history_unavailable"

async def test_non_admin_cannot_read_private_history(hass,hass_ws_client):
    ws.async_register_commands(hass)
    from homeassistant.auth.const import GROUP_ID_READ_ONLY
    user=await hass.auth.async_create_user("Fixture readonly",group_ids=[GROUP_ID_READ_ONLY])
    token=await hass.auth.async_create_refresh_token(user)
    client=await hass_ws_client(hass,hass.auth.async_create_access_token(token))
    for request_id,command in enumerate(["ha_network_map/scan_history","ha_network_map/compare_scans"],1):
        await client.send_json({"id":request_id,"type":command})
        reply=await client.receive_json()
        assert reply["success"] is False
        assert reply["error"]["code"]=="unauthorized"

async def test_native_store_corrupt_file_is_unchanged_and_never_recaptured(hass):
    from pathlib import Path
    file=Path(hass.config.path(".storage","ha_network_map.scan_history"))
    file.parent.mkdir(parents=True,exist_ok=True)
    file.write_text("{corrupt synthetic fixture")
    history=ScanHistory(hass)
    await history.async_load()
    assert history.history()["status"]=="unavailable"
    assert await history.async_append(snapshot())=="unavailable"
    assert file.read_text()=="{corrupt synthetic fixture"
    assert not list(file.parent.glob("ha_network_map.scan_history.corrupt.*"))

async def test_native_store_failed_io_is_not_reported_as_saved(hass):
    from custom_components.ha_network_map.scan_history_store import Store
    from homeassistant.util.file import WriteError
    history=ScanHistory(hass)
    await history.async_load()
    with patch.object(history._store,"_async_write_data",side_effect=WriteError("synthetic failure")):
        assert await history.async_append(snapshot())=="save_failed"
    assert history.history()["snapshots"]==[]

async def test_native_store_restart_retains_saved_and_cap_is_thirty(hass):
    history=ScanHistory(hass);await history.async_load()
    for _ in range(32): assert await history.async_append(snapshot())=="saved"
    assert len(history.history()["snapshots"])==30
    restored=ScanHistory(hass);await restored.async_load()
    assert restored.history()["snapshots"]==history.history()["snapshots"]
    await restored.async_close()
    assert restored.history()["snapshots"]==[]

async def test_retention_cleanup_runs_from_lifecycle_not_comparison_open(hass):
    from datetime import timedelta
    old=snapshot()
    expired=datetime.now(timezone.utc)-timedelta(days=31)
    old["started_at"]=(expired-timedelta(seconds=1)).isoformat().replace("+00:00","Z")
    old["finished_at"]=expired.isoformat().replace("+00:00","Z")
    store=AsyncMock();store.async_load.return_value={"schema":2,"snapshots":[old]}
    with patch("custom_components.ha_network_map.scan_history_store.Store",return_value=store): history=ScanHistory(hass)
    await history.async_load()
    store.async_save.assert_awaited_once_with({"schema":2,"snapshots":[]})
    store.async_save.reset_mock();history.history();history.comparison()
    store.async_save.assert_not_awaited()
    await history.async_close()
