"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DefaultRoles } from "@/utils/permissions";
import { Users, BookOpen, Calendar, FileText, ChartBar } from "lucide-react";

const roleContent = {
  [DefaultRoles.SUPER_ADMIN]: {
    title: "Super Admin Dashboard",
    metrics: [
      { title: "Total Users", value: "1,234", icon: Users },
      { title: "Active Roles", value: "6", icon: BookOpen },
      { title: "System Health", value: "98%", icon: ChartBar },
      { title: "Audit Logs", value: "523", icon: FileText },
    ],
  },
  [DefaultRoles.ADMIN]: {
    title: "Admin Dashboard",
    metrics: [
      { title: "Active Users", value: "856", icon: Users },
      { title: "Departments", value: "12", icon: BookOpen },
      { title: "Reports", value: "45", icon: FileText },
      { title: "Tasks", value: "28", icon: Calendar },
    ],
  },
  [DefaultRoles.PROGRAM_COORDINATOR]: {
    title: "Program Coordinator Dashboard",
    metrics: [
      { title: "Programs", value: "15", icon: BookOpen },
      { title: "Students", value: "342", icon: Users },
      { title: "Schedules", value: "24", icon: Calendar },
      { title: "Reports", value: "18", icon: FileText },
    ],
  },
  [DefaultRoles.TEACHER]: {
    title: "Teacher Dashboard",
    metrics: [
      { title: "Classes", value: "6", icon: BookOpen },
      { title: "Students", value: "156", icon: Users },
      { title: "Assignments", value: "32", icon: FileText },
      { title: "Schedule", value: "Weekly", icon: Calendar },
    ],
  },
  [DefaultRoles.STUDENT]: {
    title: "Student Dashboard",
    metrics: [
      { title: "Courses", value: "5", icon: BookOpen },
      { title: "Assignments", value: "12", icon: FileText },
      { title: "Schedule", value: "Weekly", icon: Calendar },
      { title: "Progress", value: "78%", icon: ChartBar },
    ],
  },
  [DefaultRoles.PARENT]: {
    title: "Parent Dashboard",
    metrics: [
      { title: "Children", value: "2", icon: Users },
      { title: "Progress Reports", value: "8", icon: FileText },
      { title: "Meetings", value: "3", icon: Calendar },
      { title: "Messages", value: "5", icon: ChartBar },
    ],
  },
};

export function DashboardContent({ role }: { role: keyof typeof DefaultRoles }) {
  const content = roleContent[role];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{content.title}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {content.metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}