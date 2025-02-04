import { PrismaClient, Status } from '@prisma/client';
import { ClassGroup } from '@prisma/client';

export async function seedSubjects(prisma: PrismaClient, classGroups: ClassGroup[]) {
	console.log('Creating demo subjects...');

	const subjects = await Promise.all([
		prisma.subject.upsert({
			where: { code: 'MATH101' },
			update: {},
			create: {
				name: 'Mathematics',
				code: 'MATH101',
				description: 'Basic Mathematics',
				status: Status.ACTIVE,
				classGroups: {
					connect: [{ id: classGroups[0].id }]
				}
			}
		}),
		prisma.subject.upsert({
			where: { code: 'SCI101' },
			update: {},
			create: {
				name: 'Science',
				code: 'SCI101',
				description: 'General Science',
				status: Status.ACTIVE,
				classGroups: {
					connect: [{ id: classGroups[0].id }]
				}
			}
		}),
		prisma.subject.upsert({
			where: { code: 'ENG101' },
			update: {},
			create: {
				name: 'English',
				code: 'ENG101',
				description: 'English Language Arts',
				status: Status.ACTIVE,
				classGroups: {
					connect: [{ id: classGroups[0].id }]
				}
			}
		})
	]);

	return subjects;
}