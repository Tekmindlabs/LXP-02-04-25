'use client';

import { useState } from 'react';
import { Course, Subject, CourseStructureType } from '@/types/course-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/utils/api';

interface CourseBuilderProps {
	onCourseCreated?: (course: Course) => void;
}

export const CourseBuilder = ({ onCourseCreated }: CourseBuilderProps) => {
	const [courseData, setCourseData] = useState<Partial<Course>>({
		name: '',
		classGroupId: '',
		subjects: []
	});

	const { data: classGroups } = api.classGroup.getAllClassGroups.useQuery();
	const createSubjectMutation = api.subject.create.useMutation();
	const createCourseMutation = api.course.create.useMutation();

	const [currentSubject, setCurrentSubject] = useState<Partial<Subject>>({
		name: '',
		description: '',
		courseStructure: {
			type: 'CHAPTER',
			units: []
		}
	});

	const handleCourseSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!courseData.name || !courseData.classGroupId) {
			toast.error('Please fill in all required fields');
			return;
		}

		if (!courseData.subjects?.length) {
			toast.error('Please add at least one subject before creating the course');
			return;
		}

		try {
			// Create subjects using TRPC mutation
			const createdSubjects = await Promise.all(
				courseData.subjects.map(subject => 
					createSubjectMutation.mutateAsync({
						name: subject.name,
						code: `SUB-${Date.now()}`,
						description: subject.description || '',
						courseStructure: subject.courseStructure,
						classGroupIds: [courseData.classGroupId!], // We know it's defined from the check above
						status: 'ACTIVE'
					})
				)
			);

			// Create course using TRPC mutation
			const result = await createCourseMutation.mutateAsync({
				name: courseData.name,
				academicYear: new Date().getFullYear().toString(),
				classGroupId: courseData.classGroupId,
				subjectIds: createdSubjects.map(subject => subject.id)
			});

			// Transform the result to match the Course type
			const newCourse: Course = {
				id: result.id,
				name: result.name,
				academicYear: result.academicYear,
				classGroupId: courseData.classGroupId!,
				subjects: result.subjects.map(s => ({
					id: s.id,
					name: s.name,
					description: s.description || undefined,
					courseStructure: s.courseStructure as CourseStructure,
					teachers: [], // Initialize with empty arrays since these aren't returned by the API
					activities: []
				})),
				calendarId: result.classGroups[0]?.calendar?.id
			};

			toast.success('Course and subjects created successfully');
			onCourseCreated?.(newCourse);
			
			// Reset form
			setCourseData({
				name: '',
				classGroupId: '',
				subjects: []
			});

		} catch (error) {
			console.error('Error creating course:', error);
			toast.error('Failed to create course and subjects');
		}
	};

	const handleAddSubject = () => {
		if (!currentSubject.name) {
			toast.error('Subject name is required');
			return;
		}

		setCourseData(prev => ({
			...prev,
			subjects: [...(prev.subjects || []), currentSubject as Subject]
		}));
		
		setCurrentSubject({
			name: '',
			description: '',
			courseStructure: {
				type: 'CHAPTER',
				units: []
			}
		});
		
		toast.success('Subject added successfully');
	};


	return (
		<div className="space-y-6 p-6">
			<Card className="p-6">
				<h2 className="text-2xl font-bold mb-4">Create New Course</h2>
				<form onSubmit={handleCourseSubmit} className="space-y-4">
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
						<label className="block text-sm font-medium mb-1">Class Group</label>
						<Select
							value={courseData.classGroupId}
							onValueChange={(value) => {
								setCourseData(prev => ({
									...prev,
									classGroupId: value
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

					<div className="border-t pt-4 mt-4">
						<h3 className="text-lg font-semibold mb-3">Add Subject</h3>
						<div className="space-y-3">
							<Input
								value={currentSubject.name}
								onChange={(e) => setCurrentSubject(prev => ({ ...prev, name: e.target.value }))}
								placeholder="Subject name"
							/>
							<Input
								value={currentSubject.description}
								onChange={(e) => setCurrentSubject(prev => ({ ...prev, description: e.target.value }))}
								placeholder="Subject description"
							/>
							<Select
								value={currentSubject.courseStructure?.type}
								onValueChange={(value: CourseStructureType) => 
									setCurrentSubject(prev => ({
										...prev,
										courseStructure: { ...prev.courseStructure!, type: value }
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select structure type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="CHAPTER">Chapter Based</SelectItem>
									<SelectItem value="BLOCK">Block Based</SelectItem>
									<SelectItem value="WEEKLY">Weekly Based</SelectItem>
								</SelectContent>
							</Select>
							<Button type="button" onClick={handleAddSubject}>Add Subject</Button>
						</div>
					</div>

					<div className="border-t pt-4">
						<h3 className="text-lg font-semibold mb-3">Added Subjects</h3>
						<div className="space-y-2">
							{courseData.subjects?.map((subject, index) => (
								<div key={index} className="p-3 bg-gray-50 rounded">
									<p className="font-medium">{subject.name}</p>
									<p className="text-sm text-gray-600">{subject.description}</p>
								</div>
							))}
						</div>
					</div>

					<Button type="submit" className="mt-6">Create Course</Button>
				</form>
			</Card>
		</div>
	);

};