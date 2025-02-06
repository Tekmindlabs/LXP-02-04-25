'use client';

import { useParams } from "next/navigation";
import { ClassDetailsView } from "@/components/dashboard/roles/super-admin/class/ClassDetailsView";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ClassDetailsPage() {
	const { data: session, status } = useSession();
	const params = useParams();
	const classId = params.id as string;

	if (status === "loading") {
		return <div>Loading...</div>;
	}

	if (!session) {
		redirect("/auth/signin");
	}

	return (
		<div className="container mx-auto py-6">
			<ClassDetailsView classId={classId} />
		</div>
	);
}