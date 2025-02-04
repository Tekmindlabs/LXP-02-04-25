import { ActivityTemplate } from "@/types/class-activity";
import { ActivityTemplateCard } from "./ActivityTemplateCard";

interface ActivityTemplateGridProps {
	templates: ActivityTemplate[];
	onSelectTemplate: (template: ActivityTemplate) => void;
}

export function ActivityTemplateGrid({ templates, onSelectTemplate }: ActivityTemplateGridProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
			{templates.map((template) => (
				<ActivityTemplateCard
					key={template.id}
					template={template}
					onSelect={onSelectTemplate}
				/>
			))}
		</div>
	);
}