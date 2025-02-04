import { PrismaClient, Course as PrismaCourse, ClassGroup, Prisma, Status } from "@prisma/client";
import { db } from "../db";
import {
	Course,
	Subject,
	TeacherAssignment,
	ClassActivity,
	CourseStructure,
	CourseStructureType,
	ProgressTracking,
	ChapterUnit,
	BlockUnit,
	WeeklyUnit
} from "@/types/course-management";

interface CourseSettings {
	allowLateSubmissions: boolean;
	gradingScale: string;
	attendanceRequired: boolean;
}

export class CourseService {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = db;
	}

	private serializeCourseSettings(settings: CourseSettings): Prisma.InputJsonValue {
		// Convert null values to undefined for Prisma compatibility
		const serialized = JSON.parse(JSON.stringify(settings));
		return serialized === null ? undefined : serialized;
	}

	async createCourseTemplate(data: {
		name: string;
		programId: string;
		subjects: string[];
		settings: CourseSettings;
	}): Promise<PrismaCourse> {
		return this.prisma.course.create({
			data: {
				name: data.name,
				programId: data.programId,
				academicYear: new Date().getFullYear().toString(),
				isTemplate: true,
				settings: this.serializeCourseSettings(data.settings),
				subjects: {
					connect: data.subjects.map(id => ({ id }))
				}
			},
			include: {
				subjects: true
			}
		});
	}

	async createCourseFromTemplate(templateId: string, data: {
		name: string;
		programId: string;
		settings?: CourseSettings;
	}): Promise<PrismaCourse> {
		const template = await this.prisma.course.findUnique({
			where: { id: templateId },
			include: { subjects: true }
		});

		if (!template) {
			throw new Error('Template course not found');
		}

		const settings = data.settings 
			? this.serializeCourseSettings(data.settings)
			: template.settings === null 
				? undefined 
				: template.settings;

		return this.prisma.course.create({
			data: {
				name: data.name,
				programId: data.programId,
				academicYear: new Date().getFullYear().toString(),
				parentCourseId: template.id,
				settings,
				subjects: {
					connect: template.subjects.map(s => ({ id: s.id }))
				}
			},
			include: {
				subjects: true,
				parentCourse: true
			}
		});
	}

	async createClassGroupWithCourse(data: {
		name: string;
		description?: string;
		programId: string;
		calendarId: string;
		course: {
			name: string;
			subjects: string[];
			isTemplate: boolean;
			templateId?: string;
			settings: CourseSettings;
		};
	}): Promise<ClassGroup> {
		return this.prisma.$transaction(async (tx) => {
			let course: PrismaCourse;

			if (data.course.templateId) {
				const template = await tx.course.findUnique({
					where: { 
						id: data.course.templateId,
						isTemplate: true
					},
					include: { subjects: true }
				});

				if (!template) {
					throw new Error('Template course not found');
				}

				course = await tx.course.create({
					data: {
						name: data.course.name,
						programId: data.programId,
						academicYear: new Date().getFullYear().toString(),
						parentCourseId: template.id,
						settings: this.serializeCourseSettings(data.course.settings),
						subjects: {
							connect: template.subjects.map(s => ({ id: s.id }))
						}
					}
				});
			} else {
				course = await tx.course.create({
					data: {
						name: data.course.name,
						programId: data.programId,
						academicYear: new Date().getFullYear().toString(),
						isTemplate: data.course.isTemplate,
						settings: this.serializeCourseSettings(data.course.settings),
						subjects: {
							connect: data.course.subjects.map(id => ({ id }))
						}
					}
				});
			}

			const classGroup = await tx.classGroup.create({
				data: {
					name: data.name,
					description: data.description,
					programId: data.programId,
					courseId: course.id,
					calendarId: data.calendarId
				},
				include: {
					course: {
						include: {
							subjects: true
						}
					},
					calendar: {
						select: {
							metadata: true
						}
					}
				}
			});

			// If calendar has metadata, merge it with course settings
			if (classGroup.calendar?.metadata) {
				const calendarMetadata = classGroup.calendar.metadata as Record<string, unknown>;
				const mergedSettings = {
					...data.course.settings,
					...calendarMetadata
				};

				await tx.course.update({
					where: { id: course.id },
					data: {
						settings: this.serializeCourseSettings(mergedSettings as CourseSettings)
					}
				});
			}

			return classGroup;
		});
	}

	async getTemplates(): Promise<PrismaCourse[]> {
		return this.prisma.course.findMany({
			where: {
				isTemplate: true
			},
			include: {
				subjects: true
			}
		});
	}

	async updateCourseSettings(courseId: string, settings: CourseSettings): Promise<PrismaCourse> {
		return this.prisma.course.update({
			where: { id: courseId },
			data: {
				settings: this.serializeCourseSettings(settings)
			}
		});
	}
}

export const courseService = new CourseService();

// Helper mapping functions
interface ClassActivityInput {

	id: string;
	type?: string;
	title: string;
	description: string;
	dueDate?: Date | string | null;
	points?: number | null;
	status?: string;
}

interface CourseStructureInput {
	type: CourseStructureType;
	units: Array<ChapterUnit | BlockUnit | WeeklyUnit>;
}


interface SubjectInput {
	id: string;
	name: string;
	description?: string | null;
	courseStructure?: CourseStructureInput | null;
	teachers?: Array<{
		id: string;
		teacherId: string;
		subjectId: string;
		status: Status;
	}>;
	activities?: Array<{
		id: string;
		type: string;
		title: string;
		description: string;
		dueDate: Date | null;
		points: number | null;
		status: string;
	}>;
}

const serializeJson = (data: unknown): Prisma.InputJsonValue => {
	const serialized = JSON.parse(JSON.stringify(data));
	return serialized === null ? undefined : serialized;
};




const mapClassActivity = (a: ClassActivityInput): ClassActivity => ({
	id: a.id,
	type: (a.type || 'ASSIGNMENT') as ClassActivity['type'],
	title: a.title,
	description: a.description,
	dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
	points: typeof a.points === 'number' ? a.points : undefined,
	status: (a.status || 'DRAFT') as ClassActivity['status']
});

const parseCourseStructure = (data: unknown): CourseStructure => {
	if (!data) {
		return { type: 'CHAPTER', units: [] };
	}
	try {
		const parsed = typeof data === 'string' ? JSON.parse(data) : data;
		return {
			type: (parsed.type as CourseStructureType) || 'CHAPTER',
			units: Array.isArray(parsed.units) ? parsed.units as (ChapterUnit[] | BlockUnit[] | WeeklyUnit[]) : []
		};
	} catch {
		return { type: 'CHAPTER', units: [] };
	}
};


const mapSubject = (s: SubjectInput): Subject => ({
	id: s.id,
	name: s.name,
	description: s.description || undefined,
	courseStructure: parseCourseStructure(s.courseStructure),
	teachers: (s.teachers || []).map(t => ({
		id: t.id,
		teacherId: t.teacherId,
		subjectId: t.subjectId,
		classId: '',
		isClassTeacher: false,
		assignedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		status: t.status === Status.ACTIVE ? 'ACTIVE' : 'INACTIVE'
	})),
	activities: (s.activities || []).map(mapClassActivity)
});



export class CourseManagementService {



	async createSubject(subjectData: {
		name: string;
		description: string;
		courseStructure: CourseStructure;
	}): Promise<Subject> {
		const subject = await db.subject.create({
			data: {
				name: subjectData.name,
				description: subjectData.description,
				code: `SUB-${Date.now()}`,
				courseStructure: serializeJson(subjectData.courseStructure)
			},
			include: {
				teachers: true,
				activities: true
			}
		});

		return {
			id: subject.id,
			name: subject.name,
			description: subject.description || undefined,
			courseStructure: parseCourseStructure(subject.courseStructure),
			teachers: [],
			activities: []
		};
	}

	async createCourse(courseData: {
		name: string;
		academicYear: string;
		classGroupId: string;
		subjectIds: string[];
	}): Promise<Course> {
		const classGroup = await db.classGroup.findUnique({
			where: { id: courseData.classGroupId },
			include: { program: true }
		});

		if (!classGroup) {
			throw new Error('Class group not found');
		}

		const course = await db.course.create({
			data: {
				name: courseData.name,
				academicYear: courseData.academicYear,
				programId: classGroup.programId,
				classGroups: {
					connect: { id: courseData.classGroupId }
				},
				subjects: {
					connect: courseData.subjectIds.map(id => ({ id }))
				}
			},
			include: {
				subjects: {
					include: {
						teachers: true,
						activities: true
					}
				},
				classGroups: {
					include: {
						calendar: true
					}
				}
			}
		});

		const connectedClassGroup = course.classGroups[0];

		return {
			id: course.id,
			name: course.name,
			academicYear: course.academicYear,
			subjects: course.subjects.map(s => ({
				id: s.id,
				name: s.name,
				description: s.description || undefined,
				courseStructure: parseCourseStructure(s.courseStructure),
				teachers: s.teachers.map(t => ({
					id: t.id,
					teacherId: t.teacherId,
					subjectId: t.subjectId,
					classId: '',
					isClassTeacher: false,
					assignedAt: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
					status: t.status === Status.ACTIVE ? 'ACTIVE' : 'INACTIVE'
				})),
				activities: s.activities.map(mapClassActivity)
			})),
			classGroupId: connectedClassGroup.id,
			calendarId: connectedClassGroup.calendar?.id
		};
	}

	async updateCourse(courseId: string, courseData: {
		name?: string;
		academicYear?: string;
		classGroupId?: string;
	}): Promise<Course> {
		const course = await db.course.update({
			where: { id: courseId },
			data: {
				name: courseData.name,
				academicYear: courseData.academicYear,
				...(courseData.classGroupId && {
					classGroups: {
						set: [{ id: courseData.classGroupId }]
					}
				})
			},
			include: {
				subjects: {
					include: {
						teachers: true,
						activities: true
					}
				},
				classGroups: {
					include: {
						calendar: true
					}
				}
			}
		});

		const classGroup = course.classGroups[0];

		return {
			id: course.id,
			name: course.name,
			academicYear: course.academicYear,
			subjects: course.subjects.map(s => ({
				id: s.id,
				name: s.name,
				description: s.description || undefined,
				courseStructure: parseCourseStructure(s.courseStructure),
				teachers: s.teachers.map(t => ({
					id: t.id,
					teacherId: t.teacherId,
					subjectId: t.subjectId,
					classId: '',
					isClassTeacher: false,
					assignedAt: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
					status: t.status === Status.ACTIVE ? 'ACTIVE' : 'INACTIVE'
				})),
				activities: s.activities.map(mapClassActivity)
			})),
			classGroupId: classGroup.id,
			calendarId: classGroup.calendar?.id
		};
	}

	async addSubjectToCourse(courseId: string, subjectData: {
		name: string;
		description?: string;
		courseStructure: CourseStructure;
	}): Promise<Subject> {
		const subject = await db.subject.create({
			data: {
				name: subjectData.name,
				description: subjectData.description,
				code: `SUB-${Date.now()}`,
				courseStructure: serializeJson(subjectData.courseStructure),
				course: {
					connect: { id: courseId }
				}
			},
			include: {
				teachers: true,
				activities: true
			}
		});

		return {
			id: subject.id,
			name: subject.name,
			description: subject.description || undefined,
			courseStructure: parseCourseStructure(subject.courseStructure),
			teachers: subject.teachers.map(t => ({
				id: t.id,
				teacherId: t.teacherId,
				subjectId: t.subjectId,
				classId: '',
				isClassTeacher: false,
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				status: t.status === Status.ACTIVE ? 'ACTIVE' : 'INACTIVE'
			})),
			activities: subject.activities.map(mapClassActivity)
		};
	}

	async updateSubject(subjectId: string, subjectData: {
		name?: string;
		description?: string;
		courseStructure?: CourseStructure;
	}): Promise<Subject> {
		const subject = await db.subject.update({
			where: { id: subjectId },
			data: {
				name: subjectData.name,
				description: subjectData.description,
				...(subjectData.courseStructure && {
					courseStructure: serializeJson(subjectData.courseStructure)
				})
			},
			include: {
				teachers: true,
				activities: true
			}
		});

		return {
			id: subject.id,
			name: subject.name,
			description: subject.description || undefined,
			courseStructure: parseCourseStructure(subject.courseStructure),
			teachers: subject.teachers.map(t => ({
				id: t.id,
				teacherId: t.teacherId,
				subjectId: t.subjectId,
				classId: '',
				isClassTeacher: false,
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				status: t.status === Status.ACTIVE ? 'ACTIVE' : 'INACTIVE'
			})),
			activities: subject.activities.map(mapClassActivity)
		};
	}


	async assignTeacher(assignment: Omit<TeacherAssignment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<TeacherAssignment> {
		const teacherAssignment = await db.teacherAssignment.create({
			data: {
				teacherId: assignment.teacherId,
				subjectId: assignment.subjectId,
				classId: assignment.classId,
				isClassTeacher: assignment.isClassTeacher,
				assignedAt: assignment.assignedAt
			}
		});

		return {
			...teacherAssignment,
			status: 'ACTIVE' as const,
			createdAt: new Date(),
			updatedAt: new Date()
		};
	}

	async updateTeacherAssignment(assignmentId: string, updates: Partial<TeacherAssignment>): Promise<TeacherAssignment> {
		const assignment = await db.teacherAssignment.update({
			where: { id: assignmentId },
			data: updates
		});

		return {
			id: assignment.id,
			teacherId: assignment.teacherId,
			subjectId: assignment.subjectId,
			classId: assignment.classId || '',
			isClassTeacher: assignment.isClassTeacher || false,
			assignedAt: assignment.assignedAt || new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
			status: 'ACTIVE'
		};
	}

	async updateCourseStructure(subjectId: string, structure: CourseStructure): Promise<Subject> {
		const isValid = await this.validateCourseStructure(structure);
		if (!isValid) {
			throw new Error('Invalid course structure');
		}

		const subject = await db.subject.update({
			where: { id: subjectId },
			data: {
				courseStructure: serializeJson(structure)
			},
			include: {
				teachers: true,
				activities: true
			}
		});

		return {
			id: subject.id,
			name: subject.name,
			description: subject.description || undefined,
			courseStructure: parseCourseStructure(subject.courseStructure),
			teachers: subject.teachers.map(t => ({
				id: t.id,
				teacherId: t.teacherId,
				subjectId: t.subjectId,
				classId: '',
				isClassTeacher: false,
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				status: t.status === Status.ACTIVE ? 'ACTIVE' : 'INACTIVE'
			})),
			activities: subject.activities.map(mapClassActivity)
		};
	}

	async updateActivityStatus(activityId: string, status: ClassActivity['status']): Promise<ClassActivity> {
		const activity = await db.classActivity.update({
			where: { id: activityId },
			data: { status }
		});

		return mapClassActivity(activity);
	}


	async createActivity(subjectId: string, activity: Omit<ClassActivity, 'id'>): Promise<ClassActivity> {
		const newActivity = await db.classActivity.create({
			data: {
				title: activity.title,
				description: activity.description,
				type: activity.type,
				status: activity.status,
				dueDate: activity.dueDate || null,
				points: activity.points || null,
				subject: {
					connect: { id: subjectId }
				}
			}
		});

		return mapClassActivity(newActivity);
	}


	async updateStudentProgress(tracking: Omit<ProgressTracking, 'id'>): Promise<ProgressTracking> {
		const progress = await db.progressTracking.upsert({
			where: {
				studentId_subjectId: {
					studentId: tracking.studentId,
					subjectId: tracking.subjectId
				}
			},
			update: {
				progress: tracking.progress as any
			},
			create: {
				studentId: tracking.studentId,
				subjectId: tracking.subjectId,
				progress: tracking.progress as any
			}
		});

		return {
			...progress,
			progress: progress.progress as ProgressTracking['progress']
		};
	}

	async getStudentProgress(studentId: string, subjectId: string): Promise<ProgressTracking | null> {
		const progress = await db.progressTracking.findUnique({
			where: {
				studentId_subjectId: {
					studentId,
					subjectId
				}
			}
		});

		if (progress) {
			return {
				...progress,
				progress: progress.progress as ProgressTracking['progress']
			};
		}

		return null;
	}

	async getAllCourses(): Promise<Course[]> {
		const courses = await db.course.findMany({
			include: {
				subjects: {
					include: {
						teachers: true,
						activities: true
					}
				},
				classGroups: {
					include: {
						calendar: true
					}
				}
			}
		});

		return courses.map(course => {
			const classGroup = course.classGroups[0];
			return {
				id: course.id,
				name: course.name,
				academicYear: course.academicYear,
				subjects: course.subjects.map(s => ({
					id: s.id,
					name: s.name,
					description: s.description || undefined,
					courseStructure: parseCourseStructure(s.courseStructure),
					teachers: s.teachers.map(t => ({
						id: t.id,
						teacherId: t.teacherId,
						subjectId: t.subjectId,
						classId: '',
						isClassTeacher: false,
						assignedAt: new Date(),
						createdAt: new Date(),
						updatedAt: new Date(),
						status: t.status === Status.ACTIVE ? 'ACTIVE' : 'INACTIVE'
					})),
					activities: s.activities.map(mapClassActivity)
				})),
				classGroupId: classGroup?.id || '',
				calendarId: classGroup?.calendar?.id
			};
		});
	}

	// Validation Methods
	async validateCourseStructure(structure: CourseStructure): Promise<boolean> {
		if (!structure.type || !structure.units) {
			return false;
		}

		switch (structure.type) {
			case 'CHAPTER':
				return this.validateChapterStructure(structure);
			case 'BLOCK':
				return this.validateBlockStructure(structure);
			case 'WEEKLY':
				return this.validateWeeklyStructure(structure);
			default:
				return false;
		}
	}

	private validateChapterStructure(structure: CourseStructure): boolean {
		const units = structure.units as Array<{
			chapterNumber: number;
			title: string;
			sections: Array<{
				title: string;
				content: unknown[];
			}>;
		}>;

		return units.every(unit => 
			unit.chapterNumber && 
			unit.title && 
			Array.isArray(unit.sections) &&
			unit.sections.every(section => 
				section.title && 
				Array.isArray(section.content)
			)
		);
	}

	private validateBlockStructure(structure: CourseStructure): boolean {
		const units = structure.units as Array<{
			position: number;
			title: string;
			content: unknown[];
		}>;

		return units.every(unit => 
			typeof unit.position === 'number' && 
			unit.title && 
			Array.isArray(unit.content)
		);
	}

	private validateWeeklyStructure(structure: CourseStructure): boolean {
		const units = structure.units as Array<{
			weekNumber: number;
			startDate: Date;
			endDate: Date;
			dailyActivities: Array<{
				day: number;
				content: unknown[];
			}>;
		}>;

		return units.every(unit => 
			unit.weekNumber && 
			unit.startDate && 
			unit.endDate && 
			Array.isArray(unit.dailyActivities) &&
			unit.dailyActivities.every(daily => 
				typeof daily.day === 'number' && 
				Array.isArray(daily.content)
			)
		);
	}

}