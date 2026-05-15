import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetAdminStats, useListUsers, useDeleteUser, useCreateUser,
  useGetAdminActivity, getListUsersQueryKey, getGetAdminStatsQueryKey,
  getGetAdminActivityQueryKey, UserRole,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Users, UserPlus, BookOpen, ShieldAlert, MessageSquare, Trophy, Clock, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "student", "client"]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "admin": return "bg-blue-100 text-blue-700 border-blue-200";
    case "student": return "bg-green-100 text-green-700 border-green-200";
    case "client": return "bg-purple-100 text-purple-700 border-purple-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") setLocation("/");
  }, [user, setLocation]);

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: activity, isLoading: activityLoading } = useGetAdminActivity();

  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        },
      });
    }
  };

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "student" },
  });

  const onSubmit = (data: CreateUserFormValues) => {
    createUser.mutate({ data }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminActivityQueryKey() });
      },
    });
  };

  if (statsLoading || usersLoading) {
    return <div className="p-8 text-muted-foreground">Loading admin dashboard...</div>;
  }

  return (
    <AppLayout title="Admin Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Students", value: stats?.totalStudents ?? 0, icon: BookOpen, color: "bg-green-50 text-green-600" },
          { label: "Clients", value: stats?.totalClients ?? 0, icon: Users, color: "bg-purple-50 text-purple-600" },
          { label: "Admins", value: stats?.totalAdmins ?? 0, icon: ShieldAlert, color: "bg-orange-50 text-orange-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* User Management */}
        <div className="xl:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">User Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Manage all platform users</p>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={createUser.isPending}>
                        {createUser.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id} className="group">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(u.name)}
                          </div>
                          <span className="font-semibold text-sm">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <span className={`capitalize px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(u.id)}
                          disabled={u.id === user?.id || deleteUser.isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Student Activity Feed */}
        <div>
          <Card className="border-border shadow-sm h-full">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Live Activity</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Recent student actions</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activityLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-2.5 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (activity?.length ?? 0) === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recent activity yet.
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                  {activity?.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${item.type === "quiz" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                        {item.type === "quiz" ? <Trophy className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.userName}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{item.description}</p>
                        {item.type === "quiz" && item.score !== undefined && (
                          <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${item.score >= 60 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {item.score >= 60 ? "Passed" : "Failed"} · {item.score}%
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
