interface Player {
	score: number
	player: 'human' | 'ai'
	symbol: 'x' | 'o'
}

type Winner =
	| { winner: Player; gameStatus: 'winner' }
	| { winner: null; gameStatus: 'tie' | 'running' }

type Board_idx = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

type Cell = 'x' | 'o' | ' '

type TupleOf<T, N extends number, R extends T[] = []> = R['length'] extends N
	? R
	: TupleOf<T, N, [...R, T]>

type Board = TupleOf<Cell, 9>

interface Move {
	move: Board_idx
	score: number
}

export default class Game {
	human = { score: 0, player: 'human', symbol: 'x' } as const
	ai = { score: 0, player: 'ai', symbol: 'o' } as const

	#WINNING_PATTERN: number[][] = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6]
	]

	board: Board = Array(9).fill(' ') as Board

	#printBoard() {
		console.log(this.board)
	}

	// Check whether a player has won
	#hasWinner(board: Board, symbol: 'x' | 'o'): boolean {
		return this.#WINNING_PATTERN.some(pattern => {
			const [x, y, z] = pattern

			return (
				board[x as Board_idx] === symbol &&
				board[y as Board_idx] === symbol &&
				board[z as Board_idx] === symbol
			)
		})
	}

	// Check whether the board is full
	#isTie(board: Board): boolean {
		return board.every(slot => slot !== ' ')
	}

	// Determine the current game status
	#checkWinner(): Winner {
		if (this.#hasWinner(this.board, 'x')) {
			return { winner: this.human, gameStatus: 'winner' }
		}

		if (this.#hasWinner(this.board, 'o')) {
			return { winner: this.ai, gameStatus: 'winner' }
		}

		if (this.#isTie(this.board)) {
			return { winner: null, gameStatus: 'tie' }
		}

		return { winner: null, gameStatus: 'running' }
	}

	// Place a symbol on the board
	#setBoardValue(idx: Board_idx, symbol: 'x' | 'o'): Winner {
		if (this.board[idx] !== ' ') {
			console.warn('Slot is not empty!')
			throw new Error('Occupied')
		}

		this.board[idx] = symbol

		return this.#checkWinner()
	}

	// Get all available board positions
	#getAvailableSlots(board: Board, isMaximizing: boolean): Board_idx[] {
		return board
			.map((val, idx) => (val === ' ' ? idx : -1))
			.filter((val): val is Board_idx => val !== -1)
.sort((a, b) => isMaximizing ? b - a : a - b);
	}

	// Minimax algorithm
	#minimax(
		board: Board,
		depth: number,
		alpha: number,
		beta: number,
		maximizingPlayer: boolean
	): number {
		// Terminal state evaluation
		if (this.#hasWinner(board, 'o')) {
			return 10 - depth
		}

		if (this.#hasWinner(board, 'x')) {
			return depth - 10
		}

		if (this.#isTie(board)) {
			return 0
		}

		// Determine which player is making a move
		let bestScore = maximizingPlayer ? -Infinity : Infinity

		// Explore all available moves
		for (const SLOT_IDX of this.#getAvailableSlots(board, maximizingPlayer)) {
			// AI maximizes, human minimizes
			board[SLOT_IDX] = maximizingPlayer ? 'o' : 'x'

			// Recursively evaluate the next move
			const score = this.#minimax(
				board,
				depth + 1,
				alpha,
				beta,
				!maximizingPlayer
			)

			// Undo the simulated move
			board[SLOT_IDX] = ' '

			// Select the best score
			bestScore = maximizingPlayer
				? Math.max(bestScore, score)
				: Math.min(bestScore, score)

			maximizingPlayer
				? (alpha = Math.max(alpha, score))
				: (beta = Math.min(beta, score))

            if (beta <= alpha) {
                break
            }
		}

		return bestScore
	}

	// AI chooses its best move
	#aiStrike(board: Board): Board_idx {
		const MOVES = [] as Move[]

		for (const SLOT_IDX of this.#getAvailableSlots(board, true)) {
			// Simulate AI move
			board[SLOT_IDX] = 'o'

			// Evaluate the resulting position
			const score = this.#minimax(board, 0, -Infinity, Infinity, false)

			// Undo simulated move
			board[SLOT_IDX] = ' '

			MOVES.push({ move: SLOT_IDX, score: score })
		}

		// get the indexes with highest possible score, if multiple scores (highest) are equal then choose ranomy
		
        console.log(MOVES);
        
        
        const HIGH_SCORE = Math.max(...MOVES.map(move_obj => move_obj.score))
        const HIGHEST_SCORES = MOVES.filter(
			move_obj => move_obj.score == HIGH_SCORE
		).map(move_obj => move_obj.move)

		return HIGHEST_SCORES[Math.floor(Math.random() * (HIGHEST_SCORES.length - 1))] as Board_idx
	}

	// Public method: Human makes a move
	strike(idx: Board_idx): Winner | Error {
		try {
			// Human move
			const humanResult = this.#setBoardValue(idx, 'x')

			this.#printBoard()

			// Stop if human wins or game ties
			if (humanResult.gameStatus !== 'running') {
				return humanResult
			}

			// AI move
			const aiMove = this.#aiStrike(this.board)

			const aiResult = this.#setBoardValue(aiMove, 'o')

			console.log('------------------------------')

			this.#printBoard()

			return aiResult
		} catch (e: unknown) {
			if (e instanceof Error) {
				return e
			}

			return new Error('Unknown game error')
		}
	}

	// Public method: Get current game status
	getStatus(): Winner {
		return this.#checkWinner()
	}

	// Public method: Reset the board
	reset(): void {
		this.board = Array(9).fill(' ') as Board
	}
}
