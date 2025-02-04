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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CourseViewerProps {
	course: Course;
	onUpdate?: (course: Course) => void;
}

export const CourseViewer = ({ course, onUpdate }: CourseViewerProps) => {
	const [isEditMode, setIsEditMode] = useState(false);
	const [activeSubject, setActiveSubject] = useState<Subject>(course.subjects[0]);

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
				<Select
					value={activeSubject?.id}
					onValueChange={(value) => {
						const subject = course.subjects.find(s => s.id === value);
						if (subject) setActiveSubject(subject);
					}}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select Subject" />
					</SelectTrigger>
					<SelectContent>
						{course.subjects.map(subject => (
							<SelectItem key={subject.id} value={subject.id}>
								{subject.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Desktop Subject Tabs */}
			<div className="hidden md:block">
				<Tabs defaultValue={activeSubject?.id} onValueChange={(value) => {
					const subject = course.subjects.find(s => s.id === value);
					if (subject) setActiveSubject(subject);
				}}>
					<TabsList className="w-full justify-start">
						{course.subjects.map(subject => (
							<TabsTrigger key={subject.id} value={subject.id}>
								{subject.name}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>

			{/* Subject Content */}
			{activeSubject && (
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
							{renderStructure(activeSubject.courseStructure)}
						</div>

					</div>
				</Card>
			)}
		</div>
	);
};