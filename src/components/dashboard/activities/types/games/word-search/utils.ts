import { Position } from './types';
import { WordSearchConfig } from '@/types/class-activity';

export const calculateOverlap = (grid: string[][], word: string, x: number, y: number, dx: number, dy: number): number => {
	let overlap = 0;
	for (let i = 0; i < word.length; i++) {
		const currentX = x + dx * i;
		const currentY = y + dy * i;
		if (grid[currentX]?.[currentY] === word[i].toUpperCase()) {
			overlap++;
		}
	}
	return overlap;
};

export const getDirections = (orientations: WordSearchConfig['orientations']): [number, number][] => {
	const directions: [number, number][] = [];
	if (orientations.horizontal) directions.push([0, 1]);
	if (orientations.vertical) directions.push([1, 0]);
	if (orientations.diagonal) directions.push([1, 1]);
	if (orientations.reverseHorizontal) directions.push([0, -1]);
	if (orientations.reverseVertical) directions.push([-1, 0]);
	if (orientations.reverseDiagonal) directions.push([-1, -1]);
	return directions;
};

const canPlaceWordAtPosition = (grid: string[][], word: string, x: number, y: number, dx: number, dy: number): boolean => {
	const rows = grid.length;
	const cols = grid[0].length;
	const wordLength = word.length;

	if (
		x + dx * (wordLength - 1) >= rows || x + dx * (wordLength - 1) < 0 ||
		y + dy * (wordLength - 1) >= cols || y + dy * (wordLength - 1) < 0
	) {
		return false;
	}

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

const placeWordAtPosition = (grid: string[][], word: string, x: number, y: number, dx: number, dy: number): boolean => {
	if (!canPlaceWordAtPosition(grid, word, x, y, dx, dy)) return false;
	for (let i = 0; i < word.length; i++) {
		grid[x + dx * i][y + dy * i] = word[i].toUpperCase();
	}
	return true;
};

export const generateGrid = (config: WordSearchConfig): string[][] => {
	const { rows, cols } = config.gridSize;
	const grid = Array(rows).fill('').map(() => Array(cols).fill(''));
	const directions = getDirections(config.orientations);
	
	const placeWord = (word: string): boolean => {
		let placed = false;
		let attempts = 0;
		let bestPlacement = { x: 0, y: 0, dx: 0, dy: 0, overlap: -1 };
		const maxAttempts = 100;

		while (!placed && attempts < maxAttempts) {
			const direction = directions[Math.floor(Math.random() * directions.length)];
			const [dx, dy] = direction;
			const startX = Math.floor(Math.random() * rows);
			const startY = Math.floor(Math.random() * cols);
			
			const overlap = calculateOverlap(grid, word, startX, startY, dx, dy);
			if (overlap >= 0 && (config.difficulty === 'hard' ? overlap > 0 : true)) {
				if (overlap > bestPlacement.overlap) {
					bestPlacement = { x: startX, y: startY, dx, dy, overlap };
				}
				if (overlap > 0 || attempts > maxAttempts / 2) {
					placeWordAtPosition(grid, word.toUpperCase(), bestPlacement.x, bestPlacement.y, bestPlacement.dx, bestPlacement.dy);
					placed = true;
				}
			}
			attempts++;
		}
		return placed;
	};

	config.words.sort((a, b) => b.length - a.length).forEach(word => {
		if (!placeWord(word)) {
			console.warn(`Could not place word: ${word}`);
		}
	});

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
};

export const calculateScore = (foundWord: string, timer: number, timeLimit: number): number => {
	const baseScore = foundWord.length * 10;
	const timeBonus = Math.max(0, Math.floor((timer / timeLimit) * 50));
	return baseScore + timeBonus;
};

export const getSelectedWord = (start: Position, end: Position, grid: string[][]): string => {
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