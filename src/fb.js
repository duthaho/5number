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
import { GAME_CONFIG, GAME_LEVEL } from "./const";
import { employees } from "./employees";
import { isInEvent } from "./helper";

initializeApp({
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
});

const db = getFirestore();

const boardConfig = {
  [GAME_LEVEL.EASY]: process.env.NUMBER_EASY + (isInEvent("prd") ? "-prd-1" : ""),
  [GAME_LEVEL.HARD]: process.env.NUMBER_HARD + (isInEvent("prd") ? "-prd-1" : ""),
};
const boardRef = {
  [GAME_LEVEL.EASY]: collection(db, boardConfig[GAME_LEVEL.EASY]),
  [GAME_LEVEL.HARD]: collection(db, boardConfig[GAME_LEVEL.HARD]),
};

let unsubscribe = null;

export const onUpdateScore = async (data) => {
  try {
    data.timestamp = Timestamp.now();

    await addDoc(boardRef[GAME_CONFIG.LEVEL], data);
  } catch (e) {
    console.log(e);
  }
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
    unsubscribe && unsubscribe();
    const q = await query(boardRef[GAME_CONFIG.LEVEL], orderBy("second"));
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      cb && cb(items);
    });
  } catch {
  }
};

export const onLoadEmployees = async () => {
  const employees = {};
  try {
    const employeesRef = collection(db, "employees");
    const q = await query(employeesRef);
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      const data = doc.data();
      employees[data.uid] = data.name;
    });
  } catch (e) {
  } finally {
    return employees;
  }
};
