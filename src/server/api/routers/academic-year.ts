import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";

export const academicYearRouter = createTRPCRouter({
	getSettings: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.prisma.academic_year_settings.findFirst();
		}),

	updateSettings: protectedProcedure
		.input(z.object({
			startMonth: z.number().min(1).max(12),
			startDay: z.number().min(1).max(31),
			endMonth: z.number().min(1).max(12),
			endDay: z.number().min(1).max(31),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.academic_year_settings.upsert({
				where: {
					id: "settings"
				},
				create: input,
				update: input,
			});
		}),

	createAcademicYear: protectedProcedure
		.input(z.object({
			name: z.string(),
			startDate: z.date(),
			endDate: z.date(),
			status: z.nativeEnum(Status).default(Status.ACTIVE),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.academic_years.create({
				data: input,
			});
		}),

	getAllAcademicYears: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.prisma.academic_years.findMany({
				include: {
					calendars: true,
				},
				orderBy: {
					startDate: 'desc',
				},
			});
		}),
});