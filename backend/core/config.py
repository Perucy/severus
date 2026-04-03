from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Models and API Keys
    ANTHROPIC_AI_MODEL: str = "claude-sonnet-4-20250514"
    ANTHROPIC_API_KEY: str

    # Database (Supabase)
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    


    
    
settings = Settings()