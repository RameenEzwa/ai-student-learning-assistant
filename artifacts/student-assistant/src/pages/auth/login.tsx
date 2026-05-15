import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, BrainCircuit, LineChart, Target } from "lucide-react";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { setAuth, user } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") setLocation("/admin");
      else if (user.role === "client") setLocation("/client");
      else setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        setAuth(res.user, res.token);
      },
      onError: (err) => {
        form.setError("root", { message: err.error?.error || "Login failed" });
      }
    });
  };

  const fillDemo = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Left Column - Branding (Desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-sidebar text-sidebar-foreground p-12 relative overflow-hidden">
        {/* Abstract background decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sidebar-accent/50 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-lg">
            LA
          </div>
          <span className="font-bold text-2xl tracking-tight">Learning Assistant</span>
        </div>

        <div className="relative z-10 max-w-md my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight mb-6">Your AI-powered study companion</h1>
          
          <div className="space-y-6 mt-12">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI Tutor</h3>
                <p className="text-sidebar-foreground/70 leading-relaxed">24/7 personalized assistance with complex concepts and homework.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Smart Quizzes</h3>
                <p className="text-sidebar-foreground/70 leading-relaxed">Test your knowledge with adaptive assessments tailored to your level.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <LineChart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Progress Tracking</h3>
                <p className="text-sidebar-foreground/70 leading-relaxed">Detailed analytics to identify strengths and areas for improvement.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-sidebar-foreground/50">
          © {new Date().getFullYear()} Learning Assistant Platform. All rights reserved.
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-3xl shadow-lg">
              LA
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Learning Assistant</h1>
            <p className="text-muted-foreground">Log in to your account</p>
          </div>

          <Card className="border-border shadow-md">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>Enter your credentials to access your portal</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Email address</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} className="bg-background h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="bg-background h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.formState.errors.root && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Demo Accounts</h3>
            <div className="grid gap-2">
              <button 
                onClick={() => fillDemo("alice@school.edu", "student123")}
                className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div>
                  <div className="font-semibold text-sm">Student</div>
                  <div className="text-xs text-muted-foreground">alice@school.edu</div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-muted font-medium">Auto-fill</div>
              </button>
              
              <button 
                onClick={() => fillDemo("admin@school.edu", "admin123")}
                className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div>
                  <div className="font-semibold text-sm">Administrator</div>
                  <div className="text-xs text-muted-foreground">admin@school.edu</div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-muted font-medium">Auto-fill</div>
              </button>

              <button 
                onClick={() => fillDemo("client@school.edu", "client123")}
                className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div>
                  <div className="font-semibold text-sm">Client / School Admin</div>
                  <div className="text-xs text-muted-foreground">client@school.edu</div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-muted font-medium">Auto-fill</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
