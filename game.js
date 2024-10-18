const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const fieldWidth = 800;
const fieldHeight = 600;
const playerSize = 20;
const ballSize = 10;
const goalWidth = 80;
const goalHeight = 160;

canvas.width = fieldWidth;
canvas.height = fieldHeight;

class Player {
    constructor(x, y, color, team) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.team = team;
        this.speed = 3;
        this.isActive = false;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, playerSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.isActive) {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, playerSize / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    move(dx, dy) {
        const newX = this.x + dx * this.speed;
        const newY = this.y + dy * this.speed;
        
        if (newX > playerSize / 2 && newX < fieldWidth - playerSize / 2 &&
            newY > playerSize / 2 && newY < fieldHeight - playerSize / 2) {
            this.x = newX;
            this.y = newY;
        }
    }

    moveTowards(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.speed) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        } else {
            this.x = targetX;
            this.y = targetY;
        }
    }
}

class Ball {
    constructor() {
        this.x = fieldWidth / 2;
        this.y = fieldHeight / 2;
        this.dx = 0;
        this.dy = 0;
        this.speed = 5;
        this.friction = 0.98;
        this.gravity = 0.2;
        this.bounce = 0.8;
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, ballSize, 0, Math.PI * 2);
        ctx.fill();
    }

    move() {
        this.dy += this.gravity;
        this.x += this.dx;
        this.y += this.dy;

        // Bounce off walls
        if (this.x < ballSize || this.x > fieldWidth - ballSize) {
            this.dx = -this.dx * this.bounce;
            this.x = (this.x < ballSize) ? ballSize : fieldWidth - ballSize;
        }
        if (this.y < ballSize || this.y > fieldHeight - ballSize) {
            this.dy = -this.dy * this.bounce;
            this.y = (this.y < ballSize) ? ballSize : fieldHeight - ballSize;
            this.dx *= this.friction; // Apply friction when bouncing on ground
        }

        // Apply air resistance
        this.dx *= this.friction;
        this.dy *= this.friction;

        // Stop ball if it's moving very slowly
        if (Math.abs(this.dx) < 0.1 && Math.abs(this.dy) < 0.1 && Math.abs(this.y - (fieldHeight - ballSize)) < 1) {
            this.dx = 0;
            this.dy = 0;
            this.y = fieldHeight - ballSize;
        }
    }
}

const team1 = [];
const team2 = [];
const ball = new Ball();
let activePlayer = null;
let score = [0, 0];

function createTeams() {
    const positions = [
        {x: 100, y: 300},
        {x: 200, y: 150}, {x: 200, y: 450},
        {x: 300, y: 100}, {x: 300, y: 300}, {x: 300, y: 500},
        {x: 400, y: 150}, {x: 400, y: 450},
        {x: 500, y: 100}, {x: 500, y: 300}, {x: 500, y: 500}
    ];

    for (let i = 0; i < 11; i++) {
        team1.push(new Player(positions[i].x, positions[i].y, 'red', 1));
        team2.push(new Player(fieldWidth - positions[i].x, positions[i].y, 'blue', 2));
    }

    activePlayer = team1[0];
    activePlayer.isActive = true;
}

function drawField() {
    // Field
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, fieldWidth, fieldHeight);

    // Center line
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fieldWidth / 2, 0);
    ctx.lineTo(fieldWidth / 2, fieldHeight);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(fieldWidth / 2, fieldHeight / 2, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Goal posts
    ctx.fillStyle = 'white';
    ctx.fillRect(0, fieldHeight / 2 - goalHeight / 2, 5, goalHeight);
    ctx.fillRect(fieldWidth - 5, fieldHeight / 2 - goalHeight / 2, 5, goalHeight);

    // Penalty areas
    ctx.strokeRect(0, fieldHeight / 2 - 110, 130, 220);
    ctx.strokeRect(fieldWidth - 130, fieldHeight / 2 - 110, 130, 220);
}

function update() {
    ctx.clearRect(0, 0, fieldWidth, fieldHeight);
    drawField();

    team1.forEach(player => player.draw());
    team2.forEach(player => player.draw());

    ball.move();
    ball.draw();

    handleCollisions();
    checkGoal();
    updateCPU();

    requestAnimationFrame(update);
}

function handleCollisions() {
    const allPlayers = [...team1, ...team2];
    allPlayers.forEach(player => {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < playerSize / 2 + ballSize) {
            // Collision detected
            const angle = Math.atan2(dy, dx);
            const targetX = player.x + Math.cos(angle) * (playerSize / 2 + ballSize);
            const targetY = player.y + Math.sin(angle) * (playerSize / 2 + ballSize);

            // Update ball position
            ball.x = targetX;
            ball.y = targetY;

            // Update ball velocity
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = Math.cos(angle) * speed * 1.5;
            ball.dy = Math.sin(angle) * speed * 1.5;
        }
    });
}

function checkGoal() {
    if (ball.x < 5 && Math.abs(ball.y - fieldHeight / 2) < goalHeight / 2) {
        score[1]++;
        resetBall();
    } else if (ball.x > fieldWidth - 5 && Math.abs(ball.y - fieldHeight / 2) < goalHeight / 2) {
        score[0]++;
        resetBall();
    }
    document.getElementById('team1-score').textContent = score[0];
    document.getElementById('team2-score').textContent = score[1];
}

function resetBall() {
    ball.x = fieldWidth / 2;
    ball.y = fieldHeight / 2;
    ball.dx = 0;
    ball.dy = 0;
}

function switchPlayer() {
    activePlayer.isActive = false;
    const currentIndex = team1.indexOf(activePlayer);
    activePlayer = team1[(currentIndex + 1) % team1.length];
    activePlayer.isActive = true;
}

function passBall() {
    const nearestTeammate = findNearestTeammate();
    if (nearestTeammate) {
        const dx = nearestTeammate.x - ball.x;
        const dy = nearestTeammate.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        ball.dx = dx / distance * ball.speed * 2;
        ball.dy = dy / distance * ball.speed * 2;
    }
}

function findNearestTeammate() {
    return team1
        .filter(player => player !== activePlayer)
        .reduce((nearest, player) => {
            const dx = player.x - activePlayer.x;
            const dy = player.y - activePlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return !nearest || distance < nearest.distance ? {player, distance} : nearest;
        }, null)?.player;
}

function shoot() {
    const goalX = fieldWidth;
    const goalY = fieldHeight / 2;
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    ball.dx = dx / distance * ball.speed * 3;
    ball.dy = dy / distance * ball.speed * 3;
}

function updateCPU() {
    const cpuActivePlayer = findNearestPlayerToBall(team2);
    
    // Move towards the ball
    cpuActivePlayer.moveTowards(ball.x, ball.y);
    
    // If close to the ball, try to shoot or pass
    const dx = ball.x - cpuActivePlayer.x;
    const dy = ball.y - cpuActivePlayer.y;
    const distanceToBall = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToBall < playerSize + ballSize) {
        if (cpuActivePlayer.x > fieldWidth / 2) {
            // If in opponent's half, shoot
            const goalX = 0;
            const goalY = fieldHeight / 2;
            const dxGoal = goalX - ball.x;
            const dyGoal = goalY - ball.y;
            const distanceToGoal = Math.sqrt(dxGoal * dxGoal + dyGoal * dyGoal);
            ball.dx = dxGoal / distanceToGoal * ball.speed * 3;
            ball.dy = dyGoal / distanceToGoal * ball.speed * 3;
        } else {
            // If in own half, pass to the nearest teammate
            const nearestTeammate = findNearestTeammate(cpuActivePlayer, team2);
            if (nearestTeammate) {
                const dxTeammate = nearestTeammate.x - ball.x;
                const dyTeammate = nearestTeammate.y - ball.y;
                const distanceToTeammate = Math.sqrt(dxTeammate * dxTeammate + dyTeammate * dyTeammate);
                ball.dx = dxTeammate / distanceToTeammate * ball.speed * 2;
                ball.dy = dyTeammate / distanceToTeammate * ball.speed * 2;
            }
        }
    }
    
    // Move other CPU players to strategic positions
    team2.forEach((player, index) => {
        if (player !== cpuActivePlayer) {
            const targetX = fieldWidth / 2 + (index % 5) * 100;
            const targetY = 100 + Math.floor(index / 5) * 200;
            player.moveTowards(targetX, targetY);
        }
    });
}

function findNearestPlayerToBall(team) {
    return team.reduce((nearest, player) => {
        const dx = player.x - ball.x;
        const dy = player.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return !nearest || distance < nearest.distance ? {player, distance} : nearest;
    }, null).player;
}

createTeams();
update();

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            activePlayer.move(-1, 0);
            break;
        case 'ArrowRight':
            activePlayer.move(1, 0);
            break;
        case 'ArrowUp':
            activePlayer.move(0, -1);
            break;
        case 'ArrowDown':
            activePlayer.move(0, 1);
            break;
        case ' ':
            const dx = ball.x - activePlayer.x;
            const dy = ball.y - activePlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < playerSize + ballSize) {
                shoot();
            }
            break;
        case 'p':
            passBall();
            break;
        case 's':
            switchPlayer();
            break;
    }
});