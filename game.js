const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 20;
const ROWS = 31;
const COLS = 28;

// Tile types
const WALL = 0;
const DOT = 1;
const EMPTY = 2;
const POWER_PELLET = 3;

// Game variables
let score = 0;
let highScore = localStorage.getItem('pacman_highscore') || 0;
let gameRunning = false;
let animationId;
let frames = 0;
let currentDifficulty = localStorage.getItem('pacman_difficulty') || 'normal';

// Difficulty configurations
const DIFFICULTY_CONFIG = {
    easy: {
        pacmanSpeed: 2,
        ghostSpeed: 1.5,
        vulnerableTime: 800 // frames (about 13 seconds at 60fps)
    },
    normal: {
        pacmanSpeed: 2,
        ghostSpeed: 2,
        vulnerableTime: 600 // frames (about 10 seconds at 60fps)
    },
    hard: {
        pacmanSpeed: 2,
        ghostSpeed: 2.5,
        vulnerableTime: 400 // frames (about 6.7 seconds at 60fps)
    }
};

// Update UI
document.getElementById('high-score').innerText = highScore;

// Level Map (1 = Dot, 0 = Wall, 2 = Empty, 3 = Power Pellet)
const levelMap = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,3,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,3,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,2,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0],
    [2,2,2,2,2,0,1,0,0,0,0,0,2,0,0,2,0,0,0,0,0,1,0,2,2,2,2,2],
    [0,0,0,0,0,0,1,0,0,2,2,2,2,2,2,2,2,2,2,0,0,1,0,0,0,0,0,0],
    [2,2,2,2,2,2,1,2,2,2,0,0,0,2,2,0,0,0,2,2,2,1,2,2,2,2,2,2], // Ghost house entrance
    [0,0,0,0,0,0,1,0,0,2,0,2,2,2,2,2,2,0,2,0,0,1,0,0,0,0,0,0],
    [2,2,2,2,2,0,1,0,0,2,0,2,2,2,2,2,2,0,2,0,0,1,0,2,2,2,2,2],
    [0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,3,1,1,0,0,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,0,0,1,1,3,0],
    [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
    [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
    [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// Helper to copy map
const getInitialMap = () => JSON.parse(JSON.stringify(levelMap));
let currentMap = getInitialMap();

class Pacman {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 1 * TILE_SIZE;
        this.y = 1 * TILE_SIZE;
        this.size = TILE_SIZE * 0.8;
        this.dir = { x: 0, y: 0 };
        this.nextDir = { x: 1, y: 0 }; // Start moving right
        this.speed = 2; // TILE_SIZE is 20, so 2 is divisible
        this.mouthOpen = 0.2;
        this.mouthSpeed = 0.05;
        this.angle = 0;
    }

    update() {
        // Try to change direction if aligned with grid
        if (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0) {
            let col = this.x / TILE_SIZE;
            let row = this.y / TILE_SIZE;

            // Check if nextDir is valid
            if (this.isValidMove(col + this.nextDir.x, row + this.nextDir.y)) {
                this.dir = { ...this.nextDir };
            }
            
            // Check if current dir is still valid
            if (!this.isValidMove(col + this.dir.x, row + this.dir.y)) {
                this.dir = { x: 0, y: 0 };
            }
        }

        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;

        // Wrap around (tunnel)
        if (this.x < -TILE_SIZE) this.x = canvas.width;
        if (this.x > canvas.width) this.x = -TILE_SIZE;

        // Eat dots
        this.checkCollision();

        // Animation
        this.mouthOpen += this.mouthSpeed;
        if (this.mouthOpen > 0.25 || this.mouthOpen < 0) this.mouthSpeed = -this.mouthSpeed;
        
        if (this.dir.x === 1) this.angle = 0;
        if (this.dir.x === -1) this.angle = Math.PI;
        if (this.dir.y === 1) this.angle = Math.PI / 2;
        if (this.dir.y === -1) this.angle = -Math.PI / 2;
    }

    isValidMove(col, row) {
        if (row < 0 || row >= currentMap.length || col < 0 || col >= currentMap[0].length) return false;
        return currentMap[row][col] !== WALL;
    }

    checkCollision() {
        let col = Math.round(this.x / TILE_SIZE);
        let row = Math.round(this.y / TILE_SIZE);

        if (row >= 0 && row < currentMap.length && col >= 0 && col < currentMap[0].length) {
            let tile = currentMap[row][col];
            if (tile === DOT) {
                currentMap[row][col] = EMPTY;
                score += 10;
                document.getElementById('score').innerText = score;
            } else if (tile === POWER_PELLET) {
                currentMap[row][col] = EMPTY;
                score += 50;
                document.getElementById('score').innerText = score;
                // TODO: Make ghosts vulnerable
                ghosts.forEach(g => g.makeVulnerable());
            }
        }
        
        // Check win condition
        if (!currentMap.some(row => row.includes(DOT) || row.includes(POWER_PELLET))) {
            gameOver(true);
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, this.mouthOpen * Math.PI, (2 - this.mouthOpen) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fillStyle = '#ff0';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

class Ghost {
    constructor(x, y, color, type) {
        this.startX = x * TILE_SIZE;
        this.startY = y * TILE_SIZE;
        this.color = color;
        this.type = type;
        this.reset();
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.dir = { x: 0, y: 0 };
        this.speed = DIFFICULTY_CONFIG[currentDifficulty].ghostSpeed;
        this.vulnerable = false;
        this.vulnerableTimer = 0;
        // Initial random move
        this.dir = {x: 1, y: 0};
    }

    update() {
        if (this.vulnerable) {
            this.vulnerableTimer--;
            if (this.vulnerableTimer <= 0) this.vulnerable = false;
        }

        // Move only on grid alignment
        if (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0) {
            let col = this.x / TILE_SIZE;
            let row = this.y / TILE_SIZE;
            
            const possibleMoves = [];
            const dirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];

            dirs.forEach(d => {
                // Don't reverse immediately unless stuck
                if (d.x === -this.dir.x && d.y === -this.dir.y) return;
                
                if (this.isValidMove(col + d.x, row + d.y)) {
                    possibleMoves.push(d);
                }
            });

            if (possibleMoves.length > 0) {
                // Simple AI: Random choice for now, can be improved
                // If vulnerable, run away from pacman?
                // For now just random to keep it simple and preventing getting stuck
                const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                this.dir = move;
            } else {
                 // Dead end, reverse
                 this.dir = {x: -this.dir.x, y: -this.dir.y};
            }
        }

        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;

        // Tunnel
        if (this.x < -TILE_SIZE) this.x = canvas.width;
        if (this.x > canvas.width) this.x = -TILE_SIZE;
    }

    isValidMove(col, row) {
        if (row < 0 || row >= currentMap.length || col < 0 || col >= currentMap[0].length) return false;
        return currentMap[row][col] !== WALL;
    }

    makeVulnerable() {
        this.vulnerable = true;
        this.vulnerableTimer = DIFFICULTY_CONFIG[currentDifficulty].vulnerableTime;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.vulnerable ? '#00f' : this.color;
        let x = this.x + TILE_SIZE/2;
        let y = this.y + TILE_SIZE/2;
        let r = TILE_SIZE/2 * 0.8;
        
        ctx.arc(x, y - 2, r, Math.PI, 0); // Head
        ctx.lineTo(x + r, y + r);
        // Feet
        for(let i=1; i<=3; i++) {
           ctx.lineTo(x + r - (2*r/3)*i, y + r - (i%2==0 ? 3:0)); 
        }
        ctx.lineTo(x - r, y + r);
        ctx.fill();
        ctx.closePath();

        // Eyes
        if (!this.vulnerable) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - r/3, y - r/4, r/3, 0, Math.PI*2);
            ctx.arc(x + r/3, y - r/4, r/3, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - r/3 + this.dir.x*2, y - r/4 + this.dir.y*2, r/6, 0, Math.PI*2);
            ctx.arc(x + r/3 + this.dir.x*2, y - r/4 + this.dir.y*2, r/6, 0, Math.PI*2);
            ctx.fill();
        }
    }
}

const pacman = new Pacman();
const ghosts = [
    new Ghost(13, 11, '#ff0000', 'blinky'), // Red
    new Ghost(14, 11, '#ffb8ff', 'pinky'),  // Pink
    new Ghost(12, 11, '#00ffff', 'inky'),   // Cyan
    new Ghost(15, 11, '#ffb852', 'clyde')   // Orange
];

function drawMap() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < currentMap.length; row++) {
        for (let col = 0; col < currentMap[row].length; col++) {
            const tile = currentMap[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (tile === WALL) {
                ctx.strokeStyle = '#0033ff'; // Base Blue
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                // Glow effect is done via CSS box-shadow on canvas mostly, but we can do internal glow
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#00f3ff';
            } else if (tile === DOT) {
                ctx.fillStyle = '#ffb8ae';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === POWER_PELLET) {
                if (Math.floor(Date.now() / 200) % 2 === 0) { // Blink
                    ctx.fillStyle = '#ffb8ae';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    ctx.shadowBlur = 0; // Reset shadow
}

function update() {
    pacman.update();
    ghosts.forEach(g => {
        g.update();
        // Check collision
        const dist = Math.hypot(pacman.x - g.x, pacman.y - g.y);
        if (dist < TILE_SIZE) {
            if (g.vulnerable) {
                // Eat ghost
                g.reset(); // Send back to start
                score += 200;
                document.getElementById('score').innerText = score;
            } else {
                // Game Over
                gameOver(false);
            }
        }
    });
}

function draw() {
    drawMap();
    pacman.draw();
    ghosts.forEach(g => g.draw());
}

function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function gameOver(win) {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pacman_highscore', highScore);
        document.getElementById('high-score').innerText = highScore;
    }

    const overlay = document.getElementById('overlay');
    const title = document.getElementById('overlay-title');
    const btn = document.getElementById('start-btn');
    
    title.innerText = win ? 'YOU WIN!' : 'GAME OVER';
    title.style.color = win ? '#00ff00' : '#ff0000';
    btn.innerText = 'PLAY AGAIN';
    
    overlay.classList.remove('hidden');
}

function startGame() {
    score = 0;
    document.getElementById('score').innerText = '0';
    currentMap = getInitialMap();
    pacman.reset();
    ghosts.forEach(g => g.reset());
    gameRunning = true;
    document.getElementById('overlay').classList.add('hidden');
    gameLoop();
}

window.addEventListener('keydown', e => {
    // Prevent default scrolling for arrow keys
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    switch(e.key) {
        case 'ArrowUp': pacman.nextDir = { x: 0, y: -1 }; break;
        case 'ArrowDown': pacman.nextDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft': pacman.nextDir = { x: -1, y: 0 }; break;
        case 'ArrowRight': pacman.nextDir = { x: 1, y: 0 }; break;
    }
});

document.getElementById('start-btn').addEventListener('click', startGame);

// Difficulty selection
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
difficultyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Update active state
        difficultyButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Set difficulty
        currentDifficulty = btn.dataset.difficulty;
        localStorage.setItem('pacman_difficulty', currentDifficulty);
    });
});

// Load saved difficulty
document.addEventListener('DOMContentLoaded', () => {
    const savedDifficulty = localStorage.getItem('pacman_difficulty') || 'normal';
    currentDifficulty = savedDifficulty;
    difficultyButtons.forEach(btn => {
        if (btn.dataset.difficulty === savedDifficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
});

// Initial draw
drawMap();
