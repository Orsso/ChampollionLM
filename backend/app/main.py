import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routes import auth as auth_routes, projects as project_routes, chat as chat_routes, project_chat as project_chat_routes
from app.core.settings import settings
from app.db.init_db import init_db
from app.utils.cleanup import cleanup_temp_files

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("champollion")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown events."""
    # Startup
    logger.info("Starting Champollion API", extra={"environment": settings.environment})
    await init_db()
    
    # Cleanup old temporary files
    temp_dir = Path("./tmp/mistral")
    if temp_dir.exists():
        deleted = cleanup_temp_files(temp_dir, max_age_hours=24)
        if deleted > 0:
            logger.info("Cleaned up temporary files", extra={"deleted": deleted})
    
    yield
    
    # Shutdown (if needed in the future)
    logger.info("Shutting down Champollion API")


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS based on environment
if settings.environment == "dev":
    cors_config = {
        "allow_origins": [
            "http://localhost:5173",  # Vite dev server
            "http://localhost:5174",  # Alternative port
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ],
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
else:  # prod or test
    cors_config = {
        "allow_origins": settings.cors_allowed_origins,
        "allow_methods": ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
    }

app.add_middleware(
    CORSMiddleware,
    **cors_config,
    allow_credentials=True,
)

app.include_router(auth_routes.router, prefix="/api")
app.include_router(project_routes.router, prefix="/api")
app.include_router(chat_routes.router, prefix="/api")
app.include_router(project_chat_routes.router, prefix="/api")

