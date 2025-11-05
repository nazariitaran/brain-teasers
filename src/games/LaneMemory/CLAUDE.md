# Lane Memory Game

## Overview
A memory game where players watch and reproduce sequences of lane activations. Players must click the correct lanes in the order they were shown. The game has 3 lives total - one miss costs a life. Game ends when all lives are lost.

## Game Mechanics

### Core Concept
- **3 Lanes**: Vertical lanes that light up in sequences
- **Sequence Display Phase**: Game automatically shows the pattern (yellow highlight)
- **Replay Phase**: Player recreates the pattern by clicking lanes (green for correct, red for incorrect)
- **Multitouch Support**: When multiple lanes light up simultaneously, players can tap them all at once
- **Progressive Difficulty**: Each round adds one turn to remember

### Difficulty System
#### Starting Difficulty
- **Easy**: Starts with 2 turns
- **Medium**: Starts with 4 turns
- **High**: Starts with 6 turns

#### Round Progression
- Each subsequent round adds 1 turn to the sequence
- Every turn can have 1-2 random lanes
- Game continues until all 3 lives are lost

#### High Score Tracking
- High scores are tracked separately for each difficulty level
- Score keys follow pattern: `lane-memory-{difficulty}`
- Each difficulty level has its own independent high score

### Game States
1. **playing-sequence**: Automatically showing the sequence
2. **waiting-input**: Waiting for player input
3. **turn-complete**: Player successfully completed a turn
4. **validating**: Checking input (shows error feedback if wrong)
5. **round-complete**: All turns completed successfully
6. **game-over**: All lives lost

## Game Flow

### Per Round
1. Generate sequence with N turns (each turn has 1-2 random lanes)
2. Display sequence automatically (lanes highlight for 1s each, 0.8s pause between turns)
3. Enter replay phase - player clicks lanes
4. For each turn:
   - Player clicks lanes (any order within the turn, can tap multiple simultaneously)
   - Multitouch: When multiple lanes are required, players can tap them all at once
   - Clicked lanes stay highlighted (yellow during sequence, green when correct, red when incorrect)
   - Once all lanes for turn are clicked correctly → show "✓ Turn Complete!" and move to next turn
5. Once all turns complete → show "✅ Correct!" popup and proceed to next round
6. If player clicks wrong lane → lose a life, show "❌ Wrong!" popup, retry same round

### Scoring
- **Points per round**: 1 point for completing each round
- **Highest score**: Persisted to localStorage

## File Structure
```
src/games/LaneMemory/
├── LaneMemory.tsx      # Game component and logic
├── LaneMemory.css      # Styling
└── CLAUDE.md          # This documentation
```

## Key Components

### State Management
- `round`: Current round number (difficulty indicator)
- `lives`: Remaining lives (0-3)
- `sequence`: Current sequence of turns and lanes
- `phase`: Current game phase
- `activeLanes`: Lanes currently highlighted
- `validationState`: 'correct' | 'incorrect' | null (for lane color feedback)
- `currentTurnIdx`: Which turn player is on
- `currentTurnClicks`: Lanes clicked in current turn
- `activeTouches`: Set of lanes currently being touched (for multitouch)

### Functions
- `generateSequence(roundNum)`: Creates random sequence with N turns
- `playSequence(seq)`: Animates sequence display
- `processLaneInput(lanes[])`: Processes multiple lane inputs simultaneously
- `handleLaneClick(lane)`: Single lane click handler (calls processLaneInput)
- `handleLanesTouchStart(lane, event)`: Touch start handler for multitouch
- `handleLanesTouchEnd(event)`: Touch end handler that processes all active touches
- `resetGame()`: Resets all state for new game

## Styling

### Colors (Matching Memory Tiles)
- **Yellow** (#FFD700 → #FFA500): Initial sequence display
- **Green** (#4CAF50 → #8BC34A): Correct clicks
- **Red** (#f44336 → #e91e63): Incorrect clicks
- **White**: Default lane color

### Animations
- **laneGlow**: Subtle animation for sequence display
- **feedback-appear**: Scale + fade for feedback popups
- **pulse**: Pulsing animation for turn progress indicators

### Layout
- Mobile-first design with safe area support
- 3 lanes displayed vertically with equal spacing
- Instruction panel at top with phase information
- Turn progress dots at bottom showing current turn

## Timing
- Sequence activation duration: 1000ms (1 second)
- Pause between activations (within turn): N/A (all lanes in turn light up together)
- Pause between turns: 800ms
- Turn complete feedback display: 800ms before moving to next turn
- Wrong feedback display: 1000ms before allowing retry
- Round complete feedback display: 1200ms before loading next round

## UI Elements

### Instruction Panel
- **Watch the sequence**: During playback
- **Your turn!**: When waiting for input (shows "you can tap multiple at once!" when multiple lanes are required)
- **❌ Wrong!**: On incorrect click
- **✓ Turn Complete!**: When turn is successfully completed
- **🎉 Round Complete!**: When round is successfully completed (also shows in center popup)

### Lives Display
- 3 heart emojis (❤️) at top left
- Faded/grayscale when empty

### Round/Turn Tracking
- Current round number at top right
- Turn progress dots at bottom (unfilled → current/filled → completed)

### Feedback Popups
- Large centered overlay with emoji + text
- Green background for success (✅ Correct!)
- Red background for failure (❌ Wrong!)
- Smooth scale animation on appear/disappear

## Data Flow

```
generateSequence()
    ↓
playSequence() → displays sequence automatically
    ↓
waiting-input phase → player clicks lanes
    ↓
handleLaneClick()
    ├─ Validate lane is correct for turn
    ├─ Update activeLanes (show clicked lane in green)
    ├─ Check if all lanes for turn clicked
    ├─ If complete: show turn-complete message
    │  └─ Move to next turn or round-complete
    └─ If wrong: show validating (red), lose life, retry or game-over
```

## localStorage
Game uses Zustand with persist middleware to store:
- Current score (current round reached)
- Highest score
- Key: `lane-memory`

## Notable Implementation Details

1. **Turn-based validation**: Player can click lanes in any order within a turn, as long as all required lanes are clicked
2. **Multitouch support**: Uses touch events to detect simultaneous taps on multiple lanes
3. **Touch event handling**: `onTouchStart` tracks active touches, `onTouchEnd` processes all simultaneous touches
4. **Immediate feedback**: Lanes stay highlighted as player clicks them (green for correct)
5. **No time limit**: Players can take as long as needed to complete turns - only correctness matters
6. **Sequential progression**: Difficulty increases linearly (Round 1 = 2 turns, Round N = N+1 turns)
7. **Persistent highlighting**: During a turn, all previously clicked lanes remain highlighted until turn completes

## Future Enhancement Ideas

- Add sound effects for correct/incorrect clicks
- Add difficulty settings (varying sequence speeds)
- Add leaderboard/high score tracking
- Add replay feature to watch past sequences
- Add pause functionality during gameplay
- Add haptic feedback on mobile
