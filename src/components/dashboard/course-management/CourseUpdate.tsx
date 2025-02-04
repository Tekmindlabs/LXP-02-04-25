'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourseStructureEditor } from './CourseStructureEditor';
import type { Course, Subject } from '@/types/course-management';
import { toast } from 'sonner';
import { api } from '@/utils/api';

interface CourseUpdateProps {
	course?: Course;
	onUpdate?: (updatedCourse: Course) => void;
}

export const CourseUpdate = ({ course, onUpdate }: CourseUpdateProps) => {
	const updateCourseMutation = api.course.updateSettings.useMutation();
	const updateSubjectMutation = api.subject.update.useMutation();

	const [courseData, setCourseData] = useState<Partial<Course> & { 
		settings?: { 
			allowLateSubmissions: boolean; 
			gradingScale: string; 
			attendanceRequired: boolean 
		} 
	}>(course || {
		name: '',
		academicYear: '',
		classGroupId: '',
		calendarId: '',
		subjects: [],
		settings: {
			allowLateSubmissions: false,
			gradingScale: 'standard',
			attendanceRequired: true
		}
	});

	const { data: classGroups } = api.classGroup.getAllClassGroups.useQuery();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!courseData.id) return;

		try {
			if (courseData.settings) {
				await updateCourseMutation.mutateAsync({
					id: courseData.id,
					settings: courseData.settings
				});
			}

			if (courseData.subjects) {
				await Promise.all(
					courseData.subjects.map(async (subject) => {
						await updateSubjectMutation.mutateAsync({
							id: subject.id,
							name: subject.name,
							description: subject.description,
							courseStructure: subject.courseStructure,
							classGroupIds: [courseData.classGroupId || ''],
							status: 'ACTIVE'
						});
					})
				);
			}

			onUpdate?.(courseData as Course);
			toast.success('Course updated successfully');
		} catch (error) {
			toast.error('Failed to update course');
			console.error('Error updating course:', error);
		}
	};

	const handleSubjectUpdate = (index: number, updatedSubject: Subject) => {
		setCourseData(prev => ({
			...prev,
			subjects: prev.subjects?.map((subject, i) => 
				i === index ? updatedSubject : subject
			)
		}));
	};

	if (!course) {
		return (
			<div className="text-center py-8 text-gray-500">
				Please select a course to update
			</div>
		);
	}

	const selectedClassGroup = classGroups?.find(group => group.id === courseData.classGroupId);

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-1">Course Name</label>
					<Input
						value={courseData.name}
						onChange={(e) => setCourseData(prev => ({ ...prev, name: e.target.value }))}
						placeholder="Enter course name"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">Academic Year</label>
					<Input
						value={courseData.academicYear}
						onChange={(e) => setCourseData(prev => ({ ...prev, academicYear: e.target.value }))}
						placeholder="YYYY-YYYY"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">Class Group</label>
					<Select
						value={courseData.classGroupId}
						onValueChange={(value) => {
							const selectedGroup = classGroups?.find(group => group.id === value);
							setCourseData(prev => ({
								...prev,
								classGroupId: value,
								calendarId: selectedGroup?.calendar?.id || ''
							}));
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select Class Group" />
						</SelectTrigger>
						<SelectContent>
							{classGroups?.map((group) => (
								<SelectItem key={group.id} value={group.id}>
									{group.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{selectedClassGroup?.calendar && (
					<div>
						<label className="block text-sm font-medium mb-1">Associated Calendar</label>
						<Input
							value={selectedClassGroup.calendar.name}
							disabled
							placeholder="Calendar"
						/>
					</div>
				)}

				<div className="border-t pt-4 mt-4">
					<h3 className="text-lg font-semibold mb-3">Course Settings</h3>
					<div className="space-y-4">
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="allowLateSubmissions"
								checked={courseData.settings?.allowLateSubmissions ?? false}
								onChange={(e) => setCourseData(prev => ({
									...prev,
									settings: {
										allowLateSubmissions: e.target.checked,
										gradingScale: prev.settings?.gradingScale ?? 'standard',
										attendanceRequired: prev.settings?.attendanceRequired ?? true
									}
								}))}
							/>
							<label htmlFor="allowLateSubmissions">Allow Late Submissions</label>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Grading Scale</label>
							<Input
								value={courseData.settings?.gradingScale ?? 'standard'}
								onChange={(e) => setCourseData(prev => ({
									...prev,
									settings: {
										allowLateSubmissions: prev.settings?.allowLateSubmissions ?? false,
										gradingScale: e.target.value,
										attendanceRequired: prev.settings?.attendanceRequired ?? true
									}
								}))}
								placeholder="Enter grading scale"
							/>
						</div>

						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="attendanceRequired"
								checked={courseData.settings?.attendanceRequired ?? true}
								onChange={(e) => setCourseData(prev => ({
									...prev,
									settings: {
										allowLateSubmissions: prev.settings?.allowLateSubmissions ?? false,
										gradingScale: prev.settings?.gradingScale ?? 'standard',
										attendanceRequired: e.target.checked
									}
								}))}
							/>
							<label htmlFor="attendanceRequired">Attendance Required</label>
						</div>
					</div>
				</div>

				<Button type="submit">Update Course</Button>
			</form>

			<div className="border-t pt-6">
				<h3 className="text-lg font-semibold mb-4">Subjects</h3>
				{courseData.subjects?.map((subject, index) => (
					<Card key={index} className="p-4 mb-4">
						<h4 className="font-medium mb-2">{subject.name}</h4>
						<CourseStructureEditor
							initialStructure={subject.courseStructure}
							onSave={(structure) => handleSubjectUpdate(index, {
								...subject,
								courseStructure: structure
							})}
						/>
					</Card>
				))}
			</div>
		</div>
	);
};