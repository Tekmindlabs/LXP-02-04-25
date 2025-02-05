'use client';

import { useState } from "react";
import { ActivityTemplate, ActivityType, ClassActivity } from "@/types/class-activity";
import { ActivityTemplateSelector } from "@/components/dashboard/roles/super-admin/class-activity/activities/ActivityTemplateSelector";
import { ActivityCreationForm } from "@/components/dashboard/roles/super-admin/class-activity/activities/ActivityCreationForm";
import { ActivityList } from "@/components/dashboard/roles/super-admin/class-activity/activities/ActivityList";
import { Button } from "@/components/ui/button";
import { sampleTemplates } from "@/data/sample-data";




// Sample activities - replace with API call in production
const sampleActivities: ClassActivity[] = [
	{
		id: "1",
		title: "Week 1 Assessment",
		type: "QUIZ_MULTIPLE_CHOICE",
		status: "PUBLISHED",
		deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		configuration: {
			timeLimit: 1800,
			attempts: 2,
			passingScore: 70,
			isGraded: true,
			gradingType: "AUTOMATIC",
			viewType: "STUDENT"
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "2",
		title: "Vocabulary Practice",
		type: "GAME_WORD_SEARCH",
		status: "DRAFT",
		configuration: {
			timeLimit: 900,
			attempts: 3,
			isGraded: false,
			gradingType: "NONE",
			viewType: "STUDENT"
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	}
];

export default function ClassActivityPage() {
	const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [activities, setActivities] = useState<ClassActivity[]>(sampleActivities);

	const handleTemplateSelect = (template: ActivityTemplate) => {
		setSelectedTemplate({
			id: template.id,
			type: template.type,
			title: template.title,
			description: template.description,
			configuration: {
				...template.configuration,
				isGraded: false,
				gradingType: "NONE",
				viewType: "STUDENT"
			}
		});
		setIsCreating(true);
	};

	const handleCancel = () => {
		setSelectedTemplate(null);
		setIsCreating(false);
	};

	const handleSubmit = async (values: any) => {
		// TODO: Implement activity creation API call
		console.log('Creating activity with values:', values);
		
		// Simulate activity creation
		const newActivity: ClassActivity = {
			id: String(activities.length + 1),
			title: values.title,
			type: selectedTemplate?.type || "QUIZ_MULTIPLE_CHOICE",
			status: "DRAFT",
			configuration: {
				timeLimit: values.timeLimit,
				attempts: values.attempts,
				passingScore: values.passingScore,
				instructions: values.instructions,
				isGraded: values.configuration?.isGraded || false,
				gradingType: values.configuration?.gradingType || "NONE",
				viewType: values.configuration?.viewType || "STUDENT"
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		setActivities([newActivity, ...activities]);
		setSelectedTemplate(null);
		setIsCreating(false);
	};

	const handleEdit = (activity: ClassActivity) => {
		// TODO: Implement edit functionality
		console.log('Editing activity:', activity);
	};

	return (
		<div className="container mx-auto p-4 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Class Activities</h1>
				{!isCreating && (
					<Button onClick={() => setIsCreating(true)}>
						Create New Activity
					</Button>
				)}
			</div>

			{isCreating ? (
				selectedTemplate ? (
					<ActivityCreationForm
						template={selectedTemplate}
						onSubmit={handleSubmit}
						onClose={handleCancel}
					/>
				) : (
					<ActivityTemplateSelector
						onSelect={handleTemplateSelect}
						onClose={() => setIsCreating(false)}
						templates={sampleTemplates}
					/>
				)
			) : (
				<ActivityList activities={activities} onEdit={handleEdit} />
			)}
		</div>
	);
}
