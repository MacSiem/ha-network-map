"""Network Map frontend registration in a real Home Assistant core."""

from __future__ import annotations

from homeassistant.components import frontend
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ha_network_map.const import (
    CARD_URL,
    DOMAIN,
    PANEL_URL_PATH,
    VERSION,
)


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    assert await async_setup_component(hass, "http", {})
    assert await async_setup_component(hass, "lovelace", {})
    entry = MockConfigEntry(domain=DOMAIN, data={}, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_fresh_setup_registers_one_resource_and_admin_panel(hass: HomeAssistant) -> None:
    await _setup(hass)
    resources = list(hass.data["lovelace"].resources.async_items())
    assert [(item["url"], item["type"]) for item in resources] == [
        (f"{CARD_URL}?v={VERSION}", "module")
    ]
    panel = hass.data[frontend.DATA_PANELS][PANEL_URL_PATH]
    assert panel.require_admin is True
    assert panel.config["_panel_custom"]["name"] == "ha-network-map"


async def test_existing_hacs_resource_is_not_duplicated(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "lovelace", {})
    resources = hass.data["lovelace"].resources
    await resources.async_load()
    resources.loaded = True
    hacs_url = "/hacsfiles/ha-network-map/ha-network-map.js?hacstag=1"
    await resources.async_create_item({"res_type": "module", "url": hacs_url})
    await _setup(hass)
    assert [item["url"] for item in resources.async_items()] == [hacs_url]


async def test_upgrade_refreshes_versioned_resource(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "lovelace", {})
    resources = hass.data["lovelace"].resources
    await resources.async_load()
    resources.loaded = True
    from unittest.mock import patch
    from custom_components.ha_network_map import frontend as card

    with patch.object(card, "VERSION", "5.9.9"):
        assert await card.async_register_card(hass) == "resource"
    owned_id = list(resources.async_items())[0]["id"]
    await _setup(hass)
    items = list(resources.async_items())
    assert len(items) == 1
    assert items[0]["id"] == owned_id
    assert items[0]["url"] == f"{CARD_URL}?v={VERSION}"


async def test_taken_panel_path_survives_unload(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "frontend", {})
    frontend.async_register_built_in_panel(
        hass, "iframe", sidebar_title="Other", sidebar_icon="mdi:web",
        frontend_url_path=PANEL_URL_PATH, config={"url": "/x"},
    )
    entry = await _setup(hass)
    assert hass.data[frontend.DATA_PANELS][PANEL_URL_PATH].component_name == "iframe"
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert PANEL_URL_PATH in hass.data[frontend.DATA_PANELS]


async def test_unload_removes_owned_resource_and_panel(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert PANEL_URL_PATH not in hass.data[frontend.DATA_PANELS]
    assert list(hass.data["lovelace"].resources.async_items()) == []


async def test_service_accepts_documented_options_and_rejects_invalid_requests(hass: HomeAssistant) -> None:
    import voluptuous as vol
    from custom_components.ha_network_map.const import DATA_SCANNER
    await _setup(hass)
    network = hass.data[DOMAIN][DATA_SCANNER]
    assert network.get_status()["last_scan_started_at"] is None
    await hass.services.async_call(DOMAIN, "scan", {"ports": [80], "timeout": 0.05, "max_concurrent": 1, "include_public_ips": False}, blocking=True)
    assert network.get_status()["last_scan_finished_at"] is not None
    finished = network.get_status()["last_scan_finished_at"]
    for options in [{"timeout": 100000}, {"max_concurrent": 65}, {"include_public_ips": "false"}, {"ports": [0]}]:
        try:
            await hass.services.async_call(DOMAIN, "scan", options, blocking=True)
        except vol.Invalid:
            pass
        else:
            raise AssertionError(f"Invalid service options accepted: {options}")
        assert network.get_status()["last_scan_finished_at"] == finished
