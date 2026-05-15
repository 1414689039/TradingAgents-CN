#!/bin/bash
export PYTHONUTF8=1
export PYTHONIOENCODING=utf-8
echo "Starting TradingAgents-CN Backend API on http://localhost:8000"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
