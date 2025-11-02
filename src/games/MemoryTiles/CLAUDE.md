# Memory Tiles Game

## Game Overview
A visual memory game where players must remember and identify highlighted tiles in a grid. Tiles are briefly shown in gold, then players must tap all the tiles that were highlighted to progress through increasingly difficult rounds.

## Game Mechanics

### Core Gameplay
- Grid of tiles displayed (size based on difficulty)
- Random tiles are highlighted in gold for 3.5 seconds (memorization phase)
- After timer expires, all tiles return to normal appearance
- Player must tap all tiles that were previously highlighted
- Correct taps turn tiles green
- Wrong taps turn tiles red and cost 1 health point
- Round completes when all target tiles are found
- Game ends when health reaches 0 (starts with 3 health)

### Difficulty System
#### Starting Grid Size
- **Easy**: 3x3 grid (9 tiles)
- **Medium**: 4x4 grid (16 tiles)
- **Hard**: 5x5 grid (25 tiles)

#### Grid Expansion
- Every 3 rounds, grid grows by adding either a row or column
- Maximum grid size varies by difficulty:
  - Easy: Up to 5x5 grid
  - Medium: Up to 6x6 grid
  - Hard: Up to 7x7 grid
- Alternates between adding rows and columns when cols ≤ rows

#### High Score Tracking
- High scores are tracked separately for each difficulty level
- Score keys follow pattern: `memory-tiles-{difficulty}`
- Each difficulty level has its own independent high score
- **Target tiles per cycle**: Within each 3-round expansion cycle:
  - First round: 30% of tiles are targets
  - Second round: 35% of tiles are targets
  - Third round: 40% of tiles are targets
- **Calculation**: `Math.min(Math.floor(totalTiles * percentage) + 1, totalTiles - 1)`
- **Alternating growth**: Adds columns when cols ≤ rows, otherwise adds rows

### Game Phases
```typescript
type GamePhase = 'showing' | 'playing' | 'feedback' | 'nextRound';

'showing':   Tiles are highlighted, timer countdown visible
'playing':   Player can tap tiles to select them
'feedback':  Shows "Correct!" or "Wrong!" message
'nextRound': Brief transition before next round starts
```

## UI Components

### Game Header
- **Health Display**: 3 hearts (❤️) that gray out when lost
- **Score Counter**: Current score display
- **Round Counter**: Shows current round number

### Game Area
- **Grid Container**: Responsive grid that maintains square tiles
  - Size determined by difficulty and expansion rules
- **Phase Indicator**: "Memorize!" text with countdown timer bar (3.5s)
- **Feedback Messages**: 
  - ✅ Correct! (green background)
  - ❌ Wrong! (red background)
- **Hint Text**: "Tap the tiles that were highlighted!"
- **Difficulty Label**: Shows current difficulty on game over screen

### Tile States
- **Normal**: Semi-transparent with subtle border
- **Target** (showing phase): Golden gradient with glowing animation
- **Clicked + Correct**: Green gradient with bounce animation
- **Clicked + Wrong**: Red gradient with shake animation

## State Management

### Component State
```typescript
const [tiles, setTiles] = useState<Tile[]>([]);        // Grid tiles
const [gridSize, setGridSize] = useState({             // Grid dimensions
  rows: 3, cols: 3
});
const [health, setHealth] = useState(3);               // Player health
const [score, setScore] = useState(0);                 // Current score
const [round, setRound] = useState(1);                 // Current round
const [gameOver, setGameOver] = useState(false);       // Game state
const [phase, setPhase] = useState<GamePhase>('showing'); // Current phase
const [feedback, setFeedback] = useState<              // Feedback message
  'correct' | 'incorrect' | null
>(null);
```

### Tile Interface
```typescript
interface Tile {
  id: number;        // Unique identifier
  isTarget: boolean; // Should be clicked
  isClicked: boolean; // Has been clicked
  isWrong: boolean;  // Was wrong choice
}
```

### Zustand Integration
- Updates global score on successful rounds using difficulty-specific keys
- Saves high score automatically to localStorage per difficulty level
- Resets current score on new game start for current difficulty only
- Manages difficulty selection persistence across sessions
- Implements consistent difficulty UI pattern with Mathdrops game

## Technical Implementation

### Timing System
- **Memorization phase**: 
  - 3 seconds for grids up to 5x5
  - 3.5 seconds for grids larger than 5x5
- **Feedback display**: 2 seconds (feedbackDuration)
- **Round transition**: 300ms delay
- Uses `setTimeout` for phase transitions
- Cleanup on unmount to prevent memory leaks

### Grid Generation
```typescript
// Determine position within 3-round cycle (1, 2, or 3)
const cyclePosition = ((currentRound - 1) % 3) + 1;

// Calculate target percentage based on cycle position
// First round of cycle: 30%, second: 35%, third: 40%
const percentages = [0.30, 0.35, 0.40];
const targetPercentage = percentages[cyclePosition - 1];

// Calculate target count (percentage of tiles + 1, capped at total - 1)
const targetCount = Math.min(
  Math.floor(totalTiles * targetPercentage) + 1, 
  totalTiles - 1
);

// Randomly select target tiles
const targetIndices = new Set<number>();
while (targetIndices.size < targetCount) {
  targetIndices.add(Math.floor(Math.random() * totalTiles));
}
```

### Error Handling
- Prevents clicking during wrong phase
- Properly shows all targets when mistake is made
- Clears tiles between rounds to prevent visual bugs
- Handles final mistake before game over correctly

### Mobile Optimizations
- No system keyboard required (tap-only interaction)
- Grid scales to fit viewport: `width: calc(min(85vw, 65vh))`
- Touch-friendly tile sizes with `aspect-ratio: 1/1`
- Responsive gap sizing with `clamp()`
- Safe area support for iOS devices
- Prevented text selection during gameplay

## Styling Details

### Color Scheme
- Background: Purple gradient (#667eea → #764ba2)
- Target tiles: Gold gradient (#FFD700 → #FFA500)
- Correct tiles: Green gradient (#4CAF50 → #8BC34A)
- Wrong tiles: Red gradient (#f44336 → #e91e63)
- UI Elements: Glassmorphism with backdrop blur

### Animations
```css
/* Glowing effect for target tiles */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8); }
}

/* Bounce for correct tiles */
@keyframes correct-bounce {
  0%, 100% { transform: scale(0.9); }
  50% { transform: scale(1.05); }
}

/* Shake for wrong tiles */
@keyframes wrong-shake {
  0%, 100% { transform: translateX(0) scale(0.9); }
  25% { transform: translateX(-5px) scale(0.9); }
  75% { transform: translateX(5px) scale(0.9); }
}
```

### Responsive Design
- Mobile-first approach
- Grid adapts to screen size while maintaining aspect ratio
- Larger touch targets on tablets (min-height adjusts)
- Landscape mode optimizations

## Scoring System

- **Points per round**: 1 point for completing each round
- **No penalty for time**: Focus on accuracy
- **High score**: Automatically saved and persisted

## Game Flow

1. **Initialize**: Create grid, select random target tiles
2. **Show phase**: Display targets for 3 seconds with timer
3. **Play phase**: Accept player input, validate selections
4. **Feedback phase**: Show result for 2 seconds
   - If correct: Award points, proceed to next round
   - If wrong: Lose 1 health, show all targets, retry same round
5. **Next round**: Clear grid, potentially increase size, repeat

## Future Improvements

Potential enhancements to consider:
1. **Pattern Mode**: Instead of random, show patterns to memorize
2. **Speed Mode**: Reduce memorization time as difficulty increases
3. **Color Mode**: Multiple colors to remember instead of single color
4. **Sequential Mode**: Remember the order tiles were shown
5. **Multiplayer**: Compete against others in real-time
6. **Power-ups**: 
   - Extra time to memorize
   - Reveal one tile hint
   - Undo last wrong click
7. **Themes**: Different visual themes and tile designs
8. **Sound Effects**: Audio feedback for actions
9. **Statistics**: Track accuracy rate, average time, streaks
10. **Daily Challenges**: Special puzzles with leaderboards

## Code Quality Notes

### Performance
- Immutable state updates using map and spread operator
- useCallback for stable function references
- Efficient tile matching with filter
- Minimal re-renders through proper dependencies

### Maintainability
- Clear phase-based state machine
- Separated concerns (UI, logic, styling)
- Consistent naming conventions
- Well-documented game flow

### Accessibility Considerations
- High contrast colors for visibility
- Large touch targets (minimum 50px)
- Clear visual feedback for all actions
- No reliance on color alone (shapes/animations also indicate state)

### Browser Compatibility
- Works on all modern browsers
- iOS Safari specific fixes (viewport, safe areas)
- Android Chrome tested
- No external dependencies beyond React ecosystem