import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import '../styles/GameMenu.css';

const GameMenu: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  
  const games = [
    {
      id: 'mathdrops',
      name: 'Mathdrops',
      description: 'Solve falling math expressions',
      icon: '📐'
    },
    {
      id: 'memory-tiles',
      name: 'Memory Tiles',
      description: 'Remember and tap the colored tiles',
      icon: '🧩'
    },
    {
      id: 'lane-memory',
      name: 'Lane Memory',
      description: 'Memorize and replay the lane sequences',
      icon: '🎯'
    }
  ];
  
  return (
    <div className="game-menu">
      <h1 className="game-menu__title">Brain Teasers</h1>
      <div className="game-menu__grid">
        {games.map((game) => (
          <div key={game.id} className="game-card">
            <div
              className="game-card__content"
              onClick={() => {
                // For games with difficulty selection: toggle expanded state
                if (['mathdrops', 'memory-tiles', 'lane-memory'].includes(game.id)) {
                  setExpanded(prev => (prev === game.id ? null : game.id));
                } else {
                  navigate(`/${game.id}`);
                }
              }}
            >
              <div className="game-card__icon">{game.icon}</div>
              <h2 className="game-card__name">{game.name}</h2>
              <p className="game-card__description">{game.description}</p>
            </div>

            {['mathdrops', 'memory-tiles', 'lane-memory'].includes(game.id) && expanded === game.id && (
              <div className="game-card__tier-select">
                <TierButtons gameId={game.id} onNavigate={() => navigate(`/${game.id}`)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameMenu;

const TierButtons: React.FC<{ gameId: string; onNavigate: () => void }> = ({ gameId, onNavigate }) => {
  const setSelectedDifficulty = useGameStore(state => state.setSelectedDifficulty);
  const selected = useGameStore(state => state.getSelectedDifficulty(gameId));

  const handle = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(gameId, difficulty);
    onNavigate();
  };

  return (
    <div className="difficulty-buttons">
      <button className={`difficulty small ${selected === 'easy' ? 'active' : ''}`} onClick={() => handle('easy')}>Easy</button>
      <button className={`difficulty small ${selected === 'medium' ? 'active' : ''}`} onClick={() => handle('medium')}>Medium</button>
      <button className={`difficulty small ${selected === 'hard' ? 'active' : ''}`} onClick={() => handle('hard')}>Hard</button>
    </div>
  );
};