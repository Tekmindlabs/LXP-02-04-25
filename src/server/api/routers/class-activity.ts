import { ResourceType } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";

const ActivityTypes = {
	QUIZ_MULTIPLE_CHOICE: 'QUIZ_MULTIPLE_CHOICE',
	QUIZ_DRAG_DROP: 'QUIZ_DRAG_DROP',
	QUIZ_FILL_BLANKS: 'QUIZ_FILL_BLANKS',
	QUIZ_MEMORY: 'QUIZ_MEMORY',
	QUIZ_TRUE_FALSE: 'QUIZ_TRUE_FALSE',
	GAME_WORD_SEARCH: 'GAME_WORD_SEARCH',
	GAME_CROSSWORD: 'GAME_CROSSWORD',
	GAME_FLASHCARDS: 'GAME_FLASHCARDS',
	QUIZ: 'QUIZ',
	ASSIGNMENT: 'ASSIGNMENT',
	READING: 'READING',
	PROJECT: 'PROJECT',
	EXAM: 'EXAM'
} as const;

type ActivityType = typeof ActivityTypes[keyof typeof ActivityTypes];

export const classActivityRouter = createTRPCRouter({
	create: protectedProcedure
		.input(z.object({
			title: z.string(),
			description: z.string().optional(),
			type: z.enum(Object.values(ActivityTypes) as [ActivityType, ...ActivityType[]]),
			classId: z.string(),
			subjectId: z.string(),
			deadline: z.date().optional(),
			gradingCriteria: z.string().optional(),
			resources: z.array(z.object({
				title: z.string(),
				type: z.nativeEnum(ResourceType),
				url: z.string()
			})).optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const { resources, ...activityData } = input;
			return ctx.prisma.classActivity.create({
				data: {
					...activityData,
					status: 'PUBLISHED',
					...(resources && {
						resources: {
							create: resources
						}
					})
				},
				include: {
					resources: true,
					class: {
						select: {
							name: true
						}
					},
					classGroup: {
						select: {
							name: true
						}
					}
				}
			});
		}),

	getAll: protectedProcedure
		.input(z.object({
			classId: z.string().optional(),
			search: z.string().optional(),
			type: z.enum(Object.values(ActivityTypes) as [ActivityType, ...ActivityType[]]).optional(),
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
					resources: true,
					class: {
						select: {
							name: true
						}
					},
					classGroup: {
						select: {
							name: true
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
					class: {
						select: {
							name: true
						}
					},
					classGroup: {
						select: {
							name: true
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
			type: z.enum(Object.values(ActivityTypes) as [ActivityType, ...ActivityType[]]),
			classId: z.string(),
			subjectId: z.string(),
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
			content: z.any(),
			status: z.enum(['PENDING', 'SUBMITTED', 'GRADED', 'LATE', 'MISSED'])
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.activitySubmission.create({
				data: {
					activity: { connect: { id: input.activityId } },
					student: { connect: { id: input.studentId } },
					status: input.status,
					content: input.content,
					submittedAt: new Date()
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
			return ctx.prisma.activitySubmission.update({
				where: { id: input.submissionId },
				data: {
					grade: input.grade,
					feedback: input.feedback,
					status: 'GRADED',
					gradedAt: new Date()
				}
			});
		})
});