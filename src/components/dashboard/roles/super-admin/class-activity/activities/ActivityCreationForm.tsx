'use client';

import { api } from '@/utils/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage 
} from '@/components/ui/form';
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue 
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { ActivityConfiguration } from '@/types/class-activity';




const ACTIVITY_TYPES = [
	'QUIZ_MULTIPLE_CHOICE',
	'QUIZ_DRAG_DROP',
	'QUIZ_FILL_BLANKS',
	'GAME_WORD_SEARCH',
	'VIDEO_YOUTUBE',
	'READING'
] as const;

const ACTIVITY_STATUSES = [
	'DRAFT',
	'PUBLISHED',
	'PENDING'
] as const;

const formSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	type: z.enum(ACTIVITY_TYPES),
	status: z.enum(ACTIVITY_STATUSES),
	deadline: z.string().optional().transform(val => val ? new Date(val) : undefined),
	classId: z.string().optional(),
	classGroupId: z.string().optional(),
	subjectId: z.string(),
	configuration: z.object({

		isGraded: z.boolean(),
		gradingType: z.enum(['AUTOMATIC', 'MANUAL', 'NONE']),
		viewType: z.enum(['PREVIEW', 'STUDENT', 'CONFIGURATION']).default('STUDENT'),
		totalPoints: z.number().optional(),
		autoplay: z.boolean().optional(),
		showControls: z.boolean().optional(),
		showExamples: z.boolean().optional(),
		videoUrl: z.string().optional(),
		words: z.array(z.string()).optional(),
		gridSize: z.object({
			rows: z.number(),
			cols: z.number()
		}).optional(),
		difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
		content: z.string().optional(),
		examples: z.array(z.string()).optional(),
		showWordList: z.boolean().optional(),
		fillRandomLetters: z.boolean().optional(),
		orientations: z.object({
			horizontal: z.boolean(),
			vertical: z.boolean(),
			diagonal: z.boolean(),
			reverseHorizontal: z.boolean(),
			reverseVertical: z.boolean(),
			reverseDiagonal: z.boolean()
		}).optional()
	})
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

interface ActivityCreationFormProps {
	activityId?: string | null;
	template?: any;
	onClose: () => void;
	onSubmit?: (values: FormOutput) => void;
}

export function ActivityCreationForm({ 
	activityId, 
	template, 
	onClose,
	onSubmit: handleSubmit 
}: ActivityCreationFormProps) {
	const utils = api.useContext();
	const { data: subjects } = api.subject.getAll.useQuery();
	const { data: activity } = api.classActivity.getById.useQuery(
		activityId as string,
		{ enabled: !!activityId }
	);

	const form = useForm<FormInput>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: activity?.title || template?.title || '',
			description: activity?.description || template?.description || '',
			type: (activity?.type || template?.type || 'QUIZ_MULTIPLE_CHOICE') as z.infer<typeof formSchema>['type'],
			status: (activity?.status || 'DRAFT') as z.infer<typeof formSchema>['status'],
			deadline: activity?.deadline ? activity.deadline.toISOString().split('T')[0] : undefined,
			subjectId: activity?.subjectId || 'NO_SUBJECT',
			configuration: {
				...(activity?.configuration || template?.configuration || {
					isGraded: false,
					gradingType: 'NONE',
					viewType: 'STUDENT',
					showControls: true
				}) as ActivityConfiguration
			}

		}
	});

	const createMutation = api.classActivity.create.useMutation({
		onSuccess: () => {
			utils.classActivity.getAll.invalidate();
			onClose();
		}
	});

	const updateMutation = api.classActivity.update.useMutation({
		onSuccess: () => {
			utils.classActivity.getAll.invalidate();
			onClose();
		}
	});

	const onSubmit = (values: FormInput) => {
		const formattedValues = formSchema.parse({
			...values,
			configuration: {
				...values.configuration,
				orientations: values.configuration.orientations || {
					horizontal: false,
					vertical: false,
					diagonal: false,
					reverseHorizontal: false,
					reverseVertical: false,
					reverseDiagonal: false
				}
			}
		});
		
		if (activityId) {
			updateMutation.mutate({ id: activityId, ...formattedValues });
		} else if (handleSubmit) {
			handleSubmit(formattedValues);
		} else {
			createMutation.mutate(formattedValues);
		}
		onClose();
	};




	return (
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
							name="subjectId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Subject</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select subject" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="NO_SUBJECT">Select a subject</SelectItem>
											{subjects?.map((subject) => (
												<SelectItem key={subject.id} value={subject.id}>
													{subject.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
							  <FormLabel>Type</FormLabel>
							  <Select
								onValueChange={field.onChange}
								defaultValue={field.value}
							  >
								<FormControl>
								  <SelectTrigger>
									<SelectValue placeholder="Select type" />
								  </SelectTrigger>
								</FormControl>
								<SelectContent>
								  {ACTIVITY_TYPES.map((type) => (
									<SelectItem key={type} value={type}>
									  {type.replace(/_/g, ' ')}
									</SelectItem>
								  ))}
								</SelectContent>
							  </Select>
							  <FormMessage />
							</FormItem>
						  )}
						/>

						{form.watch('type') === 'VIDEO_YOUTUBE' && (
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="configuration.videoUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>YouTube Video URL</FormLabel>
											<FormControl>
												<Input {...field} placeholder="https://www.youtube.com/watch?v=..." />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="configuration.autoplay"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between">
											<FormLabel>Autoplay Video</FormLabel>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="configuration.showControls"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between">
											<FormLabel>Show Video Controls</FormLabel>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>
							</div>
						)}

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
													<Switch 
														checked={field.value as boolean} 
														onCheckedChange={field.onChange}
													/>
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
													<Switch 
														checked={field.value as boolean} 
														onCheckedChange={field.onChange}
													/>
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
																	checked={(field.value as any)?.[key] ?? false}
																	onCheckedChange={(checked) => {
																		const currentValue = field.value as Record<string, boolean> || {};
																		field.onChange({
																			...currentValue,
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

						{form.watch('type') === 'READING' && (
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="configuration.content"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Reading Content</FormLabel>
											<FormControl>
												<Textarea 
													{...field}
													className="min-h-[200px]"
													placeholder="Enter the reading content here..."
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="configuration.showExamples"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between">
											<FormLabel>Show Examples</FormLabel>
											<FormControl>
												<Switch 
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								{form.watch('configuration.showExamples') && (
									<FormField
										control={form.control}
										name="configuration.examples"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Examples</FormLabel>
												<div className="space-y-2">
													{((field.value || []) as string[]).map((example, index) => (
														<div key={index} className="flex gap-2">
															<FormControl>
																<Textarea
																	value={example}
																	onChange={(e) => {
																		const newExamples = [...(field.value as string[] || [])];
																		newExamples[index] = e.target.value;
																		field.onChange(newExamples);
																	}}
																	placeholder={`Example ${index + 1}`}
																/>
															</FormControl>
															<Button
																type="button"
																variant="destructive"
																size="sm"
																onClick={() => {
																	const newExamples = (field.value as string[]).filter((_, i) => i !== index);
																	field.onChange(newExamples);
																}}
															>
																Remove
															</Button>
														</div>
													))}
													<Button
														type="button"
														variant="outline"
														onClick={() => {
															field.onChange([...(field.value || []), '']);
														}}
													>
														Add Example
													</Button>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</div>
						)}

						<FormField
						  control={form.control}
						  name="deadline"
						  render={({ field }) => (
							<FormItem>
							  <FormLabel>Deadline</FormLabel>
							  <FormControl>
								<Input 
									type="date" 
									{...field}
								/>
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>


						<div className="flex justify-end space-x-2">
						  <Button type="button" variant="outline" onClick={onClose}>
							Cancel
						  </Button>
						  <Button type="submit">
							{activityId ? 'Update' : 'Create'} Activity
						  </Button>
						</div>
					  </form>
					</Form>
				  );
				}