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

export const onShowConfetti = () => {
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

export const isInEvent = (event) => getQuery("e") === event;

export const isEventAdmin = (event, eid) => {
  if (isInEvent(event)) return GAME_CONFIG.ADMIN.includes(eid);
  return true;
};

export const isReachLimit = (event, eid, count) => {
  if (!isInEvent(event)) return false;
  if (isEventAdmin(event, eid)) return false;
  return count >= GAME_CONFIG.LIMIT;
}

export const isHacker = (count) => count > GAME_CONFIG.CHEAT;