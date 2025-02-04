import { PrismaClient, ResourceType } from '@prisma/client';
import { Class, Subject } from '@prisma/client';

interface ActivityParams {
	classes: Class[];
	subjects: Subject[];
}

export async function seedActivities(prisma: PrismaClient, params: ActivityParams) {
	console.log('Creating demo class activities...');

	// Create Math Quiz activity
	const mathQuiz = await prisma.classActivity.upsert({
		where: {
			title_classId: {
				title: 'Math Quiz 1',
				classId: params.classes[0].id
			}
		},
		update: {
			description: 'First quarter math assessment',
			type: 'QUIZ',
			dueDate: new Date('2024-09-15'),
			points: 100,
			status: 'PUBLISHED',
			subjectId: params.subjects[0].id
		},
		create: {
			title: 'Math Quiz 1',
			description: 'First quarter math assessment',
			type: 'QUIZ',
			classId: params.classes[0].id,
			dueDate: new Date('2024-09-15'),
			points: 100,
			status: 'PUBLISHED',
			subjectId: params.subjects[0].id
		}
	});

	// Create quiz resource
	await prisma.resource.upsert({
		where: {
			title_activityId: {
				title: 'Quiz Instructions',
				activityId: mathQuiz.id
			}
		},
		update: {
			type: ResourceType.DOCUMENT,
			url: 'https://example.com/quiz1.pdf'
		},
		create: {
			title: 'Quiz Instructions',
			type: ResourceType.DOCUMENT,
			url: 'https://example.com/quiz1.pdf',
			activityId: mathQuiz.id
		}
	});

	// Create Science Project activity
	const scienceProject = await prisma.classActivity.upsert({
		where: {
			title_classId: {
				title: 'Science Project',
				classId: params.classes[0].id
			}
		},
		update: {
			description: 'Group research project',
			type: 'PROJECT',
			dueDate: new Date('2024-10-30'),
			points: 200,
			status: 'PUBLISHED',
			subjectId: params.subjects[1].id
		},
		create: {
			title: 'Science Project',
			description: 'Group research project',
			type: 'PROJECT',
			classId: params.classes[0].id,
			dueDate: new Date('2024-10-30'),
			points: 200,
			status: 'PUBLISHED',
			subjectId: params.subjects[1].id
		}
	});

	// Create project resources
	await Promise.all([
		prisma.resource.upsert({
			where: {
				title_activityId: {
					title: 'Project Guidelines',
					activityId: scienceProject.id
				}
			},
			update: {
				type: ResourceType.DOCUMENT,
				url: 'https://example.com/project-guide.pdf'
			},
			create: {
				title: 'Project Guidelines',
				type: ResourceType.DOCUMENT,
				url: 'https://example.com/project-guide.pdf',
				activityId: scienceProject.id
			}
		}),
		prisma.resource.upsert({
			where: {
				title_activityId: {
					title: 'Reference Material',
					activityId: scienceProject.id
				}
			},
			update: {
				type: ResourceType.LINK,
				url: 'https://example.com/references'
			},
			create: {
				title: 'Reference Material',
				type: ResourceType.LINK,
				url: 'https://example.com/references',
				activityId: scienceProject.id
			}
		})
	]);

	// Add student assignments
	const students = await prisma.studentProfile.findMany();
	if (students.length > 0) {
		console.log('Creating student assignments...');
		await Promise.all(
			students.map(student =>
				prisma.studentActivity.upsert({
					where: {
						studentId_activityId: {
							studentId: student.id,
							activityId: mathQuiz.id
						}
					},
					update: {
						status: 'PENDING'
					},
					create: {
						studentId: student.id,
						activityId: mathQuiz.id,
						status: 'PENDING'
					}
				})
			)
		);
	}

	return { mathQuiz, scienceProject };
}