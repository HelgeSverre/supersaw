<script>
  import Encoder from "../../ui/Encoder.svelte";
  import LED from "../../ui/LED.svelte";
  import { onMount } from "svelte";
  import { HeadphonesIcon, PowerIcon } from "lucide-svelte";
  import classNames from "classnames";
  import { audioManager } from "../../../core/audio.js";
  import { Ticker } from "../../../core/misc/ticker.ts";

  let oscShape = 50;
  let oscSemitone = 0;
  let oscDetune = 50;
  let oscLevel = 50;

  let filterCutoff = 50;
  let filterResonance = 50;
  let filterType = "Low Pass";
  let filterEnvAmount = 50;

  let modAttack = 50;
  let modDecay = 50;
  let modSustain = 50;
  let modRelease = 50;
  let modShape1 = 50;
  let modSpeed1 = 50;
  let modShape2 = 50;
  let modSpeed2 = 50;
  let modDestination = "None";

  let effMix1 = 50;
  let effMix2 = 50;

  let arpMode = "Off";
  let arpClock = 50;

  const onColor = "#ff2024";
  const offColor = "#ccc";

  let ledUtilityNum = 0;
  let ledGlobalNum = 0;
  let ledModulationNum = 0;
  let ledShiftColor = offColor;

  let presets = [
    // Bank A - Pads and Leads
    { name: "Ambient Waves in a dreamscape", bank: "A", category: "Pad", key: "A002" },
    { name: "Deep Space", bank: "A", category: "Pad", key: "A003" },
    { name: "Soft Glow", bank: "A", category: "Pad", key: "A004" },
    { name: "Dreamy Pad", bank: "A", category: "Pad", key: "A005" },
    { name: "Warm Embrace", bank: "A", category: "Pad", key: "A006" },
    { name: "Ethereal Voices", bank: "A", category: "Pad", key: "A007" },
    { name: "Cinematic Atmos", bank: "A", category: "Pad", key: "A008" },
    { name: "Frozen Fields", bank: "A", category: "Pad", key: "A009" },
    { name: "Glacial Winds", bank: "A", category: "Pad", key: "A010" },
    { name: "Mystic Waters", bank: "A", category: "Pad", key: "A011" },
    { name: "Solar Flare", bank: "A", category: "Pad", key: "A012" },
    { name: "Heavenly Chords", bank: "A", category: "Pad", key: "A013" },
    { name: "Starry Night", bank: "A", category: "Pad", key: "A014" },
    { name: "Epic Lead", bank: "A", category: "Lead", key: "A015" },
    { name: "Bright Lead", bank: "A", category: "Lead", key: "A016" },
    { name: "Smooth Lead", bank: "A", category: "Lead", key: "A017" },
    { name: "Dynamic Lead", bank: "A", category: "Lead", key: "A018" },
    { name: "Sharp Lead", bank: "A", category: "Lead", key: "A019" },
    { name: "Power Lead", bank: "A", category: "Lead", key: "A020" },
    { name: "Vintage Lead", bank: "A", category: "Lead", key: "A021" },

    // Bank B - Plucks and Poly
    { name: "Gentle Pluck", bank: "B", category: "Pluck", key: "B001" },
    { name: "Bright Pluck", bank: "B", category: "Pluck", key: "B002" },
    { name: "Short Pluck", bank: "B", category: "Pluck", key: "B003" },
    { name: "Bell Pluck", bank: "B", category: "Pluck", key: "B004" },
    { name: "Soft Pluck", bank: "B", category: "Pluck", key: "B005" },
    { name: "Twang Pluck", bank: "B", category: "Pluck", key: "B006" },
    { name: "Chime Pluck", bank: "B", category: "Pluck", key: "B007" },
    { name: "Poly Synth 1", bank: "B", category: "Poly", key: "B008" },
    { name: "Poly Synth 2", bank: "B", category: "Poly", key: "B009" },
    { name: "Poly Synth 3", bank: "B", category: "Poly", key: "B010" },
    { name: "Poly Synth 4", bank: "B", category: "Poly", key: "B011" },
    { name: "Poly Synth 5", bank: "B", category: "Poly", key: "B012" },
    { name: "Poly Synth 6", bank: "B", category: "Poly", key: "B013" },
    { name: "Poly Synth 7", bank: "B", category: "Poly", key: "B014" },
    { name: "Poly Synth 8", bank: "B", category: "Poly", key: "B015" },
    { name: "Poly Synth 9", bank: "B", category: "Poly", key: "B016" },
    { name: "Poly Synth 10", bank: "B", category: "Poly", key: "B017" },
    { name: "Poly Synth 11", bank: "B", category: "Poly", key: "B018" },

    // Bank C - Mono and Basses
    { name: "Mono Synth 1- Bassinator", bank: "C", category: "Mono", key: "C001" },
    { name: "Mono Synth 2 - Wobbly", bank: "C", category: "Mono", key: "C002" },
    { name: "Mono Synth 3 - Digital", bank: "C", category: "Mono", key: "C003" },
    { name: "Mono Synth 10", bank: "C", category: "Mono", key: "C010" },
    { name: "Deep Bass", bank: "C", category: "Bass", key: "C011" },
    { name: "Sub Bass", bank: "C", category: "Bass", key: "C012" },
    { name: "Punchy Bass", bank: "C", category: "Bass", key: "C013" },
    { name: "Funky Bass", bank: "C", category: "Bass", key: "C014" },
    { name: "Smooth Bass", bank: "C", category: "Bass", key: "C015" },
    { name: "Acid Bass", bank: "C", category: "Bass", key: "C016" },
    { name: "Growl Bass", bank: "C", category: "Bass", key: "C017" },
    { name: "Dirty Bass", bank: "C", category: "Bass", key: "C018" },
    { name: "Classic Bass", bank: "C", category: "Bass", key: "C019" },
    { name: "Electro Bass", bank: "C", category: "Bass", key: "C020" },
    { name: "Pluck Bass", bank: "C", category: "Bass", key: "C021" },
    { name: "Saw Bass", bank: "C", category: "Bass", key: "C022" },
    { name: "Sine Bass", bank: "C", category: "Bass", key: "C023" },
    { name: "Square Bass", bank: "C", category: "Bass", key: "C024" },
    { name: "Triangle Bass", bank: "C", category: "Bass", key: "C025" },

    // Bank D - Strings and Brass
    { name: "Orchestral Strings", bank: "D", category: "String", key: "D001" },
    { name: "Warm Strings", bank: "D", category: "String", key: "D002" },
    { name: "Chamber Strings", bank: "D", category: "String", key: "D003" },
    { name: "Epic Strings", bank: "D", category: "String", key: "D004" },
    { name: "String Ensemble", bank: "D", category: "String", key: "D005" },
    { name: "Airwave - Rank 1", bank: "D", category: "String", key: "D006" },

    // Bank E - Percussion
    { name: "Classic Drum Kit", bank: "E", category: "Perc", key: "E001" },
    { name: "Electronic Drums", bank: "E", category: "Perc", key: "E002" },
    { name: "Acoustic Drum Kit", bank: "E", category: "Perc", key: "E003" },
    { name: "Rock Drum Kit", bank: "E", category: "Perc", key: "E004" },
    { name: "Trap Drum Kit", bank: "E", category: "Perc", key: "E005" },
    { name: "House Drum Kit", bank: "E", category: "Perc", key: "E006" },
    { name: "EDM Drum Kit", bank: "E", category: "Perc", key: "E007" },
    { name: "Cymbals", bank: "E", category: "Perc", key: "E008" },
    { name: "Hi-Hats", bank: "E", category: "Perc", key: "E009" },
    { name: "Snares", bank: "E", category: "Perc", key: "E010" },
    { name: "Kicks", bank: "E", category: "Perc", key: "E011" },
    { name: "Toms", bank: "E", category: "Perc", key: "E012" },

    // Bank F - FX
    { name: "FX Sweep", bank: "F", category: "FX", key: "F001" },
    { name: "Riser", bank: "F", category: "FX", key: "F002" },
    { name: "Impact", bank: "F", category: "FX", key: "F003" },
    { name: "Reverse Cymbal", bank: "F", category: "FX", key: "F004" },
    { name: "Noise Burst", bank: "F", category: "FX", key: "F005" },
    { name: "Wind Chimes", bank: "F", category: "FX", key: "F006" },
    { name: "Thunderstorm", bank: "F", category: "FX", key: "F007" },
    { name: "Rainfall", bank: "F", category: "FX", key: "F008" },
  ];

  let presetIndex = 0;
  let bankIndex = 0;
  $: availableBanks = Array.from(new Set(presets.map((preset) => preset.bank)));
  $: presetsInBank = presets.filter((preset) => preset.bank === availableBanks[Math.floor(bankIndex)]);
  $: selectedPreset = presetsInBank[Math.floor(presetIndex)];
  $: resetPresetIndex = () => {
    presetIndex = 0;
  };

  let ledMidi = offColor;

  function toggleLed(led) {
    return led === offColor ? onColor : offColor;
  }

  function playTickSound() {
    if (!audioManager.audioContext) return;

    let ticker = new Ticker(audioManager.audioContext, audioManager.mixer);
    ticker.play();
  }

  function randomlyBlink() {
    ledMidi = ledMidi === offColor ? onColor : offColor;
    setTimeout(() => randomlyBlink(), Math.floor(Math.random() * 100) + 100);
  }

  let powerOn = false;

  let metronome = null;

  onMount(() => {
    // randomlyBlink();
    // metronome = new Metronome(audioManager.audioContext);
  });

  // $: if (audioContext && $presetIndex) {
  //   if (powerOn) {
  //     playTickSound();
  //   }
  // }
</script>

<aside class="mx-auto flex max-w-6xl flex-col bg-white">
  <div class="p-12">
    <div
      class:power-on={powerOn}
      class:power-off={!powerOn}
      class="blofeld rounded-xl border-2 border-gray-300 bg-gradient-to-b from-[#E9EAEC] to-[#E9EAEC] shadow-xl"
    >
      <div class="z-10 flex flex-row items-start justify-evenly">
        <button class="relative p-1" on:click={() => (powerOn = !powerOn)}>
          <div class="absolute -left-3 -top-2 z-0 h-1.5 w-14 bg-black">
            <div
              class={classNames({
                "absolute -top-2 left-1/2 h-3 w-8 origin-center -translate-x-1/2 bg-black  transition duration-100": true,
                "translate-y-[1px] -rotate-1": powerOn,
                "-translate-y-[1px] rotate-[10deg]": !powerOn,
              })}
            ></div>
          </div>
          <PowerIcon size="16" class="text-black hover:text-black/80" />
        </button>
        <div class="port">DC 12V</div>
        <div class="port">MIDI In</div>
        <div class="port">USB</div>
        <div class="port">
          <span>Left / Stereo</span>
          <span class="fill">OUT</span>
          <span>Right </span>
        </div>
        <div class="port">
          <HeadphonesIcon size="14" class="mx-1.5 text-black" />
        </div>
      </div>
      <div class="flex flex-col gap-6 px-6 pb-12 pt-6 lg:flex-row">
        <!-- Left side -->
        <div class="lg:w-5/12">
          <!-- Display Area -->
          <div class="flex flex-row justify-between gap-6 rounded bg-[#4E5E65] p-3">
            <div class="flex flex-col items-center justify-between gap-3 px-3">
              <div class="inline-flex flex-row items-center justify-center gap-1">
                <LED color={ledMidi} />
                <span class="text-xs font-semibold">MIDI</span>
              </div>

              <Encoder size="48" min={0} step={1} max={presetsInBank.length - 1} bind:value={presetIndex} />

              <div class="inline-flex w-[48px] flex-col items-center justify-center gap-1 text-center">
                <button
                  on:click={() => {
                    playTickSound();
                    toggleLed(ledMidi);
                  }}
                  class="tiny-button"
                ></button>
                <span class="block text-xs font-semibold leading-none">Play</span>
              </div>
            </div>

            <!-- LCD  -->
            <div class="lcd-screen *:leading-2 grid w-64 grid-cols-2 gap-x-3 gap-y-1 p-2">
              <div class="col-span-full">
                <div class="block w-full border-b-2 border-black">Play Sound</div>
              </div>
              <div class="col-span-1">
                <span>{selectedPreset.key}</span>
              </div>
              <div class="col-span-1">
                <span class="truncate">Category: {selectedPreset.category}</span>
              </div>
              <div class="col-span-2 h-14">
                <span class="line line-clamp-2 block text-lg font-bold">
                  {selectedPreset.name}
                </span>
              </div>

              <div class="col-span-1">
                <span class="filled">Bank</span>
              </div>
              <div class="col-span-1">
                <span class="filled">Cat. Filter</span>
              </div>
              <div class="col-span-1">
                <span class="block text-center">{selectedPreset.bank}</span>
              </div>
              <div class="col-span-1">
                <span class="block text-center">off</span>
              </div>
            </div>
          </div>

          <div class="flex flex-row justify-between">
            <div class="flex flex-col justify-end">
              <div class="flex flex-col gap-1 pb-6">
                <Encoder size="48" />
                <div class="text-label">System Volume</div>
              </div>
            </div>

            <div class="flex w-auto flex-col justify-end">
              <div
                class="flex flex-row justify-evenly gap-3 rounded rounded-t-none border-2 border-t-0 border-[#4E5E65] px-3 py-4"
              >
                <div>
                  <Encoder
                    size="48"
                    min={0}
                    max={availableBanks.length - 1}
                    bind:value={bankIndex}
                    on:input={resetPresetIndex}
                  />
                </div>
                <div>
                  <Encoder size="48" />
                </div>
              </div>
              <!-- Logo -->
              <div class="logo mt-2">
                <h1>blofeld</h1>
                <h2>SYNTHESIZER</h2>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-1 flex-col justify-between">
          <div class="flex flex-col">
            <section class="flex flex-col items-center">
              <div class="knob-label">
                <div class="line"></div>
                <span class="label">Oscillators</span>
              </div>
              <div class="knob-label-section flex w-full flex-row items-center">
                <div class="flex w-16 shrink-0 flex-row items-end gap-1">
                  <div class="relative mt-3 inline-flex w-full flex-col gap-1">
                    <button
                      on:click={() => {
                        ledUtilityNum++;
                        if (ledUtilityNum > 2) {
                          ledUtilityNum = 0;
                        }
                      }}
                      class="tiny-button"
                    ></button>
                    <span class="-mb-2 mt-2 text-left text-xs font-semibold leading-none text-gray-400">Utility</span>
                  </div>
                </div>
                <div class="flex w-[60px] shrink-0 grow-0 flex-col gap-1">
                  <div class="flex flex-row items-center gap-1">
                    <LED color={powerOn && ledUtilityNum === 0 ? onColor : offColor} />
                    <span class="text-label">1</span>
                  </div>
                  <div class="flex flex-row items-center gap-1">
                    <LED color={powerOn && ledUtilityNum === 1 ? onColor : offColor} />
                    <span class="text-label">2</span>
                  </div>
                  <div class="flex flex-row items-center gap-1">
                    <LED color={powerOn && ledUtilityNum === 2 ? onColor : offColor} />
                    <span class="text-label">3</span>
                  </div>
                </div>
                <div class="divider-accent flex h-6 flex-1 flex-row justify-between divide-x">
                  <div class="flex w-full items-center justify-center">
                    <span class="text-label block w-full text-center text-base">Shape</span>
                  </div>
                  <div class="flex w-full items-center justify-center">
                    <span class="text-label block w-full text-center text-base">Semitone</span>
                  </div>
                  <div class="flex w-full items-center justify-center">
                    <span class="text-label block w-full text-center text-base">Detune</span>
                  </div>
                  <div class="flex w-full items-center justify-center">
                    <span class="text-label block w-full text-center text-base">Level</span>
                  </div>
                </div>
              </div>
            </section>
            <section class="flex flex-col items-center">
              <div class="knob-label">
                <div class="line"></div>
                <span class="label">Filters</span>
              </div>

              <div class="knob-label-section flex w-full flex-row items-center">
                <div class="flex w-16 shrink-0 flex-row items-end gap-1">
                  <div class="relative mt-3 inline-flex w-full flex-col gap-1">
                    <button
                      on:click={() => {
                        ledGlobalNum++;
                        if (ledGlobalNum > 1) {
                          ledGlobalNum = 0;
                        }
                      }}
                      class="tiny-button"
                    ></button>
                    <span class="-mb-2 mt-2 text-left text-xs font-semibold leading-none text-gray-400">Global</span>
                  </div>
                </div>
                <div class="flex w-[60px] shrink-0 grow-0 flex-col gap-1">
                  <div class="flex flex-row items-center gap-1">
                    <LED color={powerOn && ledGlobalNum === 0 ? onColor : offColor} />
                    <span class="text-label">1</span>
                  </div>
                  <div class="flex flex-row items-center gap-1">
                    <LED color={powerOn && ledGlobalNum === 1 ? onColor : offColor} />
                    <span class="text-label">2</span>
                  </div>
                </div>
                <div class="divider-accent flex h-6 flex-1 flex-row justify-between divide-x">
                  <div class="flex w-full items-center justify-center">
                    <span class="text-label block w-full text-center text-base">Cutoff</span>
                  </div>
                  <div class="flex w-full items-center justify-center">
                    <span class="text-label block w-full text-center text-base">Resconance</span>
                  </div>
                  <div class="flex w-full items-center justify-center">
                    <span class="text-label block w-full text-center text-base">Type</span>
                  </div>
                  <div class="flex w-full items-center justify-center">
                    <span class="text-label block w-full text-center text-base">Env Amount</span>
                  </div>
                </div>
              </div>
            </section>
            <section class="flex flex-col items-center">
              <div class="knob-label">
                <div class="line"></div>
                <span class="label">Modulation</span>
              </div>

              <div class="knob-label-section flex w-full flex-row items-center">
                <div class="flex w-16 shrink-0 flex-row items-end gap-1">
                  <div class="relative mt-3 inline-flex w-full flex-col gap-1">
                    <button
                      on:click={() => {
                        ledModulationNum++;
                        if (ledModulationNum > 3) {
                          ledModulationNum = 0;
                        }
                      }}
                      class="tiny-button"
                    ></button>
                    <span class="-mb-2 mt-2 text-left text-xs font-semibold leading-none text-gray-400">
                      Sound <br />/ Multi
                    </span>
                  </div>
                </div>

                <div class="divider-accent w-full divide-y">
                  <div class="flex h-6 flex-1 flex-row items-end justify-between">
                    <div class="flex w-[60px] shrink-0 grow-0 flex-col gap-1">
                      <div class="flex flex-row items-center gap-1">
                        <LED color={powerOn && ledModulationNum === 0 ? onColor : offColor} />
                        <span class="text-label">Filter Env</span>
                      </div>
                      <div class="flex flex-row items-center gap-1">
                        <LED color={powerOn && ledModulationNum === 1 ? onColor : offColor} />
                        <span class="text-label">Amp Env</span>
                      </div>
                    </div>
                    <div class="flex w-full items-center justify-center">
                      <span class="text-label block w-full text-center text-base">Attack</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Decay</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Sustain</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Release</span>
                    </div>
                  </div>
                  <div class="flex h-6 flex-1 flex-row items-center justify-between">
                    <div class="flex w-[60px] shrink-0 grow-0 flex-col gap-1">
                      <div class="flex flex-row items-center gap-1">
                        <LED color={powerOn && ledModulationNum === 2 ? onColor : offColor} />
                        <span class="text-label">LFO</span>
                      </div>
                    </div>
                    <div class="flex w-full items-center justify-center">
                      <span class="text-label block w-full text-center text-base">Shape 1</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Speed 1</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Shape 2</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Speed 2</span>
                    </div>
                  </div>
                  <div class="flex h-6 flex-1 flex-row justify-between">
                    <div class="flex w-[60px] shrink-0 grow-0 flex-col gap-1">
                      <div class="flex flex-row items-center gap-1">
                        <LED color={powerOn && ledModulationNum === 3 ? onColor : offColor} />
                        <span class="text-label">Matrix</span>
                      </div>
                    </div>
                    <div class="flex w-full items-center justify-center">
                      <span class="text-label block w-full text-center text-base">Select</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Source</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Amount</span>
                    </div>
                    <div class="flex w-full items-center justify-center border-l">
                      <span class="text-label block w-full text-center text-base">Destination</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="flex flex-col">
              <div class="flex flex-row items-center justify-between">
                <div class="knob-label">
                  <div class="line"></div>
                  <span class="label">Effects</span>
                </div>
                <div class="knob-label">
                  <div class="line"></div>
                  <span class="label">Arpeggiator</span>
                </div>
              </div>
              <div class="knob-label-section flex w-full flex-row items-start">
                <div class="flex flex-row items-start">
                  <div class="flex w-16 shrink-0 flex-row">
                    <div class="relative inline-flex flex-col">
                      <button on:click={() => (ledShiftColor = toggleLed(ledShiftColor))} class="tiny-button"></button>
                      <span class="pill absolute -left-6 top-6 mt-2 text-left text-xs font-semibold leading-none"
                        >Shift</span
                      >
                    </div>
                  </div>
                  <div class="flex w-[60px] shrink-0 grow-0 flex-col">
                    <LED color={powerOn ? ledShiftColor : offColor} />
                  </div>
                </div>
                <div class="divider-accent flex flex-1 flex-row items-start justify-between divide-x">
                  <div class="flex w-full flex-col items-center justify-center gap-1">
                    <span class="text-label block w-full text-center text-base">Mix 1</span>
                    <Encoder size="48" />
                  </div>
                  <div class="flex w-full flex-col items-center justify-center gap-1">
                    <span class="text-label block w-full text-center text-base">Mix 2</span>
                    <Encoder size="48" />
                  </div>
                  <div class="flex w-full flex-col items-center justify-center gap-1">
                    <span class="text-label block w-full text-center text-base">Mode</span>
                    <Encoder size="48" />
                  </div>
                  <div class="flex w-full flex-col items-center justify-center gap-1">
                    <span class="text-label block w-full text-center text-base">Clock</span>
                    <Encoder size="48" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div class="ml-6 mt-3 w-full text-center">
            <img src="/public/assets/waldorf.svg" alt="Waldorf Music" class="inline-block h-10" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-6 w-full">
    <img src="/assets/waldorf-blofeld.jpg" alt="Blofeld" class="h-full w-full" />
  </div>
</aside>

<style>
  .light-switch {
    position: relative;
    width: 60px;
    height: 30px;
  }

  .switch-input:checked + .switch-label .switch-handle {
    transform: translateX(30px);
  }

  :root {
    --blofeld-lcd-bg: #c7e0e0;
    --blofeld-lcd-fg: #0e1737;

    --blofeld-background: #e9eaec;
    --blofeld-dark: #14161d;
    --blofeld-text: #707070;

    --blofeld-accent: #b4c6c3;
    --blofeld-accent-strong: #65747c;
  }

  .blofeld {
    font-family: "Pathway Extreme", "Helvetica Neue", "Helvetica", sans-serif;
  }

  .tiny-button {
    @apply block h-5 w-10 rounded-[150%] bg-black;
    background: radial-gradient(ellipse, #1e1e1e 0%, black 100%);
  }

  .logo {
    color: var(--blofeld-accent-strong);
    text-align: right;
  }

  .knob-label {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .knob-label .line {
    top: 50%;
    left: 35px;
    right: 0;
    position: absolute;
    content: "";
    display: block;
    background-color: var(--blofeld-accent);
    height: 2px;
  }

  .knob-label .label {
    left: 10%;
    position: relative;
    line-height: 1em;
    display: inline-block;
    padding: 4px 12px;
    width: 100px;
    background-color: var(--blofeld-accent);
    color: var(--blofeld-accent-strong);
    text-align: center;
    border-radius: 4px;
    font-weight: bold;
    font-size: 12px;
  }

  .pill {
    padding: 4px 8px;
    background-color: var(--blofeld-accent);
    color: var(--blofeld-accent-strong);
    border-radius: 4px;
    display: inline-block;
  }

  .divider-accent * {
    border-color: var(--blofeld-accent);
  }

  .knob-label-section {
    border-radius: 6px;
    padding: 6px;
  }

  .logo h1 {
    line-height: 0.9em;
    font-size: 72px;
    font-weight: 800;
    letter-spacing: -1px;
  }

  .logo h2 {
    line-height: 0.9em;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .port .fill {
    background: var(--blofeld-accent-strong);
    color: var(--blofeld-background);
    border-radius: 4px;
    display: inline-block;
    padding: 0px 5px;
    font-weight: bold;
    line-height: 1rem;
    margin: -4px 10px 1px;
  }

  .port {
    height: 20px;
    display: inline-flex;
    align-items: start;
    color: var(--blofeld-accent-strong);
    font-size: 10px;
    margin: 4px 10px 0 10px;
    padding-left: 6px;
    padding-right: 6px;
    padding-bottom: 2px;
    font-weight: 600;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    border-bottom: 1.5px solid var(--blofeld-accent-strong);
    border-left: 1.5px solid var(--blofeld-accent-strong);
    border-right: 1.5px solid var(--blofeld-accent-strong);
  }

  .text-label {
    color: var(--blofeld-text);
    font-size: 10px;
    white-space: nowrap;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .lcd-screen::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="2.5" height="2.5"><rect width="1" height="1" fill="0e1737" opacity="1"/></svg>');
    background-color: rgba(44, 57, 44, 0.5);
    opacity: 0.5;
    pointer-events: none;
  }

  .lcd-screen {
    @apply rounded;
    border: 0.5px solid var(--blofeld-accent);
    overflow: hidden;
    position: relative;
    background-color: var(--blofeld-lcd-bg);
    color: var(--blofeld-lcd-fg);
    opacity: 0.9;
    box-shadow: inset 1px 2px 5px 1px var(--blofeld-accent-strong);
    font-family: monospace;
    font-weight: bold;
    line-height: 1rem;
  }

  .power-on .lcd-screen {
    transition: all 500ms;
    filter: brightness(1.5) saturate(1.8) contrast(1.2);
    box-shadow:
      inset 1px 2px 5px 1px var(--blofeld-accent-strong),
      1px 0 8px 1px rgba(199, 214, 224, 0.2);
  }

  .power-on .lcd-screen:after {
    content: "";
    display: block;
    position: absolute;
    inset: 0;
    background-color: #78ebff;
    opacity: 0.3;
    filter: blur(25px) brightness(1.5) saturate(1.1);
  }

  .power-off .lcd-screen {
    transition: all 500ms;
    box-shadow: 1px 0 8px 1px rgba(0, 0, 0, 0);
    filter: brightness(0) saturate(0.1) contrast(0.5);
  }

  .lcd-screen * {
    text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.3);
  }

  .lcd-screen .filled {
    color: var(--blofeld-lcd-bg);
    background-color: var(--blofeld-lcd-fg);
    opacity: 0.9;
    text-align: center;
    padding: 2px;
    display: block;
  }
</style>
