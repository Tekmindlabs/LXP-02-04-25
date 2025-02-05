'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FlashcardConfig } from '@/types/class-activity';
import { useFlashcard } from './hooks/useFlashcard';

interface FlashcardActivityProps {
	config: FlashcardConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: { completedCards: number; score: number; totalPoints: number }) => void;
}

export function FlashcardActivity({ config, viewType, onSubmit }: FlashcardActivityProps) {
	const {
		state: { currentIndex, isFlipped, completedCards },
		handlers: {
			handleCardFlip,
			handleNext,
			handlePrevious,
			markAsCompleted,
			handleSubmit
		}
	} = useFlashcard({ config, onSubmit });

	return (
		<div className="space-y-6">
			<div className="flex justify-center">
				<Card
					className={`w-96 h-64 cursor-pointer perspective-1000 transition-transform duration-500 transform-style-preserve-3d 
						${isFlipped ? 'rotate-y-180' : ''}`}
					onClick={viewType !== 'PREVIEW' ? handleCardFlip : undefined}
				>
					<div className="absolute w-full h-full backface-hidden p-6 flex items-center justify-center text-lg">
						<p className="text-center">{config.cards[currentIndex].front}</p>
					</div>
					<div className="absolute w-full h-full backface-hidden rotate-y-180 p-6 flex items-center justify-center text-lg bg-primary text-primary-foreground">
						<p className="text-center">{config.cards[currentIndex].back}</p>
					</div>
				</Card>
			</div>

			<div className="flex justify-center space-x-4">
				<Button onClick={handlePrevious} disabled={currentIndex === 0}>
					Previous
				</Button>
				{viewType === 'STUDENT' && (
					<Button onClick={markAsCompleted} variant="secondary">
						Mark as Known
					</Button>
				)}
				<Button onClick={handleNext} disabled={currentIndex === config.cards.length - 1}>
					Next
				</Button>
			</div>

			<div className="flex justify-center">
				<p className="text-sm text-muted-foreground">
					Card {currentIndex + 1} of {config.cards.length}
				</p>
			</div>

			{viewType === 'STUDENT' && (
				<Button
					onClick={handleSubmit}
					disabled={completedCards.length === 0}
					className="w-full"
				>
					Complete Practice
				</Button>
			)}
		</div>
	);
}