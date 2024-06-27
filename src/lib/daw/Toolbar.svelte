<script>
  import {
    bpm,
    changeBpm,
    clearTracks,
    createAudioTrack,
    createDummyTranceTracks,
    createInstrumentTrack,
    currentView,
    loopRegion,
    pausePlayback,
    playbackState,
    startPlayback,
    stopPlayback,
    switchView,
    toggleLooping,
    zoomIn,
    zoomOut
  } from "../../core/store.js";
  import { Drum, Pause, Play, Plus, Repeat2, Square, Trash, ZoomIn, ZoomOut } from "lucide-svelte";
  import { formatTime, formatTimeDuration } from "../../core/utils.js";
  import { Lightbulb, Waveform } from "phosphor-svelte";
  import SegmentGroup from "../ui/SegmentGroup.svelte";
  import AudioVisualizer from "./analyzers/AudioVisualizer.svelte";
  import TextDisplay from "../ui/TextDisplay.svelte";
  import Spectrogram from "./analyzers/Spectrogram.svelte";
  import IconButton from "../ui/IconButton.svelte";
  import TextButton from "../ui/TextButton.svelte";
  import Select from "../ui/Input/Select.svelte";

  function toggleTheme() {
    if (document.documentElement.classList.contains("theme-dark")) {
      document.documentElement.classList.remove("theme-dark");
      document.documentElement.classList.add("theme-light");
    } else {
      document.documentElement.classList.remove("theme-light");
      document.documentElement.classList.add("theme-dark");
    }
  }
</script>

<section class="bg-dark-600 px-2">
  <div class="flex h-14 flex-row items-center gap-2">
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
          <IconButton icon={Drum} onClick={() => createDummyTranceTracks()} />
          <IconButton icon={Plus} onClick={() => createInstrumentTrack()} />
          <IconButton icon={Waveform} onClick={() => createAudioTrack()} />
          <IconButton icon={Trash} onClick={clearTracks} />
          <IconButton icon={Lightbulb} onClick={toggleTheme} />
        </SegmentGroup>

        <SegmentGroup>
          <IconButton icon={ZoomIn} onClick={() => zoomIn()} />
          <IconButton icon={ZoomOut} onClick={() => zoomOut()} />
        </SegmentGroup>
      </div>
      <SegmentGroup>
        <Select
          value={$currentView}
          on:change={(option) => switchView(option.detail)}
          options={[
            { value: "timeline", label: "Timeline (Shift + 1)" },
            { value: "midi", label: "Midi Editor (Shift + 2)" },
            { value: "playground", label: "Playground (Shift + 3)" },
            { value: "blofeld", label: "Blofeld (Shift + 4)" },
            { value: "blank", label: "Blank (Shift + 5)" },
            { value: "piano", label: "Piano (Shift + 6)" },
            { value: "kick", label: "Kick Generator (Shift + 7)" },
            { value: "tb303", label: "TR-303 (Shift + 8)" },
            { value: "tr707", label: "Rythm Composer TR707" },
            { value: "audio-editor", label: "Audio Editor" },
            { value: "sampler", label: "Sampler" },
          ]}
        />
      </SegmentGroup>
    </div>
  </div>
</section>
