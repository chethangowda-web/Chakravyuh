"""Database engine and session management (SQLite via SQLModel)."""

from collections.abc import Iterator
from typing import Any

from sqlalchemy import event, text
from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings

_settings = get_settings()
_settings.data_dir.mkdir(parents=True, exist_ok=True)
_settings.audio_dir.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    _settings.resolved_database_url,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _sqlite_pragmas(dbapi_connection: Any, _: Any) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")  # concurrent reads while the runner writes
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Columns added after the first release. `create_all` never alters existing tables, so databases
# created earlier (including the saved demo snapshot) are upgraded in place, keeping their data.
_ADDED_COLUMNS: dict[str, dict[str, str]] = {
    "testcase": {
        "mission_id": "VARCHAR",
        "turn": "INTEGER",
        "tactic": "VARCHAR",
        "attacker_note": "VARCHAR",
    },
    "target": {"fix_webhook_url": "VARCHAR", "legit_questions": "JSON"},
    "fixproposal": {"fix_case_ids": "JSON", "heldout_case_ids": "JSON"},
}


def migrate() -> None:
    with engine.begin() as conn:
        for table, columns in _ADDED_COLUMNS.items():
            existing = {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")}
            for name, ddl in columns.items():
                if existing and name not in existing:
                    conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")


def init_db() -> None:
    import app.models  # noqa: F401  (registers tables on SQLModel.metadata)

    SQLModel.metadata.create_all(engine)
    migrate()
    with engine.begin() as conn:  # index for fast mission lookups (also on upgraded databases)
        conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_testcase_mission_id ON testcase (mission_id)")


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def database_ok() -> bool:
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1"))  # type: ignore[call-overload]
        return True
    except Exception:
        return False
