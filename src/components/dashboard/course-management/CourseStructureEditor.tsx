'use client';

import { useState } from 'react';
import { CourseStructure, ContentBlock, ChapterUnit, BlockUnit, WeeklyUnit } from '../../../types/course-management';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Card } from '../../ui/card';
import {

	DndContext,
	DragOverlay,
	useSensors,
	useSensor,
	PointerSensor,
	KeyboardSensor,
	closestCenter,
	DragStartEvent,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
	arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';


interface CourseStructureEditorProps {
	initialStructure: CourseStructure;
	onSave: (structure: CourseStructure) => void;
}

const SortableContentBlock = ({ content }: { content: ContentBlock }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ id: content.id });

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className="p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 transition-colors"
			style={{
				transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
				transition,
			}}
		>
			<p className="text-sm">{content.type}: {content.content}</p>
		</div>
	);
};

export const CourseStructureEditor = ({ initialStructure, onSave }: CourseStructureEditorProps) => {
	const [structure, setStructure] = useState<CourseStructure>(initialStructure);
	const [currentContent, setCurrentContent] = useState<Partial<ContentBlock>>({
		type: 'TEXT',
		content: ''
	});
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor)
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id.toString());
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setStructure(prev => {
				const newStructure = { ...prev };
				
				if (prev.type === 'CHAPTER') {
					const units = newStructure.units as ChapterUnit[];
					units.forEach(unit => {
						unit.sections.forEach(section => {
							const oldIndex = section.content.findIndex(item => item.id === active.id.toString());
							const newIndex = section.content.findIndex(item => item.id === over.id.toString());
							
							if (oldIndex !== -1 && newIndex !== -1) {
								section.content = arrayMove(section.content, oldIndex, newIndex);
							}
						});
					});
				} else if (prev.type === 'BLOCK') {
					const units = newStructure.units as BlockUnit[];
					units.forEach(unit => {
						const oldIndex = unit.content.findIndex(item => item.id === active.id.toString());
						const newIndex = unit.content.findIndex(item => item.id === over.id.toString());
						
						if (oldIndex !== -1 && newIndex !== -1) {
							unit.content = arrayMove(unit.content, oldIndex, newIndex);
						}
					});
				} else if (prev.type === 'WEEKLY') {
					const units = newStructure.units as WeeklyUnit[];
					units.forEach(unit => {
						unit.dailyActivities.forEach(daily => {
							const oldIndex = daily.content.findIndex(item => item.id === active.id.toString());
							const newIndex = daily.content.findIndex(item => item.id === over.id.toString());
							
							if (oldIndex !== -1 && newIndex !== -1) {
								daily.content = arrayMove(daily.content, oldIndex, newIndex);
							}
						});
					});
				}
				
				return newStructure;
			});
		}
		setActiveId(null);
	};

	const renderContentBlocks = (contents: ContentBlock[]) => (
		<SortableContext items={contents.map(c => c.id)} strategy={verticalListSortingStrategy}>
			<div className="space-y-2">
				{contents.map((content) => (
					<SortableContentBlock key={content.id} content={content} />
				))}
			</div>
		</SortableContext>
	);

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
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							modifiers={[restrictToVerticalAxis]}
						>
							{renderContentBlocks(section.content)}
							<DragOverlay>
								{activeId ? (
									<div className="p-2 bg-gray-50 rounded opacity-50">
										{section.content.find(c => c.id === activeId)?.content}
									</div>
								) : null}
							</DragOverlay>
						</DndContext>
						{renderContentForm(unitIndex, sectionIndex)}
					</div>
				))}
			</Card>
		));
	};

	const renderContentForm = (unitIndex: number, sectionIndex?: number) => (
		<div className="mt-3 space-y-2">
			<select
				className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
				value={currentContent.type}
				onChange={(e) => setCurrentContent(prev => ({ ...prev, type: e.target.value as ContentBlock['type'] }))}
			>
				<option value="TEXT">Text</option>
				<option value="VIDEO">Video</option>
				<option value="QUIZ">Quiz</option>
				<option value="ASSIGNMENT">Assignment</option>
			</select>

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
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					modifiers={[restrictToVerticalAxis]}
				>
					{renderContentBlocks(unit.content)}
					<DragOverlay>
						{activeId ? (
							<div className="p-2 bg-gray-50 rounded opacity-50">
								{unit.content.find(c => c.id === activeId)?.content}
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
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
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							modifiers={[restrictToVerticalAxis]}
						>
							{renderContentBlocks(daily.content)}
							<DragOverlay>
								{activeId ? (
									<div className="p-2 bg-gray-50 rounded opacity-50">
										{daily.content.find(c => c.id === activeId)?.content}
									</div>
								) : null}
							</DragOverlay>
						</DndContext>
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