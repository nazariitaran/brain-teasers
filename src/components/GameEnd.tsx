import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import '../styles/GameEnd.css';

interface GameEndProps {
  gameName: string;
  onPlayAgain: () => void;
  // Optional label to show which difficulty/tier the playthrough used
  difficultyLabel?: string;
}

const GameEnd: React.FC<GameEndProps> = ({ gameName, onPlayAgain, difficultyLabel }) => {
  const navigate = useNavigate();
  const { getCurrentScore } = useGameStore();
  const scores = getCurrentScore(gameName);
  
  const handleReturnToMenu = () => {
    navigate('/');
  };
  
  return (
    <div className="game-end">
      <div className="game-end__header">
        <h1 className="game-end__title">Game Over!</h1>
        {difficultyLabel && (
          <div className="game-end__subtitle">{difficultyLabel} Mode</div>
        )}
      </div>
      
      <div className="game-end__scores">
        <div className="game-end__scores-row">
          <div className="score-card">
            <span className="score-card__label">Score</span>
            <span className="score-card__value">{scores.current}</span>
          </div>
          <div className="score-card score-card--best">
            <span className="score-card__label">Best</span>
            <span className="score-card__value">{scores.highest}</span>
          </div>
        </div>
      </div>
      
      <div className="game-end__actions">
        <button 
          className="game-end__button game-end__button--primary"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
        
        <button 
          className="game-end__button game-end__button--secondary"
          onClick={handleReturnToMenu}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default GameEnd;