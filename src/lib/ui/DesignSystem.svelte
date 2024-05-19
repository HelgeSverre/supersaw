<script>
  import Knob from "./Knob.svelte";
  import IconButton from "./IconButton.svelte";
  import { Metronome, Playlist, PlayPause, Stop } from "phosphor-svelte";
  import TextButton from "./TextButton.svelte";
  import SearchInput from "./Input/SearchInput.svelte";
  import TextInput from "./Input/TextInput.svelte";
  import SegmentGroup from "./SegmentGroup.svelte";
  import Fader from "./Fader.svelte";
  import TextDisplay from "./TextDisplay.svelte";
  import Select from "./Input/Select.svelte";
  import { demoMidiFiles } from "../../core/store.js";

  let knobValue = 30;
</script>

<div class="m-2 flex flex-1 rounded border border-dark-200 bg-dark-900 p-4">
  <div class="h-full w-full">
    <div class="grid grid-cols-6 gap-4 text-sm">
      <div class="flex flex-row gap-3">
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <div class="rounded bg-dark-900 px-2 py-1">Dark 900</div>
            <div class="rounded bg-dark-800 px-2 py-1">Dark 800</div>
            <div class="rounded bg-dark-700 px-2 py-1">Dark 700</div>
            <div class="rounded bg-dark-600 px-2 py-1">Dark 600</div>
            <div class="rounded bg-dark-500 px-2 py-1">Dark 500</div>
            <div class="rounded bg-dark-400 px-2 py-1">Dark 400</div>
            <div class="rounded bg-dark-300 px-2 py-1">Dark 300</div>
            <div class="rounded bg-dark-200 px-2 py-1">Dark 200</div>
            <div class="rounded bg-dark-100 px-2 py-1">Dark 100</div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="rounded bg-light px-2 py-1 text-black-100">light</div>
            <div class="rounded bg-light-secondary px-2 py-1 text-black-100">light-secondary</div>
            <div class="rounded bg-light-soft px-2 py-1 text-black-100">light-soft</div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="rounded bg-black-300 px-2 py-1">black-300</div>
            <div class="rounded bg-black-200 px-2 py-1">black-200</div>
            <div class="rounded bg-black-100 px-2 py-1">black-100</div>
          </div>

          <div class="flex flex-col gap-1">
            <div class="rounded bg-accent-blue px-2 py-1">accent-blue</div>
            <div class="rounded bg-accent-purple px-2 py-1">accent-purple</div>
            <div class="rounded bg-accent-green px-2 py-1">accent-green</div>
            <div class="rounded bg-accent-pink px-2 py-1">accent-pink</div>
            <div class="rounded bg-accent-red px-2 py-1">accent-red</div>
            <div class="rounded bg-accent-yellow px-2 py-1">accent-yellow</div>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-900">Dark 900</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-800">Dark 800</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-700">Dark 700</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-600">Dark 600</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-500">Dark 500</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-400">Dark 400</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-300">Dark 300</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-200">Dark 200</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-dark-100">Dark 100</div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="rounded bg-dark-100 px-2 py-1 text-light">light</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-light-secondary">light-secondary</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-light-soft">light-soft</div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="rounded bg-dark-100 px-2 py-1 text-black-300">black-300</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-black-200">black-200</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-black-100">black-100</div>
          </div>

          <div class="flex flex-col gap-1">
            <div class="rounded bg-dark-100 px-2 py-1 text-accent-blue">accent-blue</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-accent-purple">accent-purple</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-accent-green">accent-green</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-accent-pink">accent-pink</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-accent-red">accent-red</div>
            <div class="rounded bg-dark-100 px-2 py-1 text-accent-yellow">accent-yellow</div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <TextDisplay text="Text Display" />

        <TextButton text="Click me" />
        <div>
          <TextButton text="Click me" />
        </div>
        <IconButton icon={Playlist} />

        <SegmentGroup>
          <IconButton icon={PlayPause} />
          <IconButton icon={Metronome} />
          <IconButton icon={Stop} />
          <TextButton text="Pattern" />
        </SegmentGroup>
      </div>

      <div class="flex flex-col gap-1">
        <SearchInput />
        <TextInput placeholder="Enter some text..." />
        <Select
          placeholder="Pick a file..."
          options={$demoMidiFiles.map((demo) => ({ label: demo.label, value: demo.file }))}
        />
      </div>

      <div class="flex flex-col gap-4">
        <div class="bg-dark-300 p-8">
          <Knob size={48} bind:value={knobValue} />
        </div>
        <div>
          <Fader />
        </div>
      </div>
    </div>
  </div>
</div>
