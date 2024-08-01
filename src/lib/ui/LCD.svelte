<script>
  import { onDestroy, onMount, tick } from "svelte";
  import classNames from "classnames";

  export let on = false;
  export let columns = 16;
  export let rows = 2;
  export let lines = [];
  export let speed = 500;
  export let delay = 1000;
  export let pauseAtCycleEnd = false;
  export let alternate = false;

  $: _lines = typeof lines === "string" ? [lines] : lines;
  $: rows = Math.max(rows, _lines.length);

  let displayLines = [];
  let offsets = [];
  let isScrolling = false;
  let initialDelay = true;
  let scrollDirections = [];

  $: paddedLines = _lines.map((line) =>
    line.length <= columns ? line.padEnd(columns, " ") : line + " ".repeat(columns) + line.slice(0, columns),
  );

  $: totalLengths = paddedLines.map((line) => Math.max(line.length - columns, 0));

  $: {
    displayLines = paddedLines.map((line, i) =>
      line.slice(offsets[i] || 0, (offsets[i] || 0) + columns).padEnd(columns, " "),
    );
  }

  $: {
    offsets = _lines.map(() => 0);
    scrollDirections = _lines.map(() => 1);
  }

  async function startScrolling() {
    if (initialDelay || pauseAtCycleEnd) {
      isScrolling = false;
      await new Promise((resolve) => setTimeout(resolve, delay));
      initialDelay = false;
    }
    isScrolling = true;
  }

  async function advanceText() {
    if (!isScrolling) return;

    _lines.forEach((line, i) => {
      if (line.length > columns) {
        if (alternate) {
          offsets[i] += scrollDirections[i];
          if (offsets[i] <= 0 || offsets[i] >= totalLengths[i]) {
            scrollDirections[i] *= -1;
            startScrolling();
          }
        } else {
          offsets[i] = (offsets[i] + 1) % totalLengths[i];
          if (offsets[i] === 0 && pauseAtCycleEnd) startScrolling();
        }
      }
    });

    await tick();
  }

  let intervalId;

  async function start() {
    await startScrolling();
    intervalId = setInterval(advanceText, speed);
  }

  onDestroy(() => clearInterval(intervalId));

  onMount(() => {
    start();
  });

  // ------------------------------------------------

  const blockChars = ["░", "▒", "▓", "█", "▄", "▀", "■"];

  function generateRandomString(length) {
    return Array(length)
      .fill()
      .map(() => blockChars[Math.floor(Math.random() * blockChars.length)])
      .join("");
  }

  async function showProgressAnimation(duration = 5000) {
    let length = 0;
    const progressChars = ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"];

    for (let i = 0; i < duration / 100; i++) {
      const progress = progressChars[length % progressChars.length].repeat(columns);
      lines = [progress];
      length = (length + 1) % columns;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    lines = ["Complete!"];
  }

  function snapshot() {
    const backup = [...lines];

    return () => (lines = backup);
  }

  async function showBouncingBall(cycles = 3, interval = 80) {
    const restore = snapshot();
    let position = 0;
    let direction = 1;
    const maxPosition = columns - 1;
    const duration = interval * maxPosition * 2 * cycles + 1;

    for (let i = 0; i < duration / interval; i++) {
      let line = Array(columns).fill(" ");
      if (position === 0) {
        line[position] = "@"; // hit wall
      } else if (position === 1) {
        line[position] = "ø"; // before wall
      } else if (position === maxPosition - 1) {
        line[position] = "ø"; // before wall
      } else if (position === maxPosition) {
        line[position] = "@"; // hit wall
      } else {
        line[position] = "●"; // normal
      }

      lines = [line.join("")];

      position += direction;
      if (position === 0 || position === maxPosition) {
        direction *= -1;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    restore();
  }

  async function wakkaWakka(cycles = 3, interval = 200) {
    const restore = snapshot();
    let position = 0;
    let direction = 1;
    const maxPosition = columns - 1;
    const duration = interval * maxPosition * 2 * cycles + 1;

    for (let i = 0; i < duration / interval; i++) {
      let line = Array(columns).fill(" ");

      if (direction === 1) {
        line[position + (2 % columns)] = "°";
      } else {
        line[position - (2 % columns)] = "°";
      }

      line[position] = direction === -1 ? "ᗤ" : "ᗧ";

      lines = [line.join("")];

      position += direction;

      if (position === 0 || position === maxPosition) {
        direction *= -1;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    restore();
  }

  async function spin(cycles = 3, interval = 100) {
    const restore = snapshot();

    const sequence = "◴◵◶◷◴◵◶◷".split("");
    let step = 0;

    for (let i = 0; i < cycles * sequence.length; i++) {
      lines[0] = [sequence[step % sequence.length], " ".repeat(columns - 2), sequence[step % sequence.length]].join("");
      lines[1] = "";

      step++;

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    restore();
  }

  async function spin2(cycles = 3, interval = 200) {
    const restore = snapshot();

    const sequence = "◜◝◞◟◠◡◜◝◞◟◦".split("");
    let step = 0;

    for (let i = 0; i < cycles * sequence.length; i++) {
      const char = sequence[step % sequence.length];
      lines[0] = [char.repeat(columns)].join("");
      lines[1] = "";

      step++;

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    restore();
  }

  async function doop(cycles = 10, interval = 150) {
    const restore = snapshot();
    // const wave = "▁▂▃▄▅▆▇█▇▆▅▄▃▂▁".split("");

    // const sequence = "◦◌◯○●".split("");
    const sequence = "●◯○●◞◟◜◝◞◟◜◝◦◌◦◌◡◠◡◠⊂⊃⊂⊃⊂⊃◞◟◜◝◞◟◜◝◦◌◦◌◡◠◡◠⊂⊃⊂⊃⊂⊃".split("");
    // const sequence = "◦◌◯○●□◇△☆✚■◆▲★✜_,.-:;".split("");

    let step = 0;

    for (let i = 0; i < cycles * sequence.length; i++) {
      let a = sequence[step % sequence.length];
      let b = sequence[(step + 1) % sequence.length];
      let c = sequence[(step + 2) % sequence.length];

      lines[0] = [a, b, c].join("").repeat(columns).slice(0, columns);
      lines[1] = [b, c, a].join("").repeat(columns).slice(0, columns);
      lines[2] = [a, b, c].join("").repeat(columns).slice(0, columns);

      step++;

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    restore();
  }

  async function showGeometricPattern(duration = 10000) {
    const patterns = ["■□■□■□■□", "□■□■□■□■", "▄▀▄▀▄▀▄▀", "▀▄▀▄▀▄▀▄", "▌▐▌▐▌▐▌▐", "▐▌▐▌▐▌▐▌"];
    const interval = 200; // 200ms between frames

    for (let i = 0; i < duration / interval; i++) {
      const pattern = patterns[i % patterns.length];
      lines = [pattern.repeat(Math.ceil(columns / pattern.length)).slice(0, columns)];
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  // ------------------------------------------------
</script>

<div
  style="--text-columns: {columns}; --text-rows: {rows};"
  class={classNames("lcd-panel relative max-w-80 overflow-hidden rounded-sm bg-gray-900 p-1 ring-1 ring-black/50", {
    "panel-off": on === false,
    "panel-on": on === true,
  })}
>
  <div class="lcd-panel-screen relative rounded-sm bg-black p-2 shadow-lg shadow-red-100/10">
    <!-- LCD Display -->
    <div class="pulsate lcd-grid relative z-10 text-sm text-red-600">
      {#each Array(rows) as _, rowIndex}
        {#each Array(columns) as _, colIndex}
          <div class="lcd-character text-center font-medium">
            {displayLines[rowIndex]?.[colIndex] || " "}
          </div>
        {/each}
      {/each}
    </div>
    <!-- Glow effect -->
    <div class="absolute inset-0 bg-red-800 opacity-10 blur-sm"></div>
    <!-- Inset shadow effect -->
    <div class="absolute inset-0 shadow-inner shadow-black/50"></div>
    <!-- Smudgy overlay -->
    <div class="smudgy-overlay absolute inset-0"></div>
  </div>
</div>

<style>
  @keyframes pulsate {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.92;
    }
  }

  .pulsate {
    animation: pulsate 84ms ease-in-out infinite;
  }

  .panel-off .lcd-character {
    visibility: hidden;
  }

  .lcd-grid::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="2.5" height="2.5"><rect width="1" height="1" fill="FFC599" opacity="0.9"/></svg>');
    background-color: rgba(144, 0, 4, 0.3);
    opacity: 0.1;
    pointer-events: none;
  }

  .lcd-grid {
    display: grid;
    grid-template-columns: repeat(var(--text-columns, 16), 1fr);
    grid-template-rows: repeat(var(--text-rows, 2), 1fr);
    gap: 2px;
  }

  .lcd-character {
    font-family: "Pathway Extreme", "Helvetica Neue", "Helvetica", sans-serif;
    background-color: rgba(80, 0, 0, 0.45);
    aspect-ratio: 3/4;
    width: 100%;
    height: 100%;
    overflow: hidden;

    white-space: nowrap;

    text-shadow:
      0 0 1px rgba(200, 0, 0, 0.1),
      0 0 4px rgba(180, 0, 0, 0.15),
      0 0 5px rgba(180, 0, 0, 0.25),
      0 0 6px rgba(180, 0, 0, 0.25),
      0 0 7px rgba(255, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
  }

  .smudgy-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.1'  numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E");
    background-color: rgba(185, 0, 20);
    background-size: cover;
    background-repeat: no-repeat;
    filter: saturate(1.1) blur(3px) opacity(0.3) brightness(0.3);
  }
</style>
