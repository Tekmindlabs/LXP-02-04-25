'use client';

import { useState } from 'react';
import { 
	Course, 
	Subject, 
	CourseStructure, 
	ContentBlock,
	ChapterUnit,
	BlockUnit,
	WeeklyUnit 
} from '@/types/course-management';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';


interface CourseViewerProps {
	course: Course;
	onUpdate?: (course: Course) => void;
}

export const CourseViewer = ({ course, onUpdate }: CourseViewerProps) => {
	// Ensure course and subjects are valid before proceeding
	if (!course || !Array.isArray(course.subjects)) {
		return <div className="text-muted-foreground">No course data available</div>;
	}

	const [isEditMode, setIsEditMode] = useState(false);
	const [activeSubject, setActiveSubject] = useState<Subject | null>(() => {
		return course.subjects.length > 0 ? course.subjects[0] : null;
	});

	const renderContent = (content: ContentBlock) => (
		<div key={content.id} className="p-3 bg-gray-50 rounded-lg mb-2">
			<div className="flex items-center gap-2">
				<span className="text-sm font-medium">{content.type}</span>
				<p>{content.content}</p>
			</div>
		</div>
	);

	const renderChapterStructure = (units: ChapterUnit[]) => (
		units.map((unit, index) => (
			<div key={index} className="border rounded-lg p-4">
				<h4 className="text-lg font-medium mb-3">
					Chapter {unit.chapterNumber}: {unit.title}
				</h4>
				{unit.sections.map((section, sIndex) => (
					<div key={sIndex} className="ml-4 mb-4">
						<h5 className="font-medium mb-2">{section.title}</h5>
						{section.content.map(renderContent)}
					</div>
				))}
			</div>
		))
	);

	const renderBlockStructure = (units: BlockUnit[]) => (
		units.map((unit, index) => (
			<div key={index} className="border rounded-lg p-4">
				<h4 className="text-lg font-medium mb-3">
					Block {unit.position}: {unit.title}
				</h4>
				{unit.content.map(renderContent)}
			</div>
		))
	);

	const renderWeeklyStructure = (units: WeeklyUnit[]) => (
		units.map((unit, index) => (
			<div key={index} className="border rounded-lg p-4">
				<h4 className="text-lg font-medium mb-3">
					Week {unit.weekNumber}
				</h4>
				{unit.dailyActivities.map((day, dayIndex) => (
					<div key={dayIndex} className="ml-4 mb-4">
						<h5 className="font-medium mb-2">Day {day.day}</h5>
						{day.content.map(renderContent)}
					</div>
				))}
			</div>
		))
	);

	const renderStructure = (structure: CourseStructure) => {
		switch (structure.type) {
			case 'CHAPTER':
				return renderChapterStructure(structure.units as ChapterUnit[]);
			case 'BLOCK':
				return renderBlockStructure(structure.units as BlockUnit[]);
			case 'WEEKLY':
				return renderWeeklyStructure(structure.units as WeeklyUnit[]);
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header with Edit Toggle */}
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">{course.name}</h2>
				<Button 
					onClick={() => setIsEditMode(!isEditMode)}
					variant={isEditMode ? "destructive" : "default"}
				>
					{isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
				</Button>
			</div>

			{/* Mobile Subject Selector */}
			<div className="md:hidden">
				{course.subjects.length > 0 ? (
					<div className="w-full">
						<select
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={activeSubject?.id}
							onChange={(e) => {
								const subject = course.subjects.find(s => s.id === e.target.value);
								if (subject) setActiveSubject(subject);
							}}
						>
							{course.subjects.map(subject => (
								<option key={subject.id} value={subject.id}>
									{subject.name || 'Unnamed Subject'}
								</option>
							))}
						</select>
					</div>
				) : (
					<p className="text-muted-foreground">No subjects available</p>
				)}
			</div>

			{/* Desktop Subject Tabs */}
			<div className="hidden md:block">
				{course.subjects.length > 0 ? (
					<div className="border-b">
						<div className="flex space-x-2">
							{course.subjects.map(subject => (
								<button
									key={subject.id}
									className={`px-4 py-2 text-sm font-medium ${
										activeSubject?.id === subject.id
											? 'border-b-2 border-primary text-primary'
											: 'text-muted-foreground hover:text-foreground'
									}`}
									onClick={() => setActiveSubject(subject)}
								>
									{subject.name}
								</button>
							))}
						</div>
					</div>
				) : (
					<p className="text-muted-foreground">No subjects available</p>
				)}
			</div>


			{/* Subject Content */}
			{course.subjects.length > 0 ? (
				activeSubject && (
					<Card className="p-4">
						<div className="space-y-6">
							<div className="flex justify-between items-center">
								<h3 className="text-xl font-semibold">{activeSubject.name}</h3>
								{isEditMode && (
									<Button size="sm" variant="outline">Add Content</Button>
								)}
							</div>

							{/* Course Structure */}
							<div className="space-y-4">
								{activeSubject.courseStructure ? (
									renderStructure(activeSubject.courseStructure)
								) : (
									<p className="text-muted-foreground">No course structure available</p>
								)}
							</div>
						</div>
					</Card>
				)
			) : null}
		</div>
	);
};