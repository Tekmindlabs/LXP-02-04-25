import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { ClassActivity, ActivitySubmission, User } from "@prisma/client";

interface ActivityWithSubmissions extends ClassActivity {
	submissions: (ActivitySubmission & {
		student: User;
	})[];
}

export const gradebookRouter = createTRPCRouter({
	getGradebook: protectedProcedure
		.input(z.object({
			courseId: z.string(),
			classId: z.string(),
			type: z.enum(['class', 'subject'])
		}))
		.query(async ({ ctx, input }) => {
			const { courseId, classId, type } = input;
			
			// Get all activities and submissions for the class
			const activities = await ctx.prisma.classActivity.findMany({
				where: {
					classId,
					subjectId: courseId,
				},
				include: {
					submissions: {
						include: {
							student: true,
						},
					},
				},
			}) as ActivityWithSubmissions[];

			// Get all students in the class
			const students = await ctx.prisma.studentProfile.findMany({
				where: {
					classId,
				},
				include: {
					user: true,
				},
			});


			// Calculate grade distribution and statistics
			const grades = activities.flatMap((activity: ActivityWithSubmissions) =>
				activity.submissions.map((sub) => sub.grade ?? 0)
			);

			const overview = {
				classAverage: grades.length ? grades.reduce((a: number, b: number) => a + b) / grades.length : 0,
				highestGrade: grades.length ? Math.max(...grades) : 0,
				lowestGrade: grades.length ? Math.min(...grades) : 0,
				totalStudents: students.length,
				distribution: calculateGradeDistribution(grades),
			};

			return {
				overview,
				activities: activities.map((activity: ActivityWithSubmissions) => ({
					id: activity.id,
					title: activity.title,
					deadline: activity.deadline,
					submissions: activity.submissions.map((sub) => ({

						studentId: sub.studentId,
						studentName: sub.student.name,
						grade: sub.grade,
						submitted: sub.status === 'SUBMITTED',
					})),
				})),
				studentGrades: students.map((student) => ({
					studentId: student.userId,
					studentName: student.user.name,
					overallGrade: calculateOverallGrade(student.userId, activities),
					activityGrades: activities.map((activity: ActivityWithSubmissions) => ({
						activityId: activity.id,
						activityName: activity.title,
						grade: activity.submissions.find((sub) => sub.studentId === student.id)?.grade ?? 0,

					})),
				})),
			};
		}),

	gradeActivity: protectedProcedure
		.input(z.object({
			activityId: z.string(),
			studentId: z.string(),
			grade: z.number().min(0),
			feedback: z.string().optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { activityId, studentId, grade, feedback } = input;

			const existingSubmission = await ctx.prisma.activitySubmission.findFirst({
				where: {
					activityId,
					studentId,
				},
			});

			if (existingSubmission) {
				return ctx.prisma.activitySubmission.update({
					where: { id: existingSubmission.id },
					data: {
						grade,
						feedback,
						status: 'GRADED',
						gradedAt: new Date(),
						gradedBy: ctx.session.user.id,
					},
				});
			}

			return ctx.prisma.activitySubmission.create({
				data: {
					activityId,
					studentId,
					grade,
					feedback,
					status: 'GRADED',
					gradedAt: new Date(),
					gradedBy: ctx.session.user.id,
					content: {},
				},
			});
		}),
});

function calculateGradeDistribution(grades: number[]): Record<string, number> {
	return grades.reduce((acc: Record<string, number>, grade: number) => {
		if (grade >= 90) acc.A = (acc.A || 0) + 1;
		else if (grade >= 80) acc.B = (acc.B || 0) + 1;
		else if (grade >= 70) acc.C = (acc.C || 0) + 1;
		else if (grade >= 60) acc.D = (acc.D || 0) + 1;
		else acc.F = (acc.F || 0) + 1;
		return acc;
	}, {} as Record<string, number>);
}

function calculateOverallGrade(studentId: string, activities: ActivityWithSubmissions[]): number {
	const grades = activities.flatMap(activity =>
		activity.submissions
			.filter((sub) => sub.studentId === studentId)
			.map((sub) => sub.grade ?? 0)
	);

	return grades.length ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0;

}