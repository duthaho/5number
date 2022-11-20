import { v4 as uuidv4 } from "uuid";
import _range from "lodash/range";
import _random from "lodash/random";
import hotkeys from "hotkeys-js";
import { addListener, launch } from "devtools-detector";

import { GAME_CONFIG, GAME_MODE } from "./const";
import {
  isEventAdmin,
  isInEvent,
  isReachLimit,
  loadInfo,
  onShowConfetti,
  saveInfo,
} from "./helper";
import { onGenerateBoard, onInitBoard, onResetInfo } from "./board";
import { onFirstMessage, onMessage } from "./bot";
import {
  onInitSound,
  onPlayBgSound,
  onPlayWinSound,
  onToggleSound,
} from "./sound";
import { onLoadEmployees, onLoadScore, onUpdateScore } from "./fb";
import { toTimerString } from "./util";

let { userName, uid, mode: gameMode, eid, code } = loadInfo();
let inGame = false;
let hacker = false;
let employees = {};
let playCount = 0;

const $loading = document.getElementById("pulse_wrapper");

const $singleModeBtn = document.getElementById("single_mode_btn");
const $singleModeName = document.getElementById("single_mode_name");

const $multiModeBtn = document.getElementById("multi_mode_btn");
const $multiModeName = document.getElementById("multi_mode_name");

const $homeIndex = document.getElementById("home_index");
const $gameShow = document.getElementById("game_show");

const $gamePlayBtn = document.getElementById("game_play_btn");
const $leaderboardBtn = document.getElementById("game_leaderboard_btn");
const $soundBtn = document.getElementById("game_sound_btn");

const $myBoardContainer = document.getElementById("my_board_container");
const $opponentBoardContainer = document.getElementById(
  "opponents_board_container"
);
const $leaderboardContainer = document.getElementById("leaderboard_container");
const $leaderboardItems = document.getElementById("leaderboard_items");

const $messageList = document.getElementById("message_list");
const $messageInput = document.getElementById("message_input");

hotkeys(
  "command+option+j,command+option+i,command+shift+c,command+option+c,command+option+k,command+option+z,command+option+e,command+option+s,command+s,ctrl+s,f12,ctrl+shift+i,ctrl+shift+j,ctrl+shift+c,ctrl+shift+k,ctrl+shift+e,shift+f7,shift+f5,shift+f9,shift+f12",
  function (event, handler) {
    event.preventDefault();
  }
);

// 1. add listener
addListener((isOpen) => {
  if (isOpen) {
    onDetectHacker();
  } else {
    location.reload();
  }
});
// 2. launch detect
launch();

const onLoadGame = async () => {
  if (userName || eid) {
    $singleModeName.value = isInEvent("prd") ? eid : userName;
  }

  if (isInEvent("prd")) {
    employees = await onLoadEmployees();
  }

  onInitSound();

  $loading.style.visibility = "hidden";
};

const onSelectMode = (mode) => {
  onFirstMessage($messageList);

  gameMode = mode;
  saveInfo({ mode });

  $homeIndex.classList.toggle("hidden");
  $gameShow.classList.toggle("hidden");

  if (
    gameMode === GAME_MODE.SINGLE &&
    !$opponentBoardContainer.classList.contains("hidden")
  ) {
    $opponentBoardContainer.classList.add("hidden");
  }

  onInitBoard();

  gameMode === GAME_MODE.MULTI && onInitBoard(true);

  onLoadScore(onLoadLeaderboard);
};

const onPlay = () => {
  if (isReachLimit("prd", eid, playCount)) {
    alert("You already reach limit play times for this event!");
    return;
  }

  onGenerateBoard(_range(1, GAME_CONFIG.BOARD_LENGTH + 1), true);

  if (gameMode === GAME_MODE.MULTI) {
    onGenerateBoard(_range(1, GAME_CONFIG.BOARD_LENGTH + 1), false, true);
  }

  onPlayBgSound();

  onResetInfo();

  inGame = true;
};

const onLoadLeaderboard = (items) => {
  let first = 0,
    second = 30;
  playCount = items.filter((v) => v.eid === eid).length;
  const currentIndex = items.findIndex((v) => v.eid === eid);
  if (currentIndex >= 30) {
    first = currentIndex - 15;
    second = currentIndex + 15;
  }
  if (first < 0) first = 0;
  if (second > items.length) second = items.length;

  if (!isEventAdmin("prd", eid)) return;

  $leaderboardItems.innerHTML = "";
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
    $score.innerText = toTimerString(data.second);
    $score.className = "score";
    $item.appendChild($score);

    $leaderboardItems.appendChild($item);
  }
};

const onToggleScore = (forceShow = false) => {
  const className = $leaderboardContainer.className;
  if (className.includes("show")) {
    !forceShow && $leaderboardContainer.classList.remove("show");
  } else {
    $leaderboardContainer.classList.add("show");
  }
};

const onGameWin = ({ detail }) => {
  playCount++;
  inGame = false;

  if (isEventAdmin("prd", eid)) {
    playCount = 1;
  }

  onUpdateScore({
    ...detail,
    name: userName,
    eid,
    uid,
    hacker,
    count: playCount,
  });
  onPlayWinSound();
  onShowConfetti();

  isEventAdmin("prd", eid) && onToggleScore(true);
};

const onKeyDown = (e) => {
  if (e.key === "Enter" || e.keyCode === 13) {
    const message = e.target.value;
    if (e.target.value) {
      $messageList.insertAdjacentHTML(
        "beforeend",
        `<li class="mine"><span>${message}</span></li>`
      );
      e.target.value = "";
      onMessage(message, $messageList);
    }
  }
};

const isValidName = () => {
  userName = $singleModeName.value.trim();
  if (isInEvent("prd")) {
    eid = userName;
    userName = employees[eid];
  }
  if (userName) {
    if (!uid) uid = uuidv4();
    if (!eid) eid = uid;
    saveInfo({ userName, uid, eid });
    return true;
  }
};

const isValidCode = () => {
  return false;
};

const onDetectHacker = () => {
  hacker = true;
  if (document.body != null) {
    document.body.parentNode.removeChild(document.body);
  }
  if (document.head != null) {
    document.head.parentNode.removeChild(document.head);
  }
};

window.onload = () => {
  if (hacker) return;

  onLoadGame();

  $singleModeBtn.onclick = (e) =>
    isValidName() && onSelectMode(GAME_MODE.SINGLE);
  $multiModeBtn.onclick = (e) => isValidCode() && onSelectMode(GAME_MODE.MULTI);

  $gamePlayBtn.onclick = (e) => onPlay();
  $leaderboardBtn.onclick = (e) => isEventAdmin("prd", eid) && onToggleScore();
  $soundBtn.onclick = (e) => onToggleSound(inGame);

  const $closeBtn = document.querySelector(".close-button");
  $closeBtn.onclick = (e) => onToggleScore();

  $messageInput.onkeydown = (e) => onKeyDown(e);

  window.addEventListener("board:onwin", onGameWin);
  window.addEventListener("board:onhacker", onDetectHacker);

  document.addEventListener("keydown", () => false);
  document.addEventListener("contextmenu", (e) => e.preventDefault());
};
