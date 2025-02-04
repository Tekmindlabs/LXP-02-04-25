"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationList from "./NotificationList";
import CreateNotification from "./CreateNotification";

export default function NotificationDashboard() {
	const [isCreating, setIsCreating] = useState(false);
	const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
	const [type, setType] = useState<"ANNOUNCEMENT" | "ASSIGNMENT" | "GRADE" | "REMINDER" | "SYSTEM" | undefined>();
	const [view, setView] = useState<"SENT" | "RECEIVED">("RECEIVED");

	const { data: notifications, isLoading } = api.notification.getAll.useQuery({
		type: view,
		filters: {
			type,
			startDate: dateRange?.from,
			endDate: dateRange?.to,
		},
	});

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Notifications</CardTitle>
						<Button onClick={() => setIsCreating(true)} disabled={isCreating}>
							Create Notification
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{isCreating ? (
						<CreateNotification onCancel={() => setIsCreating(false)} />
					) : (
						<>
							<div className="mb-4 flex items-center gap-4">
								<DatePickerWithRange
									value={dateRange}
									onChange={setDateRange}
								/>
								<Select
									value={type || "all"}
									onValueChange={(value) => setType(value === "all" ? undefined : value as any)}
								>
									<option value="all">All Types</option>
									<option value="ANNOUNCEMENT">Announcements</option>
									<option value="ASSIGNMENT">Assignments</option>
									<option value="GRADE">Grades</option>
									<option value="REMINDER">Reminders</option>
									<option value="SYSTEM">System</option>
								</Select>
							</div>

							<Tabs value={view} onValueChange={(v) => setView(v as "SENT" | "RECEIVED")}>
								<TabsList>
									<TabsTrigger value="RECEIVED">Received</TabsTrigger>
									<TabsTrigger value="SENT">Sent</TabsTrigger>
								</TabsList>
								<TabsContent value="RECEIVED">
									<ScrollArea className="h-[600px]">
										<NotificationList 
											notifications={notifications || []}
											type={view}
										/>
									</ScrollArea>
								</TabsContent>
								<TabsContent value="SENT">
									<ScrollArea className="h-[600px]">
										<NotificationList 
											notifications={notifications || []}
											type={view}
										/>
									</ScrollArea>
								</TabsContent>
							</Tabs>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}