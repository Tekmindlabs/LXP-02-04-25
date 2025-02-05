'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DragDropConfig } from '@/types/class-activity';

interface DragDropActivityProps {
	config: DragDropConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: { matches: Record<string, string>; score: number; totalPoints: number }) => void;
}

interface DraggableItemProps {
	id: string;
	content: string;
	disabled?: boolean;
}

interface DroppableZoneProps {
	id: string;
	label: string;
	isMatched: boolean;
}

function DraggableItem({ id, content, disabled }: DraggableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ id, disabled });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className="p-4 cursor-move"
			{...attributes}
			{...listeners}
		>
			{content}
		</Card>
	);
}

function DroppableZone({ id, label, isMatched }: DroppableZoneProps) {
	const { setNodeRef, isOver } = useDroppable({ id });

	return (
		<Card
			ref={setNodeRef}
			className={`p-4 border-2 rounded-lg min-h-[100px] transition-colors ${
				isOver ? 'border-primary bg-primary/10' : isMatched ? 'border-primary' : 'border-dashed'
			}`}
		>
			<div className="font-medium mb-2">{label}</div>
		</Card>
	);
}

export function DragDropActivity({ config, viewType, onSubmit }: DragDropActivityProps) {
	const [matches, setMatches] = useState<Record<string, string>>({});
	const sensors = useSensors(useSensor(PointerSensor));

	const handleDragEnd = (event: DragEndEvent) => {
		if (!event.over || viewType !== 'STUDENT') return;

		const { active, over } = event;
		setMatches(prev => ({
			...prev,
			[active.id as string]: over.id as string
		}));
	};

	const handleSubmit = () => {
		if (viewType === 'STUDENT') {
			const score = config.items.reduce((total, item) => {
				return total + (matches[item.draggableId] === item.correctZoneId ? 1 : 0);
			}, 0);

			onSubmit?.({
				matches,
				score,
				totalPoints: config.items.length
			});
		}
	};

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h3 className="font-medium mb-4">Items</h3>
					<SortableContext items={config.items.map(item => item.draggableId)}>
						<div className="space-y-2">
							{config.items.map((item) => (
								<DraggableItem
									key={item.draggableId}
									id={item.draggableId}
									content={item.content}
									disabled={viewType === 'PREVIEW'}
								/>
							))}
						</div>
					</SortableContext>
				</div>

				<div>
					<h3 className="font-medium mb-4">Drop Zones</h3>
					<div className="space-y-4">
						{config.dropZones.map((zone) => (
							<DroppableZone
								key={zone.zoneId}
								id={zone.zoneId}
								label={zone.label}
								isMatched={Object.values(matches).includes(zone.zoneId)}
							/>
						))}
					</div>
				</div>
			</div>

			{viewType === 'STUDENT' && (
				<Button
					onClick={handleSubmit}
					disabled={Object.keys(matches).length !== config.items.length}
					className="w-full mt-6"
				>
					Submit Answers
				</Button>
			)}
		</DndContext>
	);
}