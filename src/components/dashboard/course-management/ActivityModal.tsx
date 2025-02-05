'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ActivityType, ActivityTemplate, ActivityConfiguration } from '../../../types/class-activity';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';

interface ActivityModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (activity: ActivityTemplate) => void;
}

const activityGroups = {
	'Assessment': ['QUIZ_MULTIPLE_CHOICE', 'QUIZ_DRAG_DROP', 'QUIZ_FILL_BLANKS', 'QUIZ_TRUE_FALSE'],
	'Games': ['GAME_WORD_SEARCH', 'GAME_CROSSWORD', 'GAME_FLASHCARDS'],
	'Media': ['VIDEO_YOUTUBE'],
	'Reading': ['READING']
} as const;

export function ActivityModal({ open, onOpenChange, onSave }: ActivityModalProps) {
	const [step, setStep] = useState<'type' | 'config'>('type');
	const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
	const [config, setConfig] = useState<Partial<ActivityConfiguration>>({
		isGraded: false,
		gradingType: 'NONE',
		viewType: 'CONFIGURATION'
	});
	const [title, setTitle] = useState('');

	const handleTypeSelect = (type: ActivityType) => {
		setSelectedType(type);
		setStep('config');
	};

	const handleSave = () => {
		if (!selectedType || !title) return;

		const activity: ActivityTemplate = {
			id: crypto.randomUUID(),
			type: selectedType,
			title,
			configuration: {
				...config,
				isGraded: config.isGraded ?? false,
				gradingType: config.gradingType ?? 'NONE',
				viewType: 'CONFIGURATION'
			}
		};

		onSave(activity);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{step === 'type' ? 'Select Activity Type' : 'Configure Activity'}</DialogTitle>
				</DialogHeader>

				{step === 'type' ? (
					<Tabs defaultValue="Assessment">
						<TabsList className="grid w-full grid-cols-4">
							{Object.keys(activityGroups).map(group => (
								<TabsTrigger key={group} value={group}>{group}</TabsTrigger>
							))}
						</TabsList>
						{Object.entries(activityGroups).map(([group, types]) => (
							<TabsContent key={group} value={group}>
								<div className="grid grid-cols-2 gap-4">
									{types.map(type => (
										<Card key={type} className="p-4 cursor-pointer hover:bg-accent" onClick={() => handleTypeSelect(type)}>
											{type.replace(/_/g, ' ')}
										</Card>
									))}
								</div>
							</TabsContent>
						))}
					</Tabs>
				) : (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Title</Label>
							<Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Activity title" />
						</div>
						
						<div className="space-y-2">
							<Label>Description</Label>
							<Textarea placeholder="Activity description" onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))} />
						</div>

						<div className="flex items-center space-x-2">
							<Switch id="graded" checked={config.isGraded} onCheckedChange={checked => setConfig(prev => ({ ...prev, isGraded: checked }))} />
							<Label htmlFor="graded">Graded Activity</Label>
						</div>

						{config.isGraded && (
							<div className="space-y-2">
								<Label>Total Points</Label>
								<Input type="number" onChange={e => setConfig(prev => ({ ...prev, totalPoints: Number(e.target.value) }))} />
							</div>
						)}

						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={() => setStep('type')}>Back</Button>
							<Button onClick={handleSave}>Create Activity</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);

	}
