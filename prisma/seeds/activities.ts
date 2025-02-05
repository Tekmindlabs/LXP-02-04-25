import { PrismaClient, ResourceType, ClassActivity, Prisma } from '@prisma/client';
import { Class, Subject, ClassGroup } from '@prisma/client';

interface ActivityParams {
	classes: Class[];
	subjects: Subject[];
	classGroups: ClassGroup[];
}

interface ActivityInput {
	title: string;
	description: string | null;
	type: string;
	status: string;
	deadline: Date | null;
	classId?: string | null;
	classGroupId?: string | null;
	subjectId: string;
	configuration: Prisma.InputJsonValue;
}


export async function seedActivities(prisma: PrismaClient, params: ActivityParams) {
	console.log('Creating demo class activities...');

	const classNames = ['Grade 1-A', 'Grade 7-A', 'Grade 10-A'];
	const createdActivities: ClassActivity[] = [];

	for (const className of classNames) {
		const class_ = await prisma.class.findFirst({
			where: { name: className }
		});

		if (!class_) continue;

		const activities: ActivityInput[] = [
			{
				title: `Math Quiz - ${className}`,
				description: 'Test your math knowledge with multiple choice questions',
				type: 'QUIZ_MULTIPLE_CHOICE',
				deadline: new Date('2024-09-15'),
				status: 'PUBLISHED',
				classGroupId: class_.classGroupId,
				subjectId: params.subjects[0]?.id ?? '',
				configuration: {
					questions: [
						{
							question: 'What is 2 + 2?',
							options: ['3', '4', '5', '6'],
							correctAnswer: '4'
						},
						{
							question: 'What is 5 × 5?',
							options: ['15', '20', '25', '30'],
							correctAnswer: '25'
						}
					],
					timeLimit: 30,
					passingScore: 70
				}
			},
			{
				title: `Science Project - ${className}`,
				description: 'Research and present a scientific topic',
				type: 'PROJECT',
				deadline: new Date('2024-10-30'),
				status: 'PUBLISHED',
				classGroupId: class_.classGroupId,
				subjectId: params.subjects[0]?.id ?? '',
				configuration: {
					requirements: [
						'Research paper (2000 words)',
						'Presentation slides',
						'Oral presentation (15 minutes)'
					],
					rubric: {
						research: 40,
						presentation: 30,
						delivery: 30
					}
				}
			}
		];

		for (const activity of activities) {
			const created = await prisma.classActivity.upsert({
				where: {
					title_classId: {
						title: activity.title,
						classId: class_.id
					}
				},
				update: {
					...activity,
					classId: class_.id,
					subjectId: params.subjects[0]?.id,
				},
				create: {
					...activity,
					classId: class_.id,
					subjectId: params.subjects[0]?.id,
					resources: {
						create: {
							title: `${activity.title} Instructions`,
							type: ResourceType.DOCUMENT,
							url: `https://example.com/activities/${activity.title}/instructions.pdf`
						}
					}
				}
			});
			createdActivities.push(created);
		}
	}

	// Add student submissions
	const students = await prisma.studentProfile.findMany();
	if (students.length > 0 && createdActivities.length > 0) {
		console.log('Creating activity submissions...');
		
		// Get existing submissions to avoid duplicates
		const existingSubmissions = await prisma.activitySubmission.findMany({
			where: {
				activityId: createdActivities[0].id,
				studentId: {
					in: students.map(s => s.userId)
				}
			},
			select: {
				studentId: true
			}
		});

		const existingStudentIds = new Set(existingSubmissions.map(s => s.studentId));
		const studentsToProcess = students.filter(s => !existingStudentIds.has(s.userId));

		await Promise.all(
			studentsToProcess.map(student =>
				prisma.activitySubmission.create({
					data: {
						studentId: student.userId,
						activityId: createdActivities[0].id,
						status: 'SUBMITTED',
						content: { 
							answers: [
								{ questionId: 1, answer: '4' }, 
								{ questionId: 2, answer: '25' }
							] 
						}
					}
				})
			)
		);
	}

	return createdActivities;
}

