'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WordSearchConfig } from '@/types/class-activity';

interface WordSearchActivityProps {
	config: WordSearchConfig;
	viewType: 'PREVIEW' | 'STUDENT' | 'CONFIGURATION';
	onSubmit?: (data: { foundWords: string[]; score: number; totalPoints: number }) => void;
}

function generateGrid(words: string[], size: number): string[][] {
	// Initialize grid with empty spaces
	const grid = Array(size).fill(null).map(() => Array(size).fill(''));
	const directions = [
		[0, 1],   // right
		[1, 0],   // down
		[1, 1],   // diagonal
	];

	// Place words in grid
	words.forEach(word => {
		let placed = false;
		while (!placed) {
			const direction = directions[Math.floor(Math.random() * directions.length)];
			const [dx, dy] = direction;
			const startX = Math.floor(Math.random() * size);
			const startY = Math.floor(Math.random() * size);

			if (canPlaceWord(grid, word, startX, startY, dx, dy, size)) {
				placeWord(grid, word, startX, startY, dx, dy);
				placed = true;
			}
		}
	});

	// Fill remaining spaces with random letters
	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			if (grid[i][j] === '') {
				grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
			}
		}
	}

	return grid;
}

function canPlaceWord(grid: string[][], word: string, x: number, y: number, dx: number, dy: number, size: number): boolean {
	if (x + dx * word.length >= size || y + dy * word.length >= size) return false;
	
	for (let i = 0; i < word.length; i++) {
		const currentX = x + dx * i;
		const currentY = y + dy * i;
		if (grid[currentX][currentY] !== '' && grid[currentX][currentY] !== word[i]) {
			return false;
		}
	}
	return true;
}

function placeWord(grid: string[][], word: string, x: number, y: number, dx: number, dy: number) {
	for (let i = 0; i < word.length; i++) {
		grid[x + dx * i][y + dy * i] = word[i].toUpperCase();
	}
}

export function WordSearchActivity({ config, viewType, onSubmit }: WordSearchActivityProps) {
	const [grid, setGrid] = useState<string[][]>([]);
	const [foundWords, setFoundWords] = useState<string[]>([]);
	const [selectedCells, setSelectedCells] = useState<string[]>([]);

	useEffect(() => {
		setGrid(generateGrid(config.words, config.gridSize));
	}, [config.words, config.gridSize]);

	const handleCellClick = (x: number, y: number) => {
		if (viewType !== 'STUDENT') return;

		const cellId = `${x}-${y}`;
		if (selectedCells.includes(cellId)) {
			setSelectedCells(prev => prev.filter(id => id !== cellId));
		} else {
			setSelectedCells(prev => [...prev, cellId]);
			checkForWord(x, y);
		}
	};

	const checkForWord = (x: number, y: number) => {
		const selectedWord = selectedCells.map(cell => {
			const [i, j] = cell.split('-').map(Number);
			return grid[i][j];
		}).join('');

		const word = config.words.find(w => 
			w.toUpperCase() === selectedWord || w.toUpperCase().split('').reverse().join('') === selectedWord
		);

		if (word && !foundWords.includes(word)) {
			setFoundWords(prev => [...prev, word]);
			setSelectedCells([]);
		}
	};

	const handleSubmit = () => {
		if (viewType === 'STUDENT') {
			onSubmit?.({
				foundWords,
				score: foundWords.length,
				totalPoints: config.words.length
			});
		}
	};

	return (
		<Card className="p-6">
			<div className="space-y-6">
				<div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}>
					{grid.map((row, x) =>
						row.map((cell, y) => (
							<button
								key={`${x}-${y}`}
								onClick={() => handleCellClick(x, y)}
								disabled={viewType === 'PREVIEW'}
								className={`w-8 h-8 flex items-center justify-center border rounded font-medium
									${selectedCells.includes(`${x}-${y}`) ? 'bg-primary text-primary-foreground' : ''}
									${foundWords.some(word => word.toUpperCase().includes(cell)) ? 'bg-green-100' : ''}
								`}
							>
								{cell}
							</button>
						))
					)}
				</div>

				<div className="flex flex-wrap gap-2">
					{config.words.map(word => (
						<span
							key={word}
							className={`px-2 py-1 border rounded ${
								foundWords.includes(word) ? 'bg-green-100' : ''
							}`}
						>
							{word}
						</span>
					))}
				</div>

				{viewType === 'STUDENT' && (
					<Button
						onClick={handleSubmit}
						disabled={foundWords.length !== config.words.length}
						className="w-full"
					>
						Submit Found Words
					</Button>
				)}
			</div>
		</Card>
	);
}