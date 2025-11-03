import React from 'react';
import '../styles/EndGamePopup.css';

interface EndGamePopupProps {
  onEndGame: () => void;
  onContinue: () => void;
}

const EndGamePopup: React.FC<EndGamePopupProps> = ({ onEndGame, onContinue }) => {
  return (
    <div className="end-game-popup-overlay">
      <div className="end-game-popup">
        <h2 className="end-game-popup__title">End Game?</h2>
        <p className="end-game-popup__message">
          Are you sure you want to end the game? Your current progress will be saved.
        </p>
        
        <div className="end-game-popup__actions">
          <button 
            className="end-game-popup__button end-game-popup__button--cancel"
            onClick={onContinue}
          >
            Continue Playing
          </button>
          <button 
            className="end-game-popup__button end-game-popup__button--end"
            onClick={onEndGame}
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndGamePopup;
