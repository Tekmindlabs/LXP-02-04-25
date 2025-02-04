import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { courseService } from "../../../lib/course-management/course-service";
import { TRPCError } from "@trpc/server";
import { Prisma, Status } from "@prisma/client";
import type { CourseStructure, ClassActivity } from "@/types/course-management";

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
					subjects: true
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
				include: { subjects: true }
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
						connect: template.subjects.map(s => ({ id: s.id }))
					}
				},
				include: {
					subjects: true,
					parentCourse: true
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
							teacherAssignments: {
								include: {
									teacher: true
								}
							},
							activities: true,
							courseStructure: true
						}
					},
					classGroups: {
						include: {
							calendar: true
						}
					}
				}
			});

			return courses.map(course => ({
				id: course.id,
				name: course.name,
				subjects: course.subjects.map(s => ({
					id: s.id,
					name: s.name,
					description: s.description || undefined,
					courseStructure: s.courseStructure as CourseStructure,
					teachers: s.teacherAssignments.map(t => ({
						id: t.id,
						teacherId: t.teacherId,
						subjectId: t.subjectId,
						classId: t.classId,
						isClassTeacher: t.isClassTeacher,
						assignedAt: t.assignedAt,
						createdAt: t.assignedAt, // Use assignedAt for both since TeacherAssignment doesn't have its own createdAt
						updatedAt: t.assignedAt, // Use assignedAt for updatedAt as well
						status: 'ACTIVE' // Default to ACTIVE since TeacherAssignment doesn't track status
					})),
					activities: s.activities.map(a => ({
						id: a.id,
						type: a.type as ClassActivity['type'],
						title: a.title,
						description: a.description,
						dueDate: a.dueDate || undefined,
						points: a.points || undefined,
						status: a.status as ClassActivity['status']
					}))
				})),
				academicYear: course.academicYear,
				classGroupId: course.classGroups[0]?.id || '',
				calendarId: course.classGroups[0]?.calendar?.id
			}));
		})
});