export const GAME_MODE = {
  SINGLE: 1,
  MULTI: 2,
};

export const GAME_LEVEL = {
  EASY: 1,
  HARD: 2,
};

export const GAME_CONFIG = {
  BOARD_LENGTH: 100,
  LEVEL: GAME_LEVEL.HARD,
  ADMIN: ["80277", "06192"],
  LIMIT: 2,
  CHEAT: 50,
  CONFETTI: {
    duration: 10 * 1000,
    options: { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 },
  },
};

export const COOKIES = {
  NAME: "__n__",
  UID: "__u__",
  MODE: "__m__",
  EID: "__e__",
  CODE: "__c__",
};
