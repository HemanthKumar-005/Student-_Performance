@echo off
echo Installing requirements...
pip install -r requirements.txt
echo.
echo Starting AI Predictor Server...
echo The application will open in your default browser automatically.
echo If it does not, please go to http://localhost:8000 in your browser!
echo.
start http://localhost:8000
python -m uvicorn backend.main:app --reload
pause