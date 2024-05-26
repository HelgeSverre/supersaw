export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, "0");

  if (hours === "00" && minutes === "00") return `${sec}.${ms}`;

  if (hours === "00") return `${minutes}:${sec}.${ms}`;

  return `${hours}:${minutes}:${sec}.${ms}`;
}

export function formatTimeDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, "0");

  if (hours === "00") return `${minutes}:${sec}.${ms}`;

  return `${hours}:${minutes}:${sec}.${ms}`;
}
