import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { courseService } from "../../../lib/course-management/course-service";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

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
		})
});