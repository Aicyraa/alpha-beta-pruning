
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

type TupleOf<T, N extends number, R extends T[] = []> =
    R['length'] extends N ? R : TupleOf<T, N, [...R, T]>

type Board = TupleOf<Cell, 9>

interface Move {
    move: Board_idx
    score: number
}

interface SearchStats {
    nodesVisited: number
    terminalNodes: number
    cutoffs: number
    skippedMoves: number
}

interface GameAnalytics {
    alphaBeta: SearchStats
    minimax: SearchStats
    nodesSaved: number
    reductionPercentage: number
}

const createStats = (): SearchStats => ({
    nodesVisited: 0,
    terminalNodes: 0,
    cutoffs: 0,
    skippedMoves: 0
})

export default class Game {
    human: Player = { score: 0, player: 'human', symbol: 'x' }
    ai: Player = { score: 0, player: 'ai', symbol: 'o' }

    #WINNING_PATTERN: Board_idx[][] = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ]

    #MOVE_ORDER: Board_idx[] = [4, 0, 2, 6, 8, 1, 3, 5, 7]

    board: Board = Array(9).fill(' ') as Board

    #analytics: GameAnalytics = {
        alphaBeta: createStats(),
        minimax: createStats(),
        nodesSaved: 0,
        reductionPercentage: 0
    }

    #hasWinner(board: Board, symbol: 'x' | 'o'): boolean {
        return this.#WINNING_PATTERN.some(([x, y, z]) => (
            board[x as Board_idx] === symbol &&
            board[y as Board_idx] === symbol &&
            board[z as Board_idx] === symbol
        ))
    }

    #isTie(board: Board): boolean {
        return board.every(slot => slot !== ' ')
    }

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

    #setBoardValue(idx: Board_idx, symbol: 'x' | 'o'): Winner {
        if (this.board[idx] !== ' ') {
            throw new Error('Occupied')
        }

        this.board[idx] = symbol

        return this.#checkWinner()
    }

    #getAvailableSlots(board: Board): Board_idx[] {
        return this.#MOVE_ORDER.filter(idx => board[idx] === ' ')
    }

    #evaluate(board: Board, depth: number): number | null {
        if (this.#hasWinner(board, 'o')) {
            return 10 - depth
        }

        if (this.#hasWinner(board, 'x')) {
            return depth - 10
        }

        if (this.#isTie(board)) {
            return 0
        }

        return null
    }

    #minimax(
        board: Board,
        depth: number,
        alpha: number,
        beta: number,
        maximizingPlayer: boolean,
        stats: SearchStats
    ): number {
        stats.nodesVisited++

        const terminalScore = this.#evaluate(board, depth)

        if (terminalScore !== null) {
            stats.terminalNodes++
            return terminalScore
        }

        let bestScore = maximizingPlayer ? -Infinity : Infinity

        const slots = this.#getAvailableSlots(board)

        for (let i = 0; i < slots.length; i++) {
            const idx = slots[i] as Board_idx

            board[idx] = maximizingPlayer ? 'o' : 'x'

            const score = this.#minimax(
                board,
                depth + 1,
                alpha,
                beta,
                !maximizingPlayer,
                stats
            )

            board[idx] = ' '

            if (maximizingPlayer) {
                bestScore = Math.max(bestScore, score)
                alpha = Math.max(alpha, bestScore)
            } else {
                bestScore = Math.min(bestScore, score)
                beta = Math.min(beta, bestScore)
            }

            if (beta <= alpha) {
                stats.cutoffs++
                stats.skippedMoves += slots.length - i - 1
                break
            }
        }

        return bestScore
    }

    #minimaxUnpruned(
        board: Board,
        depth: number,
        maximizingPlayer: boolean,
        stats: SearchStats
    ): number {
        stats.nodesVisited++

        const terminalScore = this.#evaluate(board, depth)

        if (terminalScore !== null) {
            stats.terminalNodes++
            return terminalScore
        }

        let bestScore = maximizingPlayer ? -Infinity : Infinity

        for (const idx of this.#getAvailableSlots(board)) {
            board[idx] = maximizingPlayer ? 'o' : 'x'

            const score = this.#minimaxUnpruned(
                board,
                depth + 1,
                !maximizingPlayer,
                stats
            )

            board[idx] = ' '

            bestScore = maximizingPlayer
                ? Math.max(bestScore, score)
                : Math.min(bestScore, score)
        }

        return bestScore
    }

    #aiStrike(board: Board): Board_idx {
        const moves: Move[] = []

        this.#analytics = {
            alphaBeta: createStats(),
            minimax: createStats(),
            nodesSaved: 0,
            reductionPercentage: 0
        }

        for (const idx of this.#getAvailableSlots(board)) {
            board[idx] = 'o'

            const baselineScore = this.#minimaxUnpruned(
                board,
                0,
                false,
                this.#analytics.minimax
            )

            const alphaBetaScore = this.#minimax(
                board,
                0,
                -Infinity,
                Infinity,
                false,
                this.#analytics.alphaBeta
            )

            board[idx] = ' '

            if (baselineScore !== alphaBetaScore) {
                throw new Error('Search algorithm mismatch')
            }

            moves.push({
                move: idx,
                score: alphaBetaScore
            })
        }

        const highestScore = Math.max(...moves.map(move => move.score))

        const bestMoves = moves.filter(
            move => move.score === highestScore
        )

        const selectedMove = bestMoves[
            Math.floor(Math.random() * bestMoves.length)
        ] as Move

        const alphaBetaNodes = this.#analytics.alphaBeta.nodesVisited
        const minimaxNodes = this.#analytics.minimax.nodesVisited

        this.#analytics.nodesSaved = minimaxNodes - alphaBetaNodes

        this.#analytics.reductionPercentage = minimaxNodes > 0
            ? (this.#analytics.nodesSaved / minimaxNodes) * 100
            : 0

        return selectedMove.move 
    }

    strike(idx: Board_idx): Winner | Error {
        try {
            const humanResult = this.#setBoardValue(idx, 'x')

            if (humanResult.gameStatus !== 'running') {
                return humanResult
            }

            const aiMove = this.#aiStrike(this.board)

            return this.#setBoardValue(aiMove, 'o')

        } catch (error: unknown) {
            if (error instanceof Error) {
                return error
            }

            return new Error('Unknown game error')
        }
    }

    getStatus(): Winner {
        return this.#checkWinner()
    }

    getBoard(): Board {
        return [...this.board] as Board
    }

    getAnalytics(): GameAnalytics {
        return {
            ...this.#analytics,
            alphaBeta: { ...this.#analytics.alphaBeta },
            minimax: { ...this.#analytics.minimax }
        }
    }

    reset(): void {
        this.board = Array(9).fill(' ') as Board

        this.#analytics = {
            alphaBeta: createStats(),
            minimax: createStats(),
            nodesSaved: 0,
            reductionPercentage: 0
        }
    }
}
