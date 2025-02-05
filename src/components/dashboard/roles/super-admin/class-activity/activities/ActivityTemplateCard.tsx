'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ActivityTemplateCardProps {
	template: {
		id: string;
		title: string;
		description?: string;
		type: string;
		icon?: string;
	};
	onClick: () => void;
}

export function ActivityTemplateCard({ template, onClick }: ActivityTemplateCardProps) {
	return (
		<Card 
			className="cursor-pointer hover:border-primary transition-colors"
			onClick={onClick}
		>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">
					{template.title}
				</CardTitle>
				<span className="text-2xl">{template.icon || '📝'}</span>
			</CardHeader>
			<CardContent>
				{template.description && (
					<p className="text-sm text-muted-foreground">
						{template.description}
					</p>
				)}
				<div className="mt-2">
					<Button 
						variant="ghost" 
						size="sm" 
						className="w-full"
					>
						Use Template
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}