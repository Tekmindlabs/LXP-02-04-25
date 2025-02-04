import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const courseSettingsSchema = z.object({
	allowLateSubmissions: z.boolean(),
	gradingScale: z.string(),
	attendanceRequired: z.boolean(),
});

const courseSchema = z.object({
	name: z.string(),
	isTemplate: z.boolean(),
	templateId: z.string().optional(),
	subjects: z.array(z.string()),
	settings: courseSettingsSchema,
});

const calendarSchema = z.object({
	id: z.string(),
	inheritSettings: z.boolean(),
});

export const classGroupRouter = createTRPCRouter({
	createClassGroup: protectedProcedure
		.input(z.object({
			name: z.string(),
			description: z.string().optional(),
			programId: z.string(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
			course: courseSchema,
			calendar: calendarSchema,
		}))
		.mutation(async ({ ctx, input }) => {
			const { course, calendar, ...classGroupData } = input;

			return ctx.prisma.$transaction(async (tx) => {
				// Create course first
				const createdCourse = await tx.course.create({
					data: {
						name: course.name,
						academicYear: new Date().getFullYear().toString(),
						isTemplate: course.isTemplate,
						programId: classGroupData.programId,
						settings: course.settings as Prisma.InputJsonValue,
						subjects: {
							connect: course.subjects.map(id => ({ id }))
						},
						...(course.templateId ? {
							parentCourseId: course.templateId
						} : {})
					}
				});


				// Create class group with course and calendar references
				const classGroup = await tx.classGroup.create({
					data: {
						...classGroupData,
						courseId: createdCourse.id,
						calendarId: calendar.id,
					},
					include: {
						program: true,
						subjects: true,
						classes: true,
						course: true,
						calendar: true,

					},
				});

				// If inheriting calendar settings, copy them
				if (calendar.inheritSettings && classGroup.calendar?.metadata) {
					const calendarMetadata = classGroup.calendar.metadata as Prisma.JsonValue;
					await tx.course.update({
						where: { id: createdCourse.id },
						data: {
							settings: {
								...course.settings,
								...(typeof calendarMetadata === 'object' ? calendarMetadata : {})
							} as Prisma.InputJsonValue
						}
					});
				}



				return classGroup;
			});
		}),

	updateClassGroup: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			description: z.string().optional(),
			programId: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
			course: courseSchema.optional(),
			calendar: calendarSchema.optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, course, calendar, ...data } = input;

			return ctx.prisma.$transaction(async (tx) => {
				const classGroup = await tx.classGroup.findUnique({
					where: { id },
					include: { course: true }
				});

				if (!classGroup) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Class group not found"
					});
				}

				// Update course if provided
				if (course && classGroup.course) {
					await tx.course.update({
						where: { id: classGroup.course.id },
						data: {
							name: course.name,
							isTemplate: course.isTemplate,
							parentCourseId: course.templateId,
							settings: course.settings,
							subjects: {
								set: course.subjects.map(id => ({ id }))
							}
						}
					});
				}

				// Update calendar if provided
				if (calendar) {
					await tx.classGroup.update({
						where: { id },
						data: { calendarId: calendar.id }
					});

					if (calendar.inheritSettings && classGroup.course) {
						const calendarSettings = await tx.calendar.findUnique({
							where: { id: calendar.id },
							select: { metadata: true }
						});

						if (calendar.inheritSettings && calendarSettings?.metadata) {
							const metadata = calendarSettings.metadata as Prisma.JsonValue;
							await tx.course.update({
								where: { id: classGroup.course.id },
								data: {
									settings: {
										...(typeof classGroup.course.settings === 'object' ? classGroup.course.settings : {}),
										...(typeof metadata === 'object' ? metadata : {})
									} as Prisma.InputJsonValue
								}
							});
						}
					}
				}

				// Update class group
				return tx.classGroup.update({
					where: { id },
					data,
					include: {
						program: true,
						subjects: true,
						classes: true,
						course: true,
						calendar: true,
					},
				});
			});
		}),

	deleteClassGroup: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.delete({
				where: { id: input },
			});
		}),

	getClassGroup: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.findUnique({
				where: { id: input },
				include: {
					program: true,
					subjects: true,
					classes: true,
					timetables: true,
				},
			});
		}),

	getAllClassGroups: protectedProcedure
		.input(z.object({
			programId: z.string().optional(),
		}).optional())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.findMany({
				where: input ? { programId: input.programId } : undefined,
				include: {
					program: true,
					subjects: true,
					classes: true,
					calendar: true,
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),

	getByProgramId: protectedProcedure
		.input(z.object({
			programId: z.string().min(1, "Program ID is required")
		}))
		.query(async ({ ctx, input }) => {
			try {
				// First check if program exists
				const program = await ctx.prisma.program.findUnique({
					where: { id: input.programId }
				});

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					});
				}

				const classGroups = await ctx.prisma.classGroup.findMany({
					where: { programId: input.programId },
					include: {
						classes: {
							include: {
								students: true,
								teachers: true,
							},
						},
						program: true,
						subjects: true,
					},
					orderBy: {
						name: 'asc'
					}
				});

				return classGroups;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch class groups",
					cause: error,
				});
			}
		}),

	addSubjectsToClassGroup: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			subjectIds: z.array(z.string()),
		}))
		.mutation(async ({ ctx, input }) => {
			const classGroup = await ctx.prisma.classGroup.update({
				where: { id: input.classGroupId },
				data: {
					subjects: {
						connect: input.subjectIds.map(id => ({ id })),
					},
				},
				include: {
					subjects: true,
				},
			});
			return classGroup;
		}),

	removeSubjectsFromClassGroup: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			subjectIds: z.array(z.string()),
		}))
		.mutation(async ({ ctx, input }) => {
			const classGroup = await ctx.prisma.classGroup.update({
				where: { id: input.classGroupId },
				data: {
					subjects: {
						disconnect: input.subjectIds.map(id => ({ id })),
					},
				},
				include: {
					subjects: true,
				},
			});
			return classGroup;
		}),

	getClassGroupWithDetails: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.findUnique({
				where: { id: input },
				include: {
					program: {
						include: {
							classGroups: {
								include: {
									timetables: {
										include: {
											term: {
												include: {
													calendar: true,
												},
											},
										},
									},
								},
							},
						},
					},
					subjects: true,
					classes: {
						include: {
							students: true,
							teachers: {
								include: {
									teacher: {
										include: {
											user: true,
										},
									},
								},
							},
						},
					},
					timetables: {
						include: {
							term: {
								include: {
									calendar: true,
								},
							},
							periods: {
								include: {
									subject: true,
									classroom: true,
								},
							},
						},
					},
					activities: true,
				},
			});
		}),

	addSubjects: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			subjectIds: z.array(z.string()),
		}))
		.mutation(async ({ ctx, input }) => {
			const { classGroupId, subjectIds } = input;

			// Add subjects to class group
			const classGroup = await ctx.prisma.classGroup.update({
				where: { id: classGroupId },
				data: {
					subjects: {
						connect: subjectIds.map(id => ({ id })),
					},
				},
				include: {
					subjects: true,
				},
			});

			// Inherit subjects to all classes in the group
			const classes = await ctx.prisma.class.findMany({
				where: { classGroupId },
			});

			// Update timetable for each class if needed
			for (const cls of classes) {
				const timetable = await ctx.prisma.timetable.findFirst({
					where: { classId: cls.id }
				});

				if (timetable) {
					await ctx.prisma.period.createMany({
						data: subjectIds.map(subjectId => ({
							timetableId: timetable.id,
							subjectId,
							teacherId: "", // This should be set to a valid teacher ID in production
							startTime: new Date(),
							endTime: new Date(),
							dayOfWeek: 1,
							classroomId: "" // This should be set to a valid classroom ID in production
						}))
					});
				}

			}

			return classGroup;
		}),

	removeSubjects: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			subjectIds: z.array(z.string()),
		}))
		.mutation(async ({ ctx, input }) => {
			const { classGroupId, subjectIds } = input;

			// Remove subjects from class group
			return ctx.prisma.classGroup.update({
				where: { id: classGroupId },
				data: {
					subjects: {
						disconnect: subjectIds.map(id => ({ id })),
					},
				},
				include: {
					subjects: true,
				},
			});
		}),

	inheritCalendar: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			calendarId: z.string(),
			classId: z.string(), // Required for timetable creation
		}))
		.mutation(async ({ ctx, input }) => {
			const { classGroupId, calendarId, classId } = input;

			// Get the calendar and its terms
			const calendar = await ctx.prisma.calendar.findUnique({
				where: { id: calendarId },
				include: {
					terms: true,
				},
			});

			if (!calendar) {
				throw new Error("Calendar not found");
			}

			// Create a timetable for the class group using the first term
			const term = calendar.terms[0];
			if (!term) {
				throw new Error("No terms found in calendar");
			}

			const timetable = await ctx.prisma.timetable.create({
				data: {
					termId: term.id,
					classGroupId,
					classId, // Add required classId
				},
			});

			return ctx.prisma.classGroup.findUnique({
				where: { id: classGroupId },
				include: {
					timetables: {
						include: {
							term: {
								include: {
									calendar: true,
								},
							},
						},
					},
				},
			});
		}),

	list: protectedProcedure
		.query(({ ctx }) => {
			return ctx.prisma.classGroup.findMany({
				include: {
					program: true,
					classes: true,
					subjects: true,
					timetables: {
						include: {
							periods: {
								include: {
									subject: true,
									classroom: true,
								},
							},
						},
					},
					activities: true,
				},
			});
		}),

	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.classGroup.findUnique({
				where: { id: input },
				include: {
					program: true,
					classes: {
						include: {
							timetables: {
								include: {
									periods: {
										include: {
											subject: true,
											classroom: true,
											teacher: {
												include: {
													user: true,
												},
											},
										},
									},
								},
							},
						},
					},
					timetables: {
						include: {
							periods: {
								include: {
									subject: true,
									classroom: true,
									teacher: {
										include: {
											user: true,
										},
									},
								},
							},
						},
					},
					subjects: true,
					activities: true,
				},
			});
		}),

	createTimetable: protectedProcedure
		.input(z.object({
			classGroupId: z.string(),
			termId: z.string(),
			classId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const existingTimetable = await ctx.prisma.timetable.findFirst({
				where: { classGroupId: input.classGroupId },
			});

			if (existingTimetable) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Timetable already exists for this class group",
				});
			}

			return ctx.prisma.timetable.create({
				data: {
					term: { connect: { id: input.termId } },
					classGroup: { connect: { id: input.classGroupId } },
					class: { connect: { id: input.classId } }
				},
				include: {
					periods: {
						include: {
							subject: true,
							classroom: true,
							teacher: {
								include: {
									user: true
								}
							}
						}
					}
				}
			});
		}),
});