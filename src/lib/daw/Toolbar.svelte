<script>
  import {
    bpm,
    changeBpm,
    clearTracks,
    createAudioTrack,
    createInstrumentTrack,
    currentView,
    loopRegion,
    pausePlayback,
    playbackState,
    startPlayback,
    stopPlayback,
    toggleLooping,
  } from "../../core/store.js";
  import { Pause, Play, Plus, Repeat2, Square, Trash } from "lucide-svelte";
  import { formatTime, formatTimeDuration } from "../../core/utils.js";
  import { Lightbulb, Waveform } from "phosphor-svelte";
  import SegmentGroup from "../ui/SegmentGroup.svelte";
  import AudioVisualizer from "./analyzers/AudioVisualizer.svelte";
  import TextDisplay from "../ui/TextDisplay.svelte";
  import Spectrogram from "./analyzers/Spectrogram.svelte";
  import IconButton from "../ui/IconButton.svelte";
  import TextButton from "../ui/TextButton.svelte";
  import { availableThemes, changeTheme, currentTheme } from "../../core/theme.js";
  import Select from "../ui/Input/Select.svelte";
</script>

<section class="toolbar px-2">
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
          <IconButton icon={Plus} onClick={() => createInstrumentTrack()} />
          <IconButton icon={Waveform} onClick={() => createAudioTrack()} />
          <IconButton icon={Trash} onClick={clearTracks} />
        </SegmentGroup>
        <SegmentGroup>
          <Select
            placeholder="Theme"
            value={$currentTheme}
            on:change={(e) => {
              changeTheme(e.detail);
            }}
            options={$availableThemes.map((theme) => ({ value: theme, label: theme }))}
          />

          <IconButton icon={Lightbulb} onClick={() => changeTheme("ableton")} />
        </SegmentGroup>
      </div>
    </div>
  </div>
</section>

<style>
  .toolbar {
    background-color: var(--desktop);
  }
</style>
