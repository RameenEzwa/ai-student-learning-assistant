import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetChatHistory, useSendMessage, useListQuizzes, useSubmitQuiz, getGetChatHistoryQueryKey, useGenerateQuiz } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User as UserIcon, Bot, BrainCircuit, AlertCircle, Sparkles, Wand2, BookMarked } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GeneratedQuiz } from "@workspace/api-client-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // AI Quiz Generator state
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateDifficulty, setGenerateDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [genAnswers, setGenAnswers] = useState<Record<number, number>>({});
  const [genResult, setGenResult] = useState<{ score: number; correct: number; total: number } | null>(null);

  useEffect(() => {
    if (user && user.role !== "student") setLocation("/");
  }, [user, setLocation]);

  const { data: chatHistory, isLoading: chatLoading } = useGetChatHistory({
    query: { queryKey: getGetChatHistoryQueryKey() },
  });
  const sendMessage = useSendMessage();
  const { data: quizzes, isLoading: quizzesLoading } = useListQuizzes();
  const submitQuiz = useSubmitQuiz();
  const generateQuiz = useGenerateQuiz();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessage.isPending) return;
    const content = message.trim();
    setMessage("");
    setPendingMessage(content);
    setChatError(null);
    sendMessage.mutate({ data: { content } }, {
      onSuccess: () => {
        setPendingMessage(null);
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
      },
      onError: (err: any) => {
        setPendingMessage(null);
        const msg = err?.data?.error ?? err?.message ?? "Failed to send message. Please try again.";
        setChatError(msg);
      },
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") ?? scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [chatHistory, pendingMessage]);

  const handleQuizSubmit = () => {
    if (!selectedQuiz) return;
    const quiz = quizzes?.find(q => q.id === selectedQuiz);
    if (!quiz || !quiz.questions) return;
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
        setShowGeneratePanel(false);
        setGenerateTopic("");
      },
    });
  };

  const handleGenQuizSubmit = () => {
    if (!generatedQuiz) return;
    let correct = 0;
    generatedQuiz.questions.forEach((q, i) => {
      if (genAnswers[i] === q.correctAnswer) correct++;
    });
    const total = generatedQuiz.questions.length;
    const score = Math.round((correct / total) * 100);
    setGenResult({ score, correct, total });
  };

  const activeQuizData = selectedQuiz ? quizzes?.find(q => q.id === selectedQuiz) : null;
  const isEmpty = !chatLoading && (chatHistory?.length ?? 0) === 0 && !pendingMessage;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">

        {/* Chat Section */}
        <Card className="lg:col-span-2 flex flex-col h-full border-border shadow-sm bg-card overflow-hidden rounded-xl">
          <CardHeader className="border-b bg-card pb-4 px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Learning Assistant
            </CardTitle>
            <CardDescription className="text-base">Ask questions, request explanations, or get help with your studies.</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0 bg-muted/20">
            <ScrollArea className="h-full p-6" ref={scrollRef}>
              <div className="space-y-6">
                {chatLoading && (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-pulse flex items-center gap-2 text-muted-foreground font-medium">
                      <Sparkles className="w-4 h-4" />
                      Loading your conversation...
                    </div>
                  </div>
                )}
                {isEmpty && (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      <BrainCircuit className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">How can I help you today?</h3>
                    <p className="text-muted-foreground max-w-md">
                      I'm your personal AI tutor. Ask me to explain concepts, help with homework, or quiz you on any topic.
                    </p>
                  </div>
                )}
                {chatHistory?.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white border border-border text-primary'}`}>
                      {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 ml-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Tutor</span>
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-border rounded-tl-sm text-foreground'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {pendingMessage && (
                  <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="p-4 rounded-2xl text-[15px] leading-relaxed bg-primary text-white rounded-tr-sm shadow-sm opacity-80">
                      {pendingMessage}
                    </div>
                  </div>
                )}
                {sendMessage.isPending && (
                  <div className="flex gap-4 max-w-[85%] mr-auto">
                    <div className="w-10 h-10 rounded-full bg-white border border-border text-primary flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 ml-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Tutor</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-border rounded-tl-sm shadow-sm flex items-center gap-2 h-14 w-20 justify-center">
                        <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                {chatError && (
                  <div className="flex items-start gap-3 text-[15px] text-destructive bg-destructive/5 border border-destructive/20 rounded-xl p-4 mx-12">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{chatError}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <div className="p-4 border-t bg-card">
            <form onSubmit={handleSendMessage} className="relative flex items-center" data-testid="chat-form">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message your tutor..."
                className="flex-1 bg-muted/40 border-border rounded-full pl-6 pr-14 py-6 text-[15px] focus-visible:ring-primary/30 focus-visible:bg-white shadow-inner transition-colors"
                disabled={sendMessage.isPending}
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 rounded-full w-10 h-10 shadow-sm"
                disabled={!message.trim() || sendMessage.isPending}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Right Panel */}
        <div className="flex flex-col gap-6 overflow-hidden">

          {/* AI Quiz Generator */}
          <Card className="border-border shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b px-6 py-4 bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Wand2 className="w-4 h-4 text-primary" />
                AI Quiz Generator
              </CardTitle>
              <CardDescription className="text-xs">Generate a custom quiz on any topic instantly</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {showGeneratePanel ? (
                <form onSubmit={handleGenerateQuiz} className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Topic</Label>
                    <Input
                      value={generateTopic}
                      onChange={(e) => setGenerateTopic(e.target.value)}
                      placeholder="e.g. Photosynthesis, World War II, Algebra..."
                      className="text-sm h-9"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Difficulty</Label>
                    <Select value={generateDifficulty} onValueChange={(v) => setGenerateDifficulty(v as "easy" | "medium" | "hard")}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" className="flex-1 text-xs" disabled={!generateTopic.trim() || generateQuiz.isPending}>
                      {generateQuiz.isPending ? "Generating..." : "Generate Quiz"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setShowGeneratePanel(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  className="w-full text-sm"
                  variant="outline"
                  onClick={() => setShowGeneratePanel(true)}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate AI Quiz
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Assigned Quizzes */}
          <Card className="flex-1 flex flex-col overflow-hidden border-border shadow-sm rounded-xl">
            <CardHeader className="border-b px-6 py-5 bg-card">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <BookMarked className="w-4 h-4 text-primary" />
                Your Assignments
              </CardTitle>
              <CardDescription className="text-xs">Quizzes assigned to your account</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 bg-muted/10">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {quizzesLoading ? (
                    <div className="flex flex-col gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />
                      ))}
                    </div>
                  ) : quizzes?.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <p>No assignments pending.</p>
                    </div>
                  ) : quizzes?.map((quiz) => (
                    <Card key={quiz.id} className="cursor-pointer border-border hover:border-primary/50 hover:shadow-md transition-all rounded-xl overflow-hidden group bg-card" onClick={() => {
                      setSelectedQuiz(quiz.id);
                      setAnswers({});
                      setQuizResult(null);
                    }}>
                      <CardHeader className="p-5 pb-3">
                        <div className="flex justify-between items-start gap-4 mb-1">
                          <CardTitle className="text-[15px] font-semibold leading-tight group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
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
              </ScrollArea>
            </CardContent>
          </Card>
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
              <div className="text-center py-12 px-4 flex flex-col items-center">
                <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-4xl font-black mb-6 shadow-sm border-4 ${quizResult.passed ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {quizResult.score}%
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{quizResult.passed ? 'Congratulations!' : 'Keep Practicing!'}</h3>
                <p className="text-lg text-muted-foreground max-w-sm mb-8">
                  You got <span className="font-bold text-foreground">{quizResult.correct}</span> out of <span className="font-bold text-foreground">{quizResult.totalQuestions}</span> questions right.
                </p>
                <Button size="lg" className="px-10 rounded-full font-semibold" onClick={() => { setSelectedQuiz(null); setQuizResult(null); }}>
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {activeQuizData?.questions?.map((q, qIndex) => (
                  <div key={q.id} className="space-y-5 bg-card p-6 rounded-xl border border-border shadow-sm">
                    <p className="font-semibold text-[17px] leading-relaxed text-foreground">
                      <span className="text-muted-foreground font-bold mr-2">{qIndex + 1}.</span>
                      {q.text}
                    </p>
                    <RadioGroup
                      value={answers[qIndex]?.toString()}
                      onValueChange={(val) => setAnswers(prev => ({ ...prev, [qIndex]: parseInt(val) }))}
                      className="gap-3"
                    >
                      {q.options.map((opt, oIndex) => {
                        const isSelected = answers[qIndex]?.toString() === oIndex.toString();
                        return (
                          <div
                            key={oIndex}
                            className={`flex items-start space-x-3 border-2 p-4 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:border-border hover:bg-muted/30'}`}
                            onClick={() => setAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                          >
                            <RadioGroupItem value={oIndex.toString()} id={`q${q.id}-o${oIndex}`} className="mt-0.5 shrink-0" />
                            <Label htmlFor={`q${q.id}-o${oIndex}`} className="flex-1 cursor-pointer font-medium text-[15px] leading-snug pt-0.5">{opt}</Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!quizResult && (
            <div className="p-6 border-t bg-card mt-auto flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Answered: {Object.keys(answers).length} / {activeQuizData?.questions?.length || 0}
              </span>
              <Button size="lg" className="rounded-full px-8 font-semibold" onClick={handleQuizSubmit} disabled={submitQuiz.isPending || Object.keys(answers).length < (activeQuizData?.questions?.length || 0)}>
                {submitQuiz.isPending ? 'Submitting...' : 'Submit Quiz'}
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
              <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Generated Quiz</span>
            </div>
            <DialogTitle className="text-2xl font-bold leading-tight capitalize">{generatedQuiz?.topic}</DialogTitle>
            <p className="text-muted-foreground font-medium capitalize">{generatedQuiz?.difficulty} difficulty · {generatedQuiz?.questions.length} questions</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-8 py-6 bg-muted/10">
            {genResult ? (
              <div className="text-center py-12 px-4 flex flex-col items-center">
                <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-4xl font-black mb-6 shadow-sm border-4 ${genResult.score >= 60 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {genResult.score}%
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{genResult.score >= 60 ? 'Great job!' : 'Keep studying!'}</h3>
                <p className="text-lg text-muted-foreground max-w-sm mb-8">
                  You answered <span className="font-bold text-foreground">{genResult.correct}</span> out of <span className="font-bold text-foreground">{genResult.total}</span> correctly.
                </p>
                <Button size="lg" className="px-10 rounded-full font-semibold" onClick={() => { setGeneratedQuiz(null); setGenResult(null); setGenAnswers({}); }}>
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {generatedQuiz?.questions.map((q, qIndex) => (
                  <div key={q.id} className="space-y-5 bg-card p-6 rounded-xl border border-border shadow-sm">
                    <p className="font-semibold text-[17px] leading-relaxed text-foreground">
                      <span className="text-muted-foreground font-bold mr-2">{qIndex + 1}.</span>
                      {q.text}
                    </p>
                    <RadioGroup
                      value={genAnswers[qIndex]?.toString()}
                      onValueChange={(val) => setGenAnswers(prev => ({ ...prev, [qIndex]: parseInt(val) }))}
                      className="gap-3"
                    >
                      {q.options.map((opt, oIndex) => {
                        const isSelected = genAnswers[qIndex]?.toString() === oIndex.toString();
                        return (
                          <div
                            key={oIndex}
                            className={`flex items-start space-x-3 border-2 p-4 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:border-border hover:bg-muted/30'}`}
                            onClick={() => setGenAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                          >
                            <RadioGroupItem value={oIndex.toString()} id={`gen-q${q.id}-o${oIndex}`} className="mt-0.5 shrink-0" />
                            <Label htmlFor={`gen-q${q.id}-o${oIndex}`} className="flex-1 cursor-pointer font-medium text-[15px] leading-snug pt-0.5">{opt}</Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!genResult && (
            <div className="p-6 border-t bg-card mt-auto flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Answered: {Object.keys(genAnswers).length} / {generatedQuiz?.questions.length || 0}
              </span>
              <Button size="lg" className="rounded-full px-8 font-semibold" onClick={handleGenQuizSubmit} disabled={Object.keys(genAnswers).length < (generatedQuiz?.questions.length || 0)}>
                Submit Quiz
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
