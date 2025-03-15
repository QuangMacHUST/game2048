document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo game
    const game = new Game2048();
    game.init();
});

class Game2048 {
    constructor() {
        this.size = 4; // kích thước của bảng 4x4
        this.gridContainer = document.querySelector('.grid-container');
        this.tileContainer = document.querySelector('.tile-container');
        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.messageContainer = document.querySelector('.game-message');
        this.messageText = document.querySelector('.game-message p');
        
        this.grid = [];
        this.tiles = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        
        // Các phím hướng
        this.keyMap = {
            38: 0, // Up
            87: 0, // W
            37: 1, // Left
            65: 1, // A
            40: 2, // Down
            83: 2, // S
            39: 3, // Right
            68: 3  // D
        };
    }

    init() {
        // Hiển thị điểm cao nhất từ localStorage
        this.bestScoreDisplay.textContent = this.bestScore;
        
        // Khởi tạo bảng trống
        this.setupGrid();
        
        // Bắt đầu trò chơi mới
        this.startGame();
        
        // Thêm event listeners
        this.addEventListeners();
    }

    setupGrid() {
        // Khởi tạo mảng grid trống
        this.grid = [];
        for (let i = 0; i < this.size; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.grid[i][j] = null;
            }
        }
    }

    startGame() {
        // Thiết lập lại game
        this.grid = [];
        this.tiles = [];
        this.setupGrid();
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        
        // Xóa tất cả các ô hiện tại
        this.tileContainer.innerHTML = '';
        
        // Cập nhật điểm số
        this.updateScore();
        
        // Thêm 2 ô mới vào bảng
        this.addRandomTile();
        this.addRandomTile();
        
        // Ẩn thông báo game over
        this.hideMessage();
    }

    addEventListeners() {
        // Xử lý các sự kiện bàn phím
        document.addEventListener('keydown', (event) => {
            if (!this.gameOver || this.keepPlaying) {
                // Ngăn chặn cuộn trang khi sử dụng phím mũi tên
                if ([37, 38, 39, 40].includes(event.keyCode)) {
                    event.preventDefault();
                }
                
                // Lấy hướng di chuyển từ phím
                const mapped = this.keyMap[event.keyCode];
                if (mapped !== undefined) {
                    this.move(mapped);
                }
            }
        });
        
        // Xử lý nút "Trò chơi mới"
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Xử lý nút "Thử lại"
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.startGame();
        });
    }

    // Thêm một ô ngẫu nhiên vào bảng
    addRandomTile() {
        if (this.hasEmptyCell()) {
            // Tạo giá trị 2 hoặc 4 (90% là 2, 10% là 4)
            const value = Math.random() < 0.9 ? 2 : 4;
            
            // Tìm một ô trống ngẫu nhiên
            let emptyCells = [];
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (!this.grid[i][j]) {
                        emptyCells.push({row: i, col: j});
                    }
                }
            }
            
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            
            // Tạo một ô mới tại vị trí đã chọn
            this.addTile(randomCell.row, randomCell.col, value);
        }
    }

    // Kiểm tra xem có ô trống không
    hasEmptyCell() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.grid[i][j]) {
                    return true;
                }
            }
        }
        return false;
    }

    // Thêm một ô mới vào bảng
    addTile(row, col, value) {
        // Tạo một đối tượng ô mới
        const tile = {
            row: row,
            col: col,
            value: value,
            element: document.createElement('div')
        };
        
        // Thêm ô vào grid
        this.grid[row][col] = tile;
        this.tiles.push(tile);
        
        // Tạo phần tử HTML cho ô
        tile.element.className = `tile tile-${value} tile-new`;
        tile.element.textContent = value;
        tile.element.style.top = `${row * 115}px`;
        tile.element.style.left = `${col * 115}px`;
        
        // Thêm phần tử vào container
        this.tileContainer.appendChild(tile.element);
    }

    // Di chuyển các ô theo hướng đã chọn
    move(direction) {
        // 0: lên, 1: trái, 2: xuống, 3: phải
        
        // Kiểm tra xem có thể di chuyển không
        if (!this.canMove(direction)) {
            return false;
        }
        
        let moved = false;
        
        // Xác định thứ tự duyệt dựa trên hướng di chuyển
        const rowOrder = direction === 2 ? [3, 2, 1, 0] : [0, 1, 2, 3];
        const colOrder = direction === 3 ? [3, 2, 1, 0] : [0, 1, 2, 3];
        
        for (let i = 0; i < this.size; i++) {
            const row = rowOrder[i];
            for (let j = 0; j < this.size; j++) {
                const col = colOrder[j];
                
                if (this.grid[row][col]) {
                    // Tính toán vị trí mới dựa trên hướng di chuyển
                    const result = this.findFarthestPosition(row, col, direction);
                    const nextPos = result.next;
                    const farthestPos = result.farthest;
                    
                    // Di chuyển ô
                    if (nextPos && this.grid[nextPos.row][nextPos.col] && 
                        this.grid[nextPos.row][nextPos.col].value === this.grid[row][col].value) {
                        // Có thể ghép ô
                        const mergedValue = this.grid[row][col].value * 2;
                        this.mergeTiles(row, col, nextPos.row, nextPos.col, mergedValue);
                        moved = true;
                        
                        // Cập nhật điểm số
                        this.score += mergedValue;
                        
                        // Kiểm tra thắng cuộc
                        if (mergedValue === 2048 && !this.won) {
                            this.won = true;
                            this.showMessage('Bạn thắng!', 'game-won');
                        }
                    } else if (farthestPos.row !== row || farthestPos.col !== col) {
                        // Di chuyển ô tới vị trí xa nhất
                        this.moveTile(row, col, farthestPos.row, farthestPos.col);
                        moved = true;
                    }
                }
            }
        }
        
        if (moved) {
            // Cập nhật điểm số
            this.updateScore();
            
            // Thêm một ô mới vào bảng
            setTimeout(() => {
                this.addRandomTile();
                
                // Kiểm tra game over
                if (!this.canMove(0) && !this.canMove(1) && !this.canMove(2) && !this.canMove(3)) {
                    this.gameOver = true;
                    this.showMessage('Game Over!', 'game-over');
                }
            }, 100);
        }
        
        return moved;
    }

    // Tìm vị trí xa nhất mà ô có thể di chuyển tới
    findFarthestPosition(row, col, direction) {
        // Các vector di chuyển: lên, trái, xuống, phải
        const vectors = [
            {row: -1, col: 0},  // lên
            {row: 0, col: -1},  // trái
            {row: 1, col: 0},   // xuống
            {row: 0, col: 1}    // phải
        ];
        
        let vector = vectors[direction];
        let previous = {row: row, col: col};
        let nextRow = row + vector.row;
        let nextCol = col + vector.col;
        
        // Tiếp tục di chuyển cho đến khi gặp biên hoặc ô khác
        while (this.withinBounds(nextRow, nextCol) && !this.grid[nextRow][nextCol]) {
            previous = {row: nextRow, col: nextCol};
            nextRow += vector.row;
            nextCol += vector.col;
        }
        
        return {
            farthest: previous,
            next: this.withinBounds(nextRow, nextCol) ? {row: nextRow, col: nextCol} : null
        };
    }

    // Kiểm tra xem vị trí có nằm trong bảng không
    withinBounds(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    // Di chuyển ô từ vị trí cũ sang vị trí mới
    moveTile(fromRow, fromCol, toRow, toCol) {
        const tile = this.grid[fromRow][fromCol];
        
        // Cập nhật grid
        this.grid[toRow][toCol] = tile;
        this.grid[fromRow][fromCol] = null;
        
        // Cập nhật vị trí của ô
        tile.row = toRow;
        tile.col = toCol;
        
        // Cập nhật vị trí trên giao diện
        tile.element.style.top = `${toRow * 115}px`;
        tile.element.style.left = `${toCol * 115}px`;
    }

    // Ghép hai ô lại với nhau
    mergeTiles(fromRow, fromCol, toRow, toCol, value) {
        const fromTile = this.grid[fromRow][fromCol];
        const toTile = this.grid[toRow][toCol];
        
        // Cập nhật grid
        this.grid[toRow][toCol] = fromTile;
        this.grid[fromRow][fromCol] = null;
        
        // Cập nhật vị trí và giá trị của ô
        fromTile.row = toRow;
        fromTile.col = toCol;
        fromTile.value = value;
        
        // Cập nhật giao diện
        fromTile.element.className = `tile tile-${value} tile-merged`;
        fromTile.element.textContent = value;
        fromTile.element.style.top = `${toRow * 115}px`;
        fromTile.element.style.left = `${toCol * 115}px`;
        
        // Xóa ô cũ ra khỏi mảng tiles
        const index = this.tiles.indexOf(toTile);
        if (index > -1) {
            this.tiles.splice(index, 1);
        }
        
        // Xóa phần tử HTML của ô cũ
        this.tileContainer.removeChild(toTile.element);
    }

    // Kiểm tra xem có thể di chuyển theo hướng đã chọn không
    canMove(direction) {
        // Các vector di chuyển: lên, trái, xuống, phải
        const vectors = [
            {row: -1, col: 0},  // lên
            {row: 0, col: -1},  // trái
            {row: 1, col: 0},   // xuống
            {row: 0, col: 1}    // phải
        ];
        
        let vector = vectors[direction];
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tile = this.grid[row][col];
                
                if (tile) {
                    const nextRow = row + vector.row;
                    const nextCol = col + vector.col;
                    
                    // Nếu ô tiếp theo nằm trong bảng
                    if (this.withinBounds(nextRow, nextCol)) {
                        const nextTile = this.grid[nextRow][nextCol];
                        
                        // Nếu ô tiếp theo trống hoặc có cùng giá trị
                        if (!nextTile || nextTile.value === tile.value) {
                            return true;
                        }
                    }
                } else if (!tile) {
                    // Có ô trống thì có thể di chuyển
                    return true;
                }
            }
        }
        
        return false;
    }

    // Cập nhật điểm số
    updateScore() {
        this.scoreDisplay.textContent = this.score;
        
        // Cập nhật điểm cao nhất
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreDisplay.textContent = this.bestScore;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    // Hiển thị thông báo
    showMessage(message, className) {
        this.messageText.textContent = message;
        this.messageContainer.className = `game-message ${className}`;
    }

    // Ẩn thông báo
    hideMessage() {
        this.messageContainer.className = 'game-message';
    }
} 