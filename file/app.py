import pandas as pd
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error

# 1. Locate and load the dataset
base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(base_dir, "../archive (1)/StudentPerformanceFactors.csv")

if os.path.exists(dataset_path):
    df = pd.read_csv(dataset_path)
    print("✅ Kaggle dataset connected successfully!")

    # 2. Prepare the data for our AI Model
    # We will pick a few key numerical features to predict the Exam_Score
    features = ['Hours_Studied', 'Attendance', 'Sleep_Hours', 'Tutoring_Sessions']
    target = 'Exam_Score'

    # Drop rows with missing values in these columns to keep things clean
    df_clean = df[features + [target]].dropna()

    X = df_clean[features]
    y = df_clean[target]

    # 3. Split data into Training (80%) and Testing (20%) sets
    # Change test_test_split=0.2 to test_size=0.2
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Train the AI Agent's predictive model
    model = LinearRegression()
    model.fit(X_train, y_train)

    # 5. Evaluate the model
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)

    print(f"🤖 AI Model trained successfully using {len(X_train)} student records!")
    print(f"📊 Model Accuracy (Mean Absolute Error): Off by about {mae:.2f} points on average.\n")

    # 6. Create a real-world problem-solving function
    def predict_student_score(hours, attendance_pct, sleep, tutoring):
        input_data = pd.DataFrame([[hours, attendance_pct, sleep, tutoring]], columns=features)
        predicted_score = model.predict(input_data)[0]
        return min(100, max(0, predicted_score)) # Keep score between 0 and 100

    # Test the real-world predictor
    print("--- 🔮 AI Agent Real-World Prediction Test ---")
    sample_hours = 20
    sample_attendance = 90
    sample_sleep = 8
    sample_tutoring = 2

    predicted = predict_student_score(sample_hours, sample_attendance, sample_sleep, sample_tutoring)
    print(f"Inputs -> Study: {sample_hours}h, Attendance: {sample_attendance}%, Sleep: {sample_sleep}h, Tutoring: {sample_tutoring} sessions")
    print(f"🎯 Predicted Final Exam Score: {predicted:.1f}/100")

else:
    print(f"❌ Error: Could not find the file at: {dataset_path}")