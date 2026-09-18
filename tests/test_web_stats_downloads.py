"""Test per GET /api/stats — il contatore dei download PyPI.

Regressione reale: il campo `pypi_downloads_month` veniva riempito sommando
l'endpoint `/system` di pypistats, che ripartisce i download per sistema
operativo sull'INTERA storia del pacchetto. Il sito pubblicava quindi un
cumulativo storico (~74.000) sotto l'etichetta "downloads/mo", mentre i
download reali dell'ultimo mese erano ~5.700.

Nessuna chiamata di rete: `urllib.request.urlopen` è mockato.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

pytest.importorskip("fastapi", reason="FastAPI non installato (pip install geo-optimizer-skill[web])")
pytest.importorskip("httpx", reason="httpx non installato (pip install httpx)")

from starlette.testclient import TestClient

from geo_optimizer.web import app as app_module

# Forma reale di pypistats /recent
RECENT_PAYLOAD = {"data": {"last_day": 420, "last_week": 1_508, "last_month": 5_690}}

# Forma reale di pypistats /system (ripartizione per OS, storica)
SYSTEM_PAYLOAD = {
    "data": [
        {"category": "Linux", "downloads": 67_432},
        {"category": "Darwin", "downloads": 4_701},
        {"category": "Windows", "downloads": 2_194},
        {"category": "null", "downloads": 9_361},
    ]
}

GITHUB_PAYLOAD = {"stargazers_count": 831}


class _FakeResponse:
    def __init__(self, payload: dict) -> None:
        self.status = 200
        self._payload = payload

    def read(self) -> bytes:
        return json.dumps(self._payload).encode()

    def __enter__(self):
        return self

    def __exit__(self, *_exc) -> None:
        return None


@pytest.fixture
def stats_client(monkeypatch):
    """Client con la cache di /api/stats svuotata e le URL chiamate registrate."""
    if hasattr(app_module.stats, "_stats_cache"):
        delattr(app_module.stats, "_stats_cache")
    called: list[str] = []

    def fake_urlopen(req, timeout=None):
        url = req.full_url if hasattr(req, "full_url") else str(req)
        called.append(url)
        if "api.github.com" in url:
            return _FakeResponse(GITHUB_PAYLOAD)
        if "/recent" in url:
            return _FakeResponse(RECENT_PAYLOAD)
        if "/system" in url:
            return _FakeResponse(SYSTEM_PAYLOAD)
        return _FakeResponse({})

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    with TestClient(app_module.app) as client:
        yield client, called
    if hasattr(app_module.stats, "_stats_cache"):
        delattr(app_module.stats, "_stats_cache")


def test_downloads_month_e_last_month_non_un_cumulativo(stats_client):
    client, _called = stats_client
    body = client.get("/api/stats").json()

    assert body["pypi_downloads_month"] == 5_690, (
        "il campo deve riportare i download dell'ultimo mese"
    )
    # Il controtest che conta: la somma di /system è il bug storico.
    assert body["pypi_downloads_month"] != 74_327, "sommato /system: cumulativo storico"
    assert body["pypi_downloads_month"] != 83_688, "sommato /system incluso null"


def test_interroga_endpoint_recent_non_system(stats_client):
    client, called = stats_client
    client.get("/api/stats")

    pypi_urls = [u for u in called if "pypistats.org" in u]
    assert pypi_urls, "nessuna chiamata a pypistats"
    assert all("/recent" in u for u in pypi_urls), f"atteso /recent, chiamato: {pypi_urls}"
    assert not any("/system" in u for u in pypi_urls)


def test_payload_pypi_assente_non_rompe_la_risposta(stats_client, monkeypatch):
    """Se pypistats è giù, il campo resta 0 invece di far fallire /api/stats."""
    monkeypatch.setattr("urllib.request.urlopen", lambda *a, **k: _FakeResponse({}))
    client, _called = stats_client
    body = client.get("/api/stats").json()

    assert body["pypi_downloads_month"] == 0
    assert "github_stars" in body
