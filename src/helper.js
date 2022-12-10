import Toastify from "toastify-js";

import { COOKIES, GAME_CONFIG } from "./const";
import { getQuery } from "./util";

export const loadInfo = () => {
  return {
    userName: localStorage.getItem(COOKIES.NAME),
    uid: localStorage.getItem(COOKIES.UID),
    mode: localStorage.getItem(COOKIES.MODE),
    eid: localStorage.getItem(COOKIES.EID),
    code: localStorage.getItem(COOKIES.CODE),
  };
};

export const saveInfo = ({ userName, uid, mode, eid, code }) => {
  userName && localStorage.setItem(COOKIES.NAME, userName);
  uid && localStorage.setItem(COOKIES.UID, uid);
  mode && localStorage.setItem(COOKIES.MODE, mode);
  eid && localStorage.setItem(COOKIES.EID, eid);
  code && localStorage.setItem(COOKIES.CODE, code);
};

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

export const onShowConfetti = () => {
  const { duration, options } = GAME_CONFIG.CONFETTI;
  let animationEnd = Date.now() + duration;

  const interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();
  
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
  
    var particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti(Object.assign({}, options, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, options, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
};

export const onShowNotify = (text, options = {}) => {
  return Toastify({
    text,
    duration: 5000,
    position: "left",
    close: true,
    ...options,
  }).showToast();
};

export const onToggleLoading = (show = true) => {
  const $loading = document.getElementById("pulse_wrapper");
  if (show) {
    $loading.style.visibility = "visible";
  } else {
    $loading.style.visibility = "hidden";
  }
};

export const isInEvent = (event) => getQuery("e") === event;

export const isEventAdmin = (event, eid) => {
  if (isInEvent(event)) return GAME_CONFIG.ADMIN.includes(eid);
  return true;
};

export const isReachLimit = (event, eid, count) => {
  if (!isInEvent(event)) return false;
  if (isEventAdmin(event, eid)) return false;
  return count >= GAME_CONFIG.LIMIT;
};

export const isHacker = (count) => count > GAME_CONFIG.CHEAT;
