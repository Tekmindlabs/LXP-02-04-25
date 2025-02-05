import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";

interface GradebookProps {
	classId: string;
	type?: 'student' | 'teacher';
}

export const GradebookComponent: React.FC<GradebookProps> = ({ classId, type }) => {
	const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'grades'>('overview');
	const { data: gradebook, isLoading } = api.classActivity.getAll.useQuery({
		classId,
	});

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="activities">Activities</TabsTrigger>
					<TabsTrigger value="grades">Grades</TabsTrigger>
				</TabsList>
				<TabsContent value="overview">
					{/* Overview content */}
				</TabsContent>
				<TabsContent value="activities">
					{/* Activities content */}
				</TabsContent>
				<TabsContent value="grades">
					{/* Grades content */}
				</TabsContent>
			</Tabs>
		</div>
	);
};
