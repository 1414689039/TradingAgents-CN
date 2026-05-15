import os
import sys
from pathlib import Path

# Fix Windows GBK encoding for emoji characters
os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

# Ensure project root is on path so tradingagents can be imported
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.analysis import router as analysis_router
from backend.routes.config import router as config_router
from backend.services.progress_manager import progress_manager
from tradingagents.utils.logging_manager import get_logger

logger = get_logger("backend.api")

# Load environment variables
env_file = project_root / ".env"
if env_file.exists():
    load_dotenv(env_file)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Backend API starting...")
    yield
    logger.info("Backend API shutting down...")


app = FastAPI(
    title="TradingAgents-CN API",
    description="Multi-agent LLM Chinese financial trading analysis API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)
app.include_router(config_router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "version": "1.0.0",
        "python": sys.version,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
