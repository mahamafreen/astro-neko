let canvas;
let ctx;

let startScreen;
let gameOverScreen;
let winScreen;
let pauseScreen;

let gameState = 'start';
let currentLevel = 1;
let camera = { x: 0, y: 0 };
let keys = {};
let isPaused = false;
let assetsLoaded = 0;
let totalAssets = 0;
let debugMode = false;

const assets = {
    background: new Image(),
    introBackground: new Image(),
    playerSprite: new Image(),
    orb: new Image(),
    portal: new Image(),
    enemy: new Image(),
    heartFull: new Image(),
    prisoner: new Image(),
    queenCat: new Image(),
    spike: new Image(),
    rockPlatform: new Image(),
    sounds: {
        menuMusic: new Audio(),
        bgMusic: new Audio(),
        collect: new Audio(),
        death: new Audio(),
        fireball: new Audio(),
        hit: new Audio(),
        jump: new Audio(),
        portal: new Audio(),
        win: new Audio(),
        enemyKill: new Audio()
    }
};

assets.background.src = '/assets/backgrounds/space-bg.jpg';
assets.introBackground.src = '/assets/backgrounds/intro-bg.jpg';
assets.playerSprite.src = '/assets/sprites/player.png';
assets.orb.src = '/assets/sprites/orb.png';
assets.portal.src = '/assets/sprites/portal.png';
assets.enemy.src = '/assets/sprites/enemy.png';
assets.heartFull.src = '/assets/sprites/heart-full.png';
assets.prisoner.src = '/assets/sprites/prisoner.png';
assets.queenCat.src = '/assets/sprites/queen-cat.png';
assets.spike.src = '/assets/sprites/spike.png';
assets.rockPlatform.src = '/assets/sprites/rock-platform.png';
assets.sounds.menuMusic.src = '/assets/sounds/menu-music.mp3';
assets.sounds.bgMusic.src = '/assets/sounds/bg-music.mp3';
assets.sounds.collect.src = '/assets/sounds/collect.mp3';
assets.sounds.death.src = '/assets/sounds/death.mp3';
assets.sounds.fireball.src = '/assets/sounds/fireball.mp3';
assets.sounds.hit.src = '/assets/sounds/hit.mp3';
assets.sounds.jump.src = '/assets/sounds/jump.mp3';
assets.sounds.portal.src = '/assets/sounds/portal.mp3';
assets.sounds.win.src = '/assets/sounds/win.mp3';
assets.sounds.enemyKill.src = '/assets/sounds/enemy-kill.mp3';

const player = {
    x: 100,
    y: 300,
    width: 64,
    height: 85,
    velX: 0,
    velY: 0,
    speed: 3,
    jumpPower: 15,
    gravity: 0.8,
    grounded: false,
    doubleJump: true,
    health: 3,
    maxHealth: 3,
    invulnerable: false,
    invulnerableTime: 0,
    dashCooldown: 0,
    dashDistance: 100,
    isDashing: false,
    dashTime: 0,
    score: 0,
    frameWidth: 64,
    frameHeight: 85,
    frameX: 0,
    frameY: 0,
    frameCount: 4,
    currentFrame: 0,
    frameTimer: 0,
    frameInterval: 10,
    facing: 'right',
    trail: [],
    canKillEnemies: false,
    dashStartX: 0,
    dashStartY: 0,
    dashTargetX: 0
};

function buildLevel({ platforms, enemies = [], orbs = [], spikes = [], prisoners = [], portalX, portalY = 450, levelWidth, canKillEnemies = false }) {
    return {
        platforms: platforms.map(([x, y, width, height = 20]) => ({ x, y, width, height })),
        enemies: enemies.map((enemy) => {
            const [x, y, width, height, type, startX, moveRange, moveSpeed] = enemy;
            return type === 'moving'
                ? { x, y, width, height, type, startX, moveRange, moveSpeed }
                : { x, y, width, height, type, startX: startX ?? x };
        }),
        orbs: orbs.map(([x, y]) => ({ x, y, collected: false })),
        spikes: spikes.map(([x, y, width, height = 20]) => ({ x, y, width, height })),
        prisoners: prisoners.map(([x, y, type = 'normal']) => ({ x, y, rescued: false, type })),
        portal: { x: portalX, y: portalY, active: false },
        levelWidth,
        canKillEnemies
    };
}

function bindUI() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        throw new Error('Game canvas not found');
    }

    ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Unable to get 2D rendering context');
    }

    startScreen = document.getElementById('startScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    winScreen = document.getElementById('winScreen');
    pauseScreen = document.getElementById('pauseScreen');

    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const playAgainButton = document.getElementById('playAgainButton');

    startButton?.addEventListener('click', startGame);
    restartButton?.addEventListener('click', restartGame);
    playAgainButton?.addEventListener('click', restartGame);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
}

function handleKeyDown(e) {
    keys[e.key] = true;

    if (e.key === 'd' || e.key === 'D') {
        debugMode = !debugMode;
        console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
    }

    if (e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
            isPaused = !isPaused;
            if (isPaused) {
                pauseScreen.classList.remove('hidden');
                pauseScreen.classList.add('active');
                assets.sounds.bgMusic.pause();
            } else {
                pauseScreen.classList.remove('active');
                pauseScreen.classList.add('hidden');
                assets.sounds.bgMusic.play();
            }
        }
    }
}

function syncSpriteMetrics() {
    if (assets.playerSprite.complete && assets.playerSprite.naturalWidth) {
        const columns = 4;
        const rows = 3;
        player.frameCount = columns;
        player.frameWidth = Math.floor(assets.playerSprite.naturalWidth / columns);
        player.frameHeight = Math.floor(assets.playerSprite.naturalHeight / rows);
    }
}

const levels = [
    buildLevel({
        platforms: [[0, 600, 300, 100], [400, 550, 200, 20], [700, 500, 200, 20], [1000, 450, 200, 20], [1300, 600, 300, 100], [1700, 500, 200, 20], [2100, 600, 400, 100]],
        enemies: [[450, 500, 50, 50, 'stationary', 450], [1050, 400, 50, 50, 'moving', 1050, 100, 2]],
        orbs: [[500, 520], [800, 470], [1100, 420]],
        prisoners: [[2200, 550]],
        portalX: 2300,
        levelWidth: 2500
    }),
    buildLevel({
        platforms: [[0, 600, 300, 100], [350, 550, 150, 20], [550, 500, 150, 20], [750, 450, 150, 20], [950, 400, 150, 20], [1200, 500, 200, 20], [1500, 450, 150, 20], [1700, 400, 150, 20], [1900, 350, 150, 20], [2200, 600, 400, 100]],
        enemies: [[400, 500, 50, 50, 'stationary', 400], [800, 400, 50, 50, 'moving', 800, 100, 2], [1300, 450, 50, 50, 'stationary', 1300], [1950, 300, 50, 50, 'moving', 1950, 100, 3]],
        orbs: [[425, 520], [625, 470], [825, 420], [1025, 370], [1300, 470]],
        spikes: [[600, 530, 30, 20], [900, 380, 30, 20], [1600, 430, 30, 20], [1800, 380, 30, 20]],
        prisoners: [[1300, 450], [2300, 550]],
        portalX: 2400,
        levelWidth: 2800,
        canKillEnemies: true
    }),
    buildLevel({
        platforms: [[0, 600, 300, 100], [350, 550, 100, 20], [500, 500, 100, 20], [650, 450, 100, 20], [800, 400, 100, 20], [950, 350, 100, 20], [1100, 400, 100, 20], [1250, 450, 100, 20], [1400, 500, 100, 20], [1550, 550, 100, 20], [1700, 500, 100, 20], [1850, 450, 100, 20], [2000, 400, 100, 20], [2150, 350, 100, 20], [2300, 600, 400, 100]],
        enemies: [[400, 500, 50, 50, 'stationary', 400], [700, 400, 50, 50, 'moving', 700, 100, 2], [1000, 300, 50, 50, 'stationary', 1000], [1300, 400, 50, 50, 'moving', 1300, 100, 3], [1600, 500, 50, 50, 'stationary', 1600], [1900, 350, 50, 50, 'moving', 1900, 100, 4]],
        orbs: [[400, 520], [550, 470], [700, 420], [850, 370], [1000, 320], [1150, 370], [1300, 420]],
        spikes: [[600, 530, 30, 20], [900, 380, 30, 20], [1200, 330, 30, 20], [1500, 480, 30, 20], [1750, 430, 30, 20], [2050, 330, 30, 20]],
        prisoners: [[850, 350], [1450, 450], [2400, 550]],
        portalX: 2500,
        levelWidth: 3000,
        canKillEnemies: true
    }),
    buildLevel({
        platforms: [[0, 600, 300, 100], [350, 550, 100, 20], [500, 500, 100, 20], [650, 450, 100, 20], [800, 400, 100, 20], [950, 350, 100, 20], [1100, 300, 100, 20], [1250, 350, 100, 20], [1400, 400, 100, 20], [1550, 450, 100, 20], [1700, 500, 100, 20], [1850, 550, 100, 20], [2000, 500, 100, 20], [2150, 450, 100, 20], [2300, 400, 100, 20], [2450, 350, 100, 20], [2600, 600, 400, 100]],
        enemies: [[400, 500, 50, 50, 'stationary', 400], [700, 400, 50, 50, 'moving', 700, 100, 2], [1000, 300, 50, 50, 'stationary', 1000], [1300, 300, 50, 50, 'moving', 1300, 100, 3], [1600, 400, 50, 50, 'stationary', 1600], [1900, 400, 50, 50, 'moving', 1900, 100, 4], [2200, 350, 50, 50, 'stationary', 2200], [2500, 300, 50, 50, 'moving', 2500, 100, 5]],
        orbs: [[400, 520], [550, 470], [700, 420], [850, 370], [1000, 320], [1200, 270], [1300, 320], [1450, 370], [1600, 420]],
        spikes: [[600, 530, 30, 20], [900, 380, 30, 20], [1200, 280, 30, 20], [1500, 380, 30, 20], [1800, 480, 30, 20], [2100, 330, 30, 20], [2400, 280, 30, 20]],
        prisoners: [[400, 500], [1150, 250], [1650, 400], [2150, 400]],
        portalX: 2800,
        levelWidth: 3200,
        canKillEnemies: true
    }),
    buildLevel({
        platforms: [[0, 600, 300, 100], [350, 550, 100, 20], [500, 500, 100, 20], [650, 450, 100, 20], [800, 400, 100, 20], [950, 350, 100, 20], [1100, 300, 100, 20], [1250, 250, 100, 20], [1400, 200, 100, 20], [1550, 250, 100, 20], [1700, 300, 100, 20], [1850, 350, 100, 20], [2000, 400, 100, 20], [2150, 450, 100, 20], [2300, 500, 100, 20], [2450, 550, 100, 20], [2600, 500, 100, 20], [2750, 450, 100, 20], [2900, 400, 100, 20], [3050, 350, 100, 20], [3200, 600, 400, 100]],
        enemies: [[400, 500, 50, 50, 'stationary', 400], [700, 400, 50, 50, 'moving', 700, 100, 2], [1000, 300, 50, 50, 'stationary', 1000], [1300, 200, 50, 50, 'moving', 1300, 100, 3], [1600, 200, 50, 50, 'stationary', 1600], [1900, 350, 50, 50, 'moving', 1900, 100, 4], [2200, 400, 50, 50, 'stationary', 2200], [2500, 450, 50, 50, 'moving', 2500, 100, 5], [2800, 350, 50, 50, 'stationary', 2800], [3100, 300, 50, 50, 'moving', 3100, 100, 6]],
        orbs: [[400, 520], [550, 470], [700, 420], [850, 370], [1000, 320], [1150, 270], [1300, 220], [1450, 170], [1600, 220], [1800, 320], [2050, 370]],
        spikes: [[600, 530, 30, 20], [900, 380, 30, 20], [1200, 280, 30, 20], [1500, 180, 30, 20], [1800, 330, 30, 20], [2100, 380, 30, 20], [2400, 430, 30, 20], [2700, 330, 30, 20], [3000, 280, 30, 20]],
        prisoners: [[850, 350], [1450, 150], [2050, 350], [2800, 400], [3300, 550, 'queen']],
        portalX: 3400,
        levelWidth: 3600,
        canKillEnemies: true
    })
];

let currentLevelData = {};
const particles = [];
const MAX_PARTICLES = 300;

function assetLoaded() {
    assetsLoaded++;
    syncSpriteMetrics();
    console.log(`Asset loaded: ${assetsLoaded}/${totalAssets}`);
    if (assetsLoaded === totalAssets) {
        console.log("All assets loaded, initializing game");
        startScreen.style.backgroundImage = `url(${assets.introBackground.src})`;
        startScreen.style.backgroundSize = 'cover';
        startScreen.style.backgroundPosition = 'center';
        init();
    }
}

function setupAssetLoading() {
    const imageAssets = [
        [assets.background, 'background image'],
        [assets.introBackground, 'intro background image'],
        [assets.playerSprite, 'player sprite'],
        [assets.orb, 'orb sprite'],
        [assets.portal, 'portal sprite'],
        [assets.enemy, 'enemy sprite'],
        [assets.heartFull, 'heart sprite'],
        [assets.prisoner, 'prisoner sprite'],
        [assets.queenCat, 'queen cat sprite'],
        [assets.spike, 'spike sprite'],
        [assets.rockPlatform, 'rock platform sprite']
    ];

    imageAssets.forEach(([asset, label]) => {
        asset.onload = assetLoaded;
        asset.onerror = () => {
            console.error(`Failed to load ${label}`);
            assetLoaded();
        };
    });

    const soundAssets = [
        assets.sounds.menuMusic,
        assets.sounds.bgMusic,
        assets.sounds.collect,
        assets.sounds.death,
        assets.sounds.fireball,
        assets.sounds.hit,
        assets.sounds.jump,
        assets.sounds.portal,
        assets.sounds.win,
        assets.sounds.enemyKill
    ];

    totalAssets = imageAssets.length + soundAssets.length;

    soundAssets.forEach((sound) => {
        sound.oncanplaythrough = assetLoaded;
        sound.onerror = () => {
            console.error(`Failed to load sound: ${sound.src}`);
            assetLoaded();
        };
    });
}

function setScreenVisibility(screen, visible) {
    screen.classList.toggle('active', visible);
    screen.classList.toggle('hidden', !visible);
}

function init() {
    console.log("Initializing game");
    setScreenVisibility(startScreen, true);
    setScreenVisibility(gameOverScreen, false);
    setScreenVisibility(winScreen, false);
    setScreenVisibility(pauseScreen, false);
    
    assets.sounds.menuMusic.loop = true;
    assets.sounds.menuMusic.volume = 0.3;
    
    assets.sounds.bgMusic.loop = true;
    assets.sounds.bgMusic.volume = 0.3;
    
    assets.sounds.collect.volume = 0.5;
    assets.sounds.death.volume = 0.5;
    assets.sounds.fireball.volume = 0.5;
    assets.sounds.hit.volume = 0.5;
    assets.sounds.jump.volume = 0.5;
    assets.sounds.portal.volume = 0.5;
    assets.sounds.win.volume = 0.5;
    assets.sounds.enemyKill.volume = 0.5;
    
    assets.sounds.menuMusic.play().catch(e => console.error("Error playing menu music:", e));
}

function startGame() {
    console.log("Starting game");
    gameState = 'playing';
    setScreenVisibility(startScreen, false);
    currentLevel = 1;
    resetPlayer();
    clearParticles();
    loadLevel(currentLevel);
    
    assets.sounds.menuMusic.pause();
    assets.sounds.menuMusic.currentTime = 0;
    assets.sounds.bgMusic.play().catch(e => console.error("Error playing bg music:", e));
    
    gameLoop();
}

function restartGame() {
    console.log("Restarting game from level", currentLevel);
    gameState = 'playing';
    
    setScreenVisibility(gameOverScreen, false);
    setScreenVisibility(winScreen, false);
    setScreenVisibility(startScreen, false);
    setScreenVisibility(pauseScreen, false);
    
    resetPlayer();
    clearParticles();
    loadLevel(currentLevel);
    
    assets.sounds.menuMusic.pause();
    assets.sounds.menuMusic.currentTime = 0;
    assets.sounds.bgMusic.currentTime = 0;
    assets.sounds.bgMusic.play().catch(e => console.error("Error playing bg music:", e));
    
    gameLoop();
}

function clearParticles() {
    particles.length = 0;
}

function resetPlayer() {
    console.log("Resetting player");
    if (currentLevelData.platforms && currentLevelData.platforms.length > 0) {
        const firstPlatform = currentLevelData.platforms[0];
        player.x = firstPlatform.x + 50;
        player.y = firstPlatform.y - player.height - 5;
    } else {
        player.x = 100;
        player.y = 300;
    }
    
    player.velX = 0;
    player.velY = 0;
    player.health = player.maxHealth;
    player.invulnerable = false;
    player.invulnerableTime = 0;
    player.dashCooldown = 0;
    player.isDashing = false;
    player.dashTime = 0;
    player.score = 0;
    player.grounded = false;
    player.doubleJump = true;
    player.trail = [];
    player.canKillEnemies = false;
}

function placeLevelObjects(levelData) {
    const findPlatform = (x, y) => {
        return levelData.platforms.find((platform) => x >= platform.x && x <= platform.x + platform.width && y >= platform.y - 80 && y <= platform.y + platform.height);
    };

    for (const orb of levelData.orbs) {
        const platform = findPlatform(orb.x, orb.y);
        if (platform) orb.y = platform.y - 35;
        orb.collected = false;
    }

    for (const prisoner of levelData.prisoners) {
        const platform = findPlatform(prisoner.x, prisoner.y);
        if (platform) prisoner.y = platform.y - 45;
        prisoner.rescued = false;
    }

    for (const spike of levelData.spikes) {
        const platform = findPlatform(spike.x, spike.y);
        if (platform) spike.y = platform.y - spike.height;
    }
}

function loadLevel(levelNum) {
    console.log(`Loading level ${levelNum}`);
    if (levelNum < 1 || levelNum > levels.length) {
        console.error(`Invalid level number: ${levelNum}`);
        return false;
    }
    
    clearParticles();
    
    currentLevelData = JSON.parse(JSON.stringify(levels[levelNum - 1]));
    
    camera.x = 0;
    camera.y = 0;
    
    for (const enemy of currentLevelData.enemies) {
        if (!enemy.startX) {
            enemy.startX = enemy.x;
        } else {
            enemy.x = enemy.startX;
        }
    }
    
    placeLevelObjects(currentLevelData);
    currentLevelData.portal.active = false;
    
    player.canKillEnemies = currentLevelData.canKillEnemies || false;
    
    console.log(`Level ${levelNum} loaded successfully`);
    return true;
}

function update() {
    if (gameState !== 'playing' || isPaused) return;
    
    updatePlayer();
    updateEnemies();
    updateParticles();
    checkCollisions();
    checkLevelComplete();
    updateCamera();
}

function updatePlayer() {
    if (keys['ArrowLeft']) {
        player.velX = -player.speed;
        player.facing = 'left';
        player.frameY = 1;
    } else if (keys['ArrowRight']) {
        player.velX = player.speed;
        player.facing = 'right';
        player.frameY = 1;
    } else {
        player.velX *= 0.8;
        player.frameY = 0;
    }
    
    if (keys['ArrowUp'] && player.grounded) {
        player.velY = -player.jumpPower;
        player.grounded = false;
        player.doubleJump = true;
        player.frameY = 2;
        assets.sounds.jump.play().catch(e => console.error("Error playing jump sound:", e));
        
        createParticles(player.x + player.width / 2, player.y + player.height, 10, 
            (Math.random() - 0.5) * 4, Math.random() * -2, 
            Math.random() * 3 + 1, 20, `hsl(${Math.random() * 60 + 180}, 100%, 70%)`);
    }
    else if (keys['ArrowUp'] && !player.grounded && player.doubleJump && player.velY > 0) {
        player.velY = -player.jumpPower;
        player.doubleJump = false;
        player.frameY = 2;
        assets.sounds.jump.play().catch(e => console.error("Error playing jump sound:", e));
        
        createParticles(player.x + player.width / 2, player.y + player.height / 2, 15, 
            (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 
            Math.random() * 4 + 2, 25, `hsl(${Math.random() * 60 + 180}, 100%, 70%)`);
    }
    
    if (keys[' '] && player.dashCooldown <= 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashTime = 15;
        player.dashCooldown = 90;
        player.invulnerable = true;
        player.invulnerableTime = 15;
        player.dashStartX = player.x;
        player.dashStartY = player.y;
        player.dashTargetX = player.x + (player.facing === 'right' ? player.dashDistance : -player.dashDistance);
        assets.sounds.fireball.play().catch(e => console.error("Error playing fireball sound:", e));
        
        createParticles(player.x + player.width / 2, player.y + player.height / 2, 20, 
            (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, 
            Math.random() * 5 + 2, 30, `hsl(${Math.random() * 60 + 280}, 100%, 70%)`);
    }
    
    if (player.isDashing) {
        const dashProgress = 1 - (player.dashTime / 15);
        
        player.x = player.dashStartX + (player.dashTargetX - player.dashStartX) * dashProgress;
        
        player.trail.push({
            x: player.x,
            y: player.y,
            alpha: 1
        });
        
        player.dashTime--;
        if (player.dashTime <= 0) {
            player.isDashing = false;
        }
        
        if (player.canKillEnemies) {
            for (let i = currentLevelData.enemies.length - 1; i >= 0; i--) {
                const enemy = currentLevelData.enemies[i];
                
                if (enemy.dead) continue;
                
                if (
                    player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y
                ) {
                    enemy.dead = true;
                    player.score += 200;
                    assets.sounds.enemyKill.play().catch(e => console.error("Error playing enemyKill sound:", e));
                    
                    createParticles(
                        enemy.x + enemy.width / 2, 
                        enemy.y + enemy.height / 2, 
                        30, 
                        (Math.random() - 0.5) * 10, 
                        (Math.random() - 0.5) * 10, 
                        Math.random() * 5 + 2, 
                        40, 
                        `hsl(${Math.random() * 60 + 300}, 100%, 70%)`
                    );
                }
            }
        }
    }
    
    if (player.dashCooldown > 0) {
        player.dashCooldown--;
    }
    
    if (player.invulnerable) {
        player.invulnerableTime--;
        if (player.invulnerableTime <= 0) {
            player.invulnerable = false;
        }
    }
    
    player.velY += player.gravity;
    
    if (!player.isDashing) {
        player.x += player.velX;
        player.y += player.velY;
    }
    
    player.frameTimer++;
    if (player.frameTimer >= player.frameInterval) {
        player.frameTimer = 0;
        player.currentFrame = (player.currentFrame + 1) % player.frameCount;
        player.frameX = player.currentFrame;
    }
    
    if (player.x < 0) player.x = 0;
    if (player.x > currentLevelData.levelWidth - player.width) player.x = currentLevelData.levelWidth - player.width;
    
    if (player.y > canvas.height) {
        takeDamage(3);
    }
    
    for (let i = player.trail.length - 1; i >= 0; i--) {
        player.trail[i].alpha -= 0.1;
        if (player.trail[i].alpha <= 0) {
            player.trail.splice(i, 1);
        }
    }
}

function updateEnemies() {
    for (let i = currentLevelData.enemies.length - 1; i >= 0; i--) {
        const enemy = currentLevelData.enemies[i];
        
        if (enemy.dead) continue;
        
        if (enemy.type === 'moving') {
            enemy.x += enemy.moveSpeed;
            
            if (Math.abs(enemy.x - enemy.startX) > enemy.moveRange) {
                enemy.moveSpeed *= -1;
            }
        }
    }
}

function createParticles(x, y, count, velXRange, velYRange, sizeRange, life, color) {
    if (particles.length + count > MAX_PARTICLES) {
        const removeCount = particles.length + count - MAX_PARTICLES;
        particles.splice(0, removeCount);
    }
    
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            velX: typeof velXRange === 'function' ? velXRange() : (Math.random() - 0.5) * velXRange,
            velY: typeof velYRange === 'function' ? velYRange() : (Math.random() - 0.5) * velYRange,
            size: typeof sizeRange === 'function' ? sizeRange() : Math.random() * sizeRange,
            life: life,
            color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.2;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    if (particles.length > MAX_PARTICLES) {
        const removeCount = particles.length - MAX_PARTICLES;
        particles.splice(0, removeCount);
    }
}

function checkCollisions() {
    player.grounded = false;
    for (const platform of currentLevelData.platforms) {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y
        ) {
            if (player.velY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.velY = 0;
                player.grounded = true;
                player.doubleJump = true;
                
                if (!player.isDashing) {
                    createParticles(
                        player.x + Math.random() * player.width, 
                        player.y + player.height, 
                        5, 
                        (Math.random() - 0.5) * 2, 
                        Math.random() * -1, 
                        Math.random() * 2 + 1, 
                        15, 
                        `hsl(${Math.random() * 60 + 30}, 100%, 70%)`
                    );
                }
            }
            else if (player.velY < 0 && player.y > platform.y) {
                player.y = platform.y + platform.height;
                player.velY = 0;
            }
            else if (player.velX > 0 && player.x < platform.x) {
                player.x = platform.x - player.width;
                player.velX = 0;
            }
            else if (player.velX < 0 && player.x > platform.x) {
                player.x = platform.x + platform.width;
                player.velX = 0;
            }
        }
    }
    
    if (!player.invulnerable) {
        for (const spike of currentLevelData.spikes) {
            if (
                player.x < spike.x + spike.width &&
                player.x + player.width > spike.x &&
                player.y < spike.y + spike.height &&
                player.y + player.height > spike.y
            ) {
                takeDamage(1);
                assets.sounds.hit.play().catch(e => console.error("Error playing hit sound:", e));
                
                createParticles(
                    player.x + player.width / 2, 
                    player.y + player.height / 2, 
                    20, 
                    (Math.random() - 0.5) * 8, 
                    (Math.random() - 0.5) * 8, 
                    Math.random() * 4 + 2, 
                    30, 
                    `hsl(0, 100%, 70%)`
                );
                break;
            }
        }
    }
    
    if (!player.invulnerable || player.isDashing) {
        for (let i = currentLevelData.enemies.length - 1; i >= 0; i--) {
            const enemy = currentLevelData.enemies[i];
            
            if (enemy.dead) continue;
            
            if (
                player.velY > 0 && 
                player.y + player.height < enemy.y + enemy.height/2 &&
                player.y + player.height > enemy.y &&
                player.x + player.width > enemy.x &&
                player.x < enemy.x + enemy.width
            ) {
                enemy.dead = true;
                player.velY = -player.jumpPower * 0.5;
                player.score += 100;
                assets.sounds.enemyKill.play().catch(e => console.error("Error playing enemyKill sound:", e));
                
                createParticles(
                    enemy.x + enemy.width / 2, 
                    enemy.y + enemy.height / 2, 
                    30, 
                    (Math.random() - 0.5) * 10, 
                    (Math.random() - 0.5) * 10, 
                    Math.random() * 5 + 2, 
                    40, 
                    `hsl(${Math.random() * 60 + 300}, 100%, 70%)`
                );
            }
            else if (player.isDashing && player.canKillEnemies) {
                if (
                    player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y
                ) {
                    enemy.dead = true;
                    player.score += 200;
                    assets.sounds.enemyKill.play().catch(e => console.error("Error playing enemyKill sound:", e));
                    
                    createParticles(
                        enemy.x + enemy.width / 2, 
                        enemy.y + enemy.height / 2, 
                        30, 
                        (Math.random() - 0.5) * 10, 
                        (Math.random() - 0.5) * 10, 
                        Math.random() * 5 + 2, 
                        40, 
                        `hsl(${Math.random() * 60 + 300}, 100%, 70%)`
                    );
                }
            } else if (!player.isDashing) {
                if (
                    player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y
                ) {
                    takeDamage(1);
                    assets.sounds.hit.play().catch(e => console.error("Error playing hit sound:", e));
                    
                    createParticles(
                        player.x + player.width / 2, 
                        player.y + player.height / 2, 
                        20, 
                        (Math.random() - 0.5) * 8, 
                        (Math.random() - 0.5) * 8, 
                        Math.random() * 4 + 2, 
                        30, 
                        `hsl(0, 100%, 70%)`
                    );
                    break;
                }
            }
        }
    }
    
    for (const orb of currentLevelData.orbs) {
        if (!orb.collected) {
            const orbCenterX = orb.x + 15;
            const orbCenterY = orb.y + 15;
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            
            const distanceX = Math.abs(orbCenterX - playerCenterX);
            const distanceY = Math.abs(orbCenterY - playerCenterY);
            
            if (distanceX < (player.width / 2 + 15) && distanceY < (player.height / 2 + 15)) {
                orb.collected = true;
                player.score += 100;
                assets.sounds.collect.play().catch(e => console.error("Error playing collect sound:", e));
                
                createParticles(
                    orb.x + 15, 
                    orb.y + 15, 
                    30, 
                    (Math.random() - 0.5) * 10, 
                    (Math.random() - 0.5) * 10, 
                    Math.random() * 5 + 2, 
                    40, 
                    `hsl(${Math.random() * 60 + 40}, 100%, 70%)`
                );
                
                console.log("Orb collected!");
            }
        }
    }
    
    for (const prisoner of currentLevelData.prisoners) {
        if (!prisoner.rescued) {
            const prisonerCenterX = prisoner.x + 25;
            const prisonerCenterY = prisoner.y + 25;
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            
            const distanceX = Math.abs(prisonerCenterX - playerCenterX);
            const distanceY = Math.abs(prisonerCenterY - playerCenterY);
            
            if (distanceX < (player.width / 2 + 25) && distanceY < (player.height / 2 + 25)) {
                prisoner.rescued = true;
                player.score += prisoner.type === 'queen' ? 1000 : 500;
                assets.sounds.collect.play().catch(e => console.error("Error playing collect sound:", e));
                
                const particleCount = prisoner.type === 'queen' ? 100 : 50;
                const particleLife = prisoner.type === 'queen' ? 70 : 50;
                const particleColor = prisoner.type === 'queen' ? 
                    `hsl(${Math.random() * 60 + 300}, 100%, 70%)` : 
                    `hsl(${Math.random() * 60 + 180}, 100%, 70%)`;
                    
                createParticles(
                    prisoner.x + 25, 
                    prisoner.y + 25, 
                    particleCount, 
                    (Math.random() - 0.5) * 12, 
                    (Math.random() - 0.5) * 12, 
                    Math.random() * 6 + 3, 
                    particleLife, 
                    particleColor
                );
                
                console.log(`${prisoner.type === 'queen' ? 'Queen cat' : 'Prisoner'} rescued!`);
            }
        }
    }
}

function checkLevelComplete() {
    const allOrbsCollected = currentLevelData.orbs.every(orb => orb.collected);
    const allPrisonersRescued = currentLevelData.prisoners.every(prisoner => prisoner.rescued);
    
    if (allOrbsCollected && allPrisonersRescued) {
        currentLevelData.portal.active = true;
        
        if (
            player.x < currentLevelData.portal.x + 80 &&
            player.x + player.width > currentLevelData.portal.x &&
            player.y < currentLevelData.portal.y + 100 &&
            player.y + player.height > currentLevelData.portal.y
        ) {
            console.log(`Level ${currentLevel} complete!`);
            assets.sounds.portal.play().catch(e => console.error("Error playing portal sound:", e));
            
            createParticles(
                currentLevelData.portal.x + 40, 
                currentLevelData.portal.y + 50, 
                100, 
                (Math.random() - 0.5) * 15, 
                (Math.random() - 0.5) * 15, 
                Math.random() * 8 + 4, 
                60, 
                `hsl(${Math.random() * 60 + 200}, 100%, 70%)`
            );
            
            gameState = 'levelTransition';
            
            setTimeout(() => {
                console.log("Transitioning to next level");
                clearParticles();
                
                currentLevel++;
                
                if (currentLevel > levels.length) {
                    console.log("All levels completed!");
                    gameState = 'win';
                    winScreen.classList.remove('hidden');
                    winScreen.classList.add('active');
                    assets.sounds.bgMusic.pause();
                    assets.sounds.win.play().catch(e => console.error("Error playing win sound:", e));
                } else {
                    loadLevel(currentLevel);
                    resetPlayer();
                    
                    gameState = 'playing';
                    console.log(`Starting level ${currentLevel}`);
                }
            }, 100);
        }
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;
    
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;
    
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;
    if (camera.x > currentLevelData.levelWidth - canvas.width) camera.x = currentLevelData.levelWidth - canvas.width;
    if (camera.y > 700 - canvas.height) camera.y = 700 - canvas.height;
}

function takeDamage(amount) {
    if (!player.invulnerable) {
        player.health -= amount;
        player.invulnerable = true;
        player.invulnerableTime = 60;
        
        if (player.health <= 0) {
            player.health = 0;
            gameState = 'gameOver';
            gameOverScreen.classList.remove('hidden');
            gameOverScreen.classList.add('active');
            assets.sounds.bgMusic.pause();
            assets.sounds.death.play().catch(e => console.error("Error playing death sound:", e));
            
            createParticles(
                player.x + player.width / 2, 
                player.y + player.height / 2, 
                100, 
                (Math.random() - 0.5) * 15, 
                (Math.random() - 0.5) * 15, 
                Math.random() * 8 + 4, 
                80, 
                `hsl(0, 100%, 70%)`
            );
        }
    }
}

function render() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-camera.x * 0.3, -camera.y * 0.3);
    ctx.globalAlpha = 0.7;
    if (assets.background.complete) {
        ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
    
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 37) % canvas.height;
        const size = (i % 3) + 1;
        const alpha = 0.3 + (i % 5) * 0.1;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    for (const platform of currentLevelData.platforms) {
        ctx.save();
        
        if (assets.rockPlatform.complete) {
            const pattern = ctx.createPattern(assets.rockPlatform, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            const gradient = ctx.createLinearGradient(
                platform.x, platform.y,
                platform.x, platform.y + platform.height
            );
            gradient.addColorStop(0, 'rgba(74, 0, 224, 0.2)');
            gradient.addColorStop(1, 'rgba(142, 45, 226, 0.2)');
            ctx.fillStyle = gradient;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        } else {
            const gradient = ctx.createLinearGradient(
                platform.x, platform.y,
                platform.x, platform.y + platform.height
            );
            gradient.addColorStop(0, '#4a00e0');
            gradient.addColorStop(1, '#8e2de2');
            ctx.fillStyle = gradient;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
        
        ctx.shadowColor = '#8e2de2';
        ctx.shadowBlur = 15;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
    
    for (const spike of currentLevelData.spikes) {
        ctx.save();
        
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 10;
        
        if (assets.spike.complete) {
            ctx.drawImage(
                assets.spike,
                spike.x,
                spike.y,
                spike.width,
                spike.height
            );
        }
        
        ctx.restore();
    }
    
    for (const enemy of currentLevelData.enemies) {
        if (enemy.dead) continue;
        
        ctx.save();
        
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = 10;
        
        if (assets.enemy.complete) {
            ctx.drawImage(
                assets.enemy,
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );
        }
        
        ctx.restore();
    }
    
    for (const orb of currentLevelData.orbs) {
        if (!orb.collected && assets.orb.complete) {
            ctx.save();
            ctx.translate(orb.x + 16, orb.y + 16);
            
            const scale = 1 + Math.sin(Date.now() / 200) * 0.2;
            ctx.scale(scale, scale);
            
            ctx.rotate(Date.now() / 1000);
            
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 20;
            
            ctx.drawImage(
                assets.orb,
                -16,
                -16,
                32,
                32
            );
            
            ctx.restore();
        }
    }
    
    for (const prisoner of currentLevelData.prisoners) {
        if (!prisoner.rescued) {
            ctx.save();
            
            const scale = 1 + Math.sin(Date.now() / 500) * 0.1;
            ctx.translate(prisoner.x + 24, prisoner.y + 24);
            ctx.scale(scale, scale);
            
            ctx.shadowColor = prisoner.type === 'queen' ? '#ff00ff' : '#00ffcc';
            ctx.shadowBlur = prisoner.type === 'queen' ? 25 : 15;
            
            if (prisoner.type === 'queen' && assets.queenCat.complete) {
                ctx.drawImage(
                    assets.queenCat,
                    -24,
                    -24,
                    48,
                    48
                );
            } else if (assets.prisoner.complete) {
                ctx.drawImage(
                    assets.prisoner,
                    -24,
                    -24,
                    48,
                    48
                );
            }
            
            ctx.restore();
        }
    }
    
    if (currentLevelData.portal.active && assets.portal.complete) {
        ctx.save();
        ctx.translate(currentLevelData.portal.x + 40, currentLevelData.portal.y + 50);
        
        const scale = 1 + Math.sin(Date.now() / 300) * 0.2;
        ctx.scale(scale, scale);
        
        ctx.rotate(Date.now() / 1000);
        
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 30;
        
        ctx.drawImage(
            assets.portal,
            -40,
            -50,
            80,
            100
        );
        
        ctx.restore();
    }
    
    for (const trail of player.trail) {
        ctx.save();
        ctx.globalAlpha = trail.alpha * 0.5;
        drawPlayerSprite(trail.x, trail.y, player.facing === 'left');
        ctx.restore();
    }
    
    if (player.invulnerable && Math.floor(player.invulnerableTime / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    drawPlayerSprite(player.x, player.y, player.facing === 'left');
    
    ctx.globalAlpha = 1;
    ctx.restore();
    
    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    if (debugMode) {
        ctx.save();
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x - camera.x, player.y - camera.y, player.width, player.height);
        
        for (const orb of currentLevelData.orbs) {
            if (!orb.collected) {
                ctx.strokeStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(orb.x + 15 - camera.x, orb.y + 15 - camera.y, 15, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        for (const prisoner of currentLevelData.prisoners) {
            if (!prisoner.rescued) {
                ctx.strokeStyle = prisoner.type === 'queen' ? '#ff00ff' : '#00ffff';
                ctx.beginPath();
                ctx.arc(prisoner.x + 25 - camera.x, prisoner.y + 25 - camera.y, 25, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    drawUI();
}

function drawPlayerSprite(x, y, flipX = false) {
    if (!assets.playerSprite.complete) return;

    const frameWidth = player.frameWidth || player.width;
    const frameHeight = player.frameHeight || player.height;
    const sx = player.frameX * frameWidth;
    const sy = player.frameY * frameHeight;

    ctx.save();
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(
        assets.playerSprite,
        sx,
        sy,
        frameWidth,
        frameHeight,
        0,
        0,
        player.width,
        player.height
    );
    ctx.restore();
}

function drawUI() {
    for (let i = 0; i < player.maxHealth; i++) {
        if (i < player.health && assets.heartFull.complete) {
            ctx.save();
            ctx.shadowColor = '#ff0066';
            ctx.shadowBlur = 10;
            ctx.drawImage(
                assets.heartFull,
                20 + i * 40,
                20,
                30,
                30
            );
            ctx.restore();
        }
    }
    
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${player.score}`, canvas.width - 20, 40);
    
    ctx.textAlign = 'center';
    ctx.fillText(`Level: ${currentLevel}`, canvas.width / 2, 40);
    
    const collectedOrbs = currentLevelData.orbs.filter(orb => orb.collected).length;
    const totalOrbs = currentLevelData.orbs.length;
    ctx.fillText(`Orbs: ${collectedOrbs}/${totalOrbs}`, canvas.width / 2, 70);
    
    const rescuedPrisoners = currentLevelData.prisoners.filter(p => p.rescued).length;
    const totalPrisoners = currentLevelData.prisoners.length;
    ctx.fillText(`Prisoners: ${rescuedPrisoners}/${totalPrisoners}`, canvas.width / 2, 100);
    
    if (player.canKillEnemies) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`DASH KILLS ACTIVE!`, canvas.width / 2, 160);
        
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.fillText(`DASH KILLS ACTIVE!`, canvas.width / 2, 160);
        ctx.shadowBlur = 0;
    }
    ctx.restore();
    
    if (player.dashCooldown > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(142, 45, 226, 0.7)';
        ctx.fillRect(canvas.width / 2 - 100, canvas.height - 30, 200 * (1 - player.dashCooldown / 90), 10);
        ctx.strokeStyle = '#8e2de2';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 100, canvas.height - 30, 200, 10);
        ctx.restore();
    }
    
    if (debugMode) {
        ctx.save();
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("DEBUG MODE ON", 10, canvas.height - 10);
        ctx.restore();
    }
}

function gameLoop() {
    update();
    render();
    
    if (gameState === 'playing' || gameState === 'levelTransition') {
        requestAnimationFrame(gameLoop);
    }
}

function initializeGame() {
    console.log('Page loaded, setting up asset loading');
    bindUI();
    setupAssetLoading();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeGame();
} else {
    window.addEventListener('DOMContentLoaded', initializeGame);
}