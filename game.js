// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const keyCountElement = document.getElementById('keyCount');

// Set canvas to fullscreen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Touch control elements
const touchControls = document.getElementById('touchControls');
const touchPowers = document.getElementById('touchPowers');
const upBtn = document.getElementById('up-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');
const touchIceBtn = document.getElementById('touch-ice-btn');
const touchFireBtn = document.getElementById('touch-fire-btn');
const touchCombinedBtn = document.getElementById('touch-combined-btn');

// Check if mobile device or touch device
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 1024 || 
           'ontouchstart' in window || 
           navigator.maxTouchPoints > 0;
}

// Show/hide touch controls based on device
function showTouchControls() {
    touchControls.style.display = 'block';
    touchPowers.style.display = 'block';
    console.log('Touch controls enabled for device');
}

// Always show touch controls for better iPad compatibility
showTouchControls();

// Power selection for touch controls
let selectedPower = null;

// Game State
let gameState = {
    keys: 0,
    currentRoom: 0,
    gameTime: 0,
    totalRooms: 1000,
    gameOverTimer: null,
    powerUps: {
        speed: 0,
        damage: 0,
        shield: 0,
        rapidFire: 0
    }
};

// Player
const player = {
    x: 400,
    y: 300,
    size: 20,
    speed: 5,
    health: 150,
    maxHealth: 150,
    direction: { x: 0, y: 0 },
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    isMoving: false,
    glow: 0,
    shield: 0,
    invincible: false
};

// Powers System
const powers = {
    ice: { cooldown: 0, maxCooldown: 400, damage: 30, color: '#00BFFF' },
    fire: { cooldown: 0, maxCooldown: 400, damage: 35, color: '#FF4500' },
    combined: { cooldown: 0, maxCooldown: 2000, damage: 70, color: '#9932CC' }
};

// Projectiles
let projectiles = [];

// Enemies
let enemies = [];

// Keys
let keys = [];

// Power-ups
let powerUps = [];

// Particles for effects
let particles = [];

// Room themes and colors (no blood colors)
const roomThemes = [
    { name: "Forest Clearing", bg: "#4a7c59", accent: "#6b8e23", particle: "#90EE90" },
    { name: "Ancient Ruins", bg: "#8B7355", accent: "#A0522D", particle: "#DEB887" },
    { name: "Mystical Garden", bg: "#6b8e23", accent: "#228B22", particle: "#98FB98" },
    { name: "Crystal Cavern", bg: "#4169E1", accent: "#87CEEB", particle: "#E0FFFF" },
    { name: "Golden Temple", bg: "#FFD700", accent: "#DAA520", particle: "#FFFACD" },
    { name: "Shadow Realm", bg: "#2F4F4F", accent: "#696969", particle: "#C0C0C0" },
    { name: "Emerald Grove", bg: "#228B22", accent: "#32CD32", particle: "#90EE90" },
    { name: "Sapphire Lake", bg: "#191970", accent: "#4169E1", particle: "#87CEEB" },
    { name: "Amethyst Cave", bg: "#4B0082", accent: "#9932CC", particle: "#DDA0DD" },
    { name: "Pearl Beach", bg: "#F0F8FF", accent: "#E6E6FA", particle: "#FFFFFF" },
    { name: "Rainbow Valley", bg: "#FF69B4", accent: "#FF1493", particle: "#FFB6C1" },
    { name: "Cosmic Space", bg: "#000080", accent: "#4B0082", particle: "#E6E6FA" }
];

// Generate 1000 rooms with diverse themes and scaling difficulty
const rooms = [];
for (let i = 0; i < 1000; i++) {
    const theme = roomThemes[i % roomThemes.length];
    
    // Scale difficulty based on room number
    const difficultyLevel = Math.floor(i / 100) + 1;
    const baseEnemies = Math.min(1 + Math.floor(i / 50), 8); // 1-8 enemies max
    const enemyVariation = Math.floor(Math.random() * 3) - 1; // -1 to +1 variation
    const finalEnemies = Math.max(1, baseEnemies + enemyVariation);
    
    const room = {
        name: `${theme.name} ${Math.floor(i / roomThemes.length) + 1} (Level ${difficultyLevel})`,
        background: theme.bg,
        accent: theme.accent,
        particle: theme.particle,
        passages: [],
        enemies: finalEnemies,
        keys: 1,
        theme: theme,
        difficultyLevel: difficultyLevel
    };
    
    // Add passages to connect rooms
    if (i < 999) {
        // Connect to next room
        const passageSide = Math.floor(Math.random() * 4);
        let passage = {};
        
        switch(passageSide) {
            case 0: // Top
                passage = { x: canvas.width/2 - 50, y: 0, width: 100, height: 80, targetRoom: i + 1, targetX: canvas.width/2, targetY: canvas.height - 100 };
                break;
            case 1: // Right
                passage = { x: canvas.width - 80, y: canvas.height/2 - 50, width: 80, height: 100, targetRoom: i + 1, targetX: 100, targetY: canvas.height/2 };
                break;
            case 2: // Bottom
                passage = { x: canvas.width/2 - 50, y: canvas.height - 80, width: 100, height: 80, targetRoom: i + 1, targetX: canvas.width/2, targetY: 100 };
                break;
            case 3: // Left
                passage = { x: 0, y: canvas.height/2 - 50, width: 80, height: 100, targetRoom: i + 1, targetX: canvas.width - 100, targetY: canvas.height/2 };
                break;
        }
        room.passages.push(passage);
    }
    
    // Add some rooms with multiple passages for exploration (more variety)
    if (i % 10 === 0 && i < 990) {
        const extraPassage = { x: canvas.width/4, y: canvas.height/4, width: 80, height: 80, targetRoom: i + 10, targetX: canvas.width/4, targetY: canvas.height/4 };
        room.passages.push(extraPassage);
    }
    
    // Add boss rooms every 100 levels
    if (i % 100 === 99) {
        room.name = `🔥 BOSS ROOM ${Math.floor(i / 100) + 1} 🔥`;
        room.enemies = Math.min(12, 3 + Math.floor(i / 100) * 2); // More enemies in boss rooms
        room.background = '#8B0000'; // Dark red for boss rooms
        room.particle = '#FF0000';
    }
    
    rooms.push(room);
}

// Input Handling
const keysPressed = {};
let mouseX = 0, mouseY = 0;
let mousePressed = { left: false, right: false };

// Touch handling
let touchStartX = 0, touchStartY = 0;
let touchAiming = false;

// Event Listeners
document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    player.mouseX = mouseX;
    player.mouseY = mouseY;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mousePressed.left = true;
    if (e.button === 2) mousePressed.right = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mousePressed.left = false;
    if (e.button === 2) mousePressed.right = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    
    // Set aiming direction based on touch position
    player.mouseX = touchStartX;
    player.mouseY = touchStartY;
    touchAiming = true;
    
    // Shoot selected power when tapping screen
    if (selectedPower) {
        if (selectedPower === 'ice' && powers.ice.cooldown <= 0) {
            shootIce();
        } else if (selectedPower === 'fire' && powers.fire.cooldown <= 0) {
            shootFire();
        } else if (selectedPower === 'combined' && powers.combined.cooldown <= 0) {
            shootCombined();
        }
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (touchAiming) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        player.mouseX = touch.clientX - rect.left;
        player.mouseY = touch.clientY - rect.top;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchAiming = false;
});

// Touch control button events
upBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keysPressed['w'] = true;
});

upBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keysPressed['w'] = false;
});

downBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keysPressed['s'] = true;
});

downBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keysPressed['s'] = false;
});

leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keysPressed['a'] = true;
});

leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keysPressed['a'] = false;
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keysPressed['d'] = true;
});

rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keysPressed['d'] = false;
});

// Touch power button events - select power first
touchIceBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    selectedPower = selectedPower === 'ice' ? null : 'ice';
});

touchFireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    selectedPower = selectedPower === 'fire' ? null : 'fire';
});

touchCombinedBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    selectedPower = selectedPower === 'combined' ? null : 'combined';
});

// Power Button Event Listeners
document.getElementById('ice-btn').addEventListener('click', () => shootIce());
document.getElementById('fire-btn').addEventListener('click', () => shootFire());
document.getElementById('combined-btn').addEventListener('click', () => shootCombined());

// Game Functions
function shootIce() {
    if (powers.ice.cooldown <= 0) {
        createProjectile('ice');
        powers.ice.cooldown = powers.ice.maxCooldown / (gameState.powerUps.rapidFire > 0 ? 2 : 1);
        createShootEffect(player.x, player.y, '#00BFFF', '#87CEEB');
    }
}

function shootFire() {
    if (powers.fire.cooldown <= 0) {
        createProjectile('fire');
        powers.fire.cooldown = powers.fire.maxCooldown / (gameState.powerUps.rapidFire > 0 ? 2 : 1);
        createShootEffect(player.x, player.y, '#FF4500', '#FF6347');
    }
}

function shootCombined() {
    if (powers.combined.cooldown <= 0) {
        createProjectile('combined');
        powers.combined.cooldown = powers.combined.maxCooldown / (gameState.powerUps.rapidFire > 0 ? 2 : 1);
        createShootEffect(player.x, player.y, '#9932CC', '#DDA0DD');
    }
}

function createProjectile(type) {
    const angle = Math.atan2(player.mouseY - player.y, player.mouseX - player.x);
    const speed = 15;
    const damage = powers[type].damage + (gameState.powerUps.damage * 10);
    
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: type,
        damage: damage,
        color: powers[type].color,
        size: type === 'combined' ? 15 : 12,
        life: 120,
        trail: [],
        rotation: 0
    });
}

function createShootEffect(x, y, color1, color2) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 50,
            maxLife: 50,
            color: Math.random() > 0.5 ? color1 : color2,
            size: Math.random() * 8 + 4,
            type: 'shoot'
        });
    }
}

function createHitEffect(x, y, color1, color2) {
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 25,
            vy: (Math.random() - 0.5) * 25,
            life: 60,
            maxLife: 60,
            color: Math.random() > 0.5 ? color1 : color2,
            size: Math.random() * 10 + 5,
            type: 'hit'
        });
    }
}

function createPowerUp() {
    const powerUpTypes = [
        { type: 'speed', color: '#00FF00', symbol: '⚡', duration: 10000 },
        { type: 'damage', color: '#FF4500', symbol: '💥', duration: 15000 },
        { type: 'shield', color: '#4169E1', symbol: '🛡️', duration: 12000 },
        { type: 'rapidFire', color: '#FFD700', symbol: '🔥', duration: 8000 },
        { type: 'health', color: '#FF69B4', symbol: '❤️', duration: 0 },
        { type: 'doubleDamage', color: '#FF0000', symbol: '⚔️', duration: 20000 },
        { type: 'invincibility', color: '#FFFF00', symbol: '⭐', duration: 5000 },
        { type: 'megaSpeed', color: '#00FFFF', symbol: '🚀', duration: 6000 }
    ];
    
    const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    powerUps.push({
        x: Math.random() * (canvas.width - 200) + 100,
        y: Math.random() * (canvas.height - 200) + 100,
        type: powerUp.type,
        color: powerUp.color,
        symbol: powerUp.symbol,
        duration: powerUp.duration,
        size: 25,
        float: 0,
        rotation: 0,
        collected: false,
        pulse: 0,
        sparkles: []
    });
}

function updatePowerUps() {
    // Update active power-ups
    Object.keys(gameState.powerUps).forEach(type => {
        if (gameState.powerUps[type] > 0) {
            gameState.powerUps[type] -= 16;
        }
    });
    
    // Update power-up items
    powerUps.forEach((powerUp, index) => {
        if (!powerUp.collected) {
            powerUp.float += 0.1;
            powerUp.rotation += 0.05;
            powerUp.pulse += 0.2;
            
            // Add sparkles
            if (Math.random() < 0.2) {
                powerUp.sparkles.push({
                    x: powerUp.x + (Math.random() - 0.5) * 60,
                    y: powerUp.y + (Math.random() - 0.5) * 60,
                    life: 50,
                    color: powerUp.color
                });
            }
            
            // Update sparkles
            for (let i = powerUp.sparkles.length - 1; i >= 0; i--) {
                powerUp.sparkles[i].life--;
                if (powerUp.sparkles[i].life <= 0) {
                    powerUp.sparkles.splice(i, 1);
                }
            }
            
            const dx = player.x - powerUp.x;
            const dy = player.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.size + powerUp.size) {
                powerUp.collected = true;
                
                // Handle different power-up types
                if (powerUp.type === 'health') {
                    player.health = Math.min(player.maxHealth, player.health + 50);
                } else if (powerUp.type === 'doubleDamage') {
                    gameState.powerUps.damage = powerUp.duration;
                } else if (powerUp.type === 'invincibility') {
                    gameState.powerUps.shield = powerUp.duration;
                    player.invincible = true;
                    setTimeout(() => { player.invincible = false; }, powerUp.duration);
                } else if (powerUp.type === 'megaSpeed') {
                    gameState.powerUps.speed = powerUp.duration;
                } else {
                    gameState.powerUps[powerUp.type] = powerUp.duration;
                }
                
                createPowerUpEffect(powerUp.x, powerUp.y, powerUp.color);
                powerUps.splice(index, 1);
            }
        }
    });
}

function createPowerUpEffect(x, y, color) {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 80,
            maxLife: 80,
            color: color,
            size: Math.random() * 10 + 5,
            type: 'powerup'
        });
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;
        proj.rotation += 0.4;
        
        // Add trail effect
        proj.trail.push({ x: proj.x, y: proj.y, life: 15 });
        if (proj.trail.length > 10) proj.trail.shift();
        
        // Remove projectiles that are off-screen or expired
        if (proj.life <= 0 || proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = proj.x - enemy.x;
            const dy = proj.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.size + proj.size) {
                enemy.health -= proj.damage;
                enemy.lastHitTime = gameState.gameTime; // Track when hit
                createHitEffect(enemy.x, enemy.y, proj.color, enemy.color);
                projectiles.splice(i, 1);
                
                if (enemy.health <= 0) {
                    createDeathEffect(enemy.x, enemy.y, enemy.color);
                    enemies.splice(j, 1);
                    
                    // Chance to drop power-up (increases with room number)
                    const dropChance = 0.3 + (gameState.currentRoom * 0.01);
                    if (Math.random() < dropChance) {
                        createPowerUp();
                    }
                }
                break;
            }
        }
    }
}

function createDeathEffect(x, y, color) {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 100,
            maxLife: 100,
            color: color,
            size: Math.random() * 12 + 6,
            type: 'death'
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function createEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -30;
            break;
        case 1: // Right
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
            break;
        case 3: // Left
            x = -30;
            y = Math.random() * canvas.height;
            break;
    }
    
    // Different enemy types with fun colors and scaling difficulty
    const enemyTypes = [
        { color: '#4B0082', size: 25, speed: 1.5, health: 40, name: 'Shadow' },
        { color: '#FF4500', size: 20, speed: 2.5, health: 30, name: 'Fire' },
        { color: '#00CED1', size: 28, speed: 1.8, health: 50, name: 'Ice' },
        { color: '#32CD32', size: 22, speed: 2.2, health: 35, name: 'Poison' },
        { color: '#9932CC', size: 26, speed: 2.0, health: 45, name: 'Magic' },
        { color: '#FFD700', size: 30, speed: 1.2, health: 80, name: 'Golden' },
        { color: '#FF69B4', size: 18, speed: 3.0, health: 25, name: 'Pink' },
        { color: '#00FF00', size: 32, speed: 1.0, health: 100, name: 'Tank' },
        { color: '#FF1493', size: 15, speed: 3.5, health: 20, name: 'Speed' },
        { color: '#8A2BE2', size: 35, speed: 0.8, health: 120, name: 'Boss' }
    ];
    
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // Scale difficulty based on room number
    const difficultyMultiplier = 1 + (gameState.currentRoom * 0.1);
    const scaledHealth = Math.floor(enemyType.health * difficultyMultiplier);
    const scaledSpeed = enemyType.speed * (1 + (gameState.currentRoom * 0.05));
    
    enemies.push({
        x: x,
        y: y,
        size: enemyType.size,
        health: scaledHealth,
        maxHealth: scaledHealth,
        speed: scaledSpeed,
        color: enemyType.color,
        name: enemyType.name,
        pulse: 0,
        rotation: 0,
        trail: [],
        lastHitTime: 0 // Track when enemy was last hit to prevent health regen
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
        
        // Add trail effect
        enemy.trail.push({ x: enemy.x, y: enemy.y, life: 20 });
        if (enemy.trail.length > 6) enemy.trail.shift();
        
        // Pulse and rotation effects
        enemy.pulse += 0.2;
        enemy.rotation += 0.08;
        
        // Check collision with player
        const playerDx = player.x - enemy.x;
        const playerDy = player.y - enemy.y;
        const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
        
        if (playerDistance < player.size + enemy.size && !player.invincible) {
            if (gameState.powerUps.shield > 0) {
                // Shield blocks damage
                createHitEffect(player.x, player.y, '#4169E1', '#87CEEB');
            } else {
                player.health -= 15; // Increased damage for better gameplay
                createHitEffect(player.x, player.y, '#FF6B6B', '#FFB6C1');
                player.invincible = true;
                setTimeout(() => { player.invincible = false; }, 1000);
                
                // Visual feedback for damage
                console.log(`Player took damage! Health: ${player.health}/${player.maxHealth}`);
            }
        }
    });
}

function createKey() {
    keys.push({
        x: Math.random() * (canvas.width - 300) + 150,
        y: Math.random() * (canvas.height - 300) + 150,
        size: 25,
        collected: false,
        float: 0,
        glow: 0,
        rotation: 0,
        sparkles: []
    });
}

function updateKeys() {
    keys.forEach((key, index) => {
        if (!key.collected) {
            key.float += 0.1;
            key.glow += 0.15;
            key.rotation += 0.03;
            
            // Add sparkles
            if (Math.random() < 0.15) {
                key.sparkles.push({
                    x: key.x + (Math.random() - 0.5) * 50,
                    y: key.y + (Math.random() - 0.5) * 50,
                    life: 40,
                    color: ['#FFD700', '#FFFACD', '#FFFF00', '#FFA500'][Math.floor(Math.random() * 4)]
                });
            }
            
            // Update sparkles
            for (let i = key.sparkles.length - 1; i >= 0; i--) {
                key.sparkles[i].life--;
                if (key.sparkles[i].life <= 0) {
                    key.sparkles.splice(i, 1);
                }
            }
            
            const dx = player.x - key.x;
            const dy = player.y - key.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.size + key.size) {
                key.collected = true;
                gameState.keys++;
                keyCountElement.textContent = gameState.keys;
                createCollectEffect(key.x, key.y);
                keys.splice(index, 1);
            }
        }
    });
}

function createCollectEffect(x, y) {
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 80,
            maxLife: 80,
            color: ['#FFD700', '#FFFACD', '#FFFF00', '#FFA500'][Math.floor(Math.random() * 4)],
            size: Math.random() * 10 + 5,
            type: 'collect'
        });
    }
}

function loadRoom(roomIndex) {
    gameState.currentRoom = roomIndex;
    const room = rooms[roomIndex];
    
    // Clear existing entities
    enemies = [];
    keys = [];
    projectiles = [];
    particles = [];
    powerUps = [];
    
    // Spawn enemies
    for (let i = 0; i < room.enemies; i++) {
        setTimeout(() => createEnemy(), i * 2500);
    }
    
    // Spawn keys
    for (let i = 0; i < room.keys; i++) {
        setTimeout(() => createKey(), i * 2000);
    }
    
    // Reset player position to center
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
}

function checkRoomTransitions() {
    const room = rooms[gameState.currentRoom];
    
    room.passages.forEach(passage => {
        if (player.x > passage.x && player.x < passage.x + passage.width &&
            player.y > passage.y && player.y < passage.y + passage.height) {
            loadRoom(passage.targetRoom);
            player.x = passage.targetX;
            player.y = passage.targetY;
        }
    });
}

function updatePowers() {
    // Update cooldowns
    Object.keys(powers).forEach(power => {
        if (powers[power].cooldown > 0) {
            powers[power].cooldown -= 16;
        }
    });
    
    // Update button states
    const iceCooldown = powers.ice.cooldown > 0;
    const fireCooldown = powers.fire.cooldown > 0;
    const combinedCooldown = powers.combined.cooldown > 0;
    
    document.getElementById('ice-btn').className = 
        `power-btn ${iceCooldown ? 'cooldown' : ''}`;
    document.getElementById('fire-btn').className = 
        `power-btn ${fireCooldown ? 'cooldown' : ''}`;
    document.getElementById('combined-btn').className = 
        `power-btn ${combinedCooldown ? 'cooldown' : ''}`;
    
    // Update touch power buttons with selection state
    touchIceBtn.className = `touch-power-btn ${iceCooldown ? 'cooldown' : ''} ${selectedPower === 'ice' ? 'selected' : ''}`;
    touchFireBtn.className = `touch-power-btn ${fireCooldown ? 'cooldown' : ''} ${selectedPower === 'fire' ? 'selected' : ''}`;
    touchCombinedBtn.className = `touch-power-btn ${combinedCooldown ? 'cooldown' : ''} ${selectedPower === 'combined' ? 'selected' : ''}`;
}

function updatePlayer() {
    // Movement with speed boost
    let speedBoost = 0;
    if (gameState.powerUps.speed > 0) speedBoost += 3;
    if (gameState.powerUps.megaSpeed > 0) speedBoost += 5;
    const currentSpeed = player.speed + speedBoost;
    
    player.direction.x = 0;
    player.direction.y = 0;
    
    if (keysPressed['w'] || keysPressed['arrowup']) player.direction.y = -1;
    if (keysPressed['s'] || keysPressed['arrowdown']) player.direction.y = 1;
    if (keysPressed['a'] || keysPressed['arrowleft']) player.direction.x = -1;
    if (keysPressed['d'] || keysPressed['arrowright']) player.direction.x = 1;
    
    // Normalize diagonal movement
    if (player.direction.x !== 0 && player.direction.y !== 0) {
        player.direction.x *= 0.707;
        player.direction.y *= 0.707;
    }
    
    player.x += player.direction.x * currentSpeed;
    player.y += player.direction.y * currentSpeed;
    player.glow += 0.15;
    
    // Keep player in bounds
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
    
    // Mouse shooting (desktop)
    if (mousePressed.left && mousePressed.right) {
        shootCombined();
    } else if (mousePressed.left) {
        shootIce();
    } else if (mousePressed.right) {
        shootFire();
    }
    
    // Manual shooting for mobile - handled in touchstart event
}

function drawPlayer() {
    // Player glow effect
    const glowIntensity = Math.sin(player.glow) * 0.4 + 0.6;
    ctx.shadowColor = '#4169E1';
    ctx.shadowBlur = 25 * glowIntensity;
    
    // Shield effect
    if (gameState.powerUps.shield > 0) {
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size + 10, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Player body with gradient
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.size);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#4169E1');
    gradient.addColorStop(1, '#191970');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Player direction indicator
    const angle = Math.atan2(player.mouseY - player.y, player.mouseX - player.x);
    const indicatorX = player.x + Math.cos(angle) * (player.size + 12);
    const indicatorY = player.y + Math.sin(angle) * (player.size + 12);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Health bar
    const healthBarWidth = 80;
    const healthBarHeight = 12;
    const healthPercentage = player.health / player.maxHealth;
    
    // Health bar background
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x - healthBarWidth/2, player.y - player.size - 25, healthBarWidth, healthBarHeight);
    
    // Health bar fill
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(player.x - healthBarWidth/2, player.y - player.size - 25, healthBarWidth * healthPercentage, healthBarHeight);
    
    // Health bar border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - healthBarWidth/2, player.y - player.size - 25, healthBarWidth, healthBarHeight);
    
    // Health text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, Math.floor(player.health))}/${player.maxHealth}`, player.x, player.y - player.size - 35);
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        const floatOffset = Math.sin(powerUp.float) * 10;
        const glowIntensity = Math.sin(powerUp.float * 2) * 0.3 + 0.7;
        const pulseIntensity = Math.sin(powerUp.pulse) * 0.3 + 0.7;
        
        // Draw sparkles
        powerUp.sparkles.forEach(sparkle => {
            const alpha = sparkle.life / 50;
            ctx.fillStyle = `${powerUp.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, 3 * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Power-up glow effect
        ctx.shadowColor = powerUp.color;
        ctx.shadowBlur = 25 * glowIntensity;
        
        // Draw power-up with rotation and pulsing
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y + floatOffset);
        ctx.rotate(powerUp.rotation);
        ctx.scale(pulseIntensity, pulseIntensity);
        
        // Power-up gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.size);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, powerUp.color);
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, powerUp.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Power-up symbol
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(powerUp.symbol, 0, 6);
        
        ctx.restore();
        ctx.shadowBlur = 0;
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        // Enemy trail effect
        enemy.trail.forEach((trailPoint, index) => {
            const alpha = (index / enemy.trail.length) * 0.4;
            ctx.fillStyle = `${enemy.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(trailPoint.x, trailPoint.y, enemy.size * (index / enemy.trail.length), 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Enemy glow effect
        const glowIntensity = Math.sin(enemy.pulse) * 0.5 + 0.5;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 20 * glowIntensity;
        
        // Enemy body with rotation
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);
        
        // Create gradient for enemy
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.size);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, enemy.color);
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        ctx.shadowBlur = 0;
        
        // Health bar
        const healthBarWidth = 60;
        const healthBarHeight = 6;
        const healthPercentage = enemy.health / enemy.maxHealth;
        
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(enemy.x - healthBarWidth/2, enemy.y - enemy.size - 18, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(enemy.x - healthBarWidth/2, enemy.y - enemy.size - 18, healthBarWidth * healthPercentage, healthBarHeight);
    });
}

function drawKeys() {
    keys.forEach(key => {
        if (!key.collected) {
            const floatOffset = Math.sin(key.float) * 10;
            const glowIntensity = Math.sin(key.glow) * 0.5 + 0.5;
            
            // Draw sparkles
            key.sparkles.forEach(sparkle => {
                const alpha = sparkle.life / 40;
                ctx.fillStyle = `${sparkle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                ctx.beginPath();
                ctx.arc(sparkle.x, sparkle.y, 4 * alpha, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Key glow effect
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 30 * glowIntensity;
            
            // Draw key with rotation and gradient
            ctx.save();
            ctx.translate(key.x, key.y + floatOffset);
            ctx.rotate(key.rotation);
            
            // Key gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, key.size);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.3, '#FFD700');
            gradient.addColorStop(0.7, '#DAA520');
            gradient.addColorStop(1, '#B8860B');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, key.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Key details
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, key.size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
            ctx.shadowBlur = 0;
        }
    });
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        // Draw trail with fading
        proj.trail.forEach((trailPoint, index) => {
            const alpha = (index / proj.trail.length) * 0.7;
            ctx.fillStyle = `${proj.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(trailPoint.x, trailPoint.y, proj.size * (index / proj.trail.length), 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw projectile with rotation
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.rotation);
        
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 25;
        
        // Projectile gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, proj.size);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.5, proj.color);
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, proj.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        ctx.shadowBlur = 0;
    });
}

function drawParticles() {
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        const size = particle.size * alpha;
        
        ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect for certain particle types
        if (particle.type === 'collect' || particle.type === 'death' || particle.type === 'powerup') {
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 15 * alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
}

function drawPassages() {
    const room = rooms[gameState.currentRoom];
    
    room.passages.forEach(passage => {
        // Passage background with gradient
        const gradient = ctx.createLinearGradient(passage.x, passage.y, passage.x + passage.width, passage.y + passage.height);
        gradient.addColorStop(0, '#654321');
        gradient.addColorStop(0.5, '#8B4513');
        gradient.addColorStop(1, '#A0522D');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(passage.x, passage.y, passage.width, passage.height);
        
        // Passage border with glow
        ctx.shadowColor = '#8B4513';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 5;
        ctx.strokeRect(passage.x, passage.y, passage.width, passage.height);
        ctx.shadowBlur = 0;
        
        // Arrow indicator with animation
        const arrowGlow = Math.sin(gameState.gameTime * 0.15) * 0.4 + 0.6;
        ctx.fillStyle = `#FFD700${Math.floor(arrowGlow * 255).toString(16).padStart(2, '0')}`;
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('→', passage.x + passage.width/2, passage.y + passage.height/2 + 12);
    });
}

function drawRoomInfo() {
    const room = rooms[gameState.currentRoom];
    
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(10, 50, 350, 110);
    
    ctx.fillStyle = 'white';
    ctx.font = '22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Room: ${room.name}`, 20, 85);
    ctx.fillText(`Progress: ${gameState.currentRoom + 1}/${gameState.totalRooms}`, 20, 115);
    ctx.fillText(`Level: ${room.difficultyLevel || 1}`, 20, 145);
    ctx.fillText(`Enemies: ${room.enemies}`, 20, 175);
    
    // Power-up status
    let powerUpText = '';
    Object.keys(gameState.powerUps).forEach(type => {
        if (gameState.powerUps[type] > 0) {
            const icons = { 
                speed: '⚡', 
                damage: '💥', 
                shield: '🛡️', 
                rapidFire: '🔥',
                doubleDamage: '⚔️',
                invincibility: '⭐',
                megaSpeed: '🚀'
            };
            powerUpText += `${icons[type]} `;
        }
    });
    if (powerUpText) {
        ctx.fillText(`Active: ${powerUpText}`, 20, 205);
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    const room = rooms[gameState.currentRoom];
    ctx.fillStyle = room.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add room-specific particle effects
    if (Math.random() < 0.15) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 80,
            maxLife: 80,
            color: room.particle,
            size: Math.random() * 6 + 3,
            type: 'ambient'
        });
    }
    
    // Spawn power-ups randomly
    if (Math.random() < 0.005 && powerUps.length < 3) {
        createPowerUp();
    }
    
    // Update game state
    updatePlayer();
    updateEnemies();
    updateKeys();
    updateProjectiles();
    updateParticles();
    updatePowerUps();
    updatePowers();
    checkRoomTransitions();
    
    // Draw everything
    drawPassages();
    drawKeys();
    drawPowerUps();
    drawEnemies();
    drawProjectiles();
    drawParticles();
    drawPlayer();
    drawRoomInfo();
    
    // Check game over
    if (player.health <= 0) {
        if (!gameState.gameOverTimer) {
            gameState.gameOverTimer = 3; // Start 3 second countdown
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText(`Keys Collected: ${gameState.keys}`, canvas.width/2, canvas.height/2 + 40);
        ctx.fillText(`Rooms Explored: ${gameState.currentRoom + 1}/${gameState.totalRooms}`, canvas.width/2, canvas.height/2 + 70);
        
        // Countdown timer with proper counting
        const countdownSeconds = Math.ceil(gameState.gameOverTimer);
        ctx.fillStyle = '#FFD700';
        ctx.font = '36px Arial';
        ctx.fillText(`Returning to menu in ${countdownSeconds}...`, canvas.width/2, canvas.height/2 + 110);
        
        // Update countdown properly
        gameState.gameOverTimer -= 1/60; // Subtract 1/60th of a second (60 FPS)
        
        if (gameState.gameOverTimer <= 0) {
            gameState.gameOverTimer = null;
            showHome();
        }
        
        // Continue the game loop even when dead
        gameState.gameTime++;
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Check win condition
    if (gameState.keys >= gameState.totalRooms) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText(`All ${gameState.totalRooms} Keys Collected!`, canvas.width/2, canvas.height/2 + 40);
        ctx.fillText(`Rooms Explored: ${gameState.currentRoom + 1}/${gameState.totalRooms}`, canvas.width/2, canvas.height/2 + 70);
        ctx.fillText('You completed the adventure!', canvas.width/2, canvas.height/2 + 110);
        
        // Menu button
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(canvas.width/2 - 100, canvas.height/2 + 130, 200, 50);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('🏠 Main Menu', canvas.width/2, canvas.height/2 + 160);
        
        // Check for menu click (works with both mouse and touch)
        canvas.addEventListener('click', handleMenuClick, { once: true });
        canvas.addEventListener('touchstart', handleMenuClick, { once: true });
        return;
    }
    
    gameState.gameTime++;
    requestAnimationFrame(gameLoop);
}



function handleMenuClick(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let x, y;
    if (e.touches && e.touches[0]) {
        // Touch event
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        // Mouse event
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    
    // Check if click/touch is on menu button
    if (x > canvas.width/2 - 100 && x < canvas.width/2 + 100 &&
        y > canvas.height/2 + 130 && y < canvas.height/2 + 180) {
        showHome();
    }
}

// Menu system
let gameRunning = false;
let gameInitialized = false;

// Menu elements
const homeScreen = document.getElementById('homeScreen');
const instructionsScreen = document.getElementById('instructionsScreen');
const gameContainer = document.getElementById('gameContainer');
const startGameBtn = document.getElementById('startGameBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

// Menu event listeners
startGameBtn.addEventListener('click', startGame);
instructionsBtn.addEventListener('click', showInstructions);
backToMenuBtn.addEventListener('click', showHome);

function startGame() {
    homeScreen.style.display = 'none';
    instructionsScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    
    if (!gameInitialized) {
        loadRoom(0);
        gameInitialized = true;
    } else {
        restartGame();
    }
    
    gameRunning = true;
    gameLoop();
}

function showInstructions() {
    homeScreen.style.display = 'none';
    instructionsScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
}

function showHome() {
    homeScreen.style.display = 'flex';
    instructionsScreen.style.display = 'none';
    gameContainer.style.display = 'none';
    gameRunning = false;
}

function restartGame() {
    // Reset game state
    gameState = {
        keys: 0,
        currentRoom: 0,
        gameTime: 0,
        totalRooms: 1000,
        gameOverTimer: null,
        powerUps: {
            speed: 0,
            damage: 0,
            shield: 0,
            rapidFire: 0
        }
    };
    
    // Reset player
    player.x = 400;
    player.y = 300;
    player.health = 150;
    player.invincible = false;
    
    // Clear arrays
    enemies = [];
    keys = [];
    projectiles = [];
    particles = [];
    powerUps = [];
    
    // Reset powers
    Object.keys(powers).forEach(power => {
        powers[power].cooldown = 0;
    });
    
    // Load first room
    loadRoom(0);
    
    // Update UI
    keyCountElement.textContent = '0';
}
