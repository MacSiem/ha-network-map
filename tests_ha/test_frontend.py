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
    await resources.async_create_item({"res_type": "module", "url": f"{CARD_URL}?v=5.9.9"})
    await _setup(hass)
    assert [item["url"] for item in resources.async_items()] == [f"{CARD_URL}?v={VERSION}"]


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
