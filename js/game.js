/* ==========================================================
   Jogo do Galo - lógica do jogo
   Modos: 2 jogadores ou contra o computador
   ========================================================== */

// ---------- Estado do jogo ----------
let currentPlayer = 'X';          // Jogador da vez ('X' ou 'O')
let gameActive = true;            // Indica se a ronda está a decorrer
let board = Array(9).fill('');    // Estado do tabuleiro (9 casas)
let scores = { X: 0, O: 0, draws: 0 };

const STORAGE_KEY = 'jogo-do-galo-pontos';
const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],   // linhas
    [0, 3, 6], [1, 4, 7], [2, 5, 8],   // colunas
    [0, 4, 8], [2, 4, 6]               // diagonais
];

// ---------- Elementos do DOM ----------
const cells = document.querySelectorAll('.cell');
const currentPlayerEl = document.getElementById('currentPlayer');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDrawsEl = document.getElementById('scoreDraws');
const labelOEl = document.getElementById('labelO');
const modePcEl = document.getElementById('modo-pc');
const modeTwoEl = document.getElementById('modo-2j');
const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
const resultMessageEl = document.getElementById('resultMessage');

// ---------- Funções principais ----------

// Devolve true se o modo "Contra o Computador" estiver ativo
function isVsComputer() {
    return modePcEl.checked;
}

// Realiza o clique do jogador numa casa do tabuleiro
function handleCellClick(event) {
    const index = Number(event.currentTarget.dataset.index);
    // No modo vs computador, o humano só joga como X
    if (isVsComputer() && currentPlayer !== 'X') return;
    makeMove(index);
}

// Realiza uma jogada na posição indicada e avalia o resultado
function makeMove(index) {
    if (!gameActive || board[index] !== '') return;

    board[index] = currentPlayer;
    renderBoard();

    const winningLine = checkWin();
    if (winningLine) {
        endGame(currentPlayer, winningLine);
        return;
    }

    if (checkDraw()) {
        endGame(null, null);
        return;
    }

    switchPlayer();

    // Se for a vez do computador, joga após um pequeno atraso
    if (isVsComputer() && currentPlayer === 'O') {
        gameActive = false; // bloqueia cliques enquanto o computador "pensa"
        setTimeout(() => {
            gameActive = true;
            computerMove();
        }, 500);
    }
}

// Atualiza o aspeto do tabuleiro a partir do array "board"
function renderBoard() {
    cells.forEach((cell, i) => {
        const value = board[i];
        cell.textContent = value;
        cell.disabled = value !== '' || !gameActive;
        cell.classList.toggle('cell-x', value === 'X');
        cell.classList.toggle('cell-o', value === 'O');
    });
}

// Alterna o jogador atual e atualiza o indicador
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    currentPlayerEl.textContent = currentPlayer;
}

// Verifica se existe um vencedor; devolve a combinação vencedora ou null
function checkWin() {
    for (const combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
            return combo;
        }
    }
    return null;
}

// Verifica se o jogo terminou empatado (todas as casas preenchidas)
function checkDraw() {
    return board.every(value => value !== '');
}

// Termina a ronda: atualiza pontuação, destaca vitória e mostra o modal
function endGame(winner, winningLine) {
    gameActive = false;

    if (winner) {
        scores[winner]++;
        winningLine.forEach(i => cells[i].classList.add('winner'));
    } else {
        scores.draws++;
    }

    saveScores();
    updateScoreboard();
    renderBoard();

    let message;
    if (!winner) {
        message = 'Empate no jogo!';
    } else if (isVsComputer()) {
        message = winner === 'X' ? 'Ganhaste!' : 'O computador venceu!';
    } else {
        message = `Venceu o jogador ${winner}!`;
    }
    resultMessageEl.textContent = message;

    // Pequeno atraso para o jogador ver a linha vencedora
    setTimeout(() => resultModal.show(), 600);
}

// ---------- Inteligência do computador ----------

// Escolhe e executa a jogada do computador (joga como 'O')
function computerMove() {
    const index = findBestMove();
    if (index !== -1) makeMove(index);
}

// Estratégia: 1) ganhar  2) bloquear  3) centro  4) canto  5) lado
function findBestMove() {
    const winMove = findWinningMove('O');
    if (winMove !== -1) return winMove;

    const blockMove = findWinningMove('X');
    if (blockMove !== -1) return blockMove;

    if (board[4] === '') return 4;

    const corners = [0, 2, 6, 8].filter(i => board[i] === '');
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

    const sides = [1, 3, 5, 7].filter(i => board[i] === '');
    if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

    return -1;
}

// Procura uma casa onde o jogador indicado completa uma linha
function findWinningMove(player) {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
        const line = [board[a], board[b], board[c]];
        if (line.filter(v => v === player).length === 2 && line.includes('')) {
            return [a, b, c][line.indexOf('')];
        }
    }
    return -1;
}

// ---------- Pontuação e restart ----------

// Atualiza os valores da pontuação no ecrã
function updateScoreboard() {
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreDrawsEl.textContent = scores.draws;
    labelOEl.textContent = isVsComputer() ? 'Computador' : 'Jogador O';
}

// Guarda a pontuação no localStorage
function saveScores() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch (e) { /* armazenamento indisponível */ }
}

// Carrega a pontuação guardada (se existir)
function loadScores() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && typeof saved.X === 'number') scores = saved;
    } catch (e) { /* ignora dados inválidos */ }
}

// Começa uma nova ronda (mantém a pontuação)
function resetGame() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    currentPlayerEl.textContent = currentPlayer;
    cells.forEach(cell => cell.classList.remove('winner'));
    renderBoard();
}

// Repõe a pontuação a zero e reinicia a ronda
function resetScores() {
    scores = { X: 0, O: 0, draws: 0 };
    saveScores();
    updateScoreboard();
    resetGame();
}

// Ao mudar de modo, reinicia a ronda e atualiza o rótulo
function handleModeChange() {
    updateScoreboard();
    resetGame();
}

// ---------- Registo do Service Worker (PWA) ----------
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .catch(err => console.error('Falha ao registar o service worker:', err));
        });
    }
}

// ---------- Boot ----------
function init() {
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    document.getElementById('btnNovoJogo').addEventListener('click', resetGame);
    document.getElementById('btnReporPontos').addEventListener('click', resetScores);
    modePcEl.addEventListener('change', handleModeChange);
    modeTwoEl.addEventListener('change', handleModeChange);
    document.getElementById('resultModal').addEventListener('hidden.bs.modal', resetGame);

    loadScores();
    updateScoreboard();
    resetGame();
    registerServiceWorker();
}

init();
