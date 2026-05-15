import asyncio
import json
import threading
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel, Field

from backend.services.progress_manager import progress_manager
from backend.services.analysis_service import run_analysis, format_symbol

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


class AnalysisRequest(BaseModel):
    stock_symbol: str = Field(..., min_length=1, max_length=20)
    market_type: str = Field(default="A-shares")
    analysis_date: str = Field(default="")
    analysts: list[str] = Field(default=["market", "fundamentals"])
    research_depth: int = Field(default=3, ge=1, le=5)
    llm_provider: str = Field(default="dashscope")
    llm_model: str = Field(default="qwen-plus")
    custom_prompt: str = Field(default="")


class AnalysisStatusResponse(BaseModel):
    id: str
    status: str
    progress: int
    current_step: str
    message: str
    error: str | None = None


@router.post("")
async def start_analysis(req: AnalysisRequest):
    """Start a new stock analysis. Returns immediately with analysis ID."""
    analysis_id = progress_manager.create_analysis(req.model_dump())

    def run_in_thread():
        try:
            def progress_callback(progress: int, step: str, msg: str):
                progress_manager.update_progress(analysis_id, progress, step, msg)

            progress_manager.update_progress(analysis_id, 5, "starting", "Starting analysis...")

            result = run_analysis(
                stock_symbol=req.stock_symbol,
                analysis_date=req.analysis_date,
                analysts=req.analysts,
                research_depth=req.research_depth,
                llm_provider=req.llm_provider,
                llm_model=req.llm_model,
                market_type=req.market_type,
                progress_callback=progress_callback,
            )

            if result["success"]:
                progress_manager.set_result(analysis_id, result)
            else:
                progress_manager.set_error(analysis_id, result.get("error", "Unknown error"))

        except Exception as e:
            progress_manager.set_error(analysis_id, str(e))

    thread = threading.Thread(target=run_in_thread, daemon=True)
    thread.start()

    return {"analysis_id": analysis_id, "status": "started"}


@router.get("/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    """Get current analysis status (one-time poll)."""
    status = progress_manager.get_status(analysis_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return status


@router.get("/{analysis_id}/stream")
async def stream_progress(analysis_id: str):
    """SSE endpoint for real-time progress updates."""
    queue = await progress_manager.subscribe(analysis_id)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                    if event["status"] in ("completed", "failed"):
                        break
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'status': 'heartbeat'})}\n\n"
        finally:
            progress_manager.unsubscribe(analysis_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{analysis_id}/results")
async def get_analysis_results(analysis_id: str):
    """Get completed analysis results."""
    result = progress_manager.get_result(analysis_id)
    if result is None:
        status = progress_manager.get_status(analysis_id)
        if status is None:
            raise HTTPException(status_code=404, detail="Analysis not found")
        if status["status"] == "failed":
            raise HTTPException(status_code=400, detail=status.get("error", "Analysis failed"))
        raise HTTPException(status_code=202, detail="Analysis still running")
    return result


@router.get("/{analysis_id}/report")
async def get_analysis_report(analysis_id: str, format: str = "md"):
    """Download analysis report in markdown or docx format."""
    result = progress_manager.get_result(analysis_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Analysis not found or not completed")

    md_report = generate_markdown_report(result)

    if format == "md":
        return Response(
            content=md_report,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=report_{analysis_id}.md"},
        )
    elif format == "txt":
        return Response(
            content=md_report,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=report_{analysis_id}.txt"},
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'md' or 'txt'")


def generate_markdown_report(result: dict) -> str:
    """Generate a markdown report from analysis results."""
    decision = result.get("decision", {})

    action_map = {"买入": "BUY", "持有": "HOLD", "卖出": "SELL"}
    action_en = action_map.get(decision.get("action", "持有"), "HOLD")

    lines = [
        f"# TradingAgents-CN Analysis Report",
        f"",
        f"## Summary",
        f"",
        f"- **Stock**: {result.get('stock_symbol', 'N/A')}",
        f"- **Date**: {result.get('analysis_date', 'N/A')}",
        f"- **Analysts**: {', '.join(result.get('analysts', []))}",
        f"- **Research Depth**: {result.get('research_depth', 'N/A')}",
        f"- **LLM**: {result.get('llm_provider', 'N/A')} / {result.get('llm_model', 'N/A')}",
        f"",
        f"## Decision",
        f"",
        f"- **Action**: {decision.get('action', 'N/A')} ({action_en})",
        f"- **Confidence**: {decision.get('confidence', 'N/A')}",
        f"- **Risk Score**: {decision.get('risk_score', 'N/A')}",
    ]

    if decision.get("target_price"):
        lines.append(f"- **Target Price**: {decision.get('target_price')}")

    if decision.get("reasoning"):
        lines.extend(["", "### Reasoning", "", decision["reasoning"]])

    lines.extend([
        "",
        "---",
        "",
        "*Report generated by TradingAgents-CN*",
        "*Disclaimer: This is AI-generated analysis for reference only. Not financial advice.*",
    ])

    return "\n".join(lines)
