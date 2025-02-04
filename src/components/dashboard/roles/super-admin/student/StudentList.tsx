'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Status } from "@prisma/client";
import { Student } from "@/types/user";
import { useRouter, useParams } from "next/navigation";

interface StudentListProps {
	students: Student[];
	onSelect: (id: string) => void;
}

export const StudentList = ({ students, onSelect }: StudentListProps) => {
	const router = useRouter();
	const params = useParams();
	const role = params.role as string;

	const calculateAttendanceRate = (attendance: { status: string }[]) => {
		if (attendance.length === 0) return 0;
		const present = attendance.filter(a => a.status === 'PRESENT').length;
		return ((present / attendance.length) * 100).toFixed(1);
	};

	const calculateAverageGrade = (activities: { grade?: number }[]) => {
		const grades = activities.filter(a => a.grade !== undefined).map(a => a.grade!);
		if (grades.length === 0) return '-';
		return (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1);
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Class</TableHead>
						<TableHead>Program</TableHead>
						<TableHead>Guardian</TableHead>
						<TableHead>Attendance</TableHead>
						<TableHead>Avg. Grade</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{students.map((student) => (
						<TableRow key={student.id}>
							<TableCell>{student.name}</TableCell>
							<TableCell>{student.email}</TableCell>
							<TableCell>
								{student.studentProfile.class ? 
									`${student.studentProfile.class.name} (${student.studentProfile.class.classGroup.name})` : 
									'-'
								}
							</TableCell>
							<TableCell>
								{student.studentProfile.class?.classGroup.program.name || '-'}
							</TableCell>
							<TableCell>
								{student.studentProfile.parent?.user.name || '-'}
							</TableCell>
							<TableCell>
								{`${calculateAttendanceRate(student.studentProfile.attendance)}%`}
							</TableCell>
							<TableCell>
								{calculateAverageGrade(student.studentProfile.activities)}
							</TableCell>
							<TableCell>
								<Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
									{student.status}
								</Badge>
							</TableCell>
							<TableCell>
								<div className="flex space-x-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => onSelect(student.id)}
									>
										View Details
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => router.push(`/dashboard/${role}/student/edit/${student.id}`)}
									>
										Edit
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};
