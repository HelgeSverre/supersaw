<script>
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
  import { Track } from "./core/track.js";
  import Piano from "./lib/daw/Piano.svelte";
  import Kick from "./lib/daw/instruments/Kick.svelte";
  import TransistorBass from "./lib/daw/instruments/TransistorBass.svelte";
  import Tenori from "./lib/daw/instruments/Tenori.svelte";

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
      let track = new Track(crypto.randomUUID(), "Melody", "instrument");

      track.clips = [clip];
      track.instrument = "supersaw";

      addTrack(track);
    });
  }

  function handleKeydown(event) {
    const { key, keyCode } = event;

    // Spacebar - Play/Pause globally
    if (key === " ") {
      event.preventDefault();

      if ($currentView === "timeline" || $currentView === "midi") {
        if ($playbackState.playing) {
          pausePlayback();
        } else {
          startPlayback();
        }
      }
    }

    if (event.shiftKey && key === "I") {
      instrumentDialog.showModal();
    }
    if (event.shiftKey && key === "O") {
      synthDialog.showModal();
    }

    // prettier-ignore
    const keyToViewMap = {
      49: "timeline",   // Shift + 1
      50: "midi",       // Shift + 2
      51: "playground", // Shift + 3
      52: "blofeld",    // Shift + 4
      53: "blank",      // Shift + 5
      54: "piano",      // Shift + 6
      55: "kick",       // Shift + 7
      56: "tb303",       // Shift + 8
      57: "tenori"       // Shift + 9
    };

    if (event.shiftKey && keyToViewMap[keyCode]) {
      switchView(keyToViewMap[keyCode]);
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

<main class="flex flex-1 flex-col">
  <!-- Control Panel -->
  <Toolbar />

  <!-- Timeline -->
  <div class="flex size-full flex-col">
    <div class="flex h-full flex-col gap-1 border-b border-dark-500 bg-dark-800">
      <!--      <div class="flex grow-0 flex-row flex-nowrap gap-1">-->
      <!--        <button-->
      <!--          on:click={() => switchView("timeline")}-->
      <!--          class="text-light-y rounded bg-dark-600 px-3 py-1 text-sm leading-none"-->
      <!--        >-->
      <!--          Timeline-->
      <!--        </button>-->
      <!--        <button-->
      <!--          on:click={() => switchView("midi")}-->
      <!--          class="rounded bg-dark-600 px-3 py-1 text-sm leading-none text-light-secondary"-->
      <!--        >-->
      <!--          Midi-->
      <!--        </button>-->
      <!--        <button-->
      <!--          on:click={() => switchView("playground")}-->
      <!--          class="rounded bg-dark-600 px-3 py-1 text-sm leading-none text-light-secondary"-->
      <!--        >-->
      <!--          Play-->
      <!--        </button>-->
      <!--        <button-->
      <!--          on:click={() => switchView("none")}-->
      <!--          class="rounded bg-dark-600 px-3 py-1 text-sm leading-none text-light-secondary"-->
      <!--        >-->
      <!--          Design-->
      <!--        </button>-->
      <!--      </div>-->
      <div class="min-h-0 shrink-0 grow bg-dark-900">
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
        {:else if $currentView === "blofeld"}
          <div>
            <Blofeld />
          </div>
        {:else if $currentView === "piano"}
          <section class="flex h-full flex-1 grow items-center justify-center">
            <Piano />
          </section>
        {:else if $currentView === "kick"}
          <section class="flex h-full flex-1 grow items-center justify-center">
            <Kick />
          </section>
        {:else if $currentView === "blank"}
          <section class="flex h-full flex-1 grow items-center justify-center">
            <div class="text-center text-sm text-dark-100">"Silence is a source of great strength." — Lao Tzu</div>
          </section>
        {:else if $currentView === "tb303"}
          <section class="flex h-full flex-1 grow items-center justify-center">
            <TransistorBass />
          </section>
        {:else if $currentView === "tenori"}
          <section class="flex h-full flex-1 grow items-center justify-center">
            <Tenori />
          </section>
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
