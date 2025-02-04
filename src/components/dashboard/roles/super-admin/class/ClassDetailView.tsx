'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Status } from "@prisma/client";
import { api } from "@/trpc/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LuUsers, LuBookOpen, LuGraduationCap, LuUserCheck } from "react-icons/lu";

interface ClassDetailViewProps {

	isOpen: boolean;
	onClose: () => void;
	classId: string;
}

export const ClassDetailView = ({ isOpen, onClose, classId }: ClassDetailViewProps) => {
	const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

	const { data: classDetails } = api.class.getClassDetails.useQuery(
		{ id: classId },
		{ enabled: isOpen }
	);

	const { data: studentProfile } = api.student.getStudentProfile.useQuery(
		{ id: selectedStudentId! },
		{ enabled: !!selectedStudentId }
	);

	if (!classDetails) return null;

	const performanceData = [
		{ name: 'Assignments', completed: 85, pending: 15 },
		{ name: 'Attendance', present: 90, absent: 10 },
		{ name: 'Quizzes', passed: 75, failed: 25 },
	];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">{classDetails.name} - Class Dashboard</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Total Students</CardTitle>
							<LuUsers className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{classDetails.students.length}</div>
							<p className="text-xs text-muted-foreground">
								Capacity: {classDetails.capacity}
							</p>
						</CardContent>
					</Card>
					
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Class Tutor</CardTitle>
							<LuUserCheck className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{classDetails.teachers[0]?.teacher.user.name || 'Not Assigned'}</div>
						</CardContent>
					</Card>
					
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Subject Teachers</CardTitle>
							<LuBookOpen className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{classDetails.teachers.length}</div>
						</CardContent>
					</Card>
					
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Program</CardTitle>
							<LuGraduationCap className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-lg font-bold">{classDetails.classGroup.program.name}</div>
						</CardContent>
					</Card>
				</div>
				<Tabs defaultValue="overview">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="students">Students</TabsTrigger>
						<TabsTrigger value="performance">Performance</TabsTrigger>
						<TabsTrigger value="teachers">Teachers</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						<Card>
							<CardHeader>
								<CardTitle>Class Information</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm font-medium">Program</p>
										<p>{classDetails.classGroup.program.name}</p>
									</div>
									<div>
										<p className="text-sm font-medium">Class Group</p>
										<p>{classDetails.classGroup.name}</p>
									</div>
									<div>
										<p className="text-sm font-medium">Capacity</p>
										<p>{classDetails.capacity}</p>
									</div>
									<div>
										<p className="text-sm font-medium">Status</p>
										<Badge variant={classDetails.status === Status.ACTIVE ? "outline" : "secondary"}>
											{classDetails.status}
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="students">
						<Card>
							<CardHeader>
								<CardTitle>Students List</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{classDetails.students.map((student) => (
											<TableRow key={student.id}>
												<TableCell>{student.user.name}</TableCell>
												<TableCell>{student.user.email}</TableCell>
												<TableCell>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setSelectedStudentId(student.id)}
													>
														View Profile
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="performance">
						<Card>
							<CardHeader>
								<CardTitle>Class Performance Analytics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="h-[300px] mt-4">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={performanceData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="name" />
											<YAxis />
											<Tooltip />
											<Bar dataKey="completed" fill="#22c55e" stackId="a" name="Completed" />
											<Bar dataKey="pending" fill="#f87171" stackId="a" name="Pending" />
											<Bar dataKey="present" fill="#22c55e" stackId="b" name="Present" />
											<Bar dataKey="absent" fill="#f87171" stackId="b" name="Absent" />
											<Bar dataKey="passed" fill="#22c55e" stackId="c" name="Passed" />
											<Bar dataKey="failed" fill="#f87171" stackId="c" name="Failed" />
										</BarChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="teachers">
						<Card>
							<CardHeader>
								<CardTitle>Teaching Staff</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Role</TableHead>
											<TableHead>Subjects</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{classDetails.teachers.map((teacher) => (
											<TableRow key={teacher.teacher.id}>
												<TableCell>{teacher.teacher.user.name}</TableCell>
												<TableCell>Subject Teacher</TableCell>
												<TableCell>N/A</TableCell>
												<TableCell>
													<Badge variant="outline">Active</Badge>
												</TableCell>
											</TableRow>
										))}

									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{selectedStudentId && (
					<Dialog open={!!selectedStudentId} onOpenChange={() => setSelectedStudentId(null)}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Student Profile</DialogTitle>
							</DialogHeader>
							{studentProfile?.studentProfile && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-medium">{studentProfile.name}</h3>
										<p className="text-sm text-gray-500">{studentProfile.email}</p>
									</div>
									<div>
										<h4 className="font-medium">Activities</h4>
										<div className="mt-2">
											{studentProfile.studentProfile.activities.map((activity, index: number) => (
												<div key={index} className="flex justify-between py-1">
													<span>{activity.status}</span>
													{activity.grade && <span>Grade: {activity.grade}</span>}
												</div>
											))}
										</div>
									</div>
									<div>
										<h4 className="font-medium">Attendance</h4>
										<div className="mt-2">
											{studentProfile.studentProfile.attendance.map((record, index: number) => (
												<div key={index} className="flex justify-between py-1">
													<span>{new Date(record.date).toLocaleDateString()}</span>
													<Badge variant="outline">{record.status}</Badge>
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</DialogContent>
					</Dialog>
				)}
			</DialogContent>
		</Dialog>
	);
};