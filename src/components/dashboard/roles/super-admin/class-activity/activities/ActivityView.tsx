'use client';

import { ActivityType, ClassActivity, MultipleChoiceConfig, DragDropConfig, FillBlanksConfig, WordSearchConfig, FlashcardConfig, VideoConfig, ReadingConfig } from '@/types/class-activity';
import {
	MultipleChoiceActivity,
	DragDropActivity,
	FillBlanksActivity,
	WordSearchActivity,
	FlashcardActivity,
	VideoActivity,
	ReadingActivity
} from './types';

interface ActivityViewProps {
	activity: ClassActivity;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: any) => void;
}

export function ActivityView({ activity, viewType, onSubmit }: ActivityViewProps) {
	const renderActivity = () => {
		if (!activity.configuration) {
			return (
				<div className="p-4 border rounded bg-muted">
					<p className="text-muted-foreground">
						No configuration available for this activity.
					</p>
				</div>
			);
		}

		switch (activity.type) {
			case 'QUIZ_MULTIPLE_CHOICE':
				return (
					<MultipleChoiceActivity
						config={activity.configuration as MultipleChoiceConfig}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'QUIZ_DRAG_DROP':
				return (
					<DragDropActivity
						config={activity.configuration as DragDropConfig}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'QUIZ_FILL_BLANKS':
				return (
					<FillBlanksActivity
						config={activity.configuration as FillBlanksConfig}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'GAME_WORD_SEARCH':
				return (
					<WordSearchActivity
						config={activity.configuration as WordSearchConfig}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'GAME_FLASHCARDS':
				return (
					<FlashcardActivity
						config={activity.configuration as FlashcardConfig}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'VIDEO_YOUTUBE':
				return (
					<VideoActivity
						config={activity.configuration as VideoConfig}
						viewType={viewType}
						onSubmit={onSubmit}
					/>
				);
			case 'READING':
				return (
					<ReadingActivity
						config={activity.configuration as ReadingConfig}
						viewType={viewType}
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
