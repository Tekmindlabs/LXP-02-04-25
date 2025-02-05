import { ClassActivity } from "@/types/class-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface ActivityListProps {
	activities: ClassActivity[];
	onEdit: (activity: ClassActivity) => void;
}

const getStatusColor = (status: string) => {
	const colors = {
		DRAFT: "bg-gray-500",
		PUBLISHED: "bg-green-500",
		PENDING: "bg-yellow-500",
		SUBMITTED: "bg-blue-500",
		GRADED: "bg-purple-500",
		LATE: "bg-orange-500",
		MISSED: "bg-red-500",
	};
	return colors[status as keyof typeof colors] || "bg-gray-500";
};

export function ActivityList({ activities, onEdit }: ActivityListProps) {
	return (
		<div className="grid gap-4">
			{activities.map((activity) => (
				<Card key={activity.id} className="hover:shadow-md transition-shadow">
					<CardHeader className="pb-2">
						<div className="flex justify-between items-start">
							<div>
								<CardTitle className="text-lg">{activity.title}</CardTitle>
								<p className="text-sm text-muted-foreground">
									{activity.type.replace(/_/g, ' ')}
								</p>
							</div>
							<Badge className={getStatusColor(activity.status)}>
								{activity.status}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1">
								{activity.deadline && (
									<p className="text-sm">
										Due {formatDistanceToNow(activity.deadline, { addSuffix: true })}
									</p>
								)}
								{activity.configuration?.attempts && (
									<p className="text-sm">
										Attempts: {activity.configuration.attempts}
									</p>
								)}
							</div>
							<div className="flex justify-end">
								<Button variant="outline" onClick={() => onEdit(activity)}>
									Edit Activity
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}