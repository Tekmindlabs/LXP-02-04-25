import { CalendarView } from '@/components/dashboard/calendar/CalendarView';
import { prisma } from '@/server/db';
import { CalendarEvent } from '@/types/calendar';

interface PageProps {
	params: {
		role: string;
	};
}

export default async function CalendarPage({ params }: PageProps) {
	const dbEvents = await prisma.calendarEvent.findMany({
		where: {
			level: params.role,
			status: 'ACTIVE',
		},
	});

	const events = dbEvents.map(event => ({
		...event,
		start: event.startDate,
		end: event.endDate,
		description: event.description || undefined,
		type: event.level as 'class' | 'class_group' | 'timetable',
		entityId: event.classGroupId || event.classId || event.calendarId,
		programId: event.programId || undefined,
		classGroupId: event.classGroupId || undefined,
		classId: event.classId || undefined,
	}));

	return (
		<div className="container mx-auto py-6">
			<CalendarView
				entityType={params.role as 'class' | 'class_group' | 'timetable'}
				entityId={params.role}
				events={events}
			/>
		</div>
	);
}