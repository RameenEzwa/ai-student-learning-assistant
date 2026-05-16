import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetQuizReports, useGetStudentStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Users, FileBarChart } from "lucide-react";

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

export default function ClientReports() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "client") setLocation("/");
  }, [user, setLocation]);

  const { data: reports, isLoading: reportsLoading } = useGetQuizReports();
  const { data: studentStats, isLoading: studentStatsLoading } = useGetStudentStats();

  return (
    <AppLayout title="Reports">
      <div className="space-y-8">
        {/* Student Progress Table */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b flex flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Student Progress</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Per-student quiz performance overview</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {studentStatsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : (studentStats?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No student data available yet.</div>
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
                        <span className={`text-sm font-black ${s.averageScore >= 70 ? "text-green-600" : s.averageScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          {s.totalQuizzes > 0 ? `${s.averageScore}%` : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {s.totalQuizzes > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${s.averageScore >= 70 ? "bg-green-500" : s.averageScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${s.averageScore}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{s.averageScore}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No quizzes yet</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-sm text-muted-foreground">{timeAgo(s.lastActive)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quiz Submission Log */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b flex flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileBarChart className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">All Quiz Submissions</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Complete record of every quiz attempt</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reportsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : (reports?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No quiz submissions yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Quiz</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="pr-6">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="pl-6 font-semibold text-sm">{report.quizTitle}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{report.subject}</TableCell>
                      <TableCell>
                        <span className={`font-black text-sm ${report.passed ? "text-green-600" : "text-red-600"}`}>
                          {report.score}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${report.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {report.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {report.passed ? "Passed" : "Failed"}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${report.score >= 70 ? "bg-green-500" : report.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${report.score}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{report.score}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
