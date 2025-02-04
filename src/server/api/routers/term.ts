import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const termRouter = createTRPCRouter({
	createTerm: protectedProcedure
		.input(z.object({
			name: z.string(),
			calendarId: z.string(),
			startDate: z.date(),
			endDate: z.date(),
			status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.term.create({
				data: input,
				include: {
					calendar: true,
					timetables: true,
				},
			});
		}),

	updateTerm: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.term.update({
				where: { id },
				data,
				include: {
					calendar: true,
					timetables: true,
				},
			});
		}),

	deleteTerm: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.term.delete({
				where: { id: input },
			});
		}),

	getTerm: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.term.findUnique({
				where: { id: input },
				include: {
					calendar: true,
					timetables: {
						include: {
							periods: true,
						},
					},
				},
			});
		}),

	getTermsByCalendar: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.term.findMany({
				where: { calendarId: input },
				include: {
					calendar: true,
					timetables: {
						include: {
							periods: true,
						},
					},
				},
				orderBy: {
					startDate: 'asc',
				},
			});
		}),

	list: protectedProcedure
		.query(({ ctx }) => {
			return ctx.prisma.term.findMany({
				include: {
					calendar: true,
					timetables: {
						include: {
							periods: true,
						},
					},
					gradingPeriods: true,
					weeks: true,
				},
			});
		}),
});