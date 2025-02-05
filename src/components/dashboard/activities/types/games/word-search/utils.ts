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
	if (orientations.diagonal) {
		directions.push([1, 1]);   // diagonal down-right
		directions.push([1, -1]);  // diagonal down-left
	}
	if (orientations.reverseHorizontal) directions.push([0, -1]);
	if (orientations.reverseVertical) directions.push([-1, 0]);
	if (orientations.reverseDiagonal) {
		directions.push([-1, -1]); // diagonal up-left
		directions.push([-1, 1]);  // diagonal up-right
	}
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

const placeWord = (grid: string[][], word: string, config: WordSearchConfig): boolean => {
	const directions = getDirections(config.orientations);
	const rows = grid.length;
	const cols = grid[0].length;
	const attempts = config.difficulty === 'hard' ? 150 : 100;
	
	// Sort positions by potential overlap for better placement
	const positions = [];
	for (let x = 0; x < rows; x++) {
		for (let y = 0; y < cols; y++) {
			for (const [dx, dy] of directions) {
				if (canPlaceWordAtPosition(grid, word, x, y, dx, dy)) {
					const overlap = calculateOverlap(grid, word, x, y, dx, dy);
					positions.push({ x, y, dx, dy, overlap });
				}
			}
		}
	}

	// Sort by overlap (higher overlap first for hard difficulty)
	positions.sort((a, b) => config.difficulty === 'hard' ? 
		b.overlap - a.overlap : 
		a.overlap - b.overlap
	);

	// Try placing the word at the best position
	for (const pos of positions.slice(0, attempts)) {
		if (placeWordAtPosition(grid, word, pos.x, pos.y, pos.dx, pos.dy)) {
			return true;
		}
	}

	return false;
};

export const generateGrid = (config: WordSearchConfig): string[][] => {
	const { rows, cols } = config.gridSize;
	const grid = Array(rows).fill('').map(() => Array(cols).fill(''));
	
	// Sort words by length and complexity
	const words = [...config.words].sort((a, b) => {
		const lengthDiff = b.length - a.length;
		if (lengthDiff !== 0) return lengthDiff;
		// Secondary sort by character complexity
		return b.split('').filter(c => /[JQXZ]/i.test(c)).length - 
					 a.split('').filter(c => /[JQXZ]/i.test(c)).length;
	});

	// Place words with improved algorithm
	for (const word of words) {
		if (!placeWord(grid, word.toUpperCase(), config)) {
			console.warn(`Could not place word: ${word}`);
		}
	}

	// Fill empty spaces with weighted random letters
	if (config.fillRandomLetters) {
		const commonLetters = 'AEIOURSTN';
		const uncommonLetters = 'BCDFGHJKLMPQVWXYZ';
		
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				if (grid[i][j] === '') {
					const useCommon = Math.random() < 0.7;
					const letterPool = useCommon ? commonLetters : uncommonLetters;
					grid[i][j] = letterPool[Math.floor(Math.random() * letterPool.length)];
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