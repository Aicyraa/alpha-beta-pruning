
import Game from './lib/game.js'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

type Board = ReturnType<Game['getBoard']>
type Analytics = ReturnType<Game['getAnalytics']>

const game = new Game()

const rl = createInterface({
    input: stdin,
    output: stdout
})

function printBoard(board: Board | string[]): void {
    console.log('\n')

    for (let i = 0; i < 9; i += 3) {
        console.log(` ${board[i]} | ${board[i + 1]} | ${board[i + 2]} `)

        if (i < 6) {
            console.log('---+---+---')
        }
    }

    console.log('\n')
}

function printAnalytics(data: Analytics): void {
    const { alphaBeta, minimax } = data

    console.log('\n========== AI ANALYTICS ==========')

    console.log('Standard Minimax:')
    console.log(`Nodes visited: ${minimax.nodesVisited}`)
    console.log(`Terminal nodes: ${minimax.terminalNodes}`)

    console.log('\nAlpha-Beta Minimax:')
    console.log(`Nodes visited: ${alphaBeta.nodesVisited}`)
    console.log(`Terminal nodes: ${alphaBeta.terminalNodes}`)
    console.log(`Cutoffs: ${alphaBeta.cutoffs}`)
    console.log(`Skipped branches: ${alphaBeta.skippedMoves}`)

    console.log('\nOptimization:')
    console.log(`Nodes saved: ${data.nodesSaved}`)
    console.log(`Node reduction: ${data.reductionPercentage.toFixed(2)}%`)

    console.log('==================================\n')
}

async function gameLoop(): Promise<void> {
    console.log('========== TIC TAC TOE ==========')
    console.log('You are X | AI is O')
    console.log('Enter a number between 0 and 8.')
    console.log('Type q to quit.\n')

    console.log('Board positions:')

    printBoard(['0', '1', '2', '3', '4', '5', '6', '7', '8'])

    try {
        while (true) {
            const input: string = await rl.question('Your move (0-8): ')

            if (input.trim().toLowerCase() === 'q') {
                console.log('Game exited.')
                break
            }

            const idx = Number(input)

            if (!Number.isInteger(idx) || idx < 0 || idx > 8) {
                console.log('Invalid input. Enter a number from 0 to 8.\n')
                continue
            }

            const result = game.strike(idx as Parameters<Game['strike']>[0])

            if (result instanceof Error) {
                console.log(`${result.message}\n`)
                continue
            }

            printBoard(game.getBoard())

            if (result.gameStatus === 'winner') {
                console.log(`${result.winner.player.toUpperCase()} WINS!`)
            } else if (result.gameStatus === 'tie') {
                console.log('IT IS A TIE!')
            }

            if (result.gameStatus !== 'running') {
                break
            }

            printAnalytics(game.getAnalytics())
        }
    } finally {
        rl.close()
    }
}

gameLoop().catch((error: unknown) => {
    if (error instanceof Error) {
        console.error(error.message)
    } else {
        console.error('Unknown game error')
    }
})
