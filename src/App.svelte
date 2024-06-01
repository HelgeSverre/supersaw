<script>
  import { Lightbulb, Pause, Play, Plus, Repeat2, Square, Trash } from "lucide-svelte";
  import Track from "./lib/daw/Track.svelte";

  import {
    addTrack,
    bpm,
    changeBpm,
    clearTracks,
    createAudioTrack,
    createInstrumentTrack,
    currentView,
    enableLooping,
    loopRegion,
    nudge,
    pausePlayback,
    pixelsToTime,
    playbackState,
    setLoopRegion,
    startPlayback,
    stopPlayback,
    switchView,
    timeToPixels,
    toggleLooping,
    tracks,
    zoomByDelta
  } from "./core/store.js";
  import { formatTime, formatTimeDuration } from "./core/utils.js";
  import SegmentGroup from "./lib/ui/SegmentGroup.svelte";
  import IconButton from "./lib/ui/IconButton.svelte";
  import TextDisplay from "./lib/ui/TextDisplay.svelte";
  import TextButton from "./lib/ui/TextButton.svelte";
  import { onMount } from "svelte";
  import MixerPanel from "./lib/daw/MixerPanel.svelte";
  import MidiEditor from "./lib/daw/MidiEditor.svelte";
  import Synth from "./lib/daw/instruments/Synth.svelte";
  import { createMidiClipFromUrl } from "./core/midi.js";
  import AudioVisualizer from "./lib/daw/analyzers/AudioVisualizer.svelte";
  import DesignSystem from "./lib/ui/DesignSystem.svelte";
  import Instrument from "./lib/daw/instruments/Instrument.svelte";
  import { createDrumPattern, createStepSequencerPattern } from "./utils/drumpattern.js";
  import Spectrogram from "./lib/daw/analyzers/Spectrogram.svelte";
  import { Waveform } from "phosphor-svelte";

  let instrumentDialog;
  let synthDialog;

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault();
      zoomByDelta(event.deltaY);
    }
  }

  onMount(() => {
    if ($tracks.length === 0) {
      clearTracks();
      changeBpm(138);

      createDrumPattern({
        name: "Bass Drum",
        steps: createStepSequencerPattern(16 * 2, 8, [1, 0, 0, 0]),
        kit: "trance",
        bpm: 138,
        variations: ["TR-909Kick.wav"]
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
          clips: [clip]
        });
      });
    }
  });

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

    // Shift + 2 - Switch to midi view
    if (event.shiftKey && keyCode === 51) {
      switchView("playground");
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

  let timeline;
  let selectionArea;
  let dragging = false;
  let startPixels = 0;
  let endPixels = 0;

  function handleMouseDown(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    startPixels = event.clientX - rect.left;
    endPixels = startPixels;
    dragging = true;
  }

  function handleMouseMove(event) {
    if (dragging) {
      const rect = selectionArea.getBoundingClientRect();
      endPixels = event.clientX - rect.left;
      if (endPixels < 0) {
        endPixels = 0;
      }
    }
  }

  function handleMouseUp(event) {
    if (!dragging) {
      return;
    }

    dragging = false;
    const rect = selectionArea.getBoundingClientRect();
    endPixels = event.clientX - rect.left;

    // Ensure startPixels is always the leftmost pixel
    if (startPixels > endPixels) {
      [startPixels, endPixels] = [endPixels, startPixels];
    }

    // Prevent selection outside the timeline
    if (startPixels < 0) {
      startPixels = 0;
    }

    const delta = endPixels - startPixels;

    if (Math.abs(delta) < 10) {
      return;
    }

    setLoopRegion($pixelsToTime(startPixels), $pixelsToTime(endPixels));
    enableLooping();
  }

  function toggleTheme() {
    if (document.documentElement.classList.contains("theme-dark")) {
      document.documentElement.classList.remove("theme-dark");
      document.documentElement.classList.add("theme-light");
    } else {
      document.documentElement.classList.remove("theme-light");
      document.documentElement.classList.add("theme-dark");
    }
  }

  $: playHeadPosition = $timeToPixels($playbackState.currentTime);
  $: looper = {
    active: $loopRegion.active,
    left: $timeToPixels($loopRegion.start),
    right: $timeToPixels($loopRegion.end - $loopRegion.start)
  };
</script>

<svelte:window on:keydown={handleKeydown} on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<main class="flex flex-1 flex-col">
  <!-- Control Panel -->
  <section class="bg-dark-600 px-2">
    <div class="flex h-14 flex-row items-center gap-2">
      <!--      <div class="flex h-full w-[250px] shrink-0 items-center">-->
      <!--        <Browser />-->
      <!--      </div>-->

      <div class="flex w-full flex-row items-center justify-start gap-x-2 py-2">
        <SegmentGroup>
          <TextButton onClick={() => changeBpm(prompt("Enter new BPM", $bpm) ?? $bpm)} text="{$bpm} bpm" />
        </SegmentGroup>

        <SegmentGroup>
          {#if $playbackState.playing}
            <IconButton icon={Pause} onClick={pausePlayback} />
          {:else}
            <IconButton icon={Play} onClick={startPlayback} />
          {/if}
          <IconButton icon={Square} onClick={stopPlayback} />
          <IconButton
            icon={Repeat2}
            onClick={toggleLooping}
            additionalClasses={$loopRegion.active ? "!text-accent-yellow" : ""}
          />
        </SegmentGroup>

        <TextDisplay text={formatTimeDuration($playbackState.currentTime)} additionalClasses="tabular-nums" />

        {#if $loopRegion.active}
          <TextDisplay
            text={`${formatTime($loopRegion.start)} - ${formatTime($loopRegion.end)}`}
            additionalClasses="tabular-nums text-dark-soft"
          />
        {/if}

        <AudioVisualizer />
        <Spectrogram />

        <div class="ml-auto flex flex-row items-center justify-end gap-8">
          <SegmentGroup>
            <TextDisplay text={$currentView} />
            <IconButton icon={Plus} onClick={() => createInstrumentTrack()} />
            <IconButton icon={Waveform} onClick={() => createAudioTrack()} />
            <IconButton icon={Trash} onClick={clearTracks} />
            <IconButton icon={Lightbulb} onClick={toggleTheme} />
          </SegmentGroup>
        </div>
      </div>
    </div>
  </section>

  <!-- Timeline -->
  {#if $currentView === "timeline" && $tracks.length}
    <section
      class="relative h-full overflow-hidden"
      class:select-none={dragging}
      bind:this={timeline}
      on:wheel={handleZoom}
    >
      <div class="relative">
        <div
          bind:this={selectionArea}
          on:mousedown|self={handleMouseDown}
          aria-hidden="true"
          class="relative left-[250px] mt-2 h-6 bg-dark-600"
        >
          <!-- todo: allow moving the selection area  -->
          <!-- Loop selection indication on "minimap" -->
          <div
            class="pointer-events-none absolute inset-y-px z-20 border-x border-teal-300 bg-teal-300/50"
            style:left={dragging ? Math.min(startPixels, endPixels) + "px" : looper.left + "px"}
            style:width={dragging ? Math.abs(endPixels - startPixels) + "px" : looper.right + "px"}
          ></div>
          <div style="left: {playHeadPosition}px;" class="absolute inset-y-0 z-50 w-[1px] bg-red-500"></div>

          <!--{#each $tracks as track}-->
          <!--  {#each track.clips as clip}-->
          <!--    <div-->
          <!--      class="absolute inset-y-0 z-10 bg-accent-yellow/10 border-x border-white "-->
          <!--      style="left: {$timeToPixels(clip.startTime)}px; width: {$timeToPixels(clip.duration)}px;"-->
          <!--    ></div>-->
          <!--  {/each}-->
          <!--{/each}-->
        </div>

        <!-- Tracks -->
        <div class="relative flex flex-col gap-2 overflow-x-scroll p-2">
          <!-- Loop selection indication on timeline -->
          <div
            class:hidden={!$loopRegion.active}
            class="pointer-events-none absolute inset-y-px z-20 ml-[250px] border-x border-teal-300/70 bg-teal-300/10"
            style:left={dragging ? Math.min(startPixels, endPixels) + "px" : looper.left + "px"}
            style:width={dragging ? Math.abs(endPixels - startPixels) + "px" : looper.right + "px"}
          ></div>

          <div style="left: {playHeadPosition}px;" class="absolute inset-y-0 z-50 ml-[250px] w-[1px] bg-red-500"></div>

          {#each $tracks as track}
            <Track track={track} />
          {/each}
        </div>
      </div>
    </section>
  {:else if $currentView === "midi"}
    <section class="relative h-full overflow-hidden">
      <MidiEditor />
    </section>
  {:else if $currentView === "instrument"}
    <div class="m-8 flex flex-1 items-center justify-center">
      <Synth />
    </div>
  {:else if $currentView === "playground"}
    <DesignSystem />
  {:else}
    <div class="m-8 flex flex-1 items-center justify-center">
      <div class="text-center text-sm text-dark-100">No tracks</div>
    </div>
  {/if}

  <Synth bind:modal={synthDialog} />
  <Instrument bind:modal={instrumentDialog} />

  <MixerPanel />
</main>
