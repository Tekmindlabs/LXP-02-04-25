import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { courseService } from "../../../lib/course-management/course-service";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import type { CourseStructure, TeacherAssignment, ClassActivity } from "@/types/course-management";

const courseSettingsSchema = z.object({
	allowLateSubmissions: z.boolean(),
	gradingScale: z.string(),
	attendanceRequired: z.boolean(),
});

export const courseRouter = createTRPCRouter({
	createTemplate: protectedProcedure
		.input(z.object({
			name: z.string(),
			programId: z.string(),
			subjects: z.array(z.string()),
			settings: courseSettingsSchema
		}))
		.mutation(async ({ ctx, input }) => {
			const settings = input.settings as Prisma.InputJsonValue;
			return ctx.prisma.course.create({
				data: {
					name: input.name,
					academicYear: new Date().getFullYear().toString(),
					programId: input.programId,
					isTemplate: true,
					settings,
					subjects: {
						connect: input.subjects.map(id => ({ id }))
					}
				},
				include: {
					subjects: true
				}
			});
		}),

	getTemplates: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.prisma.course.findMany({
				where: {
					isTemplate: true
				},
				include: {
					subjects: true
				}
			});
		}),

	getTemplate: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const template = await ctx.prisma.course.findUnique({
				where: {
					id: input,
					isTemplate: true
				},
				include: {
					subjects: {
						include: {
							teacherAssignments: true,
							activities: true
						}
					}
				}

			});

			if (!template) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found"
				});
			}

			return template;
		}),

	createFromTemplate: protectedProcedure
		.input(z.object({
			name: z.string(),
			templateId: z.string(),
			settings: courseSettingsSchema.optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const template = await ctx.prisma.course.findUnique({
				where: { id: input.templateId },
				include: { 
					subjects: true,
					classGroups: true
				}
			});

			if (!template) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found"
				});
			}

			const settings = (input.settings || template.settings) as Prisma.InputJsonValue;

			return ctx.prisma.course.create({
				data: {
					name: input.name,
					academicYear: new Date().getFullYear().toString(),
					programId: template.programId,
					isTemplate: false,
					parentCourseId: template.id,
					settings,
					subjects: {
						connect: template.subjects.map((s: { id: string }) => ({ id: s.id }))
					}
				},
				include: {
					subjects: true,
					parentCourse: true,
					classGroups: true
				}
			});
		}),

	updateSettings: protectedProcedure
		.input(z.object({
			id: z.string(),
			settings: courseSettingsSchema
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.course.update({
				where: { id: input.id },
				data: {
					settings: input.settings as Prisma.InputJsonValue
				}
			});
		}),

	createClassGroupWithCourse: protectedProcedure
		.input(z.object({
			name: z.string(),
			description: z.string().optional(),
			programId: z.string(),
			calendarId: z.string(),
			course: z.object({
				name: z.string(),
				subjects: z.array(z.string()),
				isTemplate: z.boolean().default(false),
				templateId: z.string().optional(),
				settings: courseSettingsSchema
			})
		}))
		.mutation(async ({ input }) => {
			return courseService.createClassGroupWithCourse(input);
		}),

	create: protectedProcedure
		.input(z.object({
			name: z.string(),
			academicYear: z.string(),
			classGroupId: z.string(),
			subjectIds: z.array(z.string())
		}))
		.mutation(async ({ ctx, input }) => {
			const classGroup = await ctx.prisma.classGroup.findUnique({
				where: { id: input.classGroupId },
				include: { program: true }
			});

			if (!classGroup) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Class group not found'
				});
			}

			return ctx.prisma.course.create({
				data: {
					name: input.name,
					academicYear: input.academicYear,
					programId: classGroup.programId,
					classGroups: {
						connect: { id: input.classGroupId }
					},
					subjects: {
						connect: input.subjectIds.map(id => ({ id }))
					}
				},
				include: {
					subjects: true,
					classGroups: {
						include: {
							calendar: true
						}
					}
				}
			});
		}),

	getAllCourses: protectedProcedure
		.query(async ({ ctx }) => {
			const courses = await ctx.prisma.course.findMany({
				include: {
					subjects: {
						include: {
							teacherAssignments: true,
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

			return courses.map((course) => ({
				id: course.id,
				name: course.name,
				subjects: course.subjects.map((subject: { 
					id: string; 
					name: string; 
					description: string | null; 
					courseStructure: Prisma.JsonValue | null;
					teacherAssignments: {
						id: string;
						teacherId: string;
						subjectId: string;
						classId: string;
						isClassTeacher: boolean;
						assignedAt: Date;
					}[];
					activities: {
						id: string;
						type: string;
						title: string;
						description: string;
						dueDate: Date | null;
						points: number | null;
						status: string;
					}[];
				}) => ({
					id: subject.id,
					name: subject.name,
					description: subject.description || undefined,
					courseStructure: (subject.courseStructure as unknown) as CourseStructure,
					teachers: subject.teacherAssignments.map((teacher) => ({
						id: teacher.id,
						teacherId: teacher.teacherId,
						subjectId: teacher.subjectId,
						classId: teacher.classId,
						isClassTeacher: teacher.isClassTeacher,
						assignedAt: teacher.assignedAt,
						createdAt: teacher.assignedAt,
						updatedAt: teacher.assignedAt,
						status: 'ACTIVE' as const
					})) satisfies TeacherAssignment[],
					activities: subject.activities.map((activity) => ({
						id: activity.id,
						type: activity.type as 'ASSIGNMENT' | 'QUIZ' | 'PROJECT' | 'DISCUSSION' | 'EXAM',
						title: activity.title,
						description: activity.description,
						dueDate: activity.dueDate || undefined,
						points: activity.points || undefined,
						status: activity.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
					})) satisfies ClassActivity[]
				})),
				academicYear: course.academicYear,
				classGroupId: course.classGroups[0]?.id || '',
				calendarId: course.classGroups[0]?.calendar?.id
			}));
		})
});