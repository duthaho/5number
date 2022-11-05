export const showConfetti = () => {
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
