export const getRandomText = (sub = false) => {
  // sub-string a long paragraph.
  if (sub) {
    const lorem = `If the family member doesn’t need hospitalization and can be cared for at home, you should help him or her with basic needs and monitor the symptoms, while also keeping as much distance as possible, according to guidelines issued by the C.D.C. If there’s space, the sick family member should stay in a separate room and use a separate bathroom. If masks are available, both the sick person and the caregiver should wear them when the caregiver enters the room. Make sure not to share any dishes or other household items and to regularly clean surfaces like counters, doorknobs, toilets and tables. Don’t forget to wash your hands frequently.`;
    const i1 = randomNumber(lorem.length, 6);
    const i2 = randomNumber(lorem.length, 6);
    const start = Math.min(i1, i2);
    const end = Math.min(i2, i1);
    return lorem.substr(start, end);
  }

  // make a sentences of random words
  let verbs, nouns, adjectives, adverbs, preposition;
  nouns = [
    "bird",
    "clock",
    "boy",
    "plastic",
    "duck",
    "teacher",
    "old lady",
    "professor",
    "hamster",
    "dog",
    "area",
    "book",
    "business",
    "case",
    "child",
    "company",
    "country",
    "day",
    "eye",
    "fact",
    "family",
    "government",
    "group",
    "hand",
    "home",
    "job",
    "life",
    "lot",
  ];
  verbs = [
    "kicked",
    "ran",
    "flew",
    "dodged",
    "sliced",
    "rolled",
    "died",
    "breathed",
    "slept",
    "killed",
    "ask",
    "be",
    "become",
    "begin",
    "call",
    "can",
    "come",
    "could",
    "do",
    "feel",
    "find",
    "get",
    "give",
    "go",
    "have",
    "hear",
    "help",
    "keep",
    "know",
  ];
  adjectives = [
    "beautiful",
    "lazy",
    "professional",
    "lovely",
    "dumb",
    "rough",
    "soft",
    "hot",
    "vibrating",
    "slimy",
    "important",
    "able",
    "bad",
    "best",
    "better",
    "big",
    "black",
    "certain",
    "clear",
    "different",
    "early",
    "easy",
    "economic",
    "federal",
    "free",
    "full",
    "good",
    "great",
    "hard",
    "high",
    "human",
  ];
  adverbs = [
    "slowly",
    "elegantly",
    "precisely",
    "quickly",
    "sadly",
    "humbly",
    "proudly",
    "shockingly",
    "calmly",
    "passionately",
  ];
  preposition = [
    "down",
    "into",
    "up",
    "on",
    "upon",
    "below",
    "above",
    "through",
    "across",
    "towards",
  ];

  const rand1 = Math.floor(Math.random() * 10);
  const rand2 = Math.floor(Math.random() * 10);
  const rand3 = Math.floor(Math.random() * 30);
  const rand4 = Math.floor(Math.random() * 30);
  const rand5 = Math.floor(Math.random() * 30);
  const rand6 = Math.floor(Math.random() * 30);
  return (
    "The " +
    adjectives[rand1] +
    " " +
    nouns[rand2] +
    " " +
    adverbs[rand1] +
    " " +
    verbs[rand4] +
    " because some " +
    nouns[rand1] +
    " " +
    adverbs[rand2] +
    " " +
    verbs[rand1] +
    " " +
    preposition[rand1] +
    " a " +
    adjectives[rand2] +
    " " +
    nouns[rand5] +
    " which, became a " +
    adjectives[rand3] +
    ", " +
    adjectives[rand4] +
    " " +
    nouns[rand6] +
    "."
  );
};

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const getRandomString = (length = 10) => {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const toTimerString = (time) => {
  time = time || 0;
  let second = time % 60;
  second = second > 9 ? second : "0" + second;
  let min = Math.floor(time / 60);
  min = min > 9 ? min : "0" + min;
  return min + ":" + second;
};

export const getQuery = (key) => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  return params[key];
};

export const emit = (event, detail) =>
  window.dispatchEvent(new CustomEvent(event, { detail }));

export const isAutoClick = (e) => ![e.isTrusted, e.x, e.y].every(Boolean);

export const scrollToEnd = ($element) => {
  $element.scrollTo({
    top: $element.scrollHeight,
  });
};

export const getBrowserLanguage = () =>
  (
    window.navigator?.userLanguage ||
    window.navigator?.language ||
    "en"
  ).toLowerCase();
