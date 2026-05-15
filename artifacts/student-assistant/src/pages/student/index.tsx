import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetChatHistory, useSendMessage, useListQuizzes, useSubmitQuiz, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User as UserIcon, Bot, BrainCircuit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);

  useEffect(() => {
    if (user && user.role !== "student") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: chatHistory, isLoading: chatLoading, refetch: refetchChat } = useGetChatHistory();
  const sendMessage = useSendMessage();

  const { data: quizzes, isLoading: quizzesLoading } = useListQuizzes();
  const submitQuiz = useSubmitQuiz();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const content = message;
    setMessage("");
    
    sendMessage.mutate({ data: { content } }, {
      onSuccess: () => {
        refetchChat();
      }
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, sendMessage.isPending]);

  const handleQuizSubmit = () => {
    if (!selectedQuiz) return;
    
    const quiz = quizzes?.find(q => q.id === selectedQuiz);
    if (!quiz || !quiz.questions) return;
    
    const answerArray = quiz.questions.map((_, idx) => answers[idx] ?? 0);
    
    submitQuiz.mutate({ id: selectedQuiz, data: { answers: answerArray } }, {
      onSuccess: (result) => {
        setQuizResult(result);
      }
    });
  };

  const activeQuizData = selectedQuiz ? quizzes?.find(q => q.id === selectedQuiz) : null;

  if (chatLoading || quizzesLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <AppLayout title="Student Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        
        {/* Chat Section */}
        <Card className="lg:col-span-2 flex flex-col h-full border-primary/20 shadow-sm">
          <CardHeader className="border-b bg-muted/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Learning Assistant
            </CardTitle>
            <CardDescription>Ask questions and get help with your studies.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              <div className="space-y-4">
                {chatHistory?.length === 0 && (
                  <div className="text-center text-muted-foreground p-8 flex flex-col items-center">
                    <BrainCircuit className="w-12 h-12 mb-4 text-muted" />
                    <p>No messages yet. Say hello to your assistant!</p>
                  </div>
                )}
                {chatHistory?.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-xl text-sm bg-muted rounded-tl-sm flex items-center gap-2">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-75">●</span>
                      <span className="animate-pulse delay-150">●</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-4 border-t bg-card">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Ask your assistant anything..." 
                className="flex-1 bg-muted/50 border-0 focus-visible:ring-primary/50"
                disabled={sendMessage.isPending}
              />
              <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Quizzes Section */}
        <div className="flex flex-col gap-6 overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle>Available Quizzes</CardTitle>
              <CardDescription>Test your knowledge</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <ScrollArea className="h-full p-4 pt-0">
                <div className="space-y-4">
                  {quizzes?.map((quiz) => (
                    <Card key={quiz.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                      setSelectedQuiz(quiz.id);
                      setAnswers({});
                      setQuizResult(null);
                    }}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{quiz.title}</CardTitle>
                        <CardDescription className="text-xs">{quiz.subject}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 flex justify-between text-sm text-muted-foreground">
                        <span>{quiz.questionCount} Questions</span>
                        <span className="capitalize px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                          {quiz.difficulty}
                        </span>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedQuiz} onOpenChange={(open) => !open && setSelectedQuiz(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{activeQuizData?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 py-4">
            {quizResult ? (
              <div className="text-center py-8">
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4 ${quizResult.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {quizResult.score}%
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {quizResult.passed ? 'Congratulations!' : 'Keep Practicing!'}
                </h3>
                <p className="text-muted-foreground">
                  You got {quizResult.correct} out of {quizResult.totalQuestions} questions right.
                </p>
                <Button className="mt-6" onClick={() => { setSelectedQuiz(null); setQuizResult(null); }}>
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {activeQuizData?.questions?.map((q, qIndex) => (
                  <div key={q.id} className="space-y-4">
                    <p className="font-medium text-lg">{qIndex + 1}. {q.text}</p>
                    <RadioGroup 
                      value={answers[qIndex]?.toString()} 
                      onValueChange={(val) => setAnswers(prev => ({ ...prev, [qIndex]: parseInt(val) }))}
                    >
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value={oIndex.toString()} id={`q${q.id}-o${oIndex}`} />
                          <Label htmlFor={`q${q.id}-o${oIndex}`} className="flex-1 cursor-pointer font-normal">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {!quizResult && (
            <div className="pt-4 border-t mt-auto flex justify-end">
              <Button onClick={handleQuizSubmit} disabled={submitQuiz.isPending}>
                {submitQuiz.isPending ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
