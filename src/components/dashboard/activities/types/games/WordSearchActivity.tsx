'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WordSearchConfig } from '@/types/class-activity';

interface WordSearchActivityProps {
	config: WordSearchConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: { foundWords: string[]; score: number; timeSpent: number }) => void;
}

interface Position {
	row: number;
	col: number;
}

interface Selection {
	start: Position;
	end: Position;
	word: string;
}

const getDirections = (orientations: WordSearchConfig['orientations']) => {
	const directions: [number, number][] = [];
	if (orientations.horizontal) directions.push([0, 1]);
	if (orientations.vertical) directions.push([1, 0]);
	if (orientations.diagonal) directions.push([1, 1]);
	if (orientations.reverseHorizontal) directions.push([0, -1]);
	if (orientations.reverseVertical) directions.push([-1, 0]);
	if (orientations.reverseDiagonal) directions.push([-1, -1]);
	return directions;
};

export function WordSearchActivity({ config, viewType, onSubmit }: WordSearchActivityProps) {
	const [grid, setGrid] = useState<string[][]>([]);
	const [foundWords, setFoundWords] = useState<string[]>([]);
	const [selection, setSelection] = useState<Selection | null>(null);
	const [startPos, setStartPos] = useState<Position | null>(null);
	const [timer, setTimer] = useState<number>(config.timeLimit || 0);
	const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'completed'>('ready');

	const generateGrid = useCallback(() => {
		const { rows, cols } = config.gridSize;
		const grid = Array(rows).fill('').map(() => Array(cols).fill(''));
		const directions = getDirections(config.orientations);
		
		// Place words in grid
		config.words.forEach(word => {
			let placed = false;
			let attempts = 0;
			const maxAttempts = 100;

			while (!placed && attempts < maxAttempts) {
				const direction = directions[Math.floor(Math.random() * directions.length)];
				const [dx, dy] = direction;
				const startX = Math.floor(Math.random() * rows);
				const startY = Math.floor(Math.random() * cols);
				
				if (canPlaceWord(grid, word, startX, startY, dx, dy)) {
					placeWord(grid, word, startX, startY, dx, dy);
					placed = true;
				}
				attempts++;
			}
		});

		// Fill empty spaces with random letters if enabled
		if (config.fillRandomLetters) {
			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					if (grid[i][j] === '') {
						grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
					}
				}
			}
		}

		return grid;
	}, [config]);

	const canPlaceWord = (grid: string[][], word: string, x: number, y: number, dx: number, dy: number): boolean => {
		const { rows, cols } = config.gridSize;
		const wordLength = word.length;

		// Check if word fits within grid bounds
		if (
			x + dx * (wordLength - 1) >= rows || x + dx * (wordLength - 1) < 0 ||
			y + dy * (wordLength - 1) >= cols || y + dy * (wordLength - 1) < 0
		) {
			return false;
		}

		// Check if path is clear or matches word letters
		for (let i = 0; i < wordLength; i++) {
			const currentX = x + dx * i;
			const currentY = y + dy * i;
			const currentCell = grid[currentX][currentY];
			if (currentCell !== '' && currentCell !== word[i].toUpperCase()) {
				return false;
			}
		}
		return true;
	};

	const placeWord = (grid: string[][], word: string, x: number, y: number, dx: number, dy: number) => {
		for (let i = 0; i < word.length; i++) {
			grid[x + dx * i][y + dy * i] = word[i].toUpperCase();
		}
	};

	useEffect(() => {
		if (gameStatus === 'playing') {
			setGrid(generateGrid());
		}
	}, [gameStatus, generateGrid]);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (gameStatus === 'playing' && timer > 0) {
			interval = setInterval(() => {
				setTimer(prev => {
					if (prev <= 1) {
						handleGameComplete();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [gameStatus, timer]);

	const handleCellMouseDown = (row: number, col: number) => {
		if (gameStatus !== 'playing') return;
		setStartPos({ row, col });
		setSelection(null);
	};

	const handleCellMouseUp = (row: number, col: number) => {
		if (!startPos || gameStatus !== 'playing') return;
		
		const selectedWord = getSelectedWord(startPos, { row, col });
		if (selectedWord && config.words.includes(selectedWord)) {
			setFoundWords(prev => [...prev, selectedWord]);
			if (foundWords.length + 1 === config.words.length) {
				handleGameComplete();
			}
		}
		setStartPos(null);
	};

	const getSelectedWord = (start: Position, end: Position): string | null => {
		const dx = Math.sign(end.row - start.row);
		const dy = Math.sign(end.col - start.col);
		const length = Math.max(
			Math.abs(end.row - start.row),
			Math.abs(end.col - start.col)
		) + 1;

		let word = '';
		for (let i = 0; i < length; i++) {
			const row = start.row + dx * i;
			const col = start.col + dy * i;
			if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
				word += grid[row][col];
			}
		}
		return word;
	};

	const handleGameStart = () => {
		setGameStatus('playing');
		setFoundWords([]);
		setTimer(config.timeLimit || 0);
	};

	const handleGameComplete = () => {
		setGameStatus('completed');
		if (onSubmit) {
			onSubmit({
				foundWords,
				score: (foundWords.length / config.words.length) * 100,
				timeSpent: config.timeLimit ? config.timeLimit - timer : 0
			});
		}
	};

	return (
		<Card className="p-6">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<Button
						onClick={handleGameStart}
						disabled={gameStatus === 'playing'}
					>
						{gameStatus === 'ready' ? 'Start Game' : 'Restart'}
					</Button>
					{timer > 0 && (
						<div className="text-lg font-bold">
							Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
						</div>
					)}
				</div>

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
								onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
								onMouseUp={() => handleCellMouseUp(rowIndex, colIndex)}
								disabled={viewType !== 'STUDENT' || gameStatus !== 'playing'}
								className={`
									aspect-square flex items-center justify-center
									border border-gray-200 text-lg font-bold
									select-none cursor-pointer
									${startPos && selection?.start.row === rowIndex && selection?.start.col === colIndex ? 'bg-primary text-primary-foreground' : ''}
									${foundWords.some(word => word.toUpperCase().includes(cell)) ? 'bg-green-100' : ''}
									hover:bg-gray-100
								`}
							>
								{cell}
							</button>
						))
					)}
				</div>

				{config.showWordList && (
					<div className="flex flex-wrap gap-2">
						{config.words.map(word => (
							<Badge
								key={word}
								variant={foundWords.includes(word) ? "default" : "outline"}
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