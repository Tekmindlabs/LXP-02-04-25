'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ClassActivityList } from './ClassActivityList';
import { ActivityCreationForm } from './activities/ActivityCreationForm';
import { ActivityTemplateSelector } from './activities/ActivityTemplateSelector';

export function ClassActivityManagement() {
	const [view, setView] = useState<'list' | 'create' | 'template'>('list');
	const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
	const [selectedTemplate, setSelectedTemplate] = useState(null);

	const handleCreate = () => {
		setView('template');
		setSelectedActivity(null);
	};

	const handleTemplateSelect = (template) => {
		setSelectedTemplate(template);
		setView('create');
	};

	const handleEdit = (id: string) => {
		setSelectedActivity(id);
		setView('create');
	};

	const handleClose = () => {
		setView('list');
		setSelectedActivity(null);
		setSelectedTemplate(null);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Class Activities</h2>
				<Button onClick={handleCreate}>
					<PlusCircle className="mr-2 h-4 w-4" />
					Create Activity
				</Button>
			</div>

			{view === 'list' && (
				<ClassActivityList onEdit={handleEdit} />
			)}

			{view === 'template' && (
				<Dialog open onOpenChange={() => setView('list')}>
					<ActivityTemplateSelector 
						onSelect={handleTemplateSelect}
						onClose={() => setView('list')}
					/>
				</Dialog>
			)}

			{view === 'create' && (
				<Dialog open onOpenChange={handleClose}>
					<ActivityCreationForm
						activityId={selectedActivity}
						template={selectedTemplate}
						onClose={handleClose}
					/>
				</Dialog>
			)}
		</div>
	);
}