import asyncio
import json
import time
import uuid
from typing import Any

from tradingagents.utils.logging_manager import get_logger

logger = get_logger("backend.progress")


class ProgressManager:
    """In-memory progress tracker with SSE broadcasting."""

    def __init__(self):
        self._analyses: dict[str, dict[str, Any]] = {}
        self._subscribers: dict[str, list[asyncio.Queue]] = {}

    def create_analysis(self, params: dict) -> str:
        analysis_id = str(uuid.uuid4())[:8]
        self._analyses[analysis_id] = {
            "id": analysis_id,
            "status": "pending",
            "progress": 0,
            "current_step": "initializing",
            "message": "Initializing analysis...",
            "params": params,
            "result": None,
            "error": None,
            "started_at": time.time(),
            "completed_at": None,
        }
        self._subscribers[analysis_id] = []
        logger.info(f"Created analysis {analysis_id}")
        return analysis_id

    def update_progress(
        self,
        analysis_id: str,
        progress: int,
        current_step: str,
        message: str,
        status: str = "running",
    ):
        if analysis_id not in self._analyses:
            return
        entry = self._analyses[analysis_id]
        entry["status"] = status
        entry["progress"] = progress
        entry["current_step"] = current_step
        entry["message"] = message
        self._notify(analysis_id)

    def set_result(self, analysis_id: str, result: dict):
        if analysis_id not in self._analyses:
            return
        entry = self._analyses[analysis_id]
        entry["status"] = "completed"
        entry["progress"] = 100
        entry["current_step"] = "done"
        entry["message"] = "Analysis complete"
        entry["result"] = result
        entry["completed_at"] = time.time()
        self._notify(analysis_id)

    def set_error(self, analysis_id: str, error: str):
        if analysis_id not in self._analyses:
            return
        entry = self._analyses[analysis_id]
        entry["status"] = "failed"
        entry["error"] = error
        entry["message"] = f"Error: {error}"
        entry["completed_at"] = time.time()
        self._notify(analysis_id)

    def get_status(self, analysis_id: str) -> dict | None:
        entry = self._analyses.get(analysis_id)
        if not entry:
            return None
        return {
            "id": entry["id"],
            "status": entry["status"],
            "progress": entry["progress"],
            "current_step": entry["current_step"],
            "message": entry["message"],
            "error": entry["error"],
        }

    def get_result(self, analysis_id: str) -> dict | None:
        entry = self._analyses.get(analysis_id)
        if not entry or entry["status"] != "completed":
            return None
        return entry["result"]

    async def subscribe(self, analysis_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        if analysis_id in self._subscribers:
            self._subscribers[analysis_id].append(queue)
        else:
            self._subscribers[analysis_id] = [queue]
        entry = self._analyses.get(analysis_id)
        if entry:
            await queue.put(self._format_event(entry))
        return queue

    def unsubscribe(self, analysis_id: str, queue: asyncio.Queue):
        if analysis_id in self._subscribers:
            try:
                self._subscribers[analysis_id].remove(queue)
            except ValueError:
                pass

    def _notify(self, analysis_id: str):
        entry = self._analyses.get(analysis_id)
        if not entry:
            return
        event = self._format_event(entry)
        for q in self._subscribers.get(analysis_id, []):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass

    @staticmethod
    def _format_event(entry: dict) -> dict:
        return {
            "id": entry["id"],
            "status": entry["status"],
            "progress": entry["progress"],
            "current_step": entry["current_step"],
            "message": entry["message"],
            "error": entry.get("error"),
        }

    def cleanup_old(self, max_age_seconds: int = 3600):
        now = time.time()
        to_remove = []
        for aid, entry in self._analyses.items():
            if entry["status"] in ("completed", "failed"):
                if entry.get("completed_at") and now - entry["completed_at"] > max_age_seconds:
                    to_remove.append(aid)
        for aid in to_remove:
            del self._analyses[aid]
            self._subscribers.pop(aid, None)
        if to_remove:
            logger.info(f"Cleaned up {len(to_remove)} old analyses")


progress_manager = ProgressManager()
