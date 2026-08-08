import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if available
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Autonomous AI Creator Engine"
    VERSION: str = "1.0.0"
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    
    # Model configuration
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    # Database
    BASE_DIR: Path = Path(__file__).parent.parent
    DB_PATH: str = os.getenv("DB_PATH", str(BASE_DIR / "agent_memory.db"))
    
    # Autonomous Cadence Settings
    # 48 hours = 2880 minutes. 1 post every 180 mins (3 hours) = 16 high quality posts over 48h
    DEFAULT_INTERVAL_MINUTES: int = int(os.getenv("PUBLISH_INTERVAL_MINUTES", "180"))
    
    # Host settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
