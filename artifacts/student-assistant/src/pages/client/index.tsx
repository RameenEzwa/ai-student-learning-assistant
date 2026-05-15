import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetProgress, useGetQuizReports, useGetPerformanceData } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { BookOpen, Target, TrendingUp, Award, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "client") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: progress, isLoading: progressLoading } = useGetProgress();
  const { data: reports, isLoading: reportsLoading } = useGetQuizReports();
  const { data: performance, isLoading: performanceLoading } = useGetPerformanceData();

  if (progressLoading || reportsLoading || performanceLoading) {
    return (
      <AppLayout title="Overview">
        <div className="p-8 text-center text-muted-foreground animate-pulse font-medium">Loading report data...</div>
      </AppLayout>
    );
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }: { title: string, value: string | number, subtitle: string, icon: any, colorClass: string }) => (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <p className="text-3xl font-black text-foreground mb-1">{value}</p>
        <p className="text-sm font-bold text-muted-foreground">{title}</p>
        <p className="text-xs font-medium text-muted-foreground/70 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout title="Performance Overview">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Assignments" 
          value={progress?.totalQuizzes || 0}
          subtitle="Completed to date" 
          icon={BookOpen} 
          colorClass="bg-blue-100 text-blue-700" 
        />
        <StatCard 
          title="Average Score" 
          value={`${progress?.averageScore?.toFixed(1) || 0}%`}
          subtitle="Across all subjects"
          icon={Target} 
          colorClass="bg-emerald-100 text-emerald-700" 
        />
        <StatCard 
          title="Completion Rate" 
          value={`${progress?.completionRate?.toFixed(1) || 0}%`}
          subtitle="Of assigned tasks"
          icon={TrendingUp} 
          colorClass="bg-purple-100 text-purple-700" 
        />
        <StatCard 
          title="Active Streak" 
          value={`${progress?.streak || 0} Days`}
          subtitle="Consecutive study days"
          icon={Award} 
          colorClass="bg-orange-100 text-orange-700" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b px-8 py-6 bg-card">
            <CardTitle className="text-xl font-bold">Progress Trajectory</CardTitle>
            <CardDescription className="text-sm font-medium">Historical performance scores across all assignments</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-10 pb-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performance || []} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}
                    labelStyle={{ fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm rounded-xl overflow-hidden flex flex-col">
          <CardHeader className="border-b px-6 py-6 bg-card">
            <CardTitle className="text-xl font-bold">Recent Submissions</CardTitle>
            <CardDescription className="text-sm font-medium">Latest assignment results</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="divide-y divide-border">
              {reports?.slice(0, 6).map((report) => (
                <div key={report.id} className="p-5 hover:bg-muted/20 transition-colors flex items-center justify-between group">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">
                      {report.passed ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[15px] text-foreground mb-0.5 group-hover:text-primary transition-colors">{report.quizTitle}</p>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span>{report.subject}</span>
                        <span>•</span>
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(report.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-4">
                    <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold border ${report.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {report.score}%
                    </div>
                  </div>
                </div>
              ))}
              
              {(!reports || reports.length === 0) && (
                <div className="p-8 text-center text-muted-foreground font-medium">
                  No recent submissions found.
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 border-t bg-card text-center">
            <Button variant="ghost" className="w-full text-primary font-semibold hover:text-primary hover:bg-primary/5">
              View All Reports <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
