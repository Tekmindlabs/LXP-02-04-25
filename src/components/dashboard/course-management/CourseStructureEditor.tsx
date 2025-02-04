'use client';

import { useState } from 'react';
import { CourseStructure, ContentBlock, ChapterUnit, BlockUnit, WeeklyUnit } from '../../../types/course-management';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Card } from '../../ui/card';
import { Select } from '../../ui/select';

interface CourseStructureEditorProps {
	initialStructure: CourseStructure;
	onSave: (structure: CourseStructure) => void;
}

export const CourseStructureEditor = ({ initialStructure, onSave }: CourseStructureEditorProps) => {
	const [structure, setStructure] = useState<CourseStructure>(initialStructure);
	const [currentContent, setCurrentContent] = useState<Partial<ContentBlock>>({
		type: 'TEXT',
		content: ''
	});

	const handleAddContent = (unitIndex: number, sectionIndex?: number) => {
		if (!currentContent.content) return;

		const newContent: ContentBlock = {
			id: crypto.randomUUID(),
			type: currentContent.type!,
			content: currentContent.content
		};

		setStructure(prev => {
			const newStructure = { ...prev };
			
			if (prev.type === 'CHAPTER') {
				const units = prev.units as ChapterUnit[];
				if (typeof sectionIndex === 'number') {
					units[unitIndex].sections[sectionIndex].content.push(newContent);
				}
			} else if (prev.type === 'BLOCK') {
				const units = prev.units as BlockUnit[];
				units[unitIndex].content.push(newContent);
			} else if (prev.type === 'WEEKLY') {
				const units = prev.units as WeeklyUnit[];
				units[unitIndex].dailyActivities[sectionIndex!].content.push(newContent);
			}

			return newStructure;
		});

		setCurrentContent({ type: 'TEXT', content: '' });
	};

	const renderChapterStructure = () => {
		const units = structure.units as ChapterUnit[];
		return units.map((unit, unitIndex) => (
			<Card key={unitIndex} className="p-4 mb-4">
				<h3 className="text-lg font-semibold">Chapter {unit.chapterNumber}: {unit.title}</h3>
				{unit.sections.map((section, sectionIndex) => (
					<div key={sectionIndex} className="mt-4">
						<h4 className="font-medium">{section.title}</h4>
						<div className="space-y-2 mt-2">
							{section.content.map((content, contentIndex) => (
								<div key={contentIndex} className="p-2 bg-gray-50 rounded">
									<p className="text-sm">{content.type}: {content.content}</p>
								</div>
							))}
						</div>
						{renderContentForm(unitIndex, sectionIndex)}
					</div>
				))}
			</Card>
		));
	};

	const renderContentForm = (unitIndex: number, sectionIndex?: number) => (
		<div className="mt-3 space-y-2">
			<Select
				value={currentContent.type}
				onValueChange={(value) => setCurrentContent(prev => ({ ...prev, type: value as ContentBlock['type'] }))}
			>
				<option value="TEXT">Text</option>
				<option value="VIDEO">Video</option>
				<option value="QUIZ">Quiz</option>
				<option value="ASSIGNMENT">Assignment</option>
			</Select>
			<Textarea
				value={currentContent.content}
				onChange={(e) => setCurrentContent(prev => ({ ...prev, content: e.target.value }))}
				placeholder="Enter content"
				className="h-24"
			/>
			<Button 
				type="button" 
				onClick={() => handleAddContent(unitIndex, sectionIndex)}
				size="sm"
			>
				Add Content
			</Button>
		</div>
	);

	const renderBlockStructure = () => {
		const units = structure.units as BlockUnit[];
		return units.map((unit, unitIndex) => (
			<Card key={unitIndex} className="p-4 mb-4">
				<h3 className="text-lg font-semibold">Block {unit.position}: {unit.title}</h3>
				<div className="space-y-2 mt-2">
					{unit.content.map((content, contentIndex) => (
						<div key={contentIndex} className="p-2 bg-gray-50 rounded">
							<p className="text-sm">{content.type}: {content.content}</p>
						</div>
					))}
				</div>
				{renderContentForm(unitIndex)}
			</Card>
		));
	};

	const renderWeeklyStructure = () => {
		const units = structure.units as WeeklyUnit[];
		return units.map((unit, unitIndex) => (
			<Card key={unitIndex} className="p-4 mb-4">
				<h3 className="text-lg font-semibold">
					Week {unit.weekNumber}: {unit.startDate.toLocaleDateString()} - {unit.endDate.toLocaleDateString()}
				</h3>
				{unit.dailyActivities.map((daily, dayIndex) => (
					<div key={dayIndex} className="mt-4">
						<h4 className="font-medium">Day {daily.day}</h4>
						<div className="space-y-2 mt-2">
							{daily.content.map((content, contentIndex) => (
								<div key={contentIndex} className="p-2 bg-gray-50 rounded">
									<p className="text-sm">{content.type}: {content.content}</p>
								</div>
							))}
						</div>
						{renderContentForm(unitIndex, dayIndex)}
					</div>
				))}
			</Card>
		));
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Course Structure Editor</h2>
				<Button onClick={() => onSave(structure)}>Save Structure</Button>
			</div>
			
			{structure.type === 'CHAPTER' && renderChapterStructure()}
			{structure.type === 'BLOCK' && renderBlockStructure()}
			{structure.type === 'WEEKLY' && renderWeeklyStructure()}
		</div>
	);
};