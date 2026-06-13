"""In-memory review store. Seeded at startup with the sample messages."""
from __future__ import annotations

import threading
from typing import Dict, List, Optional

from .analyzer import analyze
from .samples import SAMPLE_MESSAGES


class ReviewStore:
    def __init__(self) -> None:
        self._reviews: Dict[str, dict] = {}
        self._order: List[str] = []
        self._counter = 0
        self._lock = threading.Lock()

    def create(self, text: str, title: str = "", team: str = "") -> dict:
        result = analyze(text, title=title, team=team)
        with self._lock:
            self._counter += 1
            rid = str(self._counter)
            result["id"] = rid
            self._reviews[rid] = result
            self._order.insert(0, rid)  # newest at the top
        return result

    def get(self, rid: str) -> Optional[dict]:
        return self._reviews.get(rid)

    def list(self) -> List[dict]:
        return [self._reviews[r] for r in self._order]

    def seed(self) -> None:
        for s in SAMPLE_MESSAGES:
            self.create(s["text"], title=s["title"], team=s["team"])


store = ReviewStore()
store.seed()
