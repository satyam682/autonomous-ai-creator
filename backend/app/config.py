import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if available
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Autonomous AI Creator Engine"
    VERSION: str = "1.0.0"
    
    # Breeth Memory Cloud Configuration
    BREETH_API_KEY: str = os.getenv("BREETH_API_KEY", "")
    BREETH_API_URL: str = os.getenv("BREETH_API_URL", "https://api.breeth.ai")
    
    # Cohere AI LLM Configuration
    COHERE_API_KEY: str = os.getenv("COHERE_API_KEY", "")
    COHERE_MODEL: str = os.getenv("COHERE_MODEL", "command-a-03-2025")
    
    # Tavily Search API Key
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    
    # OpenAI Model configuration (Optional)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    # Database
    BASE_DIR: Path = Path(__file__).parent.parent
    DB_PATH: str = os.getenv("DB_PATH", str(BASE_DIR / "agent_memory.db"))
    
    # Autonomous Cadence Settings
    DEFAULT_INTERVAL_MINUTES: int = int(os.getenv("PUBLISH_INTERVAL_MINUTES", "180"))
    
    # Host settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
