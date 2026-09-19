import type { ActionCardDefinition } from "./types/action-card";

export const ACTION_CARDS: Record<string, ActionCardDefinition> = {
  reveal_cell: {
    type: "reveal_cell",
    name: "Reveal Cell",
    description: "Automatically fills in the correct digit for a selected cell.",
    targetType: "cell",
    cooldown: 0,
    effectDuration: 0
  },
  freeze: {
    type: "freeze",
    name: "Freeze",
    description: "Freezes an opponent's board for 5 seconds.",
    targetType: "opponent",
    cooldown: 0,
    effectDuration: 5
  },
  bomb: {
    type: "bomb",
    name: "Bomb",
    description: "Erases 3 random correct cells from an opponent's board.",
    targetType: "opponent",
    cooldown: 0,
    effectDuration: 0
  },
  shield: {
    type: "shield",
    name: "Shield",
    description: "Blocks the next sabotage card targeted at you.",
    targetType: "self",
    cooldown: 0,
    effectDuration: 0 // Effect lasts until used
  }
};
