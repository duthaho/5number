import _shuffle from "lodash/shuffle";
import _range from "lodash/range";
import _random from "lodash/random";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

initializeApp({
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
});

const db = getFirestore();
const gameMode = {
  easy: "Easy",
  hard: "Hard",
};
const boardConfig = {
  [gameMode.easy]: process.env.NUMBER_EASY,
  [gameMode.hard]: process.env.NUMBER_HARD,
};
const boardRef = {
  [gameMode.easy]: collection(db, boardConfig[gameMode.easy]),
  [gameMode.hard]: collection(db, boardConfig[gameMode.hard]),
};

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
];
const boardLength = 100;
let currentNumber = 1;
let timer = null;
let currentTimer = 0;
let boards = null;
const ckName = "__n__";
let userName = localStorage.getItem(ckName);
const ckUid = "__u__";
let uid = localStorage.getItem(ckUid);
const ckMode = "__m__";
let mode = localStorage.getItem(ckMode) || gameMode.easy;
const $loading = document.getElementById("pulse-wrapper");
const $board = document.querySelector(".grid-container");
const $timer = document.querySelector(".timer-container");
const $current = document.querySelector(".number-container");
const $leaderboard = document.querySelector(".leaderboard-container");
const $sidebar = document.querySelector(".side-column");
const correctSound = new Audio("./assets/correct.wav");
const bgSound = new Audio();
let sound = true;
let unsubscribe = null;
let inGame = false;

bgSound.addEventListener(
  "ended",
  function () {
    this.currentTime = 0;
    this.play();
  },
  false
);

const initBoard = () => {
  let $row;
  for (let i = 0; i < boardLength; i++) {
    if (i % 10 === 0) {
      $row = document.createElement("div");
      $row.className = "grid-row";
      $board.appendChild($row);
    }
    const $cell = document.createElement("div");
    $cell.onclick = (e) => {
      if (e.isTrusted) {
        const className = e.target.className;
        const clickNumber = parseInt(className.substring(className.length - 2));
        if (boards && boards[clickNumber] === currentNumber) {
          correctSound.pause();
          correctSound.currentTime = 0;
          correctSound.play();
          currentNumber += 1;
          e.target.style.visibility = "hidden";
          if (currentNumber > boardLength) {
            clearInterval(timer);
            onWin();
          } else {
            $current.innerText = currentNumber;
            randomBoard(currentNumber - 1);
          }
        }
      }
    };
    $cell.className = `grid-cell cell-${i > 9 ? i : "0" + i}`;
    $row.appendChild($cell);
  }
};

const generateBoard = (array) => {
  boards = _shuffle(array);
  const length = boards.length;
  const $cells = document.querySelectorAll(".grid-cell");
  for (let i = 0; i < length; i++) {
    if (boards[i]) {
      $cells[i].style.visibility = "visible";
      const icon = require(`./assets/${boards[i]}.png`);
      $cells[i].style["background-image"] = `url(${icon})`;
    } else {
      $cells[i].style.visibility = "hidden";
    }
  }
};

const randomBoard = (number) => {
  if (mode === gameMode.hard) {
    const index = boards.findIndex((v) => v === number);
    boards[index] = 0;
    generateBoard(boards);
  }
};

const resetBoard = () => {
  const $cells = document.querySelectorAll(".grid-cell");
  for (let i = 0; i < boardLength; i++) {
    $cells[i].style.visibility = "visible";
  }
};

const showConfetti = () => {
  const colors = ["#8b5642", "#6a696b"];
  confetti({
    particleCount: 200,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: colors,
  });
  confetti({
    particleCount: 200,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: colors,
  });
};

const updateScore = async () => {
  try {
    await addDoc(boardRef[mode], {
      name: userName,
      second: currentTimer,
      uid,
    });
  } catch (e) {}
};

const resetConfig = () => {
  currentNumber = 1;
  currentTimer = 0;
  $timer.innerText = "00:00";
  $current.innerText = currentNumber;
  clearInterval(timer);
  timer = setInterval(function () {
    currentTimer += 1;
    $timer.innerText = toTimerStr();
  }, 1000);
};

const toTimerStr = (time) => {
  time = time || currentTimer;
  let second = time % 60;
  second = second > 9 ? second : "0" + second;
  let min = Math.floor(time / 60);
  min = min > 9 ? min : "0" + min;
  return min + ":" + second;
};

const loadLeaderboard = (items) => {
  let first = 0,
    second = 30;
  const currentIndex = items.findIndex((v) => v.uid === uid);
  if (currentIndex >= 30) {
    first = currentIndex - 15;
    second = currentIndex + 15;
  }
  if (first < 0) first = 0;
  if (second > items.length) second = items.length;
  $leaderboard.innerHTML = "";
  for (let i = first; i < second; i++) {
    const data = items[i];
    const $item = document.createElement("div");
    $item.className = "item";
    if (data.uid === uid) {
      $item.classList.add("me");
    }

    const $pos = document.createElement("div");
    $pos.innerText = i + 1;
    $pos.className = "pos";
    $item.appendChild($pos);

    const $name = document.createElement("div");
    $name.innerText = data.name;
    $name.className = "name";
    $item.appendChild($name);

    const $score = document.createElement("div");
    $score.innerText = toTimerStr(data.second);
    $score.className = "score";
    $item.appendChild($score);

    $leaderboard.appendChild($item);
  }
};

const onLoadScore = async (ref) => {
  try {
    unsubscribe && unsubscribe();
    const q = await query(ref, orderBy("second"));
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      loadLeaderboard(items);
      $loading.style.visibility = "hidden";
    });
  } catch {
    $loading.style.visibility = "hidden";
  }
};

const checkName = () => {
  if (!uid) {
    uid = uuidv4();
  }
  while (!userName) {
    userName = prompt("Please enter your name");
  }
  localStorage.setItem(ckName, userName);
  localStorage.setItem(ckUid, uid);
};

const playSound = () => {
  if (sound) {
    bgSound.pause();
    bgSound.src = `./assets/${bgSounds[_random(bgSounds.length - 1)]}`;
    bgSound.play();
  }
};

const toggleSidebar = (forceShow = false) => {
  const className = $sidebar.className;
  if (className.includes("show")) {
    !forceShow && $sidebar.classList.remove("show");
  } else {
    $sidebar.classList.add("show");
  }
};

const toggleSound = (e) => {
  sound = !sound;
  if (sound) {
    inGame && playSound();
  } else {
    bgSound.pause();
  }
  const path = sound ? "./assets/sound.png" : "./assets/mute.png";
  e.target.style["background-image"] = `url(${path})`;
};

const toggleMode = (e) => {
  mode = mode === gameMode.easy ? gameMode.hard : gameMode.easy;
  e.target.innerText = mode;
  localStorage.setItem(ckMode, mode);

  onLoadScore(boardRef[mode]);

  inGame && onStart();
};

const onStart = () => {
  checkName();
  playSound();
  generateBoard(_range(1, boardLength + 1));
  resetConfig();

  inGame = true;
};

const onWin = () => {
  showConfetti();
  resetBoard();
  updateScore();

  inGame = false;

  setTimeout(() => toggleSidebar(true), 1000);
};

window.onload = () => {
  initBoard();

  onLoadScore(boardRef[mode]);

  const $play = document.querySelector(".restart-button");
  $play.onclick = (e) => onStart();

  const $ldb = document.querySelector(".ldb-button");
  $ldb.onclick = (e) => toggleSidebar();

  const $close = document.querySelector(".close-button");
  $close.onclick = (e) => toggleSidebar();

  const $sound = document.querySelector(".sound-button");
  $sound.onclick = (e) => toggleSound(e);

  const $mode = document.querySelector(".mode-button");
  $mode.innerText = mode;
  $mode.onclick = (e) => toggleMode(e);

  document.addEventListener("keydown", () => false);

  document.addEventListener("contextmenu", (e) => e.preventDefault());
};

window.onbeforeunload = (e) => {
  bgSound.pause();
};
