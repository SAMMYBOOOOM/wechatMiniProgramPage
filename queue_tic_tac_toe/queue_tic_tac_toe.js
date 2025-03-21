// pages/queue_tic_tac_toe/queue_tic_tac_toe.js
Page({
  data: {
    board: ["-", "-", "-", "-", "-", "-", "-", "-", "-"],
    displayBoard: ["-", "-", "-", "-", "-", "-", "-", "-", "-"], // For visual rendering
    currentPlayer: 'X',
    gameOver: false,
    result: null,
    playerQueues: {
      'X': [],
      'O': []
    },
    playerBlocked: {
      'X': null,
      'O': null
    },
    gameMode: null, // 'bot' or 'twoPlayer'
    showModeSelection: true
  },

  onLoad() {
    // Initialize game
    this.resetGame();
  },

  onPullDownRefresh() {
    this.resetGame();
    wx.stopPullDownRefresh();
  },

  resetGame() {
    this.setData({
      board: ["-", "-", "-", "-", "-", "-", "-", "-", "-"],
      displayBoard: ["-", "-", "-", "-", "-", "-", "-", "-", "-"],
      currentPlayer: 'X',
      gameOver: false,
      result: null,
      playerQueues: {
        'X': [],
        'O': []
      },
      playerBlocked: {
        'X': null,
        'O': null
      }
    });
  },

  selectGameMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      gameMode: mode,
      showModeSelection: false
    });
    this.resetGame();
  },

  handleTileClick(e) {
    if (this.data.gameOver) return;

    const position = e.currentTarget.dataset.position;

    // Check if position is already occupied
    if (this.data.board[position] !== "-") {
      wx.showToast({
        title: '位置已占用',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    // Check if position is blocked (oldest piece)
    if (position === this.data.playerBlocked[this.data.currentPlayer]) {
      wx.showToast({
        title: '不能放在最旧棋子位置',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    // Handle placement
    this.handlePlacement(this.data.currentPlayer, position);

    // Check if game is over
    const gameResult = this.checkGameOver();
    if (gameResult) {
      this.handleGameOver(gameResult);
      return;
    }

    // Switch player if in two-player mode
    if (this.data.gameMode === 'twoPlayer') {
      this.setData({
        currentPlayer: this.data.currentPlayer === 'X' ? 'O' : 'X'
      });
    } else if (this.data.gameMode === 'bot' && this.data.currentPlayer === 'X') {
      // If playing against bot and player just moved, let bot move
      this.setData({ currentPlayer: 'O' });
      setTimeout(() => {
        this.botMove();
      }, 600);
    }
  },

  handlePlacement(player, position) {
    const board = [...this.data.board];
    const playerQueues = { ...this.data.playerQueues };
    const playerBlocked = { ...this.data.playerBlocked };
    const displayBoard = [...this.data.displayBoard];

    playerQueues[player] = [...playerQueues[player], position];

    if (playerQueues[player].length > 3) {
      const oldest = playerQueues[player].shift();
      board[oldest] = "-";
      playerBlocked[player] = oldest;

      // Fade out the oldest piece
      displayBoard[oldest] = player;
      this.setData({ displayBoard });

      setTimeout(() => {
        const currentDisplayBoard = [...this.data.displayBoard];
        if (this.data.board[oldest] === "-") {
          currentDisplayBoard[oldest] = "-";
        }
        this.setData({ displayBoard: currentDisplayBoard });
      }, 200);
    } else {
      playerBlocked[player] = null;
    }

    board[position] = player;
    displayBoard[position] = player;

    this.setData({
      board,
      displayBoard,
      playerQueues,
      playerBlocked
    });
  },

  botMove() {
    const player = 'O';

    // Find valid positions (not occupied and not blocked)
    const validPositions = [];
    for (let i = 0; i < 9; i++) {
      if (this.data.board[i] === "-" && i !== this.data.playerBlocked[player]) {
        validPositions.push(i);
      }
    }

    if (validPositions.length === 0) return;

    let movePosition = null;

    // Try to win
    for (const pos of validPositions) {
      const tempBoard = [...this.data.board];
      tempBoard[pos] = player;
      if (this.checkWin(tempBoard, player)) {
        movePosition = pos;
        break;
      }
    }

    // Block human
    if (movePosition === null) {
      for (const pos of validPositions) {
        const tempBoard = [...this.data.board];
        tempBoard[pos] = 'X';
        if (this.checkWin(tempBoard, 'X')) {
          movePosition = pos;
          break;
        }
      }
    }

    // Random move
    if (movePosition === null) {
      const randomIndex = Math.floor(Math.random() * validPositions.length);
      movePosition = validPositions[randomIndex];
    }

    // Make the move
    this.handlePlacement(player, movePosition);

    // Check if game is over
    const gameResult = this.checkGameOver();
    if (gameResult) {
      this.handleGameOver(gameResult);
      return;
    }

    // Switch back to player X
    this.setData({
      currentPlayer: 'X'
    });
  },

  checkWin(board, player) {
    const winConditions = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const condition of winConditions) {
      if (board[condition[0]] === player &&
          board[condition[1]] === player &&
          board[condition[2]] === player) {
        return true;
      }
    }

    return false;
  },

  checkGameOver() {
    // Check for win
    if (this.checkWin(this.data.board, 'X')) {
      return 'X';
    }
    if (this.checkWin(this.data.board, 'O')) {
      return 'O';
    }

    // Check for tie
    if (!this.data.board.includes("-")) {
      return 'tie';
    }

    return null;
  },

  handleGameOver(result) {
    let resultText = '';
    if (result === 'X') {
      resultText = 'X 获胜！';
    } else if (result === 'O') {
      resultText = this.data.gameMode === 'bot' ? '电脑获胜！' : 'O 获胜！';
    } else {
      resultText = '平局！';
    }

    // Delay the game over state to show the winning move
    setTimeout(() => {
      this.setData({
        gameOver: true,
        result: resultText
      });
    }, 1000); // 1 second delay
  },

  playAgain() {
    this.resetGame();
    this.setData({
      gameOver: false,
      result: null
    });
  },

  changeMode() {
    this.setData({
      showModeSelection: true,
      gameOver: false,
      result: null
    });
  },

  backToUser() {
    wx.navigateBack();
  }
});