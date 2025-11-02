import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameEnd from '../../components/GameEnd';
import RulesPopup from '../../components/RulesPopup';
import './Mathdrops.css';

interface Raindrop {
  id: string;
  expression: string;
  answer: number;
  x: number;
  y: number;
  speed: number;
  created: number;
}

const Mathdrops: React.FC = () => {
  const [expressions, setExpressions] = useState<Raindrop[]>([]);
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  // Selected starting difficulty is chosen from the main menu and persisted in the store
  const difficultyLabel = useGameStore(state => state.getSelectedDifficulty('mathdrops'));
  const [showRules, setShowRules] = useState(false);

  const gameLoopRef = useRef<number>(0);
  const dropIntervalRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { updateScore, resetCurrentScore, hasSeenRules, setRulesShown } = useGameStore();

  const generateExpression = useCallback(() => {
    const operators = ['+', '-', '×', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    // Base number depends on selected starting difficulty; internal `difficulty` still increments
    // as before (every 5 points) to increase challenge.
    const baseByDifficulty = difficultyLabel === 'easy' ? 10 : difficultyLabel === 'medium' ? 15 : 20;
    const maxNum = Math.min(baseByDifficulty + difficulty * 2, 50);
    const minNum = Math.max(baseByDifficulty - 10 + difficulty * 2, 1); // Starts 10 less than base

    const getRandomInRange = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    let a: number, b: number, answer: number;

    switch (operator) {
      case '+':
        a = getRandomInRange(minNum, maxNum);
        b = getRandomInRange(minNum, maxNum);
        answer = a + b;
        break;
      case '-':
        // For subtraction, ensure a > b to avoid negative results
        a = getRandomInRange(minNum + 5, maxNum); // Add offset to ensure room for subtraction
        b = getRandomInRange(minNum, Math.min(a - 1, maxNum));
        answer = a - b;
        break;
      case '×': {
        // For multiplication, use smaller ranges to avoid huge results
        const multMax = Math.min(Math.floor(maxNum / 2), 12);
        const multMin = Math.max(Math.floor(minNum / 2), 1);
        a = getRandomInRange(multMin, multMax);
        b = getRandomInRange(multMin, multMax);
        answer = a * b;
        break;
      }
      case '/': {
        // For division, ensure clean integer division results
        const divMax = Math.min(Math.floor(maxNum / 2), 10);
        const divMin = Math.max(Math.floor(minNum / 2), 1);
        b = getRandomInRange(divMin, divMax);
        answer = getRandomInRange(divMin, divMax);
        a = b * answer; // This ensures clean division
        break;
      }
      default:
        a = 1;
        b = 1;
        answer = 2;
    }

    return {
      expression: `${a} ${operator} ${b}`,
      answer
    };
  }, [difficulty, difficultyLabel]);

  const createRaindrop = useCallback(() => {
    if (!containerRef.current || gameOver) return;

    const { expression, answer } = generateExpression();
    const containerWidth = containerRef.current.offsetWidth;
    const dropWidth = 100; // Approximate width of a raindrop

    const newDrop: Raindrop = {
      id: Date.now().toString() + Math.random(),
      expression,
      answer,
      x: Math.random() * (containerWidth - dropWidth),
      y: -40,
      speed: 0.7,
      created: Date.now()
    };

    setExpressions(prev => [...prev, newDrop]);
  }, [generateExpression, gameOver]);

  const checkAnswer = useCallback(() => {
    const userAnswer = parseInt(input);
    if (isNaN(userAnswer)) return;

    setExpressions(prev => {
      const matched = prev.filter(drop => drop.answer === userAnswer);

      if (matched.length > 0) {
        const newScore = score + matched.length;
        setScore(newScore);
        // Track score per selected starting difficulty (e.g. mathdrops-easy)
        updateScore(`mathdrops-${difficultyLabel}`, newScore);

        // Increase difficulty every 5 points
        if (newScore > 0 && newScore % 5 === 0) {
          setDifficulty(d => d + 1);
        }

        return prev.filter(drop => drop.answer !== userAnswer);
      }

      return prev;
    });

    setInput('');
  }, [input, score, updateScore, difficultyLabel]);

  const handleNumberPad = useCallback((value: string) => {
    if (value === 'C') {
      setInput('');
    } else if (value === '←') {
      setInput(prev => prev.slice(0, -1));
    } else if (value === '✓') {
      checkAnswer();
    } else if (value === '-' && input === '') {
      setInput('-');
    } else if (value !== '-') {
      setInput(prev => prev + value);
    }
  }, [checkAnswer, input]);

  // Keyboard support: map number keys (and Enter/Backspace) to the same actions as the on-screen number pad
  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      // Only act when the game is active (no rules overlay or game over)
      if (showRules || gameOver) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberPad(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNumberPad('✓');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleNumberPad('C');
      }
    };

    window.addEventListener('keydown', keyListener);
    return () => {
      window.removeEventListener('keydown', keyListener);
    };
    // Dependencies: we need the latest references to showRules, gameOver, and handleNumberPad
  }, [showRules, gameOver, handleNumberPad]);

  const handleRulesStart = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      setRulesShown('mathdrops', true);
    }
    setShowRules(false);
  };

  const resetGame = () => {
    setExpressions([]);
    setHealth(3);
    setScore(0);
    setInput('');
    setGameOver(false);
    setDifficulty(1);
    // Reset current score for the currently selected difficulty
    resetCurrentScore(`mathdrops-${difficultyLabel}`);
  };

  // Initialize game on mount or when rules are dismissed
  useEffect(() => {
    if (!hasSeenRules('mathdrops') && !showRules) {
      setShowRules(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver || showRules) return;

    const scoreKey = `mathdrops-${difficultyLabel}`;

    const gameLoop = () => {
      if (!containerRef.current) return;

      const containerHeight = containerRef.current.offsetHeight;

      setExpressions(prev => {
        const updated = prev.map(drop => ({
          ...drop,
          y: drop.y + drop.speed
        }));

        const missed = updated.filter(drop => drop.y > containerHeight);

        if (missed.length > 0) {
          const newHealth = Math.max(0, health - missed.length);
          setHealth(newHealth);

          if (newHealth === 0) {
            setGameOver(true);
            // Save final score under the selected tier
            updateScore(scoreKey, score);
          }
        }

        return updated.filter(drop => drop.y <= containerHeight);
      });
    };

    gameLoopRef.current = requestAnimationFrame(function animate() {
      gameLoop();
      gameLoopRef.current = requestAnimationFrame(animate);
    });

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameOver, health, score, updateScore, showRules, difficultyLabel]);

  // Drop creation interval
  useEffect(() => {
    if (gameOver || showRules) return;

    const interval = 2500; // Keep constant interval between drops
    dropIntervalRef.current = window.setInterval(createRaindrop, interval);

    return () => {
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
      }
    };
  }, [createRaindrop, gameOver, showRules]);

  const scoreKey = `mathdrops-${difficultyLabel}`;

  if (gameOver) {
    return <GameEnd gameName={scoreKey} onPlayAgain={resetGame} difficultyLabel={difficultyLabel} />;
  }

  if (showRules) {
    return (
      <RulesPopup
        title="Mathdrops"
        rules="Math expressions fall from the top. Calculate and enter the answer to clear them. Expressions that reach the bottom cost 1 health. Game over at 0 health! 🎮"
        onStart={handleRulesStart}
      />
    );
  }


  return (
    <div className="mathdrops-game">
      <div className="game-header">
        <div className="health">
          {[...Array(3)].map((_, i) => (
            <span key={i} className={`heart ${i >= health ? 'heart--empty' : ''}`}>
              ❤️
            </span>
          ))}
        </div>

        <div className="score">Score: {score}</div>
      </div>

      <div className="mathdrops-container" ref={containerRef}>
        {expressions.map(drop => {
          const containerHeight = containerRef.current?.offsetHeight || 600;
          const fallProgress = Math.min(drop.y / containerHeight, 1); // 0 to 1
          const scale = 1 + fallProgress * 0.15; // Grows slightly as it falls
          const opacity = fallProgress > 0.8 ? 1 - (fallProgress - 0.8) * 5 : 1; // Fade at bottom

          return (
            <div
              key={drop.id}
              className="raindrop"
              style={{
                left: `${drop.x}px`,
                top: `${drop.y}px`,
                transform: `scale(${scale})`,
                opacity,
                '--fall-progress': `${fallProgress}`
              } as React.CSSProperties}
            >
              {drop.expression}
            </div>
          );
        })}
      </div>

      <div className="game-controls">
        <div className="answer-display">
          <span className="answer-value">{input || '?'}</span>
        </div>

        <div className="number-pad">
          <button className="pad-button" onClick={() => handleNumberPad('7')}>7</button>
          <button className="pad-button" onClick={() => handleNumberPad('8')}>8</button>
          <button className="pad-button" onClick={() => handleNumberPad('9')}>9</button>
          <button className="pad-button" onClick={() => handleNumberPad('4')}>4</button>
          <button className="pad-button" onClick={() => handleNumberPad('5')}>5</button>
          <button className="pad-button" onClick={() => handleNumberPad('6')}>6</button>
          <button className="pad-button" onClick={() => handleNumberPad('1')}>1</button>
          <button className="pad-button" onClick={() => handleNumberPad('2')}>2</button>
          <button className="pad-button" onClick={() => handleNumberPad('3')}>3</button>
          <button className="pad-button pad-button--clear" onClick={() => handleNumberPad('C')}>C</button>
          <button className="pad-button" onClick={() => handleNumberPad('0')}>0</button>
          {/* <button className="pad-button pad-button--function" onClick={() => handleNumberPad('←')}>←</button> */}
          {/* <button className="pad-button pad-button--clear" onClick={() => handleNumberPad('C')}>C</button> */}
          <button className="pad-button pad-button--submit" onClick={() => handleNumberPad('✓')} disabled={!input}>✓</button>
        </div>
      </div>
    </div>
  );
};

export default Mathdrops;
