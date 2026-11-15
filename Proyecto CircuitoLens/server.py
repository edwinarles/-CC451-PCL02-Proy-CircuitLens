#!/usr/bin/env python3
"""
Server entrypoint for CircuitLens Platform using Uvicorn and FastAPI.
"""
import os
import sys
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

PORT = int(os.environ.get('PORT', 8000))

if __name__ == "__main__":
    print(f"🔬 Iniciando CircuitLens Platform (FastAPI + Uvicorn) en puerto {PORT}...")
    print(f"👉 Abre en tu navegador: http://localhost:{PORT} o http://127.0.0.1:{PORT}")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=False, log_level="info")
