'use client';

import { ActivityTemplateCard } from './ActivityTemplateCard';
import { ActivityTemplateGrid } from './ActivityTemplateGrid';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import type { ActivityTemplate } from '@/types/class-activity';

interface ActivityTemplateSelectorProps {
	onSelect: (template: ActivityTemplate) => void;
	onClose: () => void;
	templates: ActivityTemplate[];
}

export function ActivityTemplateSelector({ 
	onSelect, 
	onClose,
	templates 
}: ActivityTemplateSelectorProps) {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredTemplates = templates.filter((template: ActivityTemplate) => {
		const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
												 template.description?.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesSearch;
	});



	return (
		<DialogContent className="sm:max-w-[900px]">
			<DialogHeader>
				<DialogTitle>Select Activity Template</DialogTitle>
			</DialogHeader>
			
			<div className="space-y-4">
				<Input
					placeholder="Search templates..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				
				<ActivityTemplateGrid>
					{filteredTemplates.map((template) => (
						<ActivityTemplateCard
							key={template.id}
							template={template}
							onClick={() => {
								onSelect(template);
								onClose();
							}}
						/>
					))}
				</ActivityTemplateGrid>
			</div>
		</DialogContent>
	);
}