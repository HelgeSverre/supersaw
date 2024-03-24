<script>
  import {
    ChevronDown,
    Circle,
    Drum,
    Play,
    Search,
    Soup,
    Square,
    ZoomIn,
    ZoomOut,
  } from "lucide-svelte";
  import Track from "./lib/ui/Track.svelte";

  import {
    bpm,
    createDummyTracks,
    loadDefaultTracks,
    tracks,
    zoomByDelta,
    zoomIn,
    zoomLevel,
    zoomOut,
  } from "./core/store.js";
  import SegmentGroup from "./lib/SegmentGroup.svelte";
  import IconButton from "./lib/IconButton.svelte";
  import TextDisplay from "./lib/TextDisplay.svelte";
  import TextButton from "./lib/TextButton.svelte";

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault(); // Prevent the page from scrolling horizontally
      zoomByDelta(event.deltaY);
      tracks.update((currentTracks) => currentTracks); // This is just to trigger reactivity, replace with your actual update logic
    }
  }
</script>

<main>
  <div>
    <div
      class="flex h-full w-full items-center justify-between border-b-2 border-dark-900 bg-dark-300 bg-gradient-to-t from-dark-400 via-dark-300 to-dark-300 px-2 py-2"
    >
      <div class="text-xs font-medium leading-none text-white/40">H-DAW</div>
      <div class="text-xs font-medium leading-none text-white/40">v0.0.1</div>
    </div>
  </div>
  <section class="bg-dark-600">
    <div class="flex h-14 flex-row items-center">
      <div
        class="flex h-full w-[250px] shrink-0 items-center border-r-2 border-dark-900 px-2"
      >
        <div class="relative h-fit w-full rounded bg-dark-400">
          <div
            class="absolute inset-y-0 left-2 flex items-center justify-center"
          >
            <Search size="16" class="text-light-soft" />
          </div>

          <input
            type="search"
            placeholder="Instruments, effects audio..."
            class="h-10 w-full text-ellipsis bg-transparent pl-8 text-sm font-normal placeholder-light-secondary focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent"
          />
        </div>
      </div>

      <div
        class="flex w-full flex-row items-center justify-start gap-x-3 px-2 py-2"
      >
        <button
          class="group inline-flex flex-row gap-1 overflow-hidden rounded"
        >
          <TextDisplay text="4/4" />

          <span
            class="inline-flex h-10 items-center justify-center bg-dark-400 px-1 font-bold text-light group-hover:bg-dark-200"
          >
            <ChevronDown size="20" />
          </span>
        </button>

        <SegmentGroup>
          <TextDisplay text="{$bpm} bpm" />
          <TextButton text="TAP" />
        </SegmentGroup>

        <SegmentGroup>
          <IconButton icon={Play} />
          <IconButton icon={Square} />
          <IconButton icon={Circle} />
        </SegmentGroup>

        <div class="ml-auto">
          <SegmentGroup additionalClasses="mx-8">
            <IconButton icon={Drum} onClick={createDummyTracks} />
            <IconButton icon={Soup} onClick={loadDefaultTracks} />
          </SegmentGroup>

          <SegmentGroup>
            <IconButton icon={ZoomIn} onClick={zoomIn} />
            <TextDisplay
              text={`${Math.round($zoomLevel)}%`}
              additionalClasses="w-14 text-center select-none"
            />
            <IconButton icon={ZoomOut} onClick={zoomOut} />
          </SegmentGroup>
        </div>
      </div>
    </div>
  </section>

  <!-- Timeline -->
  <section class="timeline" on:wheel={handleZoom}>
    <!-- Tracks -->
    <div class="flex flex-col gap-4 p-2">
      {#each $tracks as track}
        <Track {track} />
      {/each}
    </div>
  </section>
</main>
