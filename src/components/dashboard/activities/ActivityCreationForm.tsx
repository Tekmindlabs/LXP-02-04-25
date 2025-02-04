import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ActivityConfiguration, ActivityType } from "@/types/class-activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const activityFormSchema = z.object({
	title: z.string().min(3, "Title must be at least 3 characters"),
	description: z.string().optional(),
	type: z.custom<ActivityType>(),
	configuration: z.object({
		timeLimit: z.number().min(0).optional(),
		attempts: z.number().min(1).optional(),
		passingScore: z.number().min(0).max(100).optional(),
		instructions: z.string().optional(),
		availabilityDate: z.date().optional(),
		deadline: z.date().optional(),
		isGraded: z.boolean(),
		totalPoints: z.number().min(0).optional(),
		gradingType: z.enum(['AUTOMATIC', 'MANUAL', 'NONE']),
		viewType: z.enum(['PREVIEW', 'STUDENT', 'CONFIGURATION'])
	})
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

interface ActivityCreationFormProps {
	onSubmit: (values: ActivityFormValues) => void;
	onCancel: () => void;
	initialValues?: Partial<ActivityFormValues>;
}

export function ActivityCreationForm({ onSubmit, onCancel, initialValues }: ActivityCreationFormProps) {
	const form = useForm<ActivityFormValues>({
		resolver: zodResolver(activityFormSchema),
		defaultValues: initialValues || {
			configuration: {
				isGraded: false,
				gradingType: 'NONE',
				viewType: 'CONFIGURATION'
			}
		}
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create Activity</CardTitle>
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

						<FormField
							control={form.control}
							name="configuration.isGraded"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between">
									<FormLabel>Enable Grading</FormLabel>
									<FormControl>
										<Switch 
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{form.watch('configuration.isGraded') && (
							<>
								<FormField
									control={form.control}
									name="configuration.gradingType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Grading Type</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select grading type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="AUTOMATIC">Automatic</SelectItem>
													<SelectItem value="MANUAL">Manual</SelectItem>
													<SelectItem value="NONE">None</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="configuration.totalPoints"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Total Points</FormLabel>
											<FormControl>
												<Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						)}

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