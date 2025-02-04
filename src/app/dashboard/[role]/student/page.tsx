'use client';

import { StudentManagement } from "@/components/dashboard/roles/super-admin/student/StudentManagement";

export default function StudentPage({ params }: { params: { role: string } }) {
	const role = params.role;

	return (
		<div className="container mx-auto py-6">
			<StudentManagement />
		</div>
	);
}
