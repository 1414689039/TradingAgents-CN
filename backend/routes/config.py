import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/config", tags=["config"])


class ModelConfig(BaseModel):
    provider: str
    model: str
    api_key: str = ""
    enabled: bool = True


@router.get("/providers")
async def list_providers():
    """List available LLM providers and their models."""
    providers = {
        "dashscope": {
            "name": "Alibaba DashScope (Qwen)",
            "models": [
                "qwen-turbo", "qwen-plus", "qwen-max",
                "qwen-max-longcontext", "qwen-vl-plus", "qwen-vl-max",
            ],
            "requires_api_key": "DASHSCOPE_API_KEY",
        },
        "deepseek": {
            "name": "DeepSeek",
            "models": ["deepseek-chat", "deepseek-reasoner"],
            "requires_api_key": "DEEPSEEK_API_KEY",
        },
        "openai": {
            "name": "OpenAI",
            "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o4-mini"],
            "requires_api_key": "OPENAI_API_KEY",
        },
        "google": {
            "name": "Google Gemini",
            "models": [
                "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash",
                "gemini-2.0-flash-lite",
            ],
            "requires_api_key": "GOOGLE_API_KEY",
        },
        "siliconflow": {
            "name": "SiliconFlow (China)",
            "models": ["Qwen/Qwen2.5-7B-Instruct", "Qwen/Qwen2.5-72B-Instruct"],
            "requires_api_key": "SILICONFLOW_API_KEY",
        },
        "openrouter": {
            "name": "OpenRouter (60+ models)",
            "models": [
                "openai/gpt-4o", "anthropic/claude-sonnet-4",
                "google/gemini-2.5-flash", "deepseek/deepseek-chat",
            ],
            "requires_api_key": "OPENROUTER_API_KEY",
        },
    }
    return providers


@router.get("/api-keys")
async def check_api_keys():
    """Check which API keys are configured."""
    keys = {
        "DASHSCOPE_API_KEY": bool(os.getenv("DASHSCOPE_API_KEY") and os.getenv("DASHSCOPE_API_KEY") != "your_dashscope_api_key_here"),
        "DEEPSEEK_API_KEY": bool(os.getenv("DEEPSEEK_API_KEY") and os.getenv("DEEPSEEK_API_KEY") != "your_deepseek_api_key_here"),
        "OPENAI_API_KEY": bool(os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_API_KEY") != "your_openai_api_key_here"),
        "GOOGLE_API_KEY": bool(os.getenv("GOOGLE_API_KEY") and os.getenv("GOOGLE_API_KEY") != "your_google_api_key_here"),
        "FINNHUB_API_KEY": bool(os.getenv("FINNHUB_API_KEY") and os.getenv("FINNHUB_API_KEY") != "your_finnhub_api_key_here"),
        "TUSHARE_TOKEN": bool(os.getenv("TUSHARE_TOKEN") and os.getenv("TUSHARE_TOKEN") != "your_tushare_token_here"),
    }
    return {
        "keys": keys,
        "any_llm_key": any(list(keys.values())[:4]),
        "any_data_key": keys["FINNHUB_API_KEY"] or keys["TUSHARE_TOKEN"],
    }
