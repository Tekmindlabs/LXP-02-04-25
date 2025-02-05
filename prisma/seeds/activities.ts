import { PrismaClient, ResourceType } from '@prisma/client';
import { Class, Subject } from '@prisma/client';

interface ActivityParams {
	classes: Class[];
	subjects: Subject[];
}

export async function seedActivities(prisma: PrismaClient, params: ActivityParams) {
	console.log('Creating demo class activities...');

	const activities = [
		{
			title: 'Math Multiple Choice Quiz',
			description: 'Test your math knowledge with multiple choice questions',
			type: 'QUIZ_MULTIPLE_CHOICE',
			deadline: new Date('2024-09-15'),
			status: 'PUBLISHED',
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
			title: 'Science Drag and Drop',
			description: 'Match the scientific terms with their definitions',
			type: 'QUIZ_DRAG_DROP',
			deadline: new Date('2024-10-01'),
			status: 'PUBLISHED',
			configuration: {
				pairs: [
					{ term: 'Photosynthesis', definition: 'Process by which plants make food' },
					{ term: 'Mitosis', definition: 'Cell division process' }
				],
				shuffleItems: true
			}
		},
		{
			title: 'History Memory Game',
			description: 'Match historical events with their dates',
			type: 'QUIZ_MEMORY',
			deadline: new Date('2024-10-15'),
			status: 'PUBLISHED',
			configuration: {
				cards: [
					{ id: 1, pair: 'A', content: '1492', matched: false },
					{ id: 2, pair: 'A', content: 'Columbus discovers America', matched: false },
					{ id: 3, pair: 'B', content: '1776', matched: false },
					{ id: 4, pair: 'B', content: 'American Independence', matched: false }
				]
			}
		},
		{
			title: 'English Word Search',
			description: 'Find vocabulary words in the puzzle',
			type: 'GAME_WORD_SEARCH',
			deadline: new Date('2024-11-01'),
			status: 'PUBLISHED',
			configuration: {
				words: ['GRAMMAR', 'VOCABULARY', 'SENTENCE', 'PARAGRAPH'],
				gridSize: 10,
				directions: ['horizontal', 'vertical', 'diagonal']
			}
		}
	];

	const createdActivities = await Promise.all(
		activities.map(activity =>
			prisma.classActivity.upsert({
				where: {
					title_classId: {
						title: activity.title,
						classId: params.classes[0].id
					}
				},
				update: {
					...activity,
					classId: params.classes[0].id,
					subjectId: params.subjects[0].id
				},
				create: {
					...activity,
					classId: params.classes[0].id,
					subjectId: params.subjects[0].id
				}
			})
		)
	);

	// Create resources for each activity
	await Promise.all(
		createdActivities.map(activity =>
			prisma.resource.upsert({
				where: {
					title_activityId: {
						title: `${activity.title} Instructions`,
						activityId: activity.id
					}
				},
				update: {
					type: ResourceType.DOCUMENT,
					url: `https://example.com/activities/${activity.id}/instructions.pdf`
				},
				create: {
					title: `${activity.title} Instructions`,
					type: ResourceType.DOCUMENT,
					url: `https://example.com/activities/${activity.id}/instructions.pdf`,
					activityId: activity.id
				}
			})
		)
	);

	// Add student submissions for the first activity
	const students = await prisma.studentProfile.findMany();
	if (students.length > 0 && createdActivities.length > 0) {
		console.log('Creating activity submissions...');
		await Promise.all(
			students.map(student =>
				prisma.activitySubmission.upsert({
					where: {
						id: `${student.userId}-${createdActivities[0].id}`
					},
					update: {
						status: 'SUBMITTED',
						content: { answers: [{ questionId: 1, answer: '4' }, { questionId: 2, answer: '25' }] }
					},
					create: {
						id: `${student.userId}-${createdActivities[0].id}`,
						studentId: student.userId,
						activityId: createdActivities[0].id,

						status: 'SUBMITTED',
						content: { answers: [{ questionId: 1, answer: '4' }, { questionId: 2, answer: '25' }] }
					}
				})
			)
		);
	}

	return createdActivities;
}
