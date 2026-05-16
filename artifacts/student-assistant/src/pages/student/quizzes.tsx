import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useListQuizzes, useSubmitQuiz, useGenerateQuiz, useSubmitGeneratedQuiz } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wand2, BookMarked, Sparkles } from "lucide-react";
import type { GeneratedQuiz } from "@workspace/api-client-react";

function getDifficultyColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case "easy": return "bg-green-100 text-green-700 border-green-200";
    case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "hard": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export default function StudentQuizzes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "student") setLocation("/");
  }, [user, setLocation]);

  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);

  const [generateTopic, setGenerateTopic] = useState("");
  const [generateDifficulty, setGenerateDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [genAnswers, setGenAnswers] = useState<Record<number, number>>({});
  const [genResult, setGenResult] = useState<{ score: number; correct: number; total: number } | null>(null);

  const { data: quizzes, isLoading: quizzesLoading } = useListQuizzes();
  const submitQuiz = useSubmitQuiz();
  const generateQuiz = useGenerateQuiz();
  const submitGeneratedQuiz = useSubmitGeneratedQuiz();

  const activeQuizData = selectedQuiz ? quizzes?.find(q => q.id === selectedQuiz) : null;

  const handleQuizSubmit = () => {
    if (!selectedQuiz) return;
    const quiz = quizzes?.find(q => q.id === selectedQuiz);
    if (!quiz?.questions) return;
    const answerArray = quiz.questions.map((_, idx) => answers[idx] ?? 0);
    submitQuiz.mutate({ id: selectedQuiz, data: { answers: answerArray } }, {
      onSuccess: (result) => setQuizResult(result),
    });
  };

  const handleGenerateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateTopic.trim()) return;
    generateQuiz.mutate({ data: { topic: generateTopic.trim(), difficulty: generateDifficulty } }, {
      onSuccess: (quiz) => {
        setGeneratedQuiz(quiz);
        setGenAnswers({});
        setGenResult(null);
        setGenerateTopic("");
      },
    });
  };

  const handleGenQuizSubmit = () => {
    if (!generatedQuiz) return;
    const answersArray = generatedQuiz.questions.map((_, i) => genAnswers[i] ?? 0);
    submitGeneratedQuiz.mutate({
      data: {
        topic: generatedQuiz.topic,
        difficulty: generatedQuiz.difficulty,
        questions: generatedQuiz.questions,
        answers: answersArray,
      },
    }, {
      onSuccess: (result) => {
        setGenResult({ score: result.score, correct: result.correct, total: result.totalQuestions });
      },
    });
  };

  return (
    <AppLayout title="My Quizzes">
      <div className="space-y-8">
        {/* AI Quiz Generator */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              AI Quiz Generator
            </CardTitle>
            <CardDescription>Generate a custom quiz on any topic using AI — instantly graded.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleGenerateQuiz} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm font-semibold">Topic</Label>
                <Input
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, World War II, Algebra..."
                  className="h-10"
                />
              </div>
              <div className="w-full sm:w-44 space-y-1.5">
                <Label className="text-sm font-semibold">Difficulty</Label>
                <Select value={generateDifficulty} onValueChange={(v) => setGenerateDifficulty(v as "easy" | "medium" | "hard")}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="h-10 px-6 shrink-0"
                disabled={!generateTopic.trim() || generateQuiz.isPending}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateQuiz.isPending ? "Generating..." : "Generate Quiz"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Assigned Quizzes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookMarked className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Assigned Quizzes</h2>
          </div>
          {quizzesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : (quizzes?.length ?? 0) === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-border rounded-xl text-muted-foreground">
              No quizzes assigned yet. Use the AI Generator above to practice!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes?.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="cursor-pointer border-border hover:border-primary/50 hover:shadow-md transition-all rounded-xl overflow-hidden group bg-card"
                  onClick={() => { setSelectedQuiz(quiz.id); setAnswers({}); setQuizResult(null); }}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start gap-3 mb-1">
                      <CardTitle className="text-[15px] font-semibold leading-tight group-hover:text-primary transition-colors">
                        {quiz.title}
                      </CardTitle>
                      <span className={`shrink-0 capitalize px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDifficultyColor(quiz.difficulty)}`}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    <CardDescription className="text-sm font-medium text-primary/80">{quiz.subject}</CardDescription>
                  </CardHeader>
                  <CardFooter className="p-5 pt-0 text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    <span>{quiz.questionCount} Questions</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assigned Quiz Modal */}
      <Dialog open={!!selectedQuiz} onOpenChange={(open) => !open && setSelectedQuiz(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-border sm:rounded-2xl">
          <DialogHeader className="px-8 py-6 border-b bg-card">
            <DialogTitle className="text-2xl font-bold leading-tight">{activeQuizData?.title}</DialogTitle>
            <p className="text-muted-foreground font-medium">{activeQuizData?.subject}</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-8 py-6 bg-muted/10">
            {quizResult ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-4xl font-black mb-6 border-4 ${quizResult.passed ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                  {quizResult.score}%
                </div>
                <h3 className="text-2xl font-bold mb-3">{quizResult.passed ? "Congratulations!" : "Keep Practicing!"}</h3>
                <p className="text-lg text-muted-foreground mb-8">
                  You got <span className="font-bold text-foreground">{quizResult.correct}</span> of <span className="font-bold text-foreground">{quizResult.totalQuestions}</span> right.
                </p>
                <Button size="lg" className="px-10 rounded-full" onClick={() => { setSelectedQuiz(null); setQuizResult(null); }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {activeQuizData?.questions?.map((q, qIdx) => (
                  <div key={q.id} className="bg-card p-6 rounded-xl border border-border">
                    <p className="font-semibold text-[17px] leading-relaxed mb-4">
                      <span className="text-muted-foreground font-bold mr-2">{qIdx + 1}.</span>{q.text}
                    </p>
                    <RadioGroup value={answers[qIdx]?.toString()} onValueChange={(v) => setAnswers(prev => ({ ...prev, [qIdx]: parseInt(v) }))} className="gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`flex items-start space-x-3 border-2 p-4 rounded-lg cursor-pointer transition-all ${answers[qIdx]?.toString() === oIdx.toString() ? "border-primary bg-primary/5" : "border-border/60 hover:border-border hover:bg-muted/30"}`}
                          onClick={() => setAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                        >
                          <RadioGroupItem value={oIdx.toString()} id={`q${q.id}-o${oIdx}`} className="mt-0.5 shrink-0" />
                          <Label htmlFor={`q${q.id}-o${oIdx}`} className="flex-1 cursor-pointer font-medium leading-snug">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!quizResult && (
            <div className="p-6 border-t bg-card flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Answered: {Object.keys(answers).length} / {activeQuizData?.questions?.length ?? 0}</span>
              <Button size="lg" className="rounded-full px-8" onClick={handleQuizSubmit}
                disabled={submitQuiz.isPending || Object.keys(answers).length < (activeQuizData?.questions?.length ?? 0)}>
                {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Generated Quiz Modal */}
      <Dialog open={!!generatedQuiz} onOpenChange={(open) => { if (!open) { setGeneratedQuiz(null); setGenResult(null); setGenAnswers({}); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-border sm:rounded-2xl">
          <DialogHeader className="px-8 py-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Generated</span>
            </div>
            <DialogTitle className="text-2xl font-bold capitalize">{generatedQuiz?.topic}</DialogTitle>
            <p className="text-muted-foreground font-medium capitalize">{generatedQuiz?.difficulty} · {generatedQuiz?.questions.length} questions</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-8 py-6 bg-muted/10">
            {genResult ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-4xl font-black mb-6 border-4 ${genResult.score >= 60 ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                  {genResult.score}%
                </div>
                <h3 className="text-2xl font-bold mb-3">{genResult.score >= 60 ? "Great job!" : "Keep studying!"}</h3>
                <p className="text-lg text-muted-foreground mb-8">
                  <span className="font-bold text-foreground">{genResult.correct}</span> of <span className="font-bold text-foreground">{genResult.total}</span> correct.
                </p>
                <Button size="lg" className="px-10 rounded-full" onClick={() => { setGeneratedQuiz(null); setGenResult(null); setGenAnswers({}); }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {generatedQuiz?.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-card p-6 rounded-xl border border-border">
                    <p className="font-semibold text-[17px] leading-relaxed mb-4">
                      <span className="text-muted-foreground font-bold mr-2">{qIdx + 1}.</span>{q.text}
                    </p>
                    <RadioGroup value={genAnswers[qIdx]?.toString()} onValueChange={(v) => setGenAnswers(prev => ({ ...prev, [qIdx]: parseInt(v) }))} className="gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`flex items-start space-x-3 border-2 p-4 rounded-lg cursor-pointer transition-all ${genAnswers[qIdx]?.toString() === oIdx.toString() ? "border-primary bg-primary/5" : "border-border/60 hover:border-border hover:bg-muted/30"}`}
                          onClick={() => setGenAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                        >
                          <RadioGroupItem value={oIdx.toString()} id={`gq${qIdx}-o${oIdx}`} className="mt-0.5 shrink-0" />
                          <Label htmlFor={`gq${qIdx}-o${oIdx}`} className="flex-1 cursor-pointer font-medium leading-snug">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!genResult && (
            <div className="p-6 border-t bg-card flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Answered: {Object.keys(genAnswers).length} / {generatedQuiz?.questions.length ?? 0}</span>
              <Button size="lg" className="rounded-full px-8" onClick={handleGenQuizSubmit}
                disabled={Object.keys(genAnswers).length < (generatedQuiz?.questions.length ?? 0)}>
                Submit
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
