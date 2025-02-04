export type ActivityType =
	// Assessment Activities
	| 'QUIZ_MULTIPLE_CHOICE'
	| 'QUIZ_DRAG_DROP'
	| 'QUIZ_FILL_BLANKS'
	| 'QUIZ_MEMORY'
	| 'QUIZ_TRUE_FALSE'
	// Game Activities
	| 'GAME_WORD_SEARCH'
	| 'GAME_CROSSWORD'
	| 'GAME_FLASHCARDS'
	// Legacy Types
	| 'QUIZ'
	| 'ASSIGNMENT'
	| 'READING'
	| 'PROJECT'
	| 'EXAM';

export type ActivityStatus = 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE' | 'MISSED';

export interface ActivityTemplate {
	id: string;
	type: ActivityType;
	title: string;
	description?: string;
	configuration: ActivityConfiguration;
}

export interface ActivityConfiguration {
	timeLimit?: number; // in seconds
	attempts?: number;
	passingScore?: number;
	instructions?: string;
}

export interface MultipleChoiceConfig extends ActivityConfiguration {
	questions: {
		text: string;
		options: string[];
		correctAnswer: number;
		points: number;
	}[];
}

export interface DragDropConfig extends ActivityConfiguration {
	items: {
		draggableId: string;
		content: string;
		correctZoneId: string;
	}[];
	dropZones: {
		zoneId: string;
		label: string;
	}[];
}

export interface FillBlanksConfig extends ActivityConfiguration {
	text: string;
	blanks: {
		id: string;
		correctAnswer: string;
		position: number;
	}[];
}

export interface WordSearchConfig extends ActivityConfiguration {
	words: string[];
	gridSize: number;
	difficulty: 'easy' | 'medium' | 'hard';
}

export interface FlashcardConfig extends ActivityConfiguration {
	cards: {
		front: string;
		back: string;
	}[];
}

export interface ClassActivity {
	id: string;
	title: string;
	description?: string;
	type: ActivityType;
	status: ActivityStatus;
	deadline?: Date;
	classId?: string;
	classGroupId?: string;
	gradingCriteria?: string;
	resources?: ActivityResource[];
	configuration?: ActivityConfiguration;
	createdAt: Date;
	updatedAt: Date;
}

export interface ActivityResource {
	id: string;
	title: string;
	type: 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'LINK' | 'IMAGE';
	url: string;
	activityId: string;
}

export interface ClassActivityFilters {
	type: ActivityType | null;
	status: ActivityStatus | null;
	dateRange: {
		from: Date;
		to: Date;
	} | null;
}