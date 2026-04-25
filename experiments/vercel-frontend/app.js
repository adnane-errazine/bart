const clock = document.querySelector("#clock");
const statusText = document.querySelector("#status-text");
const healthButton = document.querySelector("#health-button");

function updateClock() {
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

updateClock();
setInterval(updateClock, 1000);

healthButton?.addEventListener("click", () => {
  const checks = [
    Boolean(document.querySelector("[data-testid='bart-vercel-smoke']")),
    Boolean(document.styleSheets.length),
    Boolean(clock?.textContent && clock.textContent !== "--:--:--"),
  ];

  statusText.textContent = checks.every(Boolean)
    ? "Browser check passed. This frontend is ready for Vercel."
    : "Browser check failed. Inspect static assets.";
});
