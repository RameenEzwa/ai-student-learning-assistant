import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout: localLogout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        localLogout();
        setLocation("/");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              L
            </div>
            <span className="font-semibold text-lg text-foreground hidden sm:block">Learning Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              {user?.name || "User"}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
