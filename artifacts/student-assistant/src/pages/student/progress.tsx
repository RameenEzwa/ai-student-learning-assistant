import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, TrendingUp, Award, BrainCircuit } from "lucide-react";

export default function StudentProgress() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // AI Prediction States
  const [predictedScore, setPredictedScore] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form states for dynamic machine learning inputs
  const [hours, setHours] = useState(20);
  const [attendance, setAttendance] = useState(90);
  const [sleep, setSleep] = useState(8);
  const [tutoring, setTutoring] = useState(2);

  useEffect(() => {
    if (user && user.role !== "student") setLocation("/");
  }, [user, setLocation]);

  // Connects to your live python api.py server running on port 5000
  const calculatePerformancePrediction = async () => {
    setAiLoading(true);
    try {
            const response = await fetch("https://edu-assistant-ai-1-f2024376149.replit.dev/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours, attendance, sleep, tutoring }),
      });
      const data = await response.json();
      if (data.success) {
        setPredictedScore(data.predicted_score);
      }
    } catch (error) {
      console.error("Could not communicate with Kaggle AI backend:", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AppLayout title="Academic Progress">
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Progress</h1>
          <p className="text-muted-foreground">
            View your learning insights and real-world performance prediction.
          </p>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours Tracker</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hours} Hours</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendance}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Sleep Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sleep} Hours</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tutoring Sessions</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tutoring} Sessions</div>
            </CardContent>
          </Card>
        </div>

        {/* --- Kaggle AI Dataset Real-World Prediction Card --- */}
        <Card className="border-indigo-200 bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Kaggle Dataset ML Prediction Agent</CardTitle>
              <p className="text-xs text-muted-foreground">
                Trained live via Scikit-Learn on 6,607 student metrics
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Study Hours</label>
                <input 
                  type="number" 
                  value={hours} 
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full p-2 border rounded bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Attendance (%)</label>
                <input 
                  type="number" 
                  value={attendance} 
                  onChange={(e) => setAttendance(Number(e.target.value))}
                  className="w-full p-2 border rounded bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Sleep Hours</label>
                <input 
                  type="number" 
                  value={sleep} 
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full p-2 border rounded bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Tutoring Sessions</label>
                <input 
                  type="number" 
                  value={tutoring} 
                  onChange={(e) => setTutoring(Number(e.target.value))}
                  className="w-full p-2 border rounded bg-white text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={calculatePerformancePrediction}
                disabled={aiLoading}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-md font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
              >
                {aiLoading ? "Processing Dataset Factors..." : "Run AI Prediction"}
              </button>

              {predictedScore !== null && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 rounded-md shadow-sm">
                  <span className="text-sm font-medium text-gray-600">AI Predicted Score:</span>
                  <span className="text-xl font-black text-indigo-600">{predictedScore} / 100</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
