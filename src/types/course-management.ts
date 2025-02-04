export interface Calendar {
	id: string;
	name: string;
	description?: string;
	startDate: Date;
	endDate: Date;
}

export interface ClassGroup {
	id: string;
	name: string;
	description?: string;
	calendar?: Calendar;
	calendarId: string;
}

// Core Course Types
export interface Course {
	id: string;
	name: string;
	subjects: Subject[];
	academicYear: string;
	classGroupId: string;
	calendarId?: string;
}


export interface Subject {
	id: string;
	name: string;
	description?: string;
	courseStructure: CourseStructure;
	teachers: TeacherAssignment[];
	activities: ClassActivity[];
}

export interface TeacherAssignment {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	status: 'ACTIVE' | 'INACTIVE';
	teacherId: string;
	subjectId: string;
	classId: string;
	isClassTeacher: boolean;
	assignedAt: Date;
}

// Course Structure Types
export type CourseStructureType = 'CHAPTER' | 'BLOCK' | 'WEEKLY';

export interface ContentBlock {
	id: string;
	type: 'TEXT' | 'VIDEO' | 'QUIZ' | 'ASSIGNMENT';
	content: string;
	metadata?: Record<string, unknown>;
}

export interface CourseStructure {
	type: CourseStructureType;
	units: ChapterUnit[] | BlockUnit[] | WeeklyUnit[];
}

export interface ChapterUnit {
	chapterNumber: number;
	title: string;
	sections: {
		title: string;
		content: ContentBlock[];
		activities: ClassActivity[];
	}[];
}

export interface BlockUnit {
	position: number;
	title: string;
	content: ContentBlock[];
	activities: ClassActivity[];
}

export interface WeeklyUnit {
	weekNumber: number;
	startDate: Date;
	endDate: Date;
	dailyActivities: {
		day: number;
		content: ContentBlock[];
		activities: ClassActivity[];
	}[];
}

// Activity Types
export interface ClassActivity {
	id: string;
	type: 'ASSIGNMENT' | 'QUIZ' | 'PROJECT' | 'DISCUSSION' | 'EXAM';
	title: string;
	description: string;
	dueDate?: Date;
	points?: number;
	status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

// Progress Tracking
export interface ProgressTracking {
	subjectId: string;
	studentId: string;
	progress: {
		unitId: string;
		completedContent: string[];
		completedActivities: string[];
		grades: Record<string, number>;
	}[];
}