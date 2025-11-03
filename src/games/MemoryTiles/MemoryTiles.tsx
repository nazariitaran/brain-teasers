import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameEnd from '../../components/GameEnd';
import RulesPopup from '../../components/RulesPopup';
import EndGamePopup from '../../components/EndGamePopup';
import './MemoryTiles.css';

interface Tile {
  id: number;
  isTarget: boolean;
  isClicked: boolean;
  isWrong: boolean;
}

type GamePhase = 'showing' | 'playing' | 'feedback' | 'nextRound';

const MemoryTiles: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const { getSelectedDifficulty } = useGameStore();
  const difficulty = getSelectedDifficulty('memory-tiles');
  
  // Set initial grid size based on difficulty
  const initialGridSize = {
    easy: { rows: 3, cols: 3 },
    medium: { rows: 4, cols: 4 },
    hard: { rows: 5, cols: 5 }
  }[difficulty];
  
  const [gridSize, setGridSize] = useState(initialGridSize);
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [phase, setPhase] = useState<GamePhase>('showing');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showEndGamePopup, setShowEndGamePopup] = useState(false);
  
  const roundsPerExpansion = 3; // Grid expands every 3 rounds
  // Calculate show duration based on grid size - 3.5s for 5x5 and larger, 3s for smaller grids
  const showDuration = gridSize.rows * gridSize.cols > 25 ? 3500 : 3000;
  const feedbackDuration = 2000; // 2 seconds feedback to see tiles
  
  const phaseTimeoutRef = useRef<number>(0);
  const { updateScore, resetCurrentScore, hasSeenRules, setRulesShown } = useGameStore();
  
  
  // Initialize grid with optional override for grid size
  const initializeGrid = useCallback((overrideGridSize?: { rows: number; cols: number }, overrideRound?: number) => {
    const size = overrideGridSize || gridSize;
    const currentRound = overrideRound || round;
    const totalTiles = size.rows * size.cols;
    
    // Determine position within 3-round cycle (1, 2, or 3)
    const cyclePosition = ((currentRound - 1) % roundsPerExpansion) + 1;
    
    // Calculate target percentage based on cycle position
    // First round of cycle: 30%, second: 35%, third: 40%
    const percentages = [0.30, 0.35, 0.40];
    const targetPercentage = percentages[cyclePosition - 1];
    // Match previous calculation: floor(percentage * total) + 1, capped at total - 1
    const targetCount = Math.min(Math.floor(totalTiles * targetPercentage) + 1, totalTiles - 1);
    
    // Create array of tile indices
    const indices = Array.from({ length: totalTiles }, (_, i) => i);
    
    // Randomly select target tiles
    const targetIndices = new Set<number>();
    while (targetIndices.size < targetCount) {
      const randomIndex = Math.floor(Math.random() * totalTiles);
      targetIndices.add(randomIndex);
    }
    
    // Create tiles
    const newTiles: Tile[] = indices.map((id) => ({
      id,
      isTarget: targetIndices.has(id),
      isClicked: false,
      isWrong: false
    }));
    
    setTiles(newTiles);
    setPhase('showing');
    
    // Start the memorization phase
    phaseTimeoutRef.current = window.setTimeout(() => {
      setPhase('playing');
    }, showDuration);
  }, [gridSize, round, roundsPerExpansion, showDuration]);
  
  // Handle tile click
  const handleTileClick = useCallback((tileId: number) => {
    if (phase !== 'playing') return;
    
    setTiles(prev => {
      const tileIndex = prev.findIndex(t => t.id === tileId);
      if (tileIndex === -1) return prev;
      
      const tile = prev[tileIndex];
      if (tile.isClicked) return prev;
      
      // Create a new array with new tile objects
      const newTiles = prev.map((t, index) => {
        if (index === tileIndex) {
          const updatedTile = { ...t, isClicked: true };
          if (!t.isTarget) {
            updatedTile.isWrong = true;
          }
          return updatedTile;
        }
        return t;
      });
      
      return newTiles;
    });
  }, [phase]);
  
  // Progress to next round
  const nextRound = useCallback(() => {
    // Clear all tile states first
    setTiles([]);
    
    const newRound = round + 1;
    setRound(newRound);
    
    // Calculate new grid size - expands every 3 rounds consistently
    let newGridSize = gridSize;
    // Grid expands at the start of each new 3-round cycle (rounds 4, 7, 10, etc.)
    // This happens when (newRound - 1) % 3 === 0 and newRound > 1
    const isStartOfNewCycle = (newRound - 1) % roundsPerExpansion === 0 && newRound > 1;
    
    if (isStartOfNewCycle) {
      // Alternate between adding columns and rows
      const shouldAddCol = (gridSize.cols <= gridSize.rows);
      
      // Get maximum grid size based on difficulty
      const maxSize = {
        easy: 5,
        medium: 6,
        hard: 7
      }[difficulty];
      
      newGridSize = {
        rows: shouldAddCol ? gridSize.rows : Math.min(gridSize.rows + 1, maxSize),
        cols: shouldAddCol ? Math.min(gridSize.cols + 1, maxSize) : gridSize.cols
      };
      setGridSize(newGridSize);
    }
    
    setPhase('nextRound');
    // Small delay before starting new round with calculated grid size
    setTimeout(() => {
      initializeGrid(newGridSize, newRound);
    }, 300);
  }, [round, gridSize, initializeGrid, roundsPerExpansion, difficulty]);
  
  // Check if round is complete
  useEffect(() => {
    if (phase !== 'playing') return;
    if (tiles.length === 0) return;
    
    const targetTiles = tiles.filter(t => t.isTarget);
    const clickedTargets = targetTiles.filter(t => t.isClicked);
    const wrongClicks = tiles.filter(t => t.isWrong);
    
    // Check for immediate failure (wrong tile clicked)
    if (wrongClicks.length > 0) {
      // Wrong tile clicked - show feedback immediately
      setPhase('feedback');
      setFeedback('incorrect');
      
      // Deduct 1 health for the wrong click
      setHealth(prev => {
        const newHealth = Math.max(0, prev - 1);
        return newHealth;
      });
      
      // Show all target tiles that weren't clicked
      setTiles(prev => prev.map(t => ({
        ...t,
        isClicked: (t.isTarget || t.isClicked) ? true : t.isClicked
      })));
      
      phaseTimeoutRef.current = window.setTimeout(() => {
        setFeedback(null);
        if (health <= 1) { // Check if this was the last health
          setGameOver(true);
          updateScore('memory-tiles', score);
        } else {
          // Same round, try again
          initializeGrid(undefined, round);
        }
      }, feedbackDuration);
      return;
    }
    
    // Check for success only when all targets are clicked
    if (targetTiles.length > 0 && clickedTargets.length === targetTiles.length) {
      // All targets found!
      setPhase('feedback');
      setFeedback('correct');
      
      const pointsEarned = 1; // 1 point per round
      const newScore = score + pointsEarned;
      setScore(newScore);
      updateScore(`memory-tiles-${difficulty}`, newScore);
      
      phaseTimeoutRef.current = window.setTimeout(() => {
        setFeedback(null);
        // Clear tiles before moving to next round
        setTiles([]);
        setTimeout(() => {
          nextRound();
        }, 100);
      }, feedbackDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, phase, health, score, updateScore, initializeGrid, feedbackDuration]);
  
  // Reset game
  const handleRulesStart = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      setRulesShown('memory-tiles', true);
    }
    setShowRules(false);
    
    // Start game after rules close
    const timer = setTimeout(() => {
      initializeGrid(undefined, 1);
    }, 100);
    
    return () => clearTimeout(timer);
  };
  
  const resetGame = () => {
    setTiles([]);
    setGridSize({ rows: 3, cols: 3 });
    setHealth(3);
    setScore(0);
    setRound(1);
    setGameOver(false);
    setPhase('showing');
    setFeedback(null);
    resetCurrentScore(`memory-tiles-${difficulty}`);
    
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }
    
    // Start new game after small delay
    setTimeout(() => {
      initializeGrid(undefined, 1);
    }, 100);
  };

  const handleEndGameClick = () => {
    setShowEndGamePopup(true);
  };

  const handleConfirmEndGame = () => {
    setShowEndGamePopup(false);
    setGameOver(true);
    updateScore(`memory-tiles-${difficulty}`, score);
  };

  const handleContinueGame = () => {
    setShowEndGamePopup(false);
  };
  
  // Initialize game on mount
  useEffect(() => {
    if (!hasSeenRules('memory-tiles')) {
      setShowRules(true);
    } else {
      const timer = setTimeout(() => {
        initializeGrid(undefined, 1);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        if (phaseTimeoutRef.current) {
          clearTimeout(phaseTimeoutRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle game over from health depletion
  useEffect(() => {
    if (health === 0 && !gameOver && phase !== 'feedback') {
      // Only set game over after feedback has been shown
      setGameOver(true);
      // Use difficulty in the score key to track high scores separately
      updateScore(`memory-tiles-${difficulty}`, score);
    }
  }, [health, gameOver, phase, score, updateScore, difficulty]);
  
  if (gameOver) {
    return (
      <GameEnd 
        gameName={`memory-tiles-${difficulty}`}
        onPlayAgain={resetGame} 
        difficultyLabel={`${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`}
      />
    );
  }
  
  if (showRules) {
    return (
      <RulesPopup
        title="Memory Tiles"
        rules="Watch tiles light up in gold, then tap all the tiles that were highlighted. Each round adds more tiles. Get 3 wrong and game over! 🎮"
        onStart={handleRulesStart}
      />
    );
  }
  
  return (
    <div className="memory-tiles-game">
      {showEndGamePopup && (
        <EndGamePopup
          onEndGame={handleConfirmEndGame}
          onContinue={handleContinueGame}
        />
      )}
      <div className="game-header">
        <div className="health">
          {[...Array(3)].map((_, i) => (
            <span key={i} className={`heart ${i >= health ? 'heart--empty' : ''}`}>
              ❤️
            </span>
          ))}
        </div>
        
        <div className="game-header-center">
          {phase === 'showing' && (
            <div className="phase-indicator">
              <div className="phase-timer">
                <div
                  className="timer-bar"
                  style={{ animationDuration: `${showDuration}ms` }}
                />
              </div>
            </div>
          )}
          
          <div className="game-info">
            <div className="score">Score: {score}</div>
            {/* <div className="round">Round {round}</div> */}
          </div>
        </div>
        
        <button className="end-game-button" onClick={handleEndGameClick} title="End Game">
          ⏹️
        </button>
      </div>
      
      <div className="game-container">
        
        {feedback && (
          <div className={`feedback feedback--${feedback}`}>
            {feedback === 'correct' ? '✅ Correct!' : '❌ Wrong!'}
          </div>
        )}
        
        <div 
          className="tiles-grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize.rows}, minmax(0, 1fr))`
          }}
        >
          {tiles.map((tile) => (
            <button
              key={tile.id}
              className={`tile ${
                (phase === 'showing' && tile.isTarget) ? 'tile--target' : ''
              } ${
                tile.isClicked ? 'tile--clicked' : ''
              } ${
                tile.isWrong ? 'tile--wrong' : ''
              } ${
                (tile.isClicked && tile.isTarget) ? 'tile--correct' : ''
              }`}
              onClick={() => handleTileClick(tile.id)}
              disabled={phase !== 'playing' || tile.isClicked}
            />
          ))}
        </div>
        
        {phase === 'playing' && (
          <div className="hint-text">
            Tap the tiles that were highlighted!
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryTiles;