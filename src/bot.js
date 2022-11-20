import { getBrowserLanguage, getRandomText, scrollToEnd } from "./util";

export const onMessage = (message, $container) => {
  if (!message) return;

  setTimeout(() => scrollToEnd($container), 0);

  fetch(process.env.BOT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  })
    .then((response) => response.json())
    .then((data) => {
      $container.insertAdjacentHTML(
        "beforeend",
        `<li class=""><span>${data.message}</span></li>`
      );
      setTimeout(() => scrollToEnd($container), 0);
    });
};

export const onRandomMessage = ($container) => {
  const message = getRandomText();
  $container.insertAdjacentHTML(
    "beforeend",
    `<li class=""><span>${message}</span></li>`
  );
};

export const onFirstMessage = ($container) => {
  const message = getBrowserLanguage().includes("vi") ? "Xin chào" : "Hello";
  onMessage(message, $container);
};
