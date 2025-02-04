'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import { format } from "date-fns";

interface StudentDetailsProps {
	studentId: string;
	onBack: () => void;
}

export const StudentDetails = ({ studentId, onBack }: StudentDetailsProps) => {
	const { data: student, isLoading } = api.student.getStudent.useQuery(studentId);
	const { data: performance } = api.student.getStudentPerformance.useQuery(studentId);

	if (isLoading || !student || !performance) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">{student.name}</h2>
				<Button onClick={onBack} variant="outline">Back</Button>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="academic">Academic</TabsTrigger>
					<TabsTrigger value="attendance">Attendance</TabsTrigger>
					<TabsTrigger value="activities">Activities</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<Card>
						<CardHeader>
							<CardTitle>Personal Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="font-semibold">Email</p>
									<p>{student.email}</p>
								</div>
								<div>
									<p className="font-semibold">Date of Birth</p>
									<p>{format(new Date(student.studentProfile.dateOfBirth), 'PPP')}</p>
								</div>
								<div>
									<p className="font-semibold">Class</p>
									<p>
										{student.studentProfile.class ? 
											`${student.studentProfile.class.name} (${student.studentProfile.class.classGroup.name})` : 
											'Not Assigned'
										}
									</p>
								</div>
								<div>
									<p className="font-semibold">Program</p>
									<p>{student.studentProfile.class?.classGroup.program.name || 'Not Assigned'}</p>
								</div>
								<div>
									<p className="font-semibold">Guardian</p>
									<p>{student.studentProfile.parent?.user.name || 'Not Assigned'}</p>
								</div>
								<div>
									<p className="font-semibold">Status</p>
									<p>{student.status}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="academic">
					<Card>
						<CardHeader>
							<CardTitle>Academic Performance</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-3 gap-4">
								<Card>
									<CardHeader>
										<CardTitle>Overall Grade</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">
											{performance.performance.activities.averageGrade.toFixed(1)}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Activities Completed</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">
											{performance.performance.activities.completed} / {performance.performance.activities.total}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Attendance Rate</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">
											{performance.performance.attendance.attendanceRate.toFixed(1)}%
										</p>
									</CardContent>
								</Card>
							</div>

							<div className="mt-8">
								<h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
								<div className="space-y-4">
									{performance.performance.subjects.map((subject) => (
										<div key={subject.subject} className="flex justify-between items-center p-4 border rounded">
											<span>{subject.subject}</span>
											<span className="font-semibold">{subject.averageGrade.toFixed(1)}</span>
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="attendance">
					<Card>
						<CardHeader>
							<CardTitle>Attendance Records</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-4 gap-4">
								<Card>
									<CardHeader>
										<CardTitle>Present</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-green-600">
											{performance.performance.attendance.present}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Absent</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-red-600">
											{performance.performance.attendance.absent}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Late</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-yellow-600">
											{performance.performance.attendance.late}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Excused</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-blue-600">
											{performance.performance.attendance.excused}
										</p>
									</CardContent>
								</Card>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="activities">
					<Card>
						<CardHeader>
							<CardTitle>Activity Performance</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{student.studentProfile.activities.map((activity) => (
									<div key={activity.id} className="p-4 border rounded">
										<div className="flex justify-between items-center">
											<div>
												<h4 className="font-semibold">{activity.activity.title}</h4>
												<p className="text-sm text-gray-500">
													{activity.activity.type} - Due: {format(new Date(activity.activity.deadline!), 'PPP')}
												</p>
											</div>
											<div className="text-right">
												<p className="font-semibold">{activity.grade || '-'}</p>
												<p className="text-sm">{activity.status}</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};