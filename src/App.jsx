import React, { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const loadGame = async () => {
      await import('../game.js');
    };

    loadGame();
  }, []);

  return (
    <div className="game-container">
      <canvas id="gameCanvas" width="1200" height="700"></canvas>

      <div id="startScreen" className="screen active">
        <div className="intro-background"></div>
        <div className="game-title">
          <h1>ASTRONEKO</h1>
          <h2>NINJA OF THE STARS</h2>
        </div>
        <button id="startButton" className="button">
          START
        </button>
      </div>

      <div id="gameOverScreen" className="screen hidden">
        <h2>GAME OVER</h2>
        <button id="restartButton" className="button">
          RESTART
        </button>
      </div>

      <div id="winScreen" className="screen hidden">
        <h2>YOU WIN!</h2>
        <button id="playAgainButton" className="button">
          PLAY AGAIN
        </button>
      </div>

      <div id="pauseScreen" className="screen hidden">
        <h2>PAUSED</h2>
        <p>Press P to resume</p>
      </div>
    </div>
  );
}
