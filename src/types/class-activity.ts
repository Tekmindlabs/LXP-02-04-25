export type ActivityType = 'QUIZ' | 'ASSIGNMENT' | 'READING' | 'PROJECT' | 'EXAM';
export type ActivityStatus = 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE' | 'MISSED';

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