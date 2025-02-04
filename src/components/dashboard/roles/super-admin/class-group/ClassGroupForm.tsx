'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/utils/api";
import { Status } from "@prisma/client";

interface ClassGroupFormData {
	name: string;
	description?: string;
	programId: string;
	status: Status;
	course: {
		name: string;
		isTemplate: boolean;
		templateId?: string;
		subjects: string[];
		settings: {
			allowLateSubmissions: boolean;
			gradingScale: string;
			attendanceRequired: boolean;
		};
	};
	calendar: {
		id: string;
		inheritSettings: boolean;
	};
}

interface ClassGroupFormProps {
	selectedClassGroup?: any;
	programs: any[];
	onSuccess: () => void;
}

export const ClassGroupForm = ({ selectedClassGroup, programs, onSuccess }: ClassGroupFormProps) => {
	const [formData, setFormData] = useState<ClassGroupFormData>(() => ({
		name: selectedClassGroup?.name || "",
		description: selectedClassGroup?.description || "",
		programId: selectedClassGroup?.programId || "none",
		status: selectedClassGroup?.status || Status.ACTIVE,
		course: {
			name: selectedClassGroup?.course?.name || "",
			isTemplate: selectedClassGroup?.course?.isTemplate || false,
			templateId: selectedClassGroup?.course?.parentCourseId || undefined,
			subjects: selectedClassGroup?.course?.subjects?.map((s: any) => s.id) || [],
			settings: selectedClassGroup?.course?.settings || {
				allowLateSubmissions: true,
				gradingScale: "100",
				attendanceRequired: true,
			},
		},
		calendar: {
			id: selectedClassGroup?.calendar?.id || "none",
			inheritSettings: selectedClassGroup?.calendar?.inheritSettings || true,
		},
	}));

	const utils = api.useContext();
	const { data: subjects } = api.subject.getAll.useQuery();
	const { data: calendars } = api.calendar.getAll.useQuery();
	const { data: courseTemplates } = api.course.getTemplates.useQuery();

	const createMutation = api.classGroup.createClassGroup.useMutation({
		onSuccess: () => {
			utils.classGroup.getAllClassGroups.invalidate();
			resetForm();
			onSuccess();
		},
	});

	const updateMutation = api.classGroup.updateClassGroup.useMutation({
		onSuccess: () => {
			utils.classGroup.getAllClassGroups.invalidate();
			resetForm();
			onSuccess();
		},
	});

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			programId: "none",
			status: Status.ACTIVE,
			course: {
				name: "",
				isTemplate: false,
				subjects: [],
				settings: {
					allowLateSubmissions: true,
					gradingScale: "100",
					attendanceRequired: true,
				},
			},
			calendar: {
				id: "none",
				inheritSettings: true,
			},
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (formData.programId === "none") {
			alert("Please select a program");
			return;
		}

		if (formData.calendar.id === "none") {
			alert("Please select a calendar");
			return;
		}

		const submissionData = {
			...formData,
			course: {
				...formData.course,
				name: formData.course.name || formData.name,
			},
		};

		if (selectedClassGroup) {
			await updateMutation.mutateAsync({
				id: selectedClassGroup.id,
				...submissionData,
			});
		} else {
			await createMutation.mutateAsync(submissionData);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					required
				/>
			</div>

			<div>
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
				/>
			</div>

			<div>
				<Label htmlFor="program">Program</Label>
				<Select
					value={formData.programId}
					onValueChange={(value) => setFormData({ ...formData, programId: value })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select Program" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Select Program</SelectItem>
						{programs.map((program) => (
							<SelectItem key={program.id} value={program.id}>
								{program.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Course Settings</h3>
				
				<div>
					<Label htmlFor="courseName">Course Name (optional)</Label>
					<Input
						id="courseName"
						value={formData.course.name}
						onChange={(e) => setFormData({
							...formData,
							course: { ...formData.course, name: e.target.value }
						})}
						placeholder="Leave empty to use class group name"
					/>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="isTemplate"
						checked={formData.course.isTemplate}
						onCheckedChange={(checked) => setFormData({
							...formData,
							course: { ...formData.course, isTemplate: checked as boolean }
						})}
					/>
					<Label htmlFor="isTemplate">Is Template Course</Label>
				</div>

				{!formData.course.isTemplate && courseTemplates && courseTemplates.length > 0 && (
					<div>
						<Label htmlFor="templateId">Use Template</Label>
						<Select
							value={formData.course.templateId}
							onValueChange={(value) => setFormData({
								...formData,
								course: { ...formData.course, templateId: value }
							})}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select Template" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">No Template</SelectItem>
								{courseTemplates?.map((template) => (
									<SelectItem key={template.id} value={template.id}>
										{template.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<div>
					<Label>Subjects</Label>
					<div className="grid grid-cols-2 gap-4 mt-2">
						{subjects?.map((subject) => (
							<div key={subject.id} className="flex items-center space-x-2">
								<Checkbox
									id={`subject-${subject.id}`}
									checked={formData.course.subjects.includes(subject.id)}
									onCheckedChange={(checked) => {
										const newSubjects = checked
											? [...formData.course.subjects, subject.id]
											: formData.course.subjects.filter(id => id !== subject.id);
										setFormData({
											...formData,
											course: { ...formData.course, subjects: newSubjects }
										});
									}}
								/>
								<Label htmlFor={`subject-${subject.id}`}>{subject.name}</Label>
							</div>
						))}
					</div>
				</div>

				<div className="space-y-2">
					<h4 className="font-medium">Course Settings</h4>
					<div className="flex items-center space-x-2">
						<Checkbox
							id="allowLateSubmissions"
							checked={formData.course.settings.allowLateSubmissions}
							onCheckedChange={(checked) => setFormData({
								...formData,
								course: {
									...formData.course,
									settings: {
										...formData.course.settings,
										allowLateSubmissions: checked as boolean
									}
								}
							})}
						/>
						<Label htmlFor="allowLateSubmissions">Allow Late Submissions</Label>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="attendanceRequired"
							checked={formData.course.settings.attendanceRequired}
							onCheckedChange={(checked) => setFormData({
								...formData,
								course: {
									...formData.course,
									settings: {
										...formData.course.settings,
										attendanceRequired: checked as boolean
									}
								}
							})}
						/>
						<Label htmlFor="attendanceRequired">Attendance Required</Label>
					</div>

					<div>
						<Label htmlFor="gradingScale">Grading Scale</Label>
						<Select
							value={formData.course.settings.gradingScale}
							onValueChange={(value) => setFormData({
								...formData,
								course: {
									...formData.course,
									settings: { ...formData.course.settings, gradingScale: value }
								}
							})}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="100">100-point scale</SelectItem>
								<SelectItem value="4">4.0 scale</SelectItem>
								<SelectItem value="letter">Letter grades</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Calendar Settings</h3>
				<div>
					<Label htmlFor="calendar">Calendar</Label>
					<Select
						value={formData.calendar.id}
						onValueChange={(value) => setFormData({
							...formData,
							calendar: { ...formData.calendar, id: value }
						})}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select Calendar" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">Select Calendar</SelectItem>
							{calendars?.map((calendar) => (
								<SelectItem key={calendar.id} value={calendar.id}>
									{calendar.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="inheritSettings"
						checked={formData.calendar.inheritSettings}
						onCheckedChange={(checked) => setFormData({
							...formData,
							calendar: { ...formData.calendar, inheritSettings: checked as boolean }
						})}
					/>
					<Label htmlFor="inheritSettings">Inherit Calendar Settings</Label>
				</div>
			</div>

			<div>
				<Label htmlFor="status">Status</Label>
				<Select
					value={formData.status}
					onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Object.values(Status).map((status) => (
							<SelectItem key={status} value={status}>
								{status}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Button type="submit">
				{selectedClassGroup ? "Update" : "Create"} Class Group
			</Button>
		</form>
	);
};