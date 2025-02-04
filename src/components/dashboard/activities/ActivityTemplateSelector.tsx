import { useState } from "react";
import { ActivityTemplate, ActivityType } from "@/types/class-activity";
import { ActivityTemplateGrid } from "./ActivityTemplateGrid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ActivityTemplateSelectorProps {
	onTemplateSelect: (template: ActivityTemplate) => void;
	templates: ActivityTemplate[];
}

export function ActivityTemplateSelector({ templates, onTemplateSelect }: ActivityTemplateSelectorProps) {
	const [filterType, setFilterType] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredTemplates = templates.filter((template) => {
		const matchesType = filterType === "all" || 
			(filterType === "assessment" && template.type.startsWith("QUIZ_")) ||
			(filterType === "game" && template.type.startsWith("GAME_"));
		
		const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			template.description?.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesType && matchesSearch;
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-col md:flex-row gap-4">
				<div className="w-full md:w-1/3">
					<Label htmlFor="search">Search Templates</Label>
					<Input
						id="search"
						placeholder="Search by title or description..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full"
					/>
				</div>
				<div className="w-full md:w-1/3">
					<Label htmlFor="type">Activity Type</Label>
					<Select value={filterType} onValueChange={setFilterType}>
						<SelectTrigger id="type">
							<SelectValue placeholder="Select type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value="assessment">Assessments</SelectItem>
							<SelectItem value="game">Games</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<ActivityTemplateGrid 
				templates={filteredTemplates}
				onSelectTemplate={onTemplateSelect}
			/>
		</div>
	);
}