"""Review store with simple JSON-file persistence.

Reviews are kept in memory and mirrored to backend/data/reviews.json so they
survive a server restart. Starts empty on a fresh machine — run
`python3 -m app.seed` to preload the demo examples.
"""
from __future__ import annotations

import json
import os
import threading
from pathlib import Path
from typing import Dict, List, Optional

from .analyzer import analyze

# Override with NOPROBLAMA_DATA (used by tests so they don't touch real data).
DATA_FILE = Path(
    os.getenv("NOPROBLAMA_DATA", str(Path(__file__).resolve().parent.parent / "data" / "reviews.json"))
)


class ReviewStore:
    def __init__(self) -> None:
        self._reviews: Dict[str, dict] = {}
        self._order: List[str] = []  # newest first
        self._counter = 0
        self._lock = threading.Lock()
        self._load()

    def _load(self) -> None:
        if not DATA_FILE.exists():
            return
        try:
            data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
            self._order = [r["id"] for r in data]
            self._reviews = {r["id"]: r for r in data}
            self._counter = max((int(r["id"]) for r in data), default=0)
        except Exception:
            # Corrupt or unreadable file: start clean rather than crash.
            self._reviews, self._order, self._counter = {}, [], 0

    def _save(self) -> None:
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = [self._reviews[i] for i in self._order]
        DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def create(self, text: str, title: str = "", team: str = "") -> dict:
        result = analyze(text, title=title, team=team)
        with self._lock:
            self._counter += 1
            rid = str(self._counter)
            result["id"] = rid
            self._reviews[rid] = result
            self._order.insert(0, rid)  # newest at the top
            self._save()
        return result

    def get(self, rid: str) -> Optional[dict]:
        return self._reviews.get(rid)

    def list(self) -> List[dict]:
        return [self._reviews[r] for r in self._order]

    def delete(self, rid: str) -> bool:
        with self._lock:
            if rid not in self._reviews:
                return False
            del self._reviews[rid]
            self._order = [i for i in self._order if i != rid]
            self._save()
            return True


store = ReviewStore()
