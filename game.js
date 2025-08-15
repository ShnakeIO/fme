// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const keyCountElement = document.getElementById('keyCount');

// Screen effects
let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
let screenFlash = { alpha: 0, color: '#FFFFFF', duration: 0 };
let chromaAberration = { intensity: 0, duration: 0 };

// Enhanced particle system
let backgroundParticles = [];
let ambientEffects = [];
let screenEffects = [];

// Background effect system
let backgroundAnimation = {
    time: 0,
    stars: [],
    floatingOrbs: [],
    roomEffects: []
};

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
const touchLightningBtn = document.getElementById('touch-lightning-btn');

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
    },
    bossFightOffered: false,
    inBossArena: false,
    returnRoom: 0,
    hasLightningPower: false,
    powerUpgrades: {
        ice: 0,
        fire: 0,
        combined: 0
    },
    powerUpgradeTimer: null,
    selectedUpgradePower: null,
    isPaused: false,
    inventory: {},
    superPowers: {
        unlocked: ['ice', 'fire', 'combined'], // First 3 unlocked by default
        equipped: ['ice', 'fire', 'combined'] // Ice, Fire, Combined equipped by default
    },
    currentLevel: 1
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
    combined: { cooldown: 0, maxCooldown: 2000, damage: 70, color: '#9932CC' },
    lightning: { cooldown: 0, maxCooldown: 1500, damage: 100, color: '#FFFF00' }
};

// Projectiles
let projectiles = [];

// Enemies
let enemies = [];

// Keys
let keys = [];

// Power-ups
let powerUps = [];

// Particles for effects with performance limits
let particles = [];
const MAX_PARTICLES = 500; // Prevent particle overflow for performance
const MAX_PROJECTILES = 80; // Prevent projectile overflow for performance
let particleSpawnCooldown = 0; // Limit particle spawning rate
let frameTime = 0;
let lastFrameTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME_TARGET = 1000 / TARGET_FPS;
let explosionParticles = [];
let magicParticles = [];
let trailParticles = [];

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
        name: `Room ${i + 1} - ${theme.name}`, // Simple sequential numbering
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
    
    // Remove extra passages that skip rooms - we want sequential progression only
    
    // Add boss rooms every 100 levels
    if (i % 100 === 99) {
        room.name = `🔥 BOSS ROOM ${i + 1} 🔥`;
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
        } else if (selectedPower === 'lightning' && powers.lightning.cooldown <= 0 && gameState.hasLightningPower) {
            shootLightning();
        } else if (selectedPower === 'superpower1') {
            useSuperPower(0);
        } else if (selectedPower === 'superpower2') {
            useSuperPower(1);
        } else if (selectedPower === 'superpower3') {
            useSuperPower(2);
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

// Keep lightning touch button event listener
touchLightningBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    selectedPower = selectedPower === 'lightning' ? null : 'lightning';
});

// Power Button Event Listeners
document.getElementById('ice-btn').addEventListener('click', () => shootIce());
document.getElementById('fire-btn').addEventListener('click', () => shootFire());
document.getElementById('combined-btn').addEventListener('click', () => shootCombined());
document.getElementById('lightning-btn').addEventListener('click', () => shootLightning());

// Pause and Inventory Button Event Listeners
document.getElementById('pause-btn').addEventListener('click', toggleInventory);
document.getElementById('resumeBtn').addEventListener('click', toggleInventory);

// Tab Event Listeners
document.getElementById('powerupsTab').addEventListener('click', () => switchTab('powerups'));
document.getElementById('superpowersTab').addEventListener('click', () => switchTab('superpowers'));

// Super Power Button Event Listeners
document.getElementById('superpower1-btn').addEventListener('click', () => useSuperPower(0));
document.getElementById('superpower2-btn').addEventListener('click', () => useSuperPower(1));
document.getElementById('superpower3-btn').addEventListener('click', () => useSuperPower(2));

// Touch Super Power Button Event Listeners
document.getElementById('touch-superpower1-btn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    selectedPower = selectedPower === 'superpower1' ? null : 'superpower1';
    updateSuperPowerButtons();
});
document.getElementById('touch-superpower2-btn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    selectedPower = selectedPower === 'superpower2' ? null : 'superpower2';
    updateSuperPowerButtons();
});
document.getElementById('touch-superpower3-btn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    selectedPower = selectedPower === 'superpower3' ? null : 'superpower3';
    updateSuperPowerButtons();
});

// Super Power Definitions
const superPowers = [
    { id: 'ice', name: 'Ice Beam', symbol: '❄️', unlockLevel: 0, description: 'Shoots ice projectiles that freeze enemies' },
    { id: 'fire', name: 'Fire Beam', symbol: '🔥', unlockLevel: 0, description: 'Shoots fire projectiles that burn enemies' },
    { id: 'combined', name: 'Combined Beam', symbol: '⚡', unlockLevel: 0, description: 'Powerful combination of ice and fire' },
    { id: 'teleport', name: 'Teleport', symbol: '🌀', unlockLevel: 25, description: 'Instantly teleport to mouse position' },
    { id: 'timeSlow', name: 'Time Slow', symbol: '⏰', unlockLevel: 50, description: 'Slows down all enemies for 10 seconds' },
    { id: 'shield', name: 'Energy Shield', symbol: '🛡️', unlockLevel: 75, description: 'Absorbs all damage for 15 seconds' },
    { id: 'multiShot', name: 'Multi Shot', symbol: '🎯', unlockLevel: 100, description: 'Shoots 8 projectiles in all directions' },
    { id: 'heal', name: 'Full Heal', symbol: '💚', unlockLevel: 125, description: 'Instantly restore full health' },
    { id: 'freeze', name: 'Freeze All', symbol: '❄️', unlockLevel: 150, description: 'Freezes all enemies for 8 seconds' },
    { id: 'explosion', name: 'Nova Blast', symbol: '💥', unlockLevel: 175, description: 'Massive explosion around player' },
    { id: 'ghost', name: 'Ghost Mode', symbol: '👻', unlockLevel: 200, description: 'Walk through enemies and walls for 12 seconds' },
    { id: 'magnet', name: 'Item Magnet', symbol: '🧲', unlockLevel: 225, description: 'Attracts all items to player for 20 seconds' },
    { id: 'clone', name: 'Shadow Clone', symbol: '👥', unlockLevel: 250, description: 'Creates 3 clones that fight with you' },
    { id: 'lightning', name: 'Chain Lightning', symbol: '⚡', unlockLevel: 275, description: 'Lightning jumps between all enemies' },
    { id: 'meteor', name: 'Meteor Storm', symbol: '☄️', unlockLevel: 300, description: 'Rain meteors from the sky' },
    { id: 'void', name: 'Void Portal', symbol: '🌑', unlockLevel: 325, description: 'Creates portal that sucks in enemies' },
    { id: 'phoenix', name: 'Phoenix Form', symbol: '🔥', unlockLevel: 350, description: 'Transform into phoenix, immune to damage' },
    { id: 'timeBomb', name: 'Time Bomb', symbol: '⏱️', unlockLevel: 375, description: 'Places bomb that explodes after 5 seconds' },
    { id: 'laser', name: 'Death Laser', symbol: '🔴', unlockLevel: 400, description: 'Continuous laser beam that follows mouse' },
    { id: 'blackHole', name: 'Black Hole', symbol: '⚫', unlockLevel: 425, description: 'Creates black hole that destroys everything' },
    { id: 'godMode', name: 'God Mode', symbol: '👑', unlockLevel: 450, description: 'Ultimate power - invincible for 30 seconds' },
    { id: 'nuclear', name: 'Nuclear Blast', symbol: '☢️', unlockLevel: 475, description: 'Screen-clearing nuclear explosion' },
    { id: 'reality', name: 'Reality Warp', symbol: '🌈', unlockLevel: 500, description: 'Bend reality - instant room clear' }
];

// Game Functions
function shootIce() {
    if (powers.ice.cooldown <= 0) {
        createProjectile('ice');
        // Faster cooldown with upgrades
        let cooldownReduction = gameState.powerUpgrades.ice > 0 ? 0.7 : 1;
        powers.ice.cooldown = (powers.ice.maxCooldown * cooldownReduction) / (gameState.powerUps.rapidFire > 0 ? 2 : 1);
        createShootEffect(player.x, player.y, '#00BFFF', '#87CEEB');
    }
}

function shootFire() {
    if (powers.fire.cooldown <= 0) {
        createProjectile('fire');
        // Faster cooldown with upgrades
        let cooldownReduction = gameState.powerUpgrades.fire > 0 ? 0.7 : 1;
        powers.fire.cooldown = (powers.fire.maxCooldown * cooldownReduction) / (gameState.powerUps.rapidFire > 0 ? 2 : 1);
        createShootEffect(player.x, player.y, '#FF4500', '#FF6347');
    }
}

function shootCombined() {
    if (powers.combined.cooldown <= 0) {
        createProjectile('combined');
        // Much faster cooldown with upgrades
        let cooldownReduction = gameState.powerUpgrades.combined > 0 ? 0.5 : 1;
        powers.combined.cooldown = (powers.combined.maxCooldown * cooldownReduction) / (gameState.powerUps.rapidFire > 0 ? 2 : 1);
        createShootEffect(player.x, player.y, '#9932CC', '#DDA0DD');
    }
}

function shootLightning() {
    if (powers.lightning.cooldown <= 0 && gameState.hasLightningPower) {
        // Lightning storm creates multiple projectiles in different directions
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            createLightningProjectile(angle);
        }
        powers.lightning.cooldown = powers.lightning.maxCooldown / (gameState.powerUps.rapidFire > 0 ? 2 : 1);
        createLightningEffect(player.x, player.y);
    }
}

function createProjectile(type) {
    const angle = Math.atan2(player.mouseY - player.y, player.mouseX - player.x);
    const speed = 15;
    
    // Calculate damage with upgrades (reduced upgrade bonuses)
    let baseDamage = powers[type].damage;
    if (gameState.powerUpgrades[type] > 0) {
        if (type === 'ice') baseDamage += 8 * gameState.powerUpgrades[type]; // Reduced from 20 to 8
        else if (type === 'fire') baseDamage += 10 * gameState.powerUpgrades[type]; // Reduced from 25 to 10
        else if (type === 'combined') baseDamage += 15 * gameState.powerUpgrades[type]; // Reduced from 40 to 15
    }
    
    const damage = Math.max(1, baseDamage + (gameState.powerUps.damage * 10)); // Ensure positive damage
    
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: type,
        damage: damage,
        color: powers[type].color,
        size: type === 'combined' ? 15 : (type === 'lightning' ? 18 : 12),
        life: 120,
        trail: [],
        rotation: 0
    });
    
    // Debug logging
    console.log(`Created ${type} projectile with ${damage} damage`);
}

function createLightningProjectile(angle) {
    const speed = 18;
    const damage = powers.lightning.damage + (gameState.powerUps.damage * 10);
    
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: 'lightning',
        damage: damage,
        color: powers.lightning.color,
        size: 18,
        life: 150,
        trail: [],
        rotation: 0,
        lightning: true
    });
}

function createLightningEffect(x, y) {
    // Optimized lightning effect - reduced from 120 to 30 particles total
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            life: 80,
            maxLife: 80,
            color: Math.random() > 0.5 ? '#FFFF00' : '#FFFFFF',
            size: Math.random() * 22 + 12, // Slightly larger to maintain visual impact
            type: 'lightning',
            glow: true,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.5
        });
    }
    
    // Add lightning bolts - reduced from 40 to 10 particles
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        for (let j = 0; j < 2; j++) {
            particles.push({
                x: x + Math.cos(angle) * j * 30,
                y: y + Math.sin(angle) * j * 30,
                vx: Math.cos(angle) * 18,
                vy: Math.sin(angle) * 18,
                life: 40 - j * 10,
                maxLife: 40 - j * 10,
                color: '#FFFFFF',
                size: 20 - j * 4, // Larger bolts for better visibility
                type: 'bolt',
                glow: true
            });
        }
    }
    
    // Add massive screen effects for lightning
    addScreenShake(8, 300);
    addScreenFlash('#FFFF00', 0.5, 200);
    addChromaAberration(5, 250);
}

function createShootEffect(x, y, color1, color2) {
    // Optimized muzzle flash effect - reduced from 35 to 12 particles
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 25,
            vy: (Math.random() - 0.5) * 25,
            life: 60,
            maxLife: 60,
            color: Math.random() > 0.5 ? color1 : color2,
            size: Math.random() * 16 + 8, // Slightly larger particles for better visibility
            type: 'shoot',
            glow: true,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3
        });
    }
    
    // Add bright center flash
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 20,
        maxLife: 20,
        color: '#FFFFFF',
        size: 45, // Slightly larger flash for better impact
        type: 'flash',
        glow: true
    });
    
    // Add screen shake for shooting
    addScreenShake(2, 100);
}

function createHitEffect(x, y, color1, color2) {
    // Optimized hit effect - reduced from 52 to 20 particles total
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 35,
            vy: (Math.random() - 0.5) * 35,
            life: 80,
            maxLife: 80,
            color: Math.random() > 0.5 ? color1 : color2,
            size: Math.random() * 18 + 10, // Larger particles for better visibility
            type: 'hit',
            glow: true,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.4
        });
    }
    
    // Add impact ring - reduced from 12 to 5 particles
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        particles.push({
            x: x + Math.cos(angle) * 15,
            y: y + Math.sin(angle) * 15,
            vx: Math.cos(angle) * 25,
            vy: Math.sin(angle) * 25,
            life: 40,
            maxLife: 40,
            color: '#FFFFFF',
            size: Math.random() * 12 + 8, // Larger ring particles
            type: 'ring',
            glow: true
        });
    }
    
    // Add screen shake and flash for hits
    addScreenShake(4, 150);
    addScreenFlash('#FFFFFF', 0.3, 100);
}

function createPowerUp() {
    const powerUpTypes = [
        { type: 'speed', color: '#00FF00', symbol: '⚡', duration: 10000 },
        { type: 'damage', color: '#FF4500', symbol: '💥', duration: 15000 },
        { type: 'shield', color: '#4169E1', symbol: '🛡️', duration: 12000 },
        { type: 'rapidFire', color: '#FFD700', symbol: '🔥', duration: 8000 },
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

function createFoodItem() {
    const foodTypes = [
        { type: 'apple', color: '#FF6B6B', symbol: '🍎', healAmount: 15 },
        { type: 'banana', color: '#FFE135', symbol: '🍌', healAmount: 12 },
        { type: 'orange', color: '#FF8C42', symbol: '🍊', healAmount: 18 },
        { type: 'grapes', color: '#9B59B6', symbol: '🍇', healAmount: 10 },
        { type: 'strawberry', color: '#E74C3C', symbol: '🍓', healAmount: 8 },
        { type: 'watermelon', color: '#2ECC71', symbol: '🍉', healAmount: 25 },
        { type: 'pineapple', color: '#F39C12', symbol: '🍍', healAmount: 20 },
        { type: 'cherry', color: '#C0392B', symbol: '🍒', healAmount: 6 },
        { type: 'peach', color: '#FFAB91', symbol: '🍑', healAmount: 14 },
        { type: 'lemon', color: '#F1C40F', symbol: '🍋', healAmount: 5 },
        { type: 'avocado', color: '#27AE60', symbol: '🥑', healAmount: 30 },
        { type: 'carrot', color: '#E67E22', symbol: '🥕', healAmount: 16 },
        { type: 'broccoli', color: '#16A085', symbol: '🥦', healAmount: 22 },
        { type: 'bread', color: '#D4AC0D', symbol: '🍞', healAmount: 35 },
        { type: 'cheese', color: '#F7DC6F', symbol: '🧀', healAmount: 28 }
    ];
    
    const food = foodTypes[Math.floor(Math.random() * foodTypes.length)];
    
    powerUps.push({
        x: Math.random() * (canvas.width - 200) + 100,
        y: Math.random() * (canvas.height - 200) + 100,
        type: food.type,
        color: food.color,
        symbol: food.symbol,
        healAmount: food.healAmount,
        duration: 0,
        size: 25,
        float: 0,
        rotation: 0,
        collected: false,
        pulse: 0,
        sparkles: [],
        isFood: true
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
        // Magnet mode - attract items to player
        if (player.magnetMode) {
            const dx = player.x - powerUp.x;
            const dy = player.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                const magnetForce = 5;
                powerUp.x += (dx / distance) * magnetForce;
                powerUp.y += (dy / distance) * magnetForce;
            }
        }
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
                
                // Add to inventory instead of immediate activation
                if (powerUp.isFood) {
                    addToInventory(powerUp.type, powerUp.symbol, powerUp.color, 0, powerUp.healAmount);
                } else {
                    addToInventory(powerUp.type, powerUp.symbol, powerUp.color, powerUp.duration);
                }
                
                createPowerUpEffect(powerUp.x, powerUp.y, powerUp.color);
                powerUps.splice(index, 1);
            }
        }
    });
}

function createPowerUpEffect(x, y, color) {
    // Create main burst particles
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 25,
            vy: (Math.random() - 0.5) * 25,
            life: 100,
            maxLife: 100,
            color: color,
            size: Math.random() * 12 + 6,
            type: 'powerup',
            glow: true
        });
    }
    
    // Create sparkle ring effect
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        particles.push({
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            life: 120,
            maxLife: 120,
            color: '#FFFFFF',
            size: Math.random() * 8 + 4,
            type: 'sparkle',
            glow: true
        });
    }
    
    // Create center flash
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 30,
        maxLife: 30,
        color: '#FFFFFF',
        size: 50,
        type: 'flash',
        glow: true
    });
}

function updateProjectiles() {
    // Enforce projectile limit for performance
    if (projectiles.length > MAX_PROJECTILES) {
        // Remove oldest projectiles first
        projectiles.splice(0, projectiles.length - MAX_PROJECTILES);
    }
    
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
        
        // Boss projectiles hit player
        if (proj.fromBoss) {
            const dx = proj.x - player.x;
            const dy = proj.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.size + proj.size && !player.invincible) {
                if (gameState.powerUps.shield > 0) {
                    createHitEffect(player.x, player.y, '#4169E1', '#87CEEB');
                } else {
                    player.health -= proj.damage;
                    createHitEffect(player.x, player.y, '#FF6B6B', '#FFB6C1');
                    player.invincible = true;
                    setTimeout(() => { player.invincible = false; }, 1000);
                }
                projectiles.splice(i, 1);
            }
            continue;
        }
        
        // Player projectiles hit enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = proj.x - enemy.x;
            const dy = proj.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.size + proj.size) {
                enemy.lastHitTime = gameState.gameTime; // Track when hit
                createHitEffect(enemy.x, enemy.y, proj.color, enemy.color);
                projectiles.splice(i, 1);
                
                // Apply damage to enemy
                if (enemy.isBoss) {
                    // Boss hit system: each hit = 1 point of damage
                    enemy.health -= 1;
                    console.log(`Boss hit! Hits taken: ${enemy.maxHealth - enemy.health + 1}/14`);
                } else {
                    // Normal enemies use regular damage system
                    const damageToApply = Math.abs(proj.damage);
                    enemy.health -= damageToApply;
                    console.log(`Enemy hit! Damage: ${damageToApply}, Enemy health: ${enemy.health}/${enemy.maxHealth}`);
                }
                
                // Ensure enemy health doesn't regenerate and clamp it properly
                enemy.health = Math.max(0, enemy.health); // Prevent negative health
                enemy.health = Math.min(enemy.health, enemy.maxHealth); // Prevent over-healing
                
                if (enemy.health <= 0) {
                    createDeathEffect(enemy.x, enemy.y, enemy.color);
                    enemies.splice(j, 1);
                    
                    // Chance to drop power-up or food (increases with room number)
                    if (!gameState.inBossArena) {
                        const dropChance = 0.4 + (gameState.currentRoom * 0.01);
                        if (Math.random() < dropChance) {
                            // 60% chance for food, 40% chance for power-up
                            if (Math.random() < 0.6) {
                                createFoodItem();
                            } else {
                                createPowerUp();
                            }
                        }
                    }
                }
                break;
            }
        }
    }
}

function createDeathEffect(x, y, color) {
    // Optimized death explosion - reduced from 60 to 25 particles
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 45,
            vy: (Math.random() - 0.5) * 45,
            life: 120,
            maxLife: 120,
            color: color,
            size: Math.random() * 18 + 10,
            type: 'death',
            glow: true,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3
        });
    }
    
    // Add death shockwave
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 25,
            vy: Math.sin(angle) * 25,
            life: 60,
            maxLife: 60,
            color: '#FFFFFF',
            size: Math.random() * 12 + 8,
            type: 'shockwave',
            glow: true
        });
    }
    
    // Add central explosion flash
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 40,
        maxLife: 40,
        color: '#FFFFFF',
        size: 80,
        type: 'explosion_flash',
        glow: true
    });
    
    addScreenShake(6, 200);
    addScreenFlash('#FFFFFF', 0.4, 150);
}

// Helper function to add particles with performance checks
function addParticle(particleData) {
    if (particles.length < MAX_PARTICLES && particleSpawnCooldown <= 0) {
        particles.push(particleData);
        particleSpawnCooldown = 1; // Small cooldown between spawns
        return true;
    }
    return false;
}

// Clear all particles and projectiles for performance when changing rooms/boss fights
function clearAllParticles() {
    particles.length = 0;
    explosionParticles.length = 0;
    magicParticles.length = 0;
    trailParticles.length = 0;
    projectiles.length = 0;
    backgroundParticles.length = 0; // Clear background particles that build up
    ambientEffects.length = 0; // Clear ambient effects
    screenEffects.length = 0; // Clear screen effects
    
    // Also clear background animation effects that could build up
    if (backgroundAnimation) {
        backgroundAnimation.stars.length = 0;
        backgroundAnimation.floatingOrbs.length = 0;
        backgroundAnimation.roomEffects.length = 0;
    }
    
    console.log('Cleared all particles, projectiles, and background effects for performance optimization');
}

function updateParticles() {
    // Monitor frame performance and adjust particle spawning
    const currentTime = performance.now();
    frameTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    // If frame time is too high, reduce particle spawn rate
    if (frameTime > FRAME_TIME_TARGET * 1.5) {
        particleSpawnCooldown = Math.max(particleSpawnCooldown, 3);
    } else if (particleSpawnCooldown > 0) {
        particleSpawnCooldown--;
    }
    
    // Enforce particle limit for performance (more aggressive when lagging)
    const maxParticles = frameTime > FRAME_TIME_TARGET * 2 ? MAX_PARTICLES * 0.6 : MAX_PARTICLES;
    if (particles.length > maxParticles) {
        // Remove oldest particles first (from the beginning of array)
        particles.splice(0, particles.length - maxParticles);
    }
    
    // Batch particle updates for better performance
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Enhanced particle physics with optimized checks
        const particleType = particle.type;
        if (particleType === 'lightning' || particleType === 'bolt') {
            particle.vx *= 0.92; // Lightning particles slow down faster
            particle.vy *= 0.92;
        } else if (particleType === 'explosion_flash') {
            // Explosion flash expands
            particle.size *= 1.05;
        } else {
            particle.vx *= 0.95;
            particle.vy *= 0.95;
        }
        
        // Update rotation for spinning particles (optimized check)
        if (particle.rotationSpeed !== undefined) {
            particle.rotation += particle.rotationSpeed;
        }
        
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Update screen effects
    updateScreenEffects();
}

// Screen Effect Functions
function addScreenShake(intensity, duration) {
    // Completely disabled - no screen shake at all
    // This prevents any camera movement issues
    return;
}

function addScreenFlash(color, alpha, duration) {
    screenFlash.color = color;
    screenFlash.alpha = Math.max(screenFlash.alpha, alpha);
    screenFlash.duration = Math.max(screenFlash.duration, duration);
}

function addChromaAberration(intensity, duration) {
    chromaAberration.intensity = Math.max(chromaAberration.intensity, intensity);
    chromaAberration.duration = Math.max(chromaAberration.duration, duration);
}

function updateScreenEffects() {
    // Update screen shake with bounds checking
    if (screenShake.duration > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        
        // Clamp shake to prevent excessive screen displacement
        screenShake.x = Math.max(-2, Math.min(2, screenShake.x));
        screenShake.y = Math.max(-2, Math.min(2, screenShake.y));
        
        screenShake.duration -= 16;
        screenShake.intensity *= 0.9; // Faster decay
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
        screenShake.intensity = 0;
    }
    
    // Update screen flash
    if (screenFlash.duration > 0) {
        screenFlash.duration -= 16;
        screenFlash.alpha *= 0.92;
    } else {
        screenFlash.alpha = 0;
    }
    
    // Update chroma aberration
    if (chromaAberration.duration > 0) {
        chromaAberration.duration -= 16;
        chromaAberration.intensity *= 0.95;
    } else {
        chromaAberration.intensity = 0;
    }
}

function applyScreenEffects() {
    // Screen shake completely disabled - no canvas translation at all
    // This ensures the screen never moves from center
    return;
}

function renderScreenEffects() {
    // Screen shake disabled - no transform resets needed
    // Canvas stays perfectly centered at all times
    
    // Render screen flash
    if (screenFlash.alpha > 0) {
        ctx.fillStyle = `${screenFlash.color}${Math.floor(screenFlash.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Background Effects System
function initializeBackgroundEffects() {
    // Initialize floating stars
    for (let i = 0; i < 50; i++) {
        backgroundAnimation.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 0.05 + 0.02,
            twinklePhase: Math.random() * Math.PI * 2
        });
    }
    
    // Initialize floating orbs
    for (let i = 0; i < 8; i++) {
        backgroundAnimation.floatingOrbs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 30 + 20,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            alpha: Math.random() * 0.3 + 0.1,
            color: ['#4169E1', '#9932CC', '#FFD700', '#00CED1'][Math.floor(Math.random() * 4)],
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.03 + 0.01
        });
    }
}

function updateBackgroundEffects() {
    backgroundAnimation.time += 0.016;
    
    // Prevent background effects from building up too much
    if (backgroundAnimation.stars.length > 60) {
        backgroundAnimation.stars.splice(0, backgroundAnimation.stars.length - 50);
    }
    if (backgroundAnimation.floatingOrbs.length > 12) {
        backgroundAnimation.floatingOrbs.splice(0, backgroundAnimation.floatingOrbs.length - 8);
    }
    
    // Update twinkling stars
    backgroundAnimation.stars.forEach(star => {
        star.twinklePhase += star.twinkleSpeed;
        star.alpha = 0.3 + Math.sin(star.twinklePhase) * 0.5;
    });
    
    // Update floating orbs
    backgroundAnimation.floatingOrbs.forEach(orb => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.pulse += orb.pulseSpeed;
        
        // Bounce off edges
        if (orb.x < 0 || orb.x > canvas.width) orb.vx *= -1;
        if (orb.y < 0 || orb.y > canvas.height) orb.vy *= -1;
        
        // Keep in bounds
        orb.x = Math.max(0, Math.min(canvas.width, orb.x));
        orb.y = Math.max(0, Math.min(canvas.height, orb.y));
    });
}

function drawBackgroundEffects() {
    // Draw twinkling stars
    backgroundAnimation.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle effect
        if (star.alpha > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(star.alpha - 0.7) * 2})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw floating orbs
    backgroundAnimation.floatingOrbs.forEach(orb => {
        const pulseSize = orb.size + Math.sin(orb.pulse) * 5;
        const pulseAlpha = orb.alpha + Math.sin(orb.pulse) * 0.1;
        
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = `${orb.color}${Math.floor(pulseAlpha * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function createRoomSpecificEffects(room) {
    // Add room-specific floating particles based on theme
    // Only create if we don't have too many background particles already
    if (Math.random() < 0.3 && backgroundParticles.length < 50) {
        const effect = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 8 + 4,
            life: 300 + Math.random() * 200,
            maxLife: 300 + Math.random() * 200,
            color: room.particle,
            alpha: Math.random() * 0.6 + 0.2,
            type: 'ambient_room'
        };
        
        backgroundParticles.push(effect);
    }
}

function updateBackgroundParticles() {
    // Prevent background particle buildup - limit to 100 particles max
    if (backgroundParticles.length > 100) {
        backgroundParticles.splice(0, backgroundParticles.length - 100);
    }
    
    for (let i = backgroundParticles.length - 1; i >= 0; i--) {
        const particle = backgroundParticles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        // Fade out over time
        particle.alpha = (particle.life / particle.maxLife) * 0.6;
        
        if (particle.life <= 0 || particle.x < -50 || particle.x > canvas.width + 50 || 
            particle.y < -50 || particle.y > canvas.height + 50) {
            backgroundParticles.splice(i, 1);
        }
    }
}

function drawBackgroundParticles() {
    backgroundParticles.forEach(particle => {
        ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
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
    
    // Different enemy types with MUCH more reasonable health values
    const enemyTypes = [
        { color: '#4B0082', size: 25, speed: 1.5, health: 60, name: 'Shadow' },
        { color: '#FF4500', size: 20, speed: 2.5, health: 45, name: 'Fire' },
        { color: '#00CED1', size: 28, speed: 1.8, health: 75, name: 'Ice' },
        { color: '#32CD32', size: 22, speed: 2.2, health: 50, name: 'Poison' },
        { color: '#9932CC', size: 26, speed: 2.0, health: 65, name: 'Magic' },
        { color: '#FFD700', size: 30, speed: 1.2, health: 90, name: 'Golden' },
        { color: '#FF69B4', size: 18, speed: 3.0, health: 40, name: 'Pink' },
        { color: '#00FF00', size: 32, speed: 1.0, health: 120, name: 'Tank' },
        { color: '#FF1493', size: 15, speed: 3.5, health: 35, name: 'Speed' },
        { color: '#8A2BE2', size: 35, speed: 0.8, health: 150, name: 'Elite' }
    ];
    
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // Scale difficulty based on room number - MUCH more reasonable
    const difficultyMultiplier = 1 + (gameState.currentRoom * 0.005); // Much smaller scaling
    const scaledHealth = Math.min(Math.floor(enemyType.health * difficultyMultiplier), 180); // Hard cap at 180 HP (6 hits max with weakest weapon)
    const scaledSpeed = enemyType.speed * (1 + (gameState.currentRoom * 0.005)); // Much slower speed scaling
    
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
    // Remove dead enemies first to prevent any issues
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].health <= 0) {
            createDeathEffect(enemies[i].x, enemies[i].y, enemies[i].color);
            enemies.splice(i, 1);
        }
    }
    
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
            // Magnet mode - attract keys to player
            if (player.magnetMode) {
                const dx = player.x - key.x;
                const dy = player.y - key.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    const magnetForce = 5;
                    key.x += (dx / distance) * magnetForce;
                    key.y += (dy / distance) * magnetForce;
                }
            }
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
                
                // Check for boss fight trigger - every 5 keys
                if (gameState.keys > 0 && gameState.keys % 5 === 0 && !gameState.bossFightOffered && !gameState.inBossArena) {
                    gameState.bossFightOffered = true; // Set flag to prevent multiple triggers
                    offerBossFight();
                }
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

// Boss Fight System
function offerBossFight() {
    gameState.bossFightOffered = true;
    gameState.returnRoom = gameState.currentRoom;
    gameRunning = false; // Pause the game
    
    const bossDialog = document.getElementById('bossDialog');
    const acceptBtn = document.getElementById('acceptBossBtn');
    const declineBtn = document.getElementById('declineBossBtn');
    const bossKeyCount = document.getElementById('bossKeyCount');
    const bossName = document.getElementById('bossName');
    
    // Update dialog with current info
    bossKeyCount.textContent = gameState.keys;
    
    // Show which boss they'll fight
    const bossNumber = Math.floor(gameState.keys / 5) % 10;
    const bossTypes = [
        'Shadow Beast', 'Flame Demon', 'Ice Titan', 'Thunder Lord', 'Void Wraith',
        'Crystal Golem', 'Blood Reaper', 'Storm Dragon', 'Chaos Overlord', 'Nightmare King'
    ];
    bossName.textContent = `Evolved ${bossTypes[bossNumber]}`;
    
    bossDialog.style.display = 'flex';
    
    // Add event listeners for boss choice (works on all devices)
    acceptBtn.onclick = acceptBossFight;
    declineBtn.onclick = declineBossFight;
    
    // Touch support
    acceptBtn.ontouchstart = (e) => { e.preventDefault(); acceptBossFight(); };
    declineBtn.ontouchstart = (e) => { e.preventDefault(); declineBossFight(); };
}

function acceptBossFight() {
    const bossDialog = document.getElementById('bossDialog');
    bossDialog.style.display = 'none';
    
    // Clear all particles before boss fight for performance
    clearAllParticles();
    
    gameState.inBossArena = true;
    gameState.keys = 0; // Clear keys as mentioned
    keyCountElement.textContent = '0';
    
    loadBossArena();
    gameRunning = true;
    gameLoop();
}

function declineBossFight() {
    const bossDialog = document.getElementById('bossDialog');
    bossDialog.style.display = 'none';
    
    gameState.keys = 0; // Clear keys as mentioned
    keyCountElement.textContent = '0';
    gameState.bossFightOffered = false; // Reset flag for next time
    
    gameRunning = true;
    gameLoop();
}

function loadBossArena() {
    // Clear existing entities
    enemies = [];
    keys = [];
    projectiles = [];
    particles = [];
    powerUps = [];
    
    // Create the evolved boss enemy
    createEvolvedBoss();
    
    // Set player to center
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth; // Full heal for the fight
}

function createEvolvedBoss() {
    // 10 different boss types that cycle based on how many boss fights completed
    const bossNumber = Math.floor(gameState.keys / 5) % 10; // Cycle through 10 bosses
    
    const bossTypes = [
        { name: 'Shadow Beast', color: '#8B0000', size: 45, speed: 1.5 },
        { name: 'Flame Demon', color: '#FF4500', size: 48, speed: 1.6 },
        { name: 'Ice Titan', color: '#00CED1', size: 50, speed: 1.3 },
        { name: 'Thunder Lord', color: '#FFD700', size: 42, speed: 1.8 },
        { name: 'Void Wraith', color: '#4B0082', size: 40, speed: 2.0 },
        { name: 'Crystal Golem', color: '#32CD32', size: 55, speed: 1.2 },
        { name: 'Blood Reaper', color: '#DC143C', size: 46, speed: 1.7 },
        { name: 'Storm Dragon', color: '#9932CC', size: 58, speed: 1.4 },
        { name: 'Chaos Overlord', color: '#FF1493', size: 52, speed: 1.5 },
        { name: 'Nightmare King', color: '#000000', size: 60, speed: 1.3 }
    ];
    
    const boss = bossTypes[bossNumber];
    
    // Simple system: ALL bosses die in exactly 14 hits, no matter what
    // We'll track hits instead of using health calculation
    const bossHealth = 14; // This represents "hits to kill" not actual health points
    
    console.log(`Boss created: Will die in exactly 14 hits regardless of damage or upgrades`);
    
    enemies.push({
        x: canvas.width / 4,
        y: canvas.height / 4,
        size: boss.size,
        health: bossHealth,
        maxHealth: bossHealth,
        speed: boss.speed * 1.2, // Slightly faster for challenge
        color: boss.color,
        name: `Evolved ${boss.name}`,
        pulse: 0,
        rotation: 0,
        trail: [],
        lastHitTime: 0,
        isBoss: true,
        bossType: bossNumber,
        attackCooldown: 0,
        specialAttackCooldown: 0
    });
}

function updateBossArena() {
    // Special boss arena logic
    if (enemies.length === 0 && gameState.inBossArena) {
        // Boss defeated! Clear particles and show power upgrade choice
        clearAllParticles();
        gameState.inBossArena = false;
        gameRunning = false; // Pause game for choice
        
        // Victory effect
        createVictoryEffect();
        
        // Show power upgrade dialog immediately
        showPowerUpgradeChoice();
    }
    
    // Boss special attacks
    enemies.forEach(enemy => {
        if (enemy.isBoss) {
            enemy.attackCooldown--;
            enemy.specialAttackCooldown--;
            
            // Boss projectile attack (much less frequent for kids)
            if (enemy.attackCooldown <= 0) {
                createBossProjectile(enemy);
                enemy.attackCooldown = 240; // 4 seconds (much slower)
            }
            
            // Boss special area attack (much less frequent and weaker)
            if (enemy.specialAttackCooldown <= 0) {
                createBossAreaAttack(enemy);
                enemy.specialAttackCooldown = 600; // 10 seconds (much slower)
            }
        }
    });
    

}

function createBossProjectile(boss) {
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const speed = 4; // Much slower for kids
    
    projectiles.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: 'boss',
        damage: 8, // Much less damage for kids
        color: '#8B0000',
        size: 15, // Smaller projectiles
        life: 120, // Shorter life
        trail: [],
        rotation: 0,
        fromBoss: true
    });
}

function createBossAreaAttack(boss) {
    // Create fewer projectiles in a circle (easier for kids)
    for (let i = 0; i < 6; i++) { // Half as many projectiles
        const angle = (i * Math.PI * 2) / 6;
        const speed = 3; // Much slower
        
        projectiles.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type: 'boss',
            damage: 5, // Much less damage
            color: '#DC143C',
            size: 12, // Smaller
            life: 100, // Shorter life
            trail: [],
            rotation: 0,
            fromBoss: true
        });
    }
}

function createVictoryEffect() {
    // Optimized victory effect - reduced from 100 to 35 particles
    for (let i = 0; i < 35; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            life: 150,
            maxLife: 150,
            color: ['#FFD700', '#FFFF00', '#FFFFFF', '#87CEEB'][Math.floor(Math.random() * 4)],
            size: Math.random() * 20 + 15, // Larger particles for better impact
            type: 'victory'
        });
    }
}

// Power Upgrade Choice System
function showPowerUpgradeChoice() {
    const powerUpgradeDialog = document.getElementById('powerUpgradeDialog');
    const upgradeIceBtn = document.getElementById('upgradeIceBtn');
    const upgradeFireBtn = document.getElementById('upgradeFireBtn');
    const upgradeCombinedBtn = document.getElementById('upgradeCombinedBtn');
    
    powerUpgradeDialog.style.display = 'flex';
    
    // Add event listeners for power upgrade choices (works on all devices)
    upgradeIceBtn.onclick = () => upgradePower('ice');
    upgradeFireBtn.onclick = () => upgradePower('fire');
    upgradeCombinedBtn.onclick = () => upgradePower('combined');
    
    // Touch support
    upgradeIceBtn.ontouchstart = (e) => { e.preventDefault(); upgradePower('ice'); };
    upgradeFireBtn.ontouchstart = (e) => { e.preventDefault(); upgradePower('fire'); };
    upgradeCombinedBtn.ontouchstart = (e) => { e.preventDefault(); upgradePower('combined'); };
}

function upgradePower(powerType) {
    const powerUpgradeDialog = document.getElementById('powerUpgradeDialog');
    powerUpgradeDialog.style.display = 'none';
    
    // Upgrade the chosen power
    gameState.powerUpgrades[powerType]++;
    
    // Add lightning power to inventory instead
    addToInventory('lightning', '⚡', '#FFFF00', 0, null, true); // Special lightning power
    
    // Reset boss fight flag so it can trigger again
    gameState.bossFightOffered = false;
    
    // Show upgrade effect
    createUpgradeEffect();
    
    // Start 3-second countdown like death screen
    gameState.powerUpgradeTimer = 3;
    gameState.selectedUpgradePower = powerType;
    gameRunning = true; // Keep game loop running for countdown
    gameLoop(); // Restart the game loop for countdown
    
    console.log(`Power upgraded! ${powerType} level: ${gameState.powerUpgrades[powerType]}`);
}

function createUpgradeEffect() {
    // Optimized upgrade effect - reduced from 80 to 30 particles
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 120,
            maxLife: 120,
            color: ['#FFD700', '#FFFF00', '#FFFFFF', '#00FF00'][Math.floor(Math.random() * 4)],
            size: Math.random() * 12 + 8,
            type: 'upgrade'
        });
    }
}

function loadRoom(roomIndex) {
    gameState.currentRoom = roomIndex;
    const room = rooms[roomIndex];
    
    // Clear all particles when changing rooms for performance
    clearAllParticles();
    
    // Check for level progression and super power unlocks
    checkLevelProgression();
    
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
    const lightningCooldown = powers.lightning.cooldown > 0;
    
    document.getElementById('ice-btn').className = 
        `power-btn ${iceCooldown ? 'cooldown' : ''}`;
    document.getElementById('fire-btn').className = 
        `power-btn ${fireCooldown ? 'cooldown' : ''}`;
    document.getElementById('combined-btn').className = 
        `power-btn ${combinedCooldown ? 'cooldown' : ''}`;
    
    // Lightning button only shows if player has the power
    if (gameState.hasLightningPower) {
        document.getElementById('lightning-btn').className = 
            `power-btn ${lightningCooldown ? 'cooldown' : ''}`;
    }
    
    // Update lightning touch button if available
    if (gameState.hasLightningPower) {
        touchLightningBtn.className = `touch-power-btn ${lightningCooldown ? 'cooldown' : ''} ${selectedPower === 'lightning' ? 'selected' : ''}`;
    }
}

function updatePlayer() {
    // Movement with speed boost and lag compensation
    let speedBoost = 0;
    if (gameState.powerUps.speed > 0) speedBoost += 3;
    if (gameState.powerUps.megaSpeed > 0) speedBoost += 5;
    
    let currentSpeed = player.speed + speedBoost;
    
    // Lag compensation - add speed boost if frame time is high
    if (frameTime > FRAME_TIME_TARGET * 1.5) {
        currentSpeed *= 1.8; // 80% speed boost when lagging
        console.log('Lag detected - applying speed boost!');
    }
    
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
    
    // Update laser beam if active
    if (player.laserBeam) {
        player.laserBeam.life--;
        if (player.laserBeam.life <= 0) {
            player.laserBeam = null;
        }
    }
    
    // Mouse shooting (desktop) - use equipped super powers
    if (mousePressed.left && mousePressed.right) {
        // Both buttons - use slot 3 (combined by default)
        useSuperPower(2);
    } else if (mousePressed.left) {
        // Left button - use slot 1 (ice by default)
        useSuperPower(0);
    } else if (mousePressed.right) {
        // Right button - use slot 2 (fire by default)
        useSuperPower(1);
    }
    
    // Manual shooting for mobile - handled in touchstart event
}

function drawPlayer() {
    ctx.save();
    
    // Enhanced player glow effect with multiple layers
    const glowIntensity = Math.sin(player.glow) * 0.4 + 0.6;
    const pulseSize = player.size + Math.sin(player.glow * 2) * 3;
    
    // Outer glow
    ctx.shadowColor = '#4169E1';
    ctx.shadowBlur = 40 * glowIntensity;
    
    // Enhanced shield effect with animation
    if (gameState.powerUps.shield > 0) {
        const shieldPulse = Math.sin(gameState.gameTime * 0.1) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(65, 105, 225, ${shieldPulse})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#4169E1';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size + 15 + Math.sin(gameState.gameTime * 0.08) * 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner shield ring
        ctx.strokeStyle = `rgba(135, 206, 235, ${shieldPulse * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size + 10, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Enhanced player body with multi-layer gradient
    const gradient = ctx.createRadialGradient(
        player.x - player.size * 0.3, 
        player.y - player.size * 0.3, 
        0, 
        player.x, 
        player.y, 
        pulseSize
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.2, '#87CEEB');
    gradient.addColorStop(0.6, '#4169E1');
    gradient.addColorStop(0.9, '#191970');
    gradient.addColorStop(1, '#000080');
    
    // Main body
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 30 * glowIntensity;
    ctx.beginPath();
    ctx.arc(player.x, player.y, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner highlight
    const highlightGradient = ctx.createRadialGradient(
        player.x - player.size * 0.4, 
        player.y - player.size * 0.4, 
        0, 
        player.x, 
        player.y, 
        player.size * 0.6
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlightGradient.addColorStop(0.5, 'rgba(135, 206, 235, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
    
    ctx.fillStyle = highlightGradient;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Enhanced direction indicator with trail
    const angle = Math.atan2(player.mouseY - player.y, player.mouseX - player.x);
    const indicatorDistance = player.size + 15;
    const indicatorX = player.x + Math.cos(angle) * indicatorDistance;
    const indicatorY = player.y + Math.sin(angle) * indicatorDistance;
    
    // Direction indicator trail
    for (let i = 0; i < 3; i++) {
        const trailDistance = indicatorDistance - i * 5;
        const trailX = player.x + Math.cos(angle) * trailDistance;
        const trailY = player.y + Math.sin(angle) * trailDistance;
        const trailAlpha = 0.3 - i * 0.1;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${trailAlpha})`;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(trailX, trailY, 8 - i * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Main direction indicator
    const indicatorGradient = ctx.createRadialGradient(indicatorX, indicatorY, 0, indicatorX, indicatorY, 12);
    indicatorGradient.addColorStop(0, '#FFFFFF');
    indicatorGradient.addColorStop(0.3, '#FFD700');
    indicatorGradient.addColorStop(1, '#FFA500');
    
    ctx.fillStyle = indicatorGradient;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw laser beam if active
    if (player.laserBeam) {
        const beam = player.laserBeam;
        const alpha = beam.life / beam.maxLife;
        
        // Draw thick red laser beam
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = beam.width;
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 30;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(beam.startX, beam.startY);
        ctx.lineTo(beam.endX, beam.endY);
        ctx.stroke();
        
        // Draw inner bright beam
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = beam.width * 0.4;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(beam.startX, beam.startY);
        ctx.lineTo(beam.endX, beam.endY);
        ctx.stroke();
    }
    
    ctx.restore();
    
    // Enhanced health bar with gradient and glow
    const healthBarWidth = 90;
    const healthBarHeight = 14;
    const healthPercentage = player.health / player.maxHealth;
    const barY = player.y - player.size - 30;
    
    // Health bar shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(player.x - healthBarWidth/2 + 2, barY + 2, healthBarWidth, healthBarHeight);
    
    // Health bar background with gradient
    const bgGradient = ctx.createLinearGradient(player.x - healthBarWidth/2, barY, player.x + healthBarWidth/2, barY);
    bgGradient.addColorStop(0, '#8B0000');
    bgGradient.addColorStop(1, '#FF6B6B');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(player.x - healthBarWidth/2, barY, healthBarWidth, healthBarHeight);
    
    // Health bar fill with dynamic color
    let healthColor1, healthColor2;
    if (healthPercentage > 0.6) {
        healthColor1 = '#00FF00';
        healthColor2 = '#32CD32';
    } else if (healthPercentage > 0.3) {
        healthColor1 = '#FFD700';
        healthColor2 = '#FFA500';
    } else {
        healthColor1 = '#FF4500';
        healthColor2 = '#FF0000';
    }
    
    const healthGradient = ctx.createLinearGradient(player.x - healthBarWidth/2, barY, player.x + healthBarWidth/2, barY);
    healthGradient.addColorStop(0, healthColor1);
    healthGradient.addColorStop(1, healthColor2);
    
    ctx.fillStyle = healthGradient;
    ctx.shadowColor = healthColor1;
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x - healthBarWidth/2, barY, healthBarWidth * healthPercentage, healthBarHeight);
    ctx.shadowBlur = 0;
    
    // Health bar border with glow
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 5;
    ctx.strokeRect(player.x - healthBarWidth/2, barY, healthBarWidth, healthBarHeight);
    ctx.shadowBlur = 0;
    
    // Enhanced health text with glow
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.fillText(`${Math.max(0, Math.floor(player.health))}/${player.maxHealth}`, player.x, barY - 8);
    ctx.shadowBlur = 0;
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
        ctx.save();
        
        // Enhanced enemy trail effect
        enemy.trail.forEach((trailPoint, index) => {
            const alpha = (index / enemy.trail.length) * 0.6;
            const trailSize = enemy.size * (index / enemy.trail.length) * 0.8;
            
            ctx.fillStyle = `${enemy.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = 15 * alpha;
            ctx.beginPath();
            ctx.arc(trailPoint.x, trailPoint.y, trailSize, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Enhanced enemy glow with pulsing
        const glowIntensity = Math.sin(enemy.pulse) * 0.5 + 0.5;
        const enemySize = enemy.size + Math.sin(enemy.pulse * 1.5) * 2;
        
        // Outer glow ring
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 35 * glowIntensity;
        
        // Enemy body with enhanced rotation and gradients
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);
        
        // Multi-layer enemy gradient
        const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemySize);
        outerGradient.addColorStop(0, '#FFFFFF');
        outerGradient.addColorStop(0.2, enemy.color);
        outerGradient.addColorStop(0.7, enemy.color);
        outerGradient.addColorStop(1, '#000000');
        
        // Main enemy body
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, enemySize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        const innerGradient = ctx.createRadialGradient(-enemySize * 0.3, -enemySize * 0.3, 0, 0, 0, enemySize * 0.5);
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        innerGradient.addColorStop(0.5, `${enemy.color}40`);
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = innerGradient;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, enemySize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Boss-specific enhancements
        if (enemy.isBoss) {
            // Boss crown effect
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, enemySize + 8, 0, Math.PI * 2);
            ctx.stroke();
            
            // Boss energy rings
            for (let i = 0; i < 3; i++) {
                const ringAlpha = 0.3 - i * 0.1;
                const ringRadius = enemySize + 15 + i * 8;
                ctx.strokeStyle = `rgba(255, 215, 0, ${ringAlpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, ringRadius + Math.sin(gameState.gameTime * 0.05 + i) * 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.restore();
        
        // Enhanced health bar with gradient and animation
        const healthBarWidth = enemy.isBoss ? 80 : 65;
        const healthBarHeight = enemy.isBoss ? 8 : 6;
        const healthPercentage = enemy.health / enemy.maxHealth;
        const barY = enemy.y - enemy.size - (enemy.isBoss ? 25 : 20);
        
        // Health bar shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(enemy.x - healthBarWidth/2 + 1, barY + 1, healthBarWidth, healthBarHeight);
        
        // Health bar background
        const bgGradient = ctx.createLinearGradient(enemy.x - healthBarWidth/2, barY, enemy.x + healthBarWidth/2, barY);
        bgGradient.addColorStop(0, '#8B0000');
        bgGradient.addColorStop(1, '#FF6B6B');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(enemy.x - healthBarWidth/2, barY, healthBarWidth, healthBarHeight);
        
        // Health bar fill with enemy color
        const healthGradient = ctx.createLinearGradient(enemy.x - healthBarWidth/2, barY, enemy.x + healthBarWidth/2, barY);
        healthGradient.addColorStop(0, '#00FF00');
        healthGradient.addColorStop(0.5, '#32CD32');
        healthGradient.addColorStop(1, enemy.color);
        
        ctx.fillStyle = healthGradient;
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 5;
        ctx.fillRect(enemy.x - healthBarWidth/2, barY, healthBarWidth * healthPercentage, healthBarHeight);
        
        // Health bar border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.strokeRect(enemy.x - healthBarWidth/2, barY, healthBarWidth, healthBarHeight);
        
        // Boss name display
        if (enemy.isBoss) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            ctx.fillText(enemy.name, enemy.x, barY - 10);
            ctx.shadowBlur = 0;
        }
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
        ctx.save();
        
        // Enhanced trail with multiple layers
        proj.trail.forEach((trailPoint, index) => {
            const alpha = (index / proj.trail.length) * 0.8;
            const trailSize = proj.size * (index / proj.trail.length) * 0.9;
            
            // Outer trail glow
            ctx.fillStyle = `${proj.color}${Math.floor(alpha * 0.3 * 255).toString(16).padStart(2, '0')}`;
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 20 * alpha;
            ctx.beginPath();
            ctx.arc(trailPoint.x, trailPoint.y, trailSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner trail core
            ctx.fillStyle = `${proj.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.shadowBlur = 10 * alpha;
            ctx.beginPath();
            ctx.arc(trailPoint.x, trailPoint.y, trailSize, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Enhanced projectile rendering
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.rotation);
        
        // Outer glow
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 30;
        
        // Multi-layer projectile gradient
        const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, proj.size * 1.2);
        outerGradient.addColorStop(0, '#FFFFFF');
        outerGradient.addColorStop(0.3, proj.color);
        outerGradient.addColorStop(0.7, proj.color);
        outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        // Outer projectile layer
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, proj.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core gradient
        const coreGradient = ctx.createRadialGradient(-proj.size * 0.3, -proj.size * 0.3, 0, 0, 0, proj.size);
        coreGradient.addColorStop(0, '#FFFFFF');
        coreGradient.addColorStop(0.4, proj.color);
        coreGradient.addColorStop(1, '#000000');
        
        // Main projectile body
        ctx.fillStyle = coreGradient;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, proj.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Special effects for different projectile types
        if (proj.type === 'lightning') {
            // Lightning sparkles
            for (let i = 0; i < 3; i++) {
                const sparkleAngle = Math.random() * Math.PI * 2;
                const sparkleDistance = Math.random() * proj.size;
                const sparkleX = Math.cos(sparkleAngle) * sparkleDistance;
                const sparkleY = Math.sin(sparkleAngle) * sparkleDistance;
                
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = '#FFFF00';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, Math.random() * 3 + 1, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (proj.type === 'combined') {
            // Combined power swirl effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + proj.rotation * 2;
                const radius = proj.size * 0.7;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Energy pulse for boss projectiles
        if (proj.fromBoss) {
            const pulseSize = proj.size + Math.sin(gameState.gameTime * 0.2) * 3;
            ctx.strokeStyle = 'rgba(139, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#8B0000';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
    });
}

function drawParticles() {
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        let size = particle.size * alpha;
        
        ctx.save();
        
        // Special handling for different particle types
        if (particle.type === 'flash' || particle.type === 'explosion_flash') {
            size = particle.size * (1 - alpha); // Flash gets bigger as it fades
        }
        
        // Apply rotation if particle has it
        if (particle.rotation !== undefined) {
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.translate(-particle.x, -particle.y);
        }
        
        // Optimized glow effects - reduced checks and calculations
        if (particle.glow && alpha > 0.1) { // Only glow for visible particles
            ctx.shadowColor = particle.color;
            
            // Simplified shadow blur calculation
            let shadowBlur = 15 * alpha; // Reduced base blur
            const type = particle.type;
            if (type === 'flash' || type === 'explosion_flash') {
                shadowBlur = 40 * alpha; // Reduced from 60
                ctx.shadowColor = '#FFFFFF';
            } else if (type === 'lightning' || type === 'bolt') {
                shadowBlur = 20 * alpha; // Reduced from 30
                ctx.shadowColor = '#FFFF00';
            }
            
            ctx.shadowBlur = Math.min(shadowBlur, 25); // Cap shadow blur for performance
        }
        
        // Enhanced particle shapes
        ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        
        if (particle.type === 'lightning' || particle.type === 'bolt') {
            // Draw lightning as jagged shapes
            ctx.beginPath();
            const points = 6;
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const radius = size + (Math.random() - 0.5) * size * 0.5;
                const x = particle.x + Math.cos(angle) * radius;
                const y = particle.y + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        } else if (particle.type === 'ring' || particle.type === 'shockwave') {
            // Draw rings as hollow circles
            ctx.lineWidth = size / 3;
            ctx.strokeStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Regular circular particles
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
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

// Pause and Inventory System
function toggleInventory() {
    gameState.isPaused = !gameState.isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    const inventoryDialog = document.getElementById('inventoryDialog');
    
    if (gameState.isPaused) {
        pauseBtn.textContent = '▶️ RESUME';
        inventoryDialog.style.display = 'flex';
        updateInventoryDisplay();
        updateSuperPowerDisplay();
    } else {
        pauseBtn.textContent = '🎒 INVENTORY';
        inventoryDialog.style.display = 'none';
        // Restart the game loop when resuming
        if (gameRunning) {
            gameLoop();
        }
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.getElementById('powerupsTab').classList.remove('active');
    document.getElementById('superpowersTab').classList.remove('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Update tab content
    document.getElementById('powerupsContent').classList.remove('active');
    document.getElementById('superpowersContent').classList.remove('active');
    document.getElementById(tabName + 'Content').classList.add('active');
    
    // Update displays
    if (tabName === 'powerups') {
        updateInventoryDisplay();
    } else {
        updateSuperPowerDisplay();
    }
}

function checkLevelProgression() {
    const newLevel = Math.floor(gameState.currentRoom / 25) + 1;
    if (newLevel > gameState.currentLevel) {
        gameState.currentLevel = newLevel;
        checkSuperPowerUnlocks();
    }
}

function checkSuperPowerUnlocks() {
    const currentRoom = gameState.currentRoom + 1; // +1 because rooms are 0-indexed
    superPowers.forEach(power => {
        if (currentRoom >= power.unlockLevel && !gameState.superPowers.unlocked.includes(power.id)) {
            gameState.superPowers.unlocked.push(power.id);
            showSuperPowerUnlock(power);
        }
    });
}

function showSuperPowerUnlock(power) {
    // Create unlock notification effect
    console.log(`🎉 NEW SUPER POWER UNLOCKED: ${power.name} ${power.symbol}`);
    // TODO: Add visual notification
}

function addToInventory(powerUpType, symbol, color, duration, healAmount = null, isSpecial = false) {
    const key = powerUpType;
    if (!gameState.inventory[key]) {
        gameState.inventory[key] = {
            type: powerUpType,
            symbol: symbol,
            color: color,
            duration: duration,
            healAmount: healAmount,
            count: 0,
            isSpecial: isSpecial
        };
    }
    gameState.inventory[key].count++;
    console.log(`Added ${powerUpType} to inventory. Count: ${gameState.inventory[key].count}`);
}

function updateInventoryDisplay() {
    const inventoryGrid = document.getElementById('inventoryGrid');
    inventoryGrid.innerHTML = '';
    
    const inventoryKeys = Object.keys(gameState.inventory);
    
    if (inventoryKeys.length === 0) {
        inventoryGrid.innerHTML = '<div class="empty-inventory">Your inventory is empty. Collect power-ups to fill it!</div>';
        return;
    }
    
    inventoryKeys.forEach(key => {
        const item = gameState.inventory[key];
        if (item.count > 0) {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.style.borderColor = item.color;
            
            itemElement.innerHTML = `
                <div class="symbol">${item.symbol}</div>
                <div class="name">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</div>
                <div class="count">${item.count}</div>
            `;
            
            itemElement.addEventListener('click', () => activateFromInventory(key));
            inventoryGrid.appendChild(itemElement);
        }
    });
}

function activateFromInventory(itemKey) {
    const item = gameState.inventory[itemKey];
    if (!item || item.count <= 0) return;
    
    // Activate the power-up
    if (item.healAmount) {
        // It's a food item
        player.health = Math.min(player.maxHealth, player.health + item.healAmount);
        console.log(`Used ${item.type} from inventory! Healed ${item.healAmount} HP. Current health: ${player.health}/${player.maxHealth}`);
    } else if (item.isSpecial && item.type === 'lightning') {
        // Special lightning power - unlock it permanently
        gameState.hasLightningPower = true;
        const lightningBtn = document.getElementById('lightning-btn');
        lightningBtn.style.display = 'inline-block';
        touchLightningBtn.style.display = 'flex';
        console.log('Lightning Storm power unlocked permanently!');
    } else {
        // It's a regular power-up
        if (item.type === 'doubleDamage') {
            gameState.powerUps.damage = item.duration;
        } else if (item.type === 'invincibility') {
            gameState.powerUps.shield = item.duration;
            player.invincible = true;
            setTimeout(() => { player.invincible = false; }, item.duration);
        } else if (item.type === 'megaSpeed') {
            gameState.powerUps.speed = item.duration;
        } else {
            gameState.powerUps[item.type] = item.duration;
        }
        console.log(`Activated ${item.type} from inventory!`);
    }
    
    // Remove one from inventory
    item.count--;
    if (item.count <= 0) {
        delete gameState.inventory[itemKey];
    }
    
    // Create effect
    createPowerUpEffect(player.x, player.y, item.color);
    
    // Update display
    updateInventoryDisplay();
    
    // Automatically resume game after using power-up
    toggleInventory();
}

function updateSuperPowerDisplay() {
    const superpowerGrid = document.getElementById('superpowerGrid');
    superpowerGrid.innerHTML = '';
    
    superPowers.forEach(power => {
        const isUnlocked = gameState.superPowers.unlocked.includes(power.id);
        const currentRoom = gameState.currentRoom + 1;
        
        const powerElement = document.createElement('div');
        powerElement.className = `superpower-item ${isUnlocked ? '' : 'locked'}`;
        powerElement.dataset.powerId = power.id;
        
        powerElement.innerHTML = `
            <div class="symbol">${power.symbol}</div>
            <div class="name">${power.name}</div>
            <div class="unlock-level">${isUnlocked ? 'UNLOCKED' : `Lvl ${power.unlockLevel}`}</div>
        `;
        
        if (isUnlocked) {
            powerElement.addEventListener('click', () => equipSuperPower(power.id));
            powerElement.title = power.description;
        } else {
            powerElement.title = `Unlocks at room ${power.unlockLevel}. Current: ${currentRoom}`;
        }
        
        superpowerGrid.appendChild(powerElement);
    });
    
    // Update equipped slots
    updateEquippedSlots();
}

function updateEquippedSlots() {
    for (let i = 0; i < 3; i++) {
        const slot = document.querySelector(`.power-slot[data-slot="${i}"]`);
        const equippedPowerId = gameState.superPowers.equipped[i];
        
        if (equippedPowerId) {
            const power = superPowers.find(p => p.id === equippedPowerId);
            slot.classList.add('occupied');
            slot.querySelector('.slot-content').innerHTML = `
                <span style="font-size: 18px;">${power.symbol}</span> ${power.name}
            `;
            slot.onclick = () => unequipSuperPower(i);
        } else {
            slot.classList.remove('occupied');
            slot.querySelector('.slot-content').textContent = 'Empty';
            slot.onclick = null;
        }
    }
    
    // Update UI buttons
    updateSuperPowerButtons();
}

function equipSuperPower(powerId) {
    // Find first empty slot
    const emptySlot = gameState.superPowers.equipped.findIndex(slot => slot === null);
    
    if (emptySlot !== -1) {
        // Check if power is already equipped
        if (!gameState.superPowers.equipped.includes(powerId)) {
            gameState.superPowers.equipped[emptySlot] = powerId;
            updateEquippedSlots();
            updateSuperPowerButtons(); // Update iPad controls and UI buttons
            console.log(`Equipped ${powerId} to slot ${emptySlot + 1}`);
        } else {
            console.log(`${powerId} is already equipped!`);
        }
    } else {
        console.log('All slots are full! Remove a power first.');
    }
}

function unequipSuperPower(slotIndex) {
    const powerId = gameState.superPowers.equipped[slotIndex];
    if (powerId) {
        gameState.superPowers.equipped[slotIndex] = null;
        updateEquippedSlots();
        updateSuperPowerButtons(); // Update iPad controls and UI buttons
        console.log(`Unequipped ${powerId} from slot ${slotIndex + 1}`);
    }
}

function updateSuperPowerButtons() {
    for (let i = 0; i < 3; i++) {
        const powerId = gameState.superPowers.equipped[i];
        const desktopBtn = document.getElementById(`superpower${i + 1}-btn`);
        const touchBtn = document.getElementById(`touch-superpower${i + 1}-btn`);
        
        if (powerId) {
            const power = superPowers.find(p => p.id === powerId);
            desktopBtn.textContent = power.symbol;
            desktopBtn.title = power.name + ': ' + power.description;
            desktopBtn.style.display = 'inline-block';
            
            touchBtn.textContent = power.symbol;
            touchBtn.title = power.name;
            touchBtn.style.display = 'flex';
            
            // Update selection state for touch buttons
            const isSelected = selectedPower === `superpower${i + 1}`;
            touchBtn.className = `touch-power-btn ${isSelected ? 'selected' : ''}`;
        } else {
            desktopBtn.style.display = 'none';
            touchBtn.style.display = 'none';
        }
    }
}

function useSuperPower(slotIndex) {
    const powerId = gameState.superPowers.equipped[slotIndex];
    if (!powerId) return;
    
    const power = superPowers.find(p => p.id === powerId);
    console.log(`Using super power: ${power.name} ${power.symbol}`);
    
    // Execute the super power effect
    executeSuperPower(powerId);
}

function executeSuperPower(powerId) {
    switch(powerId) {
        case 'ice':
            // Ice beam - same as shootIce()
            if (powers.ice.cooldown <= 0) {
                shootIce();
            }
            break;
        case 'fire':
            // Fire beam - same as shootFire()
            if (powers.fire.cooldown <= 0) {
                shootFire();
            }
            break;
        case 'combined':
            // Combined beam - same as shootCombined()
            if (powers.combined.cooldown <= 0) {
                shootCombined();
            }
            break;
        case 'teleport':
            // Teleport to mouse position
            const oldX = player.x;
            const oldY = player.y;
            player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.mouseX));
            player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.mouseY));
            
            // Create teleport effect at old and new positions
            createTeleportEffect(oldX, oldY, player.x, player.y);
            break;
        case 'timeSlow':
            // Slow down all enemies for 10 seconds
            enemies.forEach(enemy => {
                enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
                enemy.speed = enemy.originalSpeed * 0.3;
            });
            setTimeout(() => {
                enemies.forEach(enemy => {
                    if (enemy.originalSpeed) {
                        enemy.speed = enemy.originalSpeed;
                    }
                });
            }, 10000);
            
            // Create time slow effect
            createTimeSlowEffect();
            break;
        case 'shield':
            // Energy shield for 15 seconds
            gameState.powerUps.shield = 15000;
            player.invincible = true;
            setTimeout(() => { player.invincible = false; }, 15000);
            
            // Create shield effect
            createShieldEffect();
            break;
        case 'multiShot':
            // Shoots 8 projectiles in all directions
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                createMultiShotProjectile(angle);
            }
            break;
        case 'heal':
            // Full heal
            player.health = player.maxHealth;
            
            // Create heal effect
            createHealEffect();
            break;
        case 'freeze':
            // Freeze all enemies for 8 seconds
            enemies.forEach(enemy => {
                enemy.frozen = true;
                enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
                enemy.speed = 0;
            });
            setTimeout(() => {
                enemies.forEach(enemy => {
                    enemy.frozen = false;
                    if (enemy.originalSpeed) {
                        enemy.speed = enemy.originalSpeed;
                    }
                });
            }, 8000);
            
            // Create freeze effect
            createFreezeEffect();
            break;
        case 'explosion':
            // Nova blast around player
            createNovaBlast();
            break;
        case 'ghost':
            // Ghost mode for 12 seconds
            player.ghostMode = true;
            setTimeout(() => { player.ghostMode = false; }, 12000);
            
            // Create ghost effect
            createGhostEffect();
            break;
        case 'magnet':
            // Item magnet for 20 seconds
            player.magnetMode = true;
            setTimeout(() => { player.magnetMode = false; }, 20000);
            createMagnetEffect();
            break;
        case 'clone':
            // Create shadow clones
            createShadowClones();
            break;
        case 'lightning':
            // Chain lightning attack
            createChainLightning();
            break;
        case 'meteor':
            // Meteor storm
            createMeteorStorm();
            break;
        case 'void':
            // Void portal
            createVoidPortal();
            break;
        case 'phoenix':
            // Phoenix form for 15 seconds
            player.phoenixMode = true;
            player.invincible = true;
            setTimeout(() => { 
                player.phoenixMode = false; 
                player.invincible = false; 
            }, 15000);
            createPhoenixEffect();
            break;
        case 'timeBomb':
            // Place time bomb
            createTimeBomb();
            break;
        case 'laser':
            // Death laser beam
            createDeathLaser();
            break;
        case 'blackHole':
            // Create black hole
            createBlackHole();
            break;
        case 'godMode':
            // God mode for 30 seconds
            player.godMode = true;
            player.invincible = true;
            setTimeout(() => { 
                player.godMode = false; 
                player.invincible = false; 
            }, 30000);
            createGodModeEffect();
            break;
        case 'nuclear':
            // Nuclear blast
            createNuclearBlast();
            break;
        case 'reality':
            // Reality warp - clear all enemies
            createRealityWarp();
            break;
        default:
            console.log(`Super power ${powerId} not implemented yet!`);
    }
}

function createSuperPowerEffect(x, y, symbol) {
    // Optimized spectacular effect - reduced from 60 to 25 particles
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 150,
            maxLife: 150,
            color: '#FF6B6B',
            size: Math.random() * 20 + 12, // Larger particles for better visual impact
            type: 'superpower',
            glow: true
        });
    }
    
    // Create center symbol effect
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 60,
        maxLife: 60,
        color: '#FFFFFF',
        size: 80,
        type: 'supersymbol',
        glow: true,
        symbol: symbol
    });
}

function createMultiShotProjectile(angle) {
    const speed = 15;
    const damage = 200;
    
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: 'multishot',
        damage: damage,
        color: '#FF6B6B',
        size: 12,
        life: 120,
        trail: [],
        rotation: 0
    });
}

function createNovaBlast() {
    // Damage all enemies within range
    enemies.forEach(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) { // Nova blast range
            enemy.health -= 1000; // MASSIVE damage to ensure kills
            createHitEffect(enemy.x, enemy.y, '#FF6B6B', '#FFB6C1');
        }
    });
    
    // Create visual effect
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            life: 80,
            maxLife: 80,
            color: '#FF6B6B',
            size: Math.random() * 20 + 10,
            type: 'explosion',
            glow: true
        });
    }
}

function createTeleportEffect(oldX, oldY, newX, newY) {
    // Effect at old position
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: oldX,
            y: oldY,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 60,
            maxLife: 60,
            color: '#9932CC',
            size: Math.random() * 10 + 5,
            type: 'teleport',
            glow: true
        });
    }
    
    // Effect at new position
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: newX,
            y: newY,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 60,
            maxLife: 60,
            color: '#9932CC',
            size: Math.random() * 10 + 5,
            type: 'teleport',
            glow: true
        });
    }
}

function createTimeSlowEffect() {
    // Optimized time slow effect - reduced from 50 to 20 particles
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 100,
            maxLife: 100,
            color: '#FFD700',
            size: Math.random() * 8 + 4,
            type: 'timeslow',
            glow: true
        });
    }
}

function createShieldEffect() {
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 80,
            maxLife: 80,
            color: '#4169E1',
            size: Math.random() * 12 + 6,
            type: 'shield',
            glow: true
        });
    }
}

function createHealEffect() {
    for (let i = 0; i < 35; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 90,
            maxLife: 90,
            color: '#00FF00',
            size: Math.random() * 10 + 5,
            type: 'heal',
            glow: true
        });
    }
}

function createFreezeEffect() {
    // Optimized freeze effect - reduced from 60 to 25 particles
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 25,
            vy: (Math.random() - 0.5) * 25,
            life: 100,
            maxLife: 100,
            color: '#87CEEB',
            size: Math.random() * 12 + 6,
            type: 'freeze',
            glow: true
        });
    }
}

function createGhostEffect() {
    for (let i = 0; i < 45; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.5) * 18,
            life: 75,
            maxLife: 75,
            color: '#DDA0DD',
            size: Math.random() * 14 + 7,
            type: 'ghost',
            glow: true
        });
    }
}

// Additional Super Power Functions
function createMagnetEffect() {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 60,
            maxLife: 60,
            color: '#FFD700',
            size: Math.random() * 10 + 5,
            type: 'magnet',
            glow: true
        });
    }
}

function createShadowClones() {
    // Optimized shadow clones - reduced from 15 to 6 projectiles total
    for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const distance = 80;
        const cloneX = player.x + Math.cos(angle) * distance;
        const cloneY = player.y + Math.sin(angle) * distance;
        
        // Create clone projectiles - reduced from 5 to 2 per clone
        for (let j = 0; j < 2; j++) {
            setTimeout(() => {
                // Only create projectile if we're under projectile limit
                if (projectiles.length < 50) {
                    const targetAngle = Math.atan2(player.mouseY - cloneY, player.mouseX - cloneX);
                    const speed = 15;
                    projectiles.push({
                        x: cloneX,
                        y: cloneY,
                        vx: Math.cos(targetAngle) * speed,
                        vy: Math.sin(targetAngle) * speed,
                        type: 'clone',
                        damage: 200, // Increased damage to compensate
                        color: '#9932CC',
                        size: 12, // Slightly larger
                        life: 120,
                        trail: [],
                        rotation: 0
                    });
                }
            }, j * 300); // Longer delay between shots
        }
    }
    
    // Visual effect
    createSuperPowerEffect(player.x, player.y, '👥');
}

function createChainLightning() {
    // Chain lightning that jumps between enemies
    if (enemies.length === 0) return;
    
    let currentEnemy = enemies[0];
    let chainCount = 0;
    const maxChains = Math.min(enemies.length, 8);
    
    const chainLightning = () => {
        if (chainCount >= maxChains || !currentEnemy) return;
        
        // Damage current enemy - MASSIVE damage to ensure kills
        currentEnemy.health -= 500;
        createHitEffect(currentEnemy.x, currentEnemy.y, '#FFFF00', '#FFFFFF');
        
        // Find next enemy
        let nextEnemy = null;
        let closestDistance = Infinity;
        
        enemies.forEach(enemy => {
            if (enemy !== currentEnemy) {
                const dx = enemy.x - currentEnemy.x;
                const dy = enemy.y - currentEnemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    nextEnemy = enemy;
                }
            }
        });
        
        chainCount++;
        if (nextEnemy && chainCount < maxChains) {
            currentEnemy = nextEnemy;
            setTimeout(chainLightning, 100);
        }
    };
    
    chainLightning();
    createLightningEffect(player.x, player.y);
}

function createMeteorStorm() {
    // Optimized meteor rain - reduced from 12 to 6 meteors
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            // Only create meteor if under projectile limit
            if (projectiles.length < MAX_PROJECTILES - 10) {
                const meteorX = Math.random() * canvas.width;
                const meteorY = -50;
                
                projectiles.push({
                    x: meteorX,
                    y: meteorY,
                    vx: (Math.random() - 0.5) * 4,
                    vy: 12,
                    type: 'meteor',
                    damage: 750, // Increased damage to compensate
                    color: '#FF4500',
                    size: 25, // Larger meteors for better impact
                    life: 200,
                    trail: [],
                    rotation: 0
                });
            }
        }, i * 200); // Slightly longer delay
    }
    
    createSuperPowerEffect(player.x, player.y, '☄️');
}

function createVoidPortal() {
    // Create a void portal that sucks in enemies
    const portalX = player.mouseX;
    const portalY = player.mouseY;
    
    // Optimized portal effect - reduced from 60 to 25 particles
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: portalX,
            y: portalY,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 120,
            maxLife: 120,
            color: '#4B0082',
            size: Math.random() * 15 + 10,
            type: 'void',
            glow: true
        });
    }
    
    // Damage all enemies within range
    enemies.forEach(enemy => {
        const dx = enemy.x - portalX;
        const dy = enemy.y - portalY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
            enemy.health -= 1000; // MASSIVE damage to ensure kills
            createHitEffect(enemy.x, enemy.y, '#4B0082', '#9932CC');
        }
    });
    
    addScreenShake(10, 400);
}

function createPhoenixEffect() {
    // Optimized phoenix effect - reduced from 80 to 30 particles
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 25,
            vy: (Math.random() - 0.5) * 25,
            life: 100,
            maxLife: 100,
            color: Math.random() > 0.5 ? '#FF4500' : '#FFD700',
            size: Math.random() * 18 + 12,
            type: 'phoenix',
            glow: true
        });
    }
}

function createTimeBomb() {
    const bombX = player.mouseX;
    const bombY = player.mouseY;
    
    // Create bomb visual
    particles.push({
        x: bombX,
        y: bombY,
        vx: 0,
        vy: 0,
        life: 300, // 5 seconds
        maxLife: 300,
        color: '#FF0000',
        size: 25,
        type: 'timebomb',
        glow: true
    });
    
    // Explode after 5 seconds
    setTimeout(() => {
        // Damage all enemies in range
        enemies.forEach(enemy => {
            const dx = enemy.x - bombX;
            const dy = enemy.y - bombY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                enemy.health -= 1000; // MASSIVE damage to ensure kills
                createHitEffect(enemy.x, enemy.y, '#FF0000', '#FFFFFF');
            }
        });
        
        // Explosion effect
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: bombX,
                y: bombY,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                life: 80,
                maxLife: 80,
                color: '#FF0000',
                size: Math.random() * 20 + 10,
                type: 'explosion',
                glow: true
            });
        }
        
        addScreenShake(15, 500);
        addScreenFlash('#FF0000', 0.6, 300);
    }, 5000);
}

function createDeathLaser() {
    // Single powerful red laser beam - no projectiles, just visual effect
    const angle = Math.atan2(player.mouseY - player.y, player.mouseX - player.x);
    const laserLength = 800;
    const laserEndX = player.x + Math.cos(angle) * laserLength;
    const laserEndY = player.y + Math.sin(angle) * laserLength;
    
    // Instantly damage all enemies in the laser path
    enemies.forEach((enemy, index) => {
        // Check if enemy is in laser path using line-circle collision
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const projLength = dx * Math.cos(angle) + dy * Math.sin(angle);
        
        if (projLength > 0 && projLength < laserLength) {
            const perpX = dx - projLength * Math.cos(angle);
            const perpY = dy - projLength * Math.sin(angle);
            const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
            
            if (perpDist < 30) { // Laser width
                enemy.health -= 1000; // Instant kill
                createHitEffect(enemy.x, enemy.y, '#FF0000', '#FFFFFF');
            }
        }
    });
    
    // Create laser visual effect that draws directly
    player.laserBeam = {
        startX: player.x,
        startY: player.y,
        endX: laserEndX,
        endY: laserEndY,
        life: 30,
        maxLife: 30,
        width: 25
    };
    
    addScreenFlash('#FF0000', 0.6, 300);
    addScreenShake(10, 400);
}

function createBlackHole() {
    const holeX = player.mouseX;
    const holeY = player.mouseY;
    
    // Destroy all enemies - Set to negative to ensure death
    enemies.forEach(enemy => {
        enemy.health = -1000;
        createHitEffect(enemy.x, enemy.y, '#000000', '#FFFFFF');
    });
    
    // Optimized visual effect - reduced from 150 to 40 particles
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: holeX,
            y: holeY,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 120,
            maxLife: 120,
            color: '#000000',
            size: Math.random() * 35 + 20, // Larger particles for better impact
            type: 'blackhole',
            glow: true
        });
    }
    
    addScreenShake(20, 600);
    addScreenFlash('#000000', 0.8, 400);
}

function createGodModeEffect() {
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 150,
            maxLife: 150,
            color: '#FFD700',
            size: Math.random() * 20 + 15,
            type: 'godmode',
            glow: true
        });
    }
}

function createNuclearBlast() {
    // Screen-clearing nuclear explosion - Set to negative to ensure death
    enemies.forEach(enemy => {
        enemy.health = -1000;
        createHitEffect(enemy.x, enemy.y, '#00FF00', '#FFFFFF');
    });
    
    // Massive visual effect
    for (let i = 0; i < 200; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50,
            life: 180,
            maxLife: 180,
            color: Math.random() > 0.5 ? '#00FF00' : '#FFFF00',
            size: Math.random() * 30 + 20,
            type: 'nuclear',
            glow: true
        });
    }
    
    addScreenShake(25, 800);
    addScreenFlash('#00FF00', 1.0, 500);
}

function createRealityWarp() {
    // Instant room clear - Set to negative to ensure death
    enemies.forEach(enemy => {
        enemy.health = -1000;
        createHitEffect(enemy.x, enemy.y, '#FF69B4', '#FFFFFF');
    });
    
    // Rainbow effect
    for (let i = 0; i < 150; i++) {
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 120,
            maxLife: 120,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 25 + 10,
            type: 'reality',
            glow: true
        });
    }
    
    addScreenFlash('#FFFFFF', 0.8, 300);
}

function gameLoop() {
    if (!gameRunning || gameState.isPaused) return;
    
    // Apply screen effects (like shake)
    ctx.save();
    applyScreenEffects();
    
    // Clear canvas with appropriate background
    if (gameState.inBossArena) {
        // Boss arena has special dark background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add menacing red particles
        if (Math.random() < 0.2) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 100,
                maxLife: 100,
                color: '#8B0000',
                size: Math.random() * 8 + 4,
                type: 'ambient'
            });
        }
    } else {
        const room = rooms[gameState.currentRoom];
        ctx.fillStyle = room.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add enhanced room-specific particle effects
        if (Math.random() < 0.2) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 80,
                maxLife: 80,
                color: room.particle,
                size: Math.random() * 6 + 3,
                type: 'ambient',
                glow: true
            });
        }
        
        // Create room-specific floating effects
        createRoomSpecificEffects(room);
        
        // Spawn power-ups and food randomly (not in boss arena)
        if (Math.random() < 0.008 && powerUps.length < 4) {
            // 70% chance for food, 30% chance for power-up
            if (Math.random() < 0.7) {
                createFoodItem();
            } else {
                createPowerUp();
            }
        }
    }
    
    // Update game state
    updatePlayer();
    updateEnemies();
    updateKeys();
    updateProjectiles();
    updateParticles();
    updatePowerUps();
    updatePowers();
    
    // Update background effects
    updateBackgroundEffects();
    updateBackgroundParticles();
    
    // Boss arena logic or regular room logic
    if (gameState.inBossArena) {
        updateBossArena();
    } else {
        checkRoomTransitions();
    }
    
    // Draw everything with enhanced layering
    // Background effects layer
    drawBackgroundEffects();
    drawBackgroundParticles();
    
    if (!gameState.inBossArena) {
        drawPassages();
    }
    drawKeys();
    drawPowerUps();
    drawEnemies();
    drawProjectiles();
    drawParticles();
    drawPlayer();
    drawRoomInfo();
    
    // Restore canvas state and render screen effects
    ctx.restore();
    renderScreenEffects();
    
    // Check power upgrade countdown
    if (gameState.powerUpgradeTimer !== null) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('POWER UPGRADED!', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText(`${gameState.selectedUpgradePower.toUpperCase()} BEAM ENHANCED!`, canvas.width/2, canvas.height/2 + 40);
        ctx.fillText(`Lightning Storm Power Unlocked!`, canvas.width/2, canvas.height/2 + 70);
        
        // Countdown timer
        const countdownSeconds = Math.ceil(gameState.powerUpgradeTimer);
        ctx.fillStyle = '#00FF00';
        ctx.font = '36px Arial';
        ctx.fillText(`Returning to game in ${countdownSeconds}...`, canvas.width/2, canvas.height/2 + 110);
        
        // Update countdown properly
        gameState.powerUpgradeTimer -= 1/60; // Subtract 1/60th of a second (60 FPS)
        
        if (gameState.powerUpgradeTimer <= 0) {
            gameState.powerUpgradeTimer = null;
            gameState.selectedUpgradePower = null;
            loadRoom(gameState.returnRoom);
            gameRunning = true; // Ensure game continues running
            // Don't return here - let the normal game loop continue
        } else {
            // Continue the game loop for countdown
            gameState.gameTime++;
            requestAnimationFrame(gameLoop);
            return;
        }
    }

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
        initializeBackgroundEffects(); // Initialize background effects
        loadRoom(0);
        updateSuperPowerButtons(); // Show default super powers
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
        },
        bossFightOffered: false,
        inBossArena: false,
        returnRoom: 0,
        hasLightningPower: false,
        powerUpgrades: {
            ice: 0,
            fire: 0,
            combined: 0
        },
        powerUpgradeTimer: null,
        selectedUpgradePower: null,
        isPaused: false,
        inventory: {},
        superPowers: {
            unlocked: ['ice', 'fire', 'combined'],
            equipped: ['ice', 'fire', 'combined']
        },
        currentLevel: 1
    };
    
    // Reset background effects
    backgroundParticles = [];
    backgroundAnimation = {
        time: 0,
        stars: [],
        floatingOrbs: [],
        roomEffects: []
    };
    initializeBackgroundEffects();
    
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
    
    // Hide lightning button
    document.getElementById('lightning-btn').style.display = 'none';
    
    // Hide touch lightning button
    touchLightningBtn.style.display = 'none';
    
    // Load first room
    loadRoom(0);
    
    // Update UI
    keyCountElement.textContent = '0';
    
    // Update super power buttons
    updateSuperPowerButtons();
    
    // Reset pause button and close inventory
    document.getElementById('pause-btn').textContent = '🎒 INVENTORY';
    document.getElementById('inventoryDialog').style.display = 'none';
}
