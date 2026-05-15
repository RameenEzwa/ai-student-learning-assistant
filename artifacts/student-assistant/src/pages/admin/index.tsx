import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetAdminStats, useListUsers, useDeleteUser, getListUsersQueryKey, getGetAdminStatsQueryKey, useCreateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Users, UserPlus, BookOpen, ShieldAlert, GraduationCap, Building2, MoreHorizontal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "student", "client"]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: users, isLoading: usersLoading } = useListUsers();

  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        }
      });
    }
  };

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
    },
  });

  const onSubmit = (data: CreateUserFormValues) => {
    createUser.mutate({ data }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      }
    });
  };

  if (statsLoading || usersLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>
      </AppLayout>
    );
  }

  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) => (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-black text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Admin</span>;
      case 'student': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Student</span>;
      case 'client': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Client</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">{role}</span>;
    }
  };

  return (
    <AppLayout title="Dashboard Overview">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          colorClass="bg-blue-100 text-blue-700" 
        />
        <StatCard 
          title="Students" 
          value={stats?.totalStudents || 0} 
          icon={GraduationCap} 
          colorClass="bg-emerald-100 text-emerald-700" 
        />
        <StatCard 
          title="Clients" 
          value={stats?.totalClients || 0} 
          icon={Building2} 
          colorClass="bg-purple-100 text-purple-700" 
        />
        <StatCard 
          title="Admins" 
          value={stats?.totalAdmins || 0} 
          icon={ShieldAlert} 
          colorClass="bg-orange-100 text-orange-700" 
        />
      </div>

      <Card className="border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-card px-8 py-6">
          <div>
            <CardTitle className="text-xl font-bold">User Directory</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Manage platform access and roles</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full font-semibold shadow-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-bold">Create New User</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Initial Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Account Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="pt-4">
                    <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={createUser.isPending}>
                      {createUser.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold pl-8">User</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Date Added</TableHead>
                <TableHead className="text-right pr-8 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id} className="group hover:bg-muted/20">
                  <TableCell className="pl-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{u.name}</span>
                        <span className="text-sm text-muted-foreground">{u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {getRoleBadge(u.role)}
                  </TableCell>
                  <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right pr-8 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 font-medium cursor-pointer py-2"
                          onClick={() => handleDelete(u.id)}
                          disabled={u.id === user?.id || deleteUser.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">
                    No users found in the system.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
