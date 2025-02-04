'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseBuilder } from './CourseBuilder';
import { CourseList } from './CourseList';
import { CourseUpdate } from './CourseUpdate';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Course } from '@/types/course-management';
import { CourseManagementService } from '@/lib/course-management/course-service';

const courseManagementService = new CourseManagementService();

export function CourseManagementPage() {
	const [activeTab, setActiveTab] = useState('create');
	const [selectedCourse, setSelectedCourse] = useState<Course | undefined>();
	const [courses, setCourses] = useState<Course[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchCourses = async () => {
			try {
				// TODO: Add API endpoint to fetch all courses
				setIsLoading(false);
			} catch (error) {
				console.error('Error fetching courses:', error);
				toast.error('Failed to load courses');
				setIsLoading(false);
			}
		};

		fetchCourses();
	}, []);

	const handleCourseCreated = async (newCourse: Course) => {
		setCourses(prev => [...prev, newCourse]);
		setActiveTab('view');
		toast.success('Course created successfully');
	};

	const handleCourseUpdate = async (updatedCourse: Course) => {
		setCourses(prev => 
			prev.map(course => 
				course.id === updatedCourse.id ? updatedCourse : course
			)
		);
		toast.success('Course updated successfully');
		setActiveTab('view');
	};

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">Course Management</h1>
			
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="create">Create Course</TabsTrigger>
					<TabsTrigger value="view">View Courses</TabsTrigger>
					<TabsTrigger value="update">Update Course</TabsTrigger>
				</TabsList>

				<TabsContent value="create">
					<CourseBuilder onCourseCreated={handleCourseCreated} />
				</TabsContent>

				<TabsContent value="view">
					<Card className="p-6">
						<h2 className="text-2xl font-bold mb-4">Available Courses</h2>
						<CourseList 
							courses={courses}
							onSelect={(course) => {
								setSelectedCourse(course);
								setActiveTab('update');
							}}
							isLoading={isLoading}
						/>
					</Card>
				</TabsContent>

				<TabsContent value="update">
					<Card className="p-6">
						<h2 className="text-2xl font-bold mb-4">Update Course</h2>
						<CourseUpdate 
							course={selectedCourse}
							onUpdate={handleCourseUpdate}
						/>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}