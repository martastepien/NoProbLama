"""Optional demo seeder.

The app starts empty. Run this once to preload the sample messages (handy for a
demo so the dashboard and insights aren't blank). They're analyzed by the real
engine and persisted like any other review.

    cd backend && python3 -m app.seed
"""
from .storage import store
from .samples import SAMPLE_MESSAGES


def main() -> None:
    existing = {r["title"] for r in store.list()}
    added = 0
    for s in SAMPLE_MESSAGES:
        if s["title"] in existing:
            continue  # don't duplicate on repeated runs
        store.create(s["text"], title=s["title"], team=s["team"])
        added += 1
    print(f"Seeded {added} sample review(s). Total now: {len(store.list())}.")


if __name__ == "__main__":
    main()
