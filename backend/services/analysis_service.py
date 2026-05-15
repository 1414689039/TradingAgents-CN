import os
import threading
from pathlib import Path
from typing import Callable

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.utils.logging_manager import get_logger

logger = get_logger("backend.analysis")


def run_analysis(
    stock_symbol: str,
    analysis_date: str,
    analysts: list[str],
    research_depth: int,
    llm_provider: str,
    llm_model: str,
    market_type: str,
    progress_callback: Callable | None = None,
) -> dict:
    """Run a stock analysis synchronously (called from thread pool)."""

    # Build config from research depth
    depth_config = _get_depth_config(research_depth)

    config = DEFAULT_CONFIG.copy()
    config["llm_provider"] = llm_provider
    config["deep_think_llm"] = llm_model
    config["quick_think_llm"] = llm_model
    config["max_debate_rounds"] = depth_config["debate_rounds"]
    config["max_risk_discuss_rounds"] = depth_config["risk_rounds"]
    config["online_tools"] = True

    # Set backend_url based on provider
    backend_urls = {
        "openai": "https://api.openai.com/v1",
        "deepseek": os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        "dashscope": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "siliconflow": "https://api.siliconflow.cn/v1",
        "google": "https://generativelanguage.googleapis.com/v1",
        "openrouter": "https://openrouter.ai/api/v1",
        "custom_openai": os.getenv("CUSTOM_OPENAI_BASE_URL", "https://api.openai.com/v1"),
    }
    config["backend_url"] = backend_urls.get(llm_provider, "https://api.openai.com/v1")

    # Format stock symbol by market
    formatted_symbol = format_symbol(stock_symbol, market_type)

    if progress_callback:
        progress_callback(10, "validating", "Validating stock symbol...")

    try:
        from tradingagents.utils.stock_validator import prepare_stock_data

        valid, msg, _ = prepare_stock_data(formatted_symbol, market_type)
        if not valid:
            return {
                "success": False,
                "error": msg,
                "stock_symbol": stock_symbol,
                "analysis_date": analysis_date,
                "analysts": analysts,
                "research_depth": research_depth,
                "llm_provider": llm_provider,
                "llm_model": llm_model,
                "state": {},
                "decision": {},
            }
    except Exception as e:
        logger.warning(f"Stock validation skipped: {e}")

    if progress_callback:
        progress_callback(20, "initializing", "Initializing AI agents...")

    try:
        graph = TradingAgentsGraph(
            selected_analysts=analysts if analysts else ["market", "fundamentals"],
            debug=False,
            config=config,
        )
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to initialize analysis graph: {str(e)}",
            "stock_symbol": stock_symbol,
            "analysis_date": analysis_date,
            "analysts": analysts,
            "research_depth": research_depth,
            "llm_provider": llm_provider,
            "llm_model": llm_model,
            "state": {},
            "decision": {},
        }

    if progress_callback:
        progress_callback(30, "analyzing", f"Running analysis for {formatted_symbol}...")

    try:
        _, decision = graph.propagate(formatted_symbol, analysis_date)
    except Exception as e:
        return {
            "success": False,
            "error": f"Analysis failed: {str(e)}",
            "stock_symbol": stock_symbol,
            "analysis_date": analysis_date,
            "analysts": analysts,
            "research_depth": research_depth,
            "llm_provider": llm_provider,
            "llm_model": llm_model,
            "state": {},
            "decision": {},
        }

    if progress_callback:
        progress_callback(90, "formatting", "Formatting results...")

    if isinstance(decision, str):
        decision = graph.process_signal(decision, formatted_symbol)
    elif isinstance(decision, dict):
        decision = {
            "action": decision.get("action", "持有"),
            "target_price": decision.get("target_price", None),
            "confidence": float(decision.get("confidence", 0)),
            "risk_score": float(decision.get("risk_score", 0)),
            "reasoning": decision.get("reasoning", ""),
        }

    return {
        "success": True,
        "error": None,
        "stock_symbol": stock_symbol,
        "analysis_date": analysis_date,
        "analysts": analysts,
        "research_depth": research_depth,
        "llm_provider": llm_provider,
        "llm_model": llm_model,
        "decision": decision,
    }


def format_symbol(symbol: str, market_type: str) -> str:
    """Format stock symbol based on market type."""
    symbol = symbol.strip().upper()
    market_map = {
        "A-shares": "A",
        "US Stocks": "US",
        "Hong Kong Stocks": "HK",
    }
    market_code = market_map.get(market_type, "US")

    if market_code == "HK":
        if not symbol.endswith(".HK"):
            return f"{symbol}.HK"
        return symbol
    return symbol


def _get_depth_config(depth: int) -> dict:
    """Map research depth 1-5 to debate rounds."""
    return {
        1: {"debate_rounds": 1, "risk_rounds": 1},
        2: {"debate_rounds": 1, "risk_rounds": 1},
        3: {"debate_rounds": 2, "risk_rounds": 2},
        4: {"debate_rounds": 3, "risk_rounds": 3},
        5: {"debate_rounds": 4, "risk_rounds": 4},
    }.get(depth, {"debate_rounds": 1, "risk_rounds": 1})
