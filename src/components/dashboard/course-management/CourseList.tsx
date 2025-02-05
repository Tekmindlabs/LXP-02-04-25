'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course } from '@/types/course-management';

interface CourseListProps {
	courses?: Course[];
	onSelect?: (course: Course) => void;
	isLoading?: boolean;
}

const LoadingSkeleton = () => (
	<div className="space-y-4">
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
		</div>
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{[1, 2, 3, 4, 5, 6].map((i) => (
				<div key={i} className="p-4 border rounded-lg">
					<Skeleton className="h-6 w-3/4 mb-2" />
					<Skeleton className="h-4 w-1/2 mb-2" />
					<Skeleton className="h-4 w-1/3" />
				</div>
			))}
		</div>
	</div>
);

export const CourseList = ({ courses = [], onSelect, isLoading = false }: CourseListProps) => {
	if (isLoading) {
		return <LoadingSkeleton />;
	}

	const [searchTerm, setSearchTerm] = useState('');
	const [classGroupFilter, setClassGroupFilter] = useState<string>('all');
	const [yearFilter, setYearFilter] = useState<string>('all');

	// Get unique class groups and years for filters
	const uniqueClassGroups = Array.from(new Set(courses.map(course => course.classGroupId)));
	const uniqueYears = Array.from(new Set(courses.map(course => course.academicYear)));

	const filteredCourses = courses.filter(course => {
		const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesClassGroup = classGroupFilter === 'all' || course.classGroupId === classGroupFilter;
		const matchesYear = yearFilter === 'all' || course.academicYear === yearFilter;
		return matchesSearch && matchesClassGroup && matchesYear;
	});

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Input
					placeholder="Search courses..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<select
					className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					value={classGroupFilter}
					onChange={(e) => setClassGroupFilter(e.target.value)}
				>
					<option value="all">All Class Groups</option>
					{uniqueClassGroups.map((groupId) => (
						<option key={groupId} value={groupId}>
							{groupId}
						</option>
					))}
				</select>
				<select
					className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					value={yearFilter}
					onChange={(e) => setYearFilter(e.target.value)}
				>
					<option value="all">All Years</option>
					{uniqueYears.map((year) => (
						<option key={year} value={year}>
							{year}
						</option>
					))}
				</select>

			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredCourses.map((course) => (
					<Card key={course.id} className="p-4">
						<h3 className="text-lg font-semibold">{course.name}</h3>
						<p className="text-sm text-gray-600">Class Group ID: {course.classGroupId}</p>
						{course.calendarId && (
							<p className="text-sm text-gray-600">Calendar ID: {course.calendarId}</p>
						)}
						<p className="text-sm text-gray-600">{course.academicYear}</p>
						<div className="mt-4 space-x-2">
							<Button 
								variant="outline" 
								size="sm"
								onClick={() => onSelect?.(course)}
							>
								Edit
							</Button>
						</div>
					</Card>
				))}
			</div>

			{filteredCourses.length === 0 && (
				<div className="text-center py-8 text-gray-500">
					No courses found matching your criteria
				</div>
			)}
		</div>
	);
};