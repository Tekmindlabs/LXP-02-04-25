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
	// Media Activities
	| 'VIDEO_YOUTUBE'
	// Reading Activities
	| 'READING'
	// Legacy Types
	| 'QUIZ'
	| 'ASSIGNMENT'
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
	availabilityDate?: Date;
	deadline?: Date;
	isGraded: boolean;
	totalPoints?: number;
	gradingType: 'AUTOMATIC' | 'MANUAL' | 'NONE';
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
}

export interface ActivitySubmission {
	id: string;
	activityId: string;
	studentId: string;
	submittedAt: Date;
	content: any;
	grade?: number;
	feedback?: string;
	status: 'SUBMITTED' | 'GRADED' | 'PENDING';
}

export interface GradingResult {
	grade: number;
	feedback?: string;
	gradedBy?: string;
	gradedAt: Date;
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
	gridSize: {
		rows: number;
		cols: number;
	};
	orientations: {
		horizontal: boolean;
		vertical: boolean;
		diagonal: boolean;
		reverseHorizontal: boolean;
		reverseVertical: boolean;
		reverseDiagonal: boolean;
	};
	difficulty: 'easy' | 'medium' | 'hard';
	timeLimit?: number;
	showWordList: boolean;
	fillRandomLetters: boolean;
}

export interface FlashcardConfig extends ActivityConfiguration {
	cards: {
		front: string;
		back: string;
	}[];
}

export interface VideoConfig extends ActivityConfiguration {
	videoUrl: string;
	autoplay: boolean;
	showControls: boolean;
}

export interface ReadingConfig extends ActivityConfiguration {
	content: string;
	examples: string[];
	showExamples: boolean;
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