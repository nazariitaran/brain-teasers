# Memory Games Project

## Project Overview
A mobile-first web application featuring various memory and cognitive games. Built with React, TypeScript, Vite, and Zustand for state management. All data is stored locally using browser's localStorage.

## Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand with persist middleware
- **Styling**: Pure CSS with mobile-first approach
- **Storage**: Browser localStorage (no backend)

## Project Structure
```
memory-games/
├── src/
│   ├── components/        # Shared components
│   │   ├── GameMenu.tsx   # Main menu for game selection
│   │   ├── GameEnd.tsx    # Reusable game over screen
│   │   ├── RulesPopup.tsx # Game rules display popup
│   │   └── EndGamePopup.tsx # End game confirmation dialog
│   ├── games/             # Individual game implementations
│   │   ├── Mathdrops/     # Math expression game
│   │   ├── MemoryTiles/   # Memory tile matching game
│   │   └── LaneMemory/    # Lane sequence memory game
│   ├── store/             # Zustand state management
│   │   └── gameStore.ts   # Global game state and scores
│   ├── styles/            # Component-specific styles
│   ├── App.tsx            # Main app component with routing
│   ├── App.css            # Global app styles
│   └── index.css          # Base styles and resets
└── index.html             # HTML entry point with viewport config
```

## Design Principles

### Mobile-First Development
- **Primary Target**: iPhone and mobile devices
- **Viewport**: Uses `viewport-fit=cover` and `100dvh` for proper mobile display
- **Touch Interaction**: All interactions optimized for touch
- **No System Keyboard**: Games use custom on-screen controls to avoid keyboard issues
- **Safe Areas**: Respects iOS safe areas (notch, home indicator)

### Game Flow Pattern
All games follow this consistent pattern:
1. **Menu Selection**: User selects game from main menu
2. **Rules Display**: Optional rules popup (can be disabled with "Don't show again")
3. **Gameplay**: Core game mechanics specific to each game
   - **End Game Option**: Players can click the End Game button (⏹️) in the header to voluntarily end the game
   - **Confirmation Dialog**: Shows popup asking to "End Game" or "Continue Playing"
4. **Game End**: Shows current score and highest score
5. **Options**: Play again or return to menu

Note: Some games expose a starting Difficulty selection directly in the main menu. For example, `Mathdrops` replaces its game tile with three difficulty buttons (Easy / Medium / Hard) when tapped — the user picks a difficulty and the game starts with that starting difficulty. The selected starting difficulty is persisted to the store and used to compute expression magnitudes; in-game numeric progression remains unchanged.

### State Management
- **Zustand Store**: Centralized state for current game and scores
- **Local Persistence**: Scores automatically saved to localStorage
- **Score Tracking**: Each game tracks current and highest score

## Adding New Games

### Step 1: Create Game Component
Create a new folder in `src/games/YourGame/` with:
- `YourGame.tsx` - Main game component
- `YourGame.css` - Game-specific styles

### Step 2: Game Component Structure
```typescript
import EndGamePopup from '../../components/EndGamePopup';
import RulesPopup from '../../components/RulesPopup';

const YourGame: React.FC = () => {
  // Game state
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [showEndGamePopup, setShowEndGamePopup] = useState(false);
  
  // Zustand hooks
  const { updateScore, resetCurrentScore, hasSeenRules, setRulesShown } = useGameStore();
  
  // End Game handlers
  const handleEndGameClick = () => setShowEndGamePopup(true);
  const handleConfirmEndGame = () => {
    setShowEndGamePopup(false);
    setGameOver(true);
    updateScore('yourgame', score);
  };
  const handleContinueGame = () => setShowEndGamePopup(false);
  
  // Game logic here
  
  if (gameOver) {
    return <GameEnd gameName="yourgame" onPlayAgain={resetGame} />;
  }
  
  if (showRules) {
    return (
      <RulesPopup
        title="Your Game"
        rules="Game rules description here"
        onStart={(dontShowAgain) => {
          if (dontShowAgain) setRulesShown('yourgame', true);
          setShowRules(false);
        }}
      />
    );
  }
  
  return (
    <div className="yourgame">
      {showEndGamePopup && (
        <EndGamePopup
          onEndGame={handleConfirmEndGame}
          onContinue={handleContinueGame}
        />
      )}
      <div className="game-header">
        <div className="health">{/* Health indicators */}</div>
        <div className="score">Score: {score}</div>
        <button className="end-game-button" onClick={handleEndGameClick} title="End Game">
          ⏹️
        </button>
      </div>
      {/* Rest of game UI */}
    </div>
  );
};
```

### Step 3: Update Game Store
Add your game type to `src/store/gameStore.ts`:
```typescript
export type GameType = 'raindrops' | 'yourgame' | null;
```

### Step 4: Add to App Router
Update `src/App.tsx` to include your game:
```typescript
case 'yourgame':
  return <YourGame />;
```

### Step 5: Add to Game Menu
Update `src/components/GameMenu.tsx`:
```typescript
const games = [
  // ... existing games
  {
    id: 'yourgame',
    name: 'Your Game',
    description: 'Game description',
    icon: '🎮'
  }
];
```

## CSS Guidelines

### Mobile-First Approach
```css
/* Base styles for mobile */
.element {
  font-size: 1rem;
  padding: 0.5rem;
}

/* Tablet and desktop enhancements */
@media (min-width: 768px) {
  .element {
    font-size: 1.2rem;
    padding: 1rem;
  }
}
```

### Common Patterns
- **Glassmorphism**: `background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);`
- **Gradients**: Use linear gradients for backgrounds and buttons
- **Animations**: Keep smooth with `transition: all 0.3s ease;`
- **Touch Feedback**: Use `:active` states with `transform: scale(0.95);`
- **End Game Button**: Circular button with red hover state for game termination

## End Game Feature

### Overview
All games include an End Game button (⏹️) in the header that allows players to voluntarily end a game at any time. When clicked, a confirmation dialog appears to prevent accidental termination.

### Components
- **EndGamePopup.tsx** - Confirmation dialog with two actions:
  - "Continue Playing" - Resumes the game
  - "End Game" - Saves current score and shows game end screen
- **EndGamePopup.css** - Glassmorphism styled modal with animations

### Implementation in Games
1. Import `EndGamePopup` component
2. Add state: `const [showEndGamePopup, setShowEndGamePopup] = useState(false);`
3. Add handlers:
   ```typescript
   const handleEndGameClick = () => setShowEndGamePopup(true);
   const handleConfirmEndGame = () => {
     setShowEndGamePopup(false);
     setGameOver(true);
     updateScore(`gameName-${difficulty}`, score);
   };
   ```
4. Include in game loops: Check `showEndGamePopup` in effect dependencies to pause game
5. Render button in header: `<button className="end-game-button" onClick={handleEndGameClick}>⏹️</button>`
6. Render popup: `{showEndGamePopup && <EndGamePopup onEndGame={handleConfirmEndGame} onContinue={handleContinueGame} />}`

### CSS Classes
- `.end-game-button` - Circular button (40px mobile, 50px desktop) with red hover state
- `.end-game-popup-overlay` - Full-screen semi-transparent backdrop
- `.end-game-popup` - Centered modal with glassmorphism effect

## Game-Specific Guidelines

### Custom Input Controls
Always use custom on-screen controls instead of system inputs:
```typescript
// DON'T: System keyboard input
<input type="number" />

// DO: Custom number pad
<div className="number-pad">
  <button onClick={() => handleInput('1')}>1</button>
  {/* etc */}
</div>
```

### Game Lifecycle Management
- **Game Loop Pausing**: Include `showEndGamePopup` in game loop conditions to pause when confirmation dialog appears
- **Score Recording**: Always save current score when game ends voluntarily or naturally
- **State Cleanup**: Clear timeouts, intervals, and animation frames in `useEffect` cleanup

### Performance Considerations
- Use `requestAnimationFrame` for smooth animations
- Clean up intervals and animations in `useEffect` cleanup
- Use `useCallback` for event handlers to prevent unnecessary re-renders
- Pause game loops when popups are shown to prevent background execution

### Difficulty Progression
- Start simple and gradually increase complexity
- Visual/audio feedback for player actions
- Clear indication of game state (health, score, etc.)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing on Mobile

1. Start dev server: `npm run dev`
2. Find your local IP: `ifconfig | grep inet`
3. On mobile device (same network): `http://[YOUR_IP]:5173`
4. For iOS: Can add to home screen for app-like experience

## Known Considerations

1. **iOS Viewport**: Uses `100dvh` to handle dynamic viewport height
2. **Touch Delays**: Removed with `-webkit-tap-highlight-color: transparent`
3. **Zoom Prevention**: Font size ≥16px on inputs, `maximum-scale=1.0` in viewport
4. **Safe Areas**: Handled with `env(safe-area-inset-*)`

## Future Enhancements

When adding new games, consider:
- Keeping consistent visual style (gradients, glassmorphism)
- Following the menu → game → end screen flow
- Using Zustand for score persistence
- Optimizing for portrait mobile orientation
- Testing on actual devices, not just browser DevTools