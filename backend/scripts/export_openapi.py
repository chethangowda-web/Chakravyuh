"""Print the OpenAPI contract as JSON to stdout (no server needed).

Used by `npm run gen:api` / `npm run contract:check` in the frontend.
Usage (from backend/):  python -m scripts.export_openapi
"""

import json
import sys

from app.main import app


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    sys.stdout.write(json.dumps(app.openapi(), indent=2, ensure_ascii=False))
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
