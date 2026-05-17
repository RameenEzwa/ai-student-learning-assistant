from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

app = Flask(__name__)
CORS(app) # Connects your Python AI directly to your web interface

# Locate and pre-train the model immediately using your archive folder
base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(base_dir, "archive (1)/StudentPerformanceFactors.csv")

if os.path.exists(dataset_path):
    df = pd.read_csv(dataset_path)
    features = ['Hours_Studied', 'Attendance', 'Sleep_Hours', 'Tutoring_Sessions']
    target = 'Exam_Score'
    df_clean = df[features + [target]].dropna()

    X = df_clean[features]
    y = df_clean[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LinearRegression()
    model.fit(X_train, y_train)
    print("🤖 Kaggle AI Model pre-trained and live on the API server!")
else:
    print("❌ Error: Dataset could not be found.")

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        hours = float(data.get('hours', 20))
        attendance = float(data.get('attendance', 90))
        sleep = float(data.get('sleep', 8))
        tutoring = float(data.get('tutoring', 2))

        # Pass inputs to the trained machine learning model
        input_data = pd.DataFrame([[hours, attendance, sleep, tutoring]], columns=features)
        predicted_score = model.predict(input_data)[0]
        final_score = min(100, max(0, predicted_score))

        return jsonify({"success": True, "predicted_score": round(final_score, 1)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)