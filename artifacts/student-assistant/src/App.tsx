import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import Login from "@/pages/auth/login";
import AboutPage from "@/pages/about";
import StudentDashboard from "@/pages/student";
import AdminDashboard from "@/pages/admin";
import ClientDashboard from "@/pages/client";

// Wire the stored auth token into every API request
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user } = useAuth();
  
  if (!user) return <Redirect to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/" />;
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/about" component={AboutPage} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={StudentDashboard} allowedRoles={["student"]} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>
      <Route path="/client">
        {() => <ProtectedRoute component={ClientDashboard} allowedRoles={["client"]} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
