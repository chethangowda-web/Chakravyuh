"""Test isolation: use a throwaway data dir (SQLite + audio) and never call Sarvam."""

import os
import tempfile

os.environ["DATA_DIR"] = tempfile.mkdtemp(prefix="chakravyuh-test-")
os.environ["SARVAM_API_KEY"] = ""  # tests must not spend credits
