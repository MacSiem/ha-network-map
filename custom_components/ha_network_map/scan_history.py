"""Validated completed TCP snapshots and comparison; no HA I/O or network."""
from __future__ import annotations

from collections import Counter
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import ipaddress
import json
import math
import re
from typing import Any
from uuid import UUID, uuid4

SCHEMA = 2
MAX_SNAPSHOTS = 30
MAX_RECORDS = 256
MAX_BYTES = 8 * 1024 * 1024
MAX_AGE = timedelta(days=30)
SOURCE = "ha_server_tcp"
SKIPS = {"no_ip", "public_ip", "device_cap"}
REASONS = SKIPS | {"zeroconf_cap", "dhcp_cap", "zeroconf_unreadable", "dhcp_unreadable", "unknown_identity"}

def _utc(value: Any) -> datetime:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError("UTC timestamp required")
    try:
        result = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as err:
        raise ValueError("Invalid timestamp") from err
    if result.utcoffset() != timedelta(0):
        raise ValueError("UTC timestamp required")
    return result

def _stamp(value: float) -> str:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError("Invalid timestamp")
    return datetime.fromtimestamp(value, timezone.utc).isoformat().replace("+00:00", "Z")

def _integer(value: Any, minimum: int = 0, maximum: int = 1000000) -> bool:
    return type(value) is int and minimum <= value <= maximum

def _text(value: Any, maximum: int = 256) -> bool:
    return isinstance(value, str) and 0 < len(value) <= maximum and not any(ord(c) < 32 for c in value)

def _mac(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    value = value.strip().lower().replace("-", ":").replace(".", "")
    if re.fullmatch(r"[a-f0-9]{12}", value):
        value = ":".join(value[i:i+2] for i in range(0,12,2))
    return value if re.fullmatch(r"(?:[a-f0-9]{2}:){5}[a-f0-9]{2}", value) else None

def _identity(row: dict) -> str | None:
    if _text(row.get("device_id"), 128):
        return "device:" + row["device_id"]
    mac = _mac(row.get("mac"))
    return "mac:" + mac if mac else None

def validate_snapshot(value: Any) -> dict:
    """Reject untrusted/malformed payloads, including forged coverage/identity."""
    keys = {"schema", "id", "completed", "source", "started_at", "finished_at", "method", "scope", "mode", "caps", "discovered_count", "eligible_count", "target_count", "completed_count", "skipped", "coverage", "reasons", "unknown_identity_count", "records"}
    if not isinstance(value, dict) or set(value) != keys or type(value["schema"]) is not int or value["schema"] != SCHEMA or value["completed"] is not True or value["source"] != SOURCE:
        raise ValueError("Not a validated completed snapshot")
    try:
        UUID(value["id"])
    except (ValueError, TypeError, AttributeError) as err:
        raise ValueError("Invalid snapshot ID") from err
    if _utc(value["finished_at"]) < _utc(value["started_at"]):
        raise ValueError("Completion precedes start")
    method = value["method"]
    if not isinstance(method, dict) or set(method) != {"protocol","ports","timeout","max_concurrent"} or method["protocol"] != "tcp_connect_v1":
        raise ValueError("Invalid method")
    ports = method["ports"]
    if not isinstance(ports,list) or not 1 <= len(ports) <= 12 or any(not _integer(port,1,65535) for port in ports) or ports != sorted(set(ports)):
        raise ValueError("Invalid ports")
    timeout = method["timeout"]
    if type(timeout) not in (float,int) or not math.isfinite(timeout) or not .05 <= timeout <= 5 or not _integer(method["max_concurrent"],1,64):
        raise ValueError("Invalid method limits")
    scope = value["scope"]
    if not isinstance(scope,dict) or set(scope) != {"discovery","include_public_ips"} or scope["discovery"] != "ha_known_devices_v1" or type(scope["include_public_ips"]) is not bool or value["mode"] != "tcp":
        raise ValueError("Invalid configured scope")
    if value["caps"] != {"devices":MAX_RECORDS,"optional_cache":200} or any(type(n) is not int for n in value["caps"].values()):
        raise ValueError("Invalid caps")
    for key in ("discovered_count","eligible_count","target_count","completed_count","unknown_identity_count"):
        if not _integer(value[key]):
            raise ValueError("Invalid count")
    skipped = value["skipped"]
    if not isinstance(skipped,dict) or set(skipped) - SKIPS or any(not _integer(n) for n in skipped.values()):
        raise ValueError("Invalid skipped counts")
    reasons = value["reasons"]
    if not isinstance(reasons,list) or any(not isinstance(r,str) or r not in REASONS for r in reasons) or reasons != sorted(set(reasons)):
        raise ValueError("Invalid reasons")
    records = value["records"]
    if not isinstance(records,list) or len(records) > MAX_RECORDS or value["target_count"] != len(records) or value["completed_count"] != len(records):
        raise ValueError("Incomplete scan")
    if value["eligible_count"] != len(records) + skipped.get("device_cap",0) or value["discovered_count"] != value["eligible_count"] + skipped.get("public_ip",0) + skipped.get("no_ip",0):
        raise ValueError("Inconsistent counts")
    identities = []
    macs = []
    for row in records:
        if not isinstance(row,dict) or set(row) != {"stable_id","identity_state","device_id","mac","name","ip","reachable","open_ports"} or not _text(row["name"],256):
            raise ValueError("Invalid record")
        if row["device_id"] is not None and not _text(row["device_id"],128):
            raise ValueError("Invalid registry ID")
        if row["mac"] is not None and _mac(row["mac"]) != row["mac"]:
            raise ValueError("Invalid MAC")
        try:
            if str(ipaddress.ip_address(row["ip"])) != row["ip"]:
                raise ValueError("Noncanonical IP")
        except (ValueError,TypeError) as err:
            raise ValueError("Invalid measured IP") from err
        if type(row["reachable"]) is not bool or not isinstance(row["open_ports"],list) or any(p not in ports or type(p) is not int for p in row["open_ports"]) or row["open_ports"] != sorted(set(row["open_ports"])) or (row["open_ports"] and not row["reachable"]):
            raise ValueError("Invalid TCP measurement")
        identities.append(_identity(row));macs.append(row["mac"])
    counts = Counter(identities);mac_counts = Counter(macs)
    unknown = 0
    for row, identity in zip(records,identities):
        ambiguous = identity is not None and (counts[identity] > 1 or (row["mac"] and mac_counts[row["mac"]] > 1))
        state = "missing" if identity is None else "ambiguous" if ambiguous else "stable"
        if row["identity_state"] != state or row["stable_id"] != (identity if state == "stable" else None):
            raise ValueError("Invalid stable identity")
        unknown += state != "stable"
    if value["unknown_identity_count"] != unknown:
        raise ValueError("Invalid identity count")
    if any(n > 0 and key not in reasons for key,n in skipped.items()) or (unknown > 0) != ("unknown_identity" in reasons):
        raise ValueError("Missing coverage reason")
    coverage = "partial" if reasons or any(skipped.values()) or unknown else "full"
    if value["coverage"] != coverage:
        raise ValueError("Invalid coverage")
    return deepcopy(value)

def build_snapshot(rows: list[dict], *, started: float, finished: float, ports, timeout, max_concurrent, include_public_ips, discovered, eligible, skipped, reasons) -> dict:
    """Called only by scanner after every frozen target's TCP work completes."""
    records = []
    for row in rows:
        name = str(row.get("name") or "Unknown")
        name = "".join(c for c in name if ord(c) >= 32)[:256] or "Unknown"
        records.append({"device_id":row.get("device_id"),"mac":_mac(row.get("mac")),"name":name,"ip":row.get("ip"),"reachable":row.get("reachable"),"open_ports":sorted(set(row.get("open_ports",[]))),"stable_id":None,"identity_state":"missing"})
    identities = Counter(_identity(row) for row in records)
    macs = Counter(row["mac"] for row in records)
    unknown = 0
    for row in records:
        identity = _identity(row)
        row["identity_state"] = "missing" if identity is None else "ambiguous" if identities[identity] > 1 or (row["mac"] and macs[row["mac"]] > 1) else "stable"
        row["stable_id"] = identity if row["identity_state"] == "stable" else None
        unknown += row["identity_state"] != "stable"
    reasons = set(reasons) | {reason for reason,n in skipped.items() if n}
    if unknown:
        reasons.add("unknown_identity")
    snapshot = {"schema":SCHEMA,"id":str(uuid4()),"completed":True,"source":SOURCE,"started_at":_stamp(started),"finished_at":_stamp(finished),"method":{"protocol":"tcp_connect_v1","ports":sorted(set(ports)),"timeout":timeout,"max_concurrent":max_concurrent},"scope":{"discovery":"ha_known_devices_v1","include_public_ips":include_public_ips},"mode":"tcp","caps":{"devices":MAX_RECORDS,"optional_cache":200},"discovered_count":discovered,"eligible_count":eligible,"target_count":len(records),"completed_count":len(records),"skipped":dict(skipped),"coverage":"partial" if reasons else "full","reasons":sorted(reasons),"unknown_identity_count":unknown,"records":records}
    return validate_snapshot(snapshot)

def retain(snapshots: list[dict], now: datetime) -> list[dict]:
    return sorted((deepcopy(s) for s in snapshots if now-MAX_AGE <= _utc(s["finished_at"]) <= now+timedelta(minutes=5)),key=lambda s:_utc(s["finished_at"]),reverse=True)[:MAX_SNAPSHOTS]

def decode_history(payload: Any, now: datetime) -> tuple[list[dict],str]:
    if payload is None:
        return [], "empty"
    if not isinstance(payload,dict) or type(payload.get("schema")) is not int:
        raise ValueError("Invalid history")
    schema = payload["schema"]
    if schema not in (1,SCHEMA):
        raise ValueError("Unsupported history schema; do not overwrite")
    key = "scans" if schema == 1 else "snapshots"
    if set(payload) != {"schema",key}:
        raise ValueError("Invalid history envelope")
    if len(json.dumps(payload,allow_nan=False).encode()) > MAX_BYTES:
        raise ValueError("History is too large")
    rows = payload[key]
    if not isinstance(rows,list) or len(rows) > MAX_SNAPSHOTS:
        raise ValueError("Invalid history limit")
    validated = [validate_snapshot(row) for row in rows]
    if len({row["id"] for row in validated}) != len(validated):
        raise ValueError("Duplicate snapshots")
    if any(_utc(row["finished_at"]) > now+timedelta(minutes=5) for row in validated):
        raise ValueError("Future snapshot")
    return retain(validated,now), "migrated" if schema == 1 else "ready"

def metadata(snapshot: dict) -> dict:
    return {key:deepcopy(value) for key,value in snapshot.items() if key not in ("records","schema","completed")}

def compare_snapshots(before: dict | None, after: dict | None) -> dict:
    result = {"state":"no_data","comparable":False,"reasons":["missing_pair"],"before":metadata(before) if before else None,"after":metadata(after) if after else None,"counts":{"new":None,"not_in_scan":None,"ip_changed":None,"unchanged":None,"unknown":None},"changes":[]}
    if before is None or after is None:
        return result
    before,after = validate_snapshot(before),validate_snapshot(after)
    mismatch = [key+"_mismatch" for key in ("method","scope","mode","caps") if before[key] != after[key]]
    if before["id"] == after["id"] or _utc(before["finished_at"]) > _utc(after["finished_at"]):
        mismatch.append("invalid_order")
    if mismatch:
        result.update(state="unconfirmed",reasons=mismatch)
        return result
    result["counts"] = {key:0 for key in result["counts"]}
    complete = before["coverage"] == after["coverage"] == "full"
    result.update(state="success" if complete else "partial",comparable=True,reasons=sorted(set(before["reasons"]+after["reasons"])))
    old = {row["stable_id"]:row for row in before["records"] if row["stable_id"]}
    new = {row["stable_id"]:row for row in after["records"] if row["stable_id"]}
    for identity in sorted(old.keys() | new.keys()):
        a,b = old.get(identity),new.get(identity)
        kind = "ip_changed" if a and b and a["ip"] != b["ip"] else "unchanged" if a and b else "new" if b and complete else "not_in_scan" if a and complete else "unknown"
        result["counts"][kind] += 1
        result["changes"].append({"stable_id":identity,"kind":kind,"before":deepcopy(a),"after":deepcopy(b)})
    for side,snapshot in (("before",before),("after",after)):
        for row in snapshot["records"]:
            if not row["stable_id"]:
                result["counts"]["unknown"] += 1
                result["changes"].append({"stable_id":None,"kind":"unknown","before":deepcopy(row) if side == "before" else None,"after":deepcopy(row) if side == "after" else None})
    return result
