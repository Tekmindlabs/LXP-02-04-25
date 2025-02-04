import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import { GradebookOverview, GradebookActivities, StudentGrades } from "./index";
import type { GradebookData } from "./types";



interface GradebookProps {
	courseId: string;
	classId: string;
	type: 'class' | 'subject';
}

export const GradebookComponent: React.FC<GradebookProps> = ({ courseId, classId, type }) => {
	const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'grades'>('overview');
	
	const { data: gradebook, isLoading } = api.gradebook.getGradebook.useQuery({
		courseId,
		classId,
		type
	}) as { data: GradebookData | undefined; isLoading: boolean };

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Class Gradebook</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="activities">Activities</TabsTrigger>
						<TabsTrigger value="grades">Grades</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						<GradebookOverview data={gradebook?.overview} />
					</TabsContent>
					
					<TabsContent value="activities">
						<GradebookActivities activities={gradebook?.activities} />
					</TabsContent>
					
					<TabsContent value="grades">
						<StudentGrades grades={gradebook?.studentGrades} />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
};