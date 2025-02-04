'use client';

import { ActivityType, ClassActivity } from '@/types/class-activity';
import {
	MultipleChoiceActivity,
	DragDropActivity,
	FillBlanksActivity,
	WordSearchActivity,
	FlashcardActivity
} from './types';

interface ActivityViewProps {
	activity: ClassActivity;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: any) => void;
}

export function ActivityView({ activity, viewType, onSubmit }: ActivityViewProps) {
	const renderActivity = () => {
		switch (activity.type) {
			case 'QUIZ_MULTIPLE_CHOICE':
				return (
					<MultipleChoiceActivity
						config={activity.configuration}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'QUIZ_DRAG_DROP':
				return (
					<DragDropActivity
						config={activity.configuration}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'QUIZ_FILL_BLANKS':
				return (
					<FillBlanksActivity
						config={activity.configuration}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'GAME_WORD_SEARCH':
				return (
					<WordSearchActivity
						config={activity.configuration}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'GAME_FLASHCARDS':
				return (
					<FlashcardActivity
						config={activity.configuration}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			default:
				return (
					<div className="p-4 border rounded bg-muted">
						<p className="text-muted-foreground">
							Activity type {activity.type} is not supported yet.
						</p>
					</div>
				);
		}
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<h2 className="text-2xl font-bold">{activity.title}</h2>
				{activity.description && (
					<p className="text-muted-foreground">{activity.description}</p>
				)}
			</div>
			{renderActivity()}
		</div>
	);
}
