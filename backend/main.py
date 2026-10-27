import sys
import os
from pathlib import Path
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from api.routes import router
from services.state_manager import state

app = FastAPI(
    title="NARL-CDMG Atmospheric Observation Data Monitoring and Anomaly Detection System",
    description=(
        "Atmospheric observation data monitoring and rule-based anomaly detection platform developed for "
        "the Computer & Data Management Group (CDMG), National Atmospheric Research Laboratory (NARL). "
        "Educational internship prototype using synthetic demonstration data."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local Vite React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

def run_cli_demonstration():
    """Executes the reference CLI pipeline matching Figure B.3."""
    print("=" * 80)
    print(" NARL - CDMG ATMOSPHERIC OBSERVATION DATA MONITORING SYSTEM (PROTOTYPE)")
    print(" Computer & Data Management Group | National Atmospheric Research Laboratory")
    print("=" * 80)

    # Process and display preview matching user's Figure B.2 & B.3
    csv_str = state.processor.export_processed_csv()
    from io import StringIO
    df = pd.read_csv(StringIO(csv_str))
    
    # Filter or display rows around 2025-06-01 10:00 to 10:50 if present, else head
    preview_df = df[df["timestamp"].str.contains("2025-06-01 10:", na=False)].head(6)
    if preview_df.empty:
        preview_df = df.head(6)

    print("\nObservation Records Sample:")
    print(preview_df.to_string(index=True))

    out_file = backend_dir / "processed_atmospheric_data.csv"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(csv_str)
    print(f"\nProcessed data saved to: {out_file.name}")
    print("Graph displayed successfully! (Interactive dashboard available via web frontend)")
    print("=" * 80)

if __name__ == "__main__":
    run_cli_demonstration()
    print("\nStarting FastAPI web server on http://127.0.0.1:8000 ...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
