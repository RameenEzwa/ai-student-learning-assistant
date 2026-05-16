import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetProgress, useGetQuizReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Target, TrendingUp, Award, CheckCircle2, XCircle } from "lucide-react";

export default function StudentProgress() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "student") setLocation("/");
  }, [user, setLocation]);

  const { data: progress, isLoading: progressLoading } = useGetProgress();
  const { data: reports, isLoading: reportsLoading } = useGetQuizReports();

  return (
    <AppLayout title="My Progress">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Quizzes Taken", value: progress?.totalQuizzes ?? 0, suffix: "", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
          { label: "Average Score", value: progressLoading ? "—" : `${Number(progress?.averageScore ?? 0).toFixed(1)}`, suffix: "%", icon: Target, color: "bg-green-50 text-green-600" },
          { label: "Completion Rate", value: progressLoading ? "—" : `${Number(progress?.completionRate ?? 0).toFixed(1)}`, suffix: "%", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
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

      {/* Score Distribution */}
      {!reportsLoading && (reports?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {(() => {
            const passed = reports?.filter(r => r.passed).length ?? 0;
            const failed = (reports?.length ?? 0) - passed;
            const avg = reports?.length ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length) : 0;
            return [
              { label: "Passed", value: passed, color: "text-green-600", bg: "bg-green-50 border-green-200" },
              { label: "Failed", value: failed, color: "text-red-600", bg: "bg-red-50 border-red-200" },
              { label: "Avg Score", value: `${avg}%`, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-xl border-2 p-5 ${bg} flex flex-col items-center justify-center`}>
                <span className={`text-4xl font-black ${color}`}>{value}</span>
                <span className="text-sm font-semibold text-muted-foreground mt-1">{label}</span>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Quiz History */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-bold">Quiz History</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">All your completed quiz attempts</p>
        </CardHeader>
        <CardContent className="p-0">
          {reportsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : (reports?.length ?? 0) === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-base">No quiz history yet.</p>
              <p className="text-sm mt-1">Complete a quiz to see your results here.</p>
            </div>
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
    </AppLayout>
  );
}
