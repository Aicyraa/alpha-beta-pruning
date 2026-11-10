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

	// board = Array(9).fill(' ') as Board
	board = ['x', 'o', ' ', 'x', 'o', 'x', 'o', ' ', ' '] as Board

	#printBoard() {
		console.log(this.board)
	}

	#isTie(board: Board, winnerPlayer: Player | undefined) {
		const EMPTY_SLOT: Array<' '> = board.filter(slot => slot == ' ')

		if (winnerPlayer == undefined && EMPTY_SLOT.length == 0) {
			return true
		} else {
			return false
		}
	}

	#checkWinner(symbol: 'x' | 'o'): Winner {
		let winnerPlayer: Player | undefined = undefined

		this.#WINNING_PATTERN.forEach(pattern => {
			const b = this.board
			const [x, y, z]: any = pattern

			if (b[x] == symbol && b[y] == b[x] && b[z] == b[x]) {
				winnerPlayer = symbol === 'x' ? this.human : this.ai
                console.log(winnerPlayer);
				return
			}
		})

        if (this.#isTie(this.board, winnerPlayer)) {
			return { winner: null, gameStatus: 'tie' }
		}

		return winnerPlayer === undefined
			? { winner: null, gameStatus: 'running' }
			: { winner: winnerPlayer as Player, gameStatus: 'winner' }
	}

	#setBoardValue(idx: Board_idx, symbol: 'x' | 'o') {
		if (this.board[idx] !== ' ') {
			console.warn('Slot is not empty!')
			throw new Error('Occupied')
		}

		this.board[idx] = symbol
		return this.#checkWinner(symbol)
	}

	/*
    
        AI HELPER
    
    */

	#getAvailableSlots(board: Board) {
		return board
			.map((val, idx) => (val == ' ' ? idx : -1))
			.filter(val => val !== -1)
	}

	#minimax(board: Board, depth: number, maximizingPlayer: boolean): number {
		const WIN_OBJ: Winner = this.#checkWinner(maximizingPlayer ? 'o' : 'x')

		if (WIN_OBJ.gameStatus == 'winner') {
			return WIN_OBJ.winner?.player == 'human' ? -10 : 10
		}

		if (WIN_OBJ.gameStatus === 'tie') {
			return 0
		}

		const MINIMAX_OBJECT = maximizingPlayer
			? {
					symbol: 'o',
					bestScore: -Infinity,
					mathFunc: Math.max
				}
			: {
					symbol: 'x',
					bestScore: +Infinity,
					mathFunc: Math.min
				}

		for (const SLOT_IDX of this.#getAvailableSlots(board)) {
			board[SLOT_IDX] = MINIMAX_OBJECT.symbol as 'o' | 'x'
			const score = this.#minimax(board, depth + 1, !maximizingPlayer)
			board[SLOT_IDX] = ' '

			MINIMAX_OBJECT.bestScore = MINIMAX_OBJECT.mathFunc(
				score,
				MINIMAX_OBJECT.bestScore
			)
		}

		return MINIMAX_OBJECT.bestScore
	}

	/*
    
        AI HELPER
    
    */

	#ai_strike(board: Board): Board_idx {
		debugger
		let bestScore = -Infinity
		let bestMove: Board_idx = 0

		for (const SLOT_IDX of this.#getAvailableSlots(this.board)) {
			board[SLOT_IDX] = 'o'
			const score = this.#minimax(board, 0, false)!
            console.log(SLOT_IDX, score);
            
			board[SLOT_IDX] = ' '

			if (bestScore < score) {
				bestScore = score
				bestMove = SLOT_IDX as Board_idx
			}
		}

		return bestMove
	}

	strike(idx: Board_idx) {
		try {
			const winner = this.#setBoardValue(idx, 'x') as Winner
			this.#printBoard()

			if (winner.gameStatus == 'running') {
				const index = this.#ai_strike(this.board)
				const winner = this.#setBoardValue(index as Board_idx, 'o')

				console.log('------------------------------')
				this.#printBoard()
				return winner
			}

			if (winner.gameStatus == 'winner' || winner.gameStatus == 'tie') {
				return winner
			}

			return
		} catch (e: unknown) {
			return e as Error
		}
	}
}
