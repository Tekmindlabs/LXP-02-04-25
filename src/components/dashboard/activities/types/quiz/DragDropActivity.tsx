'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DragDropConfig } from '@/types/class-activity';

interface DragDropActivityProps {
	config: DragDropConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: { matches: Record<string, string>; score: number; totalPoints: number }) => void;
}

export function DragDropActivity({ config, viewType, onSubmit }: DragDropActivityProps) {
	const [matches, setMatches] = useState<Record<string, string>>({});

	const handleDragEnd = (result: any) => {
		if (!result.destination || viewType !== 'STUDENT') return;

		const { draggableId, destination } = result;
		setMatches(prev => ({
			...prev,
			[draggableId]: destination.droppableId
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
		<DragDropContext onDragEnd={handleDragEnd}>
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h3 className="font-medium mb-4">Items</h3>
					<Droppable droppableId="items">
						{(provided) => (
							<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
								{config.items.map((item, index) => (
									<Draggable
										key={item.draggableId}
										draggableId={item.draggableId}
										index={index}
										isDragDisabled={viewType === 'PREVIEW'}
									>
										{(provided) => (
											<Card
												ref={provided.innerRef}
												{...provided.draggableProps}
												{...provided.dragHandleProps}
												className="p-4 cursor-move"
											>
												{item.content}
											</Card>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
				</div>

				<div>
					<h3 className="font-medium mb-4">Drop Zones</h3>
					<div className="space-y-4">
						{config.dropZones.map((zone) => (
							<Droppable key={zone.zoneId} droppableId={zone.zoneId}>
								{(provided, snapshot) => (
									<div
										ref={provided.innerRef}
										{...provided.droppableProps}
										className={`p-4 border-2 rounded-lg min-h-[100px] ${
											snapshot.isDraggingOver ? 'border-primary' : 'border-dashed'
										}`}
									>
										<div className="font-medium mb-2">{zone.label}</div>
										{provided.placeholder}
									</div>
								)}
							</Droppable>
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
		</DragDropContext>
	);
}