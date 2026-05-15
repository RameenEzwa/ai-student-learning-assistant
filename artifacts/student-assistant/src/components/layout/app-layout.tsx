import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { LogOut, User as UserIcon, LayoutDashboard, BookOpen, TrendingUp, Users, BarChart3, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout: localLogout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        localLogout();
        setLocation("/");
      },
    });
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navItems = {
    student: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "My Quizzes", href: "/dashboard", icon: BookOpen }, // We keep them on dashboard as requested by original UI
      { name: "Progress", href: "/dashboard", icon: TrendingUp },
    ],
    admin: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Users", href: "/admin", icon: Users },
    ],
    client: [
      { name: "Overview", href: "/client", icon: LayoutDashboard },
      { name: "Reports", href: "/client", icon: BarChart3 },
    ],
  };

  const currentNavItems = user ? navItems[user.role as keyof typeof navItems] || [] : [];

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shrink-0">
            LA
          </div>
          <span className="font-semibold text-lg text-sidebar-foreground truncate">Learning Assistant</span>
        </div>
        
        <nav className="space-y-2">
          {currentNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between bg-sidebar-accent/30 rounded-lg p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "User"}</span>
              <span className="text-xs text-sidebar-foreground/50 capitalize truncate">{user?.role}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out" className="text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col shadow-xl z-50">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-sidebar-foreground hover:bg-sidebar-accent">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-white flex items-center px-4 md:px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4 w-full">
            <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
