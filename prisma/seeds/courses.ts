import { PrismaClient } from '@prisma/client';

export async function seedCourses(prisma: PrismaClient) {
	const program = await prisma.program.findFirst();
	if (!program) return;

	const courses = [
		{
			name: 'Foundation Year 2025',
			academicYear: '2025',
			programId: program.id,
			isTemplate: false,
		},
		{
			name: 'Advanced Studies 2025',
			academicYear: '2025',
			programId: program.id,
			isTemplate: false,
		},
		{
			name: 'Specialized Track 2025',
			academicYear: '2025',
			programId: program.id,
			isTemplate: true,
		}
	];

	for (const course of courses) {
		await prisma.course.create({
			data: course
		});
	}
}