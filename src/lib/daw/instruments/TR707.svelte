<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../../core/audio.js";

  const defaultSamples = [
    "/samples/roland-tr-909/BT0A0D0.WAV", // Bass drum
    "/samples/roland-tr-909/ST0T0S0.WAV", // Snare drum
    "/samples/roland-tr-909/LT0D0.WAV", // Low tom
    "/samples/roland-tr-909/MT0D0.WAV", // Mid tom
    "/samples/roland-tr-909/HT0D0.WAV", // High tom
    "/samples/roland-tr-909/CLOP1.WAV", // Cowbell
    "/samples/roland-tr-909/HANDCLP1.WAV", // Handclap
    "/samples/roland-tr-909/HHCD0.WAV", // Closed hi-hat
    "/samples/roland-tr-909/HHOD0.WAV", // Open hi-hat
    "/samples/roland-tr-909/CSHD0.WAV", // Crash cymbal
    "/samples/roland-tr-909/RIDED0.WAV", // Ride cymbal
    "/samples/roland-tr-909/RIM63.WAV", // Rim shot
  ];

  let tracks = defaultSamples.map((sample) => ({
    volume: 0.5,
    pan: 0,
    pitch: 1,
    sample,
    buffer: null,
  }));

  onMount(() => {
    // Load default samples
    defaultSamples.forEach((sample, index) => {
      fetch(sample)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audioManager.audioContext.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
          tracks[index].buffer = audioBuffer;
          tracks = tracks;
        });
    });
  });

  function loadSample(index, event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const audioBuffer = await audioManager.audioContext.decodeAudioData(arrayBuffer);
        tracks[index].buffer = audioBuffer;
        tracks[index].sample = file.name;
        tracks = tracks;
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function triggerSample(index) {
    const track = tracks[index];
    if (track.buffer && audioManager.audioContext) {
      const source = audioManager.audioContext.createBufferSource();
      const gainNode = audioManager.audioContext.createGain();
      const panNode = audioManager.audioContext.createStereoPanner();

      source.buffer = track.buffer;
      source.playbackRate.value = track.pitch;
      gainNode.gain.value = track.volume;
      panNode.pan.value = track.pan;

      source.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(audioManager.mixer);
      source.start(0);
    }
  }

  function updateTrackProperty(index, property, event) {
    tracks[index][property] = parseFloat(event.target.value);
    tracks = tracks;
  }
</script>

<div class="flex w-full max-w-7xl flex-col gap-6">
  <div class=" mx-auto w-full max-w-5xl rounded-lg bg-white p-4 shadow-lg">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="text-3xl font-bold tracking-wider text-orange-600">Roland</div>
      <div class="text-xl font-semibold text-gray-700">RHYTHM COMPOSER TR-707</div>
    </div>

    <!-- Main interface -->
    <div class="rounded-md bg-gray-100 p-4 shadow-inner">
      <!-- Top row -->
      <div class="mb-4 flex justify-between space-x-4">
        <!-- Left section: Cartridge slot -->
        <div class="h-32 w-1/4 rounded bg-gray-300"></div>

        <!-- Right section: Faders -->
        <div class="flex w-1/2 items-end space-x-1">
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">AC</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">BD</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">SD</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-4/6 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">LT</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-5/6 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">MT</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">HT</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">RM/COW</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">HCP/TAMB</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/6 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">HH</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/3 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">CY</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">OH</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-1/2 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">CRASH</div>
          </div>
          <div class="flex flex-1 flex-col items-center">
            <div class="relative h-24 w-4 rounded-full bg-gray-300">
              <div class="absolute bottom-0 left-0 right-0 h-3/4 rounded-full bg-gray-400"></div>
            </div>
            <div class="mt-1 text-[6px]">VOLUME</div>
          </div>
        </div>
      </div>

      <!-- Middle row -->
      <div class="mb-4 flex space-x-4">
        <!-- Left section: Control buttons -->
        <div class="grid w-1/4 grid-cols-4 gap-2">
          <button class="flex h-8 items-center justify-center rounded-sm bg-gray-400 text-[8px]">STOP/CONT</button>
          <button class="flex h-8 items-center justify-center rounded-sm bg-gray-400 text-[8px]">CLEAR</button>
          <button class="flex h-8 items-center justify-center rounded-sm bg-gray-400 text-[8px]">SCALE</button>
          <button class="flex h-8 items-center justify-center rounded-sm bg-gray-400 text-[8px]">STEP</button>
          <button class="flex h-8 items-center justify-center rounded-sm bg-gray-400 text-[8px]">LAST MEAS</button>
          <button class="flex h-8 items-center justify-center rounded-sm bg-gray-400 text-[8px]">INST SHUFFLE</button>
          <button class="flex h-8 items-center justify-center rounded-sm bg-gray-400 text-[8px]">TEMPO</button>
          <button class="flex h-8 items-center justify-center rounded-sm bg-gray-400 text-[8px]">TRACK</button>
        </div>

        <!-- Right section: Pattern and track buttons -->
        <div class="flex w-3/4 flex-col space-y-2">
          <div class="flex space-x-2">
            <button class="flex h-8 flex-1 items-center justify-center rounded-sm bg-gray-400 text-[8px]">A</button>
            <button class="flex h-8 flex-1 items-center justify-center rounded-sm bg-gray-400 text-[8px]">B</button>
            <button class="flex h-8 flex-1 items-center justify-center rounded-sm bg-gray-400 text-[8px]">C</button>
            <button class="flex h-8 flex-1 items-center justify-center rounded-sm bg-gray-400 text-[8px]">D</button>
            <button class="flex h-8 flex-1 items-center justify-center rounded-sm bg-orange-400 text-[8px]"
              >ENTER
            </button>
            <div class="flex-1">
              <div class="relative h-8 w-full rounded-full bg-gray-400">
                <div
                  class="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-gray-600"
                ></div>
              </div>
            </div>
          </div>
          <div class="flex space-x-1">
            <div class="h-6 flex-1 rounded-sm bg-gray-500"></div>
            <div class="h-6 flex-1 rounded-sm bg-gray-500"></div>
            <div class="h-6 flex-1 rounded-sm bg-gray-500"></div>
            <div class="h-6 flex-1 rounded-sm bg-gray-500"></div>
          </div>
        </div>
      </div>

      <div class="flex space-x-2">
        {#each tracks as track, index}
          <div class="flex flex-1 flex-col space-y-1">
            <button
              on:click={() => triggerSample(index)}
              class="h-16 rounded-sm bg-gray-400 duration-75 ease-out active:bg-gray-300"
            ></button>
            <div class="h-4 rounded-sm bg-orange-400 text-center text-[10px] font-bold text-black">
              {track.sample.split("/").pop().split(".")[0]}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
