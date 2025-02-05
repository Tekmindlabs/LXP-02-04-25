'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WordSearchConfig } from '@/types/class-activity';
import { useWordSearch } from './hooks/useWordSearch';
import { useEffect } from 'react';

interface WordSearchActivityProps {
	config: WordSearchConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: { foundWords: string[]; score: number; timeSpent: number }) => void;
}

export function WordSearchActivity({ config, viewType, onSubmit }: WordSearchActivityProps) {
	const {
		grid,
		gridRef,
		canvasRef,
		gameStatus,
		timer,
		score,
		foundWords,
		handleGameStart,
		handleGameComplete,
		handleCellMouseDown,
		handleCellMouseMove,
		handleCellMouseUp,
		elementSize,
		handleCellTouchStart,
		handleCellTouchMove,
		handleCellTouchEnd,
		handleKeyNavigation
	} = useWordSearch({ config, onSubmit });

	useEffect(() => {
		const announceGameStatus = () => {
			const announcement = gameStatus === 'playing' 
				? `Game started. Find ${config.words.length} words. ${foundWords.length} words found.`
				: gameStatus === 'completed'
				? `Game completed! You found ${foundWords.length} out of ${config.words.length} words.`
				: 'Press Start Game to begin';
			
			const announcer = document.getElementById('game-announcer');
			if (announcer) announcer.textContent = announcement;
		};

		announceGameStatus();
	}, [gameStatus, foundWords.length, config.words.length]);

	return (
		<Card className="p-6">
			<div 
				className="space-y-6"
				role="application"
				aria-label="Word Search Game"
			>
				<div 
					id="game-announcer" 
					className="sr-only" 
					role="status" 
					aria-live="polite"
				></div>
				<div className="flex justify-between items-center">
					<Button
						onClick={handleGameStart}
						disabled={gameStatus === 'playing'}
					>
						{gameStatus === 'ready' ? 'Start Game' : 'Restart'}
					</Button>
					<div className="flex gap-4">
						<div className="text-lg font-bold">
							Score: {score}
						</div>
						{timer > 0 && (
							<div className="text-lg font-bold">
								Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
							</div>
						)}
					</div>
				</div>

				<div 
					ref={gridRef}
					className="relative"
					role="grid"
					aria-label="Word Search Grid"
					tabIndex={0}
				>
					<canvas
						ref={canvasRef}
						className="absolute inset-0 pointer-events-none"
						width={config.gridSize.cols * elementSize.current}
						height={config.gridSize.rows * elementSize.current}
					/>
					<div 
						className="grid gap-1" 
						style={{ 
							gridTemplateColumns: `repeat(${config.gridSize.cols}, minmax(30px, 1fr))` 
						}}
					>
						{grid.map((row, rowIndex) =>
							row.map((cell, colIndex) => (
								<button
									key={`${rowIndex}-${colIndex}`}
									role="gridcell"
									aria-selected={false}
									aria-label={`Letter ${cell} at row ${rowIndex + 1}, column ${colIndex + 1}`}
									onMouseDown={(e) => {
										const rect = e.currentTarget.getBoundingClientRect();
										handleCellMouseDown(rowIndex, colIndex, rect.left, rect.top);
									}}
									onMouseMove={(e) => {
										const rect = e.currentTarget.getBoundingClientRect();
										handleCellMouseMove(rowIndex, colIndex, rect.left, rect.top);
									}}
									onMouseUp={() => handleCellMouseUp(rowIndex, colIndex)}
									disabled={viewType !== 'STUDENT' || gameStatus !== 'playing'}
									className={`
										aspect-square flex items-center justify-center
										border border-gray-200 text-lg font-bold
										select-none cursor-pointer
										${foundWords.some(word => word.toUpperCase().includes(cell)) ? 'bg-green-100' : ''}
										hover:bg-gray-100
										focus:outline-none focus:ring-2 focus:ring-primary
									`}
								>
									{cell}
								</button>
							))
						)}
					</div>
				</div>

				{config.showWordList && (
					<div className="flex flex-wrap gap-2" role="list" aria-label="Word List">
						{config.words.map(word => (
							<Badge
								key={word}
								variant={foundWords.includes(word) ? "default" : "outline"}
								role="listitem"
								aria-label={`${word} ${foundWords.includes(word) ? 'found' : 'not found'}`}
							>
								{word}
							</Badge>
						))}
					</div>
				)}

				{viewType === 'STUDENT' && gameStatus === 'playing' && (
					<Button
						onClick={handleGameComplete}
						className="w-full"
					>
						Submit
					</Button>
				)}
			</div>
		</Card>
	);
}