<script>
  import "./palette.css";

  import {
    addTrack,
    changeBpm,
    clearTracks,
    currentView,
    nudge,
    pausePlayback,
    playbackState,
    startPlayback,
    switchView,
    tracks,
  } from "./core/store.js";
  import { onMount } from "svelte";
  import MixerPanel from "./lib/daw/MixerPanel.svelte";
  import MidiEditor from "./lib/daw/MidiEditor.svelte";
  import Synth from "./lib/daw/instruments/Synth.svelte";
  import { createMidiClipFromUrl } from "./core/midi.js";
  import DesignSystem from "./lib/ui/DesignSystem.svelte";
  import Instrument from "./lib/daw/instruments/Instrument.svelte";
  import { createDrumPattern, createStepSequencerPattern } from "./utils/drumpattern.js";
  import Toolbar from "./lib/daw/Toolbar.svelte";
  import Timeline from "./lib/daw/Timeline.svelte";
  import Blofeld from "./lib/daw/instruments/Blofeld.svelte";
  import { currentTheme } from "./core/theme.js";

  let instrumentDialog;
  let synthDialog;

  onMount(() => {
    if ($tracks.length === 0) {
      createTranceDemo();
    }
  });

  function createTranceDemo() {
    clearTracks();
    changeBpm(138);

    createDrumPattern({
      name: "Bass Drum",
      steps: createStepSequencerPattern(16 * 2, 8, [1, 0, 0, 0]),
      kit: "trance",
      bpm: 138,
      variations: ["TR-909Kick.wav"],
    }).then((track) => {
      track.isMuted = true;

      addTrack(track);
    });

    createMidiClipFromUrl("/midi/moon-loves-the-sun.mid", "Nu-NRG - Moon Loves The Sun").then((clip) => {
      addTrack({
        id: crypto.randomUUID(),
        type: "instrument",
        instrument: "supersaw",
        name: "Melody",
        isMuted: false,
        isSolo: false,
        clips: [clip],
      });
    });
  }

  function handleKeydown(event) {
    const { key, keyCode } = event;

    // Spacebar - Play/Pause globally
    if (key === " ") {
      event.preventDefault();

      if ($playbackState.playing) {
        pausePlayback();
      } else {
        startPlayback();
      }
    }

    if (event.shiftKey && key === "I") {
      instrumentDialog.showModal();
    }
    if (event.shiftKey && key === "O") {
      synthDialog.showModal();
    }

    // Shift + 1 - Switch to timeline view
    if (event.shiftKey && keyCode === 49) {
      switchView("timeline");
    }

    // Shift + 2 - Switch to midi view
    if (event.shiftKey && keyCode === 50) {
      switchView("midi");
    }

    // Shift + 3 - Switch to midi view
    if (event.shiftKey && keyCode === 51) {
      switchView("playground");
    }

    // Shift + 4, wip
    if (event.shiftKey && keyCode === 52) {
      switchView("wip");
    }

    // Arrow keys - Move playhead left/right by 100 ms, if shift, move by 1 second
    if (keyCode === 37) {
      // Left arrow
      nudge(event.shiftKey ? -1000 : -100);
    } else if (keyCode === 39) {
      // Right arrow
      nudge(event.shiftKey ? 1000 : 100);
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />
<main class="workspace flex flex-1 flex-col {$currentTheme}">
  <!-- Control Panel -->
  <Toolbar />

  <!-- Timeline -->
  <div class=" flex size-full flex-col">
    <div class=" flex h-full flex-col gap-1 border-b border-dark-500">
      <div class="min-h-0 shrink-0 grow">
        {#if $currentView === "timeline" && $tracks.length}
          <section class="flex size-full flex-1">
            <Timeline />
          </section>
        {:else if $currentView === "midi"}
          <section class="relative h-full overflow-hidden">
            <MidiEditor />
          </section>
        {:else if $currentView === "playground"}
          <DesignSystem />
        {:else if $currentView === "wip"}
          <div>
            <Blofeld />
          </div>
        {:else}
          <section class="flex h-full flex-1 grow items-center justify-center">
            <div class="text-center text-sm text-dark-100">No tracks</div>
          </section>
        {/if}
      </div>
    </div>
  </div>

  <Synth bind:modal={synthDialog} />
  <Instrument bind:modal={instrumentDialog} />

  <MixerPanel />
</main>

<style>
  .workspace {
    background-color: var(--desktop);
  }
</style>
