import { 
	ActivityType, 
	ActivityStatus, 
	ActivityConfiguration 
} from '@/types/class-activity';

export interface UnifiedClassActivity {
	id: string;
	title: string;
	description?: string;
	type: ActivityType;
	status: ActivityStatus;
	deadline?: Date;
	classId?: string;
	classGroupId?: string;
	configuration: ActivityConfiguration;
	resources?: ActivityResource[];
	submissions?: ActivitySubmission[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ActivityResource {
	id: string;
	title: string;
	type: 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'LINK' | 'IMAGE';
	url: string;
}

export interface ActivitySubmission {
	id: string;
	studentId: string;
	content: any;
	grade?: number;
	feedback?: string;
	status: 'SUBMITTED' | 'GRADED' | 'PENDING';
	submittedAt: Date;
}