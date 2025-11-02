import React, { useState } from 'react';
import './RulesPopup.css';

interface RulesPopupProps {
  title: string;
  rules: string;
  onStart: (dontShowAgain: boolean) => void;
}

const RulesPopup: React.FC<RulesPopupProps> = ({ title, rules, onStart }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <div className="rules-popup-overlay">
      <div className="rules-popup-container">
        <h2>{title}</h2>
        <div className="rules-content">
          {rules}
        </div>
        <div className="rules-footer">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Don't show again</span>
          </label>
          <button 
            className="start-button"
            onClick={() => onStart(dontShowAgain)}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesPopup;
