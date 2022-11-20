import _shuffle from "lodash/shuffle";

import { GAME_CONFIG, GAME_LEVEL } from "./const";
import { isHacker } from "./helper";
import { onPlayGameSound } from "./sound";
import { emit, getRandomString, isAutoClick, toTimerString } from "./util";

const $myBoard = document.getElementById("my_board_grid");
const $opponentBoard = document.getElementById("opponents_board_grid");

const $headerInfo = document.getElementById("game_header_info");

let boards = null;
let currentNumber = 1;
let currentTimer = 0;
let cheatCount = 0;
let timer = null;
let clickTimer = 0;

const rowClass = ["r", "o", "w"].join("");
const cellClass = ["c", "e", "l", "l"].join("");
const fakeClass = getRandomString();

export const onInitBoard = (opponent = false) => {
  const $board = opponent ? $opponentBoard : $myBoard;
  let $row;
  for (let i = 0; i < GAME_CONFIG.BOARD_LENGTH; i++) {
    if (i % 10 === 0) {
      $row = document.createElement("div");
      $row.className = rowClass;
      $board.appendChild($row);
    }
    onAddCell($row, i, opponent);
    if ((i + 1) % 10 !== 0 && !opponent) onAddFakeCell($row, i);
  }
};

const onAddCell = ($row, number, opponent) => {
  const $cell = document.createElement("canvas");
  if (!opponent) {
    $cell.onclick = (e) => {
      if (isHacker(cheatCount)) {
        clearInterval(timer);
        emit("board:onhacker");
        return;
      }
      const now = new Date().getTime();
      if (now - clickTimer < 100) cheatCount++;
      clickTimer = now;
      if (isAutoClick(e)) {
        cheatCount++;
      } else {
        const className = e.target.className;
        const clickNumber = parseInt(className.substring(className.length - 2));
        if (boards && boards[clickNumber] === currentNumber) {
          onPlayGameSound();

          currentNumber += 1;
          const $canvas = e.target;
          const ctx = $canvas.getContext("2d");
          ctx.clearRect(0, 0, $canvas.width, $canvas.height);

          if (currentNumber > GAME_CONFIG.BOARD_LENGTH) {
            clearInterval(timer);
            emit("board:onwin", { second: currentTimer });
          } else {
            $headerInfo.innerHTML = `number: <a>${currentNumber}</a> - timer: <a>${toTimerString(
              currentTimer
            )}</a>`;
            onRandomBoard(currentNumber - 1);
          }
        } else {
          cheatCount++;
        }
      }
    };
  }
  $cell.className = `${cellClass} ${getRandomString()} cell-${
    number > 9 ? number : "0" + number
  }`;
  $row.appendChild($cell);
};

const onAddFakeCell = ($row, number) => {
  const $cell = document.createElement("canvas");
  $cell.onclick = (e) => {
    clearInterval(timer);
    emit("board:onhacker");
  };
  $cell.className = `${cellClass} ${fakeClass} c-${
    number > 9 ? number : "0" + number
  }`;
  $cell.style.display = "none";
  $row.appendChild($cell);
};

export const onGenerateBoard = (array, shuffle = false, opponent = false) => {
  const $board = opponent ? $opponentBoard : $myBoard;
  const arrays = shuffle ? _shuffle(array) : array;
  const length = arrays.length;
  const $cells = $board.querySelectorAll(`.${cellClass}:not(.${fakeClass})`);
  for (let i = 0; i < length; i++) {
    const $canvas = $cells[i];
    if (arrays[i]) {
      const icon = require(`./assets/${arrays[i]}.png`);
      $canvas.style.visibility = "visible";
      const ctx = $canvas.getContext("2d");
      const img = new Image();
      img.src = icon;
      img.onload = () => {
        ctx.clearRect(0, 0, $canvas.width, $canvas.height);
        ctx.drawImage(img, 0, 0, $canvas.width, $canvas.height);
      };
    } else {
      const ctx = $canvas.getContext("2d");
      ctx.clearRect(0, 0, $canvas.width, $canvas.height);
    }
  }
  if (!opponent) boards = arrays;
};

const onRandomBoard = (number) => {
  if (GAME_CONFIG.LEVEL === GAME_LEVEL.HARD) {
    const index = boards.findIndex((v) => v === number);
    boards[index] = 0;
    onGenerateBoard(boards, true);
  }
};

export const onResetInfo = () => {
  currentNumber = 1;
  currentTimer = 0;
  cheatCount = 0;
  $headerInfo.innerHTML = "number: <a>1</a> - timer: <a>00:00</a>";
  clearInterval(timer);
  timer = setInterval(() => {
    currentTimer += 1;
    $headerInfo.innerHTML = `number: <a>${currentNumber}</a> - timer: <a>${toTimerString(
      currentTimer
    )}</a>`;
  }, 1000);
};
