<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import {
    bpm,
    enableLooping,
    expandLoopRegion,
    pixelsPerBeat,
    pixelsToTime,
    playbackState,
    seekToTime,
    selectedClip,
    setLoopRegion,
    timeToPixels,
    updateClip,
    zoomByDelta,
    zoomLevel,
  } from "../../core/store.js";
  import {
    extractNoteEvents,
    frequencyToMidiNote,
    getBpmFromMidi,
    isBlackKey,
    midiNoteToFrequency,
    noteLabel,
  } from "../../core/midi.js";
  import { Biohazard, CassetteTape, Heartbeat, Keyboard, PianoKeys } from "phosphor-svelte";
  import { TimeConverter } from "../../core/time";
  import { MusicGenerator } from "../../utils/hardstyleGenerator.js";
  import { GeneratorHardstyle } from "../../utils/generators/wip.js";
  import classNames from "classnames";
  import { TranceGenerator } from "../../utils/generators/trance.js";
  import { generateChordProgressionWithIntervals } from "../../utils/generators/chords.js";

  const dispatch = createEventDispatcher();

  let noteHeight = 20;
  let notesForDisplay = [];

  let pianoRoll;
  let noteArea;

  onMount(() => {
    audioManager.audioContext.resume();

    if ($selectedClip?.midiData) {
      notesForDisplay = extractNoteEvents($selectedClip.midiData);
      scrollToFirstNote();
    }
  });

  $: if (notesForDisplay.length > 0) {
    saveMidiChanges();
  }

  function saveMidiChanges() {
    const converter = new TimeConverter($bpm, 96);

    let midiEvents = [];
    let sortedEvents = notesForDisplay.sort((a, b) => a.start - b.start);

    sortedEvents.reduce((acc, curr, index) => {
      let deltaTime = 0;

      if (index > 0) {
        // Time between the current note start time and the previous note end time
        let prev = sortedEvents[index - 1];
        let prevEnd = prev.start + prev.duration;

        deltaTime = converter.msToTicks(curr.start - prevEnd);
      }

      midiEvents.push({
        type: "noteOn",
        velocity: curr.velocity,
        channel: 1, // TODO: configurable
        deltaTime: deltaTime,
        noteNumber: curr.note,
      });

      midiEvents.push({
        type: "noteOff",
        velocity: curr.velocity,
        channel: 1, // TODO: configurable
        deltaTime: converter.msToTicks(curr.duration),
        noteNumber: curr.note,
      });

      return [...acc, ...midiEvents];
    }, []);

    const newDuration = notesForDisplay.reduce((acc, curr) => Math.max(acc, curr.start + curr.duration), 0) / 1000;

    let clip = {
      ...$selectedClip,
      duration: newDuration,
      midiData: {
        header: {
          format: 1,
          numTracks: 1,
          ticksPerBeat: 96,
        },
        tracks: [
          [
            {
              type: "setTempo",
              microsecondsPerBeat: converter.getMicrosecondsPerBeat(), // Set microseconds per beat based on BPM
              deltaTime: 0,
            },
            ...midiEvents,
          ],
        ],
      },
    };

    updateClip($selectedClip.id, clip);
  }

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault();

      const oldZoomLevel = $zoomLevel;
      zoomByDelta(event.wheelDelta);

      const noteAreaRect = noteArea.getBoundingClientRect();
      const currentScroll = noteArea.scrollLeft;

      // Get the current position of the mouse relative to the note area
      const mouseX = event.clientX - noteAreaRect.left;

      // Calculate the zoom factor based on the old and new zoom levels
      const newZoomFactor = $zoomLevel / 100;
      const oldZoomFactor = oldZoomLevel / 100;
      const scaleFactor = newZoomFactor / oldZoomFactor;

      // Calculate the new scroll position to center the zoom on the mouse pointer
      // The formula accounts for the scaling transformation around the mouse cursor
      const newScroll = (currentScroll + mouseX) * scaleFactor - mouseX;

      // Update the note area's scroll position to the newly calculated position
      noteArea.scrollLeft = newScroll;
    }
  }

  function syncVerticalScroll(e) {
    if (e.target === pianoRoll) {
      noteArea.scrollTop = e.target.scrollTop;
    } else {
      pianoRoll.scrollTop = e.target.scrollTop;
    }
  }

  function handleNoteClick(event, noteId) {
    if (isResizing) return;
    if (isDragging) return;

    // Select multiple notes with shift key
    if (event.shiftKey) {
      if (selectedNotes.includes(noteId)) {
        selectedNotes = selectedNotes.map((selected) => {
          if (selected.uuid !== noteId) {
            return selected.uuid;
          }
        });
      } else {
        selectedNotes = [...selectedNotes, noteId];
      }
      return;
    }

    // Select single note
    selectedNotes.includes(noteId) ? (selectedNotes = []) : (selectedNotes = [noteId]);
  }

  function yPosToMidiPitch(y) {
    return 127 - Math.floor((y + noteArea.scrollTop) / noteHeight);
  }

  function handleClick(event) {
    if (isResizing || isDragging) return;

    const currentScroll = noteArea.scrollLeft;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left + currentScroll;
    const y = event.clientY - rect.top;

    const note = yPosToMidiPitch(y);
    let startTime = $pixelsToTime(x) * 1000;

    if (snapToGrid) {
      const timePerSnapMs = $pixelsToTime(beatWidth * snapResolution) * 1000; // Convert pixels per snap to milliseconds
      startTime = Math.round(startTime / timePerSnapMs) * timePerSnapMs;
    }

    notesForDisplay = [
      ...notesForDisplay,
      {
        uuid: crypto.randomUUID(),
        start: startTime,
        label: noteLabel(note),
        duration: lastDuration ?? 200,
        note: note,
        velocity: 100,
      },
    ];
  }

  function scrollToFirstNote(offset = 400) {
    if (notesForDisplay.length > 0) {
      const firstNoteTop = calculateNoteTopPosition(notesForDisplay[0]);
      noteArea.scrollTop = Math.max(0, firstNoteTop - offset);
    }
  }

  function calculateNoteTopPosition(note) {
    return (127 - note.note) * noteHeight;
  }

  // Array to generate MIDI note numbers in reverse
  let notesArray = Array.from({ length: 128 }, (_, index) => 127 - index);

  // NOTE: C is the root note for all of these scales
  const scales = {
    "Major": [0, 2, 4, 5, 7, 9, 11],
    "Minor": [0, 2, 3, 5, 7, 8, 10],
    "Pentatonic Major": [0, 2, 4, 7, 9],
    "Pentatonic Minor": [0, 3, 5, 7, 10],
    "Blues": [0, 3, 5, 6, 7, 10],
    "Dorian": [0, 2, 3, 5, 7, 9, 10],
    "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "Lydian": [0, 2, 4, 6, 7, 9, 11],
    "Phrygian": [0, 1, 3, 5, 7, 8, 10],
    "Locrian": [0, 1, 3, 5, 6, 8, 10],
    "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
    "Melodic Minor": [0, 2, 3, 5, 7, 9, 11],
    "Whole Tone": [0, 2, 4, 6, 8, 10],
  };

  let selectedProgression = "I - V - vi - IV";
  const progressions = [
    "I - V - vi - IV",
    "I - IV - V - I",
    "ii - V - I",
    "I - vi - IV - V",
    "vi - IV - I - V",
    "I - V - IV",
    "IV - V - I",
    "I - IV - vi - V",
    "I - vi - ii - V",
    "ii - vi - IV - V",
  ];

  function isNoteInScale(noteNumber, scaleName) {
    let rootNote = 60; // Middle C as the root note
    let scaleNotes = scales[scaleName].map((interval) => (rootNote + interval) % 12);
    return scaleNotes.includes(noteNumber % 12);
  }

  // Current selected scale (store)
  let selectedScale = "Major"; // default to Major scale

  let highlightedNote = "";
  let selectedNotes = [];
  let activeNotes = [];
  let previewInstrument = "supersaw";

  let snapToGrid = true;
  let snapThreshold = 5;
  let snapResolution = 1 / 16;
  let snaps = [
    { label: "4/4 Beat", value: 1 / 4 }, // Full beat, 1/4 of a bar
    { label: "2/4 Beat", value: 1 / 8 }, // Half of a beat, 1/8 of a bar
    { label: "1/4 beat", value: 1 / 16 }, // Quarter of a beat, 1/16 of a bar
    { label: "1/8 beat", value: 1 / 32 }, // Eighth of a beat, 1/32 of a bar
    { label: "1/16 beat", value: 1 / 64 }, // Sixteenth of a beat, 1/64 of a bar
    { label: "1/32 beat", value: 1 / 128 }, // Thirty-second of a beat, 1/128 of a bar
  ];

  let debug = false;

  function startNote(hz, note) {
    dispatch("noteOn", { hz, note });
    audioManager.audioContext.resume();
    audioManager.getInstrument(previewInstrument).startNote(hz);
  }

  function stopNote(hz, note) {
    dispatch("noteOff", { hz, note });
    audioManager.audioContext.resume();
    audioManager.getInstrument(previewInstrument).stopNote(hz);
  }

  function findNoteBy(noteId) {
    return notesForDisplay.find((note) => note.uuid === noteId);
  }

  function deleteNoteById(noteId) {
    notesForDisplay = notesForDisplay.filter((note) => note.uuid !== noteId);
  }

  function handleKeyDown(event) {
    // Delete selected notes
    if (event.key === "Backspace" || event.key === "Delete") {
      notesForDisplay = notesForDisplay.filter((note) => !selectedNotes.includes(note.uuid));
    }

    // Select all notes
    if (event.metaKey && event.key === "a") {
      event.preventDefault();
      selectedNotes = notesForDisplay.map((note) => note.uuid);
      return;
    }

    // Move selected notes up/down
    if (event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      if (selectedNotes.length === 0) {
        return;
      }

      let delta = event.key === "ArrowUp" ? 1 : -1;

      // Move by whole octave if CMD is pressed
      if (event.metaKey) {
        delta = delta * 12;
      }

      notesForDisplay = notesForDisplay.map((note) => {
        if (selectedNotes.includes(note.uuid)) {
          return {
            ...note,
            note: Math.min(127, note.note + delta),
            label: noteLabel(Math.min(127, note.note + delta)),
          };
        }

        return note;
      });

      return;
    }

    // Duplicate  note with CMD + B
    if (event.metaKey && event.key === "b") {
      if (selectedNotes.length === 1) {
        let note = findNoteBy(selectedNotes[selectedNotes.length - 1]);

        if (!note) {
          return;
        }

        const newId = crypto.randomUUID();
        selectedNotes = [...selectedNotes, newId];
        notesForDisplay = [
          ...notesForDisplay,
          {
            uuid: newId,
            start: note.start + note.duration,
            label: note.label,
            duration: note.duration,
            note: note.note,
            velocity: note.velocity,
          },
        ];
        return;
      }

      if (selectedNotes.length > 1) {
        let noteId = selectedNotes[selectedNotes.length - 1];
        let note = notesForDisplay.find((note) => note.uuid === noteId);

        if (!note) {
          return;
        }

        const newId = crypto.randomUUID();
        selectedNotes = [...selectedNotes, newId];
        notesForDisplay = [
          ...notesForDisplay,
          {
            uuid: newId,
            start: note.start + note.duration,
            label: note.label,
            duration: note.duration,
            note: note.note,
            velocity: note.velocity,
          },
        ];
      }
    }

    // Open debug menu with D
    if (event.key === "d") {
      debug = !debug;
    }
  }

  let isResizing = false;
  let isDragging = false;
  let draggedNote;
  let resizedNote;

  // How much we must offset the note position for it to align with the
  // mouse cursor position within the note, when dragging
  let noteGrabXOffset;

  // Threshold in pixels to move before dragging starts
  let dragThreshold = 5;

  let initialX, initialY;

  function updateNoteById(id, update) {
    notesForDisplay = notesForDisplay.map((note) => {
      if (note.uuid === id) {
        return update(note);
      }

      return note;
    });
  }

  function handleMouseMove(event) {
    const noteAreaRect = noteArea.getBoundingClientRect();
    const localX = event.clientX - noteAreaRect.left + noteArea.scrollLeft - noteGrabXOffset;
    const totalX = Math.abs(event.clientX - initialX);

    const localY = event.clientY - noteAreaRect.top;
    const totalY = Math.abs(event.clientY - initialY);

    if (!isDragging && (totalX > dragThreshold || totalY > dragThreshold)) {
      isDragging = true; // Only set isDragging to true if moved beyond threshold
    }

    if (isDragging) {
      updateNoteById(draggedNote, (note) => {
        let newStartTime = Math.max(0, $pixelsToTime(localX) * 1000);
        let newPitch = yPosToMidiPitch(localY);

        if (snapToGrid && event.shiftKey === false) {
          const timePerSnapMs = $pixelsToTime(beatWidth * snapResolution) * 1000; // Convert pixels per snap to milliseconds
          newStartTime = Math.round(newStartTime / timePerSnapMs) * timePerSnapMs;
        }

        return {
          ...note,
          note: newPitch,
          label: noteLabel(newPitch),
          start: newStartTime,
        };
      });
    }
  }

  function handleMouseUp(event) {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    requestAnimationFrame(() => {
      isDragging = false;
      draggedNote = null;
      initialX = null;
      initialY = null;
    });
  }

  function handleMouseDown(event, noteId) {
    initialX = event.clientX;
    initialY = event.clientY;
    draggedNote = noteId;

    const noteRect = event.currentTarget.getBoundingClientRect();
    noteGrabXOffset = initialX - noteRect.left;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  let lastDuration = 1;

  let resizeStartX, resizeStartWidth;

  function handleResizeMouseDown(event, noteId) {
    event.stopPropagation();

    isDragging = false;
    isResizing = true;

    resizedNote = noteId;

    resizeStartX = event.clientX;
    resizeStartWidth = event.currentTarget.parentElement.offsetWidth;

    document.addEventListener("mousemove", (e) => handleResizeMouseMove(e));
    document.addEventListener("mouseup", (e) => handleResizeMouseUp(e));
  }

  function handleResizeMouseMove(event) {
    const deltaX = event.clientX - resizeStartX;
    const newWidth = resizeStartWidth + deltaX;

    if (isResizing) {
      updateNoteById(resizedNote, (note) => {
        // Convert the width in pixels to time (milliseconds)
        let newDurationMs = $pixelsToTime(newWidth) * 1000;

        lastDuration = newDurationMs;

        // Snap the new duration to the nearest grid point if snapping is enabled
        if (snapToGrid && event.shiftKey === false) {
          const pixelsPerSnap = beatWidth * snapResolution; // Calculate the number of pixels per snap point
          const timePerSnapMs = $pixelsToTime(pixelsPerSnap) * 1000; // Convert pixels per snap to milliseconds

          // Calculate new snapped duration
          newDurationMs = Math.round(newDurationMs / timePerSnapMs) * timePerSnapMs;
        }

        return {
          ...note,
          duration: newDurationMs,
        };
      });
    }
  }

  function handleResizeMouseUp(event) {
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);

    requestAnimationFrame(() => {
      isResizing = false;
    });
  }

  function generateHardstyle() {
    // Clear existing notes
    notesForDisplay = [];

    // Middle C
    const generator = new MusicGenerator(midiNoteToFrequency(57), $bpm);
    let bars = 8;

    // Start at begining
    seekToTime(0);

    // Loop the pattern
    enableLooping();
    setLoopRegion(0, 0);
    expandLoopRegion(bars * 4);

    let wip = new GeneratorHardstyle(150, "harmonicMinor", "E");
    let { melody, bassline, tonics } = wip.generate(bars);

    // melody=[]
    console.log(tonics);

    // let trackGenerator = new HardstyleGenerator();
    // let melody = trackGenerator.generateMelody(bars);
    // let bassline = trackGenerator.generateBassline(melody, bars);
    // let melody = generator.generateHardstyleMelodyHarmonicMinor(bars);
    // let bassline = generator.generateHardstyleBassline(melody, bars);
    // let kicks = generator.generateHardstyleKick(bars);

    let melodyNotes = melody.map((note, index) => {
      return {
        uuid: crypto.randomUUID(),
        start: note.startTime,
        color: note.color,
        note: frequencyToMidiNote(note.frequency),
        label: noteLabel(frequencyToMidiNote(note.frequency)),
        duration: note.duration,
        velocity: 100,
      };
    });
    let bassNotes = bassline.map((note, index) => {
      return {
        uuid: crypto.randomUUID(),
        start: note.startTime,
        color: note.color,
        note: frequencyToMidiNote(note.frequency) - 12,
        label: noteLabel(frequencyToMidiNote(note.frequency)),
        duration: note.duration,
        velocity: 100,
      };
    });
    // let kickNotes = kicks.map((note, index) => {
    //   return {
    //     uuid: crypto.randomUUID(),
    //     start: note.startTime,
    //     color: note.color,
    //     note: frequencyToMidiNote(note.frequency),
    //     label: noteLabel(frequencyToMidiNote(note.frequency)),
    //     duration: note.duration,
    //     velocity: 100,
    //   };
    // });

    notesForDisplay = [
      ...melodyNotes,
      ...bassNotes,
      // ...kickNotes
    ];

    scrollToFirstNote(200);

    console.log(melody);
    console.log(bassline);
  }

  function generateTrance() {
    notesForDisplay = [];

    let bars = 16;

    // Start at begining
    seekToTime(0);

    // Loop the pattern
    enableLooping();
    setLoopRegion(0, 0);
    expandLoopRegion(bars * 4);

    let generator = new TranceGenerator(138);
    let melody = generator.generate(bars);

    let melodyNotes = melody.map((note, index) => {
      return {
        uuid: crypto.randomUUID(),
        start: note.startTime,
        color: note.color,
        note: frequencyToMidiNote(note.frequency),
        label: noteLabel(frequencyToMidiNote(note.frequency)),
        duration: note.duration,
        velocity: 100,
      };
    });

    console.log(melody);
    notesForDisplay = [...melodyNotes];

    // scrollToFirstNote(200);
  }

  function generateChords() {
    const scaleIntervals = scales[selectedScale];
    const chords = generateChordProgressionWithIntervals("C", scaleIntervals, selectedProgression);

    let notes = chords
      .map((chordNotes, index) => {
        let beatDuration = (60 / $bpm) * 1000;
        let barLength = 4 * beatDuration;

        return chordNotes.map((note) => {
          return {
            uuid: crypto.randomUUID(),
            start: index * barLength,
            color: "yellow",
            note: frequencyToMidiNote(note.frequency),
            label: noteLabel(frequencyToMidiNote(note.frequency)),
            duration: barLength,
            velocity: 100,
          };
        });
      })
      .flat();

    console.log(notes);

    notesForDisplay = notes;
  }

  $: beatWidth = $pixelsPerBeat;
  $: playHeadPosition = $timeToPixels($playbackState.currentTime);
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
  style="--note-height: {noteHeight}px; --beat-width: {beatWidth}px; --snap-resolution: {snapResolution};"
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
              on:mouseup={() => stopNote(midiNoteToFrequency(noteNumber))}
              on:mouseleave={() => stopNote(midiNoteToFrequency(noteNumber))}
              on:mousedown={() => startNote(midiNoteToFrequency(noteNumber))}
              class="piano-key hover:opacity-90 active:opacity-70 {isBlackKey(noteNumber) ? 'black-key' : 'white-key'}"
            >
              <span class="inline-block pr-2 font-medium">{noteLabel(noteNumber)}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
    <div class="flex flex-1 flex-col">
      <div class="mb-2 flex h-8 flex-row items-center justify-between gap-6 bg-dark-600 px-2">
        <div class="flex flex-row items-center gap-2">
          {#if $selectedClip}
            <CassetteTape class="text-accent-yellow/80" />
            <span class="whitespace-nowrap text-sm text-light">{$selectedClip?.name}</span>
            <span class="whitespace-nowrap text-sm text-light-soft">{$selectedClip?.duration?.toFixed(2)}s</span>
          {:else}
            <span class="whitespace-nowrap text-sm text-light-soft">No clip selected</span>
          {/if}
        </div>
        <div class="ml-auto flex flex-row items-center gap-2">
          <button
            on:click={generateChords}
            class="inline-flex h-full flex-row items-center gap-1 rounded-sm bg-dark-900 py-1 pl-1.5 pr-2 text-xs tracking-tight"
          >
            <PianoKeys class="text-accent-yellow/80" size="16" />
            <span class="font-medium text-accent-yellow">Chords</span>
          </button>
          <button
            on:click={generateTrance}
            class="inline-flex h-full flex-row items-center gap-1 rounded-sm bg-dark-900 py-1 pl-1.5 pr-2 text-xs tracking-tight"
          >
            <Heartbeat class="text-accent-yellow/80" size="16" />
            <span class="font-medium text-accent-yellow">Trance</span>
          </button>

          <button
            on:click={generateHardstyle}
            class="inline-flex h-full flex-row items-center gap-1 rounded-sm bg-dark-900 py-1 pl-1.5 pr-2 text-xs tracking-tight"
          >
            <Biohazard class="text-accent-yellow/80" size="16" />
            <span class="font-medium text-accent-yellow">Hardstyle</span>
          </button>

          <div class="flex flex-row items-center gap-1 rounded-sm bg-dark-400 px-1.5">
            <button
              title="Snap to grid"
              on:click={() => (snapToGrid = !snapToGrid)}
              class="py-0.5 text-xs {snapToGrid ? 'text-accent-yellow' : 'text-light-soft'}"
            >
              Snap
            </button>
            <select
              bind:value={snapResolution}
              class="bg-dark-400 py-0.5 pr-1 font-mono text-sm tracking-tight text-light"
            >
              {#each snaps as snap}
                <option value={snap.value}>{snap.label}</option>
              {/each}
            </select>
          </div>

          <div class="flex flex-row items-center gap-1 rounded-sm bg-dark-400 px-1.5">
            <span class="py-0.5 text-xs text-accent-yellow"> Scale </span>
            <select
              bind:value={selectedScale}
              class="bg-dark-400 py-0.5 pr-1 font-mono text-sm tracking-tight text-light"
            >
              {#each Object.keys(scales) as scale}
                <option value={scale}>{scale}</option>
              {/each}
            </select>
          </div>

          <div class="flex flex-row items-center gap-1 rounded-sm bg-dark-400 px-1.5">
            <span class="py-0.5 text-xs text-accent-yellow"> Progression </span>
            <select
              bind:value={selectedProgression}
              class="bg-dark-400 py-0.5 pr-1 font-mono text-sm tracking-tight text-light"
            >
              {#each progressions as progression}
                <option value={progression}>{progression.replaceAll(" - ", "-")}</option>
              {/each}
            </select>
          </div>

          <div class="flex flex-row items-center gap-1 rounded-sm bg-dark-400 px-1.5">
            <Keyboard class="text-accent-yellow/80" />
            <select
              bind:value={previewInstrument}
              class="bg-dark-400 py-0.5 pr-1 font-mono text-sm tracking-tight text-light"
            >
              {#each audioManager.instruments.keys() as instrument}
                <option value={instrument}>{instrument}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <div class="relative flex-1 bg-dark-900">
        <div
          on:scroll={syncVerticalScroll}
          on:wheel={handleZoom}
          on:click={handleClick}
          bind:this={noteArea}
          on:contextmenu|preventDefault={() => (selectedNotes = [])}
          aria-hidden="true"
          class="note-area absolute inset-0 overflow-scroll bg-dark-700/50"
        >
          <!-- Play needle -->
          <div class="playhead" style="left: {playHeadPosition}px;"></div>

          <div class="absolute inset-0">
            {#each notesArray as noteNumber}
              <div
                class={classNames("note-lane", isNoteInScale(noteNumber, selectedScale) ? "in-scale" : "not-in-scale")}
              ></div>
            {/each}
          </div>

          <!-- Notes -->
          {#each notesForDisplay as note (note.uuid)}
            <div
              aria-hidden="true"
              on:click|stopPropagation={(event) => handleNoteClick(event, note.uuid)}
              on:contextmenu|preventDefault={(event) => deleteNoteById(note.uuid)}
              on:mouseenter={() => (highlightedNote = note.label)}
              on:mousedown={(event) => handleMouseDown(event, note.uuid)}
              class:selected={selectedNotes.includes(note.uuid)}
              class:dragged={isDragging && draggedNote === note.uuid}
              class="note flex cursor-pointer select-none flex-row items-center justify-between"
              style="left: {$timeToPixels(note.start / 1000)}px; top: {calculateNoteTopPosition(
                note,
              )}px; width: {$timeToPixels(note.duration / 1000)}px; {note.color
                ? `background-color: ${note.color}`
                : ''}"
            >
              <div class="flex-1 truncate text-center">{note.label}</div>
              <div
                aria-hidden="true"
                on:mousedown={(event) => handleResizeMouseDown(event, note.uuid)}
                class="resize-handle"
              ></div>
            </div>
          {/each}
        </div>

        <!-- Debug -->
        {#if debug}
          <div
            class="absolute inset-y-0 left-0 min-w-[400px] max-w-[900px] overflow-y-scroll border-dark-800 bg-dark-600"
          >
            <div class="flex-1">
              <div class="flex h-full flex-col overflow-y-scroll">
                <div class="mb-6 grid grid-cols-4 gap-2">
                  <div class="col-span-full flex flex-col gap-1 p-2">
                    <div class="text-xs text-light-soft">BPM</div>
                    <div class="text-light">
                      <pre class="border border-dark-200 bg-dark-500 p-2 text-xs">{JSON.stringify(
                          getBpmFromMidi($selectedClip?.midiData),
                          null,
                          2,
                        )}</pre>
                    </div>
                  </div>
                </div>

                <table class="text-left">
                  <thead>
                    <tr>
                      <th class="whitespace-nowrap px-3 font-mono text-xs">Start</th>
                      <th class="whitespace-nowrap px-3 font-mono text-xs">Duration</th>
                      <th class="whitespace-nowrap px-3 font-mono text-xs">Velocity</th>
                      <th class="whitespace-nowrap px-3 font-mono text-xs">Note Num</th>
                      <th class="whitespace-nowrap px-3 font-mono text-xs">Label</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-dark-500">
                    {#each notesForDisplay as event}
                      <tr class="hover:bg-dark-200">
                        <td class="whitespace-nowrap px-3 py-0.5 font-mono text-xs">
                          {(event.start / 1000).toFixed(3)}s
                        </td>
                        <td class="whitespace-nowrap px-3 py-0.5 font-mono text-xs">
                          {(event.duration / 1000).toFixed(3)}s
                        </td>
                        <td class="whitespace-nowrap px-3 py-0.5 font-mono text-xs">{event.velocity}</td>
                        <td class="whitespace-nowrap px-3 py-0.5 font-mono text-xs">{event.note}</td>
                        <td class="whitespace-nowrap px-3 py-0.5 font-mono text-xs">{event.label}</td>
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
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .piano-roll::-webkit-scrollbar {
    display: none;
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

  .piano-key.black-key {
    background-color: black;
    color: white;
  }

  .piano-key.white-key {
    background-color: white;
  }

  /*noinspection ALL*/
  .note-area {
    background: repeating-linear-gradient(
        to right,
        hsl(0, 0%, 100%, 10%),
        hsl(0, 0%, 100%, 10%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width) / 4) /* BEAT  ( 1/4 bar) */
      ),
      repeating-linear-gradient(
        to right,
        hsl(60, 100%, 50%, 20%),
        hsl(60, 100%, 50%, 20%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width)) /* BAR */
      ),
      repeating-linear-gradient(
        to right,
        hsl(0, 0%, 100%, 5%),
        hsl(0, 0%, 100%, 5%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width) * var(--snap-resolution)) /* SNAP */
      );
    background-attachment: local;
    background-repeat: no-repeat;
    background-size: 100% 200%;
    background-position: left calc(-1 * var(--note-height) * 4);
  }

  .note-lane {
    height: calc(var(--note-height));
  }

  .note-lane.in-scale {
    background-color: white;
    opacity: 2%;
    border-top: 2px solid black;
  }

  .note-lane.not-in-scale {
    visibility: hidden;
  }

  .note {
    position: absolute;
    background: hsl(60, 100%, 80%);
    color: hsl(0, 0%, 0%, 80%);
    font-size: 8px;
    height: var(--note-height);
    border-radius: 2px;
    padding-left: 8px;
    font-weight: 500;
    border: 0.5px solid hsl(0, 0%, 0%, 20%);
  }

  .note .resize-handle {
    width: 8px;
    height: 100%;
    display: inline-block;
    cursor: col-resize;
    background-color: transparent;
  }

  .note.selected {
    background: rgb(153, 224, 255);
  }

  .note.dragged {
    filter: grayscale(1) opacity(0.5);
  }

  .note.active {
    background: rgb(182, 255, 153);
  }

  .note.inactive {
    background: hsl(0, 0%, 90%);
  }

  .playhead {
    position: absolute;
    width: 1px;
    top: 0;
    height: calc((var(--note-height) * 12 * 10));
    background: hsl(0, 90%, 55%);
  }
</style>
