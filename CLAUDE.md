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
│   │   └── GameEnd.tsx    # Reusable game over screen
│   ├── games/             # Individual game implementations
│   │   └── Raindrops/     # Math expression game
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
2. **Gameplay**: Core game mechanics specific to each game
3. **Game End**: Shows current score and highest score
4. **Options**: Play again or return to menu

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
const YourGame: React.FC = () => {
  // Game state
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  // Zustand hooks
  const { updateScore, resetCurrentScore } = useGameStore();
  
  // Game logic here
  
  if (gameOver) {
    return <GameEnd gameName="yourgame" onPlayAgain={resetGame} />;
  }
  
  return (
    <div className="yourgame">
      {/* Game UI */}
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

### Performance Considerations
- Use `requestAnimationFrame` for smooth animations
- Clean up intervals and animations in `useEffect` cleanup
- Use `useCallback` for event handlers to prevent unnecessary re-renders

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