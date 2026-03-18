import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
DATABASE_URL: str | None = os.getenv("DATABASE_URL")
# 예: postgresql://user:pass@localhost:5432/naming_studio

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

# Auth
JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRE_DAYS: int = int(os.getenv("JWT_EXPIRE_DAYS", "30"))
# Expo Go에서는 host.exp.Exponent, 프로덕션에서는 실제 bundle ID로 변경
APPLE_BUNDLE_ID: str = os.getenv("APPLE_BUNDLE_ID", "host.exp.Exponent")
