import { ClassActivity, ActivityConfiguration } from "@/types/class-activity";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityViewProps {
	activity: ClassActivity;
	viewType: ActivityConfiguration['viewType'];
	onSubmit?: (submission: any) => Promise<void>;
	onGrade?: (activityId: string, studentId: string, grade: number, feedback?: string) => Promise<void>;
}

export function ActivityView({ activity, viewType, onSubmit, onGrade }: ActivityViewProps) {
	const renderActivityContent = () => {
		switch (activity.type) {
			case 'QUIZ_MULTIPLE_CHOICE':
				return <MultipleChoiceView activity={activity} viewType={viewType} onSubmit={onSubmit} />;
			case 'QUIZ_DRAG_DROP':
				return <DragDropView activity={activity} viewType={viewType} onSubmit={onSubmit} />;
			// Add other activity type views
			default:
				return <div>Unsupported activity type</div>;
		}
	};

	const renderGradingInfo = () => {
		if (!activity.configuration?.isGraded) return null;
		
		return (
			<div className="mt-4 p-4 border rounded-lg bg-muted">
				<h3 className="font-semibold mb-2">Grading Information</h3>
				<div className="space-y-2 text-sm">
					<p>Total Points: {activity.configuration.totalPoints}</p>
					<p>Grading Type: {activity.configuration.gradingType}</p>
					{activity.configuration.passingScore && (
						<p>Passing Score: {activity.configuration.passingScore}%</p>
					)}
				</div>
			</div>
		);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">{activity.title}</h2>
					{activity.description && (
						<p className="text-muted-foreground mt-1">{activity.description}</p>
					)}
				</div>
				<Badge variant={activity.status === 'PUBLISHED' ? 'default' : 'secondary'}>
					{activity.status}
				</Badge>
			</CardHeader>
			<CardContent className="space-y-6">
				{activity.configuration?.instructions && (
					<div className="bg-muted p-4 rounded-lg">
						<h3 className="font-semibold mb-2">Instructions</h3>
						<p>{activity.configuration.instructions}</p>
					</div>
				)}
				
				<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
					{activity.configuration?.availabilityDate && (
						<div>
							Available from: {format(activity.configuration.availabilityDate, 'PPP')}
						</div>
					)}
					{activity.configuration?.deadline && (
						<div>
							Due by: {format(activity.configuration.deadline, 'PPP')}
						</div>
					)}
					{activity.configuration?.timeLimit && (
						<div>
							Time Limit: {Math.floor(activity.configuration.timeLimit / 60)} minutes
						</div>
					)}
					{activity.configuration?.attempts && (
						<div>
							Attempts Allowed: {activity.configuration.attempts}
						</div>
					)}
				</div>

				{viewType !== 'CONFIGURATION' && renderActivityContent()}
				{viewType === 'CONFIGURATION' && renderGradingInfo()}
			</CardContent>
		</Card>
	);
}