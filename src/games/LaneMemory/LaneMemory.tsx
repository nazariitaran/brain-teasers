import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameEnd from '../../components/GameEnd';
import RulesPopup from '../../components/RulesPopup';
import './LaneMemory.css';

interface Turn {
  lanes: ('left' | 'center' | 'right')[];
}

interface GameSequence {
  turns: Turn[];
}

type GamePhase = 'playing-sequence' | 'waiting-input' | 'validating' | 'turn-complete' | 'round-complete' | 'game-over';

const LaneMemory: React.FC = () => {
  const { getSelectedDifficulty } = useGameStore();
  const difficulty = getSelectedDifficulty('lane-memory');

  // Initial turns based on difficulty
  const initialTurns = {
    easy: 2,
    medium: 4,
    hard: 6
  }[difficulty];
  
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [sequence, setSequence] = useState<GameSequence | null>(null);
  const [playerInput, setPlayerInput] = useState<('left' | 'center' | 'right')[]>([]);
  const [phase, setPhase] = useState<GamePhase>('playing-sequence');
  const [activeLanes, setActiveLanes] = useState<('left' | 'center' | 'right')[]>([]);
  const [validationState, setValidationState] = useState<'correct' | 'incorrect' | null>(null);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [currentTurnClicks, setCurrentTurnClicks] = useState<('left' | 'center' | 'right')[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [wrongLane, setWrongLane] = useState<('left' | 'center' | 'right') | null>(null);

  const { updateScore, resetCurrentScore, hasSeenRules, setRulesShown } = useGameStore();

  const generateSequence = useCallback((roundNum: number): GameSequence => {
    // Start with different number of turns based on difficulty
    const initialTurns = {
      easy: 2,
      medium: 4,
      hard: 6
    }[difficulty];
    
    // Number of turns starts at initial value and increases by 1 each round
    const numTurns = initialTurns + (roundNum - 1);
    const turns: Turn[] = [];

    for (let i = 0; i < numTurns; i++) {
      const numLanes = Math.random() < 0.5 ? 1 : 2;
      const lanes: ('left' | 'center' | 'right')[] = [];
      const lanePool: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

      for (let j = 0; j < numLanes; j++) {
        const randomIndex = Math.floor(Math.random() * lanePool.length);
        lanes.push(lanePool[randomIndex]);
        lanePool.splice(randomIndex, 1);
      }

      turns.push({ lanes });
    }

    return { turns };
  }, [difficulty]);

  const playSequence = useCallback(async (seq: GameSequence) => {
    setPhase('playing-sequence');
    setActiveLanes([]);
    setWrongLane(null);
    setValidationState(null);

    const ACTIVATION_DURATION = 1000; // ms - highlight all lanes in turn
    const PAUSE_BETWEEN_TURNS = 800; // ms - pause between turns

    for (let turnIdx = 0; turnIdx < seq.turns.length; turnIdx++) {
      const turn = seq.turns[turnIdx];
      setCurrentTurnIdx(turnIdx);

      // Highlight all lanes in this turn simultaneously
      setActiveLanes(turn.lanes);
      await new Promise(resolve => setTimeout(resolve, ACTIVATION_DURATION));

      // Deactivate
      setActiveLanes([]);

      // Pause between turns (except after last turn)
      if (turnIdx < seq.turns.length - 1) {
        await new Promise(resolve => setTimeout(resolve, PAUSE_BETWEEN_TURNS));
      }
    }

    setCurrentTurnIdx(0);  // Reset to first turn for input phase
    setActiveLanes([]);  // Clear highlights before moving to input
    setPhase('waiting-input');
    setPlayerInput([]);
  }, []);


  const handleLaneClick = useCallback(
    (lane: 'left' | 'center' | 'right') => {
      if (phase !== 'waiting-input' || !sequence) return;

      // Check if this lane is in the current turn
      const currentTurn = sequence.turns[currentTurnIdx];
      if (!currentTurn.lanes.includes(lane)) {
        // Wrong lane - lose a life and show correct lanes
        setValidationState('incorrect');
        setWrongLane(lane);
        // Show correct lanes + wrong lane for feedback
        setActiveLanes([...currentTurn.lanes, lane]);
        setPhase('validating');
        const newLives = lives - 1;
        setLives(newLives);

        setTimeout(() => {
          if (newLives === 0) {
            setPhase('game-over');
            updateScore(`lane-memory-${difficulty}`, score);
          } else {
            // Retry the same round
            setPlayerInput([]);
            setCurrentTurnIdx(0);
            setCurrentTurnClicks([]);
            setValidationState(null);
            setWrongLane(null);
            playSequence(sequence);
          }
        }, 2000); // Increased timeout to show feedback longer
        return;
      }

      // Correct lane for this turn - add to both trackers
      const newInput = [...playerInput, lane];
      setPlayerInput(newInput);
      
      const newTurnClicks = [...currentTurnClicks, lane];
      setCurrentTurnClicks(newTurnClicks);

      // Keep all clicked lanes in this turn highlighted
      setValidationState('correct');
      setActiveLanes(newTurnClicks);

      // Check if all lanes for this turn are clicked (all unique lanes must appear at least once)
      const lanesInTurn = new Set(currentTurn.lanes);
      const uniqueClicksThisTurn = new Set(newTurnClicks.filter(clickedLane => lanesInTurn.has(clickedLane)));

      // If all unique lanes for this turn are clicked, show turn complete
      if (uniqueClicksThisTurn.size === currentTurn.lanes.length) {
        setPhase('turn-complete');
        
        const nextTurnIdx = currentTurnIdx + 1;
        const isLastTurn = nextTurnIdx >= sequence.turns.length;
        
        setTimeout(() => {
          setActiveLanes([]);
          setValidationState(null);
          setWrongLane(null);
          if (isLastTurn) {
            // Round complete!
            setPhase('round-complete');
            setTimeout(() => {
              // Award points for completing the round
              const pointsEarned = 1; // 1 point per round
              const newScore = score + pointsEarned;
              setScore(newScore);
              updateScore(`lane-memory-${difficulty}`, newScore);
              
              setRound(round + 1);
              const newSeq = generateSequence(round + 1);
              setSequence(newSeq);
              setCurrentTurnIdx(0);
              setCurrentTurnClicks([]);
              playSequence(newSeq);
            }, 1200);
          } else {
            // Move to next turn
            setCurrentTurnIdx(nextTurnIdx);
            setCurrentTurnClicks([]);
            setPhase('waiting-input');
          }
        }, 800);
      }
    },
    [phase, sequence, playerInput, lives, round, currentTurnIdx, currentTurnClicks, playSequence, generateSequence, updateScore]
  );

  const handleRulesStart = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      setRulesShown('lane-memory', true);
    }
    setShowRules(false);
    
    // Initialize game after rules close
    const initialSeq = generateSequence(1);
    setSequence(initialSeq);
  };

  const resetGame = () => {
    setRound(1);
    setLives(3);
    setScore(0);
    setSequence(null);
    setPlayerInput([]);
    setActiveLanes([]);
    setCurrentTurnIdx(0);
    setCurrentTurnClicks([]);
    setWrongLane(null);
    resetCurrentScore(`lane-memory-${difficulty}`);
    setPhase('playing-sequence');

    const initialSeq = generateSequence(1);
    setSequence(initialSeq);
  };

  // Initialize game on mount
  useEffect(() => {
    if (!hasSeenRules('lane-memory')) {
      setShowRules(true);
    } else {
      if (sequence === null) {
        const initialSeq = generateSequence(1);
        setSequence(initialSeq);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play sequence when it's ready
  useEffect(() => {
    if (sequence && phase === 'playing-sequence') {
      playSequence(sequence);
    }
  }, [sequence, phase, playSequence]);

  if (phase === 'game-over') {
    return (
      <GameEnd 
        gameName={`lane-memory-${difficulty}`}
        onPlayAgain={resetGame}
        difficultyLabel={`${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`}
      />
    );
  }

  if (showRules) {
    return (
      <RulesPopup
        title="Lane Memory"
        rules="Watch the 3 lanes light up in a sequence. Then tap the lanes in the same order! Each round the sequence gets longer. Get 3 wrong and it's game over. 🎮"
        onStart={handleRulesStart}
      />
    );
  }

  return (
    <div className="lane-memory-game">
      <div className="game-header">
        <div className="lives">
          {[...Array(3)].map((_, i) => (
            <span key={i} className={`life ${i >= lives ? 'life--empty' : ''}`}>
              ❤️
            </span>
          ))}
        </div>

        <div className="game-info">
          <div className="score">Score: {score}</div>
          {/* <div className="round">Round {round}</div> */}
        </div>
      </div>

      <div className="instruction-panel">
        {phase === 'playing-sequence' && (
          <div className="instruction-text">
            <div className="instruction-title">Watch the sequence</div>
            <div className="instruction-subtitle">Pay attention to which lanes light up</div>
          </div>
        )}
        {phase === 'waiting-input' && (
          <div className="instruction-text">
            <div className="instruction-title">Your turn!</div>
            <div className="instruction-subtitle">Tap all lanes that lit up for this turn</div>
          </div>
        )}
        {phase === 'validating' && (
          <div className="instruction-text">
            <div className="instruction-title">❌ Wrong!</div>
            <div className="instruction-subtitle">You lost a life. Try again...</div>
          </div>
        )}
        {phase === 'turn-complete' && (
          <div className="instruction-text">
            <div className="instruction-title">✓ Turn Complete!</div>
            <div className="instruction-subtitle">Ready for next turn...</div>
          </div>
        )}
        {phase === 'round-complete' && (
          <div className="instruction-text">
            <div className="instruction-title">🎉 Round Complete!</div>
            <div className="instruction-subtitle">Next round coming up...</div>
          </div>
        )}
      </div>

      <div className="lanes-container">
        {(['left', 'center', 'right'] as const).map((lane) => {
          const getLaneClassName = () => {
            if (!activeLanes.includes(lane)) return 'lane';
            
            let className = 'lane lane--active';
            
            // During incorrect feedback, distinguish between wrong and correct lanes
            if (validationState === 'incorrect') {
              if (wrongLane === lane) {
                className += ' lane--incorrect';
              } else if (sequence?.turns[currentTurnIdx]?.lanes.includes(lane)) {
                className += ' lane--correct';
              }
            } else {
              className += ` lane--${validationState || ''}`;
            }
            
            return className;
          };

          return (
            <button
              key={lane}
              className={getLaneClassName()}
              onClick={() => handleLaneClick(lane)}
              disabled={phase !== 'waiting-input'}
              aria-label={`${lane} lane`}
            />
          );
        })}
      </div>

      <div className="turn-indicator">
        <div className="turn-text">Turn {currentTurnIdx + 1} of {sequence?.turns.length}</div>
        <div className="turn-progress">
          {sequence?.turns.map((_, idx) => (
            <div
              key={idx}
              className={`progress-dot ${
                idx < currentTurnIdx ? 'progress-dot--completed' : ''
              } ${idx === currentTurnIdx ? 'progress-dot--current' : ''}`}
            />
          ))}
        </div>
      </div>

      {phase === 'round-complete' && (
        <div className="feedback feedback--correct">
          ✅ Correct!
        </div>
      )}
      {phase === 'validating' && (
        <div className="feedback feedback--incorrect">
          ❌ Wrong!
        </div>
      )}
    </div>
  );
};

export default LaneMemory;
