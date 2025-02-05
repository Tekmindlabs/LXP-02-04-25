export interface Position {
	row: number;
	col: number;
	x: number;
	y: number;
}

export interface Selection {
	start: Position;
	end: Position;
	word: string;
}

export type WordSearchGameState = 'ready' | 'playing' | 'completed';