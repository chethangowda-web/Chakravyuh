"""Save / restore the demo dataset so the product can be shown with zero network.

  python scripts/demo_data.py save      # snapshot backend/data  -> backend/seed/
  python scripts/demo_data.py restore   # backend/seed/          -> backend/data  (stop the backend first!)

The snapshot contains the demo targets, campaigns, regression runs, spoken (voice) findings with their audio
files, and the small Sarvam response caches (translate, language ID, chat) so Attack Studio previews work
offline. The text-to-speech cache is left out: it is base64 audio (tens of MB for a few dozen entries) and the
saved voice findings play from the audio files instead. It contains no secrets: the Sarvam key lives only in .env.
"""

import shutil
import sqlite3
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / "backend"
DATA = BACKEND / "data"
SEED = BACKEND / "seed"


def save() -> None:
    db = DATA / "app.db"
    if not db.exists():
        raise SystemExit("No database found. Run the app and a campaign first.")
    conn = sqlite3.connect(db)
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    conn.close()
    SEED.mkdir(exist_ok=True)
    shutil.copy2(db, SEED / "app.db")
    trim = sqlite3.connect(SEED / "app.db")  # the copy only; the live database is untouched
    trim.execute("DELETE FROM sarvamcache WHERE endpoint = '/text-to-speech'")
    trim.commit()
    trim.execute("VACUUM")
    trim.close()
    audio_dst = SEED / "audio"
    shutil.rmtree(audio_dst, ignore_errors=True)
    if (DATA / "audio").exists():
        shutil.copytree(DATA / "audio", audio_dst)
    size = sum(f.stat().st_size for f in SEED.rglob("*") if f.is_file()) / 1e6
    print(f"Saved demo data to {SEED} ({size:.1f} MB)")


def restore() -> None:
    if not (SEED / "app.db").exists():
        raise SystemExit("No snapshot found in backend/seed/. Run `save` on a prepared machine first.")
    DATA.mkdir(exist_ok=True)
    for leftover in ("app.db-wal", "app.db-shm"):
        (DATA / leftover).unlink(missing_ok=True)
    shutil.copy2(SEED / "app.db", DATA / "app.db")
    shutil.rmtree(DATA / "audio", ignore_errors=True)
    if (SEED / "audio").exists():
        shutil.copytree(SEED / "audio", DATA / "audio")
    else:
        (DATA / "audio").mkdir()
    print(f"Restored demo data into {DATA}")


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    {"save": save, "restore": restore}.get(command, lambda: sys.exit(__doc__))()
