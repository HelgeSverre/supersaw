<script>
  import {
    ChevronDown,
    Drum,
    Pause,
    Play,
    Search,
    Square,
    SquareScissors,
    Warehouse,
    ZoomIn,
    ZoomOut,
  } from "lucide-svelte";
  import Track from "./lib/daw/Track.svelte";

  import {
    bpm,
    changeBpm,
    createDummyDrumTracks,
    createDummyHouseTracks,
    createDummyTranceTracks,
    nudge,
    pausePlayback,
    playbackState,
    startPlayback,
    stopPlayback,
    timeToPixels,
    tracks,
    zoomByDelta,
    zoomIn,
    zoomLevel,
    zoomOut,
  } from "./core/store.js";
  import { formatTime } from "./core/utils.js";
  import SegmentGroup from "./lib/ui/SegmentGroup.svelte";
  import IconButton from "./lib/ui/IconButton.svelte";
  import TextDisplay from "./lib/ui/TextDisplay.svelte";
  import TextButton from "./lib/ui/TextButton.svelte";
  import { onMount } from "svelte";
  import TopBar from "./lib/layout/TopBar.svelte";
  import MixerPanel from "./lib/daw/MixerPanel.svelte";

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault(); // Prevent the page from scrolling horizontally
      zoomByDelta(event.deltaY);
    }
  }

  onMount(() => {
    if ($tracks.length === 0) {
      createDummyHouseTracks();
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

    // Arrow keys - Move playhead left/right by 100 ms, if shift, move by 1 second
    if (keyCode === 37) {
      // Left arrow
      nudge(event.shiftKey ? -1000 : -100);
    } else if (keyCode === 39) {
      // Right arrow
      nudge(event.shiftKey ? 1000 : 100);
    }
  }

  $: playHeadPosition = $timeToPixels($playbackState.currentTime);
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
  <TopBar />

  <!-- Control Panel -->
  <section class="bg-dark-600">
    <div class="flex h-14 flex-row items-center">
      <div class="flex h-full w-[250px] shrink-0 items-center border-r-2 border-dark-900 px-2">
        <div class="relative h-fit w-full rounded bg-dark-400">
          <div class="absolute inset-y-0 left-2 flex items-center justify-center">
            <Search size="16" class="text-light-soft" />
          </div>

          <input
            type="search"
            placeholder="Instruments, effects audio..."
            class="h-10 w-full text-ellipsis bg-transparent pl-8 text-sm font-normal placeholder-light-secondary focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
          />
        </div>
      </div>

      <div class="flex w-full flex-row items-center justify-start gap-x-3 px-2 py-2">
        <button class="group inline-flex flex-row gap-1 overflow-hidden rounded">
          <TextDisplay text="4/4" />

          <span
            class="inline-flex h-10 items-center justify-center bg-dark-400 px-1 font-bold text-light group-hover:bg-dark-200"
          >
            <ChevronDown size="20" />
          </span>
        </button>

        <SegmentGroup>
          <TextButton onClick={() => changeBpm(prompt("Enter new BPM", $bpm))} text="{$bpm} bpm" />
        </SegmentGroup>

        <SegmentGroup>
          {#if $playbackState.playing}
            <IconButton icon={Pause} onClick={pausePlayback} />
          {:else}
            <IconButton icon={Play} onClick={startPlayback} />
          {/if}
          <IconButton icon={Square} onClick={stopPlayback} />

          {#if $playbackState.playing}
            <TextDisplay text="Playing" additionalClasses="text-green-500" />
          {:else if $playbackState.currentTime === 0}
            <TextDisplay text="Stopped" additionalClasses="text-red-500" />
          {:else}
            <TextDisplay text="Paused" additionalClasses="text-yellow-500" />
          {/if}
        </SegmentGroup>

        <TextDisplay text={formatTime($playbackState.currentTime)} />

        <div class="ml-auto">
          <SegmentGroup additionalClasses="mx-8">
            <IconButton icon={Drum} onClick={createDummyDrumTracks} />
            <IconButton icon={SquareScissors} onClick={createDummyTranceTracks} />
            <IconButton icon={Warehouse} onClick={createDummyHouseTracks} />
          </SegmentGroup>

          <SegmentGroup>
            <IconButton icon={ZoomIn} onClick={zoomIn} />
            <TextDisplay text={`${Math.round($zoomLevel)}%`} additionalClasses="w-14 text-center select-none" />
            <IconButton icon={ZoomOut} onClick={zoomOut} />
          </SegmentGroup>
        </div>
      </div>
    </div>
  </section>

  <!-- Timeline -->
  <section class="timeline relative" on:wheel={handleZoom}>
    <div style="left: {playHeadPosition}px;" class="absolute inset-y-0 z-50 ml-[250px] w-[2px] bg-red-500"></div>

    <!-- Tracks -->
    <div class="flex flex-col gap-2 p-2">
      {#each $tracks as track}
        <Track track={track} />
      {/each}
    </div>
  </section>

  <MixerPanel />
</main>
