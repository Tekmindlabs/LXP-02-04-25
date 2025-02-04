import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityTemplate, ActivityType } from "@/types/class-activity";

interface ActivityTemplateCardProps {
	template: ActivityTemplate;
	onSelect: (template: ActivityTemplate) => void;
}

const getActivityTypeLabel = (type: ActivityType) => {
	if (type.startsWith('QUIZ_')) return 'Assessment';
	if (type.startsWith('GAME_')) return 'Game';
	return 'Activity';
};

export function ActivityTemplateCard({ template, onSelect }: ActivityTemplateCardProps) {
	return (
		<Card className="h-full hover:shadow-md transition-shadow">
			<CardHeader>
				<div className="flex justify-between items-start">
					<CardTitle className="text-lg">{template.title}</CardTitle>
					<Badge variant="secondary">{getActivityTypeLabel(template.type)}</Badge>
				</div>
				<CardDescription>{template.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{template.configuration.timeLimit && (
						<p className="text-sm">Time Limit: {template.configuration.timeLimit / 60} minutes</p>
					)}
					{template.configuration.attempts && (
						<p className="text-sm">Attempts Allowed: {template.configuration.attempts}</p>
					)}
					<Button 
						className="w-full mt-4" 
						onClick={() => onSelect(template)}
					>
						Use Template
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}