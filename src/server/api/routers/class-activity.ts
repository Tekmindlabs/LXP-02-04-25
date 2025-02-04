import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ActivityType, ResourceType, Status } from "@prisma/client";

export const classActivityRouter = createTRPCRouter({
	create: protectedProcedure
		.input(z.object({
			title: z.string(),
			description: z.string().optional(),
			type: z.nativeEnum(ActivityType),
			classId: z.string(),
			deadline: z.date().optional(),
			gradingCriteria: z.string().optional(),
			resources: z.array(z.object({
				title: z.string(),
				type: z.nativeEnum(ResourceType),
				url: z.string()
			})).optional()
		}))

		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.classActivity.create({
				data: {
					...input,
					resources: {
						create: input.resources
					}
				},
				include: {
					resources: true
				}
			});
		}),

	getAll: protectedProcedure
		.input(z.object({
			classId: z.string().optional(),
			search: z.string().optional(),
			type: z.nativeEnum(ActivityType).optional(),
			classGroupId: z.string().optional()
		}))
		.query(async ({ ctx, input }) => {
			const { search, type, classId, classGroupId } = input;
			return ctx.prisma.classActivity.findMany({
				where: {
					...(classId && { classId }),
					...(type && { type }),
					...(classGroupId && { classGroupId }),
					...(search && {
						OR: [
							{ title: { contains: search, mode: 'insensitive' } },
							{ description: { contains: search, mode: 'insensitive' } },
						],
					}),
				},
				include: {
					class: true,
					classGroup: true,
					resources: true,
					submissions: {
						include: {
							student: {
								include: {
									user: true
								}
							}
						}
					}
				},
				orderBy: {
					createdAt: 'desc'
				}
			});
		}),

	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.classActivity.findUnique({
				where: { id: input },
				include: {
					resources: true,
					submissions: {
						include: {
							student: true
						}
					}
				}
			});
		}),

	update: protectedProcedure
		.input(z.object({
			id: z.string(),
			title: z.string(),
			description: z.string().optional(),
			type: z.nativeEnum(ActivityType),
			classId: z.string(),
			deadline: z.date().optional(),
			gradingCriteria: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.classActivity.update({
				where: { id },
				data,
				include: {
					resources: true
				}
			});
		}),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.classActivity.delete({
				where: { id: input }
			});
		}),

	submitActivity: protectedProcedure
		.input(z.object({
			activityId: z.string(),
			studentId: z.string(),
			submission: z.string().optional(),
			status: z.enum(["PENDING", "SUBMITTED", "GRADED", "LATE", "MISSED"])
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.studentActivity.create({
				data: {
					activity: { connect: { id: input.activityId } },
					student: { connect: { id: input.studentId } },
					status: input.status,
					submissionDate: new Date()
				}
			});
		}),

	gradeSubmission: protectedProcedure
		.input(z.object({
			submissionId: z.string(),
			grade: z.number(),
			feedback: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.studentActivity.update({
				where: { id: input.submissionId },
				data: {
					grade: input.grade,
					feedback: input.feedback,
					status: "GRADED"
				}
			});
		})
});
