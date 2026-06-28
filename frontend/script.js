document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prediction-form');
    
    const elements = {
        study_hours: document.getElementById('study_hours'),
        attendance: document.getElementById('attendance'),
        previous_grades: document.getElementById('previous_grades'),
        learning_behavior: document.getElementById('learning_behavior'),
        
        study_hours_val: document.getElementById('study_hours_val'),
        attendance_val: document.getElementById('attendance_val'),
        previous_grades_val: document.getElementById('previous_grades_val'),
        learning_behavior_val: document.getElementById('learning_behavior_val'),
        
        btnText: document.querySelector('.btn-text'),
        btnSpinner: document.getElementById('btn-spinner'),
        submitBtn: document.getElementById('predict-btn'),
        
        scoreValue: document.getElementById('score-value'),
        scorePath: document.getElementById('score-circle-path'),
        insightsList: document.getElementById('insights-list')
    };

    const updateDisplays = () => {
        elements.study_hours_val.textContent = parseFloat(elements.study_hours.value).toFixed(1) + ' hrs';
        elements.attendance_val.textContent = elements.attendance.value + '%';
        elements.previous_grades_val.textContent = elements.previous_grades.value;
        elements.learning_behavior_val.textContent = parseFloat(elements.learning_behavior.value).toFixed(1);
    };

    elements.study_hours.addEventListener('input', updateDisplays);
    elements.attendance.addEventListener('input', updateDisplays);
    elements.previous_grades.addEventListener('input', updateDisplays);
    elements.learning_behavior.addEventListener('input', updateDisplays);

    updateDisplays();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            study_hours: parseFloat(elements.study_hours.value),
            attendance: parseFloat(elements.attendance.value),
            previous_grades: parseFloat(elements.previous_grades.value),
            learning_behavior: parseFloat(elements.learning_behavior.value)
        };

        elements.submitBtn.disabled = true;
        elements.btnText.style.display = 'none';
        elements.btnSpinner.style.display = 'block';

        try {
            await new Promise(r => setTimeout(r, 600)); // slight artificial delay for "AI" feel

            // Note: Since we are serving frontend from FastAPI, URL can be relative or full localhost:8000
            // Even if running separately, we use full URL, but since it's mounted, relative works best.
            // Using full URL to handle if they open index.html directly from file system
            const apiUrl = window.location.protocol === 'file:' ? 'http://localhost:8000/api/predict' : '/api/predict';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Prediction failed');
            const data = await response.json();

            animateScore(data.predicted_score);
            renderInsights(data.insights, data.predicted_score);

        } catch (error) {
            console.error(error);
            alert("Error communicating with AI Backend. Ensure the server is running.");
        } finally {
            elements.submitBtn.disabled = false;
            elements.btnText.style.display = 'block';
            elements.btnSpinner.style.display = 'none';
        }
    });

    function animateScore(targetScore) {
        let currentScore = 0;
        const duration = 1000;
        const steps = 60;
        const increment = targetScore / steps;
        const stepTime = duration / steps;
        
        let color = "var(--success-color)";
        if(targetScore < 50) color = "var(--danger-color)";
        else if(targetScore < 75) color = "var(--warning-color)";
        
        elements.scorePath.style.stroke = color;
        elements.scorePath.style.strokeDasharray = `${targetScore}, 100`;

        const timer = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(timer);
            }
            elements.scoreValue.textContent = Math.round(currentScore);
        }, stepTime);
    }

    function renderInsights(insights, score) {
        elements.insightsList.innerHTML = '';
        if(!insights || insights.length === 0) {
            elements.insightsList.innerHTML = '<li class="placeholder-text">No significant insights for this profile.</li>';
            return;
        }

        insights.forEach(insight => {
            const li = document.createElement('li');
            li.textContent = insight;
            
            if (score < 50) {
                li.style.borderLeftColor = "var(--danger-color)";
            } else if (score < 75) {
                li.style.borderLeftColor = "var(--warning-color)";
            } else {
                li.style.borderLeftColor = "var(--success-color)";
            }
            
            elements.insightsList.appendChild(li);
        });
    }
});
