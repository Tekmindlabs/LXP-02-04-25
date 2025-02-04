'use client';

import { useState } from "react";
import { ActivityTemplate, ActivityType, ClassActivity } from "@/types/class-activity";
import { ActivityTemplateSelector } from "@/components/dashboard/activities/ActivityTemplateSelector";
import { ActivityCreationForm } from "@/components/dashboard/activities/ActivityCreationForm";
import { ActivityList } from "@/components/dashboard/activities/ActivityList";
import { Button } from "@/components/ui/button";

// Sample templates - replace with API call in production
const sampleTemplates: ActivityTemplate[] = [
	{
		id: "1",
		type: "QUIZ_MULTIPLE_CHOICE",
		title: "Basic Multiple Choice Quiz",
		description: "Standard multiple choice quiz template with customizable options",
		configuration: {
			timeLimit: 1800,
			attempts: 2,
			passingScore: 70,
		}
	},
	{
		id: "2",
		type: "GAME_WORD_SEARCH",
		title: "Vocabulary Word Search",
		description: "Interactive word search game for vocabulary practice",
		configuration: {
			timeLimit: 900,
			attempts: 3,
		}
	},
	{
		id: "3",
		type: "QUIZ_FILL_BLANKS",
		title: "Fill in the Blanks Exercise",
		description: "Text completion exercise with blank spaces",
		configuration: {
			timeLimit: 1200,
			attempts: 2,
			passingScore: 80,
		}
	}
];

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
		setSelectedTemplate(template);
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
						onCancel={handleCancel}
					/>
				) : (
					<ActivityTemplateSelector
						templates={sampleTemplates}
						onTemplateSelect={handleTemplateSelect}
					/>
				)
			) : (
				<ActivityList activities={activities} onEdit={handleEdit} />
			)}
		</div>
	);
}
