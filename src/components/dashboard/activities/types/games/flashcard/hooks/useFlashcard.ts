import { useState, useCallback } from 'react';
import { FlashcardConfig } from '@/types/class-activity';
import { FlashcardState } from '../types';

interface UseFlashcardProps {
	config: FlashcardConfig;
	onSubmit?: (data: { completedCards: number; score: number; totalPoints: number }) => void;
}

export const useFlashcard = ({ config, onSubmit }: UseFlashcardProps) => {
	const [state, setState] = useState<FlashcardState>({
		currentIndex: 0,
		isFlipped: false,
		completedCards: []
	});

	const handleCardFlip = useCallback(() => {
		setState(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
	}, []);

	const handleNext = useCallback(() => {
		if (state.currentIndex < config.cards.length - 1) {
			setState(prev => ({
				...prev,
				currentIndex: prev.currentIndex + 1,
				isFlipped: false
			}));
		}
	}, [state.currentIndex, config.cards.length]);

	const handlePrevious = useCallback(() => {
		if (state.currentIndex > 0) {
			setState(prev => ({
				...prev,
				currentIndex: prev.currentIndex - 1,
				isFlipped: false
			}));
		}
	}, [state.currentIndex]);

	const markAsCompleted = useCallback(() => {
		setState(prev => {
			if (!prev.completedCards.includes(prev.currentIndex)) {
				return {
					...prev,
					completedCards: [...prev.completedCards, prev.currentIndex]
				};
			}
			return prev;
		});
	}, []);

	const handleSubmit = useCallback(() => {
		onSubmit?.({
			completedCards: state.completedCards.length,
			score: state.completedCards.length,
			totalPoints: config.cards.length
		});
	}, [state.completedCards.length, config.cards.length, onSubmit]);

	return {
		state,
		handlers: {
			handleCardFlip,
			handleNext,
			handlePrevious,
			markAsCompleted,
			handleSubmit
		}
	};
};