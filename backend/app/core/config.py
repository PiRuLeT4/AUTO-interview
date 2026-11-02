from pathlib import Path
import os
from dotenv import load_dotenv

# Raíz del proyecto (donde está el .env global)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR.parent / ".env")
load_dotenv(dotenv_path=BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "AutoInterview AI - Backend"
    VERSION: str = "1.0.0"

    # CORS para comunicación con el frontend (Vite)
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx"}

    # Directorio de almacenamiento temporal de CVs
    STORAGE_DIR: Path = BASE_DIR / "storage" / "cvs"

settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
