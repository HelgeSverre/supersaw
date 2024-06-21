<script>
  import { onDestroy, onMount } from "svelte";
  import TextButton from "../../ui/TextButton.svelte";
  import TextDisplay from "../../ui/TextDisplay.svelte";
  import SegmentGroup from "../../ui/SegmentGroup.svelte";
  import { audioManager } from "../../../core/audio.js";
  import { midiNoteToFrequency } from "../../../core/midi.js";

  export let size = 16;

  let isPlaying = false;
  let grid = [];

  let intervalId = null;
  let currentStep = 0;
  let laps = 0;
  let elapsedTime = 0;

  let bpm = 60;
  $: refreshTimeMs = (60 / bpm / 4) * 1000;

  function play() {
    if (isPlaying) return;
    isPlaying = true;
    startInterval();
    playCurrentStep();
  }

  function startInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(advanceStep, refreshTimeMs);
  }

  $: if (isPlaying) {
    startInterval();
  }

  function setBpm(newBpm) {
    bpm = newBpm;
    refreshTimeMs = (60 / bpm / 4) * 1000;
    if (isPlaying) {
      startInterval();
    }
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    isPlaying = false;
    currentStep = 0;
  }

  function advanceStep() {
    elapsedTime += refreshTimeMs;

    if (currentStep === 0) {
      laps++;
    }

    currentStep = (currentStep + 1) % size;

    playCurrentStep();
  }

  function toggleCell(rowIndex, columnIndex) {
    grid[rowIndex][columnIndex] = !grid[rowIndex][columnIndex];
    grid = grid.slice(); // Force Svelte to update the grid
  }

  function playCurrentStep() {
    grid.forEach((row, rowIndex) => {
      if (row[currentStep]) {
        playSound(rowIndex);
      }
    });
  }

  function resetCells() {
    // reset grid
    grid = Array(size)
      .fill()
      .map(() => Array(size).fill(false));
  }

  function randomizeCells() {
    resetCells();
    const totalCells = size * size;
    const cellsToActivate = Math.floor(totalCells * 0.05); // 10% of total cells
    const newGrid = [...grid];

    for (let i = 0; i < cellsToActivate; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * size);
        col = Math.floor(Math.random() * size);
      } while (newGrid[row][col]); // Ensure the cell isn't already activated

      newGrid[row][col] = true; // Activate the cell
    }

    grid = newGrid;
  }

  function playSound(rowIndex) {
    const invertedRowIndex = size - rowIndex - 1;

    let activeNotes = 0;
    grid.forEach((row) => {
      if (row[currentStep]) {
        activeNotes++;
      }
    });

    const freq = midiNoteToFrequency(invertedRowIndex + 60);
    const duration = 0.5;
    const channel = audioManager.createChannel("tenori");
    const now = audioManager.audioContext.currentTime;
    const osc = audioManager.audioContext.createOscillator();

    osc.frequency.value = freq;
    osc.type = "sine";

    osc.connect(channel.gainNode);

    const gainValue = 1 / Math.max(1, activeNotes); // Ensure gainValue is never 0 and does not exceed 1

    console.log(
      `Playing row ${rowIndex}, column ${currentStep}: ${activeNotes} active notes, gain set to ${gainValue}`,
    );

    channel.gainNode.gain.setValueAtTime(0.0001, now);
    channel.gainNode.gain.linearRampToValueAtTime(gainValue, now + 0.01); // Attack
    channel.gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Decay

    osc.start(now);
    osc.stop(now + duration + 0.001);
  }

  onMount(() => {
    grid = Array(size)
      .fill()
      .map(() => Array(size).fill(false));
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId); // Cleanup on component destruction
  });
</script>

<main class="w-full">
  <!-- Controls -->
  <div
    class="mx-auto mb-8 flex max-w-3xl flex-row items-center justify-between rounded border border-dark-400 bg-dark-600 p-1"
  >
    <SegmentGroup>
      {#if isPlaying}
        <TextButton onClick={stop} text="Stop" />
      {:else}
        <TextButton onClick={play} text="Play" />
      {/if}

      <TextButton onClick={randomizeCells} text="Randomize" />
      <TextButton onClick={resetCells} text="Reset" />
    </SegmentGroup>

    <SegmentGroup>
      <TextButton onClick={() => setBpm(60)} text="60" />
      <TextButton onClick={() => setBpm(90)} text="90" />
      <TextButton onClick={() => setBpm(120)} text="120" />
      <TextButton onClick={() => setBpm(140)} text="140" />
      <TextButton onClick={() => setBpm(200)} text="200" />
    </SegmentGroup>

    <SegmentGroup>
      <TextDisplay text={`step ${currentStep}1`} />
      <TextDisplay text={`${laps} laps`} />
    </SegmentGroup>
  </div>

  <!-- Grid -->
  <div class="tenori-edge flex items-center justify-center" style="--size: {size}">
    <div class="tenori-frame">
      <div class="tenori">
        <div class="tenori-grid">
          {#each grid as rows, rowIndex}
            {#each rows as cell, cellIndex}
              <div class="tenori-cell">
                <button
                  class="cell flex h-full w-full items-center justify-center rounded-lg"
                  class:active={cell}
                  class:playing={cellIndex === currentStep && isPlaying}
                  class:pop={cell && cellIndex === currentStep && isPlaying}
                  on:click={() => toggleCell(rowIndex, cellIndex)}
                >
                  <span class="inline-block text-center text-xs text-white/50">{size - rowIndex}</span>
                </button>
              </div>
            {/each}
          {/each}
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .tenori-frame {
    overflow: hidden;
    background: #0c0b0e;
    border: 16px solid #121115;
    border-radius: 22px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tenori-grid {
    padding: 12px;
    overflow: hidden;
    display: grid;
    background-color: #0c0b0e;
    grid-template-rows: repeat(var(--size), 1fr);
    grid-template-columns: repeat(var(--size), 1fr);
    gap: 6px;
  }

  /*.tenori-cell:nth-child(4n + 1) {*/
  /*    background-color: rgb(255, 255, 255, 0.05);*/
  /*}*/

  .tenori-cell {
    display: flex;
    align-items: center;
    justify-self: center;
    height: 32px;
    width: 32px;
  }

  .cell {
    flex: 1 0 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.05);
    box-shadow: 1px 2px 3px rgba(102, 102, 255, 0.05);
    transition:
      background-color 0.3s,
      transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .cell:active {
    transform: scale(0.95);
    outline: none;
  }

  .cell:focus-visible {
    outline: 1px solid white;
  }

  .cell:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .cell.active {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .cell:active {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .cell.playing span {
    color: rgb(0, 0, 0, 0.5);
  }

  .cell.playing {
    background-color: rgba(255, 255, 255, 0.7);
    /*animation:*/
    /*  fadeout 0.5s ease-out 0.2s both,*/
    /*  playing-glow 0.5s ease-out 0.2s both;*/
  }

  .cell.pop {
    animation:
      fadeout 0.5s ease-out 0.2s both,
      playing-glow 0.5s ease-out 0.2s both;
  }

  @keyframes fadeout {
    from {
      background-color: rgba(255, 255, 255, 1);
    }
    to {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }

  @keyframes scalePop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes playing-glow {
    0% {
      box-shadow:
        0 0 5px rgba(255, 255, 255, 0.5),
        0 0 25px rgba(255, 255, 255, 0.2),
        0 0 50px rgba(255, 255, 255, 0.2),
        0 0 200px rgba(255, 255, 255, 0.1);
    }
    100% {
      box-shadow:
        0 0 5px rgba(255, 255, 255, 0.5),
        0 0 25px rgba(255, 255, 255, 0),
        0 0 50px rgba(255, 255, 255, 0),
        0 0 200px rgba(255, 255, 255, 0);
    }
  }

  @keyframes pop-glow {
    0% {
      box-shadow:
        0 0 5px rgba(255, 255, 255, 0.5),
        0 0 25px rgba(255, 255, 255, 0.2),
        0 0 50px rgba(255, 255, 255, 0.2),
        0 0 200px rgba(255, 255, 255, 0.1);
    }
    100% {
      box-shadow:
        0 0 5px rgba(255, 255, 255, 0.5),
        0 0 25px rgba(255, 255, 255, 0),
        0 0 50px rgba(255, 255, 255, 0),
        0 0 200px rgba(255, 255, 255, 0);
    }
  }
</style>
