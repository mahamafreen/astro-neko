# AstroNeko: Ninja of the Stars

## Project Overview
AstroNeko is a browser-based action platformer built with React and Vite. The player controls a ninja-cat hero navigating futuristic starship environments to collect energy orbs, rescue captives, and reach a portal to complete each level.

The current implementation combines a React UI shell with a canvas-based game engine in `game.js`. This document explains the project purpose, gameplay, architecture, features, asset handling, and a proposed plan for further refinement.

---

## 1. Purpose and Vision
AstroNeko is designed to be a polished, lightweight web game that delivers:
- fast startup in modern browsers
- arcade-style platforming action
- collectible and rescue objectives
- clear visual feedback and sound design
- a smooth experience for desktop browser players

The core vision is an accessible web game with engaging progression, defined game states, and replayable levels.

---

## 2. Gameplay Summary
Players control the AstroNeko hero across a sequence of platform levels. Each level contains:
- platforms and moving obstacles
- orbs to collect
- prisoners to rescue
- enemies to avoid or defeat
- a portal that activates after objectives are complete

Player abilities:
- move left/right
- jump and double-jump
- dash ability with temporary invulnerability
- score accumulation through orbs, rescues, and enemy interactions

Win condition:
- collect all orbs
- rescue all prisoners
- enter the portal once it becomes active

Failure condition:
- lose all health from enemy or spike collisions
- fall below the visible play area

---

## 3. Technical Architecture
### 3.1. Frontend Framework
- React 18
- Vite build tool
- Entry point: `src/main.jsx`
- Root app component: `src/App.jsx`

### 3.2. Game Engine
- Single `game.js` module contains gameplay logic, rendering, and asset loading.
- Uses HTML5 Canvas for rendering level elements, player sprite, particles, and HUD.
- Handles core loops via `requestAnimationFrame()`.

### 3.3. Asset Management
- Static assets are stored under `assets/` and `public/assets/`.
- Images load via `new Image()` objects.
- Sounds load via `new Audio()` objects.
- The game waits for all assets to load before starting.

### 3.4. Game States
The game tracks states such as:
- `start`
- `playing`
- `levelTransition`
- `gameOver`
- `win`
- paused

Screens are managed using React-rendered DOM elements with CSS class toggling.

---

## 4. Current Project Structure
- `index.html`: root document and Vite entry injection
- `package.json`: dependencies and scripts
- `vite.config.js`: Vite configuration with React plugin
- `src/main.jsx`: React DOM bootstrap
- `src/App.jsx`: main React app that mounts the canvas and screens
- `game.js`: the full game engine and logic implementation
- `src/styles.css` and `styles/style.css`: styling for game UI and layout

---

## 5. Core Features
### Gameplay
- Multi-level platformer design
- Collectible orbs
- Rescuable prisoners (including a special "queen" type)
- Stationary and moving enemies
- Dash mechanic with enemy kill capability
- Double-jump and gravity-based movement
- Level transition via portal activation

### Visuals
- Parallax-style background rendering
- Animated orb and portal effects
- Player sprite animation frames
- Particle effects for jumps, hits, and pickups
- HUD overlay with score, health, level, and objectives

### Audio
- Background music for menu and gameplay
- Sound effects for jump, collect, damage, enemy kill, portal, and win
- Menu audio loop and music fade between screens

### UI
- Start screen with title and button
- Pause screen and game-over screen
- Win screen with restart options
- Dynamic HUD showing status and progress

---

## 6. Detailed Functional Flow
### Initialization
1. React mounts `App` and renders the canvas + UI screens.
2. `game.js` binds to DOM elements after the page content loads.
3. Assets begin loading and asset-count tracking starts.
4. Once all assets are loaded, the main menu is enabled.

### Starting the Game
1. Player clicks START.
2. `startGame()` sets state to `playing`, loads the first level, and enters the game loop.
3. Background music switches from menu music to gameplay music.

### Main Loop
- `update()` processes input, physics, collisions, enemies, and camera.
- `render()` draws the scene, HUD, and active UI overlays.
- `requestAnimationFrame(gameLoop)` continues while playing.

### Camera and Level
- The camera follows the player, clamped to level bounds.
- Platforms, spikes, enemies, orbs, and prisoners are loaded per level.
- Level boundaries are enforced to keep the player inside the map area.

### Object Interactions
- Orbs become collected when the player overlaps them.
- Prisoners are rescued when touched, with higher reward for queen characters.
- Enemies can damage the player or be destroyed by a downward jump or dash if permitted.
- Spikes deal damage on contact.
- Falls below the canvas cause instant damage and trigger game over if health reaches zero.

---

## 7. Implementation Notes
### Asset Loading Fixes
- DOM references must be bound after React renders the UI.
- Asset count should include both image and sound objects to avoid premature startup.
- The game should not call `assetLoaded()` before `setupAssetLoading()` is fully configured.

### Event Handling
- Keyboard input is tracked globally for movement and state toggles.
- `P` pauses/resumes the game during play.
- `D` toggles debug mode.
- Button click handlers are attached after DOM nodes exist.

### Game Logic
- The current game logic is procedural and embedded in one file.
- Collision detection uses axis-aligned bounding boxes.
- Particle and trail effects support visual polish, but should be kept limited in quantity.

---

## 8. Proposed Enhancements
### Code Quality
- Split `game.js` into modular files like `engine.js`, `levels.js`, `renderer.js`, and `input.js`.
- Add type checks or JSDoc comments.
- Introduce a lightweight state manager for screen transitions.

### Gameplay
- Add more enemy behaviors, hazards, and level variety.
- Add powerups or shields.
- Add a high-score or level-select screen.

### UX and Accessibility
- Show controls and objective text on the start screen.
- Add a volume slider and mute button.
- Support keyboard and mouse/touch input cleanly.

### Deployment
- Add `README.md` describing the project and build instructions.
- Deploy to GitHub Pages or another static host.
- Ensure build assets load correctly under the production base path.

---

## 9. Recommended Documentation
A strong documentation set should include:
- `README.md` with setup, play instructions, and contribution notes
- `PROJECT_PROPOSAL.md` explaining goals and architecture
- `CHANGELOG.md` for version progress
- `ASSET_LICENSES.md` if third-party art or audio is used

---

## 10. Conclusion
AstroNeko is a promising web platformer with a complete core gameplay loop and strong room for polish. The current project contains the essential game engine and UI screens, and it is ready for a structured refinement plan to create a stable, deployable browser game.

This document can serve as the definitive project explanation for stakeholders, developers, or deployment planning.