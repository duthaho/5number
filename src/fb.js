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
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { GAME_CONFIG, GAME_LEVEL } from "./const";
import { employees } from "./employees";
import { isInEvent, onToggleLoading } from "./helper";
import { getRandomString } from "./util";

initializeApp({
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
});

const db = getFirestore();

const boardConfig = {
  [GAME_LEVEL.EASY]:
    process.env.NUMBER_EASY + (isInEvent("prd") ? "-prd-1" : ""),
  [GAME_LEVEL.HARD]:
    process.env.NUMBER_HARD + (isInEvent("prd") ? "-prd-1" : ""),
};
const boardRef = {
  [GAME_LEVEL.EASY]: collection(db, boardConfig[GAME_LEVEL.EASY]),
  [GAME_LEVEL.HARD]: collection(db, boardConfig[GAME_LEVEL.HARD]),
};

let scoreSubscribe = null;
let codeSubscribe = null;

export const onUpdateScore = async (data) => {
  try {
    data.timestamp = Timestamp.now();

    await addDoc(boardRef[GAME_CONFIG.LEVEL], data);
  } catch (e) {}
};

export const onUpdateEmployees = () => {
  for (const [uid, name] of Object.entries(employees)) {
    try {
      const employeesRef = collection(db, "employees");
      addDoc(employeesRef, {
        uid,
        name,
      });
    } catch (e) {}
  }
};

export const onLoadScore = async (cb) => {
  try {
    scoreSubscribe && scoreSubscribe();
    const q = await query(boardRef[GAME_CONFIG.LEVEL], orderBy("second"));
    scoreSubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      cb && cb(items);
    });
  } catch {}
};

export const onLoadEmployees = async () => {
  const employees = {};
  onToggleLoading();
  try {
    const employeesRef = collection(db, "employees");
    const q = await query(employeesRef);
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      const data = doc.data();
      employees[data.uid] = data.name;
    });
  } catch (e) {}
  onToggleLoading(false);
  return employees;
};

export const onCheckCode = async (code, data, cb) => {
  onToggleLoading();
  let valid = false;
  let message = "The game does not exist!";
  const gameCode = code || getRandomString(6);

  try {
    const codeRef = doc(db, "codes", gameCode);

    if (!code) {
      await setDoc(codeRef, {
        [data.eid]: data,
        host: data.eid,
        guess: "",
        winner: "",
      });

      valid = true;
    } else {
      const codeSnap = await getDoc(codeRef);

      if (codeSnap.exists()) {
        const snapshot = codeSnap.data();

        if (snapshot.winner) {
          message = `The game was ended by winner: ${snapshot.winner}`;
        } else if (
          snapshot.host &&
          snapshot.guess &&
          snapshot.host !== data.eid &&
          snapshot.guess !== data.eid
        ) {
          message = "The game is full!";
        } else {
          valid = true;
        }
        if (valid && !snapshot.guess && snapshot.host !== data.eid) {
          await updateDoc(codeRef, {
            [data.eid]: data,
            guess: data.eid,
          });
        }
      }
    }

    if (valid) {
      codeSubscribe = onSnapshot(codeRef, (doc) => {
        cb && cb(doc.data());
      });
    }
  } catch (e) {}
  onToggleLoading(false);
  return { valid, code: gameCode, message };
};

export const onUpdateBoards = async (code, eid, data, eidData = {}) => {
  try {
    const codeRef = doc(db, "codes", code);
    for (const [key, value] of Object.entries(eidData)) {
      data[`${eid}.${key}`] = value;
    }
    await updateDoc(codeRef, data);
  } catch (e) {}
};

export const onCleanResources = () => {
  scoreSubscribe && scoreSubscribe();
  codeSubscribe && codeSubscribe();
};
