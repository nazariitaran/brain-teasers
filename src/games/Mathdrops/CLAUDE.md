# Mathdrops Game

## Game Overview
A mathematical game where expressions fall from the top of the screen. Players must quickly calculate and enter the answer to any visible expression to clear it before it reaches the bottom.

## Game Mechanics

### Core Gameplay
- Mathematical expressions (using +, -, *, /) fall from the top of the screen
- Player enters a number using the custom number pad
- If the answer matches any falling expression, that expression disappears
- Player earns 1 point per cleared expression
- If an expression reaches the bottom, player loses 1 health point
- Game ends when health reaches 0 (starts with 3 health)

### Difficulty System
- Difficulty increases every 50 points
- **Constant Speed**: Expressions always fall at speed 0.8
- **Constant Spawn Rate**: New expressions appear every 2.5 seconds
- **Progressive Complexity**: Both minimum and maximum number magnitudes increase with difficulty
  - Minimum starts at (base - 10) and increases with difficulty
  - Maximum starts at base and increases with difficulty
  - Both values are adjusted by +2 per difficulty level
  - Maximum capped at 50 to keep expressions manageable

### Starting Difficulty (Easy / Medium / Hard)
- The player selects a starting Difficulty from the main menu before a run: Easy, Medium or Hard.
- This selection is not shown in the in-game top bar (to keep the HUD uncluttered) — it is chosen on the Game Menu card for Mathdrops.
- The selected starting Difficulty sets the base magnitude used to generate expressions. Mapping:
  - Easy: base = 10
  - Medium: base = 15
  - Hard: base = 20
- Important: the in-game numeric progression (the component-local `difficulty` variable which increases during play) is unchanged. That internal `difficulty` still increments as the player scores (the code increases it by +1 every 5 points) and is combined with the starting base to compute expression ranges.

### Expression Generation
```typescript
// Base values depend on selected starting difficulty and in-game progression
const baseByDifficulty = difficultyLabel === 'easy' ? 10 : difficultyLabel === 'medium' ? 15 : 20;
const maxNum = Math.min(baseByDifficulty + difficulty * 2, 50);
const minNum = Math.max(baseByDifficulty - 10 + difficulty * 2, 1); // Starts 10 less than base

// Helper function for random integer generation (inclusive range)
const getRandomInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Operations have different constraints:
'+': Numbers from minNum to maxNum
'-': First number from (minNum + 5) to maxNum, second from minNum to (a-1) to ensure positive results
'×': Uses floor(minNum/2) to min(floor(maxNum/2), 12) to avoid huge results
'/': Generates divisor and quotient first to ensure clean integer division
```

#### Number Range Examples
For starting difficulty 'medium' (base = 15) at difficulty level 1:
- minNum = max(15 - 10 + 2, 1) = 7
- maxNum = min(15 + 2, 50) = 17

This gives expression ranges like:
- Addition: 7-17 + 7-17
- Subtraction: 12-17 - 7-16
- Multiplication: 3-8 × 3-8 (using halved ranges)
- Division: Generated to ensure clean division (e.g., 24 ÷ 6 = 4)

As the game progresses (difficulty increases), both minNum and maxNum scale up while maintaining these relative ranges.

## UI Components

### Game Header
- **Health Display**: 3 hearts (❤️) that gray out when lost
- **Score Counter**: Current score display
- **Pause Button**: Toggle game pause (⏸️/▶️)

### Game Area
- **Expressions Container**: Where math expressions fall
- **Visual Effects**: Subtle sway animation on falling expressions

### Input Controls
- **Answer Display**: Shows current input or "?" when empty
- **Number Pad**: 
  - Digits 0-9
  - Minus sign (−) for negative answers
  - Backspace (←) to delete last digit
  - Clear (C) to reset input
  - Submit (✓) to check answer

## State Management

### Component State
```typescript
const [expressions, setExpressions] = useState<Raindrop[]>([]);  // Active expressions
const [health, setHealth] = useState(3);                      // Player health
const [score, setScore] = useState(0);                        // Current score
const [input, setInput] = useState('');                       // Player input
const [gameOver, setGameOver] = useState(false);             // Game state
const [difficulty, setDifficulty] = useState(1);             // Difficulty level
const [isPaused, setIsPaused] = useState(false);            // Pause state
```

### Zustand Integration
- Updates global score on point gain
- Saves high score automatically
- Resets current score on new game

## Technical Implementation

### Animation Loop
Uses `requestAnimationFrame` for smooth 60fps animation:
```typescript
gameLoopRef.current = requestAnimationFrame(function animate() {
  gameLoop();  // Update positions and check collisions
  gameLoopRef.current = requestAnimationFrame(animate);
});
```

### Cleanup
Properly cleans up on unmount:
- Cancels animation frames
- Clears spawn intervals
- No memory leaks

### Mobile Optimizations
- No system keyboard (custom number pad)
- Touch-optimized button sizes (min 40px height)
- Prevented text selection during gameplay
- Responsive layout that works in portrait mode

## Styling Details

### Color Scheme
- Background: Blue gradient (#1e3c72 → #2a5298)
- Expressions: White with transparency
- UI Elements: Glassmorphism effect

### Responsive Design
- Mobile: Compact number pad, smaller text
- Tablet: Larger buttons and text
- Safe area support for iOS devices

## Future Improvements

Potential enhancements to consider:
1. **Power-ups**: Clear all expressions of a certain type
2. **Combo System**: Bonus points for quick successive answers
3. **Different Modes**: 
   - Time attack (solve X expressions in Y time)
   - Survival (increasing speed over time)
   - Practice (specific operation types)
4. **Visual Feedback**: Particle effects on correct answers
5. **Sound Effects**: Audio feedback for actions
6. **Achievements**: Unlock badges for milestones

## Code Quality Notes

### Performance
- Efficient expression matching using filter
- Batch state updates where possible
- No unnecessary re-renders (useCallback usage)

### Accessibility Considerations
- High contrast between text and backgrounds
- Large touch targets (40px+ on mobile)
- Clear visual feedback for all actions

### Browser Compatibility
- Works on all modern browsers
- iOS Safari specific fixes included
- Android Chrome tested