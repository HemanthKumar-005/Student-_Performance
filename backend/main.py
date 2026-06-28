import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.linear_model import LinearRegression

app = FastAPI(title="Student Performance AI")

# CORS middleware for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ---------------------------------------------------------
# AI Model Setup (Mock Training with generated data)
# ---------------------------------------------------------

# Let's generate some synthetic training data
# Features: [study_hours (0-15), attendance (0-100), previous_grades (0-100), learning_behavior (1-10)]
np.random.seed(42)
num_samples = 500

X_train = np.column_stack((
    np.random.uniform(0, 15, num_samples),      # study_hours
    np.random.uniform(40, 100, num_samples),    # attendance
    np.random.uniform(30, 100, num_samples),    # previous_grades
    np.random.uniform(1, 10, num_samples)       # learning_behavior
))

# Generate target: Student Performance Score (0-100)
# Let's create a linear relationship + some noise
# Formula: 10 + (study_hours * 2.5) + (attendance * 0.3) + (previous_grades * 0.4) + (learning_behavior * 1.5)
y_train = 10 + (X_train[:, 0] * 2.5) + (X_train[:, 1] * 0.3) + (X_train[:, 2] * 0.4) + (X_train[:, 3] * 1.5) + np.random.normal(0, 3, num_samples)
y_train = np.clip(y_train, 0, 100)

# Train the model
model = LinearRegression()
model.fit(X_train, y_train)

# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

class PredictionRequest(BaseModel):
    study_hours: float
    attendance: float
    previous_grades: float
    learning_behavior: float

class PredictionResponse(BaseModel):
    predicted_score: float
    insights: list[str]

@app.post("/api/predict", response_model=PredictionResponse)
def predict_performance(req: PredictionRequest):
    try:
        # Validate inputs
        if req.study_hours < 0 or req.study_hours > 24:
            raise ValueError("Study hours should be between 0 and 24")
        if req.attendance < 0 or req.attendance > 100:
            raise ValueError("Attendance should be between 0 and 100")
        if req.previous_grades < 0 or req.previous_grades > 100:
            raise ValueError("Previous grades should be between 0 and 100")
        if req.learning_behavior < 1 or req.learning_behavior > 10:
            raise ValueError("Learning behavior should be between 1 and 10")

        # Make prediction
        features = np.array([[req.study_hours, req.attendance, req.previous_grades, req.learning_behavior]])
        pred = model.predict(features)[0]
        pred_clamped = max(0.0, min(100.0, pred))

        # Generate contextual AI insights
        insights = []
        
        if req.attendance < 75:
            insights.append("Low attendance is strongly affecting your performance. Try to attend more consistently.")
        elif req.attendance >= 90:
            insights.append("Great attendance! This is building a solid foundation.")
            
        if req.study_hours < 5:
            insights.append("Increasing your study hours outside of class could yield significant improvements.")
            
        if req.learning_behavior < 6:
            insights.append("Improving classroom focus and participation (learning behavior) can help boost your score.")
            
        if pred_clamped > 85:
            insights.append("You are on track for excellent results. Keep up the great work!")
        elif pred_clamped < 50:
            insights.append("Warning: You are currently at risk. Consider seeking additional support or tutoring.")

        return {"predicted_score": round(pred_clamped, 1), "insights": insights}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Mount frontend directory for static file serving
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
