<script>
  import {
    ChevronDown,
    Dice1,
    Dice2,
    Dice3,
    Dice4,
    Drum,
    Pause,
    Play,
    Square,
    SquareScissors,
    Trash,
    Warehouse,
    ZoomIn,
    ZoomOut,
  } from "lucide-svelte";
  import Track from "./lib/daw/Track.svelte";

  import {
    bpm,
    changeBpm,
    clearTracks,
    createDummyDrumTracks,
    createDummyHouseTracks,
    createDummyTranceTracks,
    expandLoopRegion,
    loopRegion,
    nudge,
    pausePlayback,
    pixelsToTime,
    playbackState,
    setLoopRegion,
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
  import Browser from "./lib/daw/Browser.svelte";

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault(); // Prevent the page from scrolling horizontally
      zoomByDelta(event.deltaY);
    }
  }

  onMount(() => {
    if ($tracks.length === 0) {
      // createDrumPattern({
      //   name: "Bass Drum",
      //   folder: "BD",
      //   pattern: [1, 1, 1, 1], // Basic 4/4 beat
      //   bpm: $bpm,
      //   baseVolume: 1, // Full volume
      //   variations: ["0000"],
      // }).then((track) => addTrack(track));

      createDummyDrumTracks();
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

    if (startPixels > endPixels) {
      [startPixels, endPixels] = [endPixels, startPixels];
    }

    const delta = endPixels - startPixels;

    if (Math.abs(delta) < 5) {
      return;
    }

    setLoopRegion($pixelsToTime(startPixels), $pixelsToTime(delta));
  }

  $: playHeadPosition = $timeToPixels($playbackState.currentTime);
  $: looper = {
    active: $loopRegion.active,
    left: $timeToPixels($loopRegion.start),
    right: $timeToPixels($loopRegion.end),
  };
</script>

<svelte:window on:keydown={handleKeydown} on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<main class="flex flex-1 flex-col">
  <TopBar />

  <!-- Control Panel -->
  <section class="bg-dark-600">
    <div class="flex h-14 flex-row items-center">
      <div class="flex h-full w-[250px] shrink-0 items-center border-r-2 border-dark-900 px-2">
        <Browser />
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
        </SegmentGroup>

        <TextDisplay text={formatTime($playbackState.currentTime)} additionalClasses="tabular-nums" />
        <TextDisplay
          text={`${formatTime($loopRegion.start)} - ${formatTime($loopRegion.end)}`}
          additionalClasses="tabular-nums text-dark-soft"
        />

        <div class="ml-auto flex flex-row items-center justify-end gap-8">
          <SegmentGroup>
            <IconButton icon={Drum} onClick={createDummyDrumTracks} />
            <IconButton icon={SquareScissors} onClick={createDummyTranceTracks} />
            <IconButton icon={Warehouse} onClick={createDummyHouseTracks} />
          </SegmentGroup>

          <SegmentGroup>
            <IconButton icon={Dice1} onClick={() => expandLoopRegion(1)} />
            <IconButton icon={Dice2} onClick={() => expandLoopRegion(2)} />
            <IconButton icon={Dice3} onClick={() => expandLoopRegion(3)} />
            <IconButton icon={Dice4} onClick={() => expandLoopRegion(4)} />
          </SegmentGroup>
          <SegmentGroup>
            <IconButton icon={Trash} onClick={clearTracks} />
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
  {#if $tracks.length}
    <section
      class="timeline relative h-full overflow-hidden"
      class:select-none={dragging}
      bind:this={timeline}
      on:wheel={handleZoom}
    >
      <div class="relative">
        <div
          bind:this={selectionArea}
          on:mousedown|self={handleMouseDown}
          aria-hidden="true"
          class=" relative left-[250px] mt-2 h-6 bg-dark-600"
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
        <div class="relative flex flex-col gap-2 p-2">
          <!-- Loop selection indication on timeline -->
          <div
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
  {:else}
    <div class="m-8 flex flex-1 items-center justify-center">
      <div class="text-center text-sm text-dark-100">No tracks</div>
    </div>
  {/if}

  <MixerPanel />
</main>
