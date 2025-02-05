'use client';

import { useState } from 'react';
import { CourseStructure, ContentBlock, ChapterUnit, BlockUnit, WeeklyUnit } from '../../../types/course-management';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ActivityModal } from './ActivityModal';
import { ActivityTemplate, ActivityType } from '../../../types/class-activity';

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

	const renderContent = () => {
		try {
			if (content.type.startsWith('QUIZ_') || 
					content.type.startsWith('GAME_') || 
					content.type === 'VIDEO_YOUTUBE' || 
					content.type === 'READING') {
				const activity = JSON.parse(content.content) as ActivityTemplate;
				return (
					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-medium">{activity.title}</h4>
							<p className="text-sm text-muted-foreground">{activity.description || 'No description'}</p>
						</div>
						<div className="flex items-center gap-2">
							{activity.configuration.isGraded && (
								<Badge variant="secondary">Graded</Badge>
							)}
							<Badge>{activity.type.replace(/_/g, ' ')}</Badge>
						</div>
					</div>
				);
			}
			return <p className="text-sm">{content.type}: {content.content}</p>;
		} catch (e) {
			return <p className="text-sm">{content.type}: {content.content}</p>;
		}
	};

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className="p-4 bg-card rounded-lg border cursor-move hover:bg-accent/50 transition-colors"
			style={{
				transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
				transition,
			}}
		>
			{renderContent()}
		</div>
	);
};

export const CourseStructureEditor = ({ initialStructure, onSave }: CourseStructureEditorProps) => {
	const [structure, setStructure] = useState<CourseStructure>(initialStructure);


	const [showActivityModal, setShowActivityModal] = useState(false);
	const [currentUnitIndex, setCurrentUnitIndex] = useState<number>(0);
	const [currentSectionIndex, setCurrentSectionIndex] = useState<number | undefined>();
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
						{renderAddActivityButton(unitIndex, sectionIndex)}
					</div>
				))}
			</Card>
		));
	};

	const renderAddActivityButton = (unitIndex: number, sectionIndex?: number) => (
		<div className="mt-3">
			<Button 
				type="button" 
				onClick={() => {
					setCurrentUnitIndex(unitIndex);
					setCurrentSectionIndex(sectionIndex);
					setShowActivityModal(true);
				}}
				size="sm"
			>
				Add Activity
			</Button>
		</div>
	);

	const handleActivitySave = (activity: ActivityTemplate) => {
		setStructure(prev => {
			const newStructure = { ...prev };
			
			const newContent: ContentBlock = {
				id: activity.id,
				type: activity.type as ContentBlock['type'],
				content: JSON.stringify(activity),
				metadata: {}
			};
			
			if (prev.type === 'CHAPTER') {
				const units = prev.units as ChapterUnit[];
				if (typeof currentSectionIndex === 'number') {
					units[currentUnitIndex].sections[currentSectionIndex].content.push(newContent);
				}
			} else if (prev.type === 'BLOCK') {
				const units = prev.units as BlockUnit[];
				units[currentUnitIndex].content.push(newContent);
			} else if (prev.type === 'WEEKLY') {
				const units = prev.units as WeeklyUnit[];
				units[currentUnitIndex].dailyActivities[currentSectionIndex!].content.push(newContent);
			}

			return newStructure;
		});
	};

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
				{renderAddActivityButton(unitIndex)}
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
						{renderAddActivityButton(unitIndex, dayIndex)}
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

			<ActivityModal 
				open={showActivityModal}
				onOpenChange={setShowActivityModal}
				onSave={handleActivitySave}
			/>
		</div>
	);
};