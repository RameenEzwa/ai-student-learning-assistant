import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetProgress, useGetQuizReports, useGetPerformanceData, useGetStudentStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen, Target, TrendingUp, Award, Users, CheckCircle2, XCircle } from "lucide-react";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "client") setLocation("/");
  }, [user, setLocation]);

  const { data: progress, isLoading: progressLoading } = useGetProgress();
  const { data: reports, isLoading: reportsLoading } = useGetQuizReports();
  const { data: performance, isLoading: performanceLoading } = useGetPerformanceData();
  const { data: studentStats, isLoading: studentStatsLoading } = useGetStudentStats();

  if (progressLoading || reportsLoading || performanceLoading) {
    return <div className="p-8 text-muted-foreground">Loading client dashboard...</div>;
  }

  return (
    <AppLayout title="Client Overview">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Quizzes", value: progress?.totalQuizzes ?? 0, suffix: "", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
          { label: "Avg Score", value: progress?.averageScore?.toFixed ? Number(progress.averageScore).toFixed(1) : "0.0", suffix: "%", icon: Target, color: "bg-green-50 text-green-600" },
          { label: "Completion Rate", value: progress?.completionRate?.toFixed ? Number(progress.completionRate).toFixed(1) : "0.0", suffix: "%", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
          { label: "Current Streak", value: progress?.streak ?? 0, suffix: " days", icon: Award, color: "bg-orange-50 text-orange-600" },
        ].map(({ label, value, suffix, icon: Icon, color }) => (
          <Card key={label} className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{value}{suffix}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold">Performance Over Time</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Quiz scores plotted by completion date</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[260px] w-full">
              {(performance?.length ?? 0) === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                  No performance data yet. Complete quizzes to see your chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performance ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      formatter={(value: number) => [`${value}%`, 'Score']}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#scoreGradient)"
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "white" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Quiz Reports */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-bold">Recent Submissions</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Latest quiz results</p>
          </CardHeader>
          <CardContent className="p-0">
            {(reports?.length ?? 0) === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No submissions yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {reports?.slice(0, 6).map((report) => (
                  <div key={report.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 mr-3">
                      <p className="font-semibold text-sm text-foreground truncate">{report.quizTitle}</p>
                      <p className="text-xs text-muted-foreground">{report.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-black text-sm ${report.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {report.score}%
                      </span>
                      {report.passed
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-red-500" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b flex flex-row items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Student Progress Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Per-student learning analytics</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {studentStatsLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (studentStats?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No student data available yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Quizzes Taken</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="pr-6">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentStats?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(s.name)}
                        </div>
                        <span className="font-semibold text-sm">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-sm font-semibold">{s.totalQuizzes}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-black ${s.averageScore >= 70 ? 'text-green-600' : s.averageScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {s.totalQuizzes > 0 ? `${s.averageScore}%` : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.totalQuizzes > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.averageScore >= 70 ? 'bg-green-500' : s.averageScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${s.averageScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{s.averageScore}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No quizzes yet</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-sm text-muted-foreground">
                      {timeAgo(s.lastActive)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
