import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Prisma } from "@prisma/client";

const ActivityTypeEnum = [
	'QUIZ_MULTIPLE_CHOICE',
	'QUIZ_DRAG_DROP',
	'QUIZ_FILL_BLANKS',
	'GAME_WORD_SEARCH',
	'VIDEO_YOUTUBE',
	'READING'
] as const;

const ActivityStatusEnum = [
	'DRAFT',
	'PUBLISHED',
	'PENDING',
	'SUBMITTED',
	'GRADED',
	'LATE',
	'MISSED'
] as const;

const activityInput = z.object({
	title: z.string(),
	description: z.string().optional(),
	type: z.enum(ActivityTypeEnum),
	status: z.enum(ActivityStatusEnum),
	deadline: z.date().optional(),
	classId: z.string().optional(),
	classGroupId: z.string().optional(),
	subjectId: z.string(), // Required subjectId
	configuration: z.record(z.any()),
	resources: z.array(z.object({
		title: z.string(),
		type: z.enum(['DOCUMENT', 'VIDEO', 'AUDIO', 'LINK', 'IMAGE'] as const),
		url: z.string()
	})).optional()
});

export const classActivityRouter = createTRPCRouter({
	create: protectedProcedure
		.input(activityInput)
		.mutation(async ({ ctx, input }) => {
		  const { resources, ...activityData } = input;
		  const data: Prisma.ClassActivityCreateInput = {
			...activityData,
			subject: {
				connect: { id: input.subjectId }
			},
			...(resources && {
			  resources: {
				create: resources.map(r => ({
					title: r.title,
					type: r.type,
					url: r.url
				}))
			  }
			})
		  };
		  return ctx.prisma.classActivity.create({
			data,
			include: {
			  resources: true,
			  subject: true,
			  submissions: {
				include: {
				  student: {
					include: {
					  studentProfile: true
					}
				  }
				}
			  }
			}
		  });
		}),

	getAll: protectedProcedure
		.input(z.object({
			classId: z.string().optional(),
			search: z.string().optional(),
			type: z.enum(ActivityTypeEnum).optional(),
			classGroupId: z.string().optional(),
			status: z.enum(ActivityStatusEnum).optional()
		}))
		.query(async ({ ctx, input }) => {
			const { search, type, classId, classGroupId, status } = input;
			const where: Prisma.ClassActivityWhereInput = {
				...(classId && { classId }),
				...(type && { type }),
				...(classGroupId && { classGroupId }),
				...(status && { status }),
				...(search && {
					OR: [
						{ title: { contains: search, mode: 'insensitive' } },
						{ description: { contains: search, mode: 'insensitive' } },
					],
				})
			};

			return ctx.prisma.classActivity.findMany({
				where,
				include: {
					class: true,
					classGroup: true,
					resources: true,
					submissions: {
						include: {
							student: {
								include: {
									studentProfile: true
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
			...activityInput.shape
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, resources, ...data } = input;
			const updateData: Prisma.ClassActivityUpdateInput = {
				...data,
				...(resources && {
					resources: {
						deleteMany: {},
						create: resources.map(r => ({
							title: r.title,
							type: r.type,
							url: r.url
						}))
					}
				})
			};

			return ctx.prisma.classActivity.update({
				where: { id },
				data: updateData,
				include: {
					resources: true,
					submissions: true
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



});
