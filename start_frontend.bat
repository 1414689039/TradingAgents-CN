@echo off
echo Starting TradingAgents-CN Frontend on http://localhost:3000
cd frontend
npx vite --port 3000 --host 0.0.0.0
