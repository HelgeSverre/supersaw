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
  import ADSR from "./ADSR.svelte";
  import { demoMidiFiles } from "../../core/misc/midiDemos.ts";
  import Fader2 from "./Fader2.svelte";
  import Encoder from "./Encoder.svelte";
  import EQ from "../daw/EQ.svelte";

  let knobValue = 30;
  let knobValue2 = 0;
</script>

<div class="flex flex-1">
  <div class="h-full w-full">
    <div class="grid grid-cols-2 gap-x-8 gap-y-4 p-2 text-sm lg:grid-cols-4">
      <div class="flex flex-col gap-2">
        <h2 class="mb-4 px-2 py-1 text-xs font-light uppercase tracking-wide text-yellow-300">Colors</h2>

        <div class="flex flex-row gap-2">
          <div class="flex flex-1 flex-col gap-2">
            <div class="flex flex-col gap-2">
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
            <div class="flex flex-col gap-2">
              <div class="rounded bg-light px-2 py-1 text-black">light</div>
              <div class="rounded bg-light-soft px-2 py-1 text-black">light-soft</div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="rounded bg-accent-blue px-2 py-1 font-semibold text-black">blue</div>
              <div class="rounded bg-accent-purple px-2 py-1 font-semibold text-black">purple</div>
              <div class="rounded bg-accent-green px-2 py-1 font-semibold text-black">green</div>
              <div class="rounded bg-accent-pink px-2 py-1 font-semibold text-black">pink</div>
              <div class="rounded bg-accent-red px-2 py-1 font-semibold text-black">red</div>
              <div class="rounded bg-accent-yellow px-2 py-1 font-semibold text-black">yellow</div>
            </div>
          </div>
          <div class="flex flex-1 flex-col gap-2">
            <div class="flex flex-col gap-2">
              <div class="rounded bg-black px-2 py-1 text-dark-900">Dark 900</div>
              <div class="rounded bg-black px-2 py-1 text-dark-800">Dark 800</div>
              <div class="rounded bg-black px-2 py-1 text-dark-700">Dark 700</div>
              <div class="rounded bg-black px-2 py-1 text-dark-600">Dark 600</div>
              <div class="rounded bg-black px-2 py-1 text-dark-500">Dark 500</div>
              <div class="rounded bg-black px-2 py-1 text-dark-400">Dark 400</div>
              <div class="rounded bg-black px-2 py-1 text-dark-300">Dark 300</div>
              <div class="rounded bg-black px-2 py-1 text-dark-200">Dark 200</div>
              <div class="rounded bg-black px-2 py-1 text-dark-100">Dark 100</div>
            </div>
            <div class="flex flex-col gap-2">
              <div class="rounded bg-dark-100 px-2 py-1 text-light">light</div>
              <div class="rounded bg-dark-100 px-2 py-1 text-light-soft">light-soft</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div>
          <h2 class="mb-4 px-2 py-1 text-xs font-light uppercase tracking-wide text-yellow-300">Buttons and display</h2>
        </div>

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

        <div>
          <EQ />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div>
          <h2 class="mb-4 px-2 py-1 text-xs font-light uppercase tracking-wide text-yellow-300">Inputs</h2>
        </div>

        <SearchInput />
        <TextInput placeholder="Enter some text..." />
        <Select
          placeholder="Pick a file..."
          options={$demoMidiFiles.map((demo) => ({ label: demo.label, value: demo.file }))}
        />
      </div>

      <div class="flex flex-col gap-2">
        <div>
          <h2 class="mb-4 px-2 py-1 text-xs font-light uppercase tracking-wide text-yellow-300">UI Components</h2>
        </div>

        <div class="bg-dark-300 p-2">
          <Encoder size={48} bind:value={knobValue} min={0} max={100} step={1} />
          <Encoder size={48} bind:value={knobValue2} min={-1} max={1} step={0.1} />
        </div>
        <div class="bg-dark-300 p-2">
          <Knob size={48} bind:value={knobValue} min={0} max={100} step={1} />
          <Knob size={48} bind:value={knobValue2} min={-1} max={1} step={0.1} />
        </div>
        <div class="flex flex-row gap-2 bg-dark-300 p-2">
          <Fader />
          <Fader2 />
        </div>

        <div>
          <ADSR attack={0.05} decay={0.1} sustain={0.7} release={0.3} />
        </div>
      </div>
    </div>
  </div>
</div>
