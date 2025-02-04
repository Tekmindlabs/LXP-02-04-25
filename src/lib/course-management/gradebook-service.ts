import { db } from "@/lib/db";
import { 
	ActivitySubmission, 
	GradingResult, 
	DragDropConfig, 
	FillBlanksConfig, 
	WordSearchConfig, 
	FlashcardConfig,
	MultipleChoiceConfig,
	ActivityConfiguration
} from "@/types/class-activity";
import { Prisma } from "@prisma/client";

export class GradebookService {
	static async submitActivity(submission: Omit<ActivitySubmission, 'id'>): Promise<ActivitySubmission> {
		const result = await db.activitySubmission.create({
			data: {
				activityId: submission.activityId,
				studentId: submission.studentId,
				content: submission.content,
				status: 'SUBMITTED',
				submittedAt: new Date(),
			},
    });
    return result as ActivitySubmission;
	}

	static async gradeSubmission(
		submissionId: string,
		gradingResult: GradingResult
	): Promise<ActivitySubmission> {
		const result = await db.activitySubmission.update({
			where: { id: submissionId },
			data: {
				grade: gradingResult.grade,
				feedback: gradingResult.feedback,
				status: 'GRADED',
				gradedBy: gradingResult.gradedBy,
				gradedAt: gradingResult.gradedAt,
			},
    });
    return result as ActivitySubmission;
	}

	static async getSubmissionsByActivity(activityId: string): Promise<ActivitySubmission[]> {
		const results = await db.activitySubmission.findMany({
			where: { activityId },
			orderBy: { submittedAt: 'desc' },
		});
		return results as ActivitySubmission[];

	}

	static async getStudentSubmissions(studentId: string): Promise<ActivitySubmission[]> {
		const results = await db.activitySubmission.findMany({
			where: { studentId },
			include: {
				activity: true,
			},
			orderBy: { submittedAt: 'desc' },
		});
		return results as ActivitySubmission[];
	}

	static async calculateClassAverage(activityId: string): Promise<number | null> {
		const submissions = await db.activitySubmission.findMany({
			where: {
				activityId,
				status: 'GRADED',
			},
			select: { grade: true },
		});

		if (submissions.length === 0) return null;

		const total = submissions.reduce((sum, sub) => sum + (sub.grade ?? 0), 0);

		return total / submissions.length;
	}

	static async autoGradeSubmission(submissionId: string): Promise<ActivitySubmission> {
		const submission = await db.activitySubmission.findUnique({
			where: { id: submissionId },
			include: { activity: true },
		});

		if (!submission) throw new Error('Submission not found');
		const config = submission.activity.configuration as unknown as ActivityConfiguration;
		if (!config?.isGraded) {
			throw new Error('Activity is not gradable');
		}

		let grade = 0;
		switch (submission.activity.type) {
			case 'QUIZ_MULTIPLE_CHOICE':
				grade = this.gradeMultipleChoice(
				  submission.content as { answers: number[] },
				  config as MultipleChoiceConfig
				);
				break;
			case 'QUIZ_DRAG_DROP':
				grade = this.gradeDragDrop(
				  submission.content as { matches: Record<string, string> },
				  config as DragDropConfig
				);
				break;
			case 'QUIZ_FILL_BLANKS':
				grade = this.gradeFillBlanks(
				  submission.content as { answers: Record<string, string> },
				  config as FillBlanksConfig
				);
				break;
			case 'GAME_WORD_SEARCH':
				grade = this.gradeWordSearch(
				  submission.content as { foundWords: string[] },
				  config as WordSearchConfig
				);
				break;
			case 'GAME_FLASHCARDS':
				grade = this.gradeFlashcards(
				  submission.content as { completedCards: number },
				  config as FlashcardConfig
				);
				break;
			default:
				throw new Error('Unsupported activity type for auto-grading');
		}

		return this.gradeSubmission(submissionId, {
			grade,
			gradedBy: 'SYSTEM',
			gradedAt: new Date(),
			feedback: 'Auto-graded by system',
		});
	}

	private static gradeMultipleChoice(
		submission: { answers: number[] },
		configuration: MultipleChoiceConfig
	): number {
		const questions = configuration.questions || [];
		const answers = submission.answers || [];
		const correctAnswers = answers.filter(
			(answer, index) => answer === questions[index]?.correctAnswer
		).length;
		
		return (correctAnswers / questions.length) * 100;
	}

	private static gradeDragDrop(
		submission: { matches: Record<string, string> },
		configuration: DragDropConfig
	): number {
		const correctMatches = Object.entries(submission.matches).reduce((total, [itemId, zoneId]) => {
			const item = configuration.items.find(i => i.draggableId === itemId);
			return total + (item?.correctZoneId === zoneId ? 1 : 0);
		}, 0);
		
		return (correctMatches / configuration.items.length) * 100;
	}

	private static gradeFillBlanks(
		submission: { answers: Record<string, string> },
		configuration: FillBlanksConfig
	): number {
		const correctAnswers = configuration.blanks.reduce((total, blank) => {
			return total + (submission.answers[blank.id]?.toLowerCase() === blank.correctAnswer.toLowerCase() ? 1 : 0);
		}, 0);
		
		return (correctAnswers / configuration.blanks.length) * 100;
	}

	private static gradeWordSearch(
		submission: { foundWords: string[] },
		configuration: WordSearchConfig
	): number {
		return (submission.foundWords.length / configuration.words.length) * 100;
	}

	private static gradeFlashcards(
		submission: { completedCards: number },
		configuration: FlashcardConfig
	): number {
		return (submission.completedCards / configuration.cards.length) * 100;
	}
}