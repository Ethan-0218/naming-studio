import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

_here = Path(__file__).resolve().parent
HANJA_DB_PATH: Path = Path(os.getenv("HANJA_DB_PATH", str(_here.parent / "db" / "hanja.sqlite3")))
REGISTERED_NAME_DB_PATH: Path = Path(
    os.getenv("REGISTERED_NAME_DB_PATH", str(_here.parent / "db" / "registered_name.sqlite3"))
)
NAME_HANJA_COMBINATIONS_DB_PATH: Path = Path(
    os.getenv(
        "NAME_HANJA_COMBINATIONS_DB_PATH",
        str(_here.parent / "db" / "name_hanja_combinations.sqlite3"),
    )
)
SCORED_COMBINATIONS_DB_PATH: Path = Path(
    os.getenv(
        "SCORED_COMBINATIONS_DB_PATH",
        str(_here.parent / "db" / "scored_combinations.sqlite3"),
    )
)
