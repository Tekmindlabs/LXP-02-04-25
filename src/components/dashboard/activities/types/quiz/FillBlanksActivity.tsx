'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FillBlanksConfig } from '@/types/class-activity';

interface FillBlanksActivityProps {
	config: FillBlanksConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: { answers: Record<string, string>; score: number; totalPoints: number }) => void;
}

export function FillBlanksActivity({ config, viewType, onSubmit }: FillBlanksActivityProps) {
	const [answers, setAnswers] = useState<Record<string, string>>({});

	const handleSubmit = () => {
		if (viewType === 'STUDENT') {
			const score = config.blanks.reduce((total, blank) => {
				return total + (answers[blank.id]?.toLowerCase() === blank.correctAnswer.toLowerCase() ? 1 : 0);
			}, 0);

			onSubmit?.({
				answers,
				score,
				totalPoints: config.blanks.length
			});
		}
	};

	const renderText = () => {
		const parts = config.text.split(/(__\w+__)/g);
		return parts.map((part, idx) => {
			if (part.match(/__\w+__/)) {
				const blankId = part.replace(/__/g, '');
				const blank = config.blanks.find(b => b.id === blankId);
				
				return (
					<Input
						key={idx}
						type="text"
						value={answers[blankId] || ''}
						onChange={(e) => {
							setAnswers(prev => ({
								...prev,
								[blankId]: e.target.value
							}));
						}}
						disabled={viewType === 'PREVIEW'}
						className="inline-block w-32 mx-1"
						placeholder="..."
					/>
				);
			}
			return <span key={idx}>{part}</span>;
		});
	};

	return (
		<Card className="p-6">
			<div className="space-y-6">
				<div className="text-lg leading-relaxed">
					{renderText()}
				</div>
				
				{viewType === 'STUDENT' && (
					<Button
						onClick={handleSubmit}
						disabled={Object.keys(answers).length !== config.blanks.length}
						className="w-full"
					>
						Submit Answers
					</Button>
				)}
			</div>
		</Card>
	);
}