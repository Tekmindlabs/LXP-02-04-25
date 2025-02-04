import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";
import { format } from "date-fns";

interface ClassCalendarProps {
	classId: string;
	courseId: string;
}

export const ClassCalendar: React.FC<ClassCalendarProps> = ({ classId, courseId }) => {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [isAddEventOpen, setIsAddEventOpen] = useState(false);
	const [newEvent, setNewEvent] = useState({
		title: "",
		description: "",
		startDate: new Date(),
		endDate: new Date(),
	});

	const { data: events, refetch } = api.calendar.getEventsByDateRange.useQuery({
		startDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
		endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0),
		level: "CLASS",
		entityId: classId,
	});

	const createEventMutation = api.calendar.createEvent.useMutation({
		onSuccess: () => {
			refetch();
			setIsAddEventOpen(false);
			setNewEvent({
				title: "",
				description: "",
				startDate: new Date(),
				endDate: new Date(),
			});
		},
	});

	const handleCreateEvent = async () => {
		await createEventMutation.mutate({
			...newEvent,
			level: "CLASS",
			entityId: classId,
		});
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Class Calendar</CardTitle>
				<Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
					<DialogTrigger asChild>
						<Button>Add Event</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add New Event</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<Input
								placeholder="Event Title"
								value={newEvent.title}
								onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
							/>
							<Textarea
								placeholder="Event Description"
								value={newEvent.description}
								onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
							/>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label>Start Date</label>
									<Input
										type="datetime-local"
										value={format(newEvent.startDate, "yyyy-MM-dd'T'HH:mm")}
										onChange={(e) => setNewEvent({ ...newEvent, startDate: new Date(e.target.value) })}
									/>
								</div>
								<div>
									<label>End Date</label>
									<Input
										type="datetime-local"
										value={format(newEvent.endDate, "yyyy-MM-dd'T'HH:mm")}
										onChange={(e) => setNewEvent({ ...newEvent, endDate: new Date(e.target.value) })}
									/>
								</div>
							</div>
							<Button onClick={handleCreateEvent}>Create Event</Button>
						</div>
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={(date) => date && setSelectedDate(date)}
						className="rounded-md border"
					/>
					<div className="space-y-4">
						<h3 className="font-medium">Events for {format(selectedDate, "MMMM d, yyyy")}</h3>
						<div className="space-y-2">
							{events?.map((event) => (
								<Card key={event.id}>
									<CardContent className="p-4">
										<h4 className="font-medium">{event.title}</h4>
										<p className="text-sm text-muted-foreground">{event.description}</p>
										<div className="text-sm mt-2">
											{format(new Date(event.startDate), "MMM d, yyyy h:mm a")} -{" "}
											{format(new Date(event.endDate), "h:mm a")}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};