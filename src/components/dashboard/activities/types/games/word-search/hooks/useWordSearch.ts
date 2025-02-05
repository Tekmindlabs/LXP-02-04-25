import { useState, useCallback, useRef, useEffect } from 'react';
import { WordSearchConfig } from '@/types/class-activity';
import { Position, Selection, WordSearchGameState } from '../types';
import { generateGrid, calculateScore, getSelectedWord } from '../utils';

interface UseWordSearchProps {
	config: WordSearchConfig;
	onSubmit?: (data: { foundWords: string[]; score: number; timeSpent: number }) => void;
}

export const useWordSearch = ({ config, onSubmit }: UseWordSearchProps) => {
	const [grid, setGrid] = useState<string[][]>([]);
	const [foundWords, setFoundWords] = useState<string[]>([]);
	const [selection, setSelection] = useState<Selection | null>(null);
	const [startPos, setStartPos] = useState<Position | null>(null);
	const [timer, setTimer] = useState<number>(config.timeLimit || 0);
	const [gameStatus, setGameStatus] = useState<WordSearchGameState>('ready');
	const [score, setScore] = useState<number>(0);
	const [currentCell, setCurrentCell] = useState<[number, number]>([0, 0]);

	const gridRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const elementSize = useRef<number>(40);

	const handleGameStart = useCallback(() => {
		setGameStatus('playing');
		setFoundWords([]);
		setTimer(config.timeLimit || 0);
		const newGrid = generateGrid(config);
		setGrid(newGrid);
	}, [config]);

	const handleGameComplete = useCallback(() => {
		setGameStatus('completed');
		if (onSubmit) {
			onSubmit({
				foundWords,
				score: (foundWords.length / config.words.length) * 100,
				timeSpent: config.timeLimit ? config.timeLimit - timer : 0
			});
		}
	}, [foundWords, config.words.length, config.timeLimit, timer, onSubmit]);

	const drawSelection = useCallback((start: Position, end: Position) => {
		const ctx = canvasRef.current?.getContext('2d');
		if (!ctx || !gridRef.current) return;

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.beginPath();
		ctx.strokeStyle = 'rgba(107,177,125,0.4)';
		ctx.lineWidth = Math.floor(elementSize.current / 2);
		ctx.moveTo(start.x + elementSize.current / 2, start.y + elementSize.current / 2);
		ctx.lineTo(end.x + elementSize.current / 2, end.y + elementSize.current / 2);
		ctx.stroke();
	}, []);

	const handleCellMouseDown = useCallback((row: number, col: number, x: number, y: number) => {
		if (gameStatus !== 'playing') return;
		const pos: Position = { row, col, x, y };
		setStartPos(pos);
		setSelection({ start: pos, end: pos, word: grid[row][col] });
	}, [gameStatus, grid]);

	const handleCellMouseMove = useCallback((row: number, col: number, x: number, y: number) => {
		if (!startPos || gameStatus !== 'playing') return;
		const pos: Position = { row, col, x, y };
		const word = getSelectedWord(startPos, pos, grid);
		if (word) {
			setSelection({ start: startPos, end: pos, word });
			drawSelection(startPos, pos);
		}
	}, [startPos, gameStatus, grid, drawSelection]);

	const handleCellMouseUp = useCallback((row: number, col: number) => {
		if (!startPos || !selection || gameStatus !== 'playing') return;
		const endPos: Position = { row, col, x: col * elementSize.current, y: row * elementSize.current };
		const selectedWord = getSelectedWord(startPos, endPos, grid);
		
		if (selectedWord && config.words.includes(selectedWord)) {
			setFoundWords(prev => {
				if (!prev.includes(selectedWord)) {
					const newScore = calculateScore(selectedWord, timer, config.timeLimit || 0);
					setScore(s => s + newScore);
					if (prev.length + 1 === config.words.length) {
						handleGameComplete();
					}
					return [...prev, selectedWord];
				}
				return prev;
			});
		}
		setStartPos(null);
		setSelection(null);
		const ctx = canvasRef.current?.getContext('2d');
		ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	}, [startPos, selection, gameStatus, config.words, grid, handleGameComplete, timer, config.timeLimit]);

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
	}, [gameStatus, timer, handleGameComplete]);

	const handleCellTouchStart = useCallback((row: number, col: number, x: number, y: number) => {
		if (gameStatus !== 'playing') return;
		const pos: Position = { row, col, x, y };
		setStartPos(pos);
		setSelection({ start: pos, end: pos, word: grid[row][col] });
	}, [gameStatus, grid]);

	const handleCellTouchMove = useCallback((row: number, col: number, x: number, y: number, touch: Touch) => {
		if (!startPos || gameStatus !== 'playing') return;
		
		const gridRect = gridRef.current?.getBoundingClientRect();
		if (!gridRect) return;

		// Calculate the cell position from touch coordinates
		const touchX = touch.clientX - gridRect.left;
		const touchY = touch.clientY - gridRect.top;
		const cellCol = Math.floor(touchX / elementSize.current);
		const cellRow = Math.floor(touchY / elementSize.current);

		if (cellRow >= 0 && cellRow < grid.length && cellCol >= 0 && cellCol < grid[0].length) {
			const pos: Position = { row: cellRow, col: cellCol, x, y };
			const word = getSelectedWord(startPos, pos, grid);
			if (word) {
				setSelection({ start: startPos, end: pos, word });
				drawSelection(startPos, pos);
			}
		}
	}, [startPos, gameStatus, grid, drawSelection]);

	const handleCellTouchEnd = useCallback((row: number, col: number) => {
		handleCellMouseUp(row, col);
	}, [handleCellMouseUp]);

	const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
		if (gameStatus !== 'playing') return;

		const [currentRow, currentCol] = currentCell;
		let newRow = currentRow;
		let newCol = currentCol;

		switch (e.key) {
			case 'ArrowUp':
				newRow = Math.max(0, currentRow - 1);
				break;
			case 'ArrowDown':
				newRow = Math.min(grid.length - 1, currentRow + 1);
				break;
			case 'ArrowLeft':
				newCol = Math.max(0, currentCol - 1);
				break;
			case 'ArrowRight':
				newCol = Math.min(grid[0].length - 1, currentCol + 1);
				break;
			case 'Enter':
			case ' ':
				if (!startPos) {
					const pos: Position = { 
						row: currentRow, 
						col: currentCol, 
						x: currentCol * elementSize.current, 
						y: currentRow * elementSize.current 
					};
					setStartPos(pos);
					setSelection({ start: pos, end: pos, word: grid[currentRow][currentCol] });
				} else {
					const endPos: Position = { 
						row: currentRow, 
						col: currentCol, 
						x: currentCol * elementSize.current, 
						y: currentRow * elementSize.current 
					};
					const selectedWord = getSelectedWord(startPos, endPos, grid);
					if (selectedWord && config.words.includes(selectedWord)) {
						setFoundWords(prev => {
							if (!prev.includes(selectedWord)) {
								const newScore = calculateScore(selectedWord, timer, config.timeLimit || 0);
								setScore(s => s + newScore);
								if (prev.length + 1 === config.words.length) {
									handleGameComplete();
								}
								return [...prev, selectedWord];
							}
							return prev;
						});
					}
					setStartPos(null);
					setSelection(null);
					const ctx = canvasRef.current?.getContext('2d');
					ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				}
				break;
			case 'Escape':
				setStartPos(null);
				setSelection(null);
				const ctx = canvasRef.current?.getContext('2d');
				ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				break;
		}

		setCurrentCell([newRow, newCol]);
		e.preventDefault();
	}, [currentCell, gameStatus, grid, startPos, config.words, timer, config.timeLimit, handleGameComplete]);

	return {
		grid,
		gridRef,
		canvasRef,
		gameStatus,
		timer,
		score,
		foundWords,
		elementSize,
		handleGameStart,
		handleGameComplete,
		handleCellMouseDown,
		handleCellMouseMove,
		handleCellMouseUp,
		handleCellTouchStart,
		handleCellTouchMove,
		handleCellTouchEnd,
		handleKeyNavigation
	};
};