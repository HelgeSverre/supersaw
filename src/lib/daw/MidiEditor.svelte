<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";

  let midiData = [];
  let highestTime = 0; // To set the roll width dynamically based on the song length
  let startTime;
  let currentPlayTime = 0;
  const noteOscillators = {};

  // function setupAudioContext() {
  //   audioContext = new (window.AudioContext || window.webkitAudioContext)();
  // }

  const frequencies = {
    "C2": 65.41,
    "C#2": 69.3,
    "D2": 73.42,
    "D#2": 77.78,
    "E2": 82.41,
    "F2": 87.31,
    "F#2": 92.5,
    "G2": 98.0,
    "G#2": 103.83,
    "A2": 110.0,
    "A#2": 116.54,
    "B2": 123.47,
    "C3": 130.81,
    "C#3": 138.59,
    "D3": 146.83,
    "D#3": 155.56,
    "E3": 164.81,
    "F3": 174.61,
    "F#3": 185.0,
    "G3": 196.0,
    "G#3": 207.65,
    "A3": 220.0,
    "A#3": 233.08,
    "B3": 246.94,
    "C4": 261.63,
    "C#4": 277.18,
    "D4": 293.66,
    "D#4": 311.13,
    "E4": 329.63,
    "F4": 349.23,
    "F#4": 369.99,
    "G4": 392.0,
    "G#4": 415.3,
    "A4": 440.0,
    "A#4": 466.16,
    "B4": 493.88,
    "C5": 523.25,
    "C#5": 554.37,
    "D5": 587.33,
    "D#5": 622.25,
    "E5": 659.25,
    "F5": 698.46,
    "F#5": 739.99,
    "G5": 783.99,
    "G#5": 830.61,
    "A5": 880.0,
    "A#5": 932.33,
    "B5": 987.77,
    "C6": 1046.5,
    "C#6": 1108.73,
    "D6": 1174.66,
    "D#6": 1244.51,
    "E6": 1318.51
  };

  function midiToFrequency(noteNumber) {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    const noteName = `${noteNames[noteIndex]}${octave}`;
    return noteName;
  }

  onMount(() => {
    // setupAudioContext();
    loadMidiFile("/emotions.mid");
    animatePlayhead();
  });

  async function loadMidiFile(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    parseMidi(arrayBuffer);
  }

  function parseMidi(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    let trackEvents = [];
    let absoluteTime = 0; // Keep track of the absolute time

    for (let i = 0; i < data.length; i++) {
      let deltaTime = 1;
      absoluteTime += deltaTime;

      if (data[i] === 0x90 && data[i + 2] !== 0) {
        // Note On
        trackEvents.push({
          type: "noteOn",
          note: data[i + 1],
          velocity: data[i + 2],
          time: absoluteTime
        });
      } else if (data[i] === 0x80 || (data[i] === 0x90 && data[i + 2] === 0)) {
        // Note Off
        trackEvents.push({
          type: "noteOff",
          note: data[i + 1],
          velocity: data[i + 2],
          time: absoluteTime
        });
      }
    }

    midiData = trackEvents;
    highestTime = absoluteTime;
  }

  function startNote(note, velocity, time) {
    audioManager.audioContext.resume();
    const frequency = midiNoteToFrequency(note);

    let gainNode = audioManager.audioContext.createGain();

    let oscillators = Array.from({ length: 4 }, () => {
      let oscillator = audioManager.audioContext.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, audioManager.audioContext.currentTime);
      oscillator.connect(gainNode);
      return oscillator;
    });

    oscillators.forEach((oscillator, index) => {
      oscillator.detune.value = (index - 3) * 10;
    });

    const now = audioManager.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.00001, now);
    gainNode.gain.exponentialRampToValueAtTime(1, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.8 , now + 0.1 + 0.3);
    gainNode.connect(audioManager.mixer);

    console.log("Starting note", note, "at time", time);
    oscillators.forEach((oscillator) => oscillator.start(time));


    return oscillators;

    // const oscillator = audioContext.createOscillator();
    // oscillator.type = "sawtooth";
    // oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    // oscillator.connect(audioContext.destination);
    // oscillator.start(time);
    // return oscillator;
  }

  function midiNoteToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12) * 2;
  }

  function animatePlayhead() {
    if (!startTime) startTime = audioManager.audioContext.currentTime;
    currentPlayTime = (audioManager.audioContext.currentTime - startTime) * 100; // Scale to your time units

    requestAnimationFrame(animatePlayhead);
  }

  function play() {
    startTime = audioManager.audioContext.currentTime;
    midiData.forEach((event) => {
      if (event.type === "noteOn") {
        let noteTime = event.time / 100; // Scale to match your MIDI time units to seconds
        let oscillators = startNote(event.note, event.velocity, audioManager.audioContext.currentTime + noteTime);
        noteOscillators[event.note] = oscillators;
      } else if (event.type === "noteOff" && noteOscillators[event.note]) {
        let noteTime = event.time / 100;
        noteOscillators[event.note].forEach((oscillator) => oscillator.stop(audioManager.audioContext.currentTime + noteTime));
      }
    });
  }
</script>

<!-- Simple rendering of MIDI events -->
<div class="roll h-full w-full" on:click={() => play()}>
  {#each midiData as event}
    <div class="note" style="left: {event.time}px; top: {(127 - event.note) * 5}px;">
      {midiToFrequency(event.note)}
    </div>
  {/each}

  <div class="playhead" style="left: {currentPlayTime}px"></div>
</div>

<style>
    .roll {
        position: relative;
        overflow-x: scroll;
    }

    .note {
        position: absolute;
        background: white;
        color: black;
        font-size: 8px;
        height: 12px;
    }

    .playhead {
        position: absolute;
        width: 2px;
        height: 100%;
        background: red;
        animation: movePlayhead linear infinite; /* Adjust or remove CSS animation as needed */
    }
</style>
