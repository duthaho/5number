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
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import hotkeys from "hotkeys-js";
import { addListener, launch } from "devtools-detector";

import {
  initSound,
  toggleSound,
  playBgSound,
  playGameSound,
  playWinSound,
  pauseBgSound,
} from "./sound";
import { showConfetti } from "./animate";
import { getQuery, isAutoClick, randomString } from "./util";

initializeApp({
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
});

const isParadoxEvent = getQuery("e") === "prd";

const db = getFirestore();
const gameMode = {
  easy: "Easy",
  hard: "Hard",
};
const boardConfig = {
  [gameMode.easy]: process.env.NUMBER_EASY + (isParadoxEvent ? "-prd-1" : ""),
  [gameMode.hard]: process.env.NUMBER_HARD + (isParadoxEvent ? "-prd-1" : ""),
};
const boardRef = {
  [gameMode.easy]: collection(db, boardConfig[gameMode.easy]),
  [gameMode.hard]: collection(db, boardConfig[gameMode.hard]),
  employees: collection(db, "employees"),
};

let hacker = false;
const boardLength = 100;
let currentNumber = 1;
let timer = null;
let currentTimer = 0;
let clickTimer = 0;
let cheatCount = 0;
let playCount = 0;
let boards = null;
const ckName = "__n__";
let userName = localStorage.getItem(ckName);
const ckUid = "__u__";
let uid = localStorage.getItem(ckUid);
const ckMode = "__m__";
let mode = localStorage.getItem(ckMode) || gameMode.hard;
const ckEid = "__e__";
let eid = localStorage.getItem(ckEid);
const $loading = document.getElementById("pulse-wrapper");
const $board = document.querySelector(".grid-container");
const $timer = document.querySelector(".timer-container");
const $current = document.querySelector(".number-container");
const $leaderboard = document.querySelector(".leaderboard-container");
const $sidebar = document.querySelector(".side-column");
const gridRowClass = ["g", "r", "i", "d", "-", "r"].join("");
const gridCellClass = ["g", "r", "i", "d", "-", "c"].join("");
const fakeClass = randomString();
let unsubscribe = null;
let inGame = false;
const employees = {};
const admin_eid = ["80277", "06192"];

initSound();

hotkeys(
  "command+option+j,command+option+i,command+shift+c,command+option+c,command+option+k,command+option+z,command+option+e,command+option+s,command+s,ctrl+s,f12,ctrl+shift+i,ctrl+shift+j,ctrl+shift+c,ctrl+shift+k,ctrl+shift+e,shift+f7,shift+f5,shift+f9,shift+f12",
  function (event, handler) {
    event.preventDefault();
  }
);

// 1. add listener
addListener((isOpen) => {
  if (isOpen) {
    hacker = true;
    onHacker();
  } else {
    location.reload();
  }
});
// 2. launch detect
launch();

const initBoard = () => {
  let $row;
  for (let i = 0; i < boardLength; i++) {
    if (i % 10 === 0) {
      $row = document.createElement("div");
      $row.className = gridRowClass;
      $board.appendChild($row);
    }
    addCell($row, i);
    addFakeCell($row, i);
  }
};

const addCell = ($row, number) => {
  const $cell = document.createElement("canvas");
  $cell.onclick = (e) => {
    if (hacker) {
      return onHacker();
    }
    const now = new Date().getTime();
    if (now - clickTimer < 100) cheatCount++;
    hacker = cheatCount > 20;
    clickTimer = now;
    if (isAutoClick(e)) {
      cheatCount++;
    } else {
      const className = e.target.className;
      const clickNumber = parseInt(className.substring(className.length - 2));
      if (boards && boards[clickNumber] === currentNumber) {
        playGameSound();
        currentNumber += 1;
        e.target.style.visibility = "hidden";
        if (currentNumber > boardLength) {
          clearInterval(timer);
          onWin();
        } else {
          $current.innerText = currentNumber;
          randomBoard(currentNumber - 1);
        }
      } else {
        cheatCount++;
      }
    }
  };
  $cell.className = `${gridCellClass} ${randomString()} c-${
    number > 9 ? number : "0" + number
  }`;
  $row.appendChild($cell);
};

const addFakeCell = ($row, number) => {
  const $cell = document.createElement("canvas");
  $cell.onclick = (e) => {
    hacker = true;
  };
  $cell.className = `${gridCellClass} ${fakeClass} c-${
    number > 9 ? number : "0" + number
  }`;
  $cell.style.display = "none";
  $row.appendChild($cell);
};

const generateBoard = (array) => {
  boards = _shuffle(array);
  const length = boards.length;
  const $cells = document.querySelectorAll(
    `.${gridCellClass}:not(.${fakeClass})`
  );
  for (let i = 0; i < length; i++) {
    const $canvas = $cells[i];
    if (boards[i]) {
      const icon = require(`./assets/${boards[i]}.png`);
      $canvas.style.visibility = "visible";
      const ctx = $canvas.getContext("2d");
      const img = new Image();
      img.src = icon;
      img.onload = () => {
        ctx.clearRect(0, 0, $canvas.width, $canvas.height);
        ctx.drawImage(img, 0, 0, $canvas.width, $canvas.height);
      };
    } else {
      $canvas.style.visibility = "hidden";
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
  const $cells = document.querySelectorAll(
    `.${gridCellClass}:not(.${fakeClass})`
  );
  for (let i = 0; i < boardLength; i++) {
    $cells[i].style.visibility = "visible";
  }
};

const updateScore = async () => {
  try {
    await addDoc(boardRef[mode], {
      name: userName,
      second: currentTimer,
      timestamp: Timestamp.now(),
      uid,
      eid,
      hacker,
    });
  } catch (e) {
    console.log(e);
  }
};

const updateEmployees = () => {
  for (const [uid, name] of Object.entries(employees)) {
    try {
      addDoc(boardRef.employees, {
        uid,
        name,
      });
    } catch (e) {}
  }
};

const resetConfig = () => {
  currentNumber = 1;
  currentTimer = 0;
  $timer.innerText = "00:00";
  $current.innerText = currentNumber;
  clearInterval(timer);
  timer = setInterval(function () {
    hacker && onHacker();
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
  const currentIndex = items.findIndex((v) => v.eid === eid);
  playCount = items.filter((v) => v.eid === eid).length;
  if (currentIndex >= 30) {
    first = currentIndex - 15;
    second = currentIndex + 15;
  }
  if (isParadoxEvent && isAdmin()) {
    first = 0;
    second = 30;
  }
  if (first < 0) first = 0;
  if (second > items.length) second = items.length;
  $leaderboard.innerHTML = "";
  for (let i = first; i < second; i++) {
    const data = items[i];
    const $item = document.createElement("div");
    $item.className = "item";
    if (data.eid === eid) {
      $item.classList.add("me");
      userName = data.name;
      uid = data.uid;
      eid = data.eid;
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

const onLoadEmployees = async () => {
  try {
    const q = await query(boardRef.employees);
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      const data = doc.data();
      employees[data.uid] = data.name;
    });
  } catch (e) {}
};

const isAdmin = () => {
  if (isParadoxEvent) return admin_eid.includes(eid);

  return true;
};

const checkName = () => {
  if (!uid) {
    uid = uuidv4();
  }
  userName = isParadoxEvent ? employees[eid] : userName;
  while (!userName || !eid) {
    if (isParadoxEvent) {
      eid = prompt("Vui lòng nhập 5 số cuối CCCD");
      userName = employees[eid];
    } else {
      userName = prompt("Please enter your name");
      eid = eid || uid;
    }
  }
  localStorage.setItem(ckName, userName);
  localStorage.setItem(ckUid, uid);
  localStorage.setItem(ckEid, eid);
};

const isReachLimit = () => isParadoxEvent && playCount >= process.env.MAX_TIMES;

const toggleSidebar = (forceShow = false) => {
  const className = $sidebar.className;
  if (className.includes("show")) {
    !forceShow && $sidebar.classList.remove("show");
  } else {
    $sidebar.classList.add("show");
  }
};

const toggleMode = (e) => {
  mode = mode === gameMode.easy ? gameMode.hard : gameMode.easy;
  e.target.innerText = mode;
  localStorage.setItem(ckMode, mode);

  onLoadScore(boardRef[mode]);

  inGame && onStart();
};

const onStart = () => {
  hacker && onHacker();
  if (!isAdmin() && isReachLimit()) {
    alert("You already reach limit play times for this event!");
    return true;
  }
  checkName();
  playBgSound();
  generateBoard(_range(1, boardLength + 1));
  resetConfig();

  inGame = true;
};

const onWin = () => {
  playWinSound();
  showConfetti();
  resetBoard();
  updateScore();

  inGame = false;
  playCount += 1;

  if (isAdmin()) {
    setTimeout(() => toggleSidebar(true), 1000);
  }
};

const onHacker = () => {
  clearInterval();
  pauseBgSound();
  if (document.body != null) {
    document.body.parentNode.removeChild(document.body);
  }
  if (document.head != null) {
    document.head.parentNode.removeChild(document.head);
  }
};

window.onload = () => {
  initBoard();

  isParadoxEvent && onLoadEmployees();

  onLoadScore(boardRef[mode]);

  const $play = document.querySelector(".restart-button");
  $play.onclick = (e) => onStart();

  const $ldb = document.querySelector(".ldb-button");
  $ldb.onclick = (e) => isAdmin() && toggleSidebar();

  const $close = document.querySelector(".close-button");
  $close.onclick = (e) => isAdmin() && toggleSidebar();

  const $sound = document.querySelector(".sound-button");
  $sound.onclick = (e) => toggleSound(e, inGame);

  // const $mode = document.querySelector(".mode-button");
  // $mode.innerText = mode;
  // $mode.onclick = (e) => toggleMode(e);

  document.addEventListener("keydown", () => false);

  document.addEventListener("contextmenu", (e) => e.preventDefault());
};

window.onbeforeunload = (e) => {
  pauseBgSound();
};
