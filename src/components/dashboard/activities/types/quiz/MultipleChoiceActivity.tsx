'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MultipleChoiceConfig } from '@/types/class-activity';

interface MultipleChoiceActivityProps {
	config: MultipleChoiceConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: { answers: number[]; score: number; totalPoints: number }) => void;
}

export function MultipleChoiceActivity({ config, viewType, onSubmit }: MultipleChoiceActivityProps) {
	const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

	const handleSubmit = () => {
		if (viewType === 'STUDENT') {
			const score = config.questions.reduce((total, q, idx) => {
				return total + (q.correctAnswer === selectedAnswers[idx] ? q.points : 0);
			}, 0);
			
			onSubmit?.({
				answers: selectedAnswers,
				score,
				totalPoints: config.totalPoints || config.questions.reduce((sum, q) => sum + q.points, 0)
			});
		}
	};

	return (
		<div className="space-y-6">
			{config.questions.map((question, qIdx) => (
				<Card key={qIdx} className="p-6">
					<div className="space-y-4">
						<div className="flex justify-between">
							<h3 className="font-medium">{question.text}</h3>
							<span className="text-sm text-muted-foreground">Points: {question.points}</span>
						</div>
						<RadioGroup
							value={selectedAnswers[qIdx]?.toString()}
							onValueChange={(value) => {
								const newAnswers = [...selectedAnswers];
								newAnswers[qIdx] = parseInt(value);
								setSelectedAnswers(newAnswers);
							}}
							disabled={viewType === 'PREVIEW'}
						>
							{question.options.map((option, optIdx) => (
								<div key={optIdx} className="flex items-center space-x-2">
									<RadioGroupItem value={optIdx.toString()} id={`q${qIdx}-opt${optIdx}`} />
									<Label htmlFor={`q${qIdx}-opt${optIdx}`}>{option}</Label>
								</div>
							))}
						</RadioGroup>
					</div>
				</Card>
			))}
			{viewType === 'STUDENT' && (
				<Button 
					onClick={handleSubmit}
					disabled={selectedAnswers.length !== config.questions.length}
					className="w-full"
				>
					Submit Answers
				</Button>
			)}
		</div>
	);
}