import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ActivityTemplate, ActivityType, ActivityConfiguration } from "@/types/class-activity";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activityFormSchema = z.object({
	title: z.string().min(3, "Title must be at least 3 characters"),
	description: z.string().optional(),
	timeLimit: z.number().min(0).optional(),
	attempts: z.number().min(1).optional(),
	passingScore: z.number().min(0).max(100).optional(),
	instructions: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

interface ActivityCreationFormProps {
	template: ActivityTemplate;
	onSubmit: (values: ActivityFormValues) => void;
	onCancel: () => void;
}

export function ActivityCreationForm({ template, onSubmit, onCancel }: ActivityCreationFormProps) {
	const form = useForm<ActivityFormValues>({
		resolver: zodResolver(activityFormSchema),
		defaultValues: {
			title: template.title,
			description: template.description,
			timeLimit: template.configuration.timeLimit,
			attempts: template.configuration.attempts,
			passingScore: template.configuration.passingScore,
			instructions: template.configuration.instructions,
		},
	});

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>Configure Activity</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="timeLimit"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Time Limit (seconds)</FormLabel>
										<FormControl>
											<Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="attempts"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Attempts Allowed</FormLabel>
										<FormControl>
											<Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="passingScore"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Passing Score (%)</FormLabel>
									<FormControl>
										<Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="instructions"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Instructions</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end space-x-2">
							<Button type="button" variant="outline" onClick={onCancel}>
								Cancel
							</Button>
							<Button type="submit">Create Activity</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}