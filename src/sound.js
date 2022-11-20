import _random from "lodash/random";

const bgSounds = [
  "b1.mp3",
  "b2.mp3",
  "b3.mp3",
  "b4.mp3",
  "b5.mp3",
  "b6.mp3",
  "b7.mp3",
  "b8.mp3",
  "b9.mp3",
  "b10.mp3",
  "b11.mp3",
  "b12.mp3",
  "b13.mp3",
  "b14.mp3",
  "b15.mp3",
];

let bgSound;
let correctSound;
let winSound;
let muted = false;

export const onInitSound = () => {
  correctSound = new Audio("./assets/correct.mp3");
  winSound = new Audio("./assets/win.mp3");
  bgSound = new Audio();
  bgSound.addEventListener(
    "ended",
    function () {
      this.currentTime = 0;
      this.play();
    },
    false
  );
};

export const onToggleSound = (inGame) => {
  muted = !muted;
  if (muted) {
    bgSound.pause();
  } else {
    inGame && onPlayBgSound();
  }
};

export const onPlayBgSound = () => {
  if (!muted) {
    bgSound.pause();
    bgSound.src = `./assets/${bgSounds[_random(bgSounds.length - 1)]}`;
    bgSound.play();
  }
};

export const onPauseBgSound = () => bgSound.pause();

export const onPlayGameSound = () => {
  correctSound.pause();
  correctSound.currentTime = 0;
  correctSound.play();
};

export const onPlayWinSound = () => {
  winSound.pause();
  winSound.currentTime = 0;
  winSound.play();
};
