'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActivityType, ResourceType } from "@prisma/client";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	type: z.nativeEnum(ActivityType),
	classGroupId: z.string().optional(),
	classId: z.string().optional(),
	deadline: z.string().optional(),
	gradingCriteria: z.string().optional(),
	resources: z.array(z.object({
		title: z.string(),
		type: z.nativeEnum(ResourceType),
		url: z.string(),
		fileInfo: z.object({
			size: z.number(),
			createdAt: z.date(),
			updatedAt: z.date(),
			mimeType: z.string(),
			publicUrl: z.string()
		}).optional()
	})).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
	activityId?: string | null;
	onClose: () => void;
}

export default function ClassActivityForm({ activityId, onClose }: Props) {
	const { toast } = useToast();
	const utils = api.useContext();
	const { data: classGroups } = api.classGroup.getAllClassGroups.useQuery();
	const { data: classes } = api.class.searchClasses.useQuery({});
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			type: ActivityType.ASSIGNMENT,
			gradingCriteria: "",
		},
	});

	const { data: activity } = api.classActivity.getById.useQuery(activityId as string, {
		enabled: !!activityId,
	});

	const createMutation = api.classActivity.create.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Activity created successfully",
			});
			utils.classActivity.getAll.invalidate();
			onClose();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const updateMutation = api.classActivity.update.useMutation({
		onSuccess: () => {
			utils.classActivity.getAll.invalidate();
			onClose();
		},
	});

	useEffect(() => {
		if (activity) {
			form.reset({
				title: activity.title,
				description: activity.description || "",
				type: activity.type,
				deadline: activity.deadline?.toISOString().split('T')[0],
				gradingCriteria: activity.gradingCriteria || "",
			});
		}
	}, [activity, form]);

	const onSubmit = (data: FormData) => {
		if (activityId) {
			updateMutation.mutate({
				id: activityId,
				...data,
				deadline: data.deadline ? new Date(data.deadline) : undefined,
			});
		} else {
			createMutation.mutate({
				...data,
				deadline: data.deadline ? new Date(data.deadline) : undefined,
			});
		}
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
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Type</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select activity type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(ActivityType).map((type) => (
										<SelectItem key={type} value={type}>
											{type}
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
					name="deadline"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Deadline</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="classGroupId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Class Group</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select class group" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{classGroups?.map((group) => (
										<SelectItem key={group.id} value={group.id}>
											{group.name}
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
					name="classId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Class</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select class" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{classes?.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
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
					name="gradingCriteria"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Grading Criteria</FormLabel>
							<FormControl>
								<Textarea {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="resources"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Resources</FormLabel>
							<div className="space-y-2">
								{field.value?.map((resource, index) => (
									<div key={index} className="space-y-2">
										<div className="flex items-center space-x-2">
											<Input
												value={resource.title}
												onChange={(e) => {
													const newResources = [...field.value!];
													newResources[index].title = e.target.value;
													field.onChange(newResources);
												}}
												placeholder="Resource title"
											/>
											<Select
												value={resource.type}
												onValueChange={(value) => {
													const newResources = [...field.value!];
													newResources[index].type = value as ResourceType;
													field.onChange(newResources);
												}}
											>
												<SelectTrigger className="w-[150px]">
													<SelectValue placeholder="Type" />
												</SelectTrigger>
												<SelectContent>
													{Object.values(ResourceType).map((type) => (
														<SelectItem key={type} value={type}>
															{type}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{resource.fileInfo ? (
												<div className="flex items-center space-x-2">
													<span className="text-sm text-muted-foreground">
														{(resource.fileInfo.size / 1024 / 1024).toFixed(2)}MB
													</span>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														onClick={() => {
															const newResources = [...field.value!];
															newResources[index].fileInfo = undefined;
															newResources[index].url = '';
															field.onChange(newResources);
														}}
													>
														Remove File
													</Button>
												</div>
											) : (
												<div className="flex-1">
													<FileUpload
														subDir={`activity-resources/${activity?.id || 'new'}`}
														onUploadComplete={(filePath, fileInfo) => {
															const newResources = [...field.value!];
															newResources[index].url = filePath;
															newResources[index].fileInfo = fileInfo;
															field.onChange(newResources);
														}}
														allowedTypes={['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
													/>
												</div>
											)}
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() => {
													const newResources = field.value?.filter((_, i) => i !== index);
													field.onChange(newResources);
												}}
											>
												Remove
											</Button>
										</div>
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										const newResources = [
											...(field.value || []),
											{ title: "", type: ResourceType.DOCUMENT, url: "" },
										];
										field.onChange(newResources);
									}}
								>
									Add Resource
								</Button>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">
						{activityId ? "Update" : "Create"} Activity
					</Button>
				</div>
			</form>
		</Form>
	);
}