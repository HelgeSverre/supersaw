<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import { bpm, changeBpm, getSelectedClip, timeToPixels, zoomByDelta } from "../../core/store.js";
  import { extractNoteEvents, noteLabel, ticksToMilliseconds } from "../../core/midi.js";

  const dispatch = createEventDispatcher();

  let noteHeight = 20;
  let ticksPerBeat = 480;

  let notesForDisplay = [];
  let highestTime = 0;
  let startTime;
  let currentPlayTime = 0;

  let pianoRoll;
  let noteArea;

  onMount(() => {
    audioManager.audioContext.resume();
    notesForDisplay = extractNoteEvents($getSelectedClip.midiData);
    scrollToFirstNote();
    animatePlayhead();
  });

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault();
      zoomByDelta(event.deltaY);
    }
  }

  function syncVerticalScroll(e) {
    if (e.target === pianoRoll) {
      noteArea.scrollTop = e.target.scrollTop;
    } else {
      pianoRoll.scrollTop = e.target.scrollTop;
    }
  }

  function scrollToFirstNote() {
    if (notesForDisplay.length > 0) {
      const firstNote = notesForDisplay[0];
      const firstNoteTop = calculateNoteTopPosition(firstNote);
      noteArea.scrollTop = Math.max(0, firstNoteTop - 100); // Scroll to first note with 100px padding
    }
  }

  function parseMidi(parsed) {
    return;
    ticksPerBeat = parsed.header.ticksPerBeat;

    parsed.tracks.forEach((track) => {
      let wallTime = 0;
      let wallTimeInMilliseconds = 0;

      let trackName = track.find((event) => event.type === "trackName")?.text || "Unnamed";

      track.forEach((event) => {
        // Timing
        wallTime += event.deltaTime;
        wallTimeInMilliseconds = ticksToMilliseconds(wallTime, ticksPerBeat, $bpm);

        if (event.type === "setTempo") {
          let newBpm = 60000000 / event.microsecondsPerBeat;
          changeBpm(Math.floor(newBpm));
        }

        if (event.type === "noteOn") {
          notesForDisplay.push({
            track: trackName,
            note: event.noteNumber,
            label: noteLabel(event.noteNumber),
            velocity: event.velocity,
            start: wallTimeInMilliseconds,
            tickOffset: wallTime,
            duration: 0, // will be changed later
          });
        }

        if (event.type === "noteOff") {
          let note = notesForDisplay

            .filter((note) => note.start < wallTimeInMilliseconds && note.duration === 0)
            .find((note) => note.note === event.noteNumber);

          note.duration = wallTimeInMilliseconds - note?.start;
        }
      });

      if (wallTime > highestTime) {
        highestTime = wallTime;
      }
    });
  }

  function startNote(note, time, duration) {
    audioManager.audioContext.resume();
    const frequency = midiNoteToFrequency(note);

    const totalOscillators = 4;

    let gainNode = audioManager.audioContext.createGain();
    let oscillators = Array.from({ length: totalOscillators }, (_, index) => {
      let oscillator = audioManager.audioContext.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, audioManager.audioContext.currentTime);
      oscillator.detune.setValueAtTime((index - 1) * 13, audioManager.audioContext.currentTime);
      oscillator.connect(gainNode);
      return oscillator;
    });

    // ADSR Parameters
    const attackTime = 0.01; // Attack time in seconds
    const decayTime = 0.1; // Decay time in seconds
    const sustainLevel = 0.9; // Sustain level (0.0 to 1.0)
    const releaseTime = 0.3; // Release time in seconds

    // Adjust noteEndTime to ensure it includes the release phase
    const noteEndTime = time + duration;
    const finalEndTime = noteEndTime + releaseTime; // Extend end time by the release duration

    // Set up ADSR envelope
    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.linearRampToValueAtTime(1 / totalOscillators, time + attackTime); // Attack
    gainNode.gain.exponentialRampToValueAtTime(sustainLevel / totalOscillators, time + attackTime + decayTime); // Decay
    gainNode.gain.setValueAtTime(sustainLevel / totalOscillators, noteEndTime); // Sustain until note end
    gainNode.gain.linearRampToValueAtTime(0.0001, finalEndTime); // Release

    // Connect, start, and schedule stopping of oscillators
    gainNode.connect(audioManager.mixer);
    oscillators.forEach((oscillator) => {
      oscillator.start(time);
      oscillator.stop(finalEndTime + 0.1);
    });

    return oscillators;
  }

  function midiNoteToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function animatePlayhead(dt) {
    currentPlayTime = audioManager.audioContext.currentTime - startTime;

    requestAnimationFrame(animatePlayhead);
  }

  function play() {
    startTime = audioManager.audioContext.currentTime;

    notesForDisplay.forEach((note) => {
      const startTimeInSeconds = audioManager.audioContext.currentTime + note.start / 1000;
      const durationInSeconds = note.duration / 1000;

      // setTimeout(() => {
      //   dispatch("note:start", { note: note.note });
      //
      //   setTimeout(() => {
      //     dispatch("note:end", { note: note.note });
      //   }, durationInSeconds * 1000);
      // }, startTimeInSeconds * 1000);

      const noteInstance = startNote(note.note, startTimeInSeconds, durationInSeconds);
    });
  }

  function calculateNoteTopPosition(note) {
    return (127 - note.note) * noteHeight;
  }

  // Array to generate MIDI note numbers in reverse
  let notesArray = Array.from({ length: 128 }, (_, index) => 127 - index);

  function isBlackKey(noteNumber) {
    const key = noteNumber % 12;
    return [1, 3, 6, 8, 10].includes(key); // These represent the black keys on a piano (C#, D#, F#, G#, A#)
  }

  let highlightedNote = "";

  let debug = false;
</script>

<div
  style="--note-height: {noteHeight}px;--beat-width: {$timeToPixels(480 / 10000)}px"
  class="relative flex h-full min-h-0 flex-col p-2"
>
  <div class="flex h-full min-h-0 flex-row gap-2 overflow-hidden">
    <div class="relative flex w-[100px] flex-shrink-0 flex-col">
      <div class="mb-2 flex h-8 flex-shrink-0 items-center justify-center bg-dark-600 text-center">
        <span class="whitespace-nowrap font-mono text-xs font-medium">{highlightedNote}</span>
      </div>

      <div class="relative flex-1">
        <div
          on:scroll={syncVerticalScroll}
          bind:this={pianoRoll}
          class="piano-roll absolute inset-0 h-full min-h-0 min-w-0 flex-1 overflow-y-scroll bg-gray-700"
        >
          {#each notesArray as noteNumber}
            <button
              on:mouseenter={() => (highlightedNote = noteLabel(noteNumber))}
              on:mousedown={() => dispatch("note:start", { note: noteNumber })}
              on:mouseup={() => dispatch("note:end", { note: noteNumber })}
              class="piano-key hover:opacity-80 active:opacity-70 {isBlackKey(noteNumber) ? 'black-key' : 'white-key'}"
            >
              <span class="inline-block pr-2 font-medium">{noteLabel(noteNumber)}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
    <div class="flex w-full flex-shrink-0 flex-col">
      <div class="mb-2 flex h-8 items-center gap-2 bg-dark-600 px-2"></div>

      <div class="relative flex-1 bg-dark-900">
        <div
          on:scroll={syncVerticalScroll}
          on:wheel={handleZoom}
          bind:this={noteArea}
          class="note-area absolute inset-0 overflow-scroll bg-dark-700/50"
        >
          <div class="playhead" style="left: {$timeToPixels(currentPlayTime / 10)}px"></div>
          {#each notesForDisplay as note}
            <div
              aria-hidden="true"
              on:mouseenter={() => (highlightedNote = note.label)}
              class="note flex cursor-pointer select-none items-center justify-center hover:opacity-50"
              style="left: {$timeToPixels(note.start / 10000)}px; top: {calculateNoteTopPosition(
                note,
              )}px; width: {$timeToPixels(note.duration / 10000)}px;"
            >
              {note.label}
            </div>
          {/each}
        </div>
        {#if debug}
          <div class="absolute inset-y-0 left-0 w-[900px] overflow-y-scroll border-dark-800 bg-dark-600">
            <div class="flex-1">
              <div class="flex h-full flex-col overflow-y-scroll">
                <table class="text-right">
                  <thead>
                    <tr>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Tick</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Start</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Duration</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Velocity</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Note Num</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each notesForDisplay as event}
                      <tr>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{event.tickOffset}</td>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{parseFloat(event.start).toFixed(3)}</td>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{parseFloat(event.duration).toFixed(3)}</td
                        >
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{event.velocity}</td>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{event.note}</td>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{event.label}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .piano-roll {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  .piano-key {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: black;
    font-size: 10px;
    min-height: var(--note-height);
    max-height: var(--note-height);
  }

  .black-key {
    background-color: black;
    color: white;
  }

  .white-key {
    background-color: white;
  }

  /*noinspection ALL*/
  .note-area {
    background: repeating-linear-gradient(
        to bottom,
        hsl(0, 0%, 100%, 10%),
        hsl(0, 0%, 100%, 10%) 1px,
        transparent 1px,
        transparent var(--note-height)
      ),
      repeating-linear-gradient(
        to bottom,
        hsl(60, 100%, 50%, 30%),
        hsl(60, 100%, 50%, 30%) 1px,
        transparent 1px,
        transparent calc(var(--note-height) * 12) /* 1 octave */
      ),
      repeating-linear-gradient(
        to right,
        hsl(0, 0%, 100%, 10%),
        hsl(0, 0%, 100%, 10%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width) * 4) /* 1 beat */
      );
    background-attachment: local;
  }

  .note {
    position: absolute;
    background: hsl(60, 100%, 80%);
    color: hsl(0, 0%, 0%, 80%);
    font-size: 8px;
    height: var(--note-height);
  }

  .note.active {
    background: rgb(182, 255, 153);
  }

  .note.inactive {
    background: hsl(0, 0%, 90%);
  }

  .playhead {
    position: absolute;
    top: 0;
    width: 2px;
    height: calc((var(--note-height) * 12 * 12));
    background: hsl(0, 90%, 55%);
  }
</style>
