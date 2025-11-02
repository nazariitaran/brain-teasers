import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameScore {
  current: number;
  highest: number;
}

interface GameStore {
  scores: Record<string, GameScore>;
  rulesShown: Record<string, boolean>;
  selectedDifficulties: Record<string, 'easy' | 'medium' | 'hard'>;
  updateScore: (game: string, score: number) => void;
  getCurrentScore: (game: string) => GameScore;
  resetCurrentScore: (game: string) => void;
  setRulesShown: (game: string, shown: boolean) => void;
  hasSeenRules: (game: string) => boolean;
  setSelectedDifficulty: (game: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  getSelectedDifficulty: (game: string) => 'easy' | 'medium' | 'hard';
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      scores: {},
      rulesShown: {},
  selectedDifficulties: {},
      
      updateScore: (game, score) => set((state) => {
        const currentScores = state.scores[game] || { current: 0, highest: 0 };
        return {
          scores: {
            ...state.scores,
            [game]: {
              current: score,
              highest: Math.max(score, currentScores.highest)
            }
          }
        };
      }),
      
      getCurrentScore: (game) => {
        const scores = get().scores;
        return scores[game] || { current: 0, highest: 0 };
      },
      
      resetCurrentScore: (game) => set((state) => {
        const currentScores = state.scores[game] || { current: 0, highest: 0 };
        return {
          scores: {
            ...state.scores,
            [game]: {
              current: 0,
              highest: currentScores.highest
            }
          }
        };
      }),
      
      setRulesShown: (game, shown) => set((state) => ({
        rulesShown: {
          ...state.rulesShown,
          [game]: shown
        }
      })),
      
      // Persist selected difficulty tier per game (e.g. 'easy' | 'medium' | 'hard')
      setSelectedDifficulty: (game: string, difficulty: 'easy' | 'medium' | 'hard') => set((state: GameStore) => ({
        selectedDifficulties: {
          ...state.selectedDifficulties,
          [game]: difficulty
        }
      })),
      getSelectedDifficulty: (game: string) => {
        const s = get().selectedDifficulties as Record<string, 'easy'|'medium'|'hard'>;
        return s[game] || 'easy';
      },
      
      hasSeenRules: (game) => {
        const rulesShown = get().rulesShown;
        return rulesShown[game] || false;
      }
    }),
    {
      name: 'memory-games-storage'
    }
  )
);