import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ActivityConfiguration, ActivityType, WordSearchConfig } from "@/types/class-activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const baseConfigSchema = z.object({
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
});

const activityFormSchema = z.object({
	title: z.string().min(3, "Title must be at least 3 characters"),
	description: z.string().optional(),
	type: z.custom<ActivityType>(),
	configuration: z.discriminatedUnion('type', [
		z.object({
			type: z.literal('GAME_WORD_SEARCH'),
			words: z.array(z.string()).min(1, "At least one word is required"),
			gridSize: z.object({
				rows: z.number().min(5).max(20),
				cols: z.number().min(5).max(20)
			}),
			orientations: z.object({
				horizontal: z.boolean(),
				vertical: z.boolean(),
				diagonal: z.boolean(),
				reverseHorizontal: z.boolean(),
				reverseVertical: z.boolean(),
				reverseDiagonal: z.boolean()
			}),
			difficulty: z.enum(['easy', 'medium', 'hard']),
			timeLimit: z.number().min(0).optional(),
			showWordList: z.boolean(),
			fillRandomLetters: z.boolean()
		}).merge(baseConfigSchema),
		z.object({
			type: z.literal('DEFAULT'),
		}).merge(baseConfigSchema)
	])
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

						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Activity Type</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select activity type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="GAME_WORD_SEARCH">Word Search</SelectItem>
											<SelectItem value="DEFAULT">Default</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{form.watch('type') === 'GAME_WORD_SEARCH' && (
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="configuration.words"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Words (comma-separated)</FormLabel>
											<FormControl>
												<Input 
													{...field} 
													onChange={e => field.onChange(e.target.value.split(',').map(w => w.trim()))}
													placeholder="Enter words separated by commas"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="configuration.gridSize.rows"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Grid Rows</FormLabel>
												<FormControl>
													<Input 
														type="number" 
														{...field} 
														onChange={e => field.onChange(e.target.valueAsNumber)}
														min={5}
														max={20}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="configuration.gridSize.cols"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Grid Columns</FormLabel>
												<FormControl>
													<Input 
														type="number" 
														{...field} 
														onChange={e => field.onChange(e.target.valueAsNumber)}
														min={5}
														max={20}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="configuration.difficulty"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Difficulty</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select difficulty" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="easy">Easy</SelectItem>
													<SelectItem value="medium">Medium</SelectItem>
													<SelectItem value="hard">Hard</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="space-y-2">
									<FormField
										control={form.control}
										name="configuration.showWordList"
										render={({ field }) => (
											<FormItem className="flex items-center justify-between">
												<FormLabel>Show Word List</FormLabel>
												<FormControl>
													<Switch checked={field.value} onCheckedChange={field.onChange} />
												</FormControl>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="configuration.fillRandomLetters"
										render={({ field }) => (
											<FormItem className="flex items-center justify-between">
												<FormLabel>Fill Empty Spaces</FormLabel>
												<FormControl>
													<Switch checked={field.value} onCheckedChange={field.onChange} />
												</FormControl>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="configuration.orientations"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Word Orientations</FormLabel>
												<div className="grid grid-cols-2 gap-2">
													{Object.entries({
														horizontal: 'Horizontal',
														vertical: 'Vertical',
														diagonal: 'Diagonal',
														reverseHorizontal: 'Reverse Horizontal',
														reverseVertical: 'Reverse Vertical',
														reverseDiagonal: 'Reverse Diagonal'
													}).map(([key, label]) => (
														<FormItem key={key} className="flex items-center space-x-2">
															<FormControl>
																<Switch
																	checked={field.value?.[key as keyof typeof field.value] ?? false}
																	onCheckedChange={(checked) => {
																		field.onChange({
																			...field.value,
																			[key]: checked
																		});
																	}}
																/>
															</FormControl>
															<FormLabel className="text-sm">{label}</FormLabel>
														</FormItem>
													))}
												</div>
											</FormItem>
										)}
									/>
								</div>
							</div>
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